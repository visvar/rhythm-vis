<script>
    /**
     * allows taking a screenshot consistently
     *
     * uses https://github.com/ondras/browsershot
     *
     * TODO: fork library to avoid having the share dialog in the image
     */
    import * as bs from 'browsershot';
    import saveAs from 'file-saver';
    import { delay } from '../../lib/lib';

    export let currentApp = '';

    const shoot = async () => {
        try {
            // load example
            const exampleBtn = [...document.querySelectorAll('button')].filter(
                (d) => d.innerText === 'example',
            );
            if (exampleBtn.length > 0) {
                exampleBtn[0].click();
            }

            await delay(0.5);

            let canvas = await bs.toCanvas();

            // download image
            canvas.toBlob((blob) => {
                saveAs(blob, `${currentApp}.png`);
            });
        } catch (e) {
            alert(e.message);
        }
    };
</script>

<button on:click="{shoot}"> shoot </button>
