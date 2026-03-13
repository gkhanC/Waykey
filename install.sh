#!/bin/bash

# WayKey Universal Installer Script
# WARNING: This script may ask for sudo password to insert udev rules.

set -e
echo "🚀 Starting WayKey Installation..."

# 1. System Dependencies (Assuming generic Debian or Arch base)
echo "[1/6] Checking for base build tools (make, gcc, npm)..."
if ! command -v npm &> /dev/null; then
    echo "❌ Error: npm/Node.js is not installed. Please install nodejs."
    exit 1
fi

# 2. Node Dependencies and Build
echo "[2/6] Installing Node.js dependencies and compiling C++ native module..."
npm install

# 3. Udev Rules (Requires sudo to write to /etc/udev/rules.d)
echo "[3/6] Setting up Udev rules for /dev/uinput..."
if [ -f "udev/99-waykey-uinput.rules" ]; then
    sudo cp udev/99-waykey-uinput.rules /etc/udev/rules.d/
    sudo udevadm control --reload-rules && sudo udevadm trigger
    # Ensure current user is in input group to avoid restart if possible
    sudo usermod -aG input "$USER"
else
    echo "⚠️ Warning: udev/99-waykey-uinput.rules missing! Input simulation may fail."
fi

# 4. Systemd Service Setup
echo "[4/6] Setting up WayKey Systemd User Service..."
mkdir -p "$HOME/.config/systemd/user"

# Dynamically generate the correct execution path
cat <<EOF > waykey.service
[Unit]
Description=WayKey Automation Engine (AutoHotkey alternative for Wayland)
After=graphical-session.target
PartOf=graphical-session.target

[Service]
Type=simple
ExecStart=uwsm app -- /usr/bin/node $(pwd)/run.js
Restart=on-failure
RestartSec=3
Environment=NODE_ENV=production
Environment=UV_THREADPOOL_SIZE=128
EOF

cp waykey.service "$HOME/.config/systemd/user/"
systemctl --user daemon-reload

# 5. Desktop Shortcut (Dashboard)
echo "[5/6] Creating Desktop Shortcut for Dashboard..."
mkdir -p "$HOME/.local/share/applications"

cat <<EOF > "$HOME/.local/share/applications/waykey.desktop"
[Desktop Entry]
Name=WayKey Dashboard
Comment=Linux Native Automation Engine (AutoHotkey alternative)
Exec=sh -c "systemctl --user start waykey.service && sleep 1 && xdg-open http://localhost:8080"
Icon=preferences-system
Terminal=false
Type=Application
Categories=Utility;Settings;System;
EOF
update-desktop-database "$HOME/.local/share/applications/" || true


echo ""
echo "✅ Installation Complete!"
echo "➡️  You can now search for 'WayKey Dashboard' in your Application Menu."
echo "➡️  Your config file is loaded from: ~/.config/waykey/waykey.config.js"
echo "➡️  To check status: systemctl --user status waykey"
echo "Waykey is not automatically enabled as a background service to prevent compositor conflicts."
echo "To start it, add the following line to your hyprland.conf (or your compositor's autostart file):"
echo "exec-once = uwsm app -- /usr/bin/node /opt/waykey/run.js"