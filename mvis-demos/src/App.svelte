<script>
  import { getUrlParam, setUrlParam } from './lib/url';
  // demos
  import LiveSubDivision from './demos/live-subdivision/live-subd.svelte';
  import LiveSubDivisionIcon from './demos/live-subdivision/icon.png';

  const DEMOS = [
    {
      id: 'live-subdivision',
      title: 'Live Sub-Division',
      description:
        'Learn rhythmic playing in different sub-divisions in real-time',
      component: LiveSubDivision,
      icon: LiveSubDivisionIcon,
    },
  ];
  // let currentDemo = null;
  // let currentDemo = DEMOS[0];
  let currentDemo = null;
  const param = getUrlParam(window, 'd');
  console.log({ param });
  if (param && param !== '') {
    currentDemo = DEMOS.filter((d) => d.id === param)[0];
  }

  // access protection (not secure of course)
  let corrP = 'rhyvis';
  let password = localStorage.getItem('pwd') ?? '';
  $: {
    localStorage.setItem('pwd', password);
  }
</script>

<main>
  <h1>Data-Driven Music Education Demos</h1>

  {#if password !== corrP}
    <input type="password" placeholder="password" bind:value="{password}" />
  {:else if !currentDemo}
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
    display: grid;
  }

  div.card {
    width: 320px;
    background-color: #fefefe;
    border: 1px solid #ddd;
    border-radius: 12px;
    box-shadow: #ccc 0 0 8px;
    cursor: pointer;
  }

  div.card:hover {
    box-shadow: steelblue 0 0 8px;
  }

  div.card h2 {
    margin-top: 0;
  }
</style>
