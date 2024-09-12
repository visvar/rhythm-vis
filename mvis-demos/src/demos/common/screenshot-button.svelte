<script>
    /**
     * allows taking a screenshot consistently
     */
    import html2canvas from 'html2canvas';
    import saveAs from 'file-saver';
    import { APPS } from '../../apps';
    import { delay } from '../../lib/lib';

    /**
     * @type {string|object}
     */
    export let currentApp;

    const shoot = async () => {
        try {
            // load example
            const exampleBtn = [...document.querySelectorAll('button')].filter(
                (d) => d.innerText === 'example',
            );
            if (exampleBtn.length > 0) {
                exampleBtn[0].click();
            }
            // either take the app or the whole document
            const appMain = document.querySelectorAll('.app')[0];
            const targetElement = appMain ?? document.body;
            html2canvas(targetElement).then((canvas) => {
                // save
                canvas.toBlob((blob) => {
                    saveAs(blob, `${currentApp?.id ?? 'shot'}.png`);
                });
            });
        } catch (e) {
            alert(e.message);
        }
    };

    const shootAll = async () => {
        for (const app of APPS) {
            console.log(app.id);
            if (app.id === 'fretboard-spacetime-cube') {
                continue;
            }

            currentApp = app;
            await delay(0.2);
            // load example
            const exampleBtn = [...document.querySelectorAll('button')].filter(
                (d) => d.innerText === 'example',
            );
            if (exampleBtn.length > 0) {
                exampleBtn[0].click();
            }
            await delay(0.1);
            // either take the app or the whole document
            const appMain = document.querySelectorAll('.app')[0];
            const targetElement = appMain ?? document.body;
            html2canvas(targetElement).then((canvas) => {
                // save
                canvas.toBlob((blob) => {
                    saveAs(blob, `${app.id ?? 'shot'}.png`);
                });
            });
        }
    };
</script>

<button on:click="{shoot}"> shoot </button>
<button on:click="{shootAll}"> shoot all </button>
