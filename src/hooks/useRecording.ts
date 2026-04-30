import { listen } from "@tauri-apps/api/event";
import { invoke } from "@tauri-apps/api/core";
import { useEffect } from "react";

export function useRecordingEvents(callback: () => void) {
  // Listen for the "recording_toggled" event from Rust
  useEffect(() => {
    const unlisten = listen("recording_toggled", () => {
      callback();
    });

    return () => {
      unlisten.then(u => u());
    };
  }, [callback]);
}

export const recordingService = {
    async toggle() {
        await invoke("toggle_recording_cmd");
    }
}
