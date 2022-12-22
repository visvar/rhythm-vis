<script>
  import { onDestroy } from 'svelte';
  import { WebMidi } from 'webmidi';
  import * as d3 from 'd3';

  // Array of inputs, each input has a map of channels and when they were last active
  let inputs = [];

  // Enable WebMidi.js and trigger the onEnabled() function when ready.
  WebMidi.enable()
    .then(onEnabled)
    .catch((err) => alert(err));

  function onEnabled() {
    // console.log(WebMidi.inputs);
    const inputsNew = [];
    for (const [index, input] of WebMidi.inputs.entries()) {
      inputsNew.push({
        input,
        lastNotes: new Map(),
      });
      input.addListener('noteon', (e) => {
        // console.log(e);
        const channel = e.message.channel;
        inputs[index].lastNotes.set(channel, e.timestamp);
        inputs = [...inputs];
      });
    }
    inputs = inputsNew;
  }

  // Does not work
  // onDestroy(WebMidi.disable);
</script>

<main>
  <h2>MIDI inputs</h2>

  {#each inputs as input}
    <h3>{input.input.name}</h3>
    <div>
      Channels received: {[...input.lastNotes.keys()].sort().join(', ')}
    </div>
    <svg width="160" height="8">
      {#each d3.range(0, 16) as channel}
        <rect
          x="{channel * 10}"
          y="0"
          width="8"
          height="8"
          rx="2"
          fill="{input.lastNotes.has(channel) ? 'steelblue' : '#aaa'}"></rect>
      {/each}
    </svg>
  {/each}
</main>

<style>
</style>
