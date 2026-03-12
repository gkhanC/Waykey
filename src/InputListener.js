const fs = require('fs');
const EventEmitter = require('events');

class InputListener extends EventEmitter {
    constructor() {
        super();
        this.fds = [];
    }

    findKeyboards() {
        try {
            const content = fs.readFileSync('/proc/bus/input/devices', 'utf8');
            const devices = content.split('\n\n');
            const keyboardEventFiles = [];
            
            for (const dev of devices) {
                // Usually keyboards have EV=120013 and Handlers=sysrq kbd eventX
                if (dev.includes('Handlers=') && dev.includes('kbd') && dev.includes('event')) {
                    const match = dev.match(/event\d+/);
                    if (match) {
                        keyboardEventFiles.push(`/dev/input/${match[0]}`);
                    }
                }
            }
            return keyboardEventFiles;
        } catch (e) {
            console.error("Failed to read /proc/bus/input/devices", e.message);
            return [];
        }
    }

    start() {
        const kbdFiles = this.findKeyboards();
        if (kbdFiles.length === 0) {
            console.warn("No keyboard devices found in /proc/bus/input/devices");
        }
        
        for (const file of kbdFiles) {
            try {
                // Open device strictly for reading
                const fd = fs.openSync(file, 'r');
                this.fds.push(fd);
                console.log(`Listening to global keyboard events on ${file}`);
                this.readLoop(fd);
            } catch (e) {
                console.error(`Failed to open ${file} for listener. Are you in 'input' group?`, e.message);
            }
        }
    }

    readLoop(fd) {
        const stream = fs.createReadStream(null, { fd, autoClose: false });
        let remainder = Buffer.alloc(0);

        stream.on('data', (chunk) => {
            const buffer = Buffer.concat([remainder, chunk]);
            let offset = 0;
            
            // struct input_event size on 64-bit systems is 24 bytes
            // time_sec(8), time_usec(8), type(2), code(2), value(4)
            while (offset + 24 <= buffer.length) {
                const type = buffer.readUInt16LE(offset + 16);
                const code = buffer.readUInt16LE(offset + 18);
                const value = buffer.readInt32LE(offset + 20);
                
                // EV_KEY === 1
                if (type === 1) {
                    this.emit('key', { code, value }); // value: 1=down, 0=up, 2=repeat
                }
                
                offset += 24;
            }
            
            remainder = buffer.slice(offset);
        });
        
        stream.on('error', (err) => {
            console.error('Keyboard read stream error:', err.message);
        });
    }

    stop() {
        for (const fd of this.fds) {
            try { fs.closeSync(fd); } catch (e) {}
        }
        this.fds = [];
    }
}

module.exports = InputListener;
