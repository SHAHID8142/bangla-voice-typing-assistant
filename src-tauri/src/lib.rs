#[tauri::command]
async fn toggle_recording_cmd(app: tauri::AppHandle) -> Result<(), String> {
    use tauri::Emitter;
    app.emit("recording_toggled", ()).map_err(|e| e.to_string())
}

#[tauri::command]
async fn start_dictation_cmd(app: tauri::AppHandle) -> Result<(), String> {
    use tauri::Manager;
    let overlay = app.get_webview_window("overlay").ok_or("Overlay not found")?;
    overlay.show().map_err(|e| e.to_string())?;
    overlay.set_focus().map_err(|e| e.to_string())
}

#[tauri::command]
async fn stop_dictation_cmd(app: tauri::AppHandle) -> Result<(), String> {
    use tauri::Manager;
    let overlay = app.get_webview_window("overlay").ok_or("Overlay not found")?;
    overlay.hide().map_err(|e| e.to_string())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            toggle_recording_cmd,
            start_dictation_cmd,
            stop_dictation_cmd
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
