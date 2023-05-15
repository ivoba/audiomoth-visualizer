#!/usr/bin/env node

import * as path from "path";
import "zx/globals";
import { createMovieFrames } from "./lib/movieFrames.mjs";
import { birdnet } from "./lib/birdnet.mjs";
import { updateManifestWithBirdnetData } from "./lib/birdnetManifest.mjs";
import { generateHTML } from "./lib/html.mjs";
import StaticMaps from "staticmaps";

const dir = argv._[0];
const dest = path.resolve(argv._[1] ?? dir);

if (!fs.existsSync(dir)) {
  console.log("no such dir ", dir);
  process.exit(1);
}
const title = argv.title ?? "";
const locale = argv.locale ?? "de-DE";
const timeZone = argv.timezone ?? "Europe/Berlin";
const lat = argv.lat ?? null;
const lng = argv.lng ?? null;

const allFiles = fs.readdirSync(dir);
let files = allFiles.filter(function (elm) {
  return elm.match(/.*\.(WAV)/gi);
});
if (files.length == 0) {
  console.log("no files found", dir);
  process.exit(1);
}

const audiosDir = "audios";
const imagesDir = "images";
const thumbsDir = "thumbs";
const moviesDir = "movies";
const audiosPath = `${dest}/${audiosDir}`;
const imagesPath = `${dest}/${imagesDir}`;
const thumbsPath = `${dest}/${imagesDir}/${thumbsDir}`;
const moviesPath = `${dest}/${moviesDir}`;

if (!fs.existsSync(dest)) {
  fs.mkdirSync(dest);
}
if (!fs.existsSync(audiosPath)) {
  fs.mkdirSync(audiosPath);
}
if (!fs.existsSync(imagesPath)) {
  fs.mkdirSync(imagesPath);
}
if (!fs.existsSync(thumbsPath)) {
  fs.mkdirSync(thumbsPath);
}
if (!fs.existsSync(moviesPath)) {
  fs.mkdirSync(moviesPath);
}

let map;
if (lat && lng) {
  map = new StaticMaps({
    width: 400,
    height: 200,
  });
  const marker = {
    img: new URL(`./views/marker.png`, import.meta.url).pathname,
    offsetX: 12,
    offsetY: 48,
    width: 24,
    height: 24,
    coord: [lng, lat],
  };
  map.addMarker(marker);
  await map.render([lng, lat], 13);
  await map.image.save(`${dest}/map.png`, { compressionLevel: 9 });
}

const manifest = {
  title: title,
  location: {
    lat: lat,
    lng: lng,
    map_image: map,
  },
  locale: locale,
  time_zone: timeZone,
  files: [],
};

const chunk = (arr, size) =>
  arr.reduce(
    (acc, e, i) => (
      i % size ? acc[acc.length - 1].push(e) : acc.push([e]), acc
    ),
    []
  );

const chunks = chunk(files, 10);

for (const chunk of chunks) {
  await Promise.all(
    chunk.map(async (audioFile) => {
      let file = `${dir}/${audioFile}`;
      let destAudioFile = `${audiosDir}/${audioFile}`;
      fs.copyFileSync(file, `${dest}/${destAudioFile}`);
      let baseFileName = path.basename(`${dir}/${file}`, ".WAV");
      let thumbFile = `${baseFileName}.png`;
      let thumb = `${thumbsPath}/${thumbFile}`;
      let movieFile = `${baseFileName}.mp4`;
      let movie = `${moviesPath}/${movieFile}`;
      let totalDuration = parseInt(await $`soxi -D ${file}`);
      let thumbMaxDuration = 30;
      let date = await fs.stat(file);
      if (totalDuration < thumbMaxDuration) thumbMaxDuration = totalDuration;
      await createMovieFrames(
        dir,
        file,
        baseFileName,
        totalDuration,
        thumbMaxDuration,
        title,
        date,
        thumb
      );
      console.log(`creating full length movie: ${movie}`);
      await $`ffmpeg -loglevel panic -framerate 1/${thumbMaxDuration} -i ${dir}/tmp_${baseFileName}%d.png -i ${file} -c:v libx264 -y -crf 23 -pix_fmt yuv420p ${movie}`;
      manifest.files.push({
        base: baseFileName,
        audio: `${destAudioFile}`,
        thumb: `${imagesDir}/${thumbsDir}/${thumbFile}`,
        movie: `${moviesDir}/${movieFile}`,
        record_date: date.mtime.toISOString(),
      });
    })
  );
  console.log("Processed chunk:", chunk);
}
console.log("Removing tmp files...");
let regex = new RegExp("^tmp_.*png$");
fs.readdirSync(dir)
  .filter((f) => regex.test(f))
  .map((f) => fs.unlinkSync(`${dir}/${f}`));

// sort files in manifest
manifest.files.sort((a, b) =>
  a.audio > b.audio ? 1 : b.audio > a.audio ? -1 : 0
);

await birdnet(
  dest,
  audiosDir,
  "birdnet",
  manifest,
  locale.substr(0, 2).toLowerCase()
);

await updateManifestWithBirdnetData(dest, manifest);
await fs.writeJson(`${dest}/manifest.json`, manifest);

await generateHTML(dest);

console.log("Done: file://" + dest + "/index.html");
