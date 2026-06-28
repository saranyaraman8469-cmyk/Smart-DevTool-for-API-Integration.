import os
import shutil
import logging
from typing import List
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import FAISS
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from app.config import settings

logger = logging.getLogger("vector_store")

class VectorStoreService:
    def __init__(self):
        self._embeddings = None
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=150,
            separators=["\n\n", "\n", " ", ""],
        )

    @property
    def embeddings(self):
        if self._embeddings is None:
            self._embeddings = self._init_embeddings()
        return self._embeddings

    def _init_embeddings(self):
        """
        Initializes embeddings provider based on settings config.
        - gemini: Uses Google Generative AI Embeddings (API-based, no RAM cost, for cloud).
        - local: Uses HuggingFace SentenceTransformers (requires sentence-transformers installed, for local dev).
        """
        if settings.EMBEDDING_PROVIDER == "gemini":
            logger.info("Initializing Google Gemini Embeddings (embedding-001)...")
            if not settings.GOOGLE_API_KEY:
                raise ValueError("GOOGLE_API_KEY must be set to use Gemini Embeddings.")
            return GoogleGenerativeAIEmbeddings(
                model="models/embedding-001",
                google_api_key=settings.GOOGLE_API_KEY
            )
        else:
            # Lazy import - only load sentence-transformers when running locally
            logger.info(f"Initializing Local Sentence-Transformers: {settings.EMBEDDING_MODEL_NAME}...")
            try:
                from langchain_huggingface import HuggingFaceEmbeddings
                return HuggingFaceEmbeddings(model_name=settings.EMBEDDING_MODEL_NAME)
            except ImportError:
                raise ImportError(
                    "sentence-transformers is not installed. "
                    "Set EMBEDDING_PROVIDER=gemini in your .env file for cloud deployments, "
                    "or install sentence-transformers for local use."
                )

    def _get_api_index_path(self, api_doc_id: int) -> str:
        return os.path.join(settings.FAISS_INDEX_PATH, f"api_doc_{api_doc_id}")

    def index_document(self, api_doc_id: int, text: str):
        """
        Splits text, generates vectors, and saves them to a local FAISS directory.
        """
        logger.info(f"Chunking documentation for API Doc ID {api_doc_id}...")
        chunks = self.text_splitter.split_text(text)
        logger.info(f"Generated {len(chunks)} chunks. Generating embeddings...")
        
        # Create metadata for each chunk to search contextually
        metadatas = [{"api_doc_id": api_doc_id, "chunk_index": i} for i in range(len(chunks))]
        
        # Create FAISS database
        db = FAISS.from_texts(texts=chunks, embedding=self.embeddings, metadatas=metadatas)
        
        # Save FAISS index locally
        index_path = self._get_api_index_path(api_doc_id)
        if os.path.exists(index_path):
            shutil.rmtree(index_path)
            
        db.save_local(index_path)
        logger.info(f"FAISS index successfully saved at {index_path}")

    def query_context(self, api_doc_id: int, query: str, top_k: int = 5) -> List[str]:
        """
        Loads the FAISS index for the specific document and runs similarity search.
        """
        index_path = self._get_api_index_path(api_doc_id)
        if not os.path.exists(index_path):
            logger.warning(f"Vector store index not found at {index_path}. Returning empty context.")
            return []
            
        # Load FAISS DB
        # allow_dangerous_deserialization is safe here since we control the index files locally on SQLite/Disk
        db = FAISS.load_local(index_path, self.embeddings, allow_dangerous_deserialization=True)
        
        # Query DB
        docs = db.similarity_search(query, k=top_k)
        return [doc.page_content for doc in docs]
