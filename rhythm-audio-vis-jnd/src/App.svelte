<script>
  import Playground from './Playground.svelte';
  import Study from './StudyPilot1.svelte';
  import StudyWithin from './StudyWithinPartVariance.svelte';
  import Analysis from './Analysis.svelte';
  import AnalysisWithin from './AnalysisWithinPartVariance.svelte';
  import AnalysisProlific from './AnalysisProlific.svelte';
  import Examples from './Examples.svelte';
  import StudyProlific from './StudyProlific.svelte';
  import { getUrlParam } from './lib/url';
  // import StudyStaircaseTest from './StudyStaircaseTest.svelte';

  let view = getUrlParam(window, 'p') ?? 'study_prolific';
  // view = 'analysis_prolific';
  // view = 'none';
</script>

<main>
  <h1>Rhythm Error Sensitivity Study</h1>

  {#if view !== 'study_prolific'}
    <div>
      <button on:click="{() => (view = 'playground')}">Playground</button>
      <button on:click="{() => (view = 'examples')}">Examples</button>
      <button on:click="{() => (view = 'study')}">Study</button>
      <button on:click="{() => (view = 'analysis')}">Analysis</button>
      <button on:click="{() => (view = 'study_variance')}">
        Study (variance)
      </button>
      <button on:click="{() => (view = 'analysis_variance')}">
        Analysis (variance)
      </button>
      <button on:click="{() => (view = 'study_prolific')}">
        Study (Prolific)
      </button>
      <button on:click="{() => (view = 'analysis_prolific')}">
        Analysis (Prolific)
      </button>
    </div>
  {/if}

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
  {:else if view === 'analysis_prolific'}
    <AnalysisProlific />
  {/if}

  <!-- <StudyStaircaseTest /> -->
</main>
