cmake_minimum_required(VERSION 3.15)
project(WayKeyCore VERSION 1.0 LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED True)

add_library(waykey_core STATIC
    src/VirtualDevice.cpp
)
target_include_directories(waykey_core PUBLIC src)

# Test executable (used directly without N-API)
add_executable(waykey_test src/main.cpp)
target_link_libraries(waykey_test PRIVATE waykey_core)

include(FetchContent)
FetchContent_Declare(
  googletest
  URL https://github.com/google/googletest/archive/e2239ee6043f73722e7aa812a459f54a28552929.zip
)
# For Windows: Prevent overriding the parent project's compiler/linker settings
set(gtest_force_shared_crt ON CACHE BOOL "" FORCE)
FetchContent_MakeAvailable(googletest)

enable_testing()

add_executable(
  waykey_unit_tests
  tests/test_virtual_device.cpp
)
target_link_libraries(
  waykey_unit_tests
  gtest_main
  waykey_core
)

include(GoogleTest)
gtest_discover_tests(waykey_unit_tests)

