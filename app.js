import config from "./config";

(function() {
  // Initialize Firebase
  firebase.initializeApp(config);
})();
const preObject = document.getElementById("composeName");
const songListDiv = document.getElementById("songList");
// create reference
const dbRefObject = firebase
  .database()
  .ref()
  .child("composition");
let ul = document.createElement("ul");
ul.style = "list-style-type: none";
songListDiv.appendChild(ul);
// sync object changes with on menthod
// snap is data snapshot
dbRefObject.on("value", snap => {
  const numOfSong = snap.numChildren();
  if (numOfSong !== 0) {
    for (let i = 0; i < numOfSong; i++) {
      let li = document.createElement("li");
      let newSong = document.createElement("button");
      newSong.className = "songs";
      newSong.innerHTML = Object.keys(snap.val())[i];
      newSong.value = Object.values(snap.val())[i].song;
      linebreak = document.createElement("br");
      newSong.appendChild(linebreak);
      li.appendChild(newSong);
      ul.appendChild(li);
      newSong.addEventListener("click", () => {
        reset();
        let results = JSON.parse(newSong.value);
        results.forEach(result => {
          let column = new ColumnNote(
            result.composedHertzArray,
            result.waveform,
            result.noteTime,
            result.noteTimeLength
          );
          columnNotesArray.push(column);
        });
        setTimeout(playComposition, 100);
      });
    }
  }
});
