<script>
  import JSZip from 'jszip'
  import * as Plot from "@observablehq/plot"
  import {Utils} from "musicvis-lib"
  import WaveSurfer from "wavesurfer.js"
    import { afterUpdate, onMount } from 'svelte';

  let width = 800

  let fileInput
  let files = []
  let extracted;
  let notes = [];
  let onsets = [];
  let audio

  // elements
  let deltaPlotContainer

  // config
  let bpm = 120
  let beats = 4
  let contextBeats = 1
  $: spb = Utils.bpmToSecondsPerBeat(bpm)
  $: onsetsInBeats = onsets.map((d) => d / spb)
  $: deltas = onsets.slice(1).map((d, i) => d - onsets[i])

  // player etc
  let currentPlayerTime = 0
  $: currentAdjustedTime = currentPlayerTime - (notes[0]?.start ?? 0)
  $: currentTimeInBeats = currentAdjustedTime / spb

  // Parse MusicXML into a MusicPiece
  const handleFileInput = async (event) => {
    const file = event.target.files[0];
    if (!file) {
      // TODO: reset everything
      return
    } else if (file.name.endsWith('.zip')) {
      const compressed = await file.arrayBuffer();
      extracted = await JSZip.loadAsync(compressed);
      const allFiles = Object.keys(extracted.files)
      files = [... new Set(allFiles.map(d=>d.substring(0, d.lastIndexOf("."))))]
    } else {
      alert('Invalid file');
      return;
    }
  }

  // extract selected file from zip and get data
  const handleFileSelect = async (selectedFile)=>{
    console.log(selectedFile)
    if (selectedFile !== null) {
      // notes
      const json = await extracted.file(`${selectedFile}.json`).async('string')
      notes = JSON.parse(json).notes
      // onsets
      const ons = notes.map((d) => d.start);
      const first = ons[0];
      onsets = ons.map((d) => d - first);
      // audio
       audio = await extracted.file(`${selectedFile}.webm`).async('blob')
      console.log(notes, audio);
    }
  }

  onMount(()=>{
    const wavesurfer = WaveSurfer.create({
      container: "#waveform",
      waveColor: "#bbb",
      progressColor: "steelblue",
      mediaControls: true,
      normalize: true,
      height: 40
    });
    wavesurfer.on(
      "audioprocess",
      (time) =>
        {currentPlayerTime = Utils.roundToNDecimals(time, 2)}
    );
    // React to interaction (brush-link)
    wavesurfer.on("interaction", () => {
      const time = wavesurfer.getCurrentTime();
      currentPlayerTime = time;
    });
    // Move time cursor to first note when audio loaded
    wavesurfer.on("ready", () => {
      const startTime = notes[0].start;
      const duration = wavesurfer.getDuration();
      wavesurfer.seekTo(startTime / duration);
      currentPlayerTime = startTime;
    });
  })

  afterUpdate(()=>{
    deltaPlotContainer.textContent = "";
    const plot = Plot.plot({
      width,
      height: 100,
      x: { label: "Time between following notes (s)" },
      y: { label: "Frequency", grid: true },
      marks: [
        Plot.rectY(
          deltas,
          Plot.binX({ y: "count", thresholds: 200 }, { x: (d) => d, fill: "#aaa", inset: 0 })
        ),
        Plot.ruleY([0])
        // Mark for correct BPM
        // Plot.ruleX()
      ]
    })

    deltaPlotContainer.appendChild(plot);
  })
</script>

<main>
  <h1>Analysis</h1>
  <input
    type="file"
    accept=".zip"
    bind:this={fileInput}
    on:input={handleFileInput} />

  <label>
    File
    <select on:input={(e)=>handleFileSelect(e.target.value)}>
      {#each files as f}
        <option value={f}>{f}</option>
      {/each}
    </select>
  </label>

  <div bind:this={deltaPlotContainer} width={`${width}px`} height="100px"/>

  <label>
    Tempo in BPM
    <input bind:value={bpm} type="number" min="1" max="500" step="1" style="width: 50px"/>
  </label>

  <label>
    Beats per row
    <input bind:value={beats} type="number" min="1" max="32" step="1" style="width: 50px"/>
  </label>

  <label>
    Context beats (gray)
    <input bind:value={contextBeats} type="number" min="1" max="8" step="1" style="width: 50px"/>
  </label>

  <div id="waveform" />

  <!-- <div bind:this={histoPlotContainer} width="500px" height="100px"/> -->
</main>

<style>
 select {
  width: 200px;
 }

 label {
  display: block;
 }
</style>
