<script>
    import { onDestroy, onMount } from 'svelte';
    import { WebMidi } from 'webmidi';
    import * as d3 from 'd3';
    import { Chord, Note } from '@tonaljs/tonal';

    let midiDevices = [];

    // data
    let firstTimeStamp = 0;
    let notes = [];
    let chordNotes = [];
    let chord = [];

    const onMidiEnabled = () => {
        midiDevices = [];
        if (WebMidi.inputs.length < 1) {
            console.warn('No MIDI device detected');
        } else {
            WebMidi.inputs.forEach((device, index) => {
                console.log(`MIDI device ${index}: ${device.name}`);
                device.addListener('noteon', noteOn);
            });
            midiDevices = [...WebMidi.inputs];
        }
    };

    const noteOn = (e) => {
        const noteInSeconds = (e.timestamp - firstTimeStamp) / 1000;
        const note = {
            number: e.note.number,
            velocity: e.rawVelocity,
            time: noteInSeconds,
            channel: e.message.channel,
        };
        notes.push(note);
        draw();
    };

    const draw = () => {
        const maxTime = d3.max(notes, (d) => d.time);
        // get chord
        chordNotes = notes
            // only notes from last second
            .filter((d) => d.time > maxTime - 1)
            //  sort from C to B
            .sort((a, b) => a.number - b.number)
            // get name
            .map((d) => Note.fromMidiSharps(d.number));
        // remove duplicates
        chordNotes = [...new Set(chordNotes)];
        chord = Chord.detect(chordNotes);
    };

    onMount(() => {
        WebMidi.enable()
            .then(onMidiEnabled)
            .catch((err) => alert(err));
        firstTimeStamp = performance.now();
        draw();
    });

    onDestroy(() => {
        // remove MIDI listeners to avoid duplicate calls and improve performance
        for (const input of WebMidi.inputs) {
            input.removeListener();
        }
    });
</script>

<main class="demo">
    <h2>Chord Detection</h2>
    <p class="explanation">
        Play a chord on a MIDI instrument. The notes you played and the detected
        chord will be shown below.
    </p>
    <div class="visualization">
        Notes: <b>{chordNotes.join(', ')}</b><br />
        Detected chord: <b>{chord.join(' or ')}</b>
    </div>
</main>
