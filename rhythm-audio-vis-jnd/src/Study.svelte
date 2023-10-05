<script>
    import {
        audioDataToAudioEl,
        fetchAudio,
        generatePatternSimple,
        simulate,
    } from './lib/lib.js';
    import AudioDecode from 'audio-decode';
    import PlotTick from './plots/PlotTick.svelte';
    import PlotBar from './plots/PlotBar.svelte';
    import PlotColor from './plots/PlotColor.svelte';
    import PlotWaveform from './plots/PlotWaveform.svelte';
    import Audio from './Audio.svelte';
    import { onMount } from 'svelte';
    import { Staircase } from './lib/StaircaseJS/StaircaseModule';
    import PlotLine from './lib/StaircaseJS/PlotLine.svelte';

    const audioFile = './FluidR3_GM_acoustic_grand_piano-mp3_A4.mp3';

    /*
     * StaircaseJS example
     * Matt Jaquiery - 2017
     */

    // Runtime variables
    let currentTrialNumber;
    let validTrials;
    let currentTrial;
    let trials = [];
    let score;
    let stair;
    let trialActive = false;
    let playerChoice;

    // stimulus variables
    let maxDots = 200;

    // inter-onset interval in seconds
    let ioi = 0.5;
    // deviation in percent of the ioi
    let percentDeviation = 15;
    // deviation in seconds
    $: deviationSeconds = (percentDeviation / 100) * ioi;
    let noteCount = 6;
    let wrongNoteIndex = 3;
    let paddingStart = 0;

    let pattern = [];
    $: {
        pattern = generatePatternSimple(
            noteCount,
            ioi,
            wrongNoteIndex,
            deviationSeconds,
            paddingStart
        );
        console.log('generated pattern', pattern);
    }

    // results
    let data = [];
    let final = 0;
    let feedback = '';

    onMount(setupInstructions);

    async function setupInstructions() {
        document
            .querySelector('html')
            .addEventListener('keyup', (evt) => keyPress(evt.keyCode));
        stair = new Staircase({
            ratio: {
                firstVal: Math.round(maxDots * 0.8),
                down: 2, // down is the number of correct answers required before we increase the difficulty
                up: 1, // up is the number of incorrect answers before we decrease the difficulty
                stepSizeDown: 1, // how much we in/decrease by
                stepSizeUp: 1 * 0.5488, // Converge to 80.35% correct ('downUpRatio' and 'down' affect this)
                limits: [-15, 15], // don't allow equal ratio
                direction: -1, // -1 indicates that easier = greater values; 1 would indicate easier = lower values
                reversalLimit: 5, // How many reversals to do before stopping
                verbosity: 1, // Enable logging for debugging
            },
        });
        stair.init();
        startTest();
    }

    function startTest() {
        currentTrialNumber = 0;
        validTrials = 0;
        score = 0;
        startTrial();
    }

    /*
     * Each trial consists of painting stimuli and obtaining a response from the participant
     */
    function startTrial() {
        console.log('Starting trial ' + currentTrialNumber);
        currentTrial = {};
        playerChoice = -1;
        drawStimuli();
    }

    function drawStimuli() {
        trialActive = true;
        // Trial info
        const p = Math.round(stair.getLast('ratio'));
        let deviation = p;
        deviation = Math.random() < 0.5 ? deviation : -deviation;
        currentTrial.deviation = deviation;
        percentDeviation = deviation;

        console.log('generated pattern', pattern);
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
                (currentTrial.decisionChoice == 1 &&
                    currentTrial.deviation > 0)) &&
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
            // show block feedback
            getFeedbackText();
            makeGraph();
        }
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
            ((score / (currentTrialNumber + 1)) * 100).toFixed(1) +
            '%)<br>Your end difficulty was ' +
            stair.getFinalVal('ratio');
    }

    function makeGraph() {
        data = [];
        var finalDiff = stair.getFinalVal('ratio');
        for (var i = 0; i < trials.length; i++) {
            // TODO:
            data[i] = trials[i].deviation;
        }
        final = finalDiff;
        console.log(data);
    }
</script>

<main>
    <h2>Study</h2>
    <section id="StimulusArea">
        <div id="Canvases" style="width: 750px; margin:auto;">
            <p>Use the arrow keys, left for too early, right for too late.</p>
            <PlotTick pattern="{pattern}" />
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
</main>

<style>
</style>
