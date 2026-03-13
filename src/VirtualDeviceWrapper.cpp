#include "VirtualDeviceWrapper.h"

Napi::Object VirtualDeviceWrapper::Init(Napi::Env env, Napi::Object exports) {
    Napi::Function func = DefineClass(env, "VirtualDevice", {
        InstanceMethod("emitKey", &VirtualDeviceWrapper::EmitKey),
        InstanceMethod("emitMouseMove", &VirtualDeviceWrapper::EmitMouseMove),
        InstanceMethod("emitMouseScroll", &VirtualDeviceWrapper::EmitMouseScroll),
        InstanceMethod("emitEvent", &VirtualDeviceWrapper::EmitEvent)
    });

    Napi::FunctionReference* constructor = new Napi::FunctionReference();
    *constructor = Napi::Persistent(func);
    env.SetInstanceData(constructor);

    exports.Set("VirtualDevice", func);
    return exports;
}

VirtualDeviceWrapper::VirtualDeviceWrapper(const Napi::CallbackInfo& info)
    : Napi::ObjectWrap<VirtualDeviceWrapper>(info), m_device() {
    try {
        m_device.setup();
    } catch (const std::exception& e) {
        Napi::Error::New(info.Env(), e.what()).ThrowAsJavaScriptException();
    }
}

Napi::Value VirtualDeviceWrapper::EmitKey(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    if (info.Length() < 2 || !info[0].IsNumber() || !info[1].IsBoolean()) {
        Napi::TypeError::New(env, "Number and Boolean expected").ThrowAsJavaScriptException();
        return env.Null();
    }
    
    int keycode = info[0].As<Napi::Number>().Int32Value();
    bool isDown = info[1].As<Napi::Boolean>().Value();
    
    m_device.emitKey(keycode, isDown);
    return env.Null();
}

Napi::Value VirtualDeviceWrapper::EmitMouseMove(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    if (info.Length() < 2 || !info[0].IsNumber() || !info[1].IsNumber()) {
        Napi::TypeError::New(env, "Two Numbers expected").ThrowAsJavaScriptException();
        return env.Null();
    }
    
    int dx = info[0].As<Napi::Number>().Int32Value();
    int dy = info[1].As<Napi::Number>().Int32Value();
    
    m_device.emitMouseMove(dx, dy);
    return env.Null();
}

Napi::Value VirtualDeviceWrapper::EmitMouseScroll(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    if (info.Length() < 1 || !info[0].IsNumber()) {
        Napi::TypeError::New(env, "Number expected").ThrowAsJavaScriptException();
        return env.Null();
    }
    
    int delta = info[0].As<Napi::Number>().Int32Value();
    m_device.emitMouseScroll(delta);
    return env.Null();
}

Napi::Value VirtualDeviceWrapper::EmitEvent(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    if (info.Length() < 3 || !info[0].IsNumber() || !info[1].IsNumber() || !info[2].IsNumber()) {
        Napi::TypeError::New(env, "Three Numbers expected").ThrowAsJavaScriptException();
        return env.Null();
    }
    
    uint16_t type = info[0].As<Napi::Number>().Uint32Value();
    uint16_t code = info[1].As<Napi::Number>().Uint32Value();
    int32_t value = info[2].As<Napi::Number>().Int32Value();
    
    m_device.emitEvent(type, code, value);
    m_device.emitSync();
    return env.Null();
}
