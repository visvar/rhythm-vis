<script>
  import PlotLine from './lib/StaircaseJS/PlotLine.svelte';
  import * as d3 from 'd3';
  import PlotTickAllFinals from './plotsAnalysis/PlotTickAllFinals.svelte';
  import PlotTickCI from './plotsAnalysis/PlotTickCI.svelte';

  let data = [];
  let fileNames = [];
  // let showAbsolute = false;

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
        let testType = test.encoding;
        if (test.encoding === 'audio' || test.encoding === 'waveform') {
          testType = `${test.encoding} + ${
            test.audioFile.startsWith('./Fluid') ? 'piano' : 'drums'
          }`;
        }
        tests.push({
          ...participant.demographics,
          ...test,
          date: participant.date,
          testType,
        });
      }
    }
    console.log(tests);
    return tests;
  };
  $: tests = makeTidy(data);

  const perStimulus = (tests) => {
    if (tests.length === 0) {
      return [];
    }
    const ps = d3
      .groups(tests, (d) => d.testType)
      .map(([enc, ts]) => {
        const finals = ts.map((d) => d.final);
        return {
          encoding: enc,
          finals,
          finalMean: d3.mean(finals),
          finalVar: d3.variance(finals),
          // finals: ts.map((d) => d.final),
          // meanTrials: d3.mean(ts, (d) => d.trials),
          // meanScore: d3.mean(ts, (d) => d.score),
        };
      });
    console.log(ps);
    return ps;
  };
  $: stimuli = perStimulus(tests);
  $: maxFinal = d3.max(tests.map((d) => Math.abs(d.final)));
</script>

<main>
  <h2>Analysis</h2>

  <p>
    Open a file that you saved after a study here to see the staircases and
    final values.
  </p>

  <input type="file" on:input="{handleFileInput}" accept=".json" multiple />

  <!-- <button on:click="{() => (showAbsolute = !showAbsolute)}">
    toggle absolute values {showAbsolute}
  </button> -->

  <div>
    <h3>Final Values for Each Stimulus and All Participants</h3>
    {#each stimuli as stimulus}
      <b>{stimulus.encoding}</b>
      <PlotTickAllFinals
        data="{stimulus.finals}"
        title="{stimulus.encoding}"
        domain="{[0, maxFinal]}"
      />
    {/each}
  </div>

  <div>
    <h3>Mean and CI of Final Values</h3>
    <PlotTickCI stimuli="{stimuli}" />
  </div>

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
