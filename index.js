const path = require('path');

// Try loading Release build, fallback to Debug if necessary
let waykey_core;
try {
    waykey_core = require('./build/Release/waykey_core.node');
} catch (e) {
    waykey_core = require('./build/Debug/waykey_core.node');
}

// Load auto-generated Keys
let Keys = {};
try {
    Keys = require('./scripts/Keys.js');
} catch (e) {
    console.warn("Keys.js not found. Make sure to run generate-keys.js first.");
}

const HyprlandIPC = require('./src/HyprlandIPC.js');

const Dashboard = require('./src/Dashboard.js');
const WayKey = require('./src/WayKey.js');

module.exports = {
    VirtualDevice: waykey_core.VirtualDevice,
    Keys,
    HyprlandIPC,
    Dashboard,
    WayKey
};
