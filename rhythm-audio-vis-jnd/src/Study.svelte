<script>
    import { generatePatternSimple } from './lib/lib.js';
    import saveAs from 'file-saver';
    import Audio from './Audio.svelte';
    import PlotWaveform from './plots/PlotWaveform.svelte';
    import PlotTick from './plots/PlotTick.svelte';
    import PlotBar from './plots/PlotBar.svelte';
    import PlotColor from './plots/PlotColor.svelte';
    import { onMount } from 'svelte';
    import { Staircase } from './lib/StaircaseJS/StaircaseModule';
    import PlotLine from './lib/StaircaseJS/PlotLine.svelte';

    const audioFiles = [
        './FluidR3_GM_acoustic_grand_piano-mp3_A4.mp3',
        './MailboxBadgerPublicDomainDrumSamples27LiveDrumsHiHat.mp3',
    ];
    let audioFile = audioFiles[0];

    // Runtime variables
    let currentTrialNumber;
    let validTrials;
    let currentTrial;
    let trials = [];
    let score;
    let stair;
    let testActive = false;
    let trialActive = false;
    let playerChoice;
    let whiteScreenShowing = false;

    // stimulus variables
    let encodings = ['audio', 'waveform', 'tick', 'bar', 'color'];
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
            paddingStart
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
     * The test consists of multiple trials
     */
    function startTest() {
        setupInstructions();
        currentTrialNumber = 0;
        validTrials = 0;
        score = 0;
        testActive = true;
        trials = [];
        startTrial();
    }

    /*
     * Each trial consists of painting stimuli and obtaining a response from the participant
     */
    function startTrial() {
        console.log('Starting trial ' + currentTrialNumber);
        currentTrial = {};
        playerChoice = -1;
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
        completeResults.push({
            encoding: currentEncoding,
            audioFile,
            final,
            data,
            score,
            trialCount: currentTrialNumber + 1,
            trials,
            validTrialCount: validTrials + 1,
        });
        console.log('results (all)', completeResults);
    }

    function keyPress(evt) {
        switch (evt.key) {
            case 'ArrowLeft':
                decisionClick(0);
                break;
            case 'ArrowRight':
                decisionClick(1);
                break;
        }
    }

    function getFeedbackText() {
        feedback = `You scored ${score} / ${currentTrialNumber + 1} (${(
            (score / (currentTrialNumber + 1)) *
            100
        ).toFixed(1)}%) Your end difficulty was ${stair.getFinalVal('ratio')}`;
    }

    function beforeUnload(event) {
        // Cancel the event as stated by the standard.
        event.preventDefault();
        // Chrome requires returnValue to be set.
        event.returnValue = '';
        // more compatibility
        return '...';
    }
</script>

<!-- <svelte:window on:beforeunload="{beforeUnload}" /> -->
<main>
    <h2>Study</h2>
    <p>
        You will be presented with a sequence of six notes which should have
        equal distances. The <b>fourth note</b> might be played too early or too
        late.
    </p>

    <div>
        <div>
            <label>
                encoding:
                <select bind:value="{currentEncoding}" disabled="{testActive}">
                    {#each encodings as enc}
                        <option value="{enc}">{enc}</option>
                    {/each}
                </select>
            </label>
        </div>
        <div>
            <label>
                instrument sample:
                <select
                    bind:value="{audioFile}"
                    disabled="{currentEncoding !== 'audio' &&
                        currentEncoding !== 'waveform'}"
                >
                    {#each audioFiles as af}
                        <option value="{af}">{af.substring(0, 30)}</option>
                    {/each}
                </select>
            </label>
        </div>
        <div>
            <button on:click="{startTest}" disabled="{testActive}">
                Start
            </button>
            <button
                on:click="{() => {
                    const json = JSON.stringify(completeResults);
                    const blob = new Blob([json], {
                        type: 'text/plain;charset=utf-8',
                    });
                    saveAs(blob, 'results.json');
                }}"
            >
                Download results
            </button>
        </div>
    </div>

    {#if testActive}
        <p>Use the arrow keys: left for too early, right for too late.</p>
        <p>Trial number {currentTrialNumber + 1}</p>
        {#if currentEncoding === 'audio'}
            <Audio
                pattern="{[
                    ...pattern.slice(0, pattern.length - 1),
                    pattern.at(-1) + Math.random() * 0.0001,
                ]}"
                audioFile="{audioFile}"
                currentTrialNumber="{currentTrialNumber}"
            />
            <p>You can play the audio as many times as you like.</p>
        {:else if whiteScreenShowing === false}
            <!-- white screen helps avoid seeing the change between consecutive stimuli -->
            {#if currentEncoding === 'waveform'}
                <PlotWaveform
                    pattern="{pattern}"
                    audioFile="{audioFile}"
                    width="{visWidth}"
                    height="{visHeight}"
                />
            {:else if currentEncoding === 'tick'}
                <PlotTick
                    pattern="{pattern}"
                    width="{visWidth}"
                    height="{visHeight}"
                />
            {:else if currentEncoding === 'bar'}
                <PlotBar
                    pattern="{pattern}"
                    width="{visWidth}"
                    height="{visHeight}"
                />
            {:else if currentEncoding === 'color'}
                <PlotColor
                    pattern="{pattern}"
                    width="{visWidth}"
                    height="{visHeight}"
                />
            {/if}
        {/if}
    {:else if data.length > 0}
        <!-- when test is over and data is there, show it -->
        <p>{feedback}</p>
        <PlotLine data="{data}" final="{final}" />
    {/if}
</main>
