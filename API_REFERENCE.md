# ⌨️ WayKey API Reference

Welcome to the definitive API and configuration reference for the **WayKey Linux Automation Engine**. 

WayKey exposes all of its native C++ and Node.js capabilities through a single, chainable, developer-friendly object: **`WayKey`**. You access this object inside your main configuration file `~/.config/waykey/waykey.config.js`.

---

## 🚀 1. Core Properties

### `WayKey.activeWindow`
A dynamically updating object representing the currently focused window on your operating system (via Hyprland IPC).
- **Type**: `Object`
- **Properties**:
  - `class` (String): The application's WM_CLASS name (e.g. "firefox", "code", "kitty").
  - `title` (String): The exact title of the active window tab.
- **Example Usage**:
  ```javascript
  if (WayKey.activeWindow.title.toLowerCase().includes('youtube')) { 
      // Do something 
  }
  ```

### `WayKey.device`
Provides low-level access to the virtual hardware simulation engine (via `/dev/uinput`). This is used to emit raw keyboard and mouse signals to the OS.
- **Methods**:
  - `emitKey(keyCode, isDown)`: Emit a single key action.
  - `emitMouseMove(deltaX, deltaY)`: Move the mouse pointer relatively.
  - `emitMouseButton(buttonCode, isDown)`: Click a mouse button.

---

## 🛠️ 2. Core Methods

### `WayKey.log(message, type)`
Sends a real-time console log not just to the terminal, but directly to the **Engine Logs** section of the WayKey Web Dashboard GUI.
- **Parameters**:
  - `message` (String): Text to display.
  - `type` (String, Optional): Controls color/formatting. `'info'` (White), `'success'` (Green), `'error'` (Red). Defaults to `'info'`.
- **Example Usage**: 
  ```javascript
  WayKey.log("Senaryo başarıyla çalıştırıldı!", "success");
  ```

---

## 🎯 3. Hotkeys Setup & Chaining

Creating hotkeys in WayKey happens through a fluent, chainable API starting with `bind()`.

### `WayKey.bind(triggerString)`
Defines the key combination you wish to listen for globally.
- **Parameters**:
  - `triggerString` (String): Case-insensitive combinations like `"Alt+C"`, `"Ctrl+Shift+T"`, `"F12"`.
- **Returns**: `HotkeyNode` (chainable object).

### `.whenActive(windowClass)`
Flags the hotkey so that it **only** triggers if the current active window's `class` matches the string provided.
- **Example**:
  ```javascript
  WayKey.bind('Alt+C').whenActive('code').execute(() => { ... });
  ```

### `.description(text)`
Adds a custom user note/description to the hotkey that will be displayed in the **Web Dashboard** registry table.
- **Example**:
  ```javascript
  WayKey.bind('F9').description('Otomatik Can İksiri İçme Botu').execute(...)
  ```

### `.execute(callbackFunction)`
Attaches the logic to be executed when the user presses the combination.
- **Parameters**:
  - `callbackFunction` (Function): Synchronous or `async` function. 
- **Example**:
  ```javascript
  WayKey.bind('F1').execute(async () => {
      WayKey.log("F1 Pressed!");
  });
  ```

### `.loop(milliseconds, callbackFunction)`
Attaches an infinitely repeating loop logic to the Hotkey. 
- **Behavior**: Pressing the key toggles the loop ON. Pressing the key again toggles the loop OFF. You can also turn it ON/OFF from the Web Dashboard. WayKey natively manages clearing memory intervals.
- **Example**:
  ```javascript
  WayKey.bind('F10')
        .description('Spam Bot')
        .loop(1000, () => {
             WayKey.device.emitKey(WayKey.Keys.KEY_W, true);
             WayKey.device.emitKey(WayKey.Keys.KEY_W, false);
        });
  ```

---

## 📝 4. Text Auto-Completion (Hotstrings)

### `WayKey.hotstring(trigger, replacement)`
Listens for a specific sequence of keystrokes globally. Once typed, it automatically erases the sequence by backspacing, and then rapidly types out the `replacement` string.
- **Parameters**:
  - `trigger` (String): The short abbreviation.
  - `replacement` (String): The expanded string.
- **Example Usage**:
  ```javascript
  WayKey.hotstring('btw', 'by the way');
  // It also accepts .whenActive() and .description() chains:
  WayKey.hotstring(';mail', 'gokhanc@example.com').description('Mail Kısayolu');
  ```

---

## 🔑 5. Hardware Keys Dictionary (`WayKey.Keys`)

When using `WayKey.device.emitKey(...)` to simulate button presses, you must pass the exact Linux `evdev` hex codes. 
WayKey exports all standard Linux keycodes via the `WayKey.Keys` object.

| Category | Available Key Names (Examples) |
| --- | --- |
| **Alphabet (A-Z)** | `KEY_A`, `KEY_B`, `KEY_C` ... `KEY_Z` |
| **Numbers (0-9)** | `KEY_1`, `KEY_2` ... `KEY_0` |
| **Function Keys** | `KEY_F1`, `KEY_F2` ... `KEY_F12` |
| **Modifiers** | `KEY_LEFTCTRL`, `KEY_RIGHTCTRL`, `KEY_LEFTSHIFT`, `KEY_LEFTALT`, `KEY_LEFTMETA` (Windows/Super) |
| **System/Action** | `KEY_ENTER`, `KEY_SPACE`, `KEY_ESC`, `KEY_TAB`, `KEY_BACKSPACE`, `KEY_CAPSLOCK` |
| **Arrows** | `KEY_UP`, `KEY_DOWN`, `KEY_LEFT`, `KEY_RIGHT` |
| **Numpad** | `KEY_KP1`, `KEY_KPASTERISK`, `KEY_KPMINUS`, `KEY_KPPLUS`, `KEY_KPENTER` |
| **Mouse Buttons** | `BTN_LEFT`, `BTN_RIGHT`, `BTN_MIDDLE`, `BTN_SIDE`, `BTN_EXTRA` |

### **Example Sending Key Events**
Always remember to emit a `true` (down) and a `false` (up) signal to simulate a clean hardware keypress.

```javascript
// Press and hold LEFT SHIFT
WayKey.device.emitKey(WayKey.Keys.KEY_LEFTSHIFT, true);

// Tap number 1
WayKey.device.emitKey(WayKey.Keys.KEY_1, true);
WayKey.device.emitKey(WayKey.Keys.KEY_1, false);

// Release LEFT SHIFT
WayKey.device.emitKey(WayKey.Keys.KEY_LEFTSHIFT, false);

// Result: This combination will type out "!"
```

---

## 🕹️ 6. Common Automation Utility Tricks

### Native `sleep()` (Promises)
Since Node.js is asynchronous, traditional AHK `Sleep, 1500` will block the thread if placed. Use JS Promises to wait asynchronously without freezing the engine:

```javascript
module.exports = (WayKey) => {
    // 1. Define utility inside the file
    const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
    
    // 2. Use it inside an 'async' execute callback
    WayKey.bind('Alt+C').execute(async () => {
        WayKey.device.emitKey(WayKey.Keys.KEY_SPACE, true);
        WayKey.device.emitKey(WayKey.Keys.KEY_SPACE, false);
        
        await sleep(2500); // Waits seamlessly for 2.5 seconds
        
        // ... then do the next action
    });
};
```
