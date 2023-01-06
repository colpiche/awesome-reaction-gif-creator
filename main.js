import FFmpeg from "@ffmpeg/ffmpeg";


var theStream;
let allTheBlobs = [];


document.getElementById("initCamera").addEventListener("click", getStream, false);
document.getElementById("takePhoto").addEventListener("click", takePhoto, false);
document.getElementById("create-gif").addEventListener('click', encodeGIF, false);
// document.getElementById("grabAudio").addEventListener("click", () => getStream('audio'), false);



function getUserMedia(constraints) {
    // if Promise-based API is available, use it
    if (navigator.mediaDevices) {
        return navigator.mediaDevices.getUserMedia(constraints);
    }

    // otherwise try falling back to old, possibly prefixed API...
    var legacyApi = navigator.getUserMedia || navigator.webkitGetUserMedia ||
        navigator.mozGetUserMedia || navigator.msGetUserMedia;

    if (legacyApi) {
        // ...and promisify it
        return new Promise(function (resolve, reject) {
            legacyApi.bind(navigator)(constraints, resolve, reject);
        });
    }
}


function getStream(type) {
    if (!navigator.mediaDevices && !navigator.getUserMedia && !navigator.webkitGetUserMedia &&
        !navigator.mozGetUserMedia && !navigator.msGetUserMedia) {
        alert('User Media API not supported.');
        return;
    }

    var constraints = {
        video: true
    };

    getUserMedia(constraints)
        .then(function (stream) {
            var mediaControl = document.querySelector('video');

            if ('srcObject' in mediaControl) {
                mediaControl.srcObject = stream;
            } else if (navigator.mozGetUserMedia) {
                mediaControl.mozSrcObject = stream;
            } else {
                mediaControl.src = (window.URL || window.webkitURL).createObjectURL(stream);
            }

            // mediaControl.play();
            theStream = stream;
        })
        .catch(function (err) {
            alert('Error: ' + err);
        });
}

function takePhoto() {
    if (!('ImageCapture' in window)) {
        alert('ImageCapture is not available');
        return;
    }

    if (!theStream) {
        alert('Grab the video stream first!');
        return;
    }

    var theImageCapturer = new ImageCapture(theStream.getVideoTracks()[0]);

    theImageCapturer.takePhoto()
        .then(blob => {
            var theImageTag = document.getElementById("imageTag");
            theImageTag.src = URL.createObjectURL(blob);
            // console.log(blob);
            allTheBlobs.push(blob);
        })
        .catch(err => alert('Error: ' + err));
}

///////////////////////////////////////////////////////////////////////////////
// FFMPEG
///////////////////////////////////////////////////////////////////////////////

const { createFFmpeg, fetchFile } = FFmpeg;
const ffmpeg = createFFmpeg({ log: true });

const encodeGIF = async () => {
    const message = document.getElementById('message');
    message.innerHTML = 'Loading ffmpeg-core.js';
    await ffmpeg.load();
    message.innerHTML = 'Loading data';
    for (let i = 0; i < allTheBlobs.length; i += 1) {
        const num = `${i}`;
        ffmpeg.FS('writeFile', `${num}.png`, await fetchFile(allTheBlobs[i]));
    }
    message.innerHTML = 'Start transcoding';
    await ffmpeg.run(
        '-framerate', '2',
        '-pattern_type', 'glob',
        '-i', '*.png',
        '-s', '640x480',
        'out.gif'
    );
    const data = ffmpeg.FS('readFile', 'out.gif');
    for (let i = 0; i < allTheBlobs.length; i += 1) {
        const num = `${i}`;
        ffmpeg.FS('unlink', `${num}.png`);
    }

    const gif = document.getElementById('output-gif');
    gif.src = URL.createObjectURL(new Blob([data.buffer], { type: 'image/gif' }));
}
