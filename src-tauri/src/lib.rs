use tauri::{AppHandle, Emitter, Manager};

#[tauri::command]
pub async fn toggle_recording(app: AppHandle) -> Result<(), String> {
    // In a real app, we'd check a mutex or state
    // For now, let's just emit an event to both
    app.emit("recording_toggled", {}).map_err(|e| e.to_string())?;
    
    Ok(())
}

#[tauri::command]
pub async fn start_dictation(app: AppHandle) -> Result<(), String> {
    let overlay = app.get_webview_window("overlay").ok_or("Overlay not found")?;
    overlay.show().map_err(|e| e.to_string())?;
    overlay.set_focus().map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub async fn stop_dictation(app: AppHandle) -> Result<(), String> {
    let overlay = app.get_webview_window("overlay").ok_or("Overlay not found")?;
    overlay.hide().map_err(|e| e.to_string())?;
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            toggle_recording,
            start_dictation,
            stop_dictation
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
