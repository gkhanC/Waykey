#pragma once

#include <string>
#include <linux/input.h>
#include <linux/uinput.h>
#include <cstdint>

/**
 * @brief VirtualDevice class for simulating hardware input via /dev/uinput.
 * 
 * This class provides high-level methods to emit keyboard and mouse events
 * that are treated as hardware-level inputs by the Linux kernel.
 */
class VirtualDevice {
public:
    VirtualDevice();
    ~VirtualDevice();

    /**
     * @brief Initializes the virtual device by opening /dev/uinput and configuring it.
     * @throws std::runtime_error if the device cannot be initialized.
     */
    void setup();

    // Disable copy and assignment for RAII safety
    VirtualDevice(const VirtualDevice&) = delete;
    VirtualDevice& operator=(const VirtualDevice&) = delete;

    /**
     * @brief Emits a key press or release event.
     * @param keycode The Linux input key code (e.g., KEY_A).
     * @param isDown True for press, false for release.
     */
    void emitKey(int keycode, bool isDown);

    /**
     * @brief Emits a relative mouse movement event.
     * @param dx Relative movement in X axis.
     * @param dy Relative movement in Y axis.
     */
    void emitMouseMove(int dx, int dy);

    /**
     * @brief Emits a vertical mouse scroll (wheel) event.
     * @param delta Scroll amount (positive for up, negative for down).
     */
    void emitMouseScroll(int delta);

    /**
     * @brief Emits a generic input event.
     * @param type Event type (EV_KEY, EV_REL, etc.).
     * @param code Event code (KEY_A, REL_X, etc.).
     * @param value Event value.
     */
    void emitEvent(uint16_t type, uint16_t code, int32_t value);

    /**
     * @brief Emits a synchronization event (EV_SYN/SYN_REPORT).
     */
    void emitSync();

private:
    int m_fd = -1;
    void setupDevice();
};
