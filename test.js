const { VirtualDevice, Keys } = require('./index.js');

async function runTest() {
    console.log("Initializing WayKey VirtualDevice via Node.js Native Addon...");
    try {
        const device = new VirtualDevice();
        console.log("VirtualDevice instantiated successfully.");
        
        console.log("Waiting 2 seconds before simulation...");
        await new Promise(r => setTimeout(r, 2000));
        
        console.log("Typing 'H', 'i'...");
        device.emitKey(Keys.KEY_H, true);
        device.emitKey(Keys.KEY_H, false);
        device.emitKey(Keys.KEY_I, true);
        device.emitKey(Keys.KEY_I, false);
        device.emitKey(Keys.KEY_ENTER, true);
        device.emitKey(Keys.KEY_ENTER, false);
        
        console.log("Moving mouse (50, 50)...");
        await new Promise(r => setTimeout(r, 1000));
        device.emitMouseMove(50, 50);

        console.log("Scrolling up...");
        await new Promise(r => setTimeout(r, 1000));
        device.emitMouseScroll(1);
        
        console.log("Test completed successfully!");
    } catch (err) {
        console.error("Test failed, likely missing uinput permissions. Error:", err.message);
    }
}

runTest();
