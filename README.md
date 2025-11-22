# Jamming JS

A web-based music composition tool built with vanilla JavaScript and the Web Audio API. Create, play, and share musical compositions directly in your browser.

## Features

- **Interactive Music Composition**: Click notes to create chords and melodies
- **Multiple Waveforms**: Choose from different sound types (sine, triangle, square, sawtooth, distortion)
- **Tempo Control**: Adjust playback tempo from 10 to 400 BPM
- **Detune Control**: Fine-tune pitch with detune adjustment (-900 to +900 cents)
- **Note Durations**: Select whole notes, half notes, or quarter notes
- **Save & Load**: Export compositions as JSON files and load them back
- **Firebase Integration**: Save and share compositions via Firebase
- **Smooth Audio Transitions**: Advanced audio processing for seamless playback

## Technologies

- **Vanilla JavaScript** - No frameworks or libraries (except Firebase for cloud storage)
- **Web Audio API** - For audio synthesis and processing
- **Firebase** - For cloud storage and sharing
- **HTML5 & CSS3** - Modern web standards

## Project Structure

```
jamming-js/
├── index.html          # Main HTML structure
├── index.js            # Core application logic and classes
├── app.js              # Firebase integration and song list management
├── notevalues.js       # Note frequency mappings
├── css/                # Stylesheets
│   ├── reset.css
│   ├── style.css
│   └── font-awesome.min.css
├── fonts/              # Font Awesome fonts
└── images/             # Application images
```

## Usage

1. **Create a Column**: Click the clef icon to add a new column
2. **Select Notes**: Click on note buttons (C, D, E, F, G, A, B) to add them to your composition
3. **Choose Instrument**: Select a waveform type from the dropdown (peace, smooth, retro, etc.)
4. **Set Duration**: Choose note duration (whole, half, or quarter note)
5. **Adjust Tempo**: Use the tempo slider to control playback speed
6. **Play**: Click any note to start playback
7. **Save**: Click "Save your song" to export as JSON or save to Firebase
8. **Load**: Use the file input to load a previously saved composition

## Development

Built during an internship period at Leapfrog Technology Inc. The project was completed in 2 weeks without using any JavaScript libraries or frameworks (except Firebase for cloud functionality).

## Demo

Watch the demo on YouTube: [Jamming JS Demo](https://www.youtube.com/watch?v=Pp2dtG0pOUQ)

## License

See LICENSE file for details.
