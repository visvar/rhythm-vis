<script>
  import { recordAudio, recordMidi } from 'musicvis-lib';
  import { Temporal } from '@js-temporal/polyfill';
  import { onMount } from 'svelte';
  import Metronome from '../lib/Metronome.js';
  import AudioPlayer from './AudioPlayer.svelte';
  import SheetMusic from './SheetMusic.svelte';

  // Recorders
  let audioRecorder;
  let midiRecorder;
  // Settings
  let exercise;
  let person = localStorage.getItem('person') ?? '';
  let bpm = +(localStorage.getItem('bpm') ?? 120);
  let beep = +(localStorage.getItem('beep') ?? 1);
  let accent = +(localStorage.getItem('accent') ?? 1);
  // Data
  let audio;
  let notes;
  let metronomeClicks = [];
  // Metronome
  let metroDiv;
  let metro = new Metronome();
  metro.onClick((time) => {
    metronomeClicks.push(time);
    // metroDiv.style.background =
    //   metroDiv.style.background === 'none' ? 'steelblue' : 'none';
  });

  const exercises = [
    'drum_snare_eighths-to-eighth-triplets',
    'drum_snare_eighths-to-quarter-quintuplets',
    'guitar_a-minor-pentatonic_eighths',
    'guitar_a-minor_eighths',
    'guitar_chords-f7_halfs',
    'guitar_chords-fm7_halfs',
    'guitar_e-string_quarters',
    'guitar_e-string_quarters-to-eighths',
    'guitar_powerchords_quarter-to-eighths-with-rest',
    'guitar_single-notes_eighths-to-eighth-triplets',
    'piano_c-major_eighths',
  ];

  onMount(async () => {
    try {
      audioRecorder = await recordAudio();
    } catch (e) {
      console.error('Cannot enable audio recording');
      console.error(e);
    }
    try {
      midiRecorder = await recordMidi();
    } catch (e) {
      console.error('Cannot enable MIDI recording');
      console.error(e);
    }
  });

  const start = () => {
    console.log('start');
    audio = null;
    notes = null;
    midiRecorder.start();
    audioRecorder.start();
    metro.start(bpm / beep, accent);
    metronomeClicks = [];
  };

  const stop = async () => {
    console.log('stop');
    metro.stop();
    audio = await audioRecorder.stop();
    notes = midiRecorder.stop();
    metroDiv.style.background = 'none';
  };

  const download = () => {
    const pers = person.split(/\s+/).join('-');
    const now = Temporal.Now.plainDateTimeISO().toJSON();
    const date = now.substring(0, 10).replace(':', '-');
    const name = `${exercise}_${bpm}-bpm_${beep}-click_${pers}_${date}`;
    downloadTextFile(JSON.stringify(notes), `${name}.rec.json`);
    downloadTextFile(JSON.stringify(metronomeClicks), `${name}.clicks.json`);
    downloadBlob(audio, name);
  };

  /**
   * Download a text file
   * @param {string} text JSON content
   * @param {string} fileName file name
   */
  const downloadTextFile = (text, fileName) => {
    const a = document.createElement('a');
    a.href = 'data:text/plaincharset=utf-8,' + encodeURIComponent(text);
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    // document.removeChild(a)
  };

  /**
   * Download a blob as binary file
   * @param {Blob} blob content
   * @param {string} fileName file name
   */
  const downloadBlob = (blob, fileName) => {
    const a = document.createElement('a');
    const url = window.URL.createObjectURL(blob);
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    // document.removeChild(a)
    window.URL.revokeObjectURL(url);
  };
</script>

<main>
  <div>
    Your Name:
    <input
      type="text"
      bind:value="{person}"
      on:input="{(e) => localStorage.setItem('person', e.target.value)}"
      placeholder="Firstname Lastname"
    />
  </div>

  <div>
    <label>
      Exercise:
      <select bind:value="{exercise}">
        <option value="" disabled>select an exercise</option>
        {#each exercises as ex}
          <option value="{ex}">{ex}</option>
        {/each}
      </select>
    </label>
  </div>
  <SheetMusic exercise="{exercise}" />

  <div bind:this="{metroDiv}" class="metronome">
    Metronome:
    <input
      bind:value="{bpm}"
      on:input="{(e) => localStorage.setItem('bpm', e.target.value)}"
      type="number"
      min="60"
      max="240"
      step="10"
      style="width: 50px"
    />
    bpm, beep on every
    <input
      bind:value="{beep}"
      on:input="{(e) => localStorage.setItem('beep', e.target.value)}"
      type="number"
      min="1"
      max="16"
      step="1"
      style="width: 30px"
    />. beat, accent on every
    <input
      bind:value="{accent}"
      on:input="{(e) => localStorage.setItem('accent', e.target.value)}"
      type="number"
      min="1"
      max="16"
      step="1"
      style="width: 30px"
    />. beep
  </div>

  <div>
    Recording:
    <button on:click="{start}">start</button>
    <button on:click="{stop}">stop</button>
  </div>

  <div>
    Saving:
    <button on:click="{download}" disabled="{!audio && !notes}">
      download
    </button>
  </div>

  <div>
    <AudioPlayer blob="{audio}" height="30" />
  </div>

  <h2>How to use</h2>
  <div>
    <b>Audio:</b> If you want to record audio, make sure the correct audio input
    is selected in your browser. You can test this in the <i>Setup</i> tab.
  </div>
  <div>
    <b>MIDI:</b>
    If you want to record MIDI, make sure your browser supports
    <a href="https://caniuse.com/midi" target="_blank" rel="noreferrer"
      >Web MIDI</a
    >. You can test whether everything works in the <i>Setup</i> tab or in more
    detail with
    <a
      href="https://github.com/fheyen/midi-pianoroll"
      target="_blank"
      rel="noreferrer">this tool</a
    >.
  </div>
  <div>
    Press <i>start</i> to start recording, <i>stop</i> to stop it, then download
    the audio and MIDI files.
  </div>
  <div>
    No data will be send, it completely remains under your control until you
    submit it to us.
  </div>
</main>

<style>
  .metronome {
    background: none;
    border-radius: 5px;
  }
</style>
