import { createFFmpeg, fetchFile } from "@ffmpeg/ffmpeg";



var theStream;
var gif;
let allTheBlobs = [];

const ffmpeg = createFFmpeg({ log: true });


// window.addEventListener("load", getStream, false);
// window.addEventListener("load", initCSS, false);
document.getElementById("initCamera").addEventListener("click", getStream, false);
document.getElementById("takePhotoButton").addEventListener("click", takePhoto, false);
document.getElementById("createGIFButton").addEventListener('click', encodeGIF, false);
document.getElementById("downloadButton").addEventListener('click', download, false);


function getStream(type) {
    if (!navigator.mediaDevices &&
        !navigator.getUserMedia &&
        !navigator.webkitGetUserMedia &&
        !navigator.mozGetUserMedia &&
        !navigator.msGetUserMedia
    ) {
        alert('User Media API not supported.');
        return;
    }

    var constraints = {
        video: true,
        audio: false
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

            theStream = stream;

            document.querySelector('.beforeCamInit').style.display = "none";
            document.querySelector('#camDiv').style.display = "flex";
            document.querySelector('.afterCamInit').style.display = "flex";
        })
        .catch(function (err) {
            alert('Error: ' + err);
        });
}


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


// function initCSS() {
//     // document.querySelector('.mediaToDisplayLater').style.display = "none";
//     document.querySelector('.afterCamInit').style.display = "none";
// }


function takePhoto() {
    if (!('ImageCapture' in window)) {
        alert('ImageCapture is not available. Visit https://caniuse.com/imagecapture to find a compatible browser.');
        return;
    }

    if (!theStream) {
        alert('Grab the video stream first!');
        return;
    }

    var theImageCapturer = new ImageCapture(theStream.getVideoTracks()[0]);

    theImageCapturer.takePhoto()
        .then(blob => {
            var thePhoto = document.getElementById("photo");
            thePhoto.src = URL.createObjectURL(blob);
            allTheBlobs.push(blob);
            document.querySelector('#photoDiv').style.display = "flex";
        })
        .catch(err => alert('Error: ' + err));
}


async function encodeGIF() {
    if (allTheBlobs.length === 0) {
        alert('Take photos first!');
        return;
    }

    if (!ffmpeg.isLoaded()) {
        await ffmpeg.load();
    }

    for (let i = 0; i < allTheBlobs.length; i += 1) {
        const num = `${i}`;
        ffmpeg.FS('writeFile', `${num}.png`, await fetchFile(allTheBlobs[i]));
    }

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

    gif = document.getElementById('gif');
    gif.src = URL.createObjectURL(new Blob([data.buffer], { type: 'image/gif' }));
    document.querySelector('#gifDiv').style.display = "flex";

    allTheBlobs = [];
}


function download() {
    var a = document.createElement("a");
    document.body.appendChild(a);
    a.style = "display: none";
    a.href = gif.src;
    a.download = 'your-awesome-reaction-gif.gif';
    a.click();
}
