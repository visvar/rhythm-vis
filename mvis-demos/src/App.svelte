<script>
  import { getUrlParam, setUrlParam } from './lib/url';
  // demos
  import SubDivision from './demos/sub-division.svelte';
  import TempoDrift from './demos/tempo-drift.svelte';
  import Dynamics from './demos/dynamics.svelte';

  const DEMOS = [
    {
      id: 'sub-division',
      title: 'Sub-Division',
      description: 'Learn rhythmic playing in different sub-divisions',
      component: SubDivision,
    },
    {
      id: 'tempo-drift',
      title: 'Tempo Drift',
      description: 'Keep your tempo constant over a longer stretch of playing',
      component: TempoDrift,
    },
    {
      id: 'dynamics',
      title: 'Dynamics',
      description: 'Check how well you control the loudness of notes',
      component: Dynamics,
    },
  ];
  let currentDemo = null;
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
    <!-- show demo by importing dynamically -->
    {#if currentDemo}
      <!-- <svelte:component this="{currentDemo.component}" someprop="{42}" /> -->
      <svelte:component this="{currentDemo.component}" />
    {/if}
  {/if}
</main>

<style>
  div.grid {
    margin-top: 20px;
    display: grid;
    grid-template-columns: repeat(3, auto);
    gap: 20px;
  }

  div.card {
    width: 256px;
    background-color: #fefefe;
    border: 1px solid #ddd;
    border-radius: 12px;
    box-shadow: #ccc 0 0 8px;
    cursor: pointer;
    transition: all 250ms;
  }

  div.card:hover {
    box-shadow: steelblue 0 0 8px;
  }

  div.card h2 {
    margin-top: 0;
  }
</style>
