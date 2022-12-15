<script>
  import {recordAudio, recordMidi} from "musicvis-lib"
  import { Temporal } from '@js-temporal/polyfill'
  import { onMount } from "svelte"
  import Metronome from "./lib/Metronome.js"

  // Recorders
  let audioRecorder
  let midiRecorder
  // Settings
  let bpm = 120
  let accent = 1
  let oldnames = localStorage.getItem("oldnames")
  ? JSON.parse(localStorage.getItem("oldnames"))
  : []
  let addDate =  localStorage.getItem("adddate") === "true"
  // Data
  let fileName = ""
  let audio
  let notes
  let metronomeClicks = []
  // Metronome
  let metroDiv;
  let metro = new Metronome()
  metro.onClick((time)=>{
    metronomeClicks.push(time)
    metroDiv.style.background = metroDiv.style.background === "none"
    ? "steelblue"
    : "none"
  })


  onMount(async ()=>{
    try {
      audioRecorder = await recordAudio()
    } catch(e) {
      console.error("Cannot enable audio recording")
      console.error(e)
    }
    try {
      midiRecorder = await recordMidi()
    } catch(e) {
      console.error("Cannot enable MIDI recording")
      console.error(e)
    }
  })


  const start = ()=>{
    console.log("start")
    midiRecorder.start()
    audioRecorder.start()
    metro.start(bpm, accent)
    metronomeClicks = []
  }

  const stop = async ()=>{
    console.log("stop")
    metro.stop()
    audio = await audioRecorder.stop()
    notes = midiRecorder.stop()
    metroDiv.style.background = "none"
    console.log(metronomeClicks);
  }

  const download = () => {
    const now = Temporal.Now.plainDateTimeISO().toJSON();
    const name = addDate
    ? `${fileName} ${now.substring(0, 16)
      .replace(":", "-")}`
    : fileName
    const json = {
      name: fileName,
      date: now,
      notes
    }
    downloadTextFile(JSON.stringify(json), `${name}.json`)
    downloadTextFile(JSON.stringify(metronomeClicks), `${name}.clicks.json`)
    downloadBlob(audio, name)
    // Store filename
    let oldnames = []
    try {
      oldnames = JSON.parse(localStorage.getItem("oldnames"))
    } catch (e) {
      console.log(e)
    }
    const oldnames2 = [...new Set([fileName, oldnames])]
    oldnames = oldnames2
    localStorage.setItem("oldnames", JSON.stringify(oldnames2))
  }

  /**
   * Download a text file
   * @param {string} text JSON content
   * @param {string} fileName file name
   */
  const downloadTextFile = (text, fileName) => {
    const a = document.createElement("a")
    a.href = "data:text/plaincharset=utf-8," + encodeURIComponent(text)
    a.download = fileName
    document.body.appendChild(a)
    a.click()
    // document.removeChild(a)
  }

  /**
   * Download a blob as binary file
   * @param {Blob} blob content
   * @param {string} fileName file name
   */
  const downloadBlob=(blob, fileName) =>{
    const a = document.createElement("a")
    const url = window.URL.createObjectURL(blob)
    a.href = url
    a.download = fileName
    document.body.appendChild(a)
    a.click()
    // document.removeChild(a)
    window.URL.revokeObjectURL(url)
  }
</script>

<main>
  <div bind:this={metroDiv} class="flash">
    Metronome:
    <input bind:value={bpm} type="number" min="1" max="500" step="1" style="width: 50px"/>
    bpm, accent on every
    <input bind:value={accent} type="number" min="1" max="16" step="1" style="width: 30px"/>.
    beat
  </div>

  <div>
    Recording:
    <button on:click={start}>start</button>
    <button on:click={stop}>stop</button>
  </div>

  <div>
    Saving:
    <input type="text" placeholder="name" list="oldnames" title={fileName} bind:value={fileName} />
    <datalist id="oldnames">
      {#each oldnames as name}
      <option value={name}>{name}</option>
      {/each}
    </datalist>
    <button
      on:click={()=>{
        addDate = !addDate;
        localStorage.setItem("adddate", addDate?"true":"false")
      }}
    >
    {addDate? "date added to name":"date not added to name"}
  </button>
  <button
    on:click={()=> {
            localStorage.removeItem("oldnames");
            oldnames = []
          }}
        >
        clear names
      </button>
    </div>

    <div>
    <button
      on:click={download}
      disabled={!audio || !notes ||  fileName.length===0}
    >
      download
    </button>
  </div>
  <!-- <div>
    {#if !audioRecorder}
      audio disabled
    {/if}
    {#if !midiRecorder}
      MIDI disabled
    {/if}
  </div> -->
  <div>
    Make sure your browser supports <a href="https://caniuse.com/midi" target="_blank" rel="noreferrer">Web MIDI</a>.
    You can test your MIDI input with <a href="https://github.com/fheyen/midi-pianoroll" target="_blank" rel="noreferrer">this tool</a>.
  </div>
  <div>
    Usage: Press <i>start</i> to start recording, <i>stop</i> to stop it. Give your recording a name and download the audio and MIDI files.
  </div>
  <div>
    Source code at <a href="https://github.com/fheyen/audio-midi-recorder" target="_blank" rel="noreferrer">GitHub</a>.
  </div>
</main>

<style>
  .flash {
    background: none;
    border-radius: 5px;
    /* transition: all 50ms ease-in-out; */
  }
</style>
