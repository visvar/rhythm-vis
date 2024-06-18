<script>
  import { getUrlParam, setUrlParam } from './lib/url';
  import { setHasAny, updSet } from './lib/lib';
  import {
    localStorageGetUsageData,
    localStorageReport,
  } from './lib/localstorage';
  import { audioIcon, midiIcon } from './lib/icons';
  import saveAs from 'file-saver';
  import * as d3 from 'd3';
  import { SKILL_TREE_LEAFS } from './lib/skills';
  // side bar for skill filtering
  import SkillTree from './SkillTree.svelte';
  // tools etc
  import Tools from './tools/_tools.svelte';
  import Settings from './Settings.svelte';
  import DemoOverview from './DemoOverview.svelte';
  // demos
  import { DEMOS } from './demos';

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

  // warn user to not quit window before leaving demo
  window.onbeforeunload = function () {
    if (
      currentDemo &&
      !['tools', 'settings', 'overview'].includes(currentDemo)
    ) {
      return 'Please go back to the main page first to prevent data loss';
    }
  };

  // track how often and when each demo is used
  $: {
    if (
      currentDemo &&
      !['tools', 'settings', 'overview'].includes(currentDemo)
    ) {
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

  // check if skills are missing/extra
  const skillTreeSkills = new Set(SKILL_TREE_LEAFS.map((d) => d.id));
  console.log({
    extraSkills: [...d3.difference(allSkills, skillTreeSkills)],
    missingSkills: [...d3.difference(skillTreeSkills, allSkills)],
  });
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
    <!-- DemoOverview page button -->
    <button
      on:click="{() => {
        currentDemo = 'overview';
        setUrlParam(window, 'd', 'overview');
      }}"
    >
      📋 overview
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
      musical data. You can filter demos by different aspects with the sidebar
      on the left.
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
              title="click to toggle, double-click to only show this"
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
              title="click to toggle, double-click to only show this"
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
              {demo.instruments.includes('pc-key') ? '⌨️' : ''}
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
  {:else if currentDemo === 'overview'}
    <DemoOverview demos="{DEMOS}" {allInstruments} />
  {:else}
    <!-- show demo by importing dynamically -->
    <svelte:component this="{currentDemo.component}" demoInfo="{currentDemo}" />
  {/if}
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
