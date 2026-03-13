#include "VirtualDevice.h"
#include <fcntl.h>
#include <unistd.h>
#include <cstring>
#include <stdexcept>
#include <iostream>

VirtualDevice::VirtualDevice() {
}

VirtualDevice::~VirtualDevice() {
    if (m_fd >= 0) {
        ioctl(m_fd, UI_DEV_DESTROY);
        close(m_fd);
    }
}

void VirtualDevice::setup() {
    setupDevice();
}

void VirtualDevice::setupDevice() {
    m_fd = open("/dev/uinput", O_WRONLY | O_NONBLOCK);
    if (m_fd < 0) {
        throw std::runtime_error("Cannot open /dev/uinput. Make sure you have permissions (apply udev rules) and you are in the 'input' group.");
    }

    // Enable key events, relative mouse events, and synchronization
    ioctl(m_fd, UI_SET_EVBIT, EV_KEY);
    ioctl(m_fd, UI_SET_EVBIT, EV_REL);
    ioctl(m_fd, UI_SET_EVBIT, EV_SYN);

    // Register standard keys (KEY_RESERVED to KEY_MAX)
    // We register a wide range to be safe.
    for (int i = 0; i < KEY_MAX; i++) {
        ioctl(m_fd, UI_SET_KEYBIT, i);
    }
    
    // Register mouse buttons explicitly just in case they aren't in the range above
    ioctl(m_fd, UI_SET_KEYBIT, BTN_LEFT);
    ioctl(m_fd, UI_SET_KEYBIT, BTN_RIGHT);
    ioctl(m_fd, UI_SET_KEYBIT, BTN_MIDDLE);
    ioctl(m_fd, UI_SET_KEYBIT, BTN_SIDE);
    ioctl(m_fd, UI_SET_KEYBIT, BTN_EXTRA);

    // Configure relative axes (mouse movement and wheel)
    ioctl(m_fd, UI_SET_RELBIT, REL_X);
    ioctl(m_fd, UI_SET_RELBIT, REL_Y);
    ioctl(m_fd, UI_SET_RELBIT, REL_WHEEL);
    ioctl(m_fd, UI_SET_RELBIT, REL_HWHEEL); // Horizontal wheel

    struct uinput_setup usetup;
    memset(&usetup, 0, sizeof(usetup));
    usetup.id.bustype = BUS_USB;
    usetup.id.vendor = 0x1234;
    usetup.id.product = 0x5678;
    strncpy(usetup.name, "WayKey Virtual Device", UINPUT_MAX_NAME_SIZE);

    if (ioctl(m_fd, UI_DEV_SETUP, &usetup) < 0) {
        close(m_fd);
        throw std::runtime_error("UI_DEV_SETUP failed");
    }

    if (ioctl(m_fd, UI_DEV_CREATE) < 0) {
        close(m_fd);
        throw std::runtime_error("UI_DEV_CREATE failed");
    }
    
    // Wait for the OS to initialize the device
    usleep(100000); 
}

void VirtualDevice::emitEvent(uint16_t type, uint16_t code, int32_t value) {
    if (m_fd < 0) return;
    struct input_event ie;
    memset(&ie, 0, sizeof(ie));
    ie.type = type;
    ie.code = code;
    ie.value = value;
    if (write(m_fd, &ie, sizeof(ie)) < 0) {
        // Log error silently or handle it
    }
}

void VirtualDevice::emitSync() {
    emitEvent(EV_SYN, SYN_REPORT, 0);
}

void VirtualDevice::emitKey(int keycode, bool isDown) {
    emitEvent(EV_KEY, keycode, isDown ? 1 : 0);
    emitSync();
}

void VirtualDevice::emitMouseMove(int dx, int dy) {
    if (dx != 0) emitEvent(EV_REL, REL_X, dx);
    if (dy != 0) emitEvent(EV_REL, REL_Y, dy);
    emitSync();
}

void VirtualDevice::emitMouseScroll(int delta) {
    if (delta != 0) {
        emitEvent(EV_REL, REL_WHEEL, delta);
        emitSync();
    }
}
