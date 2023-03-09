<script>
  export let exercise;
  export let bpm = 120;

  let audioElement;
  $: {
    if (audioElement && bpm && !isNaN(+bpm)) {
      audioElement.playbackRate = bpm / 120;
    }
  }
</script>

<main>
  <audio
    bind:this="{audioElement}"
    src="{`${window.location.pathname}/mp3/${exercise}.mp3`}"
    controls
    loop
  >
  </audio>
</main>
