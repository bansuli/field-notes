/* Re-encode the images the live pages actually use.
   Rerun after dropping new photos in: npm run optimize

   Only the files listed in TARGETS are touched; everything else in images/
   (the originals, the flipbook, the unused entrance shots) is left alone,
   since the build never ships it anyway.

   Originals live in git -- `git checkout <commit> -- images/` brings any of
   them back if a size or quality here turns out too aggressive. */
import sharp from 'sharp';
import { readdir, stat, rename } from 'node:fs/promises';
import { join, dirname } from 'node:path';

const QUALITY = 78;

/* maxWidth is the widest the browser ever paints the image, doubled for
   retina. Anything above that is bytes nobody sees. */
const TARGETS = [
  /* full-bleed hero behind the title */
  { file: 'images/DSC_3332.jpg', maxWidth: 2560 },
  /* the country photo on the home page, ~700 CSS px wide */
  { file: 'images/PUERTO.JPG', maxWidth: 1600 },
  { file: 'images/entrance/costaricaimage.JPG', maxWidth: 1600 },
  { file: 'images/entrance/baliimage.JPG', maxWidth: 1600 },
  { file: 'images/entrance/brazilimage.JPG', maxWidth: 1600 },
  /* stay photos open to min(640px, 100%) */
  { dir: 'images/stays', maxWidth: 1280 },
  { dir: 'images/stays-pr', maxWidth: 1280 }
];

const isJpeg = n => /\.(jpe?g)$/i.test(n);
const kb = b => (b / 1024).toFixed(0).padStart(5) + ' KB';

async function expand(t){
  if (t.file) return [t.file];
  const names = await readdir(t.dir);
  return names.filter(isJpeg).map(n => join(t.dir, n));
}

let before = 0, after = 0, count = 0;

for (const target of TARGETS){
  for (const file of await expand(target)){
    const sizeBefore = (await stat(file)).size;

    /* sharp cannot write to the file it is reading, so go via a temp name */
    const tmp = join(dirname(file), '.opt-' + Math.random().toString(36).slice(2) + '.jpg');
    const meta = await sharp(file).metadata();

    await sharp(file)
      .rotate()                                   /* bake in EXIF orientation */
      .resize({ width: Math.min(meta.width, target.maxWidth), withoutEnlargement: true })
      .jpeg({ quality: QUALITY, mozjpeg: true, progressive: true })
      .toFile(tmp);

    const sizeAfter = (await stat(tmp)).size;

    /* never let an "optimised" file come out bigger than the original */
    if (sizeAfter < sizeBefore){
      await rename(tmp, file);
      after += sizeAfter;
    }else{
      const { unlink } = await import('node:fs/promises');
      await unlink(tmp);
      after += sizeBefore;
    }

    before += sizeBefore;
    count++;
    const out = await sharp(file).metadata();
    console.log(`${kb(sizeBefore)} -> ${kb(sizeAfter)}  ${meta.width}x${meta.height} -> ${out.width}x${out.height}  ${file}`);
  }
}

console.log(`\n${count} files: ${(before / 1048576).toFixed(1)} MB -> ${(after / 1048576).toFixed(1)} MB`);
