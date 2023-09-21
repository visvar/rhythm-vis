<script>
  import Playground from './Playground.svelte';
  import Study from './Study.svelte';

  let view = '';
</script>

<main>
  <h1>Rhythm Error Perception Study</h1>
  <p>
    You will be presented with a sequence of six notes which should have equal
    distances. The <b>fourth note</b> might be played wrong (too early or too late)
    and this deviation sound good, ok, or wrong. Please rate based your subjective
    opinion! You can play the audio as many times as you like.
  </p>

  <div>
    <button on:click="{() => (view = 'playground')}">Playground</button>
    <button on:click="{() => (view = 'study')}">Study</button>
  </div>

  {#if view === 'playground'}
    <Playground />
  {:else if view === 'study'}
    <Study />
  {/if}
</main>

<style>
</style>
