# Project To-Do List

### Setup & Infrastructure
- [ ] Initialize Git repository (`git init`).
- [ ] Create initial commit and push to a new GitHub remote.
- [ ] Initialize Tauri app with `create-tauri-app` (React, TypeScript).
- [ ] Install dependencies: `tailwindcss`, `framer-motion`, `lucide-react`, `zustand`.
- [ ] Configure `tauri.conf.json` to allow multiple windows (Main + Overlay) and required permissions (Audio).

### UI Architecture (Frontend)
- [ ] **Main Window Layout**:
  - [ ] Text Editor component (large text area for Bangla).
  - [ ] Toolbar (Start/Stop Dictation, Cleanup Button, Copy, Clear).
  - [ ] Status indicators (Provider status, Model status).
- [ ] **Mini-Screen Overlay (Mictab inspired)**:
  - [ ] Create a frameless, transparent window in Tauri.
  - [ ] Implement live Audio Waveform component using Web Audio API analyzer and Framer Motion or Canvas.
  - [ ] Add functional Stop/Cancel buttons inside the overlay.
- [ ] **Settings Pages**:
  - [ ] General Settings (Punctuation mode, Correction strength, Auto-copy).
  - [ ] Provider Setup (Ollama URL, API Keys for OpenAI/Gemini/OpenRouter).

### Core Functionality (Backend/Integration)
- [ ] **Audio Capture**:
  - [ ] Implement secure microphone access.
  - [ ] Stream audio data efficiently.
- [ ] **Speech-to-Text (STT)**:
  - [ ] Create base `SpeechProvider` interface.
  - [ ] Implement primary Cloud STT API call (e.g., OpenAI Whisper).
- [ ] **AI Correction**:
  - [ ] Create base `AIProvider` interface.
  - [ ] Implement `OllamaProvider` (connect to local port 11434).
  - [ ] Build App-managed model pull logic (detect if model exists, trigger download if not).
  - [ ] Implement Cloud AI fallback providers.
- [ ] **Secure Storage**:
  - [ ] Integrate `tauri-plugin-store`.
  - [ ] Save all API keys and settings securely.

### Refinement & Polish
- [ ] Ensure clean, modern aesthetics (padding, typography, smooth transitions).
- [ ] Add comprehensive error handling (e.g., "Ollama not running", "API key invalid").
- [ ] Write user documentation (`README.md`, `SETUP.md`, `MODEL_GUIDE.md`, `TROUBLESHOOTING.md`).
- [ ] Perform final cross-platform QA.