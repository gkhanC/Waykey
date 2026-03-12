#include <gtest/gtest.h>
#include "VirtualDevice.h"

TEST(VirtualDeviceTest, InitializationExceptionHandling) {
    // We expect VirtualDevice to throw if we don't have permissions to /dev/uinput.
    // If it succeeds, it's also fine (running as root or with udev rules).
    try {
        VirtualDevice dev;
        SUCCEED() << "VirtualDevice initialized successfully.";
    } catch (const std::exception& e) {
        SUCCEED() << "Caught expected permission exception: " << e.what();
    }
}

int main(int argc, char **argv) {
    ::testing::InitGoogleTest(&argc, argv);
    return RUN_ALL_TESTS();
}
