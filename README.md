# rhythm-vis

1. [rhythm-vis](#rhythm-vis)
   1. [Setup](#setup)
      1. [ffmpeg](#ffmpeg)
      2. [Python](#python)
      3. [Node JS](#node-js)
   2. [Data](#data)
      1. [Exercises](#exercises)
      2. [Recordings](#recordings)
      3. [Preprocessing](#preprocessing)
      4. [Analysis](#analysis)
   3. [Libraries Used](#libraries-used)


## Setup

### ffmpeg

[download here](https://ffmpeg.org/download.html) then install and add to global $PATH

### Python

Create virtual env: `python -m venv venv`
Activate it: `.\venv\Scripts\activate`

```
pip install basic-pitch librosa Flask flask_restful flask_jsonpify flask_cors
```

### Node JS

Only required for development.

[Node JS]( https://nodejs.org/en/)

`npm install -g pnpm`

`pnpm i`

## Data

### Exercises

[data/exercises/](data/exercises/)

Exercise design space

- Notes: e.g., single note, scale, melody, chords, a mixture of some
- Note duration: quarters, eighths, changing in between
- Rhythm basis: regular beats, dotted notes, triplets, on-beat vs. off-beat, changing in between
- Duration, number of bars: 4, 8, 16, ...
- Metronome: click on every nth beat, 1st, 2nd, 4th, ...
- Tempo: 60bpm, 120bpm, ...

=> We should have a not-too-large, but representative dataset
- Use exercises that contain multiple patterns at once, e.g., quarters and quarter-triplets, single notes and chords, different tempi - also more fun to play
- Difficulty, we should have some very easy to some hard ones: we can have the same ones at different tempi and metronome clicks

Concrete examples:

- chromatic pattern timing (metronome at a slow pace, place even sixteenths)
- chord patterns (metronome at a slow pace, move through a sequence of chords)
- "simple tunes"
- "complex rhythms"

Exercise naming:

`<instrument>_<notes>_<note-duration-and-rhythm-basis>`

e.g., guitar_a-minor-pentatonic_eights-and-triplets


### Recordings

Recording naming (`<exercise>` as defined above):

`<exercise>_<tempo>_<click-on-nth-beat>_<person>_<YYYY-mm-dd-HH-MM-SS>_<take>`

e.g., guitar_a-minor-pentatonic_eights-and-triplets_120-bpm_1-click_frank-heyen_2022-12-14_2

[data/raw/](data/raw/)

- [x] record metronome click, data then is audio, midi, metronome clicks
- [x] split audio at silence to allow recording multiple takes at once
- [ ] split MIDI at silence for MIDI-only instruments



### Preprocessing

[data/prep/](data/prep/)

- [ ] align audio to MIDI, same tempo so only time-shift
-


### Analysis

- [ ] allow to open a directory via file system API to directly analyze recordings without need to zip/unzip


## Libraries Used

- d3
- https://github.com/cwilso/volume-meter
