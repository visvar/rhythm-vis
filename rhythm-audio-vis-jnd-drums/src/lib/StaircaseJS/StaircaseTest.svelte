<script>
  import { onMount } from 'svelte';
  import { Staircase } from './StaircaseModule';
  import PlotLine from './PlotLine.svelte';

  /*
   * StaircaseJS example
   * Matt Jaquiery - 2017
   */

  // Runtime variables
  var currentTrialNumber;
  var validTrials;
  var currentTrial;
  var trials = [];
  var score;
  var stair;
  var trialActive = false;
  var maxDots = 200;

  let playerChoice = 1;

  let data = [];
  let final = 0;
  let feedback = '';

  onMount(setupInstructions);

  function setupInstructions() {
    document.querySelector('html').addEventListener('keyup', function (evt) {
      keyPress(evt.keyCode);
    });
    stair = new Staircase({
      ratio: {
        firstVal: Math.round(maxDots * 0.8),
        down: 2, // down is the number of correct answers required before we increase the difficulty
        up: 1, // up is the number of incorrect answers before we decrease the difficulty
        stepSizeDown: 3, // how much we in/decrease by
        stepSizeUp: 3 * 0.5488, // Converge to 80.35% correct ('downUpRatio' and 'down' affect this)
        limits: [maxDots / 2 + 1, maxDots], // don't allow equal ratio
        direction: -1, // -1 indicates that easier = greater values; 1 would indicate easier = lower values
        reversalLimit: 5, // How many reversals to do before stopping
        verbosity: 1, // Enable logging for debugging
      },
    });
    stair.init(); // Activate the staircase
    startTest();
  }

  function startTest() {
    currentTrialNumber = 0;
    validTrials = 0;
    score = 0;
    startTrial();
  }

  /*
    Each trial consists of painting stimuli and obtaining a response from the participant
    */
  function startTrial() {
    console.log('Starting trial ' + currentTrialNumber);
    currentTrial = {};
    playerChoice = -1;
    drawStimuli();
  }

  function drawStimuli() {
    // Trial info
    var d = getDensity();
    currentTrial.targetDensity0 = d[0];
    currentTrial.targetDensity1 = d[1];
    // Prepare canvas
    for (var i = 0; i < 2; i++) {
      const ctx = document
        .querySelectorAll(`#Canvas${i}`)[0]
        // @ts-ignore
        .getContext('2d');
      ctx.clearRect(0, 0, ctx.canvas.clientWidth, ctx.canvas.clientHeight);
      ctx.beginPath();
      var radius = (ctx.canvas.clientWidth - 10) / 2;
      ctx.arc(
        ctx.canvas.clientWidth / 2,
        ctx.canvas.clientHeight / 2,
        radius,
        0,
        2 * Math.PI
      );
      ctx.lineWidth = 3;
      ctx.stroke();
      // Draw stimuli
      if (i == 0) currentTrial.density0 = drawStimulus('#Canvas' + i, d[i]);
      else currentTrial.density1 = drawStimulus('#Canvas' + i, d[i]);
    }
    decisionPhase();
  }

  function getDensity() {
    var p; // ratio of circles to one another
    var d; // densities
    p = Math.round(stair.getLast('ratio'));
    d = [p, maxDots - p];
    // try again if we're exactly equal
    if (d[0] == d[1]) d = getDensity();
    // return randomised order
    return Math.random() < 0.5 ? d : [d[1], d[0]];
  }

  function drawStimulus(canvasID, density) {
    console.log(canvasID);
    const ctx = document.querySelectorAll(canvasID)[0].getContext('2d');
    var centre = {
      x: ctx.canvas.clientWidth / 2,
      y: ctx.canvas.clientHeight / 2,
    };
    var circles = [];
    var radius = 4;
    var stimDrawTime = Date.now();
    for (var i = 0; i < density; i++) {
      // Find somewhere to put the next circle
      var position = false;
      var loop = 0;
      while (position === false && loop < 100) {
        position = {
          x:
            radius +
            Math.round(Math.random() * (ctx.canvas.clientWidth - 2 * radius)),
          y:
            radius +
            Math.round(Math.random() * (ctx.canvas.clientWidth - 2 * radius)),
        };
        // Check we're within the major circle
        if (
          Math.sqrt(
            Math.pow(position.x - centre.x, 2) +
              Math.pow(position.y - centre.y, 2)
          ) >
          (ctx.canvas.clientWidth - 10) / 2 - radius * 2
        ) {
          position = false;
        } else {
          // Check we don't clash with preexisting circles
          for (var n = 0; n < circles.length; n++) {
            if (
              Math.abs(position.x - circles[n].x) <= (radius + 1) * 2 &&
              Math.abs(position.y - circles[n].y) <= (radius + 1) * 2
            ) {
              position = false;
              break;
            }
          }
        }
        loop++;
      }
      if (position !== false) {
        // Place the circle
        circles[circles.length] = position;
        ctx.beginPath();
        ctx.arc(position.x, position.y, radius, 0, 2 * Math.PI);
        ctx.fillStyle = 'black';
        ctx.fill();
        ctx.stroke();
      }
    }
    console.log(
      canvasID +
        '> Drew ' +
        circles.length +
        ' circles in ' +
        (Date.now() - stimDrawTime) +
        'ms'
    );
    return circles.length;
  }

  function decisionPhase() {
    trialActive = true;
  }

  function decisionClick(id) {
    if (!trialActive) return;
    trialActive = false;
    currentTrial.decisionChoice = id;
    currentTrial.errorCode = 0;
    nextTrial();
  }

  function nextTrial() {
    processTrialResult();
    if (currentTrial.errorCode == 0) validTrials++;
    currentTrialNumber++;

    if (!stair.reversalLimitReached('ratio')) startTrial();
    else showBlockFeedback();
  }

  function processTrialResult() {
    var oldScore = score;
    if (
      ((currentTrial.decisionChoice == 0 &&
        currentTrial.density0 > currentTrial.density1) ||
        (currentTrial.decisionChoice == 1 &&
          currentTrial.density0 < currentTrial.density1)) &&
      currentTrial.errorCode == 0
    ) {
      score++;
    }
    if (currentTrial.errorCode == 0) {
      stair.next(oldScore != score);
      trials[trials.length] = currentTrial;
    }
  }

  function showBlockFeedback() {
    getFeedbackText();
    makeGraph();
  }

  function keyPress(k) {
    switch (k) {
      case 37: // Leftarrow
        decisionClick(0);
        break;
      case 39: // Rightarrow
        decisionClick(1);
        break;
    }
    return;
  }

  function getFeedbackText() {
    feedback =
      'You scored ' +
      score +
      '/' +
      (currentTrialNumber + 1) +
      ' (' +
      Math.round((score / (currentTrialNumber + 1)) * 1000) / 10 +
      '%)<br>Your end difficulty was ' +
      stair.getFinalVal('ratio');
  }

  function makeGraph() {
    data = [];
    var cols = ['Trial Number', 'Difficulty', 'Calibrated Difficulty'];
    var finalDiff = stair.getFinalVal('ratio');
    for (var i = 0; i < trials.length; i++) {
      data[i] =
        trials[i].density0 < trials[i].density1
          ? trials[i].density1
          : trials[i].density0;
    }
    final = finalDiff;
    data.unshift(cols);
    console.log(data);
  }
</script>

<div id="wrapper">
  <div id="test-body">
    <section id="StimulusArea">
      <div id="Canvases" style="width: 750px; margin:auto;">
        <p class="tutorial-help" style="text-align: center; font-size: 1.3em;">
          Use the arrow keys to indicate which circle has more dots inside
        </p>
        <canvas id="Canvas0" class="left" width="310" height="310"></canvas>
        <canvas id="Canvas1" class="right" width="310" height="310"></canvas>
      </div>
    </section>

    <section id="BlockFeedback">
      <div id="Feedback" style="text-align: center;">
        <p id="FeedbackScore">{feedback}</p>
      </div>
      <div id="Graph" style="width: 80%; display: block; margin: auto">
        <PlotLine data="{data}" final="{final}" />
      </div>
      <br />
      <div id="FeedbackButton" class="button">Start Again</div>
    </section>
  </div>
</div>

<style>
  .left {
    margin-left: 18px;
  }

  .right {
    float: right;
    margin-right: 18px;
  }

  .button {
    font-size: 1.5em;
    font-weight: bold;
    width: 10em;
    height: 1.5em;
    margin: auto;
    margin-bottom: 0.2em;
    text-align: center;
    padding-top: 0.2em;
    border: 0px solid black;
    border-radius: 0.4em;
    box-shadow: 0px 0px 5px 1px black;
    background-color: #f0f0f0;
    cursor: pointer;
  }

  .button:hover {
    box-shadow: 0px 0px 15px 1px black;
    background-color: #e0e0e0;
  }
</style>
