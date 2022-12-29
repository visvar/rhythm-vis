<script>
  import { afterUpdate, onMount } from 'svelte';
  import * as opensheetmusicdisplay from 'opensheetmusicdisplay';

  export let exercise;

  let container;
  let osmd;

  const removeXmlElements = (parsedXml, selectors) => {
    for (const selector of selectors) {
      const elements = parsedXml.querySelectorAll(selector);
      for (const element of elements) {
        element.remove();
      }
    }
    return parsedXml;
  };

  const cleanXml = (stringXml) => {
    const parser = new DOMParser();
    const parsedXml = parser.parseFromString(stringXml, 'text/xml');
    const newXml = removeXmlElements(parsedXml, [
      // 'direction words',
      // 'note lyric',
      'dynamics',
    ]);
    const serializer = new XMLSerializer();
    return serializer.serializeToString(newXml);
  };

  onMount(() => {
    osmd = new opensheetmusicdisplay.OpenSheetMusicDisplay(container);
    osmd.setOptions({
      autoResize: true,
      backend: 'svg',
      drawingParameters: 'compacttight',
      drawTitle: false,
      drawLyrics: false,
      renderSingleHorizontalStaffline: true,
      autoGenerateMutipleRestMeasuresFromRestMeasures: false,
      percussionOneLineCutoff: 0,
      // spacingFactorSoftmax: 100,
    });
    if (exercise) {
      displaySheet();
    }
  });

  const displaySheet = async () => {
    if (exercise) {
      const url = window.location.pathname;
      const musicxml = await (
        await fetch(`${url}/musicxml/${exercise}.xml`)
      ).text();
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
    margin: auto;
    background: white;
    /* border: 1px solid #888; */
    border-radius: 5px;
    max-width: 90%;
    max-height: 400px;
    overflow: auto;
  }
  div {
    padding: 0;
    transform: scale(0.7);
  }
</style>
