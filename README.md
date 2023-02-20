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
   4. [Trouble Shooting](#trouble-shooting)


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

*Each field must not contain '_'.*

*Exercises have to be 120bpm.*

### Recordings

Recording naming (`<exercise>` as defined above):

`<exercise>_<tempo>_<click-on-nth-beat>_<person>_<YYYY-mm-dd-HH-MM-SS>_<take>`

Example: guitar_a-minor-pentatonic_eights-and-triplets_120-bpm_1-click_frank-heyen_2022-12-14_2

[data/raw/](data/raw/)

Raw data, one or more of the following
- MIDI notes as .json
- MIDI notes .mid or .midi
- audio in any format
- (required) metronome click times
- (required) metadata such as exercise name, tempo, metronome settings

### Preprocessing

[data/prep/](data/prep/)

Resulting data
- audio as .wav
- MIDI as .json (multiple when audio and MIDI were present in raw data)



MIDI to audio alignment
 -https://github.com/craffel/align_midi/blob/master/align_midi/__init__.py


MIDI to Score Alignment

- MusicXML to MIDI with partitura
  - https://cpjku.github.io/partitura_tutorial/
- alignment?
  - DTW with fasdtw https://cpjku.github.io/partitura_tutorial/notebooks/02_alignment/Symbolic_Music_Alignment.html


### Analysis

- [ ] allow to open a directory via file system API to directly analyze recordings without need to zip/unzip

## Libraries Used

Python
- pretty_midi for MIDI file handling
- basic_pitch for audio to MIDI conversion
- auditok for silence detection


JavaScript
- d3
- osmd
- svelte
- Plot
- https://github.com/cwilso/volume-meter
- [fast-kde](https://www.npmjs.com/package/fast-kde) by Heer
- [lubenard/simple-mp3-cutter](https://github.com/lubenard/simple-mp3-cutter/blob/master/src/cutter.js)


## Trouble Shooting

**Weird audio issue, where there is a different volume/no recorded sound during metronome beeps.**
This is due to to the browser's echo cancellation.
Microsoft Edge seems not to be affected.
You can turn it off in Chrome-based browsers:
In the URL bar, go to chrome://flags/
Search for echo
Set Chrome-wide echo cancellation to disabled
