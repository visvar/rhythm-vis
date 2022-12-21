<script>
  import { recordAudio, recordMidi } from 'musicvis-lib';
  import { Temporal } from '@js-temporal/polyfill';
  import { onMount } from 'svelte';
  import Metronome from '../lib/Metronome.js';

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
    metroDiv.style.background =
      metroDiv.style.background === 'none' ? 'steelblue' : 'none';
  });

  const exercises = ['example 1', 'example 2'];

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
    const name = `${exercise}_${pers}_${date}`;
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
    Exercise:
    <select bind:value="{exercise}">
      {#each exercises as ex}
        <option value="{ex}">{ex}</option>
      {/each}
    </select>

    Your Name:
    <input
      type="text"
      bind:value="{person}"
      on:input="{(e) => localStorage.setItem('person', e.target.value)}"
      placeholder="Firstname Lastname"
    />
  </div>

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
    Make sure your browser supports <a
      href="https://caniuse.com/midi"
      target="_blank"
      rel="noreferrer">Web MIDI</a
    >. You can test your MIDI input with
    <a
      href="https://github.com/fheyen/midi-pianoroll"
      target="_blank"
      rel="noreferrer">this tool</a
    >.
  </div>
  <div>
    Usage: Press <i>start</i> to start recording, <i>stop</i> to stop it. Give your
    recording a name and download the audio and MIDI files.
  </div>
</main>

<style>
  .metronome {
    background: none;
    border-radius: 5px;
  }
</style>
