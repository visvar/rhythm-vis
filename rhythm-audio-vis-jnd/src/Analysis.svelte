<script>
  import PlotLine from './lib/StaircaseJS/PlotLine.svelte';
  import * as d3 from 'd3';

  let data = [];
  let fileNames = [];
  let showAbsolute = false;

  const handleFileInput = async (evt) => {
    const data2 = [];
    const fileNames2 = [];
    for (const file of evt.target.files) {
      const content = await file.text();
      data2.push(JSON.parse(content));
      fileNames2.push(file.name);
    }
    data = data2;
    fileNames = fileNames2;
    console.log(data);
  };

  /**
   * One row per test, tidy data
   * @param data
   */
  const makeTidy = (data) => {
    if (data.lenght === 0) {
      return [];
    }
    const tests = [];
    for (const participant of data) {
      for (const test of participant.tests) {
        tests.push([...participant.demographics, ...test, participant.date]);
      }
    }
    return tests;
  };
  $: tests = makeTidy(data);

  const perStimulus = (tests) => {
    d3.groups(tests, (d) => {
      if (d.encoding === 'audio' || d.encoding === 'waveform') {
        return `${d.encoding} + ${
          d.audioFile.startsWith('./Fluid') ? 'piano' : 'drums'
        }`;
      }
      return d.encoding;
    }).map(([enc, ts]) => {
      return {
        meanFinal: d3.mean(ts, (d) => d.final),
        meanTrials: d3.mean(ts, (d) => d.final),
        meanScore: d3.mean(ts, (d) => d.final),
      };
    });
  };
  $: stimuli = perStimulus(tests);
</script>

<main>
  <h2>Analysis</h2>

  <p>
    Open a file that you saved after a study here to see the staircases and
    final values.
  </p>

  <input type="file" on:input="{handleFileInput}" accept=".json" multiple />

  <button on:click="{() => (showAbsolute = !showAbsolute)}">
    toggle absolute values {showAbsolute}
  </button>

  <div></div>

  <!-- {#each data as d, index}
    <div>
      <h4>{fileNames[index]}</h4>
      {#each d as test}
        <h5>{test.encoding}</h5>
        {test.encoding === 'audio' || test.encoding === 'waveform'
          ? test.audioFile
          : ''}
        (final: {test.final.toFixed(2)})
        <PlotLine
          data="{test.data}"
          final="{test.final}"
          showAbsolute="{showAbsolute}"
          height="{150}"
        />
      {/each}
    </div>
  {/each} -->
</main>

<style>
</style>
