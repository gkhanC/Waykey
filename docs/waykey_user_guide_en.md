# 📖 WayKey Advanced User Guide & Real-World Examples

This guide teaches you how to effectively structure and utilize WayKey's capabilities in `~/.config/waykey/waykey.config.js`.

---

## 🏗️ 1. Basic Structure of the Config File

WayKey loads a single JavaScript file. It must export a function receiving the `WayKey` context.
```javascript
module.exports = (WayKey) => {
    // 🌍 Your bindings go here
};
```

You can use standard JavaScript features, external `npm` modules like `fs`, `child_process`, and Native `Promises`.

---

## 🕹️ 2. Executing Shell Commands

To run Linux programs or bash scripts, utilize Node.js's built-in `child_process`.
```javascript
const { exec } = require('child_process');

module.exports = (WayKey) => {
    WayKey.bind('Alt+T').execute(() => {
        exec('kitty &');
        WayKey.log('Kitty Terminal Launched', 'info');
    });

    WayKey.bind('Super+E').execute(() => {
        exec('nautilus &');
    });
};
```

---

## ⏲️ 3. Asynchronous Delays (Sleep)
WayKey is asynchronous. Instead of blocking the thread (which would freeze all other hotkeys), you should use a Promise-based `sleep` function if you need sequential delays.

```javascript
module.exports = (WayKey) => {
    // 💡 Helper function
    const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    WayKey.bind('Alt+F')
          .description('Example delay macro')
          .execute(async () => {
              WayKey.device.emitKey(WayKey.Keys.KEY_W, true);
              WayKey.device.emitKey(WayKey.Keys.KEY_W, false);
              
              await sleep(1500); // Wait 1.5 seconds

              WayKey.device.emitKey(WayKey.Keys.KEY_W, true);
              WayKey.device.emitKey(WayKey.Keys.KEY_W, false);
          });
};
```

---

## 🔄 4. The Magic `.loop()` Method

WayKey Engine natively supports loop management.

```javascript
module.exports = (WayKey) => {
    WayKey.bind('F9')
          .description('Auto Attack Spammer')
          .whenActive('path of exile') // Context-aware!
          .loop(200, () => {
              // This triggers every 200ms once ON.
              WayKey.device.emitKey(WayKey.Keys.KEY_Q, true);
              WayKey.device.emitKey(WayKey.Keys.KEY_Q, false);
          });
};
```
*Note: You can turn this loop ON and OFF either by pressing F9 or by clicking the `EXEC`/`HALT` buttons in the Dashboard.*

---

## ⌨️ 5. Auto Text Expansion (Hotstrings)

```javascript
module.exports = (WayKey) => {
    // Replaces 'omw' with 'On my way!'
    WayKey.hotstring('omw', 'On my way!');
    
    // HTML Boilerplate
    WayKey.hotstring(';html', '<!DOCTYPE html>\n<html>\n<head></head>\n<body></body>\n</html>');
};
```
