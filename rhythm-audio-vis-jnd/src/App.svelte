<script>
  import Playground from './Playground.svelte';
  import Study from './StudyPilot1.svelte';
  import StudyWithin from './StudyWithinPartVariance.svelte';
  import Analysis from './Analysis.svelte';
  import AnalysisWithin from './AnalysisWithinPartVariance.svelte';
  import Examples from './Examples.svelte';
  import StudyProlific from './StudyProlific.svelte';
  import { getUrlParam } from './lib/url';

  let view = getUrlParam(window, 'p') ?? 'study_prolific';
  // let view = 'analysis';
</script>

<main>
  <h1>Rhythm Error Sensitivity Study</h1>

  <div>
    <button on:click="{() => (view = 'playground')}">Playground</button>
    <button on:click="{() => (view = 'examples')}">Examples</button>
    <button on:click="{() => (view = 'study')}">Study</button>
    <button on:click="{() => (view = 'analysis')}">Analysis</button>
    <button on:click="{() => (view = 'study_variance')}"
      >Study (variance)</button
    >
    <button on:click="{() => (view = 'analysis_variance')}"
      >Analysis (variance)</button
    >
    <button on:click="{() => (view = 'study_prolific')}">
      Study (Prolific)
    </button>
  </div>

  {#if view === 'playground'}
    <Playground />
  {:else if view === 'examples'}
    <Examples />
  {:else if view === 'study'}
    <Study />
  {:else if view === 'analysis'}
    <Analysis />
  {:else if view === 'study_variance'}
    <StudyWithin />
  {:else if view === 'analysis_variance'}
    <AnalysisWithin />
  {:else if view === 'study_prolific'}
    <StudyProlific />
  {/if}

  <!-- <StaircaseTest /> -->
</main>

<style>
</style>
