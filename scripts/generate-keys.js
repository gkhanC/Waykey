const fs = require('fs');
const path = require('path');

function generateKeys() {
    try {
        const inputCodesPath = '/usr/include/linux/input-event-codes.h';
        if (!fs.existsSync(inputCodesPath)) {
            console.warn(`Could not find ${inputCodesPath}. Keys enum will be empty.`);
            return {};
        }

        const content = fs.readFileSync(inputCodesPath, 'utf8');
        const lines = content.split('\n');
        const keys = {};

        for (const line of lines) {
            // Match #define KEY_A 30 or #define BTN_LEFT 0x110
            const match = line.match(/^#define\s+(KEY_[A-Z0-9_]+|BTN_[A-Z0-9_]+|REL_[A-Z0-9_]+|EV_[A-Z0-9_]+)\s+(0x[0-9a-fA-F]+|\d+)/);
            if (match) {
                const name = match[1];
                const valueStr = match[2];
                const value = parseInt(valueStr, valueStr.toLowerCase().startsWith('0x') ? 16 : 10);
                keys[name] = value;
            }
        }

        const outputPath = path.join(__dirname, 'Keys.js');
        fs.writeFileSync(outputPath, `// Auto-generated from linux/input-event-codes.h\nmodule.exports = ${JSON.stringify(keys, null, 2)};\n`);
        console.log(`Successfully generated Keys.js with ${Object.keys(keys).length} constants.`);
        return keys;
    } catch (e) {
        console.error("Failed to generate keys:", e.message);
        return {};
    }
}

if (require.main === module) {
    generateKeys();
}

module.exports = generateKeys;
