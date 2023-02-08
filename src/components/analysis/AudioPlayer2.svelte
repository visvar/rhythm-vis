<script>
    import { onDestroy, onMount } from 'svelte';
    import WaveSurfer from 'wavesurfer.js';
    import RegionsPlugin from 'wavesurfer.js/dist/plugin/wavesurfer.regions';
    import { Utils } from 'musicvis-lib';

    export let audio;
    export let width;
    export let currentPlayerTime;
    export let currentTimeInBeats;
    export let selectionEndTime;
    export let spb;

    let wavesurfer;

    const setupWavesurfer = () => {
        // set up wavesurfer
        wavesurfer = WaveSurfer.create({
            container: '#waveform',
            waveColor: '#bbb',
            progressColor: 'steelblue',
            mediaControls: true,
            normalize: true,
            width: width - 20,
            height: 40,
            plugins: [RegionsPlugin.create({})],
        });
        wavesurfer.on('audioprocess', (time) => {
            currentPlayerTime = Utils.roundToNDecimals(time, 2);
        });
        // React to interaction (brush-link)
        wavesurfer.on('interaction', () => {
            const time = wavesurfer.getCurrentTime();
            currentPlayerTime = time;
        });
    };

    // react to new audio
    $: {
        try {
            audio ? wavesurfer?.loadBlob(audio) : wavesurfer?.empty();
        } catch (e) {
            console.warn(e, audio);
        }
    }

    // react to time span selection (by user brushing)
    $: {
        setRegion(selectionEndTime);
    }
    const setRegion = (selectionEndTime) => {
        console.log(currentPlayerTime, selectionEndTime);
        if (wavesurfer) {
            wavesurfer.clearRegions();
            if (selectionEndTime !== null) {
                wavesurfer.addRegion({
                    start: currentPlayerTime,
                    end: selectionEndTime,
                    loop: true,
                    drag: false,
                    resize: false,
                });
            }
        }
    };

    // react to time point selection (by user clicking)
    $: {
        if (wavesurfer && !wavesurfer.isPlaying()) {
            // when interacting with visualization, jump to same place in audio
            const time = currentTimeInBeats * spb;
            const duration = wavesurfer.getDuration();
            if (duration > 0) {
                const position = time / duration;
                // console.log(currentTimeInBeats, time, duration, position);
                try {
                    wavesurfer.seekTo(position);
                } catch (e) {
                    console.warn(e);
                    console.log(
                        `Wavesurfer cannot seek to ${position}, for time ${time} and duration ${duration}`
                    );
                }
            }
        }
    }

    // react to spacebar
    const playPauseOnSpaceBar = (e) => {
        if (e.key === ' ' && wavesurfer) {
            wavesurfer.playPause();
        }
    };

    onMount(() => {
        setupWavesurfer();
        document.body.addEventListener('keydown', playPauseOnSpaceBar);
    });

    onDestroy(() => {
        document.removeEventListener('keydown', playPauseOnSpaceBar);
        wavesurfer.destroy();
    });
</script>

<main>
    <div id="waveform" style="width: {width}px"></div>
    <div class="time-display">
        <button
            on:click="{() => wavesurfer.playPause()}"
            disabled="{!audio}"
            title="You can also use the space key"
        >
            play/pause
        </button>
        <label title="Playback rate, e.g., 1 for normal, 0.5 for half speed">
            speed
            <input
                on:input="{(e) => wavesurfer.setPlaybackRate(+e.target.value)}"
                type="number"
                value="1"
                min="0.1"
                max="2"
                step="0.1"
                style="width: 50px"
            />
        </label>
        <span>time in seconds: {currentPlayerTime.toFixed(3)}</span>
        <!-- <span>adjusted time: {currentAdjustedTime.toFixed(3)}</span> -->
        <span>time in beats: {currentTimeInBeats.toFixed(3)}</span>
    </div>
</main>

<style>
    main {
        margin: 2px 5px;
        padding: 10px 25px 0 25px;
        background: #f8f8f8;
        border-radius: 5px;
    }

    #waveform {
        padding: 0;
    }

    .time-display {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 10px;
        justify-items: center;
        align-items: center;
    }
</style>
