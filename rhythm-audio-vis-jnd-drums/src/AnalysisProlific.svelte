<script>
  import PlotLine from './plotsAnalysis/PlotLine.svelte';
  import saveAs from 'file-saver';
  import * as d3 from 'd3';
  import PlotTickAllFinals from './plotsAnalysis/PlotTickAllFinals.svelte';
  import PlotTickCI from './plotsAnalysis/PlotTickCI.svelte';
  import PlotTickCiTrials from './plotsAnalysis/PlotTickCITrials.svelte';
  import PlotKde from './plotsAnalysis/PlotKDE.svelte';
  import PlotScatter from './plotsAnalysis/PlotScatter.svelte';

  let participants = [];
  let prolificDemographics = null;
  const visWidth = 1200;
  let kdeBandwidth = 0.001;

  // const handleFileInputDemo = async (evt) => {
  //   const file = evt.target.files[0];
  //   const content = await file.text();
  //   const csv = d3.csvParse(content);
  //   prolificDemographics = csv;
  // };

  const handleFileInput = async (evt) => {
    const data2 = [];
    prolificDemographics = [];
    for (const file of evt.target.files) {
      if (file.name.endsWith('.csv')) {
        // Prolific demographics
        const content = await file.text();
        const csv = d3.csvParse(content);
        prolificDemographics = [...prolificDemographics, ...csv];
        console.log('p demo', prolificDemographics);
      } else {
        // participant results
        const content = await file.text();
        data2.push(JSON.parse(content));
      }
    }
    // log participant plus stimulus
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
          // shorthand for final values of all encodings
          finalAudio: d.tests.filter((t) => t.encoding.startsWith('audio'))[0]
            .final,
          finalColor: d.tests.filter((t) => t.encoding.startsWith('color'))[0]
            .final,
          finalWaveform: d.tests.filter((t) =>
            t.encoding.startsWith('waveform'),
          )[0].final,
          // representation order
          encodingOrder: d.tests.map((t) => t.encoding).join(', '),
        };
      })
      .filter((d) => d.prolificDemogr !== undefined);
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
    /**
     * Converts age in years to something like '20-24'
     * @param {number} age age in years
     * @param {number} step size of the age brackets
     * @returns {string} age bracket in steps of `step`
     */
    const ageToYearBracked = (age, step = 5) => {
      const lower = Math.floor(age / step) * step;
      return `${lower}-${lower + step - 1}`;
    };
    const tests = [];
    for (const participant of participants) {
      for (const [index, test] of participant.tests.entries()) {
        // let testType = `${test.encoding} + ${test.pattern}`;
        let testType = test.encoding;
        tests.push({
          studyName: participant.studyName,
          ...participant.demographics,
          partAge: participant.demographics.partAge
            ? participant.demographics.partAge
            : ageToYearBracked(participant.prolificDemogr.Age, 10),
          partSex: participant.demographics.partGender
            ? participant.demographics.partGender
            : participant.prolificDemogr.Sex,
          countryBirth: participant.prolificDemogr['Country of birth'],
          countryResidence: participant.prolificDemogr['Country of residence'],
          prolificApprovals: participant.prolificDemogr['Total approvals'],
          ...test,
          date: participant.date,
          testType,
          testOrder: index,
          // outlier?
          isOutlier: isOutlier(test, 10, 0.1, 2),
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
    // console.log(ps);
    return ps;
  };
  $: stimuli = perStimulus(tests);
  $: maxFinal = d3.max(tests.map((d) => Math.abs(d.final)));

  $: console.log(
    'tests by enc',
    d3.groups(tests, (d) => d.testType),
  );

  const isOutlier = (
    test,
    startIndex = 10,
    valueLimit = 0.1,
    toleranceCount = 2,
  ) => {
    const staircase = test.data.map(Math.abs);
    let count = 0;
    for (let index = startIndex; index < staircase.length; index++) {
      if (staircase[index] >= valueLimit) {
        count++;
        if (count >= toleranceCount) {
          return true;
        }
      }
    }
    return false;
  };

  const exportJSON = () => {
    // participants
    const jsonP = JSON.stringify(participants, undefined, 2);
    const blobP = new Blob([jsonP], {
      type: 'text/plain;charset=utf-8',
    });
    saveAs(blobP, 'participants.json');
    // tests
    const jsonT = JSON.stringify(tests, undefined, 2);
    const blobT = new Blob([jsonT], {
      type: 'text/plain;charset=utf-8',
    });
    saveAs(blobT, 'tests.json');
  };
</script>

<main>
  <h2>Analysis</h2>

  <div>
    <label>
      Results JSONs and Prolific demographics CSV
      <input
        type="file"
        on:input="{handleFileInput}"
        accept=".json,.csv"
        multiple
      />
    </label>
    <button on:click="{exportJSON}">export JSON</button>
  </div>

  <div>
    {participants.length} participants completed -
    {tests.length} tests -
    {testsFiltered.length} filtered tests
  </div>

  <div>
    <h3>Studies</h3>
    {#each d3
      .groups(participants, (d) => d.studyName)
      .map(([study, parts]) => `${study} had ${parts.length} parts`) as row}
      <div>{row}</div>
    {/each}
  </div>

  <div>
    <h3>Encoding order</h3>
    {#each d3
      .groups(participants, (d) => d.encodingOrder)
      .sort((a, b) => a[1].lenght - b[1].length) as [order, parts]}
      <p>{order}: {parts.length} times</p>
    {/each}
  </div>

  <div>
    {#each d3.groups(tests, (d) => d.testType) as testEnc}
      <PlotKde
        title="{`Density of final values for ${testEnc[0]}`}"
        values="{testEnc[1].map((d) => d.final)}"
        xLabel="final values"
        xDomain="{[-0.01, 0.2]}"
        bandwidth="{kdeBandwidth}"
      />
    {/each}
  </div>

  <div>
    <!-- {#each [...tests].sort((a, b) => a.final - b.final) as test} -->
    {#each tests as test}
      <PlotLine
        title="{test.studyName} P{test.internalPID} {test.encoding} {test.data
          .length} trials {test.isOutlier ? 'OUTLIER' : ''}"
        final="{test.final}"
        width="{visWidth}"
        height="{120}"
        data="{test.data}"
        x="{(d, i) => i}"
        y="{(d) => Math.abs(d)}"
        xDomain="{[0, 165]}"
      />
    {/each}
  </div>

  <PlotScatter
    title="Audio vs. Waveform"
    x="finalAudio"
    y="finalWaveform"
    tipTitle="partID"
    fill="studyName"
    xDomain="{[0, 0.1]}"
    yDomain="{[0, 0.1]}"
    data="{participants}"
  />
  <PlotScatter
    title="Audio vs. Color"
    x="finalAudio"
    y="finalColor"
    fill="studyName"
    tipTitle="partID"
    xDomain="{[0, 0.1]}"
    yDomain="{[0, 0.1]}"
    data="{participants}"
  />

  <div>
    <h3>Mean and CI of Final Values</h3>
    <PlotTickCI {stimuli} />
  </div>

  <!-- <div>
    <h3>Mean and CI of Trial Counts</h3>
    <PlotTickCiTrials {stimuli} />
  </div> -->

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
    {#each participants.filter((d) => d.demographics.partFeedback.trim().length > 0) as participant}
      <div style="text-align: left;">
        <b>
          P{participant.demographics.internalPID}
        </b>
        {participant.demographics.partID}:
        {#each participant.demographics.partFeedback.split('\n') as line}
          <p>{line}</p>
        {/each}
      </div>
    {/each}
  </div>
</main>

<style>
</style>
