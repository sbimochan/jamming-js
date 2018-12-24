class Sound {
  constructor(context) {
    this.context = context;
  }
  init() {
    this.oscillator = this.context.createOscillator();
    this.gainNode = this.context.createGain();
    this.analyser = this.context.createAnalyser();
    this.distortion = this.context.createWaveShaper();
    //connection to middle filters
    this.oscillator.connect(this.analyser);
    this.analyser.connect(this.distortion);
    this.distortion.connect(this.gainNode);
    this.gainNode.connect(this.context.destination);
  }
  play(hertz, time, cents, endTime) {
    this.init();
    this.oscillator.frequency.setValueAtTime(hertz, this.context.currentTime);
    this.oscillator.detune.setValueAtTime(cents, this.context.currentTime);
    this.gainNode.gain.setValueAtTime(1, this.context.currentTime); // currentTime is 2x accurate than Date
    this.oscillator.start(time);
    // endTime=1;
    this.stop(time, endTime);
  }
  stop(time, endTime) {
    this.gainNode.gain.exponentialRampToValueAtTime(0.1, time + endTime);
    this.oscillator.stop(time + endTime);
  }
}
class NewColumn {
  constructor() {
    this.addColumn = document.createElement('button');
    this.addColumn.setAttribute('class', 'column newColumnAdder');
    this.clef = document.createElement('img');
    this.clef.src = 'images/clef.png';
    this.clef.style.width = '70%';
    this.addColumn.appendChild(this.clef);
    composeSection[0].appendChild(this.addColumn);
  }
}
class Exporter {
  constructor() {
    this.exporterDiv = document.createElement('div');
    container.appendChild(this.exporterDiv);
    this.button = document.createElement('a');
    this.button.innerHTML = 'Save your song';
    this.exporterDiv.id = 'exporter';
    this.exporterDiv.appendChild(this.button);
  }
}
class Note {
  constructor() {
    this.noteButtons = document.createElement('div');
    this.noteButtons.style.padding = '10px';
    this.noteButtons.className = 'note';
    this.noteButtons.style.margin = '5px';
    this.isClicked = false;
  }
}
class MainSound {
  constructor() {
    this.waveform = 'sine';
    this.mainSoundDiv = document.createElement('div');
    this.mainSoundDiv.className = 'mainSoundDiv';
    this.mainSoundDiv.innerHTML = 'Main sound: ';
    mainSoundContainer.appendChild(this.mainSoundDiv);
    this.toneSelector = document.createElement('select');
    for (const prop in sounds) {
      this.option = document.createElement('option');
      this.option.innerHTML = sounds[prop];
      this.option.value = prop;
      this.toneSelector.appendChild(this.option);
    }
    this.mainSoundDiv.appendChild(this.toneSelector);
    this.toneSelector.addEventListener('change', () => {
      columnNotesArray.map(column => {
        column.waveform = this.toneSelector.value; // changing instrument
        column.toneSelector.value = this.toneSelector.value;
      });
    });
  }
}
let isInitialExecuted = false;
class ColumnNote {
  constructor(hertzArr, waveform, noteTime, noteTimeLength) {
    this.composedHertzArray = new Set();
    this.noteTime = 1;
    this.noteTimeLength = 1000;
    this.waveform = 'sine';
    //for file load and play
    if (
      typeof hertzArr != 'undefined' &&
      typeof waveform != 'undefined' &&
      typeof noteTime != 'undefined' &&
      noteTimeLength != 'undefined'
    ) {
      this.waveform = waveform;
      this.composedHertzArray.add(hertzArr);
      this.noteTime = noteTime;
      this.noteTimeLength = noteTimeLength;
      durations.push(noteTimeLength);
    }
    this.column = document.createElement('div');
    this.column.setAttribute('class', 'column notes-container');
    composeSection[0].appendChild(this.column);
    this.toneSelector = document.createElement('select');
    this.toneSelector.style.width = '100px';
    for (const prop in sounds) {
      this.option = document.createElement('option');
      this.option.innerHTML = sounds[prop];
      this.option.value = prop;
      this.toneSelector.appendChild(this.option);
    }
    this.column.appendChild(this.toneSelector);
    this.toneSelector.addEventListener('change', () => {
      this.waveform = this.toneSelector.value; //changing instrument
    });
    for (const prop in notes) {
      // or notesCollection
      let note = new Note();
      note.noteButtons.innerHTML = notes[prop]; // name on view .or prop
      note.noteButtons.value = prop; // value of button. or notesCollection[prop]
      this.column.appendChild(note.noteButtons);
      let noteValue = note.noteButtons.value;
      let hertzIndex = notesCollection[noteValue];
      note.noteButtons.addEventListener('click', () => {
        note.isClicked = !note.isClicked;
        if (!isInitialExecuted) {
          // to start playing only on first click
          playComposition();
          isInitialExecuted = true;
        }
        if (note.isClicked) {
          this.composedHertzArray.add(hertzIndex);
        } else {
          // Find and remove it from array
          this.composedHertzArray.delete(
            notesCollection[note.noteButtons.value]
          );
        }
      });
      note.noteButtons.addEventListener('click', () => {
        if (note.noteButtons.classList.contains('note')) {
          note.noteButtons.classList.toggle('selected');
        }
      });
      if (this.composedHertzArray.has(hertzIndex)) {
        note.noteButtons.classList.toggle('selected');
      }
    }
    this.noteDuration = document.createElement('select');
    this.noteDuration.style.width = '60px';
    for (const prop in noteTypes) {
      this.option = document.createElement('option');
      this.option.innerHTML = noteTypes[prop];
      this.option.value = prop;
      this.noteDuration.appendChild(this.option);
    }
    this.column.appendChild(this.noteDuration);
    this.trash = document.createElement('button');
    this.trash.setAttribute('class', 'danger');
    this.trashIconHolder = document.createElement('span');
    this.trashIconHolder.innerHTML =
      "<i class='fa fa-trash-o' aria-hidden='true'></i>";
    this.trash.appendChild(this.trashIconHolder);
    this.column.appendChild(this.trash);
  }
}

let context = new(window.AudioContext || window.webkitAudioContext)();
let sound = new Sound(context);
let composedButton = document.getElementsByClassName('note');
let composeSection = document.getElementsByClassName('compose-section');
let container = document.getElementById('container');
let columnDiv = document.getElementsByClassName('column');
let mainSoundContainer = document.getElementById('mainSoundContainer');
let noteButtonsid = document.getElementById('noteButtons');
const notes = {
  C4: 'C',
  D4: 'D',
  E4: 'E',
  F4: 'F',
  G4: 'G',
  A4: 'A',
  B4: 'B',
  C5: 'C'
};

const sounds = {
  sine: 'peace',
  triangle: 'smooth',
  square: 'retro',
  sawtooth: 'Stranger Things'
};

const noteTypes = {
  '1': 'whole note',
  '0.5': 'half note',
  '0.25': 'quarter note'
};

let mainSound = new MainSound();
let columnNotesArray = [];
let newColumn = new NewColumn(); //Adder
let exporter = new Exporter();

exporter.button.addEventListener('click', () => {
  //to write into json
  let data =
    'text/json;charset=utf-8,' +
    encodeURIComponent(JSON.stringify(columnNotesArray));
  exporter.button.href = 'data:' + data;
  exporter.button.download = 'song.json';
  firebase
    .database()
    .ref()
    .child('composition/' + ID())
    .set({
      song: JSON.stringify(columnNotesArray)
    });
});

var ID = function() {
  return (
    '_' +
    Math.random()
    .toString(36)
    .substr(2, 9)
  );
};

let durations = [];
newColumn.addColumn.addEventListener('click', () => {
  let columnNote = new ColumnNote();
  columnNotesArray.push(columnNote);
  durations.push(columnNote.noteTimeLength); //durations
  columnNote.trash.addEventListener('click', () => {
    durations.splice(columnNotesArray.indexOf(columnNote), 1);
    columnNotesArray.splice(columnNotesArray.indexOf(columnNote), 1);
    columnNote.column.style.display = 'none';
  });
  columnNote.noteDuration.addEventListener('change', () => {
    durations.splice(columnNotesArray.indexOf(columnNote), 1); //durations splice
    columnNote.noteTime = Number(columnNote.noteDuration.value);
    columnNote.noteTimeLength = columnNote.noteTime * 1000;
    durations.splice(
      columnNotesArray.indexOf(columnNote),
      0,
      columnNote.noteTimeLength
    );
  });
});

// let tempoInterval;
tempoSlider = document.getElementById('tempo');
tempoSlider.min = 10;
tempoSlider.max = 400;
tempoSlider.value = 60;
tempoSlider.step = 10;

detuneSlider = document.getElementById('detune');
detuneSlider.min = -900;
detuneSlider.max = 900;
detuneSlider.value = 0;
detuneSlider.step = 50;
let oldValue = 1;

/**Tempo */
tempoSlider.addEventListener('change', () => {
  sendTempoValue = tempoSlider.value;
  value = sendTempoValue / 60;
  durations.forEach((item, index, arr) => {
    arr[index] = (item * oldValue) / value;
  });
  for (let i = 0; i < durations.length; i++) {
    columnNotesArray[i].noteTimeLength =
      (columnNotesArray[i].noteTimeLength * oldValue) / value;
  }
  oldValue = value;
});
let i = 0;
let index = 0;

function playComposition() {
  if (columnNotesArray.length !== 0) {
    let now = context.currentTime;
    if (i !== 0) {
      columnNotesArray[i - 1].column.style.backgroundColor = '#f3f3f3';
    } else {
      columnNotesArray[
        columnNotesArray.length - 1
      ].column.style.backgroundColor = '#f3f3f3';
    }

    if (columnNotesArray[i] && columnNotesArray[i].column) {
      columnNotesArray[i].column.style.backgroundColor = '#e5f6ff';
    }
    for (const hertz of columnNotesArray[i].composedHertzArray) {
      sound.play(
        hertz,
        now,
        detuneSlider.value,
        columnNotesArray[i].noteTime
      ); //third param = detune in cents
      sound.oscillator.type = columnNotesArray[i].waveform;
    }
    // console.log(durations);
    setTimeout(playComposition, durations[index]);
    i++;
    index++;
    if (index >= durations.length) {
      index = 0;
    }
    if (i >= columnNotesArray.length) {
      i = 0;
    }
  }
}

/*To load JSON file*/
let importer = document
  .getElementById('import')
  .addEventListener('click', () => {
    let file = document.getElementById('input_file').files;
    if (file.length != 1) {
      return false;
    }

    let fr = new FileReader();
    fr.onload = progressEvent => {
      let results = JSON.parse(progressEvent.target.result);
      results.forEach(result => {
        let column = new ColumnNote(
          result.composedHertzArray,
          result.waveform,
          result.noteTime,
          result.noteTimeLength
        );
        columnNotesArray.push(column);
      });
    };
    fr.readAsText(file.item(0));
    setTimeout(playComposition, 100);
  });

function printValue(sliderID, spanID, unit) {
  let slider = document.getElementById(sliderID);
  let output = document.getElementById(spanID);
  output.innerHTML = slider.value + unit;
  return output.value;
}

function reset() {
  columnNotesArray = [];
  durations = [];
  const columns = document.getElementsByClassName('notes-container');
  while (columns.length > 0) {
    document.getElementsByClassName('compose-section')[0].removeChild(columns[0]);
  }
  isInitialExecuted = false;
}
