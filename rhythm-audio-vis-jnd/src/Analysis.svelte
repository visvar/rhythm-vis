<script>
  import PlotLine from './lib/StaircaseJS/PlotLine.svelte';

  let data = [];
  let fileNames = [];
  let showAbsolute = false;

  const handleFileInput = async (evt) => {
    const data2 = [];
    const fileNames2 = [];
    for (const file of evt.target.files) {
      const content = await file.text();
      data2.push(JSON.parse(content));
      fileNames2.push(file.name);
    }
    data = data2;
    fileNames = fileNames2;
  };
</script>

<main>
  <h2>Analysis</h2>

  <p>
    Open a file that you saved after a study here to see the staircases and
    final values.
  </p>

  <input type="file" on:input="{handleFileInput}" accept=".json" multiple />

  <button on:click="{() => (showAbsolute = !showAbsolute)}">
    toggle absolute values {showAbsolute}
  </button>

  {#each data as d, index}
    <div>
      <h4>{fileNames[index]}</h4>
      {#each d as test}
        <h5>{test.encoding}</h5>
        {test.encoding === 'audio' || test.encoding === 'waveform'
          ? test.audioFile
          : ''}
        (final: {test.final.toFixed(2)})
        <PlotLine
          data="{test.data}"
          final="{test.final}"
          showAbsolute="{showAbsolute}"
          height="{150}"
        />
      {/each}
    </div>
  {/each}
</main>

<style>
</style>
