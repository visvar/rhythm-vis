<script>
  import { fetchAudio, shuffleArray, simulateDrum } from './lib/lib.js';
  import PlotWaveform from './plots/PlotWaveform.svelte';
  // import PlotTick from './plots/PlotTick.svelte';
  // import PlotBar from './plots/PlotBar.svelte';
  import PlotColorBeats from './plots/PlotColorBeats.svelte';
  import { onMount } from 'svelte';
  import { Staircase } from './lib/StaircaseJS/StaircaseModule.js';
  import { getUrlParam } from './lib/url.js';
  import { Utils } from 'musicvis-lib';
  import Audio from './audioPlayback/Audio.svelte';
  import AudioExample from './audioPlayback/AudioExample.svelte';
  import AudioExampleInTrials from './audioPlayback/AudioExampleInTrials.svelte';
  import PlotLine from './plotsAnalysis/PlotLine.svelte';

  const STUDY_NAME = '8beat_hihat_8ths_120bpm';
  const DEBUG = false;
  const SERVER_URL = '/store';
  const BPM = 120;
  // deviation in seconds, start with less than 0.25 because 0.25 is an eighth note
  const INITIAL_SEVERITY = 0.1;

  console.log(STUDY_NAME, BPM, INITIAL_SEVERITY);

  // prolific params
  let partID = getUrlParam(window, 'PROLIFIC_PID');
  let studyID = getUrlParam(window, 'STUDY_ID');
  let sessionID = getUrlParam(window, 'SESSION_ID');
  // console.log({ partID, studyID, sessionID });

  // completion codes
  const PROLIFIC_DEFAULT = 'C11VVLWN';
  const PROLIFIC_NO_CONSENT = 'COYRYK1U';
  const PROLIFIC_INCOMPATIBLE_DEVICE = 'CILRS92A';

  let correctPattern = [
    {
      instrument: 'hihat',
      sample: './hihat.mp3',
      beats: [1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5],
    },
  ];
  const beats = 4;

  /**
   * Adds errors based on mode and severity
   * @param {number} errorSeverity
   */
  const addErrors = (errorSeverity = 0) => {
    if (errorSeverity === 0) {
      return correctPattern;
    }
    const copy = concat([correctPattern]);
    const hihat = copy.filter((d) => d.instrument === 'hihat')[0];

    // shift beat 5, also shift all that come later
    for (const h of [5, 6, 7, 8]) {
      hihat.times[h - 1] = hihat.timesOriginal[h - 1] + errorSeverity;
    }
    // console.log(drumPattern);
    return copy;
  };

  let tests = ['audio', 'waveform', 'color'].map((d) => {
    return { encoding: d };
  });

  // const examplePatternEarly;
  // const examplePatternLate;

  // study progress
  // consent, start1, start2, demo, tests, feedback, done
  let studyStep = 'consent'; // TODO: change to tests for testing
  let currentTestNumber = 0;
  let testStartTime;

  // training before each trial
  let isTraining = false;
  let trainingCorrectStreak = 0;
  let trainingLimit = 8;
  let traingCurrentSeverity = 0;
  let trainingFeedback = '';

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
  let currentEncoding = '';

  // vis sizes
  let visWidth = 600;
  $: visHeight = visWidth / 6;

  // results
  let data = [];
  let final = 0;
  const completeResults = [];

  onMount(() => {
    document.querySelector('html').addEventListener('keyup', keyPress);
  });

  const setupInstructions = () => {
    stair = new Staircase({
      // OLD
      // ratio: {
      //   firstVal: initialErrorSeverity,
      //   down: 2, // down is the number of correct answers required before we increase the difficulty
      //   up: 1, // up is the number of incorrect answers before we decrease the difficulty
      //   stepSizeDown: stairStep, // how much we in/decrease by
      //   stepSizeUp: stairStep * 0.5488, // Converge to 80.35% correct ('downUpRatio' and 'down' affect this)
      //   limits: [0, initialErrorSeverity], // don't allow equal ratio
      //   direction: -1, // -1 indicates that easier = greater values; 1 would indicate easier = lower values
      //   reversalLimit: 5, // How many reversals to do before stopping
      //   // verbosity: 1, // Enable logging for debugging
      //   verbosity: 0, // Enable logging for debugging
      //   // sameStairMax: , // Maximum number of trials
      // },
      // MULTIPLICATIVE
      ratio: {
        firstVal: INITIAL_SEVERITY,
        operation: 'multiply',
        down: 1, // down is the number of correct answers required before we increase the difficulty
        up: 1, // up is the number of incorrect answers before we decrease the difficulty
        stepSizeDown: 1.25, // how much we in/decrease by
        stepSizeUp: 1.25 * 1.25 * 1.25,
        limits: [0, INITIAL_SEVERITY], // don't allow equal ratio
        direction: -1, // -1 indicates that easier = greater values; 1 would indicate easier = lower values
        reversalLimit: 12, // How many reversals to do before stopping
        verbosity: 0, // Enable logging for debugging
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
      studyStep = 'start3';
    } else if (studyStep === 'start3') {
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
      if (currentTestNumber >= tests.length) {
        // all tests done
        studyStep = 'feedback';
      } else {
        // set variables
        currentEncoding = tests[currentTestNumber].encoding;
        // start training
        if (trainingCorrectStreak === 0) {
          isTraining = true;
          showTraining();
        } else {
          startTest();
          trainingCorrectStreak = 0;
        }
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
    // keep track of trials
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
    let severity = p;
    severity = Math.random() < 0.5 ? severity : -severity;
    currentTrial.deviation = severity;
    // get pattern
    const result = createDrumPattern(severity);
    noteTimes = result.noteTimes;
    noteTimesSeparate = result.noteTimesSeparate;
    sampleRate = result.sampleRate;
    renderedAudio = result.renderedAudio;
    console.log('generated pattern');
    // avoid showing a visualization directly after the previous to prevent participants from seeing the change
    whiteScreenShowing = true;
    window.setTimeout(() => {
      whiteScreenShowing = false;
      currentTrial.startTime = new Date();
    }, 1000);
  }

  /**
   * Show training stimulus
   */
  function showTraining() {
    console.log('show training');
    // between half and full initial value
    let severity = (Math.random() * 0.5 + 0.5) * INITIAL_SEVERITY;
    severity = Math.random() < 0.5 ? severity : -severity;
    traingCurrentSeverity = severity;
    console.log('training severity', severity);
    // get pattern
    const result = createDrumPattern(severity);
    noteTimes = result.noteTimes;
    noteTimesSeparate = result.noteTimesSeparate;
    sampleRate = result.sampleRate;
    renderedAudio = result.renderedAudio;
    console.log('generated training', result);
    currentTrialNumber++;
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

  /**
   *
   * @param {'early'|'late'} id
   */
  function trainingClick(id) {
    const trainMessage = document.querySelectorAll('#trainingFeedback')[0];
    if (
      (id === 'early' && traingCurrentSeverity < 0) ||
      (id === 'late' && traingCurrentSeverity > 0)
    ) {
      // correct
      trainingCorrectStreak++;
      if (trainingCorrectStreak >= trainingLimit) {
        isTraining = false;
      } else {
        trainMessage.innerHTML = '<span class="correct">correct!</span>';
      }
    } else {
      // incorrect
      trainingCorrectStreak = 0;
      trainMessage.innerHTML = '<span class="wrong">wrong!</span>';
    }
    console.log(trainMessage);
    showTraining();
  }

  function endTest() {
    testActive = false;
    trialActive = false;
    // getFeedbackText();
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
        if (isTraining) {
          trainingClick('early');
        }
        break;
      case 'ArrowRight':
        if (trialActive) {
          decisionClick(1);
        }
        if (isTraining) {
          trainingClick('late');
        }
        break;
      case 'PageDown':
        if (!trialActive && !(studyStep === 'done')) {
          nextStudyStep();
        }
    }
  }

  // function getFeedbackText() {
  //   feedback = `You scored ${score} / ${currentTrialNumber + 1} (${(
  //     (score / (currentTrialNumber + 1)) *
  //     100
  //   ).toFixed(1)}%) Your end difficulty was ${stair.getFinalVal('ratio')}`;
  // }

  function saveData() {
    const data = {
      studyName: STUDY_NAME,
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
    fetch(SERVER_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: json,
    }).then((res) => {
      console.log('Data saved:', res);
    });
  }

  /**
   *
   *
   *
   *
   *
   *
   * DRUM STUFF BELOW
   *
   *
   *
   *
   *
   *
   */

  let spb = Utils.bpmToSecondsPerBeat(BPM);
  const duration = beats * spb;

  let sampleRate;
  let renderedAudio = null;
  let renderedAudioExampleCorrect = null;
  let renderedAudioExampleEarly = null;
  let renderedAudioExampleLate = null;
  let noteTimes = [];
  let noteTimesExampleCorrect = [];
  let noteTimesExampleEarly = [];
  let noteTimesExampleLate = [];
  let noteTimesSeparate = [];

  const fetchDrumAudios = async () => {
    correctPattern = await Promise.all(
      correctPattern.map(async (d) => {
        return {
          ...d,
          times: d.beats.map((b) => spb * (b - 1)),
          timesOriginal: d.beats.map((b) => spb * (b - 1)),
          audioBuffer: await fetchAudio(d.sample),
        };
      }),
    );
    // generate examples
    const correct = createDrumPattern(0);
    const early = createDrumPattern(-INITIAL_SEVERITY);
    const late = createDrumPattern(INITIAL_SEVERITY);
    noteTimesExampleCorrect = correct.noteTimes;
    noteTimesExampleEarly = early.noteTimes;
    noteTimesExampleLate = late.noteTimes;
    renderedAudioExampleCorrect = correct.renderedAudio;
    renderedAudioExampleEarly = early.renderedAudio;
    renderedAudioExampleLate = late.renderedAudio;
    sampleRate = correctPattern[0].audioBuffer.sampleRate;
  };
  fetchDrumAudios();

  /**
   * Concats multiple drum patterns
   * @param object[] patterns
   */
  const concat = (patterns) => {
    // console.log(`concat ${patterns.length} patterns`);
    const result = patterns[0].map((d) => {
      return {
        ...d,
        beats: [...d.beats],
        times: [...d.times],
        timesOriginal: [...d.timesOriginal],
      };
    });
    for (let i = 1; i < patterns.length; i++) {
      const pattern = patterns[i];
      for (const inst of pattern) {
        const instr = result.filter((d) => d.instrument === inst.instrument)[0];
        instr.beats = [...instr.beats, ...inst.beats.map((b) => b + i * beats)];
        instr.times = [
          ...instr.times,
          ...inst.times.map((b) => b + i * duration),
        ];
        instr.timesOriginal = [
          ...instr.timesOriginal,
          ...inst.timesOriginal.map((b) => b + i * duration),
        ];
      }
    }
    return result;
  };

  /**
   * Creates the pattern with errors and repetitions
   * @param errorSeverity
   */
  const createDrumPattern = (errorSeverity) => {
    if (!correctPattern[0].audioBuffer) {
      return;
    }
    // add errors
    const wrongPattern = addErrors(errorSeverity);
    // concat correct and the one with errors
    // const patterns = [correctPattern, wrongPattern];
    // const patterns = [correctPattern, wrongPattern, correctPattern];
    // const patterns = [correctPattern, wrongPattern];
    const patterns = [wrongPattern];
    const combinedPattern = concat(patterns);
    // get times for visualizations
    const noteTimes = combinedPattern
      .map((d) => d.times)
      .flat()
      .sort();
    const noteTimesSeparate = combinedPattern
      .map((d) =>
        d.times.map((t) => {
          return { time: t, instr: d.instrument };
        }),
      )
      .flat(Infinity)
      .sort((a, b) => {
        a.time - b.time;
      });
    // set global sample rate
    const sampleRate = combinedPattern[0].audioBuffer.sampleRate;
    // render audio
    const renderedAudio = simulateDrum(
      combinedPattern,
      duration * patterns.length + 0.1,
      sampleRate,
    );
    return { noteTimes, noteTimesSeparate, sampleRate, renderedAudio };
  };
</script>

<main>
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
      <a
        href="https://app.prolific.com/submissions/complete?cc={PROLIFIC_NO_CONSENT}"
      >
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
      <AudioExampleInTrials
        audioData="{renderedAudioExampleCorrect}"
        {sampleRate}
      />
      <p>If you cannot hear anything, you cannot participate in this study.</p>
      <a
        href="https://app.prolific.com/submissions/complete?cc={PROLIFIC_INCOMPATIBLE_DEVICE}"
      >
        <button>
          I can NOT hear the audio and will NOT participate in this study
        </button>
      </a>
    </div>
  {/if}

  {#if studyStep === 'start2'}
    <div>
      <p>
        Please click + or - until this rectangle has the size of a credit card.
      </p>
      <div>
        <button on:click="{() => (visWidth *= 1.05)}">+</button>
        <button on:click="{() => (visWidth *= 0.95)}">-</button>
      </div>
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
  {#if studyStep === 'start3'}
    <div>
      <div>
        <p>
          Imagine you are a music teacher and want to give feedback to your
          students. As listening to all they play takes too much time, you try
          different visualizations that show you their note timing.
        </p>
        <p>
          In this study, the goal is to learn how these visualizations compare
          to each other and to listening. We want to know, how small of a timing
          error is still clear to see/hear as either <i>too early</i> or
          <i>too late</i>.
        </p>
        <p>
          This study uses a simple drum pattern that you can see and listen to
          below. Notes after the mistake will also be affected and be
          early/late, such that only one time interval is shorter/longer than
          supposed.
        </p>
      </div>
      This is what the pattern looks like in sheet music:
      <div>
        <img
          width="{visWidth}px"
          src="8note-pattern-hihat.png"
          alt="drum pattern as sheet music"
        />
      </div>
      This is what the full, correctly played pattern sounds like:
      <div>
        <AudioExampleInTrials
          audioData="{renderedAudioExampleCorrect}"
          {sampleRate}
        />
      </div>
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
      <p>Please answer the following questions about yourself:</p>
      <label>
        <span>
          What is your highest finished degree of education? (select the best
          fitting one)
        </span>
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
    {#if testActive || isTraining}
      <p>
        Test number {currentTestNumber + 1} of {tests.length}
      </p>

      {#if isTraining}
        <p class="training">
          <b>Training:</b> the training will end when you got {trainingLimit} correct
          in a streak.<br />
          Current streak: {trainingCorrectStreak}.<br />
          <b><span id="trainingFeedback"></span></b>
        </p>
      {:else}
        <p>
          Trial number {currentTrialNumber + 1}
        </p>
      {/if}

      <p>
        Use the arrow keys on your keyboard: <b>left for early</b>,
        <b>right for late</b>.
      </p>

      {#if currentEncoding === 'audio'}
        <p>
          Press <i>p</i> or click <i>play</i> to replay the audio, you can do this
          is often as you like.
        </p>
        <div class="vis-example">
          <AudioExampleInTrials
            audioData="{renderedAudioExampleEarly}"
            {sampleRate}
          />
          <AudioExampleInTrials
            audioData="{renderedAudioExampleLate}"
            {sampleRate}
          />
          <div>Example for early</div>
          <div>Example for late</div>
        </div>
        <Audio audioData="{renderedAudio}" {sampleRate} {currentTrialNumber} />
      {:else if whiteScreenShowing === false}
        <!-- white screen helps avoid seeing the change between consecutive stimuli -->
        {#if currentEncoding === 'waveform' || DEBUG}
          <p>
            This is a waveform of the audio, showing loudness over time. Look at
            the gaps between peaks.
          </p>
          <div class="vis-example">
            <PlotWaveform
              audioData="{renderedAudioExampleEarly}"
              width="{visWidth / 2}"
              height="{visHeight / 2}"
            />
            <PlotWaveform
              audioData="{renderedAudioExampleLate}"
              width="{visWidth / 2}"
              height="{visHeight / 2}"
            />
            <div>Example for early</div>
            <div>Example for late</div>
          </div>
          <PlotWaveform
            audioData="{renderedAudio}"
            width="{visWidth}"
            height="{visHeight}"
          />
        {/if}
        <!-- {#if currentEncoding === 'tick' || DEBUG}
              <p>
                Look at the peaks, the gap between the third and forth tick is
                either smaller (early) or larger (late) than the other gaps.
              </p>
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
          <PlotTick
            pattern="{noteTimes}"
            width="{visWidth}"
            height="{visHeight}"
            />
            {/if}
          -->
        <!-- {#if currentEncoding === 'bar' || DEBUG}
          <p>
            The bar chart shows the size of the gaps between notes in the bars'
            height (example: the bar at 2 shows the gap between the first and
            second note). Look at the third bar, it is either lower (early) or
            higher (late) than the others.
          </p>
          <div class="vis-example">
            <PlotBar
            pattern="{noteTimesExampleEarly}"
            width="{visWidth / 2}"
            height="{visHeight / 2}"
            />
            <PlotBar
            pattern="{noteTimesExampleLate}"
            width="{visWidth / 2}"
            height="{visHeight / 2}"
            />
            <div>Example for early</div>
            <div>Example for late</div>
          </div>
          <PlotBar
            pattern="{noteTimes}"
            width="{visWidth}"
            height="{visHeight}"
            />
            {/if}
          -->
        {#if currentEncoding === 'color' || DEBUG}
          <p>
            The color chart shows the size of the time gaps between <b>beats</b>
            in the rectangles' darkness (example: color at 2 shows the gap between
            the first and second beat). Look at the rectangle at 5, it is either
            brigher (early) or darker (late) than the others.
          </p>
          <div class="vis-example">
            <PlotColorBeats
              pattern="{noteTimesExampleEarly}"
              width="{visWidth / 2}"
              height="{visHeight * 0.7}"
            />
            <PlotColorBeats
              pattern="{noteTimesExampleLate}"
              width="{visWidth / 2}"
              height="{visHeight * 0.7}"
            />
            <div>Example for early</div>
            <div>Example for late</div>
          </div>
          <PlotColorBeats
            pattern="{noteTimes}"
            width="{visWidth}"
            height="{visHeight}"
          />
        {/if}
        <!-- TODO: for debug -->
        <!-- <PlotTickSep
          pattern="{noteTimesSeparate}"
          width="{visWidth}"
          height="{visHeight}"
        /> -->
      {/if}
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
      Almost done!
      <p>Do you have any final feedback/comments?</p>
      <textarea bind:value="{partFeedback}"></textarea>
    </div>
  {/if}

  <!-- Study done -->
  {#if studyStep === 'done'}
    <div>Thanks for participating!</div>
    <a
      href="https://app.prolific.com/submissions/complete?cc={PROLIFIC_DEFAULT}"
    >
      <b>Click here to get your compensation</b>
    </a>
  {/if}

  <!-- show next step button -->
  {#if !trialActive && !(studyStep === 'done') && !isTraining}
    <!-- <button on:click="{nextStudyStep}">next step (PageDown)</button> -->
    <button on:click="{nextStudyStep}" class="next-btn">next step</button>
  {/if}
</main>

<style>
  main {
    max-width: 1000px;
    text-align: center;
  }

  p {
    max-width: 600px;
    margin: 10px auto;
    text-align: justify;
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

  .training {
    background-color: rgba(166, 166, 166, 0.531);
    border-radius: 4px;
    padding: 5px;
  }

  .vis-example {
    margin: 20px;
    padding: 10px;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
    background: #eee;
    border-radius: 10px;
  }

  .vis-example div {
    column-span: all;
  }

  .next-btn {
    margin-top: 30px;
  }

  label {
    text-align: left;
  }
</style>
