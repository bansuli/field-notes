import { defineConfig } from 'vite';
import { resolve } from 'node:path';

/* Multi-page build.
   Vite only builds the pages listed here, which is also how the site decides
   what is public. Everything else in the folder -- the index-before-*.html
   snapshots, the *.bak files, index-experiment.html, backup-flipbook.html and
   the country pages that are not finished yet -- stays in the project and
   never ships.

   Images work the same way: only the ones these pages actually reference are
   copied into dist/, so the 49MB of unused shots in images/entrance and the
   originals in images/_originals are left behind. */
export default defineConfig({
  appType: 'mpa',
  build: {
    rollupOptions: {
      input: {
        home:             resolve(__dirname, 'index.html'),
        costaRicaStays:   resolve(__dirname, 'countries/costa-rica-stays.html'),
        puertoRicoStays:  resolve(__dirname, 'countries/puerto-rico-stays.html'),
        brazil:           resolve(__dirname, 'countries/brazil.html'),
        bali:             resolve(__dirname, 'countries/bali.html')
      }
    },
    /* the hero and the stays photos are big; don't warn on every one */
    assetsInlineLimit: 0,
    chunkSizeWarningLimit: 1500
  }
});
