<script>
  import { recordAudio } from '../../lib/AudioRecorder';
  import { Temporal } from '@js-temporal/polyfill';
  import { onMount, onDestroy } from 'svelte';
  import Metronome from '../../lib/Metronome.js';
  import AudioPlayer from './AudioPlayer.svelte';
  import SheetMusic from '../common/SheetMusic.svelte';
  import PianoRoll from '../common/PianoRoll.svelte';
  import { WebMidi } from 'webmidi';
  import * as d3 from 'd3';
  import { group, some } from 'd3';
  import { fileExists } from '../../lib/files';
  import ExerciseAudio from './ExerciseAudio.svelte';
  import ExerciseNotepad from '../common/ExerciseNotepad.svelte';

  export let dataDirectoryHandle = null;
  export let exercises;

  let filterBy = '';

  let width;
  // Recorders
  let isRecording = false;
  let recordingStartTime;
  let recordingStopTime;
  let noteOns = [];
  let noteOffs = [];
  const onEnabled = () => {
    console.log(`MIDI enabled`);
    for (const input of WebMidi.inputs) {
      input.addListener('noteon', (e) => noteOns.push(e));
      input.addListener('noteoff', (e) => noteOffs.push(e));
    }
  };
  let audioRecorder;
  // Settings
  let exercise = localStorage.getItem('exercise') ?? '';
  let person = localStorage.getItem('person') ?? '';
  let bpm = +(localStorage.getItem('bpm') ?? 120);
  let beep = +(localStorage.getItem('beep') ?? 1);
  let accent = +(localStorage.getItem('accent') ?? 1);
  let beepLimit = localStorage.getItem('beepLimit') ?? 'infinite';
  // Data
  let audio;
  let notes;
  let metronomeClicks = [];
  let metronomeAccents = [];
  let recCount = 0;
  let pcm;
  let lastRecFileName;
  // Metronome
  let metroDiv;
  let metro = new Metronome();
  metro.onClick((time, globalBeepTime, isAccent) => {
    metronomeClicks.push(globalBeepTime);
    if (isAccent) {
      metronomeAccents.push(globalBeepTime);
    }
  });

  const updateRecCount = async () => {
    // Update recording count
    const files = [];
    for await (const [key] of dataDirectoryHandle.entries()) {
      files.push(key);
    }
    recCount = group(files, (d) => d.substring(0, d.indexOf('.'))).size;
  };

  onMount(async () => {
    updateRecCount();
    // enable MIDI and audio access
    try {
      audioRecorder = await recordAudio();
    } catch (e) {
      console.error('Cannot enable audio recording');
      console.error(e);
    }
    try {
      await WebMidi.enable();
      onEnabled();
    } catch (e) {
      console.error('Cannot enable MIDI recording');
      console.error(e);
    }
  });

  const start = () => {
    isRecording = true;
    noteOns = [];
    noteOffs = [];
    notes = null;
    metronomeClicks = [];
    metronomeAccents = [];
    audio = null;
    recordingStartTime = performance.now();
    audioRecorder.start();
    metro.start(
      bpm / beep,
      accent,
      beepLimit === 'infinite' ? Infinity : +beepLimit
    );
    console.log('start', recordingStartTime);
  };

  const stop = async () => {
    console.log('stop');
    metro.stop();
    recordingStopTime = performance.now();
    audio = await audioRecorder.stop();
    const noteOffMap = d3.group(
      noteOffs,
      (d) => d.port.id,
      (d) => d.message.channel,
      (d) => d.note.number
    );
    // metronome clicks
    metronomeClicks = metronomeClicks.map(
      (d) => (d - recordingStartTime) / 1000
    );
    metronomeAccents = metronomeAccents.map(
      (d) => (d - recordingStartTime) / 1000
    );
    // notes
    notes = noteOns.map((noteOn) => {
      // get end by closest-in-time noteOff event
      const noteOffCandidates =
        noteOffMap
          .get(noteOn.port.id)
          ?.get(noteOn.message.channel)
          ?.get(noteOn.note.number) ?? [];
      let noteOff = noteOffCandidates.filter(
        (d) => d.timestamp >= noteOn.timestamp
      );
      const end =
        noteOff.length === 0 ? recordingStopTime : noteOff[0].timestamp;
      const startInSeconds = (noteOn.timestamp - recordingStartTime) / 1000;
      const endInSeconds = (end - recordingStartTime) / 1000;
      return {
        port: noteOn.port.name,
        channel: noteOn.message.channel,
        pitch: noteOn.note.number,
        name: noteOn.note.identifier,
        start: startInSeconds,
        end: endInSeconds,
        duration: endInSeconds - startInSeconds,
        velocity: noteOn.note.attack,
      };
    });
    console.log({ notes, metronomeClicks, metronomeAccents });
    isRecording = false;
    // save automatically
    saveRecordingFiles();
  };

  const writeFile = async (name, data) => {
    // console.log(`Writing ${name}`);
    if (await fileExists(dataDirectoryHandle, name)) {
      alert(`File ${name} already exists`);
      return;
    }
    const file = await dataDirectoryHandle.getFileHandle(name, {
      create: true,
    });
    const w = await file.createWritable();
    await w.write(data);
    w.close();
  };

  /**
   * Saves recorded data to separate files using the File System API
   */
  const saveRecordingFiles = async () => {
    const pers = person.split(/\s+/).join('-');
    const now = Temporal.Now.plainDateTimeISO().toJSON();
    const date = now.substring(0, 19).split(':').join('-');
    const name = `${exercise}_${bpm}-bpm_${beep}-click_${accent}-accent_${beepLimit}-beeps_${pers}_${date}`;
    lastRecFileName = name;
    try {
      await writeFile(`${name}.rec.json`, JSON.stringify(notes));
      await writeFile(`${name}.clicks.json`, JSON.stringify(metronomeClicks));
      await writeFile(`${name}.accents.json`, JSON.stringify(metronomeAccents));
      await writeFile(`${name}.audio.weba`, audio);
    } catch (e) {
      alert(e);
    }
    updateRecCount();
  };

  onDestroy(() => {
    // remove MIDI listeners to avoid duplicate calls and improve performance
    for (const input of WebMidi.inputs) {
      input.removeListener();
    }
  });

  const filterExercises = (names, by) => {
    const search = by.split(/\s+/);
    return [...names.filter((d) => some(search, (s) => d.includes(s)))];
  };

  const setExercise = (ex) => {
    return () => {
      exercise = ex;
      localStorage.setItem('exercise', ex);
    };
  };
</script>

<main bind:clientWidth="{width}">
  <h2>Recorder</h2>
  <div>Currently, you have <b>{recCount}</b> recordings</div>

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
      <select
        bind:value="{exercise}"
        on:input="{(e) => localStorage.setItem('exercise', e.target.value)}"
      >
        <option value="" disabled>select an exercise</option>
        {#each filterExercises(exercises, filterBy) as ex}
          <option value="{ex}">{ex}</option>
        {/each}
      </select>
    </label>
    <label>
      Filter:
      <input
        type="text"
        placeholder="space-separated words"
        bind:value="{filterBy}"
      />
    </label>
  </div>

  <SheetMusic exercise="{exercise}" />
  <ExerciseAudio exercise="{exercise}" bpm="{bpm}" />

  <div bind:this="{metroDiv}" class="metronome">
    Metronome:
    <input
      bind:value="{bpm}"
      on:input="{(e) => localStorage.setItem('bpm', e.target.value)}"
      type="number"
      min="30"
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
    />. beep, limit to
    <select
      bind:value="{beepLimit}"
      on:input="{(e) => localStorage.setItem('beepLimit', e.target.value)}"
    >
      <option value="infinite">infinite</option>
      <option value="3">3</option>
      <option value="4">4</option>
      <option value="6">6</option>
      <option value="8">8</option>
    </select>
    beeps
  </div>

  <div>
    <button on:click="{() => (isRecording ? stop() : start())}">
      {isRecording ? 'stop and save' : 'start recording'}
    </button>
  </div>

  {#if lastRecFileName}
    <div>
      Keep a text note for the last saved recording?
      <ExerciseNotepad
        dataDirectoryHandle="{dataDirectoryHandle}"
        fileName="{lastRecFileName}"
      />
    </div>
  {/if}

  <div>
    <AudioPlayer
      blob="{audio}"
      width="{width}"
      height="{30}"
      bind:pcm="{pcm}"
    />
    {#if notes?.length > 0 || audio}
      <PianoRoll
        notes="{notes}"
        metronomeClicks="{metronomeClicks}"
        metronomeAccents="{metronomeAccents}"
        width="{width}"
        pcm="{pcm}"
        audioDuration="{(recordingStopTime - recordingStartTime) / 1000}"
      />
    {/if}
  </div>

  <div>
    <h3>Wanted Recordings</h3>
    <p>
      Argpeggio, to see how evenly notes are distributed, how long they are, how
      the dynamics are.
      <button on:click="{setExercise('guitar_arpeggios_eighths')}">
        guitar_arpeggios_eighths
      </button>
    </p>
    <p>
      Blues with identical notes but different swing styles (listen to the
      audio).
      <button on:click="{setExercise('guitar_a-blues_eighths')}">
        guitar_a-blues_eighths
      </button>
      <button on:click="{setExercise('guitar_a-blues-2_eighths')}">
        guitar_a-blues-2_eighths
      </button>
      <button on:click="{setExercise('guitar_a-blues-3_eighths')}">
        guitar_a-blues-3_eighths
      </button>
      <button on:click="{setExercise('guitar_a-blues-4_eighths')}">
        guitar_a-blues-4_eighths
      </button>
      <button on:click="{setExercise('guitar_a-blues-5_eighths')}">
        guitar_a-blues-5_eighths
      </button>
    </p>
  </div>
</main>

<style>
  main {
    padding: 0;
  }

  .metronome {
    background: none;
    border-radius: 5px;
  }
</style>
