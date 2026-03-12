const fs = require('fs');
const path = require('path');
const chokidar = require('chokidar');
const InputListener = require('./InputListener');
const HotkeyManager = require('./HotkeyManager');
const HyprlandIPC = require('./HyprlandIPC');
const Dashboard = require('./Dashboard');

class WayKey {
    constructor() {
        // Avoid cyclic loading at top
        const { VirtualDevice, Keys } = require('../index.js');
        
        this.device = new VirtualDevice();
        this.Keys = Keys;
        this.ipc = new HyprlandIPC();
        this.dashboard = new Dashboard(8080);
        
        this.inputListener = new InputListener();
        this.hotkeyManager = new HotkeyManager(this);
        
        this.activeWindow = { class: '', title: '' };
        
        this.setupBindings();
    }
    
    setupBindings() {
        this.ipc.on('windowActivated', (win) => {
            this.activeWindow = win;
            this.dashboard.updateActiveWindow(win);
        });
        
        this.inputListener.on('key', (event) => {
            this.hotkeyManager.handleKeyEvent(event.code, event.value, this.activeWindow);
        });
        
        this.dashboard.on('command', (cmd) => {
            if (cmd.action === 'triggerHotkey') {
                const hk = [...this.hotkeyManager.hotkeys, ...this.hotkeyManager.hotstrings].find(h => h.id === cmd.id);
                if (hk) {
                    hk.enabled = true; // Make sure it's enabled if they press ON
                    this.log(`Manually Triggered: ${hk.trigger}`, 'success');
                    if (hk.loopCallback) hk.startLoop();
                    else if (hk.type === 'Hotkey' && hk.callback) hk.callback();
                    else if (hk.type === 'Hotstring') this.hotkeyManager.executeHotstring(hk);
                    this.hotkeyManager.syncDashboard();
                }
            } else if (cmd.action === 'disableHotkey') {
                const hk = [...this.hotkeyManager.hotkeys, ...this.hotkeyManager.hotstrings].find(h => h.id === cmd.id);
                if (hk) {
                    hk.enabled = false;
                    if (hk.stopLoop) hk.stopLoop();
                    this.log(`Disabled Listener & Stopped Macro: ${hk.trigger}`, 'error');
                    this.hotkeyManager.syncDashboard();
                }
            } else if (cmd.action === 'openConfig') {
                const configPath = require('path').join(require('os').homedir(), '.config', 'waykey', 'waykey.config.js');
                // Try opening with VSCode, fallback to other editors or xdg-open
                require('child_process').exec(`code "${configPath}" || gedit "${configPath}" || xdg-open "${configPath}"`);
                this.log(`Opening config file in editor...`, 'info');
            } else if (cmd.action === 'restartEngine') {
                this.log(`Attempting soft restart of WayKey...`, 'info');
                this.softStop();
                setTimeout(() => this.softStart(), 1000);
            } else if (cmd.action === 'stopEngine') {
                this.log(`Suspending WayKey Automation Engine...`, 'error');
                this.softStop();
            }
        });
        
        this.dashboard.on('clientConnected', () => {
            this.hotkeyManager.syncDashboard();
            this.dashboard.updateActiveWindow(this.activeWindow);
        });
    }
    
    start() {
        this.dashboard.start();
        this.softStart();
    }
    
    softStart() {
        this.log("Starting WayKey Engine...", "info");
        this.inputListener.start();
        this.log("Engine Started Successfully.", "success");
    }
    
    softStop() {
        this.inputListener.stop();
        this.hotkeyManager.keysDown.clear();
        this.log("Engine Suspended. Keyboard listening disabled.", "error");
    }
    
    log(msg, type='info') {
        console.log(`[WayKey] ${msg}`);
        this.dashboard.sendLog({ message: msg, type });
    }
    
    bind(triggerStr) {
        return this.hotkeyManager.bind(triggerStr);
    }
    
    hotstring(trigger, replacement) {
        return this.hotkeyManager.hotstring(trigger, replacement);
    }
    
    watchAndLoad(configPath) {
        const absolutePath = path.resolve(configPath);
        this.log(`Watching config script: ${absolutePath}`);
        
        const loadScript = () => {
            try {
                this.hotkeyManager.unregisterAll();
                
                // Clear require cache
                delete require.cache[require.resolve(absolutePath)];
                const scriptModule = require(absolutePath);
                
                if (typeof scriptModule === 'function') {
                    scriptModule(this); // Inject WayKey context
                    this.log("Config script reloaded and applied.", "success");
                }
            } catch (err) {
                this.log(`Failed to load script: ${err.message}`, "error");
            }
        };
        
        // Initial load
        if (fs.existsSync(absolutePath)) {
            loadScript();
        }
        
        chokidar.watch(absolutePath).on('change', () => {
            this.log("Detected change in config script. Hot-reloading...", "info");
            loadScript();
        });
    }
}

module.exports = WayKey;
