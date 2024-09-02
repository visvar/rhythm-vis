<script>
  import { version } from '../package.json';
  import { getUrlParam, setUrlParam } from './lib/url';
  import { getNumberOfDaysPassed, setHasAny, updSet } from './lib/lib';
  import { localStorageGetUsageData } from './lib/localstorage';
  import { audioIcon, midiIcon } from './lib/icons';
  import * as d3 from 'd3';
  import { SKILL_TREE_LEAFS } from './lib/skills';
  // side bar for skill filtering
  import SkillTree from './SkillTree.svelte';
  // tools etc
  import Tools from './tools/_tools.svelte';
  import Settings from './Settings.svelte';
  import Overview from './Overview.svelte';
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
  const allDifficulties = new Set(APPS.flatMap((d) => d.difficulty).sort());
  const allPatterns = new Set(APPS.flatMap((d) => d.patterns).sort());
  // filter
  let currentInstruments = new Set(allInstruments);
  let currentInputs = new Set(allInputs);
  let currentSkills = new Set(allSkills);
  let currentDifficulties = new Set(allDifficulties);
  // search
  let currentSearch = '';
  // apply filter
  $: filteredApps = APPS.filter(
    (d) =>
      d.title.toLowerCase().includes(currentSearch) &&
      setHasAny(currentInstruments, d.instruments) &&
      setHasAny(currentSkills, d.skills) &&
      setHasAny(currentDifficulties, d.difficulty) &&
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

  // row layout?
  let rows = localStorage.getItem('display-app-rows') === 'true' ?? true;
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
          <h2>sorting and layout</h2>
          <select bind:value="{sortAppsBy}">
            <option value="title">title (A-Z)</option>
            <option value="used">most used</option>
            <option value="recent">recently used</option>
          </select>
          <!-- layout -->
          <button
            on:click="{() => {
              rows = !rows;
              localStorage.setItem('display-app-rows', rows.toString());
            }}"
            class="row-button"
          >
            {rows ? '☰ rows' : '᎒᎒᎒ grid'}
          </button>
        </div>
        <!-- skill filter -->
        <SkillTree bind:currentSkills />
        <!-- instrument filters -->
        <div>
          <h2>instrument</h2>
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
        <!-- instrument filters -->
        <div>
          <h2>difficulty</h2>
          {#each ['beginner', 'intermediate', 'advanced'] as d}
            <button
              on:click="{() =>
                (currentDifficulties = updSet(currentDifficulties, d))}"
              on:dblclick="{() => (currentDifficulties = new Set([d]))}"
              class="{currentDifficulties.has(d) ? 'active' : 'hidden'}"
              title="click to toggle, double-click to only show this"
            >
              {d}
            </button>
          {/each}
        </div>
        <!-- input type filter -->
        <div>
          <h2>input</h2>
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
      <div class="grid {rows ? 'rows' : ''}">
        <!-- current filters -->
        {#if currentSearch !== '' || currentSkills.size === 1 || currentInstruments.size < allInstruments.size || currentDifficulties.size < allDifficulties.size || currentInputs.size < allInputs.size}
          <div class="current-filters">
            current filters:
            {#if currentSearch !== ''}
              <button
                title="click to remove this filter"
                on:click="{() => {
                  currentSearch = '';
                }}"
              >
                search: {currentSearch} &times;
              </button>
            {/if}
            {#if currentSkills.size === 1}
              <button
                title="click to remove this filter"
                on:click="{() => {
                  currentSkills = new Set(allSkills);
                }}"
              >
                skill: {[...currentSkills]} &times;
              </button>
            {/if}
            {#if currentInstruments.size < allInstruments.size}
              <button
                title="click to remove this filter"
                on:click="{() => {
                  currentInstruments = new Set(allInstruments);
                }}"
              >
                {currentInstruments.size} instruments &times;
              </button>
            {/if}
            {#if currentDifficulties.size < allDifficulties.size}
              <button
                title="click to remove this filter"
                on:click="{() => {
                  currentDifficulties = new Set(allDifficulties);
                }}"
              >
                difficulty: {[...currentDifficulties]} &times;
              </button>
            {/if}
            {#if currentInputs.size < allInputs.size}
              <button
                title="click to remove this filter"
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
            class="card"
            on:click="{() => {
              currentApp = app;
              setUrlParam(window, 'd', app.id);
            }}"
          >
            <h2>{app.title}{appUsageCount.get(app.id) ? '' : ' ✨'}</h2>
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
    <Tools bind:currentTool {rows} />
  {:else if currentApp === 'settings'}
    <Settings />
  {:else if currentApp === 'overview'}
    <Overview apps="{APPS}" {allInstruments} {allData} {allPatterns} />
  {:else if currentApp === 'help'}
    <Help />
  {:else}
    <!-- show demo by importing dynamically -->
    <svelte:component this="{currentApp.component}" demoInfo="{currentApp}" />
  {/if}
  <div class="version-number">
    <span> </span>
    <!-- DemoOverview page button -->
    <button
      on:click="{() => {
        currentApp = 'overview';
        setUrlParam(window, 'd', 'overview');
      }}"
      style="background: none; color: #aaa; font-weight: normal"
    >
      version {version} | overview
    </button>
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
    margin-left: 20px;
    display: grid;
    grid-template-columns: 210px auto;
  }

  .filter {
    padding-top: 20px;
    text-align: left;
  }

  .filter input,
  .filter select,
  .filter .row-button {
    width: 180px;
  }

  .filter .row-button {
    height: 40px;
  }

  .filter select {
    text-align: center;
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
    margin-top: 50px;
    color: #aaa;
    user-select: none;
  }
</style>
