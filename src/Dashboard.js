const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const EventEmitter = require('events');

class Dashboard extends EventEmitter {
    constructor(port = 8080) {
        super();
        this.port = port;
        this.app = express();
        this.server = http.createServer(this.app);
        this.io = new Server(this.server);
        
        // Route for healthcheck
        this.app.get('/ping', (req, res) => res.send('pong'));
        
        // Explicitly serve index view from memory
        const fs = require('fs');
        const publicDir = path.resolve(__dirname, '..', 'public');
        const indexPath = path.join(publicDir, 'index.html');
        let indexHtml = 'Dashboard not found';
        if (fs.existsSync(indexPath)) {
            indexHtml = fs.readFileSync(indexPath, 'utf8');
        }
        
        this.app.get('/', (req, res) => {
            res.status(200).send(indexHtml);
        });
        
        this.io.on('connection', (socket) => {
            console.log('Dashboard Client connected');
            
            // Sync state upon initial connection
            this.emit('clientConnected');
            
            // Client requesting to toggle a hotkey or run a command
            socket.on('command', (cmd) => {
                this.emit('command', cmd);
            });
            
            socket.on('disconnect', () => {
                console.log('Dashboard Client disconnected');
            });
        });
    }
    
    start() {
        this.server.listen(this.port, () => {
            console.log(`WayKey Dashboard running on http://localhost:${this.port}`);
        });
    }
    
    // API for core to update dashboard
    updateActiveWindow(windowInfo) {
        this.io.emit('activeWindow', windowInfo);
    }
    
    sendLog(logMessage) {
        this.io.emit('log', logMessage);
    }
    
    updateHotkeys(hotkeysList) {
        this.io.emit('hotkeys', hotkeysList);
    }
    
    updateSystemStatus(status) {
        this.io.emit('systemStatus', status);
    }
}

module.exports = Dashboard;
