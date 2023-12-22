<script>
  import PlotLine from './lib/StaircaseJS/PlotLine.svelte';
  import * as d3 from 'd3';
  import PlotTickAllFinals from './plotsAnalysis/PlotTickAllFinals.svelte';
  import PlotTickCI from './plotsAnalysis/PlotTickCI.svelte';
  import PlotTickCiTrials from './plotsAnalysis/PlotTickCITrials.svelte';
  import PlotKde from './plotsAnalysis/PlotKDE.svelte';
  import PlotScatter from './plotsAnalysis/PlotScatter.svelte';

  let participants = [];
  let prolificDemographics = null;

  const handleFileInputDemo = async (evt) => {
    const file = evt.target.files[0];
    const content = await file.text();
    const csv = d3.csvParse(content);
    prolificDemographics = csv;
  };

  const handleFileInput = async (evt) => {
    const data2 = [];
    for (const file of evt.target.files) {
      const content = await file.text();
      data2.push(JSON.parse(content));
    }
    // log participant plus stimulus
    console.log(data2.map((d) => `${d.demographics.partID} ${d.studyStep}`));
    // take newest data of each participant
    const grouped = d3.groups(data2, (d) => d.demographics.partID);
    console.log(`${grouped.length} participants`, grouped);

    participants = data2
      // only take finished studies
      .filter((d) => d.studyStep === 'feedback')
      // combine with prolific demographics
      .map((d, i) => {
        return {
          ...d,
          demographics: {
            ...d.demographics,
            internalPID: i + 1,
          },
          prolificDemogr: prolificDemographics.filter(
            (pd) => pd['Participant id'] === d.demographics.partID,
          )[0],
        };
      });
    console.log('participants', participants);
  };

  /**
   * One row per test, tidy data
   * @param participants
   */
  const makeTidyTests = (participants) => {
    if (participants.lenght === 0) {
      return [];
    }
    const tests = [];
    for (const participant of participants) {
      for (const test of participant.tests) {
        let testType = test.encoding;
        if (test.encoding === 'audio' || test.encoding === 'waveform') {
          testType = `${test.encoding} + ${
            test.audioFile.startsWith('./Fluid') ? 'piano' : 'drums'
          }`;
        }
        tests.push({
          ...participant.demographics,
          countryBirth: participant.prolificDemogr['Country of birth'],
          countryResidence: participant.prolificDemogr['Country of residence'],
          prolificApprovals: participant.prolificDemogr['Total approvals'],
          ...test,
          date: participant.date,
          testType,
        });
      }
    }
    console.log('tests', tests);
    return tests;
  };
  $: tests = makeTidyTests(participants);

  let finalValueLimit = 20;
  const filterTests = (tests, finalValueLimit) => {
    return tests.filter((d) => d.final < finalValueLimit);
  };
  $: testsFiltered = filterTests(tests, finalValueLimit);

  const perStimulus = (tests) => {
    if (tests.length === 0) {
      return [];
    }
    const ps = d3
      .groups(tests, (d) => d.testType)
      .map(([testType, ts]) => {
        const finals = ts.map((d) => d.final);
        return {
          encoding: testType,
          testType: testType,
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

  $: console.log(
    'tests by enc',
    d3.groups(tests, (d) => d.testType),
  );
</script>

<main>
  <h2>Analysis</h2>

  <p>
    Open a file that you saved after a study here to see the staircases and
    final values.
  </p>

  <label>
    Prolifc demographics CSV
    <input type="file" on:input="{handleFileInputDemo}" accept=".csv" />
  </label>
  <label>
    Results JSONs
    <input
      type="file"
      on:input="{handleFileInput}"
      accept=".json"
      multiple
      disabled="{prolificDemographics === null}"
    />
  </label>

  <div>
    {participants.length} participants completed -
    {tests.length} tests -
    {testsFiltered.length} filtered tests
  </div>

  <div>
    {#each d3.groups(tests, (d) => d.testType) as testEnc}
      <PlotKde
        title="{`Density of final values for ${testEnc[0]}`}"
        values="{testEnc[1].map((d) => d.final)}"
        xLabel="final values"
        xDomain="{[-1, 20]}"
      />
    {/each}
  </div>

  <PlotScatter
    title="Audio vs. Waveform"
    x="finalAudio"
    y="finalWaveform"
    xDomain="{[0, 20]}"
    yDomain="{[0, 20]}"
    data="{participants.map((d) => {
      console.log(d.tests);

      return {
        ...d.demographics,
        finalAudio: d.tests.filter((t) => t.encoding.startsWith('audio'))[0]
          .final,
        finalColor: d.tests.filter((t) => t.encoding.startsWith('color'))[0]
          .final,
        finalWaveform: d.tests.filter((t) =>
          t.encoding.startsWith('waveform'),
        )[0].final,
      };
    })}"
  />
  <PlotScatter
    title="Audio vs. Color"
    x="finalAudio"
    y="finalColor"
    xDomain="{[0, 20]}"
    yDomain="{[0, 20]}"
    data="{participants.map((d) => {
      return {
        ...d.demographics,
        finalAudio: d.tests.filter((t) => t.encoding.startsWith('audio'))[0]
          .final,
        finalColor: d.tests.filter((t) => t.encoding.startsWith('color'))[0]
          .final,
        finalWaveform: d.tests.filter((t) =>
          t.encoding.startsWith('waveform'),
        )[0].final,
      };
    })}"
  />

  <div>
    <h3>Mean and CI of Final Values</h3>
    <PlotTickCI {stimuli} />
  </div>

  <div>
    <h3>Mean and CI of Trial Counts</h3>
    <PlotTickCiTrials {stimuli} />
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
          {showAbsolute}
          height="{150}"
        />
      {/each}
    </div>
  {/each} -->

  <div>
    <h3>Feedback</h3>
    {#each participants as participant}
      <div style="text-align: left;">
        <b
          >P{participant.demographics.internalPID}
          {participant.demographics.partID}:</b
        >
        {#each participant.demographics.partFeedback.split('\n') as line}
          <p>{line}</p>
        {/each}
      </div>
    {/each}
  </div>
</main>

<style>
</style>
