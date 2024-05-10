<script>
  import { getUrlParam, setUrlParam } from './lib/url';
  // demos
  import SubDivision from './demos/sub-division.svelte';
  import TempoDrift from './demos/tempo-drift.svelte';
  import Dynamics from './demos/dynamics.svelte';
  import ImprovisationIntervals from './demos/improvisation-intervals.svelte';
  import Tools from './tools/_tools.svelte';
  import ImprovisationScaleDegrees from './demos/improvisation-scale-degrees.svelte';

  /**
   * All demos defined here
   * TODO: add tags for filtering, eg instrument and task?
   */
  const DEMOS = [
    {
      id: 'sub-division',
      title: 'Sub-Division',
      description: 'Learn rhythmic playing in different sub-divisions',
      task: 'timing',
      input: 'MIDI',
      instruments: ['drum', 'guitar/bass', 'keyboard'],
      component: SubDivision,
    },
    {
      id: 'tempo-drift',
      title: 'Tempo Drift',
      description: 'Keep your tempo constant over a longer stretch of playing',
      task: 'timing',
      input: 'MIDI',
      instruments: ['drum', 'guitar/bass', 'keyboard'],
      component: TempoDrift,
    },
    {
      id: 'dynamics',
      title: 'Dynamics',
      description: 'Check how well you control the loudness of notes',
      tags: ['task:dynamics', 'input:MIDI', 'encoding:bars'],
      task: 'dynamics',
      input: 'MIDI',
      instruments: ['drum', 'guitar/bass', 'keyboard'],
      component: Dynamics,
    },
    {
      id: 'improvisation-intervals',
      title: 'Improvisation Intervals',
      description: 'See how often you use different intervals in improvisation',
      task: 'pitch',
      input: 'MIDI',
      instruments: ['drum', 'guitar/bass', 'keyboard'],
      component: ImprovisationIntervals,
    },
    {
      id: 'improvisation-scale-degrees',
      title: 'Improvisation Scale Degrees',
      description:
        'See how often you use different scale degrees in improvisation',
      task: 'pitch',
      input: 'MIDI',
      instruments: ['drum', 'guitar/bass', 'keyboard'],
      component: ImprovisationScaleDegrees,
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

  // tags
  const allTasks = new Set(DEMOS.flatMap((d) => d.task).sort());
  const allInstruments = new Set(DEMOS.flatMap((d) => d.task).sort());
  // filter
  let currentTasks = new Set(...allTasks);
  let currentInstruments = new Set(...allInstruments);

  const updSet = (set, item) => {
    if (set.has(item)) {
      set.delete(item);
    } else {
      set.add(item);
    }
    set = new Set(set);
  };
</script>

<main>
  <h1>Data-Driven Music Education Demos</h1>

  {#if password !== corrP}
    <input type="password" placeholder="password" bind:value="{password}" />
  {:else if !currentDemo}
    <p class="explanation">
      This page contains a collection of small tools (demos) that are each
      tailored to a specific musical skill and sometimes also specific kind of
      musical data.
    </p>

    <div>
      <label>
        task
        {#each allTasks.values() as d}
          <button on:click="{() => updSet(currentTasks, d)}">
            {d}
          </button>
        {/each}
      </label>
    </div>

    <!-- demo overview grid -->
    <div class="grid">
      {#each DEMOS as demo}
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
          {demo.description}
        </div>
      {/each}
    </div>
    <!-- Tools page button -->
    <button
      on:click="{() => {
        currentDemo = 'tools';
        setUrlParam(window, 'd', 'tools');
      }}"
    >
      Tools
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
      <!-- <svelte:component this="{currentDemo.component}" someprop="{42}" /> -->
      <svelte:component this="{currentDemo.component}" />
    {/if}
  {/if}
</main>

<style>
</style>
