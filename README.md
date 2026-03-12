<div align="center">
  <img src="https://raw.githubusercontent.com/abhishekkrthakur/waykey/main/docs/assets/logo.png" alt="WayKey Logo" width="120" height="auto" onerror="this.src='https://img.icons8.com/fluency/256/motherboard.png'" />
  <h1>WayKey</h1>
  <p><b>Next-Generation Linux Automation Engine (Wayland & Hyprland Native)</b></p>
  <p><i>The modern, fast, and unblockable alternative to AutoHotkey and xdotool for Linux.</i></p>

  <p>
    <img src="https://img.shields.io/badge/Platform-Linux-yellow?logo=linux&logoColor=white" alt="Platform" />
    <img src="https://img.shields.io/badge/Node.js-%3E%3D%2016-green?logo=nodedotjs&logoColor=white" alt="Node version" />
    <img src="https://img.shields.io/badge/Wayland-Native-blue" alt="Wayland" />
    <img src="https://img.shields.io/badge/C++-Bindings-purple?logo=cplusplus" alt="C++ bindings" />
    <img src="https://img.shields.io/badge/License-MIT-blue.svg" alt="License" />
  </p>
</div>

<p align="center">
  <a href="README_TR.md">🇹🇷 Dili Türkçe Olarak Değiştir (Read in Turkish)</a>
</p>

---

## 🌟 What is WayKey?

**WayKey** is a background daemon and Web Dashboard created for Linux users who need complex macros, key remapping, and window-context-aware hotkeys similar to Windows' AutoHotkey. Because it directly interfaces with Linux's `uinput` kernel module and Hyprland's IPC socket, it completely circumvents the limitations of Wayland compositors blocking global keybind injection.

<p align="center">
  <img src="docs/assets/dashboard_preview.png" alt="WayKey Dashboard Cyberpunk UI" />
</p>

---

## 🚀 Features

* 🛡️ **Absolute Wayland Compatibility**: Uses `/dev/uinput` and `/dev/input/` directly, ignoring display server restrictions entirely.
* 🎯 **Hyprland Window Awareness**: Listen to active window titles and classes. Make macros that *only* work when you have a specific app or game focused!
* 💻 **Cyberpunk Web Dashboard**: Manage your scripts, toggle hotkeys `EXEC/HALT` remotely, and read real-time engine logs via the Local Web GUI.
* 🧠 **Fluent JavaScript API**: Write configurations in modern JavaScript instead of learning an obscure bespoke scripting language.
* 🔄 **Native `.loop()` Management**: Cleanly loop tasks and cancel them instantly. No more `setInterval` memory leaks.
* ⚡ **Zero-Downtime Hot-Reload**: Save your config file and the engine updates instantly without dropping key inputs.

---

## 📦 Installation

WayKey comes with an automated universal installer for modern Linux distributions.

### Prerequisites
- `nodejs` and `npm`
- `make`, `gcc`, `g++` (for compiling native C++ Node addons)
- `git`

### 🛠️ Universal 1-Click Install

Clone the repository and run the setup script:

```bash
git clone https://github.com/yourusername/HypeKey.git
cd HypeKey
chmod +x install.sh
./install.sh
```

**What the installer does automatically:**
1. Installs Node.js dependencies (`npm install`).
2. Compiles the C++ hardware simulator module for your kernel.
3. Prompts for `sudo` to deploy `udev` rules so your user can inject keystrokes without running the app as root.
4. Creates a `waykey.service` Systemd user service.
5. Deploys a `.desktop` shortcut directly into your Application menu.

### Verify Installation
Check if the background systemd process is healthy:
```bash
systemctl --user status waykey
```

---

## 📖 Quick Start & Configuration

Once installed, your configuration is hosted at `~/.config/waykey/waykey.config.js`. You can open it via the **CONFIG** button in the Web Dashboard.

### Basic Config Example:
```javascript
module.exports = (WayKey) => {
    // 1. Simple Command Execution
    WayKey.bind('Super+T')
          .description('Launch Kitty Terminal')
          .execute(() => {
              require('child_process').exec('kitty &');
          });

    // 2. Window-Specific Spam Bot (Starts/Stops on F9)
    WayKey.bind('F9')
          .whenActive('path of exile') // Context Aware!
          .description('Auto Flask Drinker')
          .loop(3500, async () => {
              WayKey.device.emitKey(WayKey.Keys.KEY_1, true);
              WayKey.device.emitKey(WayKey.Keys.KEY_1, false);
          });

    // 3. Hotstrings (Auto Text Expansion)
    WayKey.hotstring('btw', 'by the way')
          .description('Expands abbreviation immediately');
};
```

---

## 📚 Documentation
For an exhaustive list of `WayKey.device` commands, Keycodes, and advanced functions, see:
* [API Reference](API_REFERENCE_EN.md) 
* [Advanced User Guide (Writing Scripts)](docs/waykey_user_guide_en.md)

---

## 🪪 Architecture
WayKey is split into highly-efficient modular layers:
1. **C++ Native Node Addon**: Directly accesses `/dev/input/*` via `evdev` to grab un-blocked keypresses, and emits synthetic keystrokes into a virtual `/dev/uinput` keyboard handler.
2. **Node.js Core**: Manages script logic, Hotstring states, parsing logic, and loop intervals asynchronously.
3. **Hyprland IPC Connection**: Reads from Hyprland Socket2 to get sub-millisecond updates on the `activeWindow`.
4. **Express.js + Socket.io**: Serves the stunning Local Dashboard to visualize everything.

## 🤝 Contributing
Issues and Pull Requests are heavily encouraged! Since X11 tools like `xdotool` and `xbindkeys` are dying out, the Linux desktop ecosystem desperately needs robust Wayland automation solutions. 

## 📄 License
MIT License. Free to use and modify!
