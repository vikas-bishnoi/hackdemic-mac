{
  "targets": [
    {
      "target_name": "setaffinity",
      "sources": [ "setAffinity.cc" ],
      "include_dirs": [
        "./node_modules/node-addon-api" 
      ],
      "defines": [ "NAPI_DISABLE_CPP_EXCEPTIONS" ],
      "cflags_cc!": [ "-fno-exceptions" ],
      "dependencies": [
        "<!(node -p \"require('node-addon-api').gyp\")"
      ]
    }
  ]
}
