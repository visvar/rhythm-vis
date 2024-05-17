<script>
    import { Note } from '@tonaljs/tonal';
    import { onDestroy, onMount } from 'svelte';
    import { WebMidi } from 'webmidi';

    let midiDevices = [];

    // data
    let firstTimeStamp = 0;
    let messages = [];

    const onMidiEnabled = () => {
        midiDevices = [];
        if (WebMidi.inputs.length < 1) {
            console.warn('No MIDI device detected');
        } else {
            WebMidi.inputs.forEach((device, index) => {
                console.log(`MIDI device ${index}: ${device.name}`);
                device.addListener('midimessage', (e) => {
                    messages = [e, ...messages];
                    console.log(e);
                });
            });
            midiDevices = [...WebMidi.inputs];
        }
    };

    onMount(() => {
        WebMidi.enable()
            .then(onMidiEnabled)
            .catch((err) => alert(err));
        firstTimeStamp = performance.now();
    });

    onDestroy(() => {
        // remove MIDI listeners to avoid duplicate calls and improve performance
        for (const input of WebMidi.inputs) {
            input.removeListener();
        }
    });
</script>

<main class="demo">
    <h2>MIDI Logger</h2>
    <p class="explanation">
        Input anything on a MIDI device to see the incoming messages below.
    </p>
    <div class="control">
        <button
            title="Clear all messages"
            on:click="{() => {
                messages = [];
            }}"
        >
            reset
        </button>
    </div>
    <div class="visualization">
        <p>{messages.length} messages received</p>
        <table>
            <thead>
                <th>timestamp</th>
                <th>manufacturer</th>
                <th>name</th>
                <th>command</th>
                <th>data</th>
                <th>note</th>
                <th>velocity</th>
            </thead>
            <tbody>
                <!-- {#each messages as m (m.timestamp)} -->
                {#each messages.slice(0, 100) as m}
                    <tr>
                        <td>{m.timestamp.toFixed(1)}</td>
                        <td>{m.port.manufacturer}</td>
                        <td>{m.port.name}</td>
                        <td>{m.message.command} {m.message.type}</td>
                        <td>{m.message.dataBytes}</td>
                        <td>
                            {['noteon', 'noteoff'].includes(m.message.type)
                                ? Note.fromMidiSharps(m.message.dataBytes[0])
                                : ''}
                        </td>
                        <td>
                            {['noteon', 'noteoff'].includes(m.message.type)
                                ? m.message.dataBytes[1]
                                : ''}
                        </td>
                    </tr>
                {/each}
            </tbody>
        </table>
    </div>
</main>

<style>
    table {
        border-collapse: collapse;
    }

    table td {
        padding: 7px;
        border: 1px solid #eee;
    }

    table tr:nth-child(even) {
        background-color: #e8e8e8;
    }
</style>
