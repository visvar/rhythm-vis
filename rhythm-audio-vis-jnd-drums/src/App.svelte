<script>
  import Playground from './Playground.svelte';
  import StudyDrums from './StudyDrums.svelte';
  import Study8Note from './Study8Note.svelte';
  import StudyTempi from './StudyTempi.svelte';
  import AnalysisProlific from './AnalysisProlific.svelte';
  import AnalysisProlificTempi from './AnalysisProlificTempi.svelte';
  import { getUrlParam } from './lib/url';

  // let view = getUrlParam(window, 'p') ?? 'study_drums';
  let view = getUrlParam(window, 'p');
  // view = 'playground';
  // view = 'study_drums';
  // view = '';
  console.log(view);
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
  {:else if view === 'study_8note'}
    <Study8Note />
  {:else if view === 'study_drums'}
    <StudyDrums />
  {:else if view === 'study_tempi'}
    <StudyTempi />
  {:else if view === 'analysis'}
    <AnalysisProlific />
  {:else if view === 'analysis2'}
    <AnalysisProlificTempi />
  {/if}

  <!-- <StudyDrums_StaircaseTest /> -->
</main>
