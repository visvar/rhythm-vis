<script>
    import { onDestroy } from 'svelte';
    import NumberInput from './number-input.svelte';
    import * as d3 from 'd3';
    import { playIcon, stopIcon } from '../lib/icons';

    export let notes = [];
    export let speed = 1;
    export let callback = () => {};

    let timeouts = [];
    let oldNotes;
    let isPlaying = false;
    // progress indicator circle
    let circle;
    const circleSize = 20;
    const circleRadius = (circleSize - 4) / 2;

    /**
     * plays notes
     */
    const replay = () => {
        isPlaying = true;
        oldNotes = [...notes];
        notes = [];
        timeouts = [];
        const maxTime = d3.max(oldNotes, (d) => d.time ?? d);
        const timeFactor = 1000 * (1 / speed);
        for (const note of oldNotes) {
            const time = note.time ?? note;
            timeouts.push(
                setTimeout(() => {
                    notes = [...notes, note];
                    // show progress
                    showProgress(time / maxTime);
                    // stop when finished
                    if (notes.length === oldNotes.length) {
                        stop();
                    } else {
                        callback();
                    }
                }, time * timeFactor),
            );
        }
    };

    /**
     * stops replay and shows full data
     */
    const stop = () => {
        isPlaying = false;
        for (const to of timeouts) {
            clearInterval(to);
        }
        timeouts = [];
        notes = oldNotes;
        callback();
    };

    const handleClick = () => {
        !isPlaying ? replay() : stop();
    };

    onDestroy(() => {
        for (const to of timeouts) {
            clearInterval(to);
        }
    });

    /**
     * updates the circle that indicates replay progress
     * @param {number} progress between 0 and 1
     */
    const showProgress = (progress) => {
        // see https://codepen.io/mjurczyk/pen/wvBKOvP
        const circumference = 2 * Math.PI * circleRadius;
        const strokeOffset = (1 / 4) * circumference;
        const strokeDasharray = progress * circumference;
        // First has the length of visible portion. Second, the remaining part.
        circle.setAttribute('stroke-dasharray', [
            strokeDasharray,
            circumference - strokeDasharray,
        ]);
        // Rotate circle to start from the top.
        circle.setAttribute('stroke-dashoffset', strokeOffset);
    };
</script>

<main>
    <button
        title="replay the current notes, click again to stop"
        on:click="{handleClick}"
        disabled="{notes.length === 0}"
    >
        <!-- show either progress or play button -->
        {#if isPlaying}
            {stopIcon}
            <svg width="{circleSize}px" height="{circleSize}px">
                <circle
                    bind:this="{circle}"
                    cx="{circleSize / 2}"
                    cy="{circleSize / 2}"
                    r="{circleRadius}"
                ></circle>
            </svg>
        {:else}
            {playIcon}
        {/if}
    </button>
    <NumberInput
        title="replay speed (2 means twice as fast, 0.5 half as fast)"
        bind:value="{speed}"
        min="{0.5}"
        max="{10}"
        step="{0.1}"
        width="40px"
        disabled="{notes.length === 0}"
        style="border-radius: 0 8px 8px 0;"
    />
</main>

<style>
    main {
        display: inline-block;
    }

    button {
        width: 80px;
        display: inline-flex;
        align-items: center;
        justify-items: stretch;
        margin-right: -25px;
        border-radius: 8px 0 0 8px;
    }

    svg {
        display: inline-block;
        margin-left: 8px;
    }

    svg circle {
        stroke: #888;
        stroke-width: 2px;
        fill: transparent;
        /* fill: black; */
    }
</style>
