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
  import PlotLine from './plotsAnalysis/PlotLine2.svelte';

  const serverUrl = '/store';

  // prolific params
  let partID = getUrlParam(window, 'PROLIFIC_PID');
  let studyID = getUrlParam(window, 'STUDY_ID');
  let sessionID = getUrlParam(window, 'SESSION_ID');
  // console.log({ partID, studyID, sessionID });

  const audioFiles = [
    './FluidR3_GM_acoustic_grand_piano-mp3_A4.mp3',
    './MailboxBadgerPublicDomainDrumSamples27LiveDrumsHiHat.mp3',
    './snare2.mp3',
  ];
  let audioFile = audioFiles[2];
  let cachedAudio;
  fetchAudio(audioFile).then((d) => {
    cachedAudio = d;
    console.log('Audio fetched', d);
  });

  let tests = [
    {
      stimulus: 'color',
    },
    {
      stimulus: 'audio',
      audioFile,
    },
    {
      stimulus: 'waveform',
      audioFile,
    },
    // {
    //   stimulus: 'tick',
    // },
    // {
    //   stimulus: 'bar',
    // },
  ];

  const examplePatternEarly = [0, 0.5, 1, 1.4, 1.9, 2.4];
  const examplePatternLate = [0, 0.5, 1, 1.6, 2.1, 2.6];

  // study progress
  // consent, start1, start2, demo, tests, feedback, done
  let studyStep = 'consent'; // TODO:
  // let studyStep = 'tests';
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
  // deviation in seconds
  const initialErrorSeverity = 0.1;
  // deviation in seconds
  let noteCount = 6;
  let wrongNoteIndex = 4 - 1; // nth note means index n-1
  let shiftFollowing = true;
  let paddingStart = 0;
  // vis sizes
  let visWidth = 600;
  $: visHeight = visWidth / 6;

  let pattern = [];

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
      // ratio: {
      //   firstVal: initialPercentDeviation,
      //   down: 2, // down is the number of correct answers required before we increase the difficulty
      //   up: 1, // up is the number of incorrect answers before we decrease the difficulty
      //   stepSizeDown: 1, // how much we in/decrease by
      //   stepSizeUp: 1 * 0.5488, // Converge to 80.35% correct ('downUpRatio' and 'down' affect this)
      //   limits: [0, initialPercentDeviation], // don't allow equal ratio
      //   direction: -1, // -1 indicates that easier = greater values; 1 would indicate easier = lower values
      //   reversalLimit: 5, // How many reversals to do before stopping
      //   // verbosity: 1, // Enable logging for debugging
      //   verbosity: 0, // Enable logging for debugging
      //   // sameStairMax: , // Maximum number of trials
      // },
      ratio: {
        firstVal: initialErrorSeverity,
        operation: 'multiply',
        down: 2, // down is the number of correct answers required before we increase the difficulty
        up: 1, // up is the number of incorrect answers before we decrease the difficulty
        stepSizeDown: 1.25, // how much we in/decrease by
        stepSizeUp: 1.25,
        limits: [0, initialErrorSeverity], // don't allow equal ratio
        direction: -1, // -1 indicates that easier = greater values; 1 would indicate easier = lower values
        reversalLimit: 12, // How many reversals to do before stopping
        // verbosity: 0, // Enable logging for debugging
        verbosity: 1, // Enable logging for debugging
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
      saveData();
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
    const p = stair.getLast('ratio');
    let deviation = p;
    deviation = Math.random() < 0.5 ? deviation : -deviation;
    currentTrial.deviation = deviation;
    currentTrial.startTime = new Date();
    console.log({ deviation });

    pattern = generatePatternSimple(
      noteCount,
      ioi,
      wrongNoteIndex,
      deviation,
      shiftFollowing,
      paddingStart,
    );

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
    trialActive = false;
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
    if (whiteScreenShowing) {
      return;
    }
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
  <!-- <h2>Study (Prolific)</h2> -->

  {#if studyStep === 'consent'}
    <div>
      <p>
        In this study, we will present you with audio and visual representations
        of rhythmic patterns and record how precisely people can perceive them.
        We will also ask for your level of education and experience with music
        and visualization. This data will be analyzed and published in
        summarized, anonymized form.
      </p>
      <p>
        For more details, you can read the following documents:
        <a href="consent.pdf">consent.pdf</a>,
        <a href="privacy.pdf">privacy.pdf</a>.
      </p>
      <p>
        By clicking <i>next step</i> you consent to participating in this study and
        data collection.
      </p>
      <p>
        If you do not consent, click <i>I do not consent</i> below, you then cannot
        participate in this study.
      </p>
      <a href="https://app.prolific.com/submissions/complete?cc=CLB832WS">
        <button>I do NOT consent and will not participate</button>
      </a>
    </div>
  {/if}

  {#if studyStep === 'start1'}
    <div>
      <p>
        To make sure that the audio works for you, please click play. Please set
        the audio volume to a comfortable level that allows you to hear this
        pattern clearly.
      </p>
      <AudioExample pattern="{[0.1, 0.6, 1.1]}" {cachedAudio} />
      <p>If you cannot hear anything, you cannot participate in this study.</p>
      <a href="https://app.prolific.com/submissions/complete?cc=CH9I2X6E">
        <button>
          I cannot hear the audio and will not participate in this study
        </button>
      </a>
    </div>
  {/if}

  {#if studyStep === 'start2'}
    <div>
      <p>
        Please click + or - until this rectangle has the size of a credit card.
      </p>
      <p>
        <button on:click="{() => (visWidth *= 1.05)}">+</button>
        <button on:click="{() => (visWidth *= 0.95)}">-</button>
      </p>
      <svg width="{visWidth * 0.52}px" height="{visHeight * 2}px">
        <rect
          width="{visWidth * 0.52}"
          height="{visHeight * 2}"
          fill="#ccc"
          rx="8"
        ></rect>
      </svg>
      <p>
        Please also set your screen brightness to comfortable levels and avoid
        sunlight or artificial light reflecting from your screen.
      </p>
    </div>
  {/if}

  <!-- Demographics form -->
  {#if studyStep === 'demo'}
    <div class="demo-form">
      <!-- <label>
        <span>Your age in years:</span>
        <select bind:value="{partAge}">
          <option value="15-20">15-20</option>
          <option value="20-24">20-24</option>
          <option value="25-29">25-29</option>
          <option value="30-34">30-34</option>
          <option value="35-39">35-39</option>
          <option value="40-44">40-44</option>
          <option value="45-49">45-49</option>
          <option value="50-54">50-54</option>
          <option value="55-59">55-59</option>
          <option value="60-64">60-64</option>
          <option value="65-70">65-70</option>
          <option value="70-74">70-74</option>
          <option value="75-80">75-80</option>
        </select>
      </label>
      <label>
        <span>Gender:</span>
        <input
          type="text"
          bind:value="{partGender}"
          placeholder="m, f, d, or self-describe"
        />
      </label> -->
      <label>
        <span>Highest finished education (select the best fitting one):</span>
        <select bind:value="{partEduation}">
          <option value="none">none</option>
          <option value="highs">high school</option>
          <option value="bachelor">bachelor</option>
          <option value="master">master</option>
          <option value="phd">phd</option>
        </select>
      </label>
      <label>
        <span>
          Which music instruments do you play? Please separate by comma, if you
          do not play any, write 'none'.
        </span>
        <input
          type="text"
          bind:value="{partMusicInstr}"
          placeholder="free text"
        />
      </label>
      <label>
        <span>For how many years do you roughly play it/them?</span>
        <input
          type="number"
          bind:value="{partMusicInstrYears}"
          min="0"
          step="1"
        />
      </label>
      <label>
        <span>
          How many years of experience do you have with information
          visualization?
        </span>
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
      You will be presented with a sequence of six drum notes which should have
      equal distances in time. The <b>fourth note</b> is
      <b>too early or too late</b>, also affecting the ones after. This
      deviation will get smaller and more difficult for you. You always have to
      answer "early" or "late".
    </p>

    {#if testActive}
      <p>
        Test number {currentTestNumber + 1} / {tests.length}, trial number {currentTrialNumber +
          1}
      </p>
      {#if currentEncoding === 'audio'}
        <div>
          Listen to the audio, the forth note comes either too soon or too late.
          Press <i>p</i> or click <i>play</i> to replay the audio, you can do this
          is often as you like.
        </div>
        <div class="vis-example">
          <AudioExample pattern="{examplePatternEarly}" {cachedAudio} />
          <AudioExample pattern="{examplePatternLate}" {cachedAudio} />
          <div>Example for early</div>
          <div>Example for late</div>
        </div>
        <Audio
          pattern="{[
            ...pattern.slice(0, pattern.length - 1),
            pattern.at(-1) + Math.random() * 0.0001,
          ]}"
          {cachedAudio}
          {currentTrialNumber}
        />
      {:else if whiteScreenShowing === false}
        <!-- white screen helps avoid seeing the change between consecutive stimuli -->
        {#if currentEncoding === 'waveform'}
          <div>
            This is a waveform of the audio, showing loudness over time. Look at
            the gaps between peaks.
          </div>
          <div class="vis-example">
            <PlotWaveform
              pattern="{examplePatternEarly}"
              {audioFile}
              {cachedAudio}
              width="{visWidth / 2}"
              height="{visHeight / 2}"
            />
            <PlotWaveform
              pattern="{examplePatternLate}"
              {audioFile}
              {cachedAudio}
              width="{visWidth / 2}"
              height="{visHeight / 2}"
            />
            <div>Example for early</div>
            <div>Example for late</div>
          </div>
          <PlotWaveform
            {pattern}
            {audioFile}
            {cachedAudio}
            width="{visWidth}"
            height="{visHeight}"
          />
          <!-- {:else if currentEncoding === 'tick'}
          <div>
            Look at the peaks, the gap between the third and forth tick is
            either smaller (early) or larger (late) than the other gaps.
          </div>
          <div class="vis-example">
            <PlotTick
              pattern="{examplePatternEarly}"
              width="{visWidth / 2}"
              height="{visHeight / 2}"
            />
            <PlotTick
              pattern="{examplePatternLate}"
              width="{visWidth / 2}"
              height="{visHeight / 2}"
            />
            <div>Example for early</div>
            <div>Example for late</div>
          </div>
          <PlotTick {pattern} width="{visWidth}" height="{visHeight}" />
        {:else if currentEncoding === 'bar'}
          <div>
            The bar chart shows the size of the gaps between notes in the bars'
            height (example: the bar at 2 shows the gap between the first and
            second note). Look at the third bar, it is either lower (early) or
            higher (late) than the others.
          </div>
          <div class="vis-example">
            <PlotBar
              pattern="{examplePatternEarly}"
              width="{visWidth / 2}"
              height="{visHeight / 2}"
            />
            <PlotBar
              pattern="{examplePatternLate}"
              width="{visWidth / 2}"
              height="{visHeight / 2}"
            />
            <div>Example for early</div>
            <div>Example for late</div>
          </div>
          <PlotBar {pattern} width="{visWidth}" height="{visHeight}" /> -->
        {:else if currentEncoding === 'color'}
          <div>
            The color chart shows the size of the gaps between notes in the
            rectangles darkness (example: color at 2 shows the gap between the
            first and second note). Look at the third bar, it is either brigher
            (early) or darker (late) than the others.
          </div>
          <div class="vis-example">
            <PlotColor
              pattern="{examplePatternEarly}"
              width="{visWidth / 2}"
              height="{visHeight / 2}"
            />
            <PlotColor
              pattern="{examplePatternLate}"
              width="{visWidth / 2}"
              height="{visHeight / 2}"
            />
            <div>Example for early</div>
            <div>Example for late</div>
          </div>
          <PlotColor {pattern} width="{visWidth}" height="{visHeight}" />
        {/if}
      {/if}
      <p>
        Use the arrow keys on your keyboard: <b>left for early</b>,
        <b>right for late</b>.
      </p>
    {/if}
    <!-- TODO: for debug -->
    <!-- <PlotLine
      data="{trials}"
      final="{0}"
      x="{(d, i) => i}"
      y="{(d) => Math.abs(d.deviation)}"
    /> -->
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
