# Bangla Voice Typing Assistant - Complete Specification

## 1. Overview

**Project Name**: Bangla Voice Typing Assistant
**Type**: Cross-platform Desktop Application (macOS, Windows)
**Core Functionality**: A voice typing application that converts Bangla speech to text with AI-powered correction for punctuation, spelling, and grammar.
**Target Users**: Bengali speakers who want hands-free text input with high-quality Bangla text output.

---

## 2. Core Features

### 2.1 Voice Recording
- **Push-to-talk mode**: Hold shortcut key to record, release to stop
- **Toggle mode**: Press shortcut to start recording, press again to stop
- **Background operation**: App runs in system tray, recording works when minimized
- **Visual feedback**: Animated waveform in overlay window during recording

### 2.2 Speech-to-Text (STT)
- **Default provider**: OpenAI Whisper API (requires API key)
- **Fallback provider**: Mock STT for development/testing
- **Audio capture**: Uses browser MediaRecorder API via React

### 2.3 AI Text Correction
- **Primary**: Local Ollama (runs gemma4:e2b model locally)
- **Fallback chain**: OllamaCloud → OpenAI → Gemini → OpenRouter
- **Correction modes**:
  - Minimal: Light corrections only
  - Balanced: Standard punctuation and spelling fixes
  - Strong: Aggressive grammar and style improvements
- **Punctuation modes**: Off, Light, Standard, Formal

### 2.4 Multi-Window System
- **Main Window**: Full editor interface for viewing/editing text
  - Opens on app launch
  - Shows raw transcription and corrected text
  - Contains settings access
- **Overlay Window**: Floating mini-window for recording
  - Only appears when recording AND main window is not focused/visible
  - Frameless, transparent, always-on-top
  - Shows animated waveform and stop button
  - Positioned center-screen by default

### 2.5 System Tray
- App minimizes to system tray
- Tray icon shows recording state (tooltip changes)
- Right-click menu: Quit option
- Click on tray icon toggles recording

### 2.6 Global Shortcut
- **Default**: `CommandOrControl+Shift+Space`
- Works when app is in background
- Supports both toggle and hold modes
- Note: FN key alone cannot be used as a global shortcut (macOS limitation)

---

## 3. UI/UX Specification

### 3.1 Main Window Layout

```
┌─────────────────────────────────────────────────────────┐
│  [🎤] Bangla Voice Typing                    [⚙️]       │  <- Header
│      Ready to type                                  │
├─────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────┐  │
│  │                                                 │  │  <- Raw Text Area
│  │  Your speech will appear here...                │  │
│  │                                                 │  │
│  └─────────────────────────────────────────────────┘  │
│  [📋] [🗑️]                                            │  <- Raw text actions
│                                                         │
│  ┌─────────────────────────────────────────────────┐  │
│  │                                                 │  │  <- Corrected Text
│  │  AI corrected text will appear here...          │  │
│  │                                                 │  │
│  └─────────────────────────────────────────────────┘  │
│  [✨ AI Cleanup] [📋] [🗑️]                             │  <- Correction actions
│                                                         │
│  [ Clear All ]                                         │
├─────────────────────────────────────────────────────────┤
│  Shortcut: ⌘⇧Space (Toggle)                            │  <- Footer
└─────────────────────────────────────────────────────────┘
```

**Colors**:
- Background: #F1F5F9 (slate-100)
- Primary accent: #3B82F6 (blue-500) for buttons
- Recording indicator: #EF4444 (red-500)
- Text areas: White with subtle shadow
- Corrected area: Purple gradient (#F5F3FF to #EEF2FF)

**Typography**:
- Font: System sans-serif (Inter-like)
- Headings: Bold, 24px
- Body: Regular, 16px
- Labels: Uppercase, 10px, tracking-widest

### 3.2 Overlay Window (Mini-Window)

```
┌───────────────────────────────────────┐
│          🎙️ Listening...              │
│   ▁▃▅▇█▇▅▃▁▃▅▇█▇▅▃▁▃▅▇█▇▅▃▁         │  <- Animated bars
│            [■] Stop                  │
└───────────────────────────────────────┘
```

- Size: 320x180 pixels
- Background: Semi-transparent dark (#1a1a2e at 90% opacity)
- Border-radius: 16px
- Backdrop blur: 20px
- Animations: Framer Motion for entrance/exit

### 3.3 Settings Page

```
┌─────────────────────────────────────────────────────────┐
│  ⚙️ Settings                                    [←]    │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  STT Provider                                           │
│  ┌─────────────────────────────────────────────────┐   │
│  │ OpenAI Whisper  ▼                               │   │
│  └─────────────────────────────────────────────────┘   │
│  API Key: [••••••••••••••••••••••••]                  │
│                                                         │
│  ─────────────────────────────────────────────────────│
│                                                         │
│  AI Providers (Fallback Chain)                          │
│  Primary:   [Ollama            ▼] Model: [gemma4:e2b] │
│  Secondary: [OpenRouter        ▼] Model: [...]        │
│  Tertiary:  [OpenAI            ▼] Model: [...]        │
│                                                         │
│  ─────────────────────────────────────────────────────│
│                                                         │
│  Ollama URL: [http://localhost:11434]                 │
│                                                         │
│  ─────────────────────────────────────────────────────│
│                                                         │
│  Correction Strength: [Balanced ▼]                     │
│  Punctuation Mode:   [Standard ▼]                     │
│                                                         │
│  ─────────────────────────────────────────────────────│
│                                                         │
│  Recording Mode:  (•) Toggle  ( ) Hold                 │
│  Shortcut Key:    [⌘⇧Space                    ]       │
│                                                         │
│  [ ] Auto-cleanup after dictation                      │
│  [ ] Auto-copy corrected text                          │
│  [ ] Demo mode (auto-generate sample text)             │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## 4. Technical Architecture

### 4.1 Window Configuration

| Window | Label | Size | Type | Behavior |
|--------|-------|------|------|----------|
| Main | `main` | 1000x800 | Standard | Primary interface, closes app |
| Overlay | `overlay` | 320x180 | Frameless, transparent | Always-on-top, skip-taskbar |

### 4.2 Window State Logic

```
On shortcut pressed:
  1. Check if recording is active
  2. If active → STOP recording
  3. If not active → START recording

On START recording:
  - Check if main window is visible AND focused
  - IF main window is visible AND focused → do NOT show overlay
  - ELSE → show overlay window with waveform

On STOP recording:
  - Hide overlay window
  - Update tray tooltip to "Ready"
```

### 4.3 File Structure

```
src/
├── App.tsx                      # Root component, routing
├── main.tsx                     # Entry point
├── index.css                    # Tailwind imports
├── components/
│   └── Waveform.tsx            # Audio visualizer
├── pages/
│   ├── MainPage.tsx            # Main editor interface
│   ├── OverlayPage.tsx         # Floating mini-window
│   └── SettingsPage.tsx        # Configuration panel
├── services/
│   ├── windowManager.ts        # Tauri window control
│   ├── speech/
│   │   ├── WhisperSpeechProvider.ts   # OpenAI Whisper
│   │   └── MockSpeechProvider.ts      # Dev/test fallback
│   └── ai/
│       ├── OllamaProvider.ts          # Local Ollama
│       ├── OllamaCloudProvider.ts     # Ollama Cloud API
│       ├── GeminiProvider.ts          # Google Gemini
│       ├── OpenAIProvider.ts          # OpenAI GPT
│       └── OpenRouterProvider.ts      # OpenRouter
├── store/
│   └── settingsStore.ts        # Zustand state
├── hooks/
│   └── useRecording.ts         # Recording logic
└── types/
    └── index.ts                # TypeScript interfaces

src-tauri/
├── src/
│   ├── lib.rs                  # Rust commands & tray
│   └── main.rs                 # Entry point
├── Cargo.toml                  # Rust dependencies
├── tauri.conf.json             # Tauri config
├── Info.plist                  # macOS permissions
└── capabilities/
    └── default.json            # Window permissions
```

### 4.4 Settings Schema

```typescript
interface AppSettings {
  // STT
  sttProvider: string;           // "Whisper" | "Mock"
  sttApiKey?: string;            // OpenAI API key

  // AI Providers (fallback chain)
  aiProvider: string;           // Primary AI
  aiModel: string;               // e.g., "gemma4:e2b"
  secondaryAiProvider?: string;
  secondaryAiModel?: string;
  tertiaryAiProvider?: string;
  tertiaryAiModel?: string;

  // Ollama
  ollamaUrl: string;             // "http://localhost:11434"
  ollamaCloudUrl?: string;
  ollamaCloudApiKey?: string;

  // Cloud AI
  openaiApiKey?: string;
  geminiApiKey?: string;
  openrouterApiKey?: string;

  // Behavior
  autoCopy: boolean;
  autoCleanup: boolean;
  punctuationMode: 'off' | 'light' | 'standard' | 'formal';
  correctionStrength: 'minimal' | 'balanced' | 'strong';
  recordingMode: 'toggle' | 'hold';
  shortcutKey: string;
  demoMode: boolean;
}
```

### 4.5 Provider Fallback Chain

```
User speaks → STT converts to raw text
    ↓
Primary AI (default: Ollama with gemma4:e2b)
    ↓ (if fails)
Secondary AI (default: OllamaCloud)
    ↓ (if fails)
Tertiary AI (default: OpenRouter/free)
    ↓ (if fails)
Show error message to user
```

---

## 5. Platform-Specific Considerations

### 5.1 macOS

**Permissions Required** (via Info.plist):
- `NSMicrophoneUsageDescription`: "Bangla Voice needs microphone access for dictation"

**System Tray**:
- Uses macOS menu bar via Tauri tray-icon
- FN key cannot be used as global shortcut (system reserved)
- Recommend: Command+Shift+Space or Control+Shift+Space

**Apple Silicon (M1-M4)**:
- Ollama runs natively on Apple Silicon
- Whisper.cpp recommended for local STT (not implemented yet)

### 5.2 Windows

**Permissions**:
- Microphone access via Windows settings

**System Tray**:
- Full system tray support

**Shortcuts**:
- FN key technically usable but varies by keyboard
- Recommend: Alt+Space or Ctrl+Shift+Space

---

## 6. Current Implementation Status

### ✅ Working Features
| Feature | Status | Notes |
|---------|--------|-------|
| Main window | ✅ Works | Basic layout, dark theme |
| Settings page | ✅ Works | All configurations save |
| System tray | ✅ Works | Shows recording state |
| Global shortcut | ✅ Works | Command+Shift+Space |
| Toggle/Hold modes | ✅ Works | Configurable |
| Ollama integration | ✅ Works | Uses /api/generate endpoint |
| Fallback chain | ✅ Works | Secondary/Tertiary providers |
| AI Cleanup | ✅ Works | Corrects raw text |
| Waveform animation | ✅ Works | Overlay visualizer |
| Copy/Clear text | ✅ Works | Clipboard integration |
| Framer Motion | ✅ Works | Smooth animations |

### ⚠️ Issues / TODO
| Issue | Status | Notes |
|-------|--------|-------|
| Mock provider auto-types | 🔴 Fixed | Demo mode now opt-in |
| Overlay shows when main focused | 🟡 Fixed | Now checks is_focused() |
| UI design | 🟡 In Progress | Needs polish |
| Permissions prompt | 🟡 Needs testing | macOS mic permission |
| FN key shortcut | 🟡 N/A | Cannot use FN - too low level |

### ❌ Not Implemented
| Feature | Status |
|---------|--------|
| tauri-plugin-store | Not integrated |
| Secure API key storage | Using localStorage |
| Ollama model auto-pull | Non-blocking background |

---

## 7. Keyboard Shortcuts

| Action | Default | Description |
|--------|---------|-------------|
| Toggle Recording | `CommandOrControl+Shift+Space` | Start/Stop dictation |
| Hold to Record | `CommandOrControl+Shift+Space` | Record while held |

**Note**: The FN key cannot be used as a global shortcut because:
1. It's a modifier key, not a standalone key
2. macOS reserves FN for system functions ( brightness, volume, etc.)
3. Cross-platform apps must use modifier combinations

---

## 8. Privacy & Security

- **Local Ollama**: All AI correction runs on-device (default)
- **OpenAI Whisper**: Requires API key, data sent to OpenAI
- **API Keys**: Stored in browser localStorage (not encrypted)
- **Audio**: Never stored, processed in real-time only

---

## 9. Configuration Defaults

| Setting | Default Value |
|---------|--------------|
| Shortcut | CommandOrControl+Shift+Space |
| Recording Mode | Toggle |
| STT Provider | Whisper (if key provided) or Mock |
| AI Provider | Ollama |
| AI Model | gemma4:e2b |
| Ollama URL | http://localhost:11434 |
| Correction Strength | Balanced |
| Punctuation Mode | Standard |
| Demo Mode | Off |
| Auto Cleanup | Off |
| Auto Copy | Off |

---

## 10. Troubleshooting

| Problem | Solution |
|---------|----------|
| App freezes on launch | Check for infinite useEffect loops |
| Shortcut not working | Try a different shortcut, check no conflict |
| No text appearing | Enable demo mode or add STT API key |
| Ollama not connecting | Ensure Ollama is running on port 11434 |
| Overlay not showing | Main window must not be focused |
| Mic permission denied | System Preferences → Privacy → Microphone |

---

## 11. Future Enhancements

- [ ] tauri-plugin-store for secure key storage
- [ ] Ollama model auto-download UI
- [ ] Whisper.cpp for local STT
- [ ] Custom Bangla font selection
- [ ] History of corrections
- [ ] Hotkey customization UI
- [ ] Multiple language support