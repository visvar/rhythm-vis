<script>
  import Playground from './Playground.svelte';
  import Study from './Study.svelte';
  import StaircaseTest from './lib/StaircaseJS/StaircaseTest.svelte';

  let view = 'study';
</script>

<main>
  <h1>Rhythm Error Perception Study</h1>

  <div>
    <button on:click="{() => (view = 'playground')}">Playground</button>
    <button on:click="{() => (view = 'study')}">Study</button>
  </div>

  {#if view === 'playground'}
    <Playground />
  {:else if view === 'study'}
    <Study />
  {/if}

  <!-- <StaircaseTest /> -->
</main>

<style>
</style>
