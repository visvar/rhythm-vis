<script>
  import Recorder from './components/recorder/Recorder.svelte';
  import Analyzer from './components/analysis/Analyzer.svelte';
  import Tabs from './components/common/Tabs.svelte';
  import MidiIndicator from './components/setup/MidiIndicator.svelte';
  import VolumeMeter from './components/setup/VolumeMeter.svelte';
  import Help from './components/help/Help.svelte';
  import Converter from './components/converter/Converter.svelte';
  import Live from './components/realtime/Live.svelte';
  import Recordings from './components/recordings/Recordings.svelte';
  import Simulator from './components/simulator/Simulator.svelte';
  import { getUrlParam, setUrlParam } from './lib/url';

  const exercises = [
    'any-instrument_empty_exercise',
    // Run preprocessing/exercise-summary.py for a list
    'drum_4-4_polyrhythm',
    'drum_snare_eighths-to-eighth-triplets',
    'drum_snare_eighths-to-quarter-quintuplets',
    'drum_song-1_mixed-notes',
    'drum_song-2_mixed-notes',
    'drums_3-4-walz_quarters',
    'drums_4-4-multi-bar_simple-fill',
    'drums_4-4-multi-bar_triplet-fill',
    'drums_4-4-offbeat_eighths',
    'drums_4-4-short-fill_eighths-triplets',
    'drums_4-4-snare_eighths-triplets',
    'drums_4-4-standard-halftime_eighths',
    'drums_4-4-standard-offbeat_eighths',
    'guitar_a-blues-2_eighths',
    'guitar_a-blues-3_eighths',
    'guitar_a-blues-4_eighths',
    'guitar_a-blues-5_eighths',
    'guitar_a-blues_eighths',
    'guitar_a-minor-pentatonic_eighth-triplets',
    'guitar_a-minor-pentatonic_eighths',
    'guitar_a-minor_eighths',
    'guitar_arpeggios_eighths',
    'guitar_autumn-chords_halfs',
    'guitar_chords-f7_halfs',
    'guitar_chords-fm7_halfs',
    'guitar_chromatic_bursts',
    'guitar_e-string_dotted-quarters',
    'guitar_e-string_eighths-to-eighth-triplets',
    'guitar_e-string_quarters',
    'guitar_e-string_quarters-to-eighths',
    'guitar_powerchords_quarter-to-eighths-with-rest',
    'guitar_single-notes_eighths-to-eighth-triplets',
    'piano_c-major_eighths',
  ];

  const views = [
    'Recording',
    'Analysis',
    'Simulator',
    'Setup',
    'Converter',
    'Live',
    // 'Comparison',
    'Recordings',
    'Help',
  ];
  let view =
    getUrlParam(window, 'view') ?? localStorage.getItem('view') ?? 'Recording';
  $: {
    localStorage.setItem('view', view);
    setUrlParam(window, 'view', view);
  }

  let corrP = 'rhyvis';
  let password = localStorage.getItem('pwd') ?? '';
  $: {
    localStorage.setItem('pwd', password);
  }

  // file system access
  let dataDirectoryHandle = null;
  const selectDir = async () => {
    const handle = await window.showDirectoryPicker();
    if (!handle) {
      return;
    }
    dataDirectoryHandle = handle;
  };
</script>

<main>
  {#if password !== corrP}
    <input type="password" placeholder="password" bind:value="{password}" />
  {:else if !dataDirectoryHandle}
    <button on:click="{selectDir}">Set recording directory</button>
  {:else}
    <Tabs options="{views}" bind:value="{view}" />
    {#if view === 'Recording'}
      <Recorder
        dataDirectoryHandle="{dataDirectoryHandle}"
        exercises="{exercises}"
      />
    {:else if view === 'Analysis'}
      <Analyzer dataDirectoryHandle="{dataDirectoryHandle}" />
    {:else if view === 'Simulator'}
      <Simulator exercises="{exercises}" />
    {:else if view === 'Setup'}
      <h2>Setup</h2>
      <VolumeMeter />
      <MidiIndicator />
    {:else if view === 'Live'}
      <Live />
    {:else if view === 'Comparison'}
      <div class="comparison">
        <Analyzer dataDirectoryHandle="{dataDirectoryHandle}" />
        <Analyzer dataDirectoryHandle="{dataDirectoryHandle}" />
      </div>
    {:else if view === 'Recordings'}
      <Recordings dataDirectoryHandle="{dataDirectoryHandle}" />
    {:else if view === 'Converter'}
      <Converter dataDirectoryHandle="{dataDirectoryHandle}" />
    {:else}
      <Help />
    {/if}
  {/if}
</main>

<style>
  .comparison {
    display: grid;
    grid-template-columns: 1fr 1fr;
  }
</style>
