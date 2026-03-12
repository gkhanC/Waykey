{
  "targets": [
    {
      "target_name": "waykey_core",
      "sources": [
        "src/addon.cpp",
        "src/VirtualDeviceWrapper.cpp",
        "src/VirtualDevice.cpp"
      ],
      "include_dirs": [
        "<!@(node -p \"require('node-addon-api').include\")",
        "src"
      ],
      "dependencies": [
        "<!(node -p \"require('node-addon-api').gyp\")"
      ],
      "cflags!": [ "-fno-exceptions" ],
      "cflags_cc!": [ "-fno-exceptions" ],
      "defines": [ "NAPI_CPP_EXCEPTIONS" ]
    }
  ]
}
