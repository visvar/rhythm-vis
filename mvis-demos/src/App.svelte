<script>
  import { getUrlParam, setUrlParam } from './lib/url';
  import { setHasAny, updSet } from './lib/lib';
  import saveAs from 'file-saver';
  import Tools from './tools/_tools.svelte';
  // demos
  import SubDivision from './demos/sub-division.svelte';
  import TempoDrift from './demos/tempo-drift.svelte';
  import Dynamics from './demos/dynamics.svelte';
  import ImprovisationIntervals from './demos/improvisation-intervals.svelte';
  import ImprovisationScaleDegrees from './demos/improvisation-scale-degrees.svelte';
  import FretboardHeatmap from './demos/fretboard-heatmap.svelte';
  import ChordArpeggioTiming from './demos/chord-arpeggio-timing.svelte';
  import KeyboardHistogram from './demos/keyboard-histogram.svelte';
  import FretboardImprovisationIntervals from './demos/fretboard-improvisation-intervals.svelte';
  import SpeedUp from './demos/speed-up.svelte';
  import RhythmSheetMusic from './demos/rhythm-sheet-music.svelte';
  import ChordDiagrams from './demos/chord-diagrams.svelte';

  /**
   * All demos defined here
   */
  const DEMOS = [
    {
      id: 'sub-division',
      title: 'Sub-Division',
      description: 'Learn rhythmic playing in different sub-divisions.',
      task: 'timing',
      input: 'MIDI',
      instruments: ['drum', 'guitar/bass', 'keyboard'],
      component: SubDivision,
    },
    {
      id: 'tempo-drift',
      title: 'Tempo Drift',
      description: 'Keep your tempo constant over a longer stretch of playing.',
      task: 'timing',
      input: 'MIDI',
      instruments: ['drum', 'guitar/bass', 'keyboard'],
      component: TempoDrift,
    },
    {
      id: 'dynamics',
      title: 'Dynamics',
      description: 'Check how well you control the loudness of notes.',
      tags: ['task:dynamics', 'input:MIDI', 'encoding:bars'],
      task: 'dynamics',
      input: 'MIDI',
      instruments: ['drum', 'guitar/bass', 'keyboard'],
      component: Dynamics,
    },
    {
      id: 'improvisation-intervals',
      title: 'Improvisation Intervals',
      description:
        'See how often you use different intervals in improvisation.',
      task: 'pitch',
      input: 'MIDI',
      instruments: ['drum', 'guitar/bass', 'keyboard'],
      component: ImprovisationIntervals,
    },
    {
      id: 'improvisation-scale-degrees',
      title: 'Improvisation Scale Degrees',
      description:
        'See how often you use different scale degrees in improvisation.',
      task: 'pitch',
      input: 'MIDI',
      instruments: ['drum', 'guitar/bass', 'keyboard'],
      component: ImprovisationScaleDegrees,
    },
    {
      id: 'keyboard-histogram',
      title: '[new] Keyboard Histogram',
      description: 'See how often you play different keyboard keys.',
      task: 'pitch',
      input: 'MIDI',
      instruments: ['keyboard'],
      component: KeyboardHistogram,
    },
    {
      id: 'fretboard-heatmap',
      title: 'Fretboard Heatmap',
      description: 'See how often you play different fretboard positions.',
      task: 'pitch',
      input: 'MIDI',
      instruments: ['guitar/bass'],
      component: FretboardHeatmap,
    },
    {
      id: 'fretboard-improvisation-intervals',
      title: '[new] Fretboard Improvisation Intervals',
      description:
        'Once you play a note, see where on the fretboard you can reach different intervals to the last played note.',
      task: 'pitch',
      input: 'MIDI',
      instruments: ['guitar/bass'],
      component: FretboardImprovisationIntervals,
    },
    {
      id: 'chord-arpeggio-timing',
      title: 'Chord and Arpeggio Timing',
      description:
        'See how spaced out the notes in a chord or arpeggio are, and how much time lies between these.',
      task: 'timing',
      input: 'MIDI',
      instruments: ['drum', 'guitar/bass', 'keyboard'],
      component: ChordArpeggioTiming,
    },
    {
      id: 'speed-up',
      title: '[new] Speed-Up',
      description:
        'Record a short exercise at a slow tempo, then practice it with steadily increasing tempo.',
      task: 'timing',
      input: 'MIDI',
      instruments: ['drum', 'guitar/bass', 'keyboard'],
      component: SpeedUp,
    },
    {
      id: 'rhythm-sheet-music',
      title: '[new] Rhythm Sheet Music',
      description:
        'This demo displays the notes you play as staff notation (𝅝, 𝅗𝅥, 𝅘𝅥, 𝅘𝅥𝅮, 𝅘𝅥𝅯) and offset in percent.',
      task: 'timing',
      input: 'MIDI',
      instruments: ['drum', 'guitar/bass', 'keyboard'],
      component: RhythmSheetMusic,
    },
    {
      id: 'chord-diagrams',
      title: '[new] Chord Diagrams',
      description:
        'See what chords you play on a guitar/bass as chord diagrams.',
      task: 'chords',
      input: 'MIDI',
      instruments: ['guitar/bass'],
      component: ChordDiagrams,
    },
  ];

  let currentDemo = null;

  // handle URL parameters
  const param = getUrlParam(window, 'd');
  if (param && param !== '') {
    currentDemo = DEMOS.filter((d) => d.id === param)[0];
  }

  // access protection (not secure of course)
  let corrP = 'rhyvis';
  let password = localStorage.getItem('pwd') ?? '';
  $: {
    localStorage.setItem('pwd', password);
  }

  // allow to go back to main page with history
  window.onpopstate = (e) => {
    if (currentDemo !== null) {
      currentDemo = null;
    }
  };

  // track how often and when each demo is used
  $: {
    if (currentDemo && currentDemo !== 'tools') {
      let usage;
      if (localStorage.getItem('usage') !== null) {
        usage = localStorage.getItem('usage');
        usage = JSON.parse(usage);
      } else {
        usage = {
          demoClicks: {},
        };
      }
      const demoClicks = usage.demoClicks;
      const thisDemoUsage = demoClicks[currentDemo.id] ?? [];
      thisDemoUsage.push(new Date().toUTCString());
      demoClicks[currentDemo.id] = thisDemoUsage;
      localStorage.setItem('usage', JSON.stringify(usage));
    }
  }

  // tags
  const allTasks = new Set(DEMOS.flatMap((d) => d.task).sort());
  const allInstruments = new Set(DEMOS.flatMap((d) => d.instruments).sort());
  // filter
  let currentTasks = new Set(allTasks);
  let currentInstruments = new Set(allInstruments);
  $: console.log(currentInstruments);
</script>

<main>
  <h1>Data-Driven Music Education Demos</h1>

  {#if password !== corrP}
    <input type="password" placeholder="password" bind:value="{password}" />
  {:else if !currentDemo}
    <p class="explanation">
      This page contains a collection of small tools (demos) that are each
      tailored to a specific musical skill and sometimes also specific kind of
      musical data. You can filter demos with the bottuns below. Click a button
      to toggle it, double click it to turn it on and all others of the same
      kind off. A demo will only be shown if it supports at least one of the
      active attributes.
    </p>

    <div>
      task
      <button
        on:click="{() => {
          currentTasks = new Set(allTasks);
        }}"
      >
        all
      </button>
      {#each allTasks.values() as d}
        <button
          on:click="{() => (currentTasks = updSet(currentTasks, d))}"
          on:dblclick="{() => (currentTasks = new Set([d]))}"
          class="{currentTasks.has(d) ? 'active' : 'hidden'}"
        >
          {d}
        </button>
      {/each}
    </div>
    <div>
      instrument
      <button
        on:click="{() => {
          currentInstruments = new Set(allInstruments);
        }}"
      >
        all
      </button>
      {#each allInstruments.values() as d}
        <button
          on:click="{() =>
            (currentInstruments = updSet(currentInstruments, d))}"
          on:dblclick="{() => (currentInstruments = new Set([d]))}"
          class="{currentInstruments.has(d) ? 'active' : 'hidden'}"
        >
          {d}
        </button>
      {/each}
    </div>

    <!-- demo overview grid -->
    <div class="grid">
      {#each DEMOS as demo}
        {#if currentTasks.has(demo.task) && setHasAny(currentInstruments, demo.instruments)}
          <!-- svelte-ignore a11y-click-events-have-key-events -->
          <!-- svelte-ignore a11y-no-static-element-interactions -->
          <div
            class="card"
            on:click="{() => {
              currentDemo = demo;
              setUrlParam(window, 'd', demo.id);
            }}"
          >
            <h2>{demo.title}</h2>
            <div class="description">
              {demo.description}
            </div>
            <div class="tags">
              instrument:
              {demo.instruments.includes('guitar/bass') ? '🎸' : ''}
              {demo.instruments.includes('drum') ? '🥁' : ''}
              {demo.instruments.includes('keyboard') ? '🎹' : ''}
            </div>
            <div class="tags">
              task:
              {demo.task === 'dynamics' ? '🔊' : ''}
              {demo.task === 'timing' ? '🕐' : ''}
              {demo.task === 'pitch' ? '🎶' : ''}
            </div>
          </div>
        {/if}
      {/each}
    </div>
    <!-- Tools page button -->
    <button
      on:click="{() => {
        currentDemo = 'tools';
        setUrlParam(window, 'd', 'tools');
      }}"
    >
      tools
    </button>
    <!-- export usage button -->
    <button
      on:click="{() => {
        const usage = localStorage.getItem('usage');
        const blob = new Blob([usage], {
          type: 'text/plain;charset=utf-8',
        });
        saveAs(blob, 'usage.json');
      }}"
    >
      export usage
    </button>
  {:else}
    <!-- back button -->
    <button
      on:click="{() => {
        currentDemo = null;
        setUrlParam(window, 'd', '');
      }}"
    >
      &lt; back
    </button>
    {#if currentDemo === 'tools'}
      <Tools />
    {:else}
      <!-- show demo by importing dynamically -->
      <svelte:component this="{currentDemo.component}" />
    {/if}
  {/if}
</main>

<style>
  .card .tags {
    font-size: larger;
  }

  button.active {
    background-color: rgb(218, 236, 251);
  }
</style>
