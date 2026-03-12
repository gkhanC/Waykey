#include <napi.h>
#include "VirtualDeviceWrapper.h"

Napi::Object InitAll(Napi::Env env, Napi::Object exports) {
    return VirtualDeviceWrapper::Init(env, exports);
}

NODE_API_MODULE(waykey_core, InitAll)
