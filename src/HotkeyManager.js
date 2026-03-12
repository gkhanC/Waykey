const EventEmitter = require('events');
const Keys = require('../scripts/Keys.js');

class HotkeyNode {
    constructor(manager, triggerStr, parsedKeys) {
        this.manager = manager;
        this.id = Math.random().toString(36).substr(2, 9);
        this.trigger = triggerStr;
        this.parsedKeys = parsedKeys; // Array of keycodes e.g. [29, 42, 20] 
        this.type = 'Hotkey';
        this.enabled = true;
        this.condition = null; // func
        this.conditionName = null; // string
        this.callback = null;
        this.desc = ''; // string
        
        this.loopInterval = null;
        this.loopMs = 0;
        this.loopCallback = null;
        this.isLooping = false;
    }

    whenActive(windowClass) {
        this.conditionName = windowClass;
        this.condition = (activeWin) => activeWin && activeWin.class && activeWin.class.toLowerCase().includes(windowClass.toLowerCase());
        this.manager.syncDashboard();
        return this;
    }

    description(text) {
        this.desc = text;
        this.manager.syncDashboard();
        return this;
    }

    loop(ms, callback) {
        this.loopMs = ms;
        this.loopCallback = callback;
        return this;
    }

    startLoop() {
        if (!this.loopCallback || this.isLooping) return;
        this.isLooping = true;
        this.enabled = true;
        try { this.loopCallback(); } catch(e){}
        this.loopInterval = setInterval(() => {
            if (this.isLooping) {
                try { this.loopCallback(); } catch(e){}
            }
        }, this.loopMs);
        this.manager.waykeyApi.log(`Loop Started: ${this.trigger}`, 'success');
        this.manager.syncDashboard();
    }

    stopLoop() {
        if (!this.isLooping) return;
        this.isLooping = false;
        if (this.loopInterval) {
            clearInterval(this.loopInterval);
            this.loopInterval = null;
        }
        this.manager.waykeyApi.log(`Loop Stopped: ${this.trigger}`, 'error');
        this.manager.syncDashboard();
    }

    toggleLoop() {
        if (this.isLooping) this.stopLoop();
        else this.startLoop();
    }

    execute(callback) {
        this.callback = callback;
        return this;
    }
}

class HotstringNode {
    constructor(manager, triggerString, replacement) {
        this.manager = manager;
        this.id = Math.random().toString(36).substr(2, 9);
        this.trigger = triggerString;
        this.replacement = replacement;
        this.type = 'Hotstring';
        this.enabled = true;
        this.condition = null;
        this.conditionName = null;
        this.desc = ''; // string
    }

    whenActive(windowClass) {
        this.conditionName = windowClass;
        this.condition = (activeWin) => activeWin && activeWin.class && activeWin.class.toLowerCase().includes(windowClass.toLowerCase());
        this.manager.syncDashboard();
        return this;
    }

    description(text) {
        this.desc = text;
        this.manager.syncDashboard();
        return this;
    }
}

class HotkeyManager extends EventEmitter {
    constructor(waykeyApi) {
        super();
        this.waykeyApi = waykeyApi;
        this.keysDown = new Set();
        this.hotkeys = [];
        this.hotstrings = [];
        this.stringBuffer = ''; // holds recent character presses for hotstring
        
        // Reverse map from code to character roughly for hotstring support
        this.charMap = this.buildCharMap();
    }
    
    bind(triggerStr) {
        const parsed = this.parseTrigger(triggerStr);
        const hk = new HotkeyNode(this, triggerStr, parsed);
        this.hotkeys.push(hk);
        this.syncDashboard();
        return hk;
    }
    
    hotstring(trigger, replacement) {
        const hs = new HotstringNode(this, trigger, replacement);
        this.hotstrings.push(hs);
        this.syncDashboard();
        return hs;
    }
    
    unregisterAll() {
        // Prevent interval memory leaks on hot-reload
        for (const hk of this.hotkeys) {
            if (hk.stopLoop) hk.stopLoop();
        }
        
        this.hotkeys = [];
        this.hotstrings = [];
        this.keysDown.clear();
        this.stringBuffer = '';
        this.syncDashboard();
    }
    
    parseTrigger(triggerStr) {
        const parts = triggerStr.toLowerCase().split('+').map(s => s.trim());
        const mapped = parts.map(p => {
            if (p === 'ctrl') return Keys.KEY_LEFTCTRL; // Approximation
            if (p === 'shift') return Keys.KEY_LEFTSHIFT;
            if (p === 'alt') return Keys.KEY_LEFTALT;
            if (p === 'super' || p === 'win') return Keys.KEY_LEFTMETA;
            if (p === 'space') return Keys.KEY_SPACE;
            if (p === 'enter') return Keys.KEY_ENTER;
            if (p === 'esc' || p === 'escape') return Keys.KEY_ESC;
            if (p === 'tab') return Keys.KEY_TAB;
            if (p === 'backspace') return Keys.KEY_BACKSPACE;
            
            // F1 to F12
            const fMatch = p.match(/^f([1-9]|1[0-2])$/);
            if (fMatch) return Keys[`KEY_F${fMatch[1]}`];

            // A-Z and 0-9
            if (p.length === 1 && ((p >= 'a' && p <= 'z') || (p >= '0' && p <= '9'))) {
                return Keys[`KEY_${p.toUpperCase()}`];
            }
            return Keys[`KEY_${p.toUpperCase()}`];
        });
        
        return mapped.filter(k => k !== undefined);
    }
    
    handleKeyEvent(code, value, activeWindow) {
        if (value === 1) { // Key down
            this.keysDown.add(code);
            this.checkHotkeys(activeWindow);
            this.updateHotstring(code, activeWindow);
        } else if (value === 0) { // Key up
            this.keysDown.delete(code);
        }
    }
    
    checkHotkeys(activeWindow) {
        for (const hk of this.hotkeys) {
            if (!hk.enabled) continue;
            if (!hk.callback && !hk.loopCallback) continue; // must have at least one action
            if (hk.condition && !hk.condition(activeWindow)) continue;
            
            // Check if all keys of this hotkey are down
            const allMatch = hk.parsedKeys.every(k => this.keysDown.has(k));
            
            if (allMatch) {
                this.waykeyApi.log(`Triggered Hotkey: ${hk.trigger}`, 'trigger');
                
                if (hk.loopCallback) {
                    hk.toggleLoop();
                } else if (hk.callback) {
                    hk.callback();
                }
                
                // Debounce simple to avoid rapid triggers
                this.keysDown.clear(); 
            }
        }
    }
    
    updateHotstring(code, activeWindow) {
        if (this.charMap[code]) {
            this.stringBuffer += this.charMap[code];
            if (this.stringBuffer.length > 50) this.stringBuffer = this.stringBuffer.substring(20);
            
            for (const hs of this.hotstrings) {
                if (!hs.enabled) continue;
                if (hs.condition && !hs.condition(activeWindow)) continue;
                
                if (this.stringBuffer.endsWith(hs.trigger)) {
                    // Check for word boundary (space or start of string)
                    const triggerIndex = this.stringBuffer.length - hs.trigger.length;
                    const charBefore = triggerIndex > 0 ? this.stringBuffer[triggerIndex - 1] : null;

                    if (charBefore === null || charBefore === ' ') {
                        this.waykeyApi.log(`Triggered Hotstring: ${hs.trigger}`, 'trigger');
                        this.executeHotstring(hs);
                        this.stringBuffer = '';
                    }
                }
            }
        } else if (code === Keys.KEY_BACKSPACE) {
            this.stringBuffer = this.stringBuffer.slice(0, -1);
        } else if (code === Keys.KEY_SPACE || code === Keys.KEY_ENTER) {
            // Usually hotstrings trigger on space. For this implementation we just keep tracking
            this.stringBuffer += ' ';
        } else {
            this.stringBuffer = ''; // Reset on complex keys
        }
    }
    
    async executeHotstring(hs) {
        // Erase trigger length, emit new text
        const emitKey = (k, down) => this.waykeyApi.device.emitKey(k, down);
        
        // Backspaces
        for (let i = 0; i < hs.trigger.length; i++) {
            emitKey(Keys.KEY_BACKSPACE, true);
            emitKey(Keys.KEY_BACKSPACE, false);
        }
        
        // Emulate string
        for (const char of hs.replacement) {
            const code = this.findCodeForChar(char);
            if (code) {
                // Ignore shift for simplicity or build shift map
                const needsShift = char >= 'A' && char <= 'Z';
                if (needsShift) emitKey(Keys.KEY_LEFTSHIFT, true);
                emitKey(code, true);
                emitKey(code, false);
                if (needsShift) emitKey(Keys.KEY_LEFTSHIFT, false);
            } else if (char === ' ') {
                emitKey(Keys.KEY_SPACE, true);
                emitKey(Keys.KEY_SPACE, false);
            }
        }
    }
    
    syncDashboard() {
        if (!this.waykeyApi.dashboard) return;
        const list = [
            ...this.hotkeys.map(h => ({
                id: h.id, trigger: h.trigger, type: h.type,
                context: h.conditionName || 'Global', enabled: h.enabled !== false,
                desc: h.desc || '', isLooping: h.isLooping || false
            })),
            ...this.hotstrings.map(h => ({
                id: h.id, trigger: h.trigger, type: h.type,
                context: h.conditionName || 'Global', enabled: h.enabled !== false,
                desc: h.desc || '', isLooping: h.isLooping || false
            }))
        ];
        this.waykeyApi.dashboard.updateHotkeys(list);
    }
    
    buildCharMap() {
        const map = {};
        const alphas = 'abcdefghijklmnopqrstuvwxyz';
        for (let i = 0; i < alphas.length; i++) {
            map[Keys[`KEY_${alphas[i].toUpperCase()}`]] = alphas[i];
        }
        // numeric logic omitted for brevity
        return map;
    }
    
    findCodeForChar(char) {
        const alphas = 'abcdefghijklmnopqrstuvwxyz';
        const idx = alphas.indexOf(char.toLowerCase());
        if (idx !== -1) return Keys[`KEY_${alphas[idx].toUpperCase()}`];
        return null;
    }
}

module.exports = HotkeyManager;
