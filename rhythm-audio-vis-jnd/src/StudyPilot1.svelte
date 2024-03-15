<script>
  import { generatePatternSimple, shuffleArray } from './lib/lib.js';
  import saveAs from 'file-saver';
  import Audio from './Audio.svelte';
  import PlotWaveform from './plots/PlotWaveform.svelte';
  import PlotTick from './plots/PlotTick.svelte';
  import PlotBar from './plots/PlotBar.svelte';
  import PlotColor from './plots/PlotColor.svelte';
  import { onMount } from 'svelte';
  import { Staircase } from './lib/StaircaseJS/StaircaseModule.js';
  // import PlotLine from './lib/StaircaseJS/PlotLine.svelte';

  const audioFiles = [
    './FluidR3_GM_acoustic_grand_piano-mp3_A4.mp3',
    './MailboxBadgerPublicDomainDrumSamples27LiveDrumsHiHat.mp3',
  ];
  let audioFile = audioFiles[0];

  let tests = [
    {
      stimulus: 'audio',
      audioFile: audioFiles[0],
    },
    {
      stimulus: 'audio',
      audioFile: audioFiles[1],
    },
    {
      stimulus: 'waveform',
      audioFile: audioFiles[0],
    },
    {
      stimulus: 'waveform',
      audioFile: audioFiles[1],
    },
    {
      stimulus: 'tick',
    },
    {
      stimulus: 'bar',
    },
    {
      stimulus: 'color',
    },
  ];

  // study progress
  // start, demo, tests, feedback, done
  let studyStep = 'start';
  let currentTestNumber = 0;
  let testStartTime;

  // participant data
  let partID = '';
  let partAge = '20-24';
  let partGender = 'm';
  let partEduation = 'master';
  let partMusicInstr = '';
  let partMusicInstrYears = 0;
  let partVisExperienceYears = 0;
  // final feedback
  let partFeedback = '';

  // Runtime variables
  let currentTrialNumber = 0;
  let validTrials;
  let currentTrial = {};
  let trials = [];
  let score;
  let stair;
  let testActive = false;
  let trialActive = false;
  let whiteScreenShowing = false;

  // stimulus variables
  // let encodings = ['audio', 'waveform', 'tick', 'bar', 'color'];
  let currentEncoding = 'tick';
  // inter-onset interval in seconds
  let ioi = 0.5;
  // deviation in percent of the ioi
  const initialPercentDeviation = 20;
  let percentDeviation = initialPercentDeviation;
  // deviation in seconds
  $: deviationSeconds = (percentDeviation / 100) * ioi;
  let noteCount = 6;
  let wrongNoteIndex = 4 - 1; // nth note means index n-1
  let shiftFollowing = true;
  let paddingStart = 0;
  // vis sizes
  let visWidth = 600;
  let visHeight = 100;

  let pattern = [];
  $: {
    pattern = generatePatternSimple(
      noteCount,
      ioi,
      wrongNoteIndex,
      deviationSeconds,
      shiftFollowing,
      paddingStart,
    );
    console.log('generated pattern', pattern);
  }

  // results
  let data = [];
  let final = 0;
  let feedback = '';
  const completeResults = [];

  onMount(() => {
    document.querySelector('html').addEventListener('keyup', keyPress);
  });

  const setupInstructions = () => {
    stair = new Staircase({
      ratio: {
        firstVal: initialPercentDeviation,
        down: 2, // down is the number of correct answers required before we increase the difficulty
        up: 1, // up is the number of incorrect answers before we decrease the difficulty
        stepSizeDown: 1, // how much we in/decrease by
        stepSizeUp: 1 * 0.5488, // Converge to 80.35% correct ('downUpRatio' and 'down' affect this)
        limits: [0, initialPercentDeviation], // don't allow equal ratio
        direction: -1, // -1 indicates that easier = greater values; 1 would indicate easier = lower values
        reversalLimit: 5, // How many reversals to do before stopping
        verbosity: 1, // Enable logging for debugging
        // sameStairMax: , // Maximum number of trials
      },
    });
    stair.init();
  };

  /**
   * Continue the study
   */
  function nextStudyStep() {
    if (studyStep === 'start') {
      tests = shuffleArray(tests);
      studyStep = 'demo';
    } else if (studyStep === 'demo') {
      studyStep = 'tests';
      currentTestNumber = 0;
    } else if (studyStep === 'tests') {
      if (currentTestNumber < tests.length) {
        currentEncoding = tests[currentTestNumber].stimulus;
        audioFile = tests[currentTestNumber].audioFile;
        startTest();
      } else {
        studyStep = 'feedback';
      }
    } else if (studyStep === 'feedback') {
      studyStep = 'done';
    }
  }

  /**
   * The test consists of multiple trials
   */
  function startTest() {
    setupInstructions();
    currentTrialNumber = 0;
    validTrials = 0;
    score = 0;
    testActive = true;
    data = [];
    trials = [];
    testStartTime = new Date();
    startTrial();
  }

  /*
   * Each trial consists of painting stimuli and obtaining a response from the participant
   */
  function startTrial() {
    console.log('Starting trial ' + currentTrialNumber);
    currentTrial = {};
    trialActive = true;
    drawStimuli();
  }

  function drawStimuli() {
    const p = Math.round(stair.getLast('ratio'));
    let deviation = p;
    deviation = Math.random() < 0.5 ? deviation : -deviation;
    currentTrial.deviation = deviation;
    percentDeviation = deviation;

    console.log('generated pattern', pattern);
    // avoid showing a visualization directly after the previous to prevent participants from seeing the change
    whiteScreenShowing = true;
    window.setTimeout(() => {
      whiteScreenShowing = false;
    }, 1000);
  }

  function decisionClick(id) {
    if (!trialActive) {
      return;
    }
    trialActive = false;
    currentTrial.decisionChoice = id;
    currentTrial.errorCode = 0;

    // process trial result
    const oldScore = score;
    if (
      ((currentTrial.decisionChoice == 0 && currentTrial.deviation < 0) ||
        (currentTrial.decisionChoice == 1 && currentTrial.deviation > 0)) &&
      currentTrial.errorCode == 0
    ) {
      score++;
    }
    if (currentTrial.errorCode == 0) {
      // if correct, go to next step
      stair.next(oldScore != score);
      // store current trial
      trials[trials.length] = currentTrial;
    }

    if (currentTrial.errorCode == 0) {
      validTrials++;
    }
    currentTrialNumber++;

    if (!stair.reversalLimitReached('ratio')) {
      // next trial
      startTrial();
    } else {
      // test complete
      // show block feedback
      endTest();
    }
  }

  function endTest() {
    testActive = false;
    getFeedbackText();
    // store result
    data = [];
    final = stair.getFinalVal('ratio');
    for (let i = 0; i < trials.length; i++) {
      data[i] = trials[i].deviation;
    }
    console.log(data);
    const testEndTime = new Date();
    completeResults.push({
      encoding: currentEncoding,
      audioFile,
      final,
      data,
      score,
      testNumber: currentTestNumber,
      trialCount: currentTrialNumber + 1,
      trials,
      validTrialCount: validTrials + 1,
      testTimeSeconds: (testEndTime - testStartTime) / 1000,
    });
    // console.log('results (all)', completeResults);
    currentTestNumber++;
  }

  function keyPress(evt) {
    console.log(evt.key);
    switch (evt.key) {
      case 'ArrowLeft':
        decisionClick(0);
        break;
      case 'ArrowRight':
        decisionClick(1);
        break;
      case 'PageDown':
        if (!trialActive && !(studyStep === 'done')) {
          nextStudyStep();
        }
    }
  }

  function getFeedbackText() {
    feedback = `You scored ${score} / ${currentTrialNumber + 1} (${(
      (score / (currentTrialNumber + 1)) *
      100
    ).toFixed(1)}%) Your end difficulty was ${stair.getFinalVal('ratio')}`;
  }

  function endStudy() {
    const data = {
      demographics: {
        partID,
        partAge,
        partGender,
        partEduation,
        partMusicInstr,
        partMusicInstrYears,
        partVisExperienceYears,
        partFeedback,
      },
      date: new Date().toISOString(),
      tests: completeResults,
    };
    console.log(data);
    const json = JSON.stringify(data, undefined, 2);
    const blob = new Blob([json], {
      type: 'text/plain;charset=utf-8',
    });
    saveAs(blob, 'results.json');
  }

  // function beforeUnload(event) {
  //   // Cancel the event as stated by the standard.
  //   event.preventDefault();
  //   // Chrome requires returnValue to be set.
  //   event.returnValue = '';
  //   // more compatibility
  //   return '...';
  // }
</script>

<!-- <svelte:window on:beforeunload="{beforeUnload}" /> -->
<main>
  <h2>Study</h2>

  <!-- Demographics form -->
  {#if studyStep === 'demo'}
    <div class="demo-form">
      <label>
        ID:
        <input type="text" bind:value="{partID}" placeholder="ID" />
      </label>
      <label>
        Age:
        <select bind:value="{partAge}">
          <option value="20-24">20-24</option>
          <option value="25-29">25-29</option>
          <option value="30-34">30-34</option>
          <option value="35-39">35-39</option>
          <option value="40-44">40-44</option>
          <option value="45-49">45-49</option>
          <option value="50-54">50-54</option>
          <option value="55-60">55-60</option>
        </select>
      </label>
      <label>
        Gender:
        <input
          type="text"
          bind:value="{partGender}"
          placeholder="m, f, d, or self-describe"
        />
      </label>
      <label>
        Highest finished education (select the best fitting one):
        <select bind:value="{partEduation}">
          <option value="none">none</option>
          <option value="highs">high school</option>
          <option value="bachelor">bachelor</option>
          <option value="master">master</option>
          <option value="phd">phd</option>
        </select>
      </label>
      <label>
        Which music instruments do you play?
        <input
          type="text"
          bind:value="{partMusicInstr}"
          placeholder="free text"
        />
      </label>
      <label>
        For how many years do you roughly play it/them?
        <input
          type="number"
          bind:value="{partMusicInstrYears}"
          min="0"
          step="1"
        />
      </label>
      <label>
        How many years of experience do you have with visualization?
        <input
          type="number"
          bind:value="{partVisExperienceYears}"
          min="0"
          step="1"
        />
      </label>
    </div>
  {/if}

  <!-- Test -->
  {#if studyStep === 'tests'}
    <p>
      You will be presented with a sequence of six notes which should have equal
      distances. The <b>fourth note</b> might be played too early or too late, also
      affecting the ones after.
    </p>

    {#if testActive}
      <p>Use the arrow keys: left for too early, right for too late.</p>
      <p>Test number {currentTestNumber + 1} / {tests.length}</p>
      <p>Trial number {currentTrialNumber + 1}</p>
      {#if currentEncoding === 'audio'}
        <Audio
          pattern="{[
            ...pattern.slice(0, pattern.length - 1),
            pattern.at(-1) + Math.random() * 0.0001,
          ]}"
          {audioFile}
          {currentTrialNumber}
        />
        <p>You can play the audio as many times as you like.</p>
      {:else if whiteScreenShowing === false}
        <!-- white screen helps avoid seeing the change between consecutive stimuli -->
        {#if currentEncoding === 'waveform'}
          <PlotWaveform
            {pattern}
            {audioFile}
            width="{visWidth}"
            height="{visHeight}"
          />
        {:else if currentEncoding === 'tick'}
          <PlotTick {pattern} width="{visWidth}" height="{visHeight}" />
        {:else if currentEncoding === 'bar'}
          <PlotBar {pattern} width="{visWidth}" height="{visHeight}" />
        {:else if currentEncoding === 'color'}
          <PlotColor {pattern} width="{visWidth}" height="{visHeight}" />
        {/if}
      {/if}
      <!-- when test is over and data is there, show it -->
      <!-- {:else if data.length > 0}
      <p>{feedback}</p>
      <PlotLine data="{data}" final="{final}" /> -->
    {/if}
  {/if}

  <!-- Feedback -->
  {#if studyStep === 'feedback'}
    <div>
      <label>
        Any final feedback?
        <textarea bind:value="{partFeedback}"></textarea>
      </label>
    </div>
  {/if}

  <!-- Study done -->
  {#if studyStep === 'done'}
    <div>Thanks for participating!</div>
    <div>
      <button on:click="{endStudy}"> Download results </button>
    </div>
  {/if}

  {#if !trialActive && !(studyStep === 'done')}
    <button on:click="{nextStudyStep}">next step (PageDown)</button>
  {/if}
</main>

<style>
  main {
    text-align: center;
  }
  .demo-form label {
    display: block;
  }
</style>
