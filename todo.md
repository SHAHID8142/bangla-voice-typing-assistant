# Bangla Voice Typing Assistant - To-Do List

## 🔴 Critical Issues - FIXED ✅
- [x] Fixed: MockSpeechProvider auto-generates text (demo mode now opt-in)
- [x] Fixed: Overlay shows even when main window focused (now checks is_focused)
- [x] Fixed: Infinite re-render loops in MainPage.tsx (added useCallback)
- [x] Fixed: OllamaProvider using wrong API endpoint (changed /api/chat to /api/generate)
- [x] Fixed: Shortcut "FN" is invalid (changed to CommandOrControl+Shift+Space)
- [x] Fixed: TypeScript errors (missing demoMode in types, unused imports)

## 🟡 High Priority
- [x] UI redesign - Complete dark theme with violet/amber accents
- [x] Improved MainPage.tsx UI - modern, animated, playful
- [x] Improved SettingsPage.tsx UI - dark theme with organized sections
- [x] Demo mode should be OFF by default and clearly labeled in Settings
- [x] FN key limitation - documented that it cannot be used as shortcut

## 🟢 Completed Features
- [x] Shortcut key configuration (CommandOrControl+Shift+Space)
- [x] Recording mode (toggle/hold)
- [x] STT provider selection (Whisper/Mock)
- [x] AI provider fallback chain (Ollama → OllamaCloud → OpenAI → Gemini → OpenRouter)
- [x] Ollama URL configuration (http://localhost:11434)
- [x] Correction strength settings (minimal/balanced/strong)
- [x] Punctuation mode settings (off/light/standard/formal)
- [x] Demo mode toggle in Settings
- [x] Auto-cleanup option
- [x] Auto-copy option
- [x] API keys for all providers

## 🔵 Animation & UX Improvements
- [x] Animated background gradients (floating, breathing effects)
- [x] Recording button with pulsing glow ring
- [x] Animated audio waveform bars in recording banner
- [x] Staggered page entrance animations
- [x] Hover effects on all interactive elements (scale, color)
- [x] Toast notifications with slide animations
- [x] Copy button with checkmark animation on success
- [x] Floating animation on empty state icon
- [x] Smooth page transitions (main ↔ settings)
- [x] Spring-based easing for natural feel

## 📋 Plan.md
- [x] Complete specification document created
- [x] All features documented
- [x] Implementation status tracked
- [x] File structure documented
- [x] Configuration defaults specified
- [x] Troubleshooting guide added

## 🐛 Known Issues
- [ ] Microphone permission prompt on macOS - needs testing
- [ ] System tray behavior when app is closed - needs verification
- [ ] Settings stored in localStorage (not encrypted) - future improvement

## 🔮 Future Enhancements
- [ ] tauri-plugin-store for secure storage
- [ ] Ollama model auto-download UI
- [ ] Whisper.cpp for local STT
- [ ] Custom Bangla font selection
- [ ] History of corrections
- [ ] Hotkey customization UI