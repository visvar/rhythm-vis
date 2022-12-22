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

Exercise naming:

`<instrument>_<notes>_<note-duration-and-rhythm-basis>`

Example: guitar_a-minor-pentatonic_eights-and-triplets

### Recordings

Recording naming (`<exercise>` as defined above):

`<exercise>_<tempo>_<click-on-nth-beat>_<person>_<YYYY-mm-dd-HH-MM-SS>_<take>`

Example: guitar_a-minor-pentatonic_eights-and-triplets_120-bpm_1-click_frank-heyen_2022-12-14_2

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
- osmd
- svelte
- Plot
- https://github.com/cwilso/volume-meter
