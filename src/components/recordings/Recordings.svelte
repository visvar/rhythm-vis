<script>
  import { onMount } from 'svelte';
  import { group } from 'd3';
  import { readJsonFile, readTextFile } from '../../lib/files';

  export let dataDirectoryHandle = null;

  // data
  let recFiles = new Set([]);
  let recordings = [];

  // extract selected file from zip and get data
  const handleFileSelect = async (recName, recFiles) => {
    const files = recFiles.get(recName);
    if (!files) {
      return;
    }
    const rec = {
      notesConv: [],
      notesRec: [],
      hasAudio: false,
    };
    for (const file of files) {
      if (file.name.endsWith('.conv.rec.json')) {
        // notes from converter
        rec.notesConv = await readJsonFile(file.handle);
      } else if (file.name.endsWith('.rec.json')) {
        // notes from recorder
        rec.notesRec = await readJsonFile(file.handle);
      } else if (file.name.endsWith('.clicks.json')) {
        // metronome clicks
        rec.metroClicks = await readJsonFile(file.handle);
      } else if (file.name.endsWith('.accents.json')) {
        // metronome accents
        rec.metroAccents = await readJsonFile(file.handle);
      } else if (file.name.endsWith('.audio.weba')) {
        // audio
        rec.hasAudio = true;
      } else if (file.name.endsWith('.notes.txt')) {
        // notes
        rec.notes = await readTextFile(file.handle);
      }
    }
    rec.notesConv.sort((a, b) => a.start - b.start);
    rec.notesRec.sort((a, b) => a.start - b.start);
    rec.name = recName;
    const fileName = files[0].name.substring(0, files[0].name.indexOf('.'));
    const fields = fileName.split('_');
    let [ins, exc, rhy, tem, clk, acc, lim, per, dat] = fields;
    if (fields.length !== 9) {
      per = acc;
      acc = undefined;
      dat = lim;
      lim = undefined;
    }
    rec.exercise = [ins, exc, rhy].join('_');
    // bpm = +tem.replace('-bpm', '');
    rec.bpm = +tem.split('-')[0];
    rec.click = clk;
    rec.accent = acc;
    rec.limit = lim;
    rec.person = per;
    rec.date = dat;
    return rec;
  };

  const deleteRecording = async (recName) => {
    if (
      confirm(
        `Are you sure you want to delete this recording?:\n\n${recName}\n\nThis cannot be undone!`
      )
    ) {
      const files = recFiles.get(recName);
      for (const file of files) {
        dataDirectoryHandle.removeEntry(file.name);
      }
      updateRecordingList();
    }
  };

  const updateRecordingList = async () => {
    // display list of recordings to analyze
    const files = [];
    for await (const [key, value] of dataDirectoryHandle.entries()) {
      files.push({ name: key, handle: value });
    }
    // group by recording name, to get all files that the belong to the same recording
    recFiles = group(files, (d) => d.name.substring(0, d.name.indexOf('.')));

    const tmp = [];
    for (const [name, files] of recFiles.entries()) {
      tmp.push(await handleFileSelect(name, recFiles));
    }
    recordings = tmp;
    console.log(recordings);
  };

  onMount(async () => {
    await updateRecordingList();
  });
</script>

<main>
  <h2>Recordings Overview</h2>

  {recordings.length} recordings

  <table>
    <tr>
      <th>exercise</th>
      <th>date</th>
      <th>person</th>
      <th>bpm</th>
      <th>notes</th>
      <th>has audio</th>
      <th>notes</th>
    </tr>
    <tbody>
      {#each recordings as rec}
        <tr title="{rec.name}">
          <td>{rec.exercise}</td>
          <td>{rec.date ?? ''}</td>
          <td>{rec.person ?? ''}</td>
          <td>{rec.bpm}</td>
          <td>{rec.notesRec.length}</td>
          <td>{rec.hasAudio ? '✓' : ''}</td>
          <td>{rec.notes ?? ''}</td>
        </tr>
      {/each}
    </tbody>
  </table>
</main>

<style>
  main {
    padding: 0 10px 20px 10px;
  }
  tbody tr:nth-child(even) {
    background-color: #eee;
  }
</style>
