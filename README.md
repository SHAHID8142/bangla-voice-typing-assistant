# Bangla Voice Typing Assistant

A production-ready desktop application for high-accuracy Bangla voice typing with local-first AI correction.

## ✨ Features
- **Cloud STT**: High-accuracy Bangla speech recognition via OpenAI Whisper.
- **AI Cleanup**: Automatic punctuation, spelling, and grammar correction using local Ollama models.
- **Floating Overlay**: Mictab-inspired minimal recording interface with real-time waveform animations.
- **Privacy First**: AI correction runs locally on your machine by default.
- **Multi-Window**: Seamless transition between main editor and floating dictation overlay.

## 🚀 Getting Started

### Prerequisites
1. **Ollama**: Install [Ollama](https://ollama.com/) and pull a multilingual model:
   ```bash
   ollama run gemma2:2b
   ```
2. **Rust**: Install [Rust](https://www.rust-lang.org/tools/install).
3. **Node.js**: Install Node.js and npm.

### Installation
1. Clone the repository.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the app in development mode:
   ```bash
   npm run tauri dev
   ```

## 🛠️ Configuration
Open the **Settings** menu in the app to configure:
- **STT Provider**: OpenAI Whisper (requires API Key) or Mock (for testing).
- **AI Model**: Specify your local Ollama model name.
- **Correction Strength**: Minimal, Balanced, or Strong.
- **Punctuation Mode**: Off, Light, Standard, or Formal.

## 🏗️ Tech Stack
- **Frontend**: React, TypeScript, Tailwind CSS, Framer Motion.
- **Desktop Shell**: Tauri v2.
- **Backend**: Rust.
- **AI**: Ollama (Local), OpenAI (Cloud fallback).

## 📄 Privacy
- All dictation text sent to local Ollama stays on your machine.
- Cloud STT is optional and clearly indicated in the UI status.
- API keys are stored securely using Tauri's native storage.
