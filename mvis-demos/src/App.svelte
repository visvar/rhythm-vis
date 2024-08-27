<script>
  import { version } from '../package.json';
  import { getUrlParam, setUrlParam } from './lib/url';
  import { getNumberOfDaysPassed, setHasAny, updSet } from './lib/lib';
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

  let currentApp = null;

  // handle URL parameters
  const param = getUrlParam(window, 'd');
  if (param && param !== '') {
    currentApp = APPS.filter((d) => d.id === param)[0];
  }

  // access protection (not secure of course)
  let corrP = 'rhyvis';
  let password = localStorage.getItem('pwd') ?? '';
  $: {
    localStorage.setItem('pwd', password);
  }

  // allow to go back to main page with history
  window.onpopstate = (e) => {
    if (currentApp !== null) {
      currentApp = null;
    }
  };

  // warn user to not quit window before leaving demo
  window.onbeforeunload = function () {
    if (
      currentApp &&
      !['tools', 'settings', 'overview', 'help'].includes(currentApp)
    ) {
      // alert('Please go back to the main page first to prevent data loss');
      return true;
    }
  };

  // track how often and when each demo is used
  let appUsageCount = new Map();
  let appUsageRecent = new Map();
  $: {
    let usage;
    if (localStorage.getItem('usage') !== null) {
      usage = localStorage.getItem('usage');
      usage = JSON.parse(usage);
    } else {
      usage = {
        demoClicks: {},
      };
    }
    const appClicks = usage.demoClicks;
    if (currentApp) {
      const thisAppUsage = appClicks[currentApp.id] ?? [];
      thisAppUsage.push(new Date().toISOString());
      appClicks[currentApp.id] = thisAppUsage;
      localStorage.setItem('usage', JSON.stringify(usage));
    } else {
      appUsageCount = new Map(
        APPS.map((d) => [d.id, appClicks[d.id]?.length ?? 0]),
      );
      appUsageRecent = new Map(
        APPS.map((d) => {
          const lastTime = appClicks[d.id]?.at(-1);
          return [d.id, lastTime ? lastTime : 'never'];
        }),
      );
    }
  }
  // log data usage
  // console.log('localStorage space', localStorageReport());
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
  $: filteredApps = APPS.filter(
    (d) =>
      d.title.toLowerCase().includes(currentSearch) &&
      setHasAny(currentInstruments, d.instruments) &&
      setHasAny(currentSkills, d.skills) &&
      currentInputs.has(d.input),
  );
  // apply sorting
  let sortAppsBy = 'title';
  $: sortedApps = filteredApps.sort((a, b) => {
    if (sortAppsBy === 'title') {
      return a.title < b.title ? -1 : 1;
    }
    if (sortAppsBy === 'used') {
      return appUsageCount.get(b.id) - appUsageCount.get(a.id);
    }
    if (sortAppsBy === 'recent') {
      const recentA = appUsageRecent.get(a.id);
      const recentB = appUsageRecent.get(b.id);
      if (recentA === 'never') {
        return 1;
      }
      if (recentB === 'never') {
        return -1;
      }
      return recentA > recentB ? -1 : 1;
    }
  });

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
          currentApp = null;
          setUrlParam(window, 'd', '');
        }}"
      >
        ☰ apps
      </button>
      <!-- Tools page button -->
      <button
        on:click="{() => {
          currentApp = 'tools';
          currentTool = null;
          setUrlParam(window, 'd', 'tools');
        }}"
      >
        🛠️ tools
      </button>
      <!-- Settings page button -->
      <button
        on:click="{() => {
          currentApp = 'settings';
          setUrlParam(window, 'd', 'settings');
        }}"
      >
        ⚙️ settings
      </button>
      <!-- DemoOverview page button -->
      <button
        on:click="{() => {
          currentApp = 'overview';
          setUrlParam(window, 'd', 'overview');
        }}"
      >
        📋 overview
      </button>
      <!-- Help page button -->
      <button
        on:click="{() => {
          currentApp = 'help';
          setUrlParam(window, 'd', 'help');
        }}"
      >
        ❓help
      </button>
    </nav>
  </header>

  {#if password !== corrP}
    <input type="password" placeholder="password" bind:value="{password}" />
  {:else if !currentApp}
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
        <!-- sort -->
        <div>
          <h2>sort by</h2>
          <select bind:value="{sortAppsBy}">
            <option value="title">title (A-Z)</option>
            <option value="used">most used</option>
            <option value="recent">recently used</option>
          </select>
        </div>
        <!-- skill filter -->
        <SkillTree bind:currentSkills {allSkills} />
        <!-- instrument filters -->
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
        <!-- input type filter -->
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

      <!-- app overview grid -->
      <div class="grid">
        <!-- current filters -->
        {#if currentSkills.size === 1 || currentInstruments.size < allInstruments.size || currentInputs.size < allInputs.size}
          <div class="current-filters">
            current filters:
            {#if currentSkills.size === 1}
              <button
                title="remove this filter"
                on:click="{() => {
                  currentSkills = new Set(allSkills);
                }}"
              >
                skill: {[...currentSkills]} &times;
              </button>
            {/if}
            {#if currentInstruments.size < allInstruments.size}
              <button
                title="remove this filter"
                on:click="{() => {
                  currentInstruments = new Set(allInstruments);
                }}"
              >
                {currentInstruments.size} instruments &times;
              </button>
            {/if}
            {#if currentInputs.size < allInputs.size}
              <button
                title="remove this filter"
                on:click="{() => {
                  currentInputs = new Set(allInputs);
                }}"
              >
                input: {[...currentInputs]} &times;
              </button>
            {/if}
          </div>
        {/if}
        {#each sortedApps as app}
          <!-- svelte-ignore a11y-click-events-have-key-events -->
          <!-- svelte-ignore a11y-no-static-element-interactions -->
          <div
            class="card {appUsageCount.get(app.id) ? '' : 'never-used'}"
            on:click="{() => {
              currentApp = app;
              setUrlParam(window, 'd', app.id);
            }}"
          >
            <h2>{app.title}</h2>
            <div class="description">
              {app.description}
            </div>
            <div class="usage">
              {#if appUsageCount.get(app.id) > 0}
                Used {appUsageCount.get(app.id)} times.
              {/if}
              {#if appUsageCount.get(app.id) > 0}
                Last used {getNumberOfDaysPassed(
                  new Date(appUsageRecent.get(app.id)),
                )}.
              {/if}
            </div>
            <div class="tags">
              <!-- input -->
              {app.input === 'audio' ? audioIcon : ''}
              {app.input === 'MIDI' ? midiIcon : ''}
              <!-- instrument -->
              {app.instruments.includes('guitar/bass') ? '🎸' : ''}
              {app.instruments.includes('drum') ? '🥁' : ''}
              {app.instruments.includes('keyboard') ? '🎹' : ''}
              {app.instruments.includes('wind') ? '🪈' : ''}
              {app.instruments.includes('singing') ? '🎤' : ''}
              {app.instruments.includes('strings') ? '🎻' : ''}
              {app.instruments.includes('pc-key') ? '⌨️' : ''}
              {app.instruments.includes('touch') ? '👇' : ''}
            </div>
          </div>
        {/each}
      </div>
    </div>
  {:else if currentApp === 'tools'}
    <Tools bind:currentTool />
  {:else if currentApp === 'settings'}
    <Settings />
  {:else if currentApp === 'overview'}
    <DemoOverview apps="{APPS}" {allInstruments} {allData} {allPatterns} />
  {:else if currentApp === 'help'}
    <Help />
  {:else}
    <!-- show demo by importing dynamically -->
    <svelte:component this="{currentApp.component}" demoInfo="{currentApp}" />
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
    currentApp = null;
    setUrlParam(window, 'd', '');
  }}"
/>
<!-- shortcut for search -->
<PcKeyboardInput
  key="f"
  ctrlKey
  keyDown="{() => {
    if (!currentApp) {
      document.querySelector('.search-box').focus();
    }
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

  .current-filters {
    grid-column: span 3;
  }

  .card .tags {
    font-size: 18px;
  }

  .version-number {
    margin-top: 30px;
    color: #aaa;
    user-select: none;
  }
</style>
