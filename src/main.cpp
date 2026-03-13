#include "VirtualDevice.h"
#include <iostream>
#include <unistd.h>

int main() {
    try {
        std::cout << "WayKey Core Test Initializing..." << std::endl;
        VirtualDevice dev;
        dev.setup();
        std::cout << "Virtual Device registered successfully." << std::endl;
        
        std::cout << "Waiting 2 seconds before simulation..." << std::endl;
        sleep(2);

        // Simulate Typing "Hi"
        std::cout << "Simulating 'H' 'i' and Enter..." << std::endl;
        dev.emitKey(KEY_H, true); dev.emitKey(KEY_H, false);
        dev.emitKey(KEY_I, true); dev.emitKey(KEY_I, false);
        dev.emitKey(KEY_ENTER, true); dev.emitKey(KEY_ENTER, false);
        
        std::cout << "Moving mouse (delta: 100, 100)..." << std::endl;
        sleep(1);
        dev.emitMouseMove(100, 100);

        std::cout << "Scrolling up..." << std::endl;
        sleep(1);
        dev.emitMouseScroll(1);

        std::cout << "Core module test completed. Check your cursor and focused window." << std::endl;
    } catch(const std::exception& e) {
        std::cerr << "CRITICAL ERROR: " << e.what() << std::endl;
        return 1;
    }
    return 0;
}
