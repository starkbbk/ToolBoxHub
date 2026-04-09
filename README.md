# 🛠️ ToolboxHub

**ToolboxHub** is a premium, all-in-one AI productivity suite designed to simplify complex multimedia tasks. From AI-powered video highlighting to professional-grade PDF and image processing, ToolboxHub brings the power of state-of-the-art AI directly to your browser.

---

## 🚀 Key Features

### 🎬 ClipMaster (AI Video Highlighter)
- **Automatic Transcription**: Convert video speech to text using cloud-based Whisper models.
- **Smart Highlighting**: Automatically detect key moments, funny bits, and highlights using Advanced AI.
- **Instant Rendering**: Process and preview clips instantly without local FFmpeg dependencies.

### 📄 Professional PDF Tools
- **PDF to High-Res Image**: Render PDF pages into professional 300 DPI PNG/JPG images.
- **Merge & Split**: Combine multiple PDFs or split them into individual pages with ease.
- **Compressed & Optimized**: Reduce PDF file sizes without losing quality.

### 🖼️ Intelligent Image Processing
- **AI Text Remover**: Remove unwanted text from images using advanced OCR (EasyOCR) and inpainting logic.
- **Batch Compression**: Optimize large batches of images for web performance.

### 🤖 AI Content Tools
- **Text Summarizer**: Get the essence of long documents in seconds.
- **Audio Transcriber**: Turn any audio file into accurate text transcripts.

### 💳 Premium Subscription System
- **Tiered Plans**: Choose between Pro, Business, and Claude Max versions.
- **Safe Payments**: Secured via Stripe.
- **Instant Sync**: Real-time payment verification and profile updates.

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: [Next.js 14](https://nextjs.org/) (App Router)
- **Styling**: Tailwind CSS & Framer Motion (for liquid-glass aesthetics)
- **State Management**: Zustand
- **Icons**: Lucide React

### Backend
- **Framework**: [FastAPI](https://fastapi.tiangolo.com/) (Python 3.10+)
- **AI/ML**: EasyOCR, Groq (Whisper API)
- **Database**: MongoDB (via Motor Async Driver)
- **Payments**: Stripe API

### Deployment & DevOps
- **Hosting**: Render (Backend) & Vercel (Frontend)
- **Logging**: Standardized Python Logging & Next.js Monitoring

---

## 🛠️ Installation & Setup

### Prerequisites
- Node.js 18+
- Python 3.10+
- MongoDB instance (Local or Atlas)
- Stripe API Keys

### Frontend Setup
```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

### Backend Setup
```bash
cd backend
# Create virtual environment
python -m venv venv
source venv/bin/activate # Windows: venv\Scripts\activate

# Install requirements
pip install -r requirements.txt

# Start server
uvicorn main:app --reload
```

---

## 📁 Project Structure

```text
.
├── backend/            # FastAPI Backend
│   ├── routers/        # API Endpoints (Auth, Subscription, Tools)
│   ├── models/         # Pydantic & MongoDB Schemas
│   ├── utils/          # Core abstractions (Auth, AI helpers)
│   └── main.py         # App Entry Point
├── src/                # Next.js Frontend
│   ├── app/            # App Router Pages (Tools, Profile, Pricing)
│   ├── components/     # Tool-specific React Components
│   ├── context/        # Global Auth & State Providers
│   └── lib/            # API Client & Shared Utilities
├── tailwind.config.ts  # Design System Tokens
└── render.yaml         # Blueprint for Deployment
```

---

## 📄 License
Custom Project by StarkBBK. All rights reserved.
