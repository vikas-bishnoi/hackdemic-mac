// setAffinity.cc
#include <napi.h>
#include <windows.h>

Napi::Boolean SetWindowAffinity(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();

    if (info.Length() < 2 ||
        !info[0].IsBigInt() ||
        !info[1].IsBoolean()) {
        Napi::TypeError::New(env, "Expected (BigInt hwnd, boolean allowScreenshots)").ThrowAsJavaScriptException();
        return Napi::Boolean::New(env, false);
    }

    bool lossless;
    HWND hwnd = reinterpret_cast<HWND>((void*)info[0].As<Napi::BigInt>().Uint64Value(&lossless));
    bool allow = info[1].As<Napi::Boolean>().Value();

    BOOL success = SetWindowDisplayAffinity(hwnd, allow ? WDA_NONE : WDA_MONITOR);

    return Napi::Boolean::New(env, success);
}

Napi::Object Init(Napi::Env env, Napi::Object exports) {
    exports.Set("setWindowAffinity", Napi::Function::New(env, SetWindowAffinity));
    return exports;
}

NODE_API_MODULE(setaffinity, Init)
