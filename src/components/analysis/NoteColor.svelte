<script>
    import { Midi } from 'musicvis-lib';
    import { afterUpdate } from 'svelte';
    import { drumPitchReplacementMap } from '../../lib/drums';

    export let notes;
    export let noteColorOptions;

    let colorMode = 'none';

    afterUpdate(() => {
        let color;
        let type;
        let tickFormat = (d) => d;
        let scheme;
        if (colorMode === 'none') {
            color = 'black';
        } else if (colorMode === 'chroma') {
            color = (d, i) => notes[i].pitch % 12;
            type = 'ordinal';
            tickFormat = (d) => Midi.NOTE_NAMES[d];
            scheme = 'rainbow';
        } else if (colorMode === 'pitch') {
            color = (d, i) => notes[i]?.pitch;
            type = 'ordinal';
            scheme = 'viridis';
        } else if (colorMode === 'drums') {
            color = (d, i) =>
                drumPitchReplacementMap.get(notes[i].pitch)?.label;
            type = 'categorical';
            tickFormat = (d) => d ?? 'other';
            scheme = 'tableau10';
        } else if (colorMode === 'drumsType') {
            color = (d, i) => drumPitchReplacementMap.get(notes[i].pitch)?.type;
            type = 'categorical';
            tickFormat = (d) => d ?? 'other';
            scheme = 'tableau10';
        } else if (colorMode === 'channel') {
            color = (d, i) => notes[i].channel;
            type = 'ordinal';
            scheme = 'tableau10';
        } else if (colorMode === 'velocity') {
            color = (d, i) => notes[i].velocity;
            type = 'linear';
            scheme = 'greys';
        } else if (colorMode === 'duration') {
            color = (d, i) => notes[i].end - notes[i].start;
            type = 'linear';
            scheme = 'greys';
        }
        noteColorOptions = {
            mode: colorMode,
            color,
            type,
            tickFormat,
            scheme,
        };
    });
</script>

<label title="Note color mode">
    color
    <select bind:value="{colorMode}">
        {#each ['none', 'chroma', 'pitch', 'drums', 'drumsType', 'channel', 'velocity', 'duration'] as value}
            <option value="{value}">{value}</option>
        {/each}
    </select>
</label>
