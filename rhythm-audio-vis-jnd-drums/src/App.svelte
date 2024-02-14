<script>
  import Playground from './Playground.svelte';
  import AnalysisProlific from './AnalysisProlific.svelte';
  import Examples from './Examples.svelte';
  import StudyDrums from './StudyDrums.svelte';
  import { getUrlParam } from './lib/url';
  // import StudyStaircaseTest from './StudyStaircaseTest.svelte';

  let view = getUrlParam(window, 'p') ?? 'study_prolific';
  // view = 'analysis_prolific';
  view = 'playground';
</script>

<main>
  <h1>Rhythm Error Sensitivity Study</h1>

  {#if view !== 'study_prolific'}
    <div>
      <button on:click="{() => (view = 'playground')}">Playground</button>
      <button on:click="{() => (view = 'examples')}">Examples</button>
      <button on:click="{() => (view = 'study_prolific')}"> Study </button>
      <button on:click="{() => (view = 'analysis_prolific')}">
        Analysis
      </button>
    </div>
  {/if}

  {#if view === 'playground'}
    <Playground />
  {:else if view === 'examples'}
    <Examples />
  {:else if view === 'study_drums'}
    <StudyDrums />
  {:else if view === 'analysis_prolific'}
    <AnalysisProlific />
  {/if}

  <!-- <StudyStaircaseTest /> -->
</main>
