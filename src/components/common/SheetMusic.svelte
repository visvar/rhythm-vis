<script>
  import { afterUpdate, onMount } from 'svelte';
  import * as opensheetmusicdisplay from 'opensheetmusicdisplay';
  import { downloadTextFile } from '../../lib/download';

  export let exercise;
  export let exerciseXml = null;
  export let showDownloadButton = true;

  let container;
  let osmd;
  let stringXml;

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
    if (exerciseXml) {
      stringXml = exerciseXml;
    } else if (exercise) {
      const url = window.location.pathname;
      stringXml = await (await fetch(`${url}/musicxml/${exercise}.xml`)).text();
    }
    if (stringXml) {
      const cleaned = cleanXml(stringXml);
      await osmd.load(cleaned);
      await osmd.render();
    }
  };

  afterUpdate(displaySheet);
</script>

<main style="background: {exercise ? 'white' : 'none'}">
  <div bind:this="{container}"></div>
  {#if showDownloadButton}
    <button
      on:click="{() =>
        downloadTextFile(document, stringXml, `${exercise}.musicxml`)}"
    >
      download exercise as MusicXML
    </button>
  {/if}
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
