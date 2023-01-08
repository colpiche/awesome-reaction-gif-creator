# Awesome reaction GIF creator
Source code of [https://awesomereactiongifcreator.netlify.app/](https://awesomereactiongifcreator.netlify.app/), web app to easily create a stunning reaction GIF of your face.

## Browser's compatibility

| Browser | Result | Remark |
| ------- | ------ | ------ |
| Chrome desktop 108 | :heavy_check_mark: |  |
| Chrome Android 108 | :x: | "WebAssembly.Memory(): could not allocate memory" when clicking the "Create GIF" button |
| Firefox desktop 108 | :x:| Image Capture API not supported |
| Firefox Android 108 | :x: | Image Capture API not supported |


## To do :
- Fix the "WebAssembly.Memory(): could not allocate memory" error in Chrome Android 108 when clicking the "Create GIF" button
- Maybe find another library to encode the gif file.  Shared Array Buffer and cross-origin isolation required for ffmpeg.wasm seem to cause lot of troubles.