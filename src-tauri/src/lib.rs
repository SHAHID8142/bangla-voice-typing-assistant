use tauri::Manager;

#[tauri::command]
async fn toggle_recording_cmd(app: tauri::AppHandle) -> Result<(), String> {
    use tauri::Emitter;
    app.emit("recording_toggled", ()).map_err(|e| e.to_string())
}

#[tauri::command]
async fn start_dictation_cmd(app: tauri::AppHandle) -> Result<(), String> {
    // Check main window state - only show overlay if main is hidden/minimized
    if let Some(main) = app.get_webview_window("main") {
        let is_visible = main.is_visible().unwrap_or(false);

        // If main window is visible, don't show overlay
        if is_visible {
            return Ok(());
        }
    }

    // Show overlay only when main is hidden
    let overlay = app.get_webview_window("overlay").ok_or("Overlay not found")?;
    overlay.show().map_err(|e| e.to_string())?;
    overlay.set_focus().map_err(|e| e.to_string())
}

#[tauri::command]
async fn stop_dictation_cmd(app: tauri::AppHandle) -> Result<(), String> {
    let overlay = app.get_webview_window("overlay").ok_or("Overlay not found")?;
    overlay.hide().map_err(|e| e.to_string())
}

#[tauri::command]
async fn set_tray_recording_state(app: tauri::AppHandle, is_recording: bool) -> Result<(), String> {
    let tray = app.tray_by_id("main_tray").ok_or("Tray not found")?;
    let tooltip = if is_recording {
        "🎙️ Bangla Voice - Recording..."
    } else {
        "🎤 Bangla Voice - Ready"
    };
    tray.set_tooltip(Some(tooltip)).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
async fn hide_overlay_if_main_visible(app: tauri::AppHandle) -> Result<(), String> {
    // Check if main window became visible - hide overlay if so
    if let Some(main) = app.get_webview_window("main") {
        if main.is_visible().unwrap_or(false) {
            if let Some(overlay) = app.get_webview_window("overlay") {
                let _ = overlay.hide();
            }
        }
    }
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            use tauri::tray::{TrayIconBuilder, MouseButton, MouseButtonState, TrayIconEvent};
            use tauri::menu::{Menu, MenuItem};

            let quit_i = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;
            let show_i = MenuItem::with_id(app, "show", "Show Window", true, None::<&str>)?;
            let record_i = MenuItem::with_id(app, "record", "Start Recording", true, None::<&str>)?;
            let menu = Menu::with_items(app, &[&show_i, &record_i, &quit_i])?;

            let mut tray_builder = TrayIconBuilder::with_id("main_tray")
                .tooltip("🎤 Bangla Voice - Ready")
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
                    "record" => {
                        use tauri::Emitter;
                        let _ = app.emit("recording_toggled", ());
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
                });

            if let Some(icon) = app.default_window_icon() {
                tray_builder = tray_builder.icon(icon.clone());
            }

            let _tray = tray_builder.build(app)?;

            // Hide overlay on startup
            if let Some(overlay) = app.get_webview_window("overlay") {
                let _ = overlay.hide();
            }

            Ok(())
        })
        .on_window_event(|window, event| match event {
            tauri::WindowEvent::CloseRequested { api, .. } => {
                // For main window, hide instead of close (goes to tray)
                if window.label() == "main" {
                    let _ = window.hide();
                    api.prevent_close();
                }
            }
            // When main window becomes visible, hide overlay
            tauri::WindowEvent::Focused(focused) => {
                if window.label() == "main" && *focused {
                    if let Some(overlay) = window.app_handle().get_webview_window("overlay") {
                        let _ = overlay.hide();
                    }
                }
            }
            _ => {}
        })
        .invoke_handler(tauri::generate_handler![
            toggle_recording_cmd,
            start_dictation_cmd,
            stop_dictation_cmd,
            set_tray_recording_state,
            hide_overlay_if_main_visible
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
