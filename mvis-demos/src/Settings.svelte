<script>
    import saveAs from 'file-saver';
    import { SETTINGS_KEY } from './lib/localstorage';
    let settings = JSON.parse(localStorage.getItem(SETTINGS_KEY) ?? '{}');

    const updateSetting = (key, value) => {
        settings[key] = value;
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    };
</script>

<main>
    <h2>Settings</h2>

    <h3>Guitar MIDI</h3>
    <p>These settings allow reducing noise from MIDI guitars.</p>
    <label>
        Minimum velocity (0-127)
        <input
            type="number"
            min="0"
            max="127"
            value="{settings.guitarMidiMinVelocity ?? 0}"
            on:change="{(e) =>
                updateSetting('guitarMidiMinVelocity', +e.target.value)}"
        />
    </label>
    <label>
        Minimum duration (seconds)
        <input
            type="number"
            min="0"
            max="0.5"
            step="0.05"
            value="{settings.guitarMidiMinDuration ?? 0}"
            on:change="{(e) =>
                updateSetting('guitarMidiMinDuration', +e.target.value)}"
        />
    </label>

    <h3>Usage Data</h3>
    <p>
        The website tracks usage data locally in your browser, but does not send
        it anywhere. You can export or reset it here.
    </p>
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
    <button
        title="Reset usage statistics"
        on:click="{() => {
            if (
                confirm(
                    'Please only do this after exporting usage data! Do you really want to delete now?',
                )
            ) {
                localStorage.removeItem('usage');
            }
        }}"
    >
        🚮 delete usage
    </button>
</main>

<style>
    label {
        display: block;
        margin: 10px;
    }
</style>
