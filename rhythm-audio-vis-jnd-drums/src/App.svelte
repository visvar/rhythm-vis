<script>
  import Playground from './Playground.svelte';
  import AnalysisProlific from './AnalysisProlific.svelte';
  import StudyDrums from './StudyDrums.svelte';
  import StudyDrums_StaircaseTest from './StudyDrums_staircasetest.svelte';
  import { getUrlParam } from './lib/url';

  let view = getUrlParam(window, 'p') ?? 'study_drums';
  // view = 'playground';
  // view = 'study_drums';
  // view = '';
</script>

<main>
  <h1>Rhythm Error Sensitivity Study</h1>

  <!-- {#if view !== 'study_drums'}
    <div>
      <button on:click="{() => (view = 'playground')}">Playground</button>
      <button on:click="{() => (view = 'study_drums')}"> Study </button>
      <button on:click="{() => (view = 'analysis')}"> Analysis </button>
    </div>
  {/if} -->

  {#if view === 'playground'}
    <Playground />
  {:else if view === 'study_drums'}
    <StudyDrums />
  {:else if view === 'analysis'}
    <AnalysisProlific />
  {/if}

  <!-- <StudyDrums_StaircaseTest /> -->
</main>
