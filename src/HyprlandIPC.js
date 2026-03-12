const net = require('net');
const EventEmitter = require('events');

class HyprlandIPC extends EventEmitter {
    constructor() {
        super();
        this.signature = process.env.HYPRLAND_INSTANCE_SIGNATURE;
        if (!this.signature) {
            console.warn("Warning: HYPRLAND_INSTANCE_SIGNATURE is not set. Are you running inside Hyprland?");
        }
        
        const basePath = process.env.XDG_RUNTIME_DIR 
            ? `${process.env.XDG_RUNTIME_DIR}/hypr/${this.signature}`
            : `/tmp/hypr/${this.signature}`;
            
        this.socket1Path = `${basePath}/.socket.sock`;
        this.socket2Path = `${basePath}/.socket2.sock`;
        
        this.socket2 = null;
        this.reconnectTimer = null;
        
        this.connect();
    }
    
    connect() {
        if (!this.signature) return;
        
        this.socket2 = net.connect(this.socket2Path);
        
        this.socket2.on('connect', () => {
            console.log('Connected to Hyprland event socket (.socket2.sock)');
            this.emit('connected');
        });
        
        let buffer = '';
        this.socket2.on('data', (data) => {
            buffer += data.toString();
            let lines = buffer.split('\n');
            buffer = lines.pop(); // keep the last partial line (if any) in the buffer
            
            for (const line of lines) {
                this.handleEvent(line);
            }
        });
        
        this.socket2.on('error', (err) => {
            console.error(`Hyprland IPC Socket2 Error: ${err.message}`);
        });
        
        this.socket2.on('close', () => {
            console.log('Disconnected from Hyprland IPC. Reconnecting in 2 seconds...');
            this.socket2 = null;
            clearTimeout(this.reconnectTimer);
            this.reconnectTimer = setTimeout(() => this.connect(), 2000);
        });
    }
    
    handleEvent(line) {
        if (!line) return;
        
        // Format is EVENTNAME>>DATA
        const splitIndex = line.indexOf('>>');
        if (splitIndex === -1) return;
        
        const eventName = line.substring(0, splitIndex);
        const eventData = line.substring(splitIndex + 2);
        const dataParts = eventData ? eventData.split(',') : [];
        
        // Raw event emit
        this.emit(eventName, dataParts);
        
        // AutoHotkey-like semantic helpful events
        if (eventName === 'activewindow') {
            const windowClass = dataParts[0] || '';
            // Data after the first comma could contain commas if the title has them
            const windowTitle = dataParts.slice(1).join(',') || '';
            this.emit('windowActivated', { class: windowClass, title: windowTitle });
        } else if (eventName === 'activewindowv2') {
            const windowAddress = dataParts[0] || '';
            this.emit('windowActivatedV2', { address: windowAddress });
        } else if (eventName === 'workspace') {
            const workspaceName = dataParts[0] || '';
            this.emit('workspaceChanged', { workspace: workspaceName });
        }
    }
    
    /**
     * Sends a command synchronously via .socket.sock
     * @param {string} command The raw Hyprland socket command (e.g. 'j/activewindow' or 'dispatch movewindowpixel')
     */
    async dispatch(command) {
        if (!this.signature) throw new Error("HYPRLAND_INSTANCE_SIGNATURE is not set");
        
        return new Promise((resolve, reject) => {
            const client = net.connect(this.socket1Path);
            let response = '';
            
            client.on('connect', () => {
                client.write(command);
            });
            
            client.on('data', (data) => {
                response += data.toString();
            });
            
            client.on('error', (err) => {
                reject(err);
            });
            
            client.on('end', () => {
                resolve(response.trim());
            });
        });
    }
    
    // --------------------------------------------------------------------------
    // AutoHotkey-like Helper Methods
    // --------------------------------------------------------------------------
    
    /**
     * Gets the current active window directly, returning class and title synchronously-ish
     */
    async getActiveWindow() {
        try {
            const response = await this.dispatch('j/activewindow');
            if (!response) return null;
            return JSON.parse(response);
        } catch (e) {
            console.error("Failed to get active window:", e.message);
            return null;
        }
    }
    
    /**
     * Activates a window by class
     * @param {string} windowClass 
     */
    async activateWindow(windowClass) {
        return this.dispatch(`dispatch focuswindow class:${windowClass}`);
    }
    
    /**
     * Moves a window relative pixel offset
     * @param {string} windowClass 
     * @param {number} x 
     * @param {number} y 
     */
    async moveWindow(windowClass, x, y) {
        // e.g., movewindowpixel 100 100,class:firefox
        return this.dispatch(`dispatch movewindowpixel exact ${x} ${y},class:${windowClass}`);
    }
}

module.exports = HyprlandIPC;
