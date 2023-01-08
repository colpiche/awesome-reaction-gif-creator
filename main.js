import { createFFmpeg, fetchFile } from "@ffmpeg/ffmpeg";

var theStream;
var theGif;
let allTheBlobs = [];
// const ffmpeg = createFFmpeg({ log: true });
const ffmpeg = createFFmpeg({
    mainName: 'main',
    corePath: 'https://unpkg.com/@ffmpeg/core-st@0.11.0/dist/ffmpeg-core.js',
    log: true
});

// Called at script's loading
window.addEventListener("load", getStream, false);

// Event listeners for buttons
document.getElementById("initCamera").addEventListener("click", getStream, false);
document.getElementById("takePhotoButton").addEventListener("click", takePhoto, false);
document.getElementById("createGIFButton").addEventListener('click', encodeGIF, false);
document.getElementById("downloadButton").addEventListener('click', download, false);


function getStream(type) {
    /*
    Method initializing the video stream from the camera.
    */

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

            // Updating page layout when cam is ready
            document.querySelector('.beforeCamInit').style.display = "none";
            document.querySelector('#camDiv').style.display = "flex";
            document.querySelector('.afterCamInit').style.display = "flex";
        })
        .catch(function (err) {
            alert('Error: ' + err);
        });
}


function getUserMedia(constraints) {
    /*
    Method detecting which API will be used for the video stream.
    */

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


function takePhoto() {
    /*
    Method capturing a still from the video stream.
    */

    if (!('ImageCapture' in window)) {
        alert('\
            ImageCapture is not available. \
            Visit https://caniuse.com/imagecapture to find a compatible browser.\
        ');
        return;
    }

    if (!theStream) {
        alert('Grab the video stream first!');
        return;
    }

    // Selecting the stream to capture
    var theImageCapturer = new ImageCapture(theStream.getVideoTracks()[0]);

    // Capturing the still
    theImageCapturer.takePhoto()
        .then(blob => {
            // Displaying the captured still on the page
            var thePhoto = document.getElementById("photo");
            thePhoto.src = URL.createObjectURL(blob);

            // Pushing the captured still in a list of blobs which will be
            // passed to the GIF encoder
            allTheBlobs.push(blob);

            // Updating the layout to display next UX step
            document.querySelector('#photoDiv').style.display = "flex";
        })
        .catch(err => alert('Error: ' + err));
}


async function encodeGIF() {
    /*
    Method rendering the so wanted GIF from a list of blobs filled by takePhoto()
    */

    // Checking if the list is empty
    if (allTheBlobs.length === 0) {
        alert('Take photos first!');
        return;
    }

    // Loading the ffmpeg.wasm library, or not
    if (!ffmpeg.isLoaded()) {
        await ffmpeg.load();
    }

    // Writing the blobs in files inside the cache
    for (let i = 0; i < allTheBlobs.length; i += 1) {
        const num = `${i}`;
        ffmpeg.FS('writeFile', `${num}.png`, await fetchFile(allTheBlobs[i]));
    }

    // Encoding the so wanted GIF
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

    // Updating the page layout to display the GIF
    theGif = document.getElementById('gif');
    theGif.src = URL.createObjectURL(new Blob([data.buffer], { type: 'image/gif' }));
    document.querySelector('#gifDiv').style.display = "flex";

    allTheBlobs = [];
}


function download() {
    /*
    Method to trigger the so wanted GIF download.
    */

    var a = document.createElement("a");
    document.body.appendChild(a);
    a.style = "display: none";
    a.href = theGif.src;
    a.download = 'your-awesome-reaction-gif.gif';
    a.click();
}
