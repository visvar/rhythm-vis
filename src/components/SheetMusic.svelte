<script>
  import { afterUpdate, onMount } from 'svelte';
  import * as opensheetmusicdisplay from 'opensheetmusicdisplay';
  import { cleanXml } from '../lib/lib';

  export let exercise;

  let container;
  let osmd;

  onMount(() => {
    osmd = new opensheetmusicdisplay.OpenSheetMusicDisplay(container);
    osmd.setOptions({
      autoResize: true,
      backend: 'svg',
      drawingParameters: 'compacttight',
      drawLyrics: false,
      autoGenerateMutipleRestMeasuresFromRestMeasures: false,
    });
    if (exercise) {
      displaySheet();
    }
  });

  const displaySheet = async () => {
    if (exercise) {
      const musicxml = await (await fetch(`/musicxml/${exercise}.xml`)).text();
      const cleaned = cleanXml(musicxml);
      await osmd.load(cleaned);
      await osmd.render();
    }
  };

  afterUpdate(displaySheet);
</script>

<main style="background: {exercise ? 'white' : 'none'}">
  <div bind:this="{container}"></div>
</main>

<style>
  main {
    background: white;
    border-radius: 5px;
  }
  div {
    transform: scale(0.7);
  }
</style>
