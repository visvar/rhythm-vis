<script>
  import { getUrlParam, setUrlParam } from './lib/url';
  import { setHasAny, updSet } from './lib/lib';
  import {
    localStorageGetUsageData,
    localStorageReport,
  } from './lib/localstorage';
  import saveAs from 'file-saver';
  // tools
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
  import PitchBend from './demos/pitch-bend.svelte';
  import SpeedUpTab from './demos/speed-up-tab.svelte';
  import ImprovisationScaleDegreesBar from './demos/improvisation-scale-degrees-bar.svelte';
  import PitchBendAudio from './demos/pitch-bend-audio.svelte';
  import ImprovisationNoteColors from './demos/improvisation-note-colors.svelte';
  import SubDivisionBar from './demos/sub-division-bar.svelte';
  import SubDivisionLinear from './demos/sub-division-linear.svelte';
  import FretboardJitter from './demos/fretboard-jitter.svelte';
  import FretboardSpacetimeCube from './demos/fretboard-spacetime-cube.svelte';
  import PitchOffsetCents from './demos/pitch-offset-cents.svelte';
  import Accents from './demos/accents.svelte';
  import Settings from './Settings.svelte';
  import SkillTree from './SkillTree.svelte';
  import { audioIcon, midiIcon } from './lib/icons';
  import StrummingPattern from './demos/strumming-pattern.svelte';
  import DemoOverview from './DemoOverview.svelte';

  /**
   * All demos defined here
   */
  const DEMOS = [
    {
      id: 'accents',
      title: '[new] Accents',
      description: 'See if you accent the right notes.',
      input: 'MIDI',
      instruments: ['drum', 'guitar/bass', 'keyboard'],
      skills: ['accents'],
      component: Accents,
    },
    {
      id: 'chord-arpeggio-timing',
      title: 'Chord and Arpeggio Timing',
      description:
        'See how spaced out the notes in a chord or arpeggio are, and how much time lies between these.',
      input: 'MIDI',
      instruments: ['drum', 'guitar/bass', 'keyboard'],
      skills: ['chord-timing', 'arpeggio-timing'],
      component: ChordArpeggioTiming,
    },
    {
      id: 'chord-diagrams',
      title: 'Chord Diagrams',
      description:
        'See what chords you play on a guitar/bass as chord diagrams.',
      input: 'MIDI',
      instruments: ['guitar/bass'],
      skills: ['chord-notes'],
      component: ChordDiagrams,
    },
    {
      id: 'dynamics',
      title: 'Dynamics',
      description: 'Check how well you control the loudness of notes.',
      input: 'MIDI',
      instruments: ['drum', 'guitar/bass', 'keyboard'],
      skills: ['constant-dynamics', '(de)crescendo', 'accents'],
      component: Dynamics,
    },
    {
      id: 'fretboard-heatmap',
      title: 'Fretboard Heatmap',
      description: 'See how often you play different fretboard positions.',
      input: 'MIDI',
      instruments: ['guitar/bass'],
      skills: ['instrument-layout'],
      component: FretboardHeatmap,
    },
    {
      id: 'fretboard-improvisation-intervals',
      title: 'Fretboard Improvisation Intervals',
      description:
        'Once you play a note, see where on the fretboard you can reach different intervals to the last played note.',
      input: 'MIDI',
      instruments: ['guitar/bass'],
      skills: ['instrument-layout', 'pitch-intervals'],
      component: FretboardImprovisationIntervals,
    },
    {
      id: 'fretboard-jitter',
      title: 'Fretboard Jitter',
      description: 'See how you play different fretboard positions over time.',
      input: 'MIDI',
      instruments: ['guitar/bass'],
      skills: ['instrument-layout'],
      component: FretboardJitter,
    },
    {
      id: 'fretboard-spacetmime-cube',
      title: 'Fretboard Spacetime Cube',
      description: 'See how you play different fretboard positions over time.',
      input: 'MIDI',
      instruments: ['guitar/bass'],
      skills: ['instrument-layout'],
      component: FretboardSpacetimeCube,
    },
    {
      id: 'improvisation-intervals',
      title: 'Improvisation Intervals',
      description:
        'See how often you use different intervals in improvisation.',
      input: 'MIDI',
      instruments: ['guitar/bass', 'keyboard'],
      skills: ['pitch-intervals'],
      component: ImprovisationIntervals,
    },
    {
      id: 'improvisation-note-colors',
      title: 'Improvisation Note Colors',
      description:
        'See how often you use different kinds of notes in improvisation.',
      input: 'MIDI',
      instruments: ['guitar/bass', 'keyboard'],
      skills: ['pitch-intervals', 'scale-degrees'],
      component: ImprovisationNoteColors,
    },
    {
      id: 'improvisation-scale-degrees',
      title: 'Improvisation Scale Degrees',
      description:
        'See how often you use different scale degrees in improvisation.',
      input: 'MIDI',
      instruments: ['guitar/bass', 'keyboard'],
      skills: ['pitch-intervals', 'scale-degrees'],
      component: ImprovisationScaleDegrees,
    },
    {
      id: 'improvisation-scale-degrees-bar',
      title: 'Improvisation Scale Degrees (Per Bar)',
      description:
        'See how often you use different scale degrees in improvisation, for each played bar.',
      input: 'MIDI',
      instruments: ['guitar/bass', 'keyboard'],
      skills: ['pitch-intervals', 'scale-degrees'],
      component: ImprovisationScaleDegreesBar,
    },
    {
      id: 'keyboard-histogram',
      title: 'Keyboard Histogram',
      description: 'See how often you play different keyboard keys.',
      input: 'MIDI',
      instruments: ['keyboard'],
      skills: ['instrument-layout'],
      component: KeyboardHistogram,
    },
    {
      id: 'pitch-bend',
      title: 'Pitch Bend',
      description: 'Practice different kinds of pitch bends.',
      input: 'MIDI',
      instruments: ['guitar/bass', 'keyboard'],
      skills: ['bending', 'vibrato'],
      component: PitchBend,
    },
    {
      id: 'pitch-bend-audio',
      title: 'Pitch Bend (Audio)',
      description: 'Practice different kinds of pitch bends.',
      input: 'audio',
      instruments: ['guitar/bass', 'keyboard', 'singing'],
      skills: ['bending', 'vibrato'],
      component: PitchBendAudio,
    },
    {
      id: 'pitch-offset-cents',
      title: '[new] Pitch Offset in Cents',
      description: 'See how well you are on pitch.',
      input: 'audio',
      instruments: ['guitar/bass', 'keyboard', 'singing'],
      skills: ['pitch-keeping', 'bending', 'vibrato'],
      component: PitchOffsetCents,
    },
    {
      id: 'rhythm-sheet-music',
      title: 'Rhythm Sheet Music',
      description:
        'This demo displays the notes you play as staff notation (𝅝, 𝅗𝅥, 𝅘𝅥, 𝅘𝅥𝅮, 𝅘𝅥𝅯) and offset in percent.',
      input: 'MIDI',
      instruments: ['drum', 'guitar/bass', 'keyboard', 'key'],
      skills: ['sub-division'],
      component: RhythmSheetMusic,
    },
    {
      id: 'speed-up',
      title: 'Speed-Up',
      description:
        'Record a short exercise at a slow tempo, then practice it with steadily increasing tempo.',
      input: 'MIDI',
      instruments: ['drum', 'guitar/bass', 'keyboard', 'key'],
      skills: ['sub-division', 'timing-consistency'],
      component: SpeedUp,
    },
    {
      id: 'speed-up-tab',
      title: ' Speed-Up Tab',
      description:
        'Record a short guitar exercise at a slow tempo, then practice it with steadily increasing tempo.',
      input: 'MIDI',
      instruments: ['guitar/bass'],
      skills: ['sub-division', 'timing-consistency'],
      component: SpeedUpTab,
    },
    {
      id: 'sub-division',
      title: 'Sub-Division',
      description: 'Learn rhythmic playing in different sub-divisions.',
      input: 'MIDI',
      instruments: ['drum', 'guitar/bass', 'keyboard', 'key'],
      skills: ['sub-division', 'timing-consistency'],
      component: SubDivision,
    },
    {
      id: 'sub-division-bar',
      title: 'Sub-Division (Per Bar)',
      description: 'Learn rhythmic playing in different sub-divisions.',
      input: 'MIDI',
      instruments: ['drum', 'guitar/bass', 'keyboard', 'key'],
      skills: ['sub-division', 'timing-consistency'],
      component: SubDivisionBar,
    },
    {
      id: 'sub-division-linear',
      title: 'Sub-Division (Linear)',
      description: 'Learn rhythmic playing in different sub-divisions.',
      input: 'MIDI',
      instruments: ['drum', 'guitar/bass', 'keyboard', 'key'],
      skills: ['sub-division', 'timing-consistency'],
      component: SubDivisionLinear,
    },
    {
      id: 'strumming-pattern',
      title: '[new] Strumming Pattern',
      description: 'Practice up/down strumming patterns.',
      input: 'MIDI',
      instruments: ['guitar/bass'],
      skills: ['strumming-direction'],
      component: StrummingPattern,
    },
    {
      id: 'tempo-drift',
      title: 'Tempo Drift',
      description: 'Keep your tempo constant over a longer stretch of playing.',
      input: 'MIDI',
      instruments: ['drum', 'guitar/bass', 'keyboard', 'key'],
      skills: ['tempo-keeping'],
      component: TempoDrift,
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
  // log data usage
  console.log('localStorage space', localStorageReport());
  console.log('usage data', localStorageGetUsageData());

  // tags
  const allInstruments = new Set(DEMOS.flatMap((d) => d.instruments).sort());
  const allInputs = new Set(DEMOS.flatMap((d) => d.input).sort());
  const allSkills = new Set(DEMOS.flatMap((d) => d.skills).sort());
  // filter
  let currentInstruments = new Set(allInstruments);
  let currentInputs = new Set(allInputs);
  let currentSkills = new Set(allSkills);
  // search
  let currentSearch = '';
  // apply filter
  $: filteredDemos = DEMOS.filter(
    (d) =>
      d.title.toLowerCase().includes(currentSearch) &&
      setHasAny(currentInstruments, d.instruments) &&
      setHasAny(currentSkills, d.skills) &&
      currentInputs.has(d.input),
  );

  // allow to reset current tool with tools button
  let currentTool = null;
</script>

<main>
  <header>
    <h1>Data-Driven Music Education Demos</h1>
    <!-- back button -->
    <button
      on:click="{() => {
        currentDemo = null;
        setUrlParam(window, 'd', '');
      }}"
    >
      ☰ demos
    </button>
    <!-- Tools page button -->
    <button
      on:click="{() => {
        currentDemo = 'tools';
        currentTool = null;
        setUrlParam(window, 'd', 'tools');
      }}"
    >
      🛠️ tools
    </button>
    <!-- Settings page button -->
    <button
      on:click="{() => {
        currentDemo = 'settings';
        setUrlParam(window, 'd', 'settings');
      }}"
    >
      ⚙️ settings
    </button>
  </header>

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

    <div class="grid-filter-demo">
      <!-- filter -->
      <div class="filter">
        <!-- search -->
        <div>
          <input
            class="search-box"
            type="search"
            placeholder="search by title"
            bind:value="{currentSearch}"
          />
        </div>
        <SkillTree bind:currentSkills {allSkills} />
        <!-- task, instrument, input filters -->
        <div>
          <h2>instrument</h2>
          <button
            on:click="{() => {
              currentInstruments = new Set(allInstruments);
            }}"
          >
            show all
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
        <div>
          <h2>input</h2>
          <button
            on:click="{() => {
              currentInputs = new Set(allInputs);
            }}"
          >
            show all
          </button>
          {#each allInputs.values() as d}
            <button
              on:click="{() => (currentInputs = updSet(currentInputs, d))}"
              on:dblclick="{() => (currentInputs = new Set([d]))}"
              class="{currentInputs.has(d) ? 'active' : 'hidden'}"
            >
              {d}
            </button>
          {/each}
        </div>
      </div>

      <!-- demo overview grid -->
      <div class="grid">
        {#each filteredDemos as demo}
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
              <!-- input -->
              {demo.input === 'audio' ? audioIcon : ''}
              {demo.input === 'MIDI' ? midiIcon : ''}
              <!-- instrument -->
              {demo.instruments.includes('guitar/bass') ? '🎸' : ''}
              {demo.instruments.includes('drum') ? '🥁' : ''}
              {demo.instruments.includes('keyboard') ? '🎹' : ''}
              {demo.instruments.includes('wind') ? '🪈' : ''}
              {demo.instruments.includes('singing') ? '🎤' : ''}
              {demo.instruments.includes('strings') ? '🎻' : ''}
              {demo.instruments.includes('key') ? '⌨️' : ''}
            </div>
          </div>
        {/each}
      </div>
    </div>
    <!-- export usage button -->
    <button
      title="Export usage statistics"
      on:click="{() => {
        const usage = localStorage.getItem('usage');
        const blob = new Blob([usage], {
          type: 'text/plain;charset=utf-8',
        });
        saveAs(blob, 'usage.json');
      }}"
    >
      💾 export usage
    </button>
  {:else if currentDemo === 'tools'}
    <Tools bind:currentTool />
  {:else if currentDemo === 'settings'}
    <Settings />
  {:else}
    <!-- show demo by importing dynamically -->
    <svelte:component this="{currentDemo.component}" demoInfo="{currentDemo}" />
  {/if}
  <DemoOverview demos="{DEMOS}" {allInstruments} />
</main>

<style>
  .grid-filter-demo {
    display: grid;
    grid-template-columns: 210px 1040px;
  }

  .filter {
    padding-top: 20px;
    text-align: left;
  }

  .filter .search-box {
    width: 180px;
  }

  .filter button {
    display: block;
  }

  .filter button.active {
    background-color: rgb(218, 236, 251);
  }

  .card .tags {
    font-size: 18px;
  }
</style>
