# Comprehensive Implementation Plan: Bangla Voice Typing Assistant

## 1. Executive Summary & Objective
Build a production-ready, highly-polished Windows and macOS desktop app for Bangla voice typing and AI text correction. 
**Key value proposition**: A fluid, modern dictation experience inspired by Mictab.com, featuring a clean primary editor and a floating "mini-screen" overlay with live waveform animations during dictation.
**Core Technology**: Tauri (desktop shell), React + TypeScript (frontend), Rust (backend logic). STT will use Cloud APIs by default for highest Bangla accuracy, while AI cleanup relies on local Ollama models (with cloud fallbacks) to ensure privacy and low latency.

## 2. Git & Version Control Strategy
- **Initialization**: Create a fresh Git repository (`git init`).
- **Commits**: Atomic, feature-based commits following conventional commit messages (e.g., `feat:`, `fix:`, `ui:`).
- **GitHub Integration**: Connect to a newly created remote GitHub repository and push the initial structure.
- **Documentation**: Maintain `todo.md` (actionable tasks) and `progress.md` (completed milestones) alongside standard READMEs.

## 3. UI/UX Design System (Inspired by Mictab.com)
The UI will be modern, clean, and focus on non-intrusive productivity.
- **Aesthetic**: Refined minimalism. Subtle gradients, high-contrast text, smooth transitions (using Framer Motion or CSS).
- **Main Window**: A distraction-free text editor. Clean typography (e.g., a modern sans-serif like Inter or a custom clean font), plenty of negative space.
- **Mini-Screen (Floating Overlay)**: 
  - When dictation starts, the main window can minimize or fade, and a **small, always-on-top mini window** appears.
  - **Visuals**: Features a live, animated audio waveform reacting to microphone input.
  - **Controls**: Includes clear, animated "Stop", "Pause", and "Cancel" buttons.
  - **Status**: Displays a brief "Listening..." or "Processing..." status.

## 4. Architecture & Technical Stack
### Frontend (React, TypeScript, TailwindCSS, Framer Motion)
- **Tauri Windows**: 
  - `MainWindow`: The primary text editor and settings interface.
  - `OverlayWindow`: A transparent, frameless Tauri window for the floating recording UI.
- **State Management**: Zustand or React Context for global settings (Providers, Models, UI state).

### Backend (Rust / Tauri APIs)
- **Audio Capture**: Rust-based microphone capture (cpal) or Tauri Web API (MediaRecorder) depending on performance.
- **Window Management**: Tauri APIs to spawn, position, and manage the floating overlay window.
- **Secure Storage**: `tauri-plugin-store` for encrypting and saving API keys.

### Core Pipelines
1. **Speech-to-Text (STT)**: 
   - Primary: Cloud-based (OpenAI Whisper API or Google STT) for reliable Bangla.
   - Interface: Pluggable architecture (`SpeechProvider`).
2. **AI Correction**: 
   - Primary: Local Ollama (auto-pulls `gemma4:e2b` or small multilingual models).
   - Fallbacks: OpenAI, Gemini, OpenRouter.
   - Action: Cleans Bangla text for punctuation, spelling, and grammar without altering meaning.

## 5. Detailed Implementation Phases

### Phase 1: Project Initialization & Git Setup
- Initialize Git repository and link to GitHub.
- Scaffold Tauri + React + TypeScript app.
- Install TailwindCSS and Framer Motion.
- Create `PLAN.md`, `todo.md`, `progress.md`, `README.md`, `SETUP.md`.
- Configure `tauri.conf.json` for multiple windows (main and frameless overlay).

### Phase 2: UI Foundation & Windows
- **Main App Shell**: Build the main dictation layout, text area, and side controls.
- **Floating Overlay**: Build the frameless, transparent `OverlayWindow` with placeholder waveform animation and control buttons.
- **Routing/Views**: Set up Settings Page and Help/Troubleshooting views.

### Phase 3: Audio & Waveform Animation
- Implement microphone permission handling.
- Capture raw audio data.
- Connect audio stream to a visualizer component in the `OverlayWindow` to create the **live wave animation**.
- Implement "Push-to-talk" and "Toggle" recording modes.

### Phase 4: Speech-to-Text Integration
- Implement the `CloudSpeechProvider`.
- Route captured audio chunks to the STT API.
- Receive raw Bangla text and display it in the main editor.

### Phase 5: Local AI Cleanup (Ollama)
- Integrate Ollama API (`http://localhost:11434`).
- Implement the **App-managed Model Pull**: automatically detect and download the preferred Bangla model.
- Apply the specific system prompt for Bangla correction.
- Implement Correction Modes (Minimal, Balanced, Strong) and Punctuation Modes.

### Phase 6: Cloud AI Fallbacks & Polish
- Implement `OpenAIProvider`, `GeminiProvider`, `OpenRouterProvider`.
- Integrate `tauri-plugin-store` for secure API key storage.
- Add Auto-copy and Auto-cleanup post-dictation options.
- Refine animations, error states, and loading indicators.

### Phase 7: QA & Deployment
- Comprehensive testing on macOS and Windows.
- Verify floating window behavior, API failure fallbacks, and local model performance.
- Final commit and push to GitHub.

## 6. Required Documents to Generate Now
- `todo.md`: A granular checklist of the phases above.
- `progress.md`: A log of completed steps.
