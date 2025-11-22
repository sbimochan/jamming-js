// ============================================================================
// FIREBASE CONFIGURATION
// ============================================================================

const FIREBASE_CONFIG = {
  apiKey: "AIzaSyCKqmjZUw-oUw2rCNag8XVRQc2S-fPcz8w",
  authDomain: "jammingjs-52efa.firebaseapp.com",
  databaseURL: "https://jammingjs-52efa.firebaseio.com",
  projectId: "jammingjs-52efa",
  storageBucket: "jammingjs-52efa.appspot.com",
  messagingSenderId: "690797988767"
};

// ============================================================================
// FIREBASE INITIALIZATION
// ============================================================================

function initializeFirebase() {
  if (typeof firebase === "undefined") {
    console.error("Firebase SDK not loaded");
    return null;
  }

  try {
    firebase.initializeApp(FIREBASE_CONFIG);
    return firebase.database().ref().child("composition");
  } catch (error) {
    console.error("Error initializing Firebase:", error);
    return null;
  }
}

// ============================================================================
// SONG LIST MANAGER
// ============================================================================

class SongListManager {
  constructor(compositionManager) {
    this.compositionManager = compositionManager;
    this.songListDiv = document.getElementById("songList");
    this.songList = null;
    this.dbRef = null;
    this.initialize();
  }

  initialize() {
    if (!this.songListDiv) {
      console.error("Song list container not found");
      return;
    }

    this.createSongList();
    this.setupFirebaseListener();
  }

  createSongList() {
    // Clear existing list
    this.songListDiv.innerHTML = "<h2>Firebase songs</h2><br>";

    // Create new list
    this.songList = document.createElement("ul");
    this.songList.style.listStyleType = "none";
    this.songList.id = "songListItems";
    this.songListDiv.appendChild(this.songList);
  }

  setupFirebaseListener() {
    this.dbRef = initializeFirebase();
    if (!this.dbRef) {
      this.showError("Firebase not available");
      return;
    }

    this.dbRef.on("value", (snapshot) => {
      this.handleSnapshot(snapshot);
    });
  }

  handleSnapshot(snapshot) {
    // Clear existing songs
    this.songList.innerHTML = "";

    const numOfSongs = snapshot.numChildren();
    if (numOfSongs === 0) {
      this.showEmptyState();
      return;
    }

    const songs = snapshot.val();
    Object.entries(songs).forEach(([songId, songData]) => {
      this.createSongButton(songId, songData.song);
    });
  }

  createSongButton(songId, songData) {
    const listItem = document.createElement("li");
    const songButton = document.createElement("button");
    songButton.className = "songs";
    songButton.textContent = songId;

    const lineBreak = document.createElement("br");
    songButton.appendChild(lineBreak);

    songButton.addEventListener("click", () => {
      this.loadSong(songData);
    });

    listItem.appendChild(songButton);
    this.songList.appendChild(listItem);
  }

  loadSong(songData) {
    try {
      const compositionData = JSON.parse(songData);
      if (!Array.isArray(compositionData)) {
        throw new Error("Invalid composition format");
      }

      // loadComposition automatically starts playback after loading
      this.compositionManager.loadComposition(compositionData);
    } catch (error) {
      console.error("Error loading song:", error);
      alert("Error loading song. Please check the data format.");
    }
  }

  showEmptyState() {
    const emptyMessage = document.createElement("li");
    emptyMessage.textContent = "No songs available";
    emptyMessage.style.fontStyle = "italic";
    emptyMessage.style.color = "#999";
    this.songList.appendChild(emptyMessage);
  }

  showError(message) {
    const errorMessage = document.createElement("li");
    errorMessage.textContent = message;
    errorMessage.style.color = "#f00";
    this.songList.appendChild(errorMessage);
  }
}

// ============================================================================
// INITIALIZATION
// ============================================================================

// Wait for DOM and index.js to be loaded
document.addEventListener("DOMContentLoaded", () => {
  // Wait a bit for index.js to initialize compositionManager
  setTimeout(() => {
    if (typeof window.compositionManager !== "undefined") {
      new SongListManager(window.compositionManager);
    } else {
      console.error("CompositionManager not found. Make sure index.js is loaded first.");
    }
  }, 100);
});
