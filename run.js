process.env.UV_THREADPOOL_SIZE = '128'; // Prevent evdev streams from starving libuv
const { WayKey } = require('./index.js');
const path = require('path');
const os = require('os');
const fs = require('fs');

const engine = new WayKey();

const configDir = path.join(os.homedir(), '.config', 'waykey');
const configPath = path.join(configDir, 'waykey.config.js');

if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { recursive: true });
}

if (!fs.existsSync(configPath)) {
    console.log(`Creating default config at ${configPath}`);
    fs.writeFileSync(configPath, `
// WayKey Configuration File
module.exports = (WayKey) => {
    // Example: Bind Super+T to open Kitty terminal
    WayKey.bind('Super+T')
          .description('Kitty Terminal Başlatıcı')
          .execute(() => {
              require('child_process').exec('kitty &');
          });
          
    // Example Hotstring
    WayKey.hotstring('btw', 'by the way')
          .description('Metin Tamamlama Örneği');
    
    // Example Window-specific Hotkey
    WayKey.bind('Ctrl+W')
          .whenActive('firefox')
          .description('Firefox Özel Kısayolu')
          .execute(() => {
             console.log('Ctrl+W pressed in firefox!'); 
          });
};
`);
}

engine.watchAndLoad(configPath);
engine.start();
