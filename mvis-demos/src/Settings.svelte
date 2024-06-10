<script>
    import { SETTINGS_KEY } from './lib/localstorage';
    let settings = JSON.parse(localStorage.getItem(SETTINGS_KEY) ?? '{}');

    const updateSetting = (key, value) => {
        settings[key] = value;
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
        console.log(localStorage.getItem(SETTINGS_KEY));
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
                updateSetting('guitarMidiMinVelocity', e.target.value)}"
        />
    </label>
    <label>
        Minimum duration (seconds)
        <input
            type="number"
            min="0"
            max="127"
            value="{settings.guitarMidiMinDuration ?? 0}"
            on:change="{(e) =>
                updateSetting('guitarMidiMinDuration', e.target.value)}"
        />
    </label>
</main>
