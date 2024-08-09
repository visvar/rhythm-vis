<script>
  import { version } from '../package.json';
  import { getUrlParam, setUrlParam } from './lib/url';
  import { setHasAny, updSet } from './lib/lib';
  import {
    localStorageGetUsageData,
    localStorageReport,
  } from './lib/localstorage';
  import { audioIcon, midiIcon } from './lib/icons';
  import * as d3 from 'd3';
  import { SKILL_TREE_LEAFS } from './lib/skills';
  // side bar for skill filtering
  import SkillTree from './SkillTree.svelte';
  // tools etc
  import Tools from './tools/_tools.svelte';
  import Settings from './Settings.svelte';
  import DemoOverview from './DemoOverview.svelte';
  // APPS
  import { APPS } from './apps';
  import Help from './Help.svelte';
  import PcKeyboardInput from './demos/common/pc-keyboard-input.svelte';

  let currentDemo = null;

  // handle URL parameters
  const param = getUrlParam(window, 'd');
  if (param && param !== '') {
    currentDemo = APPS.filter((d) => d.id === param)[0];
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
      !['tools', 'settings', 'overview', 'help'].includes(currentDemo)
    ) {
      // alert('Please go back to the main page first to prevent data loss');
      return true;
    }
  };

  // track how often and when each demo is used
  $: {
    if (currentDemo) {
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
  const allInputs = new Set(APPS.flatMap((d) => d.input).sort());
  const allInstruments = new Set(APPS.flatMap((d) => d.instruments).sort());
  const allData = new Set(APPS.flatMap((d) => d.data));
  const allSkills = new Set(APPS.flatMap((d) => d.skills).sort());
  const allPatterns = new Set(APPS.flatMap((d) => d.patterns).sort());
  // filter
  let currentInstruments = new Set(allInstruments);
  let currentInputs = new Set(allInputs);
  let currentSkills = new Set(allSkills);
  // search
  let currentSearch = '';
  // apply filter
  $: filteredAPPS = APPS.filter(
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
    <h1>Music Instrument Learning Apps</h1>
    <nav>
      <!-- main page button -->
      <button
        on:click="{() => {
          currentDemo = null;
          setUrlParam(window, 'd', '');
        }}"
      >
        ☰ apps
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
      <!-- DemoOverview page button -->
      <button
        on:click="{() => {
          currentDemo = 'overview';
          setUrlParam(window, 'd', 'overview');
        }}"
      >
        📋 overview
      </button>
      <!-- Help page button -->
      <button
        on:click="{() => {
          currentDemo = 'help';
          setUrlParam(window, 'd', 'help');
        }}"
      >
        ❓help
      </button>
    </nav>
  </header>

  {#if password !== corrP}
    <input type="password" placeholder="password" bind:value="{password}" />
  {:else if !currentDemo}
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
      </div>

      <!-- demo overview grid -->
      <div class="grid">
        {#each filteredAPPS as demo}
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
              {demo.instruments.includes('touch') ? '👇' : ''}
            </div>
          </div>
        {/each}
      </div>
    </div>
  {:else if currentDemo === 'tools'}
    <Tools bind:currentTool />
  {:else if currentDemo === 'settings'}
    <Settings />
  {:else if currentDemo === 'overview'}
    <DemoOverview apps="{APPS}" {allInstruments} {allData} {allPatterns} />
  {:else if currentDemo === 'help'}
    <Help />
  {:else}
    <!-- show demo by importing dynamically -->
    <svelte:component this="{currentDemo.component}" demoInfo="{currentDemo}" />
  {/if}
  <div class="version-number">
    version {version}
  </div>
</main>
<!-- shortcut for app menu -->
<PcKeyboardInput
  key="a"
  ctrlKey
  keyDown="{() => {
    currentDemo = null;
    setUrlParam(window, 'd', '');
  }}"
/>
<!-- shortcut for search -->
<PcKeyboardInput
  key="f"
  ctrlKey
  keyDown="{() => {
    document.querySelector('.search-box').focus();
  }}"
/>

<style>
  .grid-filter-demo {
    display: grid;
    grid-template-columns: 210px auto;
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

  .version-number {
    margin-top: 30px;
    color: #aaa;
  }
</style>
