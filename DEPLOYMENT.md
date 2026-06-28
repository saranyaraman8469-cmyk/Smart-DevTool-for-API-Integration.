# Deployment Guide: Render (Backend) & Vercel (Frontend)

This guide walks you through deploying this project with the backend hosted on **Render** (using PostgreSQL) and the frontend hosted on **Vercel** (Next.js).

---

## 1. Deploy the Backend to Render

Render is ideal for hosting FastAPI backends. Because SQLite database files are wiped on redeployments in Render's free tier, we will use a free Render PostgreSQL database.

### Step 1: Create a PostgreSQL Database on Render
1. Log in to the [Render Dashboard](https://dashboard.render.com/).
2. Click **New +** and select **PostgreSQL**.
3. Fill in the details:
   - **Name:** `devtool-db`
   - **Region:** Choose the region closest to you (or default).
4. Click **Create Database**.
5. Once created, copy the **Internal Database URL** (if deploying both in a Render Blueprint) or the **External Database URL** (to paste as an env variable).

### Step 2: Deploy the FastAPI Service
1. Click **New +** on Render and select **Web Service**.
2. Connect your GitHub repository containing this project.
3. Configure the service:
   - **Name:** `smart-devtool-backend`
   - **Root Directory:** `backend`
   - **Runtime:** `Docker` (Render will automatically detect the `Dockerfile` inside the `backend` folder)
4. Click **Advanced** to add **Environment Variables**:
   - `DATABASE_URL`: *Paste the External Database URL of the PostgreSQL database you created in Step 1.*
   - `LLM_PROVIDER`: `gemini` (or `mock` if you wish to run free without key limits)
   - `GOOGLE_API_KEY`: *Your Gemini API Key*
5. Click **Create Web Service**.
6. Note down the deployed backend URL (e.g., `https://smart-devtool-backend.onrender.com`).

---

## 2. Deploy the Frontend to Vercel

Vercel is the native platform for Next.js and hosts frontends for free.

### Step 1: Import Project to Vercel
1. Log in to the [Vercel Dashboard](https://vercel.com/).
2. Click **Add New** > **Project**.
3. Import your GitHub repository.

### Step 2: Configure Settings
1. Set the **Root Directory** to `frontend`.
2. Under **Environment Variables**, add:
   - **Key:** `NEXT_PUBLIC_API_URL`
   - **Value:** *Your Render Backend URL* (e.g., `https://smart-devtool-backend.onrender.com` — make sure there is no trailing slash).
3. Click **Deploy**.

Vercel will build and host your Next.js frontend automatically!

---

## 3. Configure CORS on Backend (If Needed)
To ensure the Vercel frontend can safely communicate with the Render backend, make sure CORS is enabled in the backend to allow your Vercel URL. 

The FastAPI app in `backend/app/main.py` already configures CORS:
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins, including Vercel
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```
This means it will work out-of-the-box with any Vercel domain!
