import logging
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app import crud, schemas
from app.database import get_db
from app.services.vector_store import VectorStoreService
from app.agents.base import BaseAgent

logger = logging.getLogger("chat_router")
router = APIRouter(prefix="/chat", tags=["Chat"])

vector_store = VectorStoreService()


class RAGChatAgent(BaseAgent):
    """
    Lightweight agent responsible for answering developer questions
    about a specific API using FAISS vector search for context retrieval.
    """
    def __init__(self):
        super().__init__()

    async def answer(self, question: str, context_chunks: List[str], chat_history: List[dict]) -> str:
        # Build formatted conversation history for the model
        history_text = ""
        for msg in chat_history[-8:]:  # Keep last 8 turns of context
            role = "User" if msg["role"] == "user" else "Assistant"
            history_text += f"{role}: {msg['content']}\n"

        # Assemble context
        context_text = "\n\n".join(context_chunks) if context_chunks else "No specific documentation context retrieved."

        system_prompt = (
            "You are an expert AI assistant deeply knowledgeable about API integrations and software development. "
            "You are helping a developer understand and work with a specific API. "
            "You have been given relevant excerpts from the official API documentation as your primary knowledge source. "
            "Use these excerpts to answer the developer's question as accurately and concisely as possible. "
            "If the documentation does not contain enough detail, clearly state that and provide your best general guidance. "
            "Format your answers in clear Markdown for developer readability."
        )

        user_prompt = (
            f"[API Documentation Context]\n"
            f"{context_text}\n\n"
            f"[Conversation History]\n"
            f"{history_text}\n"
            f"[Developer Question]\n"
            f"{question}"
        )

        return await self.call_llm(system_prompt, user_prompt)


@router.post("/{doc_id}", response_model=schemas.ChatResponse)
async def chat_with_documentation(
    doc_id: int,
    payload: schemas.ChatRequest,
    db: Session = Depends(get_db)
):
    """
    Accepts a developer's message, retrieves relevant doc chunks from FAISS,
    generates a contextual AI response, and persists the conversation.
    """
    # Validate the document exists and is processed
    doc = crud.get_api_document(db, doc_id)
    if not doc:
        raise HTTPException(status_code=404, detail="API Document not found.")
    if doc.status not in ("completed", "analyzing"):
        raise HTTPException(
            status_code=400,
            detail=f"API document is not yet ready for chat. Current status: '{doc.status}'. Please wait for analysis to complete."
        )

    # Retrieve existing chat history for context
    existing_messages = crud.get_chat_messages(db, doc_id, limit=20)
    history = [{"role": msg.role, "content": msg.content} for msg in existing_messages]

    # Retrieve semantically relevant documentation chunks from FAISS
    context_chunks = vector_store.query_context(doc_id, payload.message, top_k=5)

    # Generate AI answer using RAG agent
    rag_agent = RAGChatAgent()
    answer = await rag_agent.answer(
        question=payload.message,
        context_chunks=context_chunks,
        chat_history=history
    )

    # Persist both the user message and assistant reply in the database
    user_msg_schema = schemas.ChatMessageBase(role="user", content=payload.message)
    crud.create_chat_message(db, user_msg_schema, doc_id)

    assistant_msg_schema = schemas.ChatMessageBase(role="assistant", content=answer)
    crud.create_chat_message(db, assistant_msg_schema, doc_id)

    # Fetch all messages including the new ones to return full history
    updated_messages = crud.get_chat_messages(db, doc_id, limit=50)

    return schemas.ChatResponse(answer=answer, history=updated_messages)


@router.get("/{doc_id}/history", response_model=List[schemas.ChatMessageResponse])
def get_chat_history(doc_id: int, db: Session = Depends(get_db)):
    """Returns the full conversation history for a given API document."""
    doc = crud.get_api_document(db, doc_id)
    if not doc:
        raise HTTPException(status_code=404, detail="API Document not found.")
    return crud.get_chat_messages(db, doc_id, limit=100)


@router.delete("/{doc_id}/history", status_code=204)
def clear_chat_history(doc_id: int, db: Session = Depends(get_db)):
    """Clears the conversation history for a given API document."""
    doc = crud.get_api_document(db, doc_id)
    if not doc:
        raise HTTPException(status_code=404, detail="API Document not found.")
    # Delete all messages by querying and bulk deleting
    from app.models import ChatMessage
    db.query(ChatMessage).filter(ChatMessage.api_doc_id == doc_id).delete()
    db.commit()
