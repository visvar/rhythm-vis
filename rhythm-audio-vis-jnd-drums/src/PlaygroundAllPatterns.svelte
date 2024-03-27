<script>
  import { fetchAudio, simulateDrum } from './lib/lib.js';
  import PlotTick from './plots/PlotTick.svelte';
  import PlotBar from './plots/PlotBar.svelte';
  import PlotColor from './plots/PlotColor.svelte';
  import PlotWaveform from './plots/PlotWaveform.svelte';
  import Audio from './audioPlayback/Audio.svelte';
  import { Utils } from 'musicvis-lib';
  import { onMount } from 'svelte';
  import PlotTickSep from './plots/PlotTickSep.svelte';
  import PlotBarSep from './plots/PlotBarSep.svelte';
  import PlotColorSep from './plots/PlotColorSep.svelte';
  import PlotColorBeats from './plots/PlotColorBeats.svelte';
  import PlotWaveformSep from './plots/PlotWaveformSep.svelte';

  // vis sizes
  let visWidth = 600;
  let visHeight = 100;

  let BPM = 120;

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

  let sampleRate;
  let renderedAudio = null;
  let renderedAudioHihat = null;
  let renderedAudioHihat60 = null;
  let renderedAudioHihat90 = null;
  let noteTimes = [];
  let noteTimesHihat = [];
  let noteTimesHihat60 = [];
  let noteTimesHihat90 = [];

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
   * @param {number} errorSeverity
   */
  const addErrors = (correctPattern, errorSeverity = 0) => {
    if (errorSeverity === 0) {
      return correctPattern;
    }
    const copy = concat([correctPattern]);
    const hihat = copy.filter((d) => d.instrument === 'hihat')[0];
    const snare = copy.filter((d) => d.instrument === 'snare')[0];
    const bass = copy.filter((d) => d.instrument === 'bass')[0];
    bass.times[2 - 1] = bass.timesOriginal[2 - 1] + errorSeverity;
    hihat.times[5 - 1] = hihat.timesOriginal[5 - 1] + errorSeverity;

    // also shift all that come later
    for (const h of [6, 7, 8]) {
      hihat.times[h - 1] = hihat.timesOriginal[h - 1] + errorSeverity;
    }
    snare.times[2 - 1] = snare.timesOriginal[2 - 1] + errorSeverity;
    // console.log(drumPattern);
    return copy;
  };
  const addErrorsHihat = (correctPattern, errorSeverity = 0) => {
    if (errorSeverity === 0) {
      return correctPattern;
    }
    const copy = concat([correctPattern]);
    const hihat = copy.filter((d) => d.instrument === 'hihat')[0];
    hihat.times[5 - 1] = hihat.timesOriginal[5 - 1] + errorSeverity;
    for (const h of [6, 7, 8]) {
      hihat.times[h - 1] = hihat.timesOriginal[h - 1] + errorSeverity;
    }
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
   * @param errorSeverity
   */
  const createDrumPattern = async (errorSeverity) => {
    if (!correctPattern[0].audioBuffer) {
      return;
    }
    // add errors
    const wrongPattern = addErrors(correctPattern, errorSeverity);
    // concat correct and the one with errors
    // const patterns = [correctPattern, wrongPattern];
    // const patterns = [correctPattern, wrongPattern, correctPattern];
    // const patterns = [wrongPattern, correctPattern];
    const patterns = [wrongPattern];
    const combinedPattern = concat(patterns);
    // get times for visualizations
    noteTimes = combinedPattern
      .map((d) => d.times)
      .flat()
      .sort();
    // set global sample rate
    sampleRate = combinedPattern[0].audioBuffer.sampleRate;
    // render audio
    renderedAudio = simulateDrum(
      combinedPattern,
      duration * patterns.length + 0.1,
      sampleRate,
    );

    const patternHihat = [combinedPattern[0]];
    console.log({ patternHihat });
    noteTimesHihat = combinedPattern[0].times;
    renderedAudioHihat = simulateDrum(
      patternHihat,
      duration * patterns.length + 0.1,
      sampleRate,
    );

    const patternHihat60 = [
      {
        ...correctPattern[0],
        timesOriginal: correctPattern[0].times.map((d) => (d * 120) / 60),
        times: correctPattern[0].times.map((d) => (d * 120) / 60),
      },
    ];
    const patternHihat90 = [
      {
        ...correctPattern[0],
        timesOriginal: correctPattern[0].times.map((d) => (d * 120) / 90),
        times: correctPattern[0].times.map((d) => (d * 120) / 90),
      },
    ];
    const patternHihat60Errors = addErrorsHihat(patternHihat60, errorSeverity);
    const patternHihat90Errors = addErrorsHihat(patternHihat90, errorSeverity);
    noteTimesHihat60 = patternHihat60Errors[0].times;
    noteTimesHihat90 = patternHihat90Errors[0].times;
    renderedAudioHihat60 = simulateDrum(
      patternHihat60Errors,
      duration * (120 / 60) * patterns.length + 0.1,
      sampleRate,
    );
    renderedAudioHihat90 = simulateDrum(
      patternHihat90Errors,
      duration * (120 / 90) * patterns.length + 0.1,
      sampleRate,
    );
  };

  // do in the beginning
  onMount(async () => {
    await fetchDrumAudios();
    createDrumPattern();
  });

  // and also when error settings change
  $: {
    createDrumPattern(errorSeverity);
  }
</script>

<main>
  <h2>Playground</h2>
  <div>
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

  <div class="stimuli" style="grid-template-columns: repeat(2, 1fr);">
    <h3>Hi-hat only</h3>
    <h3>With snare and kick</h3>

    <Audio audioData="{renderedAudioHihat}" {sampleRate} />
    <Audio audioData="{renderedAudio}" {sampleRate} />

    <PlotWaveform
      audioData="{renderedAudioHihat}"
      width="{visWidth}"
      height="{visHeight}"
    />
    <PlotWaveform
      audioData="{renderedAudio}"
      width="{visWidth}"
      height="{visHeight}"
    />

    <!-- <PlotTick pattern="{noteTimes}" width="{visWidth}" height="{visHeight}" /> -->

    <!-- <PlotBar pattern="{noteTimes}" width="{visWidth}" height="{visHeight}" /> -->

    <!-- <PlotColor pattern="{noteTimes}" width="{visWidth}" height="{visHeight}" /> -->

    <PlotColorBeats
      pattern="{noteTimesHihat}"
      width="{visWidth}"
      height="{visHeight}"
    />
    <PlotColorBeats
      pattern="{noteTimes}"
      width="{visWidth}"
      height="{visHeight}"
    />
  </div>

  <div class="stimuli" style="grid-template-columns: repeat(3, 1fr);">
    <h3>60</h3>
    <h3>90</h3>
    <h3>120</h3>

    <Audio audioData="{renderedAudioHihat60}" {sampleRate} />
    <Audio audioData="{renderedAudioHihat90}" {sampleRate} />
    <Audio audioData="{renderedAudioHihat}" {sampleRate} />

    <PlotWaveform
      audioData="{renderedAudioHihat60}"
      width="{visWidth}"
      height="{visHeight}"
    />
    <PlotWaveform
      audioData="{renderedAudioHihat90}"
      width="{visWidth}"
      height="{visHeight}"
    />
    <PlotWaveform
      audioData="{renderedAudioHihat}"
      width="{visWidth}"
      height="{visHeight}"
    />

    <PlotColorBeats
      pattern="{noteTimesHihat60}"
      width="{visWidth}"
      height="{visHeight}"
    />
    <PlotColorBeats
      pattern="{noteTimesHihat90}"
      width="{visWidth}"
      height="{visHeight}"
    />
    <PlotColorBeats
      pattern="{noteTimesHihat}"
      width="{visWidth}"
      height="{visHeight}"
    />
  </div>

  <!-- <div class="examples">
    <div>early</div>
    <div>late</div>
  </div> -->
</main>

<style>
  label {
    display: block;
  }

  .stimuli {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 40px;
    justify-items: center;
    align-items: center;
  }
</style>
