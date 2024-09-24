<script>
  import { onMount } from 'svelte';
  import { group } from 'd3';
  import { readJsonFile, readTextFile } from '../../lib/files';
  import { Utils } from 'musicvis-lib';
  import NoteDistanceBars from '../analysis/NoteDistanceBars.svelte';
  import DensityPlotSeparate from '../analysis/DensityPlotSeparate.svelte';
  import RecordingDates from './RecordingDates.svelte';
  import DensityPlot from '../analysis/DensityPlot.svelte';
  import TempoEstimation from '../analysis/TempoEstimation.svelte';
  import PianoRoll from '.../common/PianoRoll.svelte';
  import DeltaTimeHistogramPlot from '../analysis/DeltaTimeHistogramPlot.svelte';

  export let dataDirectoryHandle = null;

  let width = window.innerWidth - 100;

  // data
  let recFiles = new Set();
  let recordings = [];
  // filter
  let persons = [];
  let selectedPersons = [];
  let exercises = [];
  let selectedExercises = [];
  let selectedClicks = [];
  $: filteredRecordings = filterRecs(
    recordings,
    filterBy,
    selectedExercises,
    selectedPersons,
    selectedClicks,
  );
  let selectedRecordings = new Set();

  // config
  let filterBy = '';
  let sortBy = 'date';
  let noteColorMode = 'none';

  let views = [
    // 'Exercise',
    // 'Notepad',
    // 'Filter',
    // 'Histogram',
    // 'Ticks',
    'Density',
    // 'Ground truth',
    // 'Main',
    'Note Distance',
    // 'Scatterplot',
    // 'Aggregated',
    'Density Separate',
    'Time diff.',
    'Piano Roll',
    'Tempo Estimation',
  ];
  let currentView = 'Note Distance';

  // get data from files
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
        rec.audioFile = file.name;
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
      lim = 'infinite';
    }
    rec.exercise = [ins, exc, rhy].join('_');
    rec.person = per.split('-').join(' ');
    let [date, time] = dat.split('T');
    time = time?.split('-').join(':') ?? '00:00:00';
    rec.date = `${date} ${time}`;
    // rec.dateObj = new Temporal(dat);
    rec.dateObj = new Date(`${date}T${time}`);
    rec.bpm = +tem.split('-')[0];
    rec.metroClick = clk.split('-')[0];
    rec.metroAccent = acc?.split('-')[0];
    rec.metroLimit = lim?.split('-')[0];
    // data preprocessing
    const firstNoteStart = rec.notesRec[0]?.start ?? 0;
    const spb = Utils.bpmToSecondsPerBeat(rec.bpm);
    rec.timeAlignment = Math.floor(firstNoteStart / spb);
    const onsets = rec.notesRec.map((d) => d.start);
    rec.onsetsInBeats = onsets.map((d) => d / spb - rec.timeAlignment);
    return rec;
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
    // set filter options, select all by default
    persons = Utils.removeDuplicates(recordings.map((d) => d.person)).sort();
    selectedPersons = persons;
    exercises = Utils.removeDuplicates(
      recordings.map((d) => d.exercise),
    ).sort();
    selectedExercises = exercises;
    selectedClicks = ['3', '4', '6', '8', 'infinite'];
  };

  onMount(async () => {
    await updateRecordingList();
  });

  /**
   * Sorts recordings for the select options
   * @param {object[]} recordings recording names
   * @param {string} by sorty by...
   */
  const sortRecs = (recordings, by) => {
    // const [ins, exc, rhy, tem, clk, acc, lim, per, dat] = fileName.split('_');
    if (by === 'name') {
      recordings.sort();
    } else if (by === 'date') {
      recordings.sort((a, b) => (a.date < b.date ? 1 : -1));
    } else if (by === 'exercise') {
      recordings.sort((a, b) => (a.exercise > b.exercise ? 1 : -1));
    } else if (by === 'person') {
      recordings.sort((a, b) => (a.person < b.person ? 1 : -1));
    } else if (by === 'noteCount') {
      recordings.sort((a, b) => b.notesRec.length - a.notesRec.length);
    } else if (by === 'notes') {
      recordings.sort((a, b) => (a.notes < b.notes ? 1 : -1));
    } else if (by === 'bpm') {
      recordings.sort((a, b) => b.bpm - a.bpm);
    } else if (by === 'metroLimit') {
      recordings.sort((a, b) => (b.metroLimit < a.metroLimit ? -1 : 1));
    }
    return [...recordings];
  };

  /**
   * Filters recording names
   * @param {object[]} recordings recording names
   * @param {string} by sorty by...
   */
  const filterRecs = (
    recordings,
    by,
    selectedExercises,
    selectedPersons,
    selectedClicks,
  ) => {
    const p = new Set(selectedPersons);
    const e = new Set(selectedExercises);
    const c = new Set(selectedClicks);
    // const search = by.split(/\s+/);
    return recordings.filter(
      (d) => p.has(d.person) && e.has(d.exercise) && c.has(d.metroLimit),
      // &&
      // every(search, (s) => d.name.includes(s))
    );
  };

  const deleteRecording = async (recName) => {
    if (
      confirm(
        `Are you sure you want to delete this recording?:\n\n${recName}\n\nThis cannot be undone!`,
      )
    ) {
      const files = recFiles.get(recName);
      for (const file of files) {
        dataDirectoryHandle.removeEntry(file.name);
      }
      updateRecordingList();
    }
  };
</script>

<main>
  <h2>Recordings Overview</h2>

  <div>
    {recordings.length} recordings, {filteredRecordings.length} filtered, {selectedRecordings.size}
    selected
  </div>

  <!-- <label title="e.g., 100-bpm">
    Filter:
    <input
      type="text"
      placeholder="space-separated words"
      bind:value="{filterBy}"
    />
  </label> -->

  <div class="filter">
    <label>
      <span>Persons:</span>
      <select bind:value="{selectedPersons}" multiple>
        {#each persons as person}
          <option value="{person}">{person}</option>
        {/each}
      </select>
    </label>

    <label>
      <span>Exercises:</span>
      <select bind:value="{selectedExercises}" multiple>
        {#each exercises as exercise}
          <option value="{exercise}">{exercise}</option>
        {/each}
      </select>
    </label>

    <label>
      <span>Clicks:</span>
      <select bind:value="{selectedClicks}" multiple>
        {#each ['3', '4', '6', '8', 'infinite'] as click}
          <option value="{click}">{click}</option>
        {/each}
      </select>
    </label>
  </div>

  <div class="table-container view">
    <table>
      <thead>
        <tr>
          <th
            title="select / deselect all"
            on:click="{() => {
              selectedRecordings.size === recordings.length
                ? (selectedRecordings = new Set())
                : (selectedRecordings = new Set(filteredRecordings));
            }}">✓</th
          >
          <th on:click="{() => (sortBy = 'exercise')}">
            exercise {sortBy === 'exercise' ? '🠧' : ''}
          </th>
          <th on:click="{() => (sortBy = 'date')}">
            date {sortBy === 'date' ? '🠥' : ''}
          </th>
          <th on:click="{() => (sortBy = 'person')}">
            person {sortBy === 'person' ? '🠧' : ''}
          </th>
          <th on:click="{() => (sortBy = 'bpm')}">
            bpm {sortBy === 'bpm' ? '🠧' : ''}
          </th>
          <th on:click="{() => (sortBy = 'metroLimit')}">
            metro limit {sortBy === 'metroLimit' ? '🠥' : ''}
          </th>
          <th on:click="{() => (sortBy = 'noteCount')}">
            notes {sortBy === 'noteCount' ? '🠧' : ''}
          </th>
          <th on:click="{() => (sortBy = 'hasAudio')}">
            has audio {sortBy === 'hasAudio' ? '🠧' : ''}
          </th>
          <th on:click="{() => (sortBy = 'notes')}">
            notes {sortBy === 'notes' ? '🠥' : ''}
          </th>
          <th style="cursor: default;"> x </th>
        </tr>
      </thead>
      <tbody>
        {#each sortRecs(filteredRecordings, sortBy) as rec (rec.name)}
          <tr title="{rec.name}">
            <td>
              <input
                type="checkbox"
                checked="{selectedRecordings.has(rec)}"
                on:click="{() => {
                  selectedRecordings.has(rec)
                    ? selectedRecordings.delete(rec)
                    : selectedRecordings.add(rec);
                  selectedRecordings = new Set([...selectedRecordings]);
                  console.log(selectedRecordings);
                }}"
              />
            </td>
            <td>{rec.exercise}</td>
            <td>{rec.date ?? ''}</td>
            <td>{rec.person ?? ''}</td>
            <td>{rec.bpm}</td>
            <td>{rec.metroLimit ?? ''}</td>
            <td>{rec.notesRec.length}</td>
            <td>{rec.hasAudio ? '✓' : ''}</td>
            <td>{rec.notes ?? ''}</td>
            <td title="delete recording">
              <button on:click="{() => deleteRecording(rec.name)}">x</button>
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>

  <div>
    <label>
      View:
      <select bind:value="{currentView}">
        {#each views as view}
          <option value="{view}">{view}</option>
        {/each}
      </select>
    </label>

    <label title="Note color mode">
      color
      <select bind:value="{noteColorMode}">
        <option value="none">none</option>
        <option value="channel">channel / string</option>
        <optgroup label="pitch">
          <option value="chroma">chroma</option>
          <option value="pitch">pitch</option>
        </optgroup>
        <optgroup label="drums">
          <option value="drums" title="e.g., tom1, tom2, cymbal1, cymbal2">
            drum parts
          </option>
          <option value="drumsType" title="e.g., tom, cymbal">
            drum part type
          </option>
        </optgroup>
        <option value="velocity">velocity / dynamics</option>
        <option value="duration">duration</option>
        <option value="device">device</option>
        <option value="error">distance to grid</option>
      </select>
    </label>
  </div>

  <RecordingDates {width} dates="{filteredRecordings.map((d) => d.dateObj)}" />

  <div>
    {#each [...selectedRecordings] as rec}
      <div>
        {rec.name}
        {#if currentView === 'Note Distance'}
          <NoteDistanceBars
            {width}
            height="{100}"
            notes="{rec.notesRec}"
            onsetsInBeats="{rec.onsetsInBeats}"
            {noteColorMode}
            showControls="{false}"
          />
        {/if}
        {#if currentView === 'Density'}
          <DensityPlot
            {width}
            values="{rec.onsetsInBeats}"
            beats="{4}"
            contextBeats="{1}"
            xLabel="beats"
          />
        {/if}
        {#if currentView === 'Density Separate'}
          <DensityPlotSeparate
            {width}
            notes="{rec.notesRec}"
            onsetsInBeats="{rec.onsetsInBeats}"
            beats="{4}"
            xTicks="beat"
          />
        {/if}
        {#if currentView === 'Tempo Estimation'}
          <TempoEstimation
            notes="{rec.notesRec}"
            bpm="{rec.bpm}"
            xLabel="estimated BPM"
            bandwidth="{0.5}"
            {width}
            height="{80}"
          />
        {/if}
        {#if currentView === 'Piano Roll'}
          <PianoRoll
            notes="{rec.notesRec}"
            metronomeClicks="{rec.metroClicks}"
            metronomeAccents="{rec.metroAccents}"
            {width}
          />
        {/if}
        {#if currentView === 'Time diff.'}
          <DeltaTimeHistogramPlot {width} onsetsInBeats="{rec.onsetsInBeats}" />
        {/if}
        <!-- {#if currentView === 'Scatterplot'}
          <ScatterPlot
            width="{width}"
            notes="{rec.notesRec}"
            onsetsInBeats="{rec.onsetsInBeats}"
            exerciseNoteOnsetsInBeats="{rec.onsetsInBeats}"
            beats="{4}"
            noteColorMode="{noteColorMode}"
            thicknessMode="{'velocity'}"
            xTicks="{1}"
          />
        {/if} -->
      </div>
    {/each}
  </div>
</main>

<style>
  main {
    padding: 0 10px 20px 10px;
  }

  .filter {
    display: grid;
    grid-template-columns: repeat(3, auto);
    justify-items: center;
    align-items: center;
  }
  .filter label {
    display: grid;
    grid-template-columns: repeat(2, auto);
    justify-items: center;
    align-items: center;
    gap: 5px;
  }

  .table-container {
    max-height: 400px;
    overflow-y: scroll;
  }

  table {
    width: 100%;
    font-size: 0.9em;
  }

  thead {
    background: white;
  }

  thead tr th {
    position: sticky;
    top: 0;
  }

  td,
  th {
    border-radius: 4px;
  }

  th {
    cursor: pointer;
    background-color: #ddd;
  }

  tbody tr:nth-child(even) {
    background-color: #eee;
  }

  tbody td:nth-child(2) {
    text-align: left;
  }
  tbody td:nth-child(5),
  tbody td:nth-child(7) {
    text-align: right;
  }
</style>
