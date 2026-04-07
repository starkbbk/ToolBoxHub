# 🛠️ ToolboxHub — Your Essential Digital Toolkit

![ToolboxHub Banner](banner.png)

**ToolboxHub** is a high-performance, modular web application designed to consolidate essential digital tools into a single, sleek "Liquid Glass" interface. From AI-powered video clipping to advanced PDF manipulation, ToolboxHub is built for speed, privacy, and aesthetic excellence.

---

## 🚀 Core Features

### 🎬 ClipMaster (AI Video Suite)
Extract viral-ready clips from any video using cutting-edge AI.
- **AI Transcription**: Automatic speech-to-text using `faster-whisper`.
- **Intelligent Analysis**: Automatic clip extraction based on viral potential (Qwen-2.5 72B).
- **Pro Dashboard**: Frame-accurate seeking, keyboard shortcuts, and filtering.
- **Modular Export**: Export to CSV, JSON, or SRT formats.

### 📄 PDF Converter (Professional Grade)
The only PDF tool you'll need for daily document workflows.
- **Convert to Image**: High-resolution page extraction (PNG).
- **Extract Text**: Full OCR/Text mining for data recovery.
- **Merge & Split**: Combine multiple documents or extract specific ranges.
- **Live Preview**: Real-time status tracking for large conversion jobs.

### 🕒 Coming Soon
- **🖼️ Image Compressor**: Lossless and lossy batch compression.
- **🎙️ Audio Transcriber**: Dedicated high-fidelity transcription for audio files.
- **🔍 SEO Analyzer**: Instant meta-data and performance auditing.

---

## 🛠️ Technology Stack

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS & Vanilla CSS (Liquid Glass Ecosystem)
- **Icons**: Lucide React
- **State**: Zustand
- **API**: Axios with modular services

### Backend
- **Engine**: FastAPI (Python 3.10+)
- **Database**: SQLite with SQLAlchemy ORM
- **Media Processing**: PyMuPDF, pypdf, faster-whisper, yt-dlp
- **AI Integration**: OpenRouter (Qwen-2.5 Model)

---

## ⚙️ Installation

### 1. Clone the Repository
```bash
git clone https://github.com/starkbbk/ToolBoxHub.git
cd ToolBoxHub
```

### 2. Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Mac/Linux
pip install -r requirements.txt
cp .env.example .env     # Add your OPENROUTER_API_KEY
python main.py
```

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

---

## 🧬 Project Structure

```text
ToolboxHub/
├── backend/
│   ├── tools/
│   │   ├── clipmaster/      # Video processing module
│   │   ├── pdf_converter/   # PDF manipulation module
│   │   └── compressor/      # (Coming Soon)
│   ├── main.py              # Single-entry router
│   └── database.py          # Shared state & persistence
└── frontend/
    ├── src/
    │   ├── app/             # Responsive pages
    │   ├── components/      # Glassmorphism UI components
    │   └── lib/             # Typed API & store
    └── tailwind.config.ts   # Design system tokens
```

---

## 🛡️ Privacy & Performance
- **Local First**: Files are processed in secure temporary directories.
- **Async Execution**: Heavy tasks (Video/PDF) run in the background with live UI updates.
- **Modular Code**: Every tool is isolated, allowing for infinite scalability.

---

## 📜 License
Internal Project - All Rights Reserved.

---
*Built with ❤️ for the modern digital workspace.*
