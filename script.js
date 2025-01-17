// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyAnvbxwW94UfEHHJEsVFFruyP20taJPqZo",
    authDomain: "video-confrence-9e131.firebaseapp.com",
    databaseURL: "https://video-confrence-9e131-default-rtdb.firebaseio.com",
    projectId: "video-confrence-9e131",
    storageBucket: "video-confrence-9e131.firebasestorage.app",
    messagingSenderId: "299971534260",
    appId: "1:299971534260:web:2a751958721d1181c3a6e1",
    measurementId: "G-YHZFY3TSMT"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

const database = firebase.database();
const videoRef = database.ref('video');
const urlRef = database.ref('videoUrl');
const speedRef = database.ref('videoSpeed'); // Reference for video speed

let isSyncing = false;
let lastSyncedUrl = "";
let lastSyncedSpeed = 1; // Default video speed

// Function to sync video state
function syncVideoState(videoElement) {
    videoRef.on('value', (snapshot) => {
        const data = snapshot.val();
        if (data) {
            if (data.state === 'playing' && videoElement.paused) {
                videoElement.currentTime = data.currentTime;
                videoElement.play();
            } else if (data.state === 'paused' && !videoElement.paused) {
                videoElement.currentTime = data.currentTime;
                videoElement.pause();
            }
        }
    });
}

// Function to update video state
function updateVideoState(videoElement, state) {
    clearTimeout(isSyncing);
    isSyncing = setTimeout(() => {
        videoRef.set({
            currentTime: videoElement.currentTime,
            state: state
        });
    }, 300); // Debounce interval
}

// Function to sync video URL
function syncVideoUrl(inputElement) {
    urlRef.on('value', (snapshot) => {
        const data = snapshot.val();
        if (data && data !== lastSyncedUrl) {
            lastSyncedUrl = data;
            inputElement.value = data; // Update the edit box with the shared URL
        }
    });
}

// Function to update video URL
function updateVideoUrl(newUrl) {
    if (newUrl !== lastSyncedUrl) {
        lastSyncedUrl = newUrl;
        urlRef.set(newUrl);
    }
}

// Function to sync video speed
function syncVideoSpeed(videoElement) {
    speedRef.on('value', (snapshot) => {
        const data = snapshot.val();
        if (data && data !== lastSyncedSpeed) {
            lastSyncedSpeed = data;
            videoElement.playbackRate = data; // Update the video speed
        }
    });
}

// Function to update video speed
function updateVideoSpeed(videoElement) {
    const newSpeed = videoElement.playbackRate;
    if (newSpeed !== lastSyncedSpeed) {
        lastSyncedSpeed = newSpeed;
        speedRef.set(newSpeed);
    }
}

// DOMContentLoaded event handler
document.addEventListener('DOMContentLoaded', () => {
    const videoElement = document.getElementById('video-view');
    const videoSource = document.getElementById('video-source');
    const urlInput = document.getElementById('text-editor');

    // Load video from URL
    document.getElementById('load-video-btn').addEventListener('click', () => {
        const videoLink = urlInput.value.trim();
        if (videoLink) {
            videoSource.src = videoLink;
            videoElement.load();
            videoElement.style.display = 'block';
            videoElement.play();
            updateVideoState(videoElement, 'playing');
            updateVideoUrl(videoLink); // Share the URL with other users
        } else {
            alert('Please enter a valid video URL.');
        }
    });

    // Handle file input for local video selection
    document.getElementById('video-file').addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file) {
            const videoURL = URL.createObjectURL(file);
            videoSource.src = videoURL;
            videoElement.load();
            videoElement.style.display = 'block';
            videoElement.play();
            updateVideoState(videoElement, 'playing');
        }
    });

    videoElement.addEventListener('play', () => {
        updateVideoState(videoElement, 'playing');
    });

    videoElement.addEventListener('pause', () => {
        updateVideoState(videoElement, 'paused');
    });

    videoElement.addEventListener('seeked', () => {
        updateVideoState(videoElement, videoElement.paused ? 'paused' : 'playing');
    });

    videoElement.addEventListener('ratechange', () => {
        updateVideoSpeed(videoElement); // Sync speed when it changes
    });

    syncVideoState(videoElement);
    syncVideoUrl(urlInput);
    syncVideoSpeed(videoElement); // Sync speed on load
});
