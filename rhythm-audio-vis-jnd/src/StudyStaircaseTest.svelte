<script>
  import {
    fetchAudio,
    generatePatternSimple,
    shuffleArray,
  } from './lib/lib.js';
  import Audio from './AudioCached.svelte';
  import PlotWaveform from './plots/PlotWaveform.svelte';
  import PlotTick from './plots/PlotTick.svelte';
  import PlotBar from './plots/PlotBar.svelte';
  import PlotColor from './plots/PlotColor.svelte';
  import { onMount } from 'svelte';
  import { Staircase } from './lib/StaircaseJS/StaircaseModule.js';
  import { getUrlParam } from './lib/url.js';
  import AudioExample from './AudioExample.svelte';

  const serverUrl = '/store';

  // prolific params
  let partID = getUrlParam(window, 'PROLIFIC_PID');
  let studyID = getUrlParam(window, 'STUDY_ID');
  let sessionID = getUrlParam(window, 'SESSION_ID');
  // console.log({ partID, studyID, sessionID });

  const audioFiles = [
    './FluidR3_GM_acoustic_grand_piano-mp3_A4.mp3',
    './MailboxBadgerPublicDomainDrumSamples27LiveDrumsHiHat.mp3',
  ];
  let audioFile = audioFiles[0];
  let cachedAudio;
  // fetchAudio(audioFile).then((d) => {
  //   cachedAudio = d;
  //   console.log('Audio fetched', d);
  // });

  let tests = [
    {
      stimulus: 'bar',
    },
    {
      stimulus: 'bar',
    },
    {
      stimulus: 'bar',
    },
  ];

  const examplePatternEarly = [0, 0.5, 1, 1.4, 1.9, 2.4];
  const examplePatternLate = [0, 0.5, 1, 1.6, 2.1, 2.6];

  // study progress
  // consent, start1, start2, demo, tests, feedback, done
  let studyStep = 'tests';
  let currentTestNumber = 0;
  let testStartTime;

  // participant data
  // let partID = '';
  // let partAge = '';
  // let partGender = '';
  let partEduation = '';
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
  $: deviationSeconds = (percentDeviation / 100.0) * ioi;
  let noteCount = 6;
  let wrongNoteIndex = 4 - 1; // nth note means index n-1
  let shiftFollowing = true;
  let paddingStart = 0;
  // vis sizes
  let visWidth = 600;
  $: visHeight = visWidth / 6;

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

  // const setupInstructions = () => {
  //   stair = new Staircase({
  //     ratio: {
  //       operation: 'multiply',
  //       firstVal: initialPercentDeviation,
  //       down: 2, // down is the number of correct answers required before we increase the difficulty
  //       // up: 1, // up is the number of incorrect answers before we decrease the difficulty
  //       stepSizeDown: 1.5, // how much we in/decrease by
  //       stepSizeUp: 1.5, // Converge to 80.35% correct ('downUpRatio' and 'down' affect this)
  //       limits: [0, initialPercentDeviation], // don't allow equal ratio
  //       direction: -1, // -1 indicates that easier = greater values; 1 would indicate easier = lower values
  //       reversalLimit: 8, // How many reversals to do before stopping
  //       verbosity: 1, // Enable logging for debugging
  //       // sameStairMax: , // Maximum number of trials
  //     },
  //   });
  //   stair.init();
  // };
  const setupInstructions = () => {
    stair = new Staircase({
      ratio: {
        firstVal: initialPercentDeviation,
        down: 2, // down is the number of correct answers required before we increase the difficulty
        up: 1, // up is the number of incorrect answers before we decrease the difficulty
        stepSizeDown: 1, // how much we in/decrease by
        stepSizeUp: 0.5488, // Converge to 80.35% correct ('downUpRatio' and 'down' affect this)
        limits: [0, initialPercentDeviation], // don't allow equal ratio
        direction: -1, // -1 indicates that easier = greater values; 1 would indicate easier = lower values
        reversalLimit: 5, // How many reversals to do before stopping
        // verbosity: 1, // Enable logging for debugging
        verbosity: 0, // Enable logging for debugging
        // sameStairMax: , // Maximum number of trials
      },
    });
    stair.init();
  };

  /**
   * Continue the study
   */
  function nextStudyStep() {
    if (studyStep === 'consent') {
      studyStep = 'start1';
    } else if (studyStep === 'start1') {
      studyStep = 'start2';
    } else if (studyStep === 'start2') {
      tests = shuffleArray(tests);
      studyStep = 'demo';
    } else if (studyStep === 'demo') {
      // check if filled
      if (
        // partAge == '' ||
        // partGender == '' ||
        partEduation == '' ||
        partMusicInstr == ''
      ) {
        alert('please fill the form first');
      } else {
        studyStep = 'tests';
        currentTestNumber = 0;
      }
    } else if (studyStep === 'tests') {
      // save data already after each test
      // saveData();
      if (currentTestNumber < tests.length) {
        currentEncoding = tests[currentTestNumber].stimulus;
        audioFile = tests[currentTestNumber].audioFile;
        startTest();
      } else {
        studyStep = 'feedback';
      }
    } else if (studyStep === 'feedback') {
      // save data after feedback
      // saveData();
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
    console.log(stair);

    const p = stair.getLast('ratio');
    console.log('current value', p);

    let deviation = p;
    deviation = Math.random() < 0.5 ? deviation : -deviation;
    currentTrial.deviation = deviation;
    percentDeviation = deviation;
    currentTrial.startTime = new Date();

    // console.log('generated pattern', pattern);
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
    currentTrial.timeTaken = (new Date() - currentTrial.startTime) / 1000;

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
    // console.log(evt.key);
    // prevent skipping whitescreen
    // if (whiteScreenShowing) {
    //   return;
    // }
    switch (evt.key) {
      case 'ArrowLeft':
        if (trialActive) {
          decisionClick(0);
        }
        break;
      case 'ArrowRight':
        if (trialActive) {
          decisionClick(1);
        }
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

  function saveData() {
    const data = {
      studyStep,
      demographics: {
        // prolific parameters
        partID,
        studyID,
        sessionID,
        // demographics
        // partAge,
        // partGender,
        partEduation,
        partMusicInstr,
        partMusicInstrYears,
        partVisExperienceYears,
        partFeedback,
        // corresponds to zoom set by participant
        visWidth,
      },
      date: new Date().toISOString(),
      tests: completeResults,
    };
    console.log('saving data', data);
    const json = JSON.stringify(data, undefined, 2);
    // const blob = new Blob([json], {
    //   type: 'text/plain;charset=utf-8',
    // });
    // saveAs(blob, 'results.json');
    // post to server
    fetch(serverUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: json,
    }).then((res) => {
      console.log('Data saved:', res);
    });
  }
</script>

<main>
  <!-- Test -->
  {#if studyStep === 'tests'}
    <p>
      You will be presented with a sequence of six piano notes which should have
      equal distances in time. The <b>fourth note</b> might be played
      <b>too early or too late</b>, also affecting the ones after. This
      deviation will get smaller, but you always have to answer "early" or
      "late".
    </p>

    {#if testActive}
      <p>
        Test number {currentTestNumber + 1} / {tests.length}, trial number {currentTrialNumber +
          1}
      </p>
      <PlotBar {pattern} width="{visWidth}" height="{visHeight}" />
    {/if}
  {/if}

  <!-- Feedback -->
  {#if studyStep === 'feedback'}
    <div>
      <label>
        Do you have any final feedback/comments?
        <textarea bind:value="{partFeedback}"></textarea>
      </label>
    </div>
  {/if}

  <!-- Study done -->
  {#if studyStep === 'done'}
    <div>Thanks for participating!</div>
    <a href="https://app.prolific.com/submissions/complete?cc=CQ9EMXZQ">
      click here to get your compensation
    </a>
  {/if}

  <!-- show next step button -->
  {#if !trialActive && !(studyStep === 'done')}
    <!-- <button on:click="{nextStudyStep}">next step (PageDown)</button> -->
    <button on:click="{nextStudyStep}" class="next-btn">next step</button>
  {/if}

  <button on:click="{saveData}" class="next-btn">save data</button>
</main>

<style>
  main {
    text-align: center;
  }

  .demo-form {
    margin: auto;
    width: 500px;
    display: grid;
    gap: 30px;
  }

  .demo-form label {
    display: grid;
    grid-template-columns: auto;
  }

  .vis-example {
    margin: 20px;
    padding: 10px;
    display: grid;
    grid-template-columns: 1fr 1fr;
    background: #eee;
    border-radius: 10px;
  }

  .vis-example div {
    column-span: all;
  }

  .next-btn {
    margin-top: 30px;
  }
</style>
