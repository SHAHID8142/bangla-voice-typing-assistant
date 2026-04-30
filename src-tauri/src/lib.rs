#[tauri::command]
async fn toggle_recording_cmd(app: tauri::AppHandle) -> Result<(), String> {
    use tauri::Emitter;
    app.emit("recording_toggled", ()).map_err(|e| e.to_string())
}

#[tauri::command]
async fn start_dictation_cmd(app: tauri::AppHandle) -> Result<(), String> {
    use tauri::Manager;
    // Don't show the overlay if main is visible
    if let Some(main) = app.get_webview_window("main") {
        if main.is_visible().unwrap_or(false) {
            return Ok(());
        }
    }
    
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

#[tauri::command]
async fn set_tray_recording_state(app: tauri::AppHandle, is_recording: bool) -> Result<(), String> {
    
    let tray = app.tray_by_id("main_tray").ok_or("Tray not found")?;
    
    // In a real app, you'd load distinct dynamic icons (e.g., red circle vs microphone)
    // For now, we will simply append text to the tooltip
    let tooltip = if is_recording {
        "Bangla Voice - Recording..."
    } else {
        "Bangla Voice - Ready"
    };
    
    tray.set_tooltip(Some(tooltip)).map_err(|e| e.to_string())?;
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            use tauri::Manager;
            use tauri::tray::{TrayIconBuilder, MouseButton, MouseButtonState, TrayIconEvent};
            use tauri::menu::{Menu, MenuItem};

            let quit_i = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;
            let show_i = MenuItem::with_id(app, "show", "Show App", true, None::<&str>)?;
            let menu = Menu::with_items(app, &[&show_i, &quit_i])?;

            let _tray = TrayIconBuilder::with_id("main_tray")
                .tooltip("Bangla Voice")
                .icon(app.default_window_icon().unwrap().clone())
                .menu(&menu)
                .show_menu_on_left_click(false)
                .on_menu_event(|app: &tauri::AppHandle, event| match event.id.as_ref() {
                    "quit" => {
                        std::process::exit(0);
                    }
                    "show" => {
                        if let Some(window) = app.get_webview_window("main") {
                            let _ = window.show();
                            let _ = window.set_focus();
                        }
                    }
                    _ => {}
                })
                .on_tray_icon_event(|tray: &tauri::tray::TrayIcon, event| {
                    if let TrayIconEvent::Click {
                        button: MouseButton::Left,
                        button_state: MouseButtonState::Up,
                        ..
                    } = event
                    {
                        let app = tray.app_handle();
                        if let Some(window) = app.get_webview_window("main") {
                            let _ = window.show();
                            let _ = window.set_focus();
                        }
                    }
                })
                .build(app)?;

            Ok(())
        })
        .on_window_event(|window, event| match event {
            tauri::WindowEvent::CloseRequested { api, .. } => {
                // Intercept close event for main window, hide instead
                if window.label() == "main" {
                    window.hide().unwrap();
                    api.prevent_close();
                }
            }
            _ => {}
        })
        .invoke_handler(tauri::generate_handler![
            toggle_recording_cmd,
            start_dictation_cmd,
            stop_dictation_cmd,
            set_tray_recording_state
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
