<script>
  import { fetchAudio, simulateDrum } from './lib/lib.js';
  import PlotTick from './plots/PlotTick.svelte.js';
  import PlotBar from './plots/PlotBar.svelte.js';
  import PlotColor from './plots/PlotColor.svelte.js';
  import PlotWaveform from './plots/PlotWaveform.svelte.js';
  import Audio from './Audio.svelte.js';
  import { Utils } from 'musicvis-lib';
  import { onMount } from 'svelte';
  import PlotTickSep from './plots/PlotTickSep.svelte.js';
  import PlotBarSep from './plots/PlotBarSep.svelte.js';
  import PlotColorSep from './plots/PlotColorSep.svelte.js';
  import PlotWaveformSep from './plots/PlotWaveformSep.svelte.js';

  // vis sizes
  let visWidth = 600;
  let visHeight = 100;

  let BPM = 120;

  /**
   * @type {'single note'|'only snare'|'single beat'}
   */
  let errorMode = 'single note';
  let errorSeverity = 0;

  // @ts-ignore
  let spb = Utils.bpmToSecondsPerBeat(BPM);

  let correctPattern = [
    {
      instrument: 'hihat',
      sample: './hihat.mp3',
      beats: [1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5],
    },
    {
      instrument: 'snare',
      sample: './snare2.mp3',
      beats: [2, 4],
    },
    {
      instrument: 'bass',
      sample: './bass2.mp3',
      beats: [1, 3],
    },
  ];
  const beats = 4;
  const duration = beats * spb;

  let renderedAudio = null;
  let renderedAudioSep = [];
  let sampleRate;
  let noteTimes = [];
  let noteTimesSeparate = [];

  const fetchDrumAudios = async () => {
    correctPattern = await Promise.all(
      correctPattern.map(async (d) => {
        return {
          ...d,
          times: d.beats.map((b) => spb * (b - 1)),
          timesOriginal: d.beats.map((b) => spb * (b - 1)),
          audioBuffer: await fetchAudio(d.sample),
        };
      }),
    );
  };

  /**
   * Adds errors based on mode and severity
   * @param {'single note'|'only snare'|'single beat'} errorMode
   * @param {number} errorSeverity
   */
  const addErrors = (errorMode = 'single note', errorSeverity = 0) => {
    if (errorSeverity === 0) {
      return correctPattern;
    }
    console.log(`Adding error ${errorMode} ${errorSeverity}`);
    const copy = concat([correctPattern]);

    const snare = copy.filter((d) => d.instrument === 'snare')[0];
    const hihat = copy.filter((d) => d.instrument === 'hihat')[0];
    if (errorMode === 'single note') {
      // take the second snare
      snare.times[2 - 1] = snare.timesOriginal[2 - 1] + errorSeverity;
    } else if (errorMode === 'single beat') {
      // take the second snare and 7th hihat
      snare.times[2 - 1] = snare.timesOriginal[2 - 1] + errorSeverity;
      hihat.times[7 - 1] = hihat.timesOriginal[7 - 1] + errorSeverity;
    } else if (errorMode === 'only snare') {
      // take first and second snare
      snare.times[1 - 1] = snare.timesOriginal[1 - 1] + errorSeverity;
      snare.times[2 - 1] = snare.timesOriginal[2 - 1] + errorSeverity;
    }
    // console.log(drumPattern);
    return copy;
  };

  /**
   * Concats multiple drum patterns
   * @param object[] patterns
   */
  const concat = (patterns) => {
    console.log(`concat ${patterns.length} patterns`);
    const result = patterns[0].map((d) => {
      return {
        ...d,
        beats: [...d.beats],
        times: [...d.times],
        timesOriginal: [...d.timesOriginal],
      };
    });
    for (let i = 1; i < patterns.length; i++) {
      const pattern = patterns[i];
      for (const inst of pattern) {
        const instr = result.filter((d) => d.instrument === inst.instrument)[0];
        instr.beats = [...instr.beats, ...inst.beats.map((b) => b + i * beats)];
        instr.times = [
          ...instr.times,
          ...inst.times.map((b) => b + i * duration),
        ];
        instr.timesOriginal = [
          ...instr.timesOriginal,
          ...inst.timesOriginal.map((b) => b + i * duration),
        ];
      }
    }
    return result;
  };

  /**
   * Creates the pattern with errors and repetitions
   * @param errorMode
   * @param errorSeverity
   */
  const createDrumPattern = async (errorMode, errorSeverity) => {
    if (!correctPattern[0].audioBuffer) {
      return;
    }
    // add errors
    const wrongPattern = addErrors(errorMode, errorSeverity);
    // concat correct and the one with errors
    // const patterns = [correctPattern, wrongPattern];
    // const patterns = [correctPattern, wrongPattern, correctPattern];
    const patterns = [wrongPattern, correctPattern];
    // const patterns = [wrongPattern];
    const combinedPattern = concat(patterns);
    // get times for visualizations
    noteTimes = combinedPattern
      .map((d) => d.times)
      .flat()
      .sort();
    noteTimesSeparate = combinedPattern
      .map((d) =>
        d.times.map((t) => {
          return { time: t, instr: d.instrument };
        }),
      )
      .flat(Infinity)
      .sort((a, b) => {
        a.time - b.time;
      });
    // set global sample rate
    sampleRate = combinedPattern[0].audioBuffer.sampleRate;
    // render audio
    renderedAudio = simulateDrum(
      combinedPattern,
      duration * patterns.length + 0.1,
      sampleRate,
    );
    renderedAudioSep = combinedPattern.map((instr) => {
      const audio = simulateDrum(
        [instr],
        duration * patterns.length + 0.1,
        sampleRate,
      );
      return { instr: instr.instrument, audio };
    });
  };

  // do in the beginning
  onMount(async () => {
    await fetchDrumAudios();
    createDrumPattern();
  });

  // and also when error settings change
  $: {
    createDrumPattern(errorMode, errorSeverity);
  }
</script>

<main>
  <h2>Playground</h2>
  <div>
    <label>
      error mode:
      <select bind:value="{errorMode}">
        {#each ['single note', 'single beat', 'only snare'] as af}
          <option value="{af}">{af.substring(0, 30)}</option>
        {/each}
      </select>
    </label>
    <label>
      error severity (in seconds):
      <input
        bind:value="{errorSeverity}"
        type="number"
        min="-0.5"
        max="0.5"
        step="0.01"
      />
    </label>
  </div>

  <div class="stimuli">
    <Audio audioData="{renderedAudio}" {sampleRate} />
    <PlotWaveform
      audioData="{renderedAudio}"
      width="{visWidth}"
      height="{visHeight}"
    />
    <PlotWaveformSep
      audioData="{renderedAudioSep}"
      width="{visWidth}"
      height="{visHeight / 3}"
    />
    <PlotTick pattern="{noteTimes}" width="{visWidth}" height="{visHeight}" />
    <PlotTickSep
      pattern="{noteTimesSeparate}"
      width="{visWidth}"
      height="{visHeight}"
    />
    <PlotBar pattern="{noteTimes}" width="{visWidth}" height="{visHeight}" />
    <PlotBarSep
      pattern="{noteTimesSeparate}"
      width="{visWidth}"
      height="{visHeight * 2}"
    />
    <PlotColor pattern="{noteTimes}" width="{visWidth}" height="{visHeight}" />
    <PlotColorSep
      pattern="{noteTimesSeparate}"
      width="{visWidth}"
      height="{visHeight}"
    />
  </div>

  <div class="examples">
    <div>early</div>
    <div>late</div>
  </div>
</main>

<style>
  label {
    display: block;
  }

  .stimuli {
    display: grid;
    grid-template-columns: 1fr;
    gap: 10px;
    justify-items: center;
    align-items: center;
  }
</style>
