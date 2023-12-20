<script>
  import PlotLine from './lib/StaircaseJS/PlotLine.svelte';
  import * as d3 from 'd3';
  import PlotTickAllFinals from './plotsAnalysis/PlotTickAllFinalsWithinPart.svelte';
  import PlotTickCI from './plotsAnalysis/PlotTickCI.svelte';
  import PlotTickCIParti from './plotsAnalysis/PlotTickCIParti.svelte';
  import PlotTickCiTrials from './plotsAnalysis/PlotTickCITrials.svelte';

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
          trialCounts: ts.map((d) => d.trialCount),
          // meanTrials: d3.mean(ts, (d) => d.trials),
          // meanScore: d3.mean(ts, (d) => d.score),
        };
      });
    console.log(ps);
    return ps;
  };
  $: stimuli = perStimulus(tests);
  $: maxFinal = d3.max(tests.map((d) => Math.abs(d.final)));

  const perParticipant = (tests, encoding) => {
    if (tests.length === 0) {
      return [];
    }
    if (encoding) {
      tests = tests.filter((d) => d.testType === encoding);
    }
    const pp = d3
      .groups(tests, (d) => d.partID)
      .map(([partID, ts]) => {
        const finals = ts.map((d) => d.final);
        return {
          partID,
          finals,
          finalMean: d3.mean(finals),
          finalVar: d3.variance(finals),
          trialCounts: ts.map((d) => d.trialCount),
          // meanTrials: d3.mean(ts, (d) => d.trials),
          // meanScore: d3.mean(ts, (d) => d.score),
        };
      });
    console.log(pp);
    return pp;
  };
  $: partis = perParticipant(tests);
  $: partisAudio = perParticipant(tests, 'audio + piano');
  $: partisWaveform = perParticipant(tests, 'waveform + piano');
  $: partisColor = perParticipant(tests, 'color');
</script>

<main>
  <h2>Analysis (Within-Participant Variance)</h2>

  <p>
    Open a file that you saved after a study here to see the staircases and
    final values.
  </p>

  <input type="file" on:input="{handleFileInput}" accept=".json" multiple />

  <div>
    <h3>Mean and CI of Final Values per Stimulus</h3>
    <PlotTickCI {stimuli} />
  </div>

  <div>
    <h3>Mean and CI of Trial Counts per Stimulus</h3>
    <PlotTickCiTrials {stimuli} />
  </div>

  <div>
    <h3>Mean and CI of Final Values per Participant</h3>
    <PlotTickCIParti {partis} />
    <h4>Only Audio</h4>
    <PlotTickCIParti partis="{partisAudio}" />
    <h4>Only Color</h4>
    <PlotTickCIParti partis="{partisColor}" />
    <h4>Only Waveform</h4>
    <PlotTickCIParti partis="{partisWaveform}" />
  </div>

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

  <!-- <div>
    <h3>Feedback</h3>
    {#each data as participant}
      <div style="text-align: left;">
        <b>P{participant.demographics.partID}:</b>
        {@html participant.demographics.partFeedback.split('\n').join('<br/>')}
      </div>
    {/each}
  </div> -->
</main>

<style>
</style>
