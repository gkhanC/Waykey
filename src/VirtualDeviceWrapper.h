#pragma once
#include <napi.h>
#include "VirtualDevice.h"

class VirtualDeviceWrapper : public Napi::ObjectWrap<VirtualDeviceWrapper> {
public:
    static Napi::Object Init(Napi::Env env, Napi::Object exports);
    VirtualDeviceWrapper(const Napi::CallbackInfo& info);
    ~VirtualDeviceWrapper() = default;

private:
    Napi::Value EmitKey(const Napi::CallbackInfo& info);
    Napi::Value EmitMouseMove(const Napi::CallbackInfo& info);
    Napi::Value EmitMouseScroll(const Napi::CallbackInfo& info);
    Napi::Value EmitEvent(const Napi::CallbackInfo& info);

    VirtualDevice m_device;
};
