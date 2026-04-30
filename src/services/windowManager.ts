import { invoke } from "@tauri-apps/api/core";
import { WebviewWindow } from "@tauri-apps/api/webviewWindow";

export const windowManager = {
  async showOverlay() {
    const overlay = await WebviewWindow.getByLabel("overlay");
    if (overlay) {
      await overlay.show();
      await overlay.setFocus();
    }
  },

  async hideOverlay() {
    const overlay = await WebviewWindow.getByLabel("overlay");
    if (overlay) {
      await overlay.hide();
    }
  },

  async toggleRecording() {
    // This will be called from both Main and Overlay
    // We'll use Tauri events or a shared state to sync recording status
    await invoke("toggle_recording_cmd");
  }
};
