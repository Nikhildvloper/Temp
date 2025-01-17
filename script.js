// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyBm9IzydkUehldXr_Gi_AJ-PX0FUGJax5A",
    authDomain: "watch-together-330a9.firebaseapp.com",
    databaseURL: "https://watch-together-330a9-default-rtdb.firebaseio.com",
    projectId: "watch-together-330a9",
    storageBucket: "watch-together-330a9.firebasestorage.app",
    messagingSenderId: "676714623194",
    appId: "1:676714623194:web:2a2088531e1c7a4f6335e3",
    measurementId: "G-F9QSQNQS36"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

const database = firebase.database();
const videoRef = database.ref('video');
const videoLinkRef = database.ref('videoLink');
const editBoxRef = database.ref('editBox');

let isSyncing = false;

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

function updateVideoState(videoElement, state) {
    clearTimeout(isSyncing);
    isSyncing = setTimeout(() => {
        videoRef.set({
            currentTime: videoElement.currentTime,
            state: state
        });
    }, 300); // Debounce interval
}

function syncVideoLink(videoElement, videoSource) {
    videoLinkRef.on('value', (snapshot) => {
        const data = snapshot.val();
        if (data) {
            videoSource.src = data;
            videoElement.load();
            videoElement.oncanplay = () => {
                videoElement.play();
            };
        }
    });
}

function updateVideoLink(videoLink) {
    videoLinkRef.set(videoLink);
}

function syncEditBox() {
    editBoxRef.on('value', (snapshot) => {
        const data = snapshot.val();
        if (data) {
            document.getElementById('text-editor').value = data;
        }
    });
}

function updateEditBox(videoLink) {
    editBoxRef.set(videoLink);
}

document.addEventListener('DOMContentLoaded', () => {
    const videoElement = document.getElementById('video-view');
    const videoSource = document.getElementById('video-source');

    // Load video from URL
    document.getElementById('load-video-btn').addEventListener('click', () => {
        const videoLink = document.getElementById('text-editor').value.trim();
        if (videoLink) {
            videoSource.src = videoLink;
            videoElement.load();
            videoElement.style.display = 'block';
            videoElement.play();
            updateVideoState(videoElement, 'playing');
            updateVideoLink(videoLink); // Broadcast the video link to all users
            updateEditBox(videoLink); // Share the video link to every user's edit box
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
            // Do not broadcast the local video link
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

    syncVideoState(videoElement);
    syncVideoLink(videoElement, videoSource); // Sync video link for all users
    syncEditBox(); // Sync the edit box for all users
});
