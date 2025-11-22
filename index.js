// ============================================================================
// CONSTANTS
// ============================================================================

const AUDIO_CONFIG = {
  ATTACK_TIME: 0.005, // 5ms for smooth attack
  DECAY_TIME: 2.0,
  FADE_OUT_TIME: 0.02, // 20ms for smooth transitions
  MIN_GAIN: 0.001,
  INITIAL_GAIN: 0.3,
  SAMPLE_RATE: 44100,
  DISTORTION_AMOUNT: 400
};

const TEMPO_CONFIG = {
  MIN: 10,
  MAX: 400,
  DEFAULT: 60,
  STEP: 10
};

const DETUNE_CONFIG = {
  MIN: -900,
  MAX: 900,
  DEFAULT: 0,
  STEP: 50
};

const NOTE_DISPLAY_NAMES = {
  C4: "C",
  D4: "D",
  E4: "E",
  F4: "F",
  G4: "G",
  A4: "A",
  B4: "B",
  C5: "C"
};

const WAVEFORM_NAMES = {
  sine: "peace",
  triangle: "smooth",
  square: "retro",
  sawtooth: "Stranger Things",
  distortion: "Distortion"
};

const NOTE_DURATION_TYPES = {
  1: "whole note",
  0.5: "half note",
  0.25: "quarter note"
};

const COLORS = {
  DEFAULT_COLUMN: "#f3f3f3",
  ACTIVE_COLUMN: "#e5f6ff"
};

// ============================================================================
// AUDIO CLASSES
// ============================================================================

class Sound {
  constructor(context) {
    this.context = context;
    this.oscillator = null;
    this.gainNode = null;
    this.analyser = null;
    this.distortion = null;
  }

  init() {
    this.oscillator = this.context.createOscillator();
    this.gainNode = this.context.createGain();
    this.analyser = this.context.createAnalyser();
    this.distortion = this.context.createWaveShaper();

    // Connect audio nodes: oscillator -> analyser -> distortion -> gain -> destination
    this.oscillator.connect(this.analyser);
    this.analyser.connect(this.distortion);
    this.distortion.connect(this.gainNode);
    this.gainNode.connect(this.context.destination);
  }

  play(hertz, time, cents, endTime) {
    this.init();
    const start = time;

    // Set frequency and detune immediately for smooth transitions
    this.oscillator.frequency.setValueAtTime(hertz, start);
    this.oscillator.detune.setValueAtTime(cents, start);

    // Smooth fade-in to avoid clicks
    this.gainNode.gain.setValueAtTime(0, start);
    this.gainNode.gain.linearRampToValueAtTime(
      AUDIO_CONFIG.INITIAL_GAIN,
      start + AUDIO_CONFIG.ATTACK_TIME
    );
    this.gainNode.gain.exponentialRampToValueAtTime(
      AUDIO_CONFIG.MIN_GAIN,
      start + AUDIO_CONFIG.DECAY_TIME
    );

    this.oscillator.start(start);
    this.stop(start, endTime);
  }

  stop(time, endTime) {
    const stopTime = time + endTime;
    // Smooth fade out before stopping
    this.gainNode.gain.exponentialRampToValueAtTime(
      AUDIO_CONFIG.MIN_GAIN,
      stopTime - 0.01
    );
    this.oscillator.stop(stopTime);
  }

  fadeOut(fadeTime) {
    const now = this.context.currentTime;
    // Smooth fade out over fadeTime seconds
    this.gainNode.gain.cancelScheduledValues(now);
    this.gainNode.gain.setValueAtTime(this.gainNode.gain.value, now);
    this.gainNode.gain.linearRampToValueAtTime(
      AUDIO_CONFIG.MIN_GAIN,
      now + fadeTime
    );
    // Schedule stop after fade completes
    this.oscillator.stop(now + fadeTime + 0.001);
  }

  makeDistortionCurve(amount) {
    const n_samples =
      typeof sampleRate === "number" ? sampleRate : AUDIO_CONFIG.SAMPLE_RATE;
    const curve = new Float32Array(n_samples);
    const deg = Math.PI / 180;

    for (let i = 0; i < n_samples; i++) {
      const x = (i * 2) / n_samples - 1;
      curve[i] =
        ((3 + amount) * Math.atan(Math.sinh(x * 0.25) * 5)) /
        (Math.PI + amount * Math.abs(x));
    }
    return curve;
  }
}

// ============================================================================
// UI COMPONENT CLASSES
// ============================================================================

class Note {
  constructor() {
    this.noteButtons = document.createElement("div");
    this.noteButtons.style.padding = "10px";
    this.noteButtons.className = "note";
    this.noteButtons.style.margin = "5px";
    this.isClicked = false;
  }
}

class NewColumnAdder {
  constructor(composeSection) {
    this.composeSection = composeSection;
    this.addColumn = this.createAddColumnButton();
    this.composeSection.appendChild(this.addColumn);
  }

  createAddColumnButton() {
    const button = document.createElement("button");
    button.setAttribute("class", "column newColumnAdder");

    const clef = document.createElement("img");
    clef.src = "images/clef.png";
    clef.style.width = "70%";
    button.appendChild(clef);

    return button;
  }
}

class Exporter {
  constructor(container) {
    this.container = container;
    this.exporterDiv = this.createExporterDiv();
    this.button = this.createExportButton();
    this.setupExportHandler();
  }

  createExporterDiv() {
    const div = document.createElement("div");
    div.id = "exporter";
    this.container.appendChild(div);
    return div;
  }

  createExportButton() {
    const button = document.createElement("a");
    button.innerHTML = "Save your song";
    this.exporterDiv.appendChild(button);
    return button;
  }

  setupExportHandler() {
    this.button.addEventListener("click", () => {
      const data =
        "text/json;charset=utf-8," +
        encodeURIComponent(JSON.stringify(compositionManager.getColumns()));
      this.button.href = "data:" + data;
      this.button.download = "song.json";

      // Save to Firebase
      if (typeof firebase !== "undefined") {
        firebase
          .database()
          .ref()
          .child("composition/" + this.generateId())
          .set({
            song: JSON.stringify(compositionManager.getColumns())
          });
      }
    });
  }

  generateId() {
    return "_" + Math.random().toString(36).substr(2, 9);
  }
}

class MainSoundSelector {
  constructor(mainSoundContainer, compositionManager) {
    this.compositionManager = compositionManager;
    this.waveform = "sine";
    this.mainSoundDiv = this.createMainSoundDiv(mainSoundContainer);
    this.toneSelector = this.createToneSelector();
    this.setupChangeHandler();
  }

  createMainSoundDiv(container) {
    const div = document.createElement("div");
    div.className = "mainSoundDiv";
    div.innerHTML = "Main sound: ";
    container.appendChild(div);
    return div;
  }

  createToneSelector() {
    const selector = document.createElement("select");
    Object.entries(WAVEFORM_NAMES).forEach(([value, label]) => {
      const option = document.createElement("option");
      option.innerHTML = label;
      option.value = value;
      selector.appendChild(option);
    });
    this.mainSoundDiv.appendChild(selector);
    return selector;
  }

  setupChangeHandler() {
    this.toneSelector.addEventListener("change", () => {
      const selectedWaveform = this.toneSelector.value;
      this.compositionManager.updateAllWaveforms(selectedWaveform);
    });
  }
}

class ColumnNote {
  constructor(hertzArr, waveform, noteTime, noteTimeLength, composeSection) {
    // Use provided composeSection or fall back to global (for app.js compatibility)
    this.composeSection =
      composeSection ||
      (typeof window !== "undefined" &&
        window.composeSection &&
        window.composeSection[0]) ||
      document.getElementsByClassName("compose-section")[0];
    this.composedHertzArray = [];
    this.noteTime = 1;
    this.noteTimeLength = 1000;
    this.waveform = "sine";

    // Initialize from parameters if provided (for file load)
    if (
      hertzArr !== undefined &&
      waveform !== undefined &&
      noteTime !== undefined &&
      noteTimeLength !== undefined
    ) {
      this.waveform = waveform;
      this.composedHertzArray = [...hertzArr];
      this.noteTime = noteTime;
      this.noteTimeLength = noteTimeLength;
    }

    this.column = this.createColumn();
    this.toneSelector = this.createToneSelector();
    this.noteDuration = this.createNoteDurationSelector();
    this.trash = this.createTrashButton();

    this.setupNoteButtons();
    this.setupEventHandlers();
  }

  createColumn() {
    const column = document.createElement("div");
    column.setAttribute("class", "column notes-container");
    this.composeSection.appendChild(column);
    return column;
  }

  createToneSelector() {
    const selector = document.createElement("select");
    selector.style.width = "100px";
    Object.entries(WAVEFORM_NAMES).forEach(([value, label]) => {
      const option = document.createElement("option");
      option.innerHTML = label;
      option.value = value;
      selector.appendChild(option);
    });
    this.column.appendChild(selector);
    return selector;
  }

  createNoteDurationSelector() {
    const selector = document.createElement("select");
    selector.style.width = "60px";
    Object.entries(NOTE_DURATION_TYPES).forEach(([value, label]) => {
      const option = document.createElement("option");
      option.innerHTML = label;
      option.value = value;
      selector.appendChild(option);
    });
    this.column.appendChild(selector);
    return selector;
  }

  createTrashButton() {
    const button = document.createElement("button");
    button.setAttribute("class", "danger");
    const iconHolder = document.createElement("span");
    iconHolder.innerHTML = "<i class='fa fa-trash-o' aria-hidden='true'></i>";
    button.appendChild(iconHolder);
    this.column.appendChild(button);
    return button;
  }

  setupNoteButtons() {
    Object.entries(NOTE_DISPLAY_NAMES).forEach(([noteKey, displayName]) => {
      const note = new Note();
      note.noteButtons.innerHTML = displayName;
      note.noteButtons.value = noteKey;
      this.column.appendChild(note.noteButtons);

      const hertzIndex = notesCollection[noteKey];
      const isNoteSelected = this.composedHertzArray.indexOf(hertzIndex) !== -1;

      if (isNoteSelected) {
        note.noteButtons.classList.toggle("selected");
      }

      this.setupNoteClickHandler(note, hertzIndex);
    });
  }

  setupNoteClickHandler(note, hertzIndex) {
    note.noteButtons.addEventListener("click", () => {
      note.isClicked = !note.isClicked;

      if (!compositionManager.isPlaying()) {
        compositionManager.startPlayback();
      }

      if (note.isClicked) {
        this.composedHertzArray.push(hertzIndex);
      } else {
        const index = this.composedHertzArray.indexOf(hertzIndex);
        if (index !== -1) {
          this.composedHertzArray.splice(index, 1);
        }
      }

      note.noteButtons.classList.toggle("selected");
    });
  }

  setupEventHandlers() {
    this.toneSelector.addEventListener("change", () => {
      this.waveform = this.toneSelector.value;
    });
  }

  updateWaveform(waveform) {
    this.waveform = waveform;
    this.toneSelector.value = waveform;
  }

  remove() {
    this.column.style.display = "none";
  }
}

// ============================================================================
// COMPOSITION MANAGER
// ============================================================================

class CompositionManager {
  constructor(context, detuneSlider) {
    this.context = context;
    this.detuneSlider = detuneSlider;
    this.columns = [];
    this.durations = [];
    this.activeSounds = [];
    this.isPlaying = false;
    this.currentIndex = 0;
    this.playbackIndex = 0;
    this.tempoMultiplier = 1;
  }

  addColumn(columnNote) {
    this.columns.push(columnNote);
    this.durations.push(columnNote.noteTimeLength);
  }

  removeColumn(columnNote) {
    const index = this.columns.indexOf(columnNote);
    if (index !== -1) {
      this.durations.splice(index, 1);
      this.columns.splice(index, 1);
      columnNote.remove();
    }
  }

  updateColumnDuration(columnNote) {
    const index = this.columns.indexOf(columnNote);
    if (index !== -1) {
      this.durations.splice(index, 1);
      columnNote.noteTime = Number(columnNote.noteDuration.value);
      columnNote.noteTimeLength = columnNote.noteTime * 1000;
      this.durations.splice(index, 0, columnNote.noteTimeLength);
    }
  }

  updateTempo(newTempo, oldMultiplier) {
    const newMultiplier = newTempo / 60;
    this.durations.forEach((duration, index) => {
      this.durations[index] = (duration * oldMultiplier) / newMultiplier;
      this.columns[index].noteTimeLength =
        (this.columns[index].noteTimeLength * oldMultiplier) / newMultiplier;
    });
    this.tempoMultiplier = newMultiplier;
  }

  updateAllWaveforms(waveform) {
    this.columns.forEach((column) => {
      column.updateWaveform(waveform);
    });
  }

  getColumns() {
    return this.columns;
  }

  isPlaying() {
    return this.isPlaying;
  }

  startPlayback() {
    this.isPlaying = true;
    this.playComposition();
  }

  playComposition() {
    if (this.columns.length === 0) {
      this.isPlaying = false;
      return;
    }

    const now = this.context.currentTime;

    // Fade out previous sounds smoothly
    this.activeSounds.forEach((activeSound) => {
      if (activeSound && activeSound.oscillator) {
        activeSound.fadeOut(AUDIO_CONFIG.FADE_OUT_TIME);
      }
    });
    this.activeSounds = [];

    // Update column highlighting
    this.updateColumnHighlighting();

    const currentColumn = this.columns[this.currentIndex];
    if (!currentColumn) {
      this.isPlaying = false;
      return;
    }

    // Create a new Sound instance for each note in the chord
    currentColumn.composedHertzArray.forEach((hertz) => {
      const noteSound = new Sound(this.context);
      noteSound.play(
        hertz,
        now + AUDIO_CONFIG.FADE_OUT_TIME,
        this.detuneSlider.value,
        currentColumn.noteTime
      );

      // Apply waveform/distortion
      if (currentColumn.waveform === "distortion") {
        noteSound.oscillator.type = "sawtooth";
        noteSound.distortion.curve = noteSound.makeDistortionCurve(
          AUDIO_CONFIG.DISTORTION_AMOUNT
        );
      } else {
        noteSound.oscillator.type = currentColumn.waveform;
      }

      this.activeSounds.push(noteSound);
    });

    // Schedule next note
    const duration = this.durations[this.playbackIndex];
    setTimeout(() => {
      this.playComposition();
    }, duration);

    // Update indices
    this.currentIndex = (this.currentIndex + 1) % this.columns.length;
    this.playbackIndex = (this.playbackIndex + 1) % this.durations.length;
  }

  updateColumnHighlighting() {
    // Reset previous column
    if (this.currentIndex !== 0) {
      this.columns[this.currentIndex - 1].column.style.backgroundColor =
        COLORS.DEFAULT_COLUMN;
    } else {
      const lastColumn = this.columns[this.columns.length - 1];
      if (lastColumn) {
        lastColumn.column.style.backgroundColor = COLORS.DEFAULT_COLUMN;
      }
    }

    // Highlight current column
    const currentColumn = this.columns[this.currentIndex];
    if (currentColumn) {
      currentColumn.column.style.backgroundColor = COLORS.ACTIVE_COLUMN;
    }
  }

  loadComposition(compositionData) {
    this.reset();
    compositionData.forEach((data) => {
      const column = new ColumnNote(
        data.composedHertzArray,
        data.waveform,
        data.noteTime,
        data.noteTimeLength,
        composeSection[0]
      );
      this.addColumn(column);
    });
    setTimeout(() => this.startPlayback(), 100);
  }

  reset() {
    this.columns = [];
    this.durations = [];
    this.isPlaying = false;
    this.currentIndex = 0;
    this.playbackIndex = 0;

    const columns = document.getElementsByClassName("notes-container");
    while (columns.length > 0) {
      composeSection[0].removeChild(columns[0]);
    }
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function printValue(sliderID, spanID, unit) {
  const slider = document.getElementById(sliderID);
  const output = document.getElementById(spanID);
  if (slider && output) {
    output.innerHTML = slider.value + unit;
  }
}

function setupTempoSlider(tempoSlider, compositionManager) {
  tempoSlider.min = TEMPO_CONFIG.MIN;
  tempoSlider.max = TEMPO_CONFIG.MAX;
  tempoSlider.value = TEMPO_CONFIG.DEFAULT;
  tempoSlider.step = TEMPO_CONFIG.STEP;

  // Initialize display value
  printValue("tempo", "tempoValue", "bpm");

  let oldMultiplier = 1;

  tempoSlider.addEventListener("change", () => {
    const newTempo = tempoSlider.value;
    printValue("tempo", "tempoValue", "bpm");
    compositionManager.updateTempo(newTempo, oldMultiplier);
    oldMultiplier = newTempo / 60;
  });

  // Also update on input for real-time feedback
  tempoSlider.addEventListener("input", () => {
    printValue("tempo", "tempoValue", "bpm");
  });
}

function setupDetuneSlider(detuneSlider) {
  detuneSlider.min = DETUNE_CONFIG.MIN;
  detuneSlider.max = DETUNE_CONFIG.MAX;
  detuneSlider.value = DETUNE_CONFIG.DEFAULT;
  detuneSlider.step = DETUNE_CONFIG.STEP;

  // Initialize display value
  printValue("detune", "detuneValue", "cents");

  detuneSlider.addEventListener("change", () => {
    printValue("detune", "detuneValue", "cents");
  });

  // Also update on input for real-time feedback
  detuneSlider.addEventListener("input", () => {
    printValue("detune", "detuneValue", "cents");
  });
}

function setupFileImporter(compositionManager) {
  const importButton = document.getElementById("import");
  const fileInput = document.getElementById("input_file");

  if (!importButton || !fileInput) return;

  importButton.addEventListener("click", () => {
    const files = fileInput.files;
    if (files.length !== 1) {
      return;
    }

    if (compositionManager.getColumns().length > 0) {
      const confirm = window.confirm(
        "Are you sure you want to discard changes?"
      );
      if (!confirm) {
        return;
      }
    }

    const fileReader = new FileReader();
    fileReader.onload = (progressEvent) => {
      try {
        const results = JSON.parse(progressEvent.target.result);
        compositionManager.loadComposition(results);
      } catch (error) {
        console.error("Error parsing JSON file:", error);
        alert("Error loading file. Please check the file format.");
      }
    };
    fileReader.readAsText(files[0]);
  });
}

// ============================================================================
// INITIALIZATION
// ============================================================================

// DOM Elements
const composeSection = document.getElementsByClassName("compose-section");
const container = document.getElementById("container");
const mainSoundContainer = document.getElementById("mainSoundContainer");
const tempoSlider = document.getElementById("tempo");
const detuneSlider = document.getElementById("detune");

// Audio Context
const context = new (window.AudioContext || window.webkitAudioContext)();

// Initialize Composition Manager
const compositionManager = new CompositionManager(context, detuneSlider);

// Initialize UI Components
const mainSound = new MainSoundSelector(mainSoundContainer, compositionManager);
const newColumnAdder = new NewColumnAdder(composeSection[0]);
const exporter = new Exporter(container);

// Setup event handlers
newColumnAdder.addColumn.addEventListener("click", () => {
  const columnNote = new ColumnNote(
    undefined,
    undefined,
    undefined,
    undefined,
    composeSection[0]
  );
  compositionManager.addColumn(columnNote);

  columnNote.trash.addEventListener("click", () => {
    compositionManager.removeColumn(columnNote);
  });

  columnNote.noteDuration.addEventListener("change", () => {
    compositionManager.updateColumnDuration(columnNote);
  });
});

setupTempoSlider(tempoSlider, compositionManager);
setupDetuneSlider(detuneSlider);
setupFileImporter(compositionManager);

// Setup reset button
const resetButton = document.getElementById("resetBtn");
if (resetButton) {
  resetButton.addEventListener("click", () => {
    compositionManager.reset();
  });
}

// Make reset function globally available for backward compatibility
window.reset = () => {
  compositionManager.reset();
};

// Compatibility layer for app.js
window.ColumnNote = ColumnNote;
window.compositionManager = compositionManager;
window.composeSection = composeSection;
window.playComposition = () => {
  compositionManager.startPlayback();
};
// Expose columnNotesArray for backward compatibility with app.js
// Override push to sync durations when columns are added
const originalPush = compositionManager.columns.push.bind(
  compositionManager.columns
);
compositionManager.columns.push = function (...items) {
  const result = originalPush(...items);
  // Sync durations when columns are added
  items.forEach((item) => {
    if (item && item.noteTimeLength !== undefined) {
      compositionManager.durations.push(item.noteTimeLength);
    }
  });
  return result;
};
window.columnNotesArray = compositionManager.columns;
