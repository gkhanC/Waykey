# ⌨️ WayKey API Reference (English)

Welcome to the definitive API and configuration reference for **WayKey**.

WayKey exposes all of its capabilities through a single, chainable object: **`WayKey`**. You access this object inside your main configuration file `~/.config/waykey/waykey.config.js`.

---

## 🚀 1. Core Properties

### `WayKey.activeWindow`
A dynamically updating object representing the currently focused window on your operating system (via Hyprland IPC).
- **Type**: `Object`
- **Properties**:
  - `class` (String): The application's WM_CLASS name (e.g., "firefox", "code", "kitty").
  - `title` (String): The exact title of the active window tab.

### `WayKey.device`
Provides low-level access to the virtual hardware simulation engine (via `/dev/uinput`). This is used to emit raw keyboard and mouse signals to the OS.
- `emitKey(keyCode, isDown)`: Emit a single key action.
- `emitMouseMove(deltaX, deltaY)`: Move the mouse pointer relatively.
- `emitMouseButton(buttonCode, isDown)`: Click a mouse button.

---

## 🛠️ 2. Core Methods

### `WayKey.log(message, type)`
Sends a real-time console log directly to the **Engine Logs** section of the WayKey Web Dashboard.
- **Parameters**: `message` (String), `type` ('info', 'success', 'error', 'trigger')

---

## 🎯 3. Hotkeys Setup & Chaining

### `WayKey.bind(triggerString)`
Defines the key combination you wish to listen for globally (e.g. "Ctrl+Shift+T"). Returns a `HotkeyNode`.

### `.whenActive(windowClass)`
Flags the hotkey so that it **only** triggers if the current active window's `class` contains the string provided.

### `.description(text)`
Adds a custom user note/description to the hotkey displayed in the Dashboard.

### `.execute(callbackFunction)`
Attaches the logic to be executed when the user presses the combination.

### `.loop(milliseconds, callbackFunction)`
Attaches an infinitely repeating loop logic to the Hotkey. 
- **Behavior**: Pressing the key toggles the loop ON. Pressing the key again toggles the loop OFF. You can also turn it ON/OFF from the Web Dashboard without memory leaks.

---

## 📝 4. Text Auto-Completion (Hotstrings)

### `WayKey.hotstring(trigger, replacement)`
Listens for a specific sequence of keystrokes globally. Once typed, it automatically erases the sequence by backspacing, and types out the `replacement` string.
- **Example**: `WayKey.hotstring('btw', 'by the way');`

---

## 🔑 5. Hardware Keys Dictionary (`WayKey.Keys`)
When using `WayKey.device.emitKey(...)`, you must pass the exact Linux `evdev` hex codes. 
Available standard keys include:
- `KEY_A` to `KEY_Z`, `KEY_1` to `KEY_0`
- `KEY_F1` to `KEY_F12`
- `KEY_LEFTCTRL`, `KEY_RIGHTCTRL`, `KEY_LEFTSHIFT`, `KEY_LEFTALT`
- `KEY_ENTER`, `KEY_SPACE`, `KEY_ESC`, `KEY_TAB`, `KEY_BACKSPACE`
- `BTN_LEFT`, `BTN_RIGHT`, `BTN_MIDDLE`

**Example Sending Key Events**
Always emit `true` (down) and `false` (up).
```javascript
WayKey.device.emitKey(WayKey.Keys.KEY_W, true);
WayKey.device.emitKey(WayKey.Keys.KEY_W, false);
```
