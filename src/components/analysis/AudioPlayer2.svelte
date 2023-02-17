<script>
    import { onDestroy, onMount } from 'svelte';
    import WaveSurfer from 'wavesurfer.js';
    import RegionsPlugin from 'wavesurfer.js/dist/plugin/wavesurfer.regions';
    import { Utils } from 'musicvis-lib';

    export let audio;
    export let width;
    export let currentTimeInBeats;
    export let selectionEndTime;
    export let timeAlignment;
    export let spb;

    let wavesurfer;
    let playButton;
    let currentAudioTime = 0;

    const audioTimeToBeatTime = (audioTime, spb, timeAlignment) => {
        return audioTime / spb - timeAlignment;
    };

    const setupWavesurfer = () => {
        // set up wavesurfer
        wavesurfer = WaveSurfer.create({
            container: '.waveform',
            waveColor: '#bbb',
            progressColor: 'steelblue',
            mediaControls: true,
            normalize: true,
            width: width - 20,
            height: 40,
            cursorWidth: 2,
            loopSelection: true,
            // splitChannels: true,
            plugins: [RegionsPlugin.create({})],
        });
        // update global time during playback
        wavesurfer.on('audioprocess', (time) => {
            currentAudioTime = Utils.roundToNDecimals(time, 2);
            currentTimeInBeats = audioTimeToBeatTime(
                currentAudioTime,
                spb,
                timeAlignment
            );
        });
        // react to interaction on wavesurfer
        wavesurfer.on('interaction', async (e) => {
            await Utils.delay(0.02);
            const time = wavesurfer.getCurrentTime();
            currentAudioTime = time;
            currentTimeInBeats = audioTimeToBeatTime(time, spb, timeAlignment);
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

    // react to time span selection (by user brushing vis)
    $: {
        setRegion(selectionEndTime);
    }
    const setRegion = (selectionEndTime) => {
        if (wavesurfer) {
            console.log(currentAudioTime, selectionEndTime);
            wavesurfer.clearRegions();
            if (selectionEndTime !== null) {
                wavesurfer.addRegion({
                    start: currentAudioTime,
                    end: selectionEndTime,
                    loop: true,
                    drag: false,
                    resize: false,
                });
            }
        }
    };

    // react to time point selection (by user clicking vis)
    $: {
        if (wavesurfer && !wavesurfer.isPlaying()) {
            // when interacting with visualization, jump to same place in audio
            const time = (currentTimeInBeats + timeAlignment) * spb;
            const duration = wavesurfer.getDuration();
            if (duration > 0) {
                const position = time / duration;
                // console.log(currentTimeInBeats, time, duration, position);
                try {
                    if (time !== currentAudioTime) {
                        wavesurfer.seekTo(time / wavesurfer.getDuration());
                    }
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
            // wavesurfer.playPause();
            playButton.click();
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
    <div class="waveform" style="width: {width}px"></div>
    <div class="time-display">
        <button
            bind:this="{playButton}"
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
        <span>{currentAudioTime.toFixed(1)} seconds</span>
        <span>{currentTimeInBeats.toFixed(1)} beats</span>
    </div>
</main>

<style>
    main {
        margin: 2px 5px;
        padding: 10px 25px 0 25px;
        background: #f8f8f8;
        border-radius: 5px;
    }

    .waveform {
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
