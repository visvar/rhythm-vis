<script>
  import { recordAudio, recordMidi } from 'musicvis-lib';
  import { Temporal } from '@js-temporal/polyfill';
  import { onMount } from 'svelte';
  import Metronome from './lib/Metronome.js';

  // Recorders
  let audioRecorder;
  let midiRecorder;
  // Settings
  let exercise;
  let person = localStorage.getItem('person') ?? '';
  let bpm = +localStorage.getItem('bpm') ?? 120;
  let accent =
    +localStorage.getItem('accent') ?? 1
      ? JSON.parse(localStorage.getItem('oldnames'))
      : [];
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

  const exercises = [''];

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
    midiRecorder.start();
    audioRecorder.start();
    metro.start(bpm, accent);
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
    const now = Temporal.Now.plainDateTimeISO().toJSON();
    const name = `${exercise}_${person}_${now
      .substring(0, 10)
      .replace(':', '-')}`;
    downloadTextFile(JSON.stringify(notes), `${name}.json`);
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
    <input type="text" bind:value="{exercise}" />

    Your Name:
    <input
      type="text"
      bind:value="{person}"
      on:input="{(e) => localStorage.setItem('person', e.target.value)}"
    />
  </div>

  <div bind:this="{metroDiv}" class="metronome">
    Metronome:
    <input
      bind:value="{bpm}"
      type="number"
      min="1"
      max="500"
      step="1"
      style="width: 50px"
    />
    bpm, accent on every
    <input
      bind:value="{accent}"
      type="number"
      min="1"
      max="16"
      step="1"
      style="width: 30px"
    />. beat
  </div>

  <div>
    Recording:
    <button on:click="{start}">start</button>
    <button on:click="{stop}">stop</button>
  </div>

  <div>
    Saving:
    <input
      type="text"
      placeholder="name"
      list="oldnames"
      title="{exercise}"
      bind:value="{exercise}"
    />
    <datalist id="oldnames">
      {#each exercises as name}
        <option value="{name}">{name}</option>
      {/each}
    </datalist>
  </div>

  <div>
    <button on:click="{download}"> download </button>
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
