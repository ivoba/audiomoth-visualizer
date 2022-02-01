#!/usr/bin/env zx

const path = require("path");

const dir = argv._[1];
if (!fs.existsSync(dir)) {
  console.log("no such dir ", dir);
  process.exit(1);
}
const title = !!argv._[2] ? argv._[2] : "";

const allFiles = fs.readdirSync(dir);
let files = allFiles.filter(function (elm) {
  return elm.match(/.*\.(WAV)/gi);
});
const imagesDir = "images";
const thumbsDir = "thumbs";
const moviesDir = "movies";
const imagesPath = `${dir}/${imagesDir}`;
const thumbsPath = `${dir}/${imagesDir}/${thumbsDir}`;
const moviesPath = `${dir}/${moviesDir}`;

if (!fs.existsSync(imagesPath)) {
  fs.mkdirSync(imagesPath);
}
if (!fs.existsSync(thumbsPath)) {
  fs.mkdirSync(thumbsPath);
}
if (!fs.existsSync(moviesPath)) {
  fs.mkdirSync(moviesPath);
}
const manifest = {
  title: title,
  location: {
    lat: 0,
    lng: 0,
  },
  files: [],
};

const createMovieFrames = async (
  dir,
  file,
  baseFileName,
  totalDuration,
  thumbMaxDuration,
  title,
  date,
  thumb
) => {
  let imageCount = 0;
  for (let i = 0; i < totalDuration; i = i + thumbMaxDuration) {
    let frameImage = `${dir}/tmp_${baseFileName}${imageCount}.png`;
    console.log(
      `making spectrogram from ${i} to ${i + thumbMaxDuration} seconds...`
    );
    // generate the initial .png spectrogram output from sox
    await $`sox ${file} -n rate 24k trim ${i} ${thumbMaxDuration} spectrogram -x 1136 -y 642 -z 96 -w hann -o ${frameImage}`;
    // todo see if we can pipe the sox output
    // await $`cat file.txt`.pipe(process.stdout)

    // extend the .png canvas size to match 720p dimensions and make room for text
    await $`convert ${frameImage} -background black -gravity north -extent 1280x720 ${frameImage}`;
    // add text to the bottom of the .png image
    let annotation = `${title}\n ${date.mtime.toISOString()}`;
    await $`convert ${frameImage} -gravity south -fill white -pointsize 36 -annotate +0+10 ${annotation} ${frameImage}`;
    imageCount++;
  }
  const firstFrame = `${dir}/tmp_${baseFileName}0.png`;
  await $`convert ${firstFrame} -resize 300x170 ${thumb}`;
};

await Promise.all(
  files.map(async (audioFile) => {
    let file = `${dir}/${audioFile}`;
    let baseFileName = path.basename(`${dir}/${file}`, ".WAV");
    let thumbFile = `${baseFileName}.png`;
    let thumb = `${thumbsPath}/${thumbFile}`;
    let movieFile = `${baseFileName}.mp4`;
    let movie = `${moviesPath}/${movieFile}`;
    let totalDuration = parseInt(await $`soxi -D ${file}`);
    let thumbMaxDuration = 30;
    let date = await fs.stat(file);
    if (totalDuration < thumbMaxDuration) thumbMaxDuration = totalDuration;
    // make movie
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
    console.log("creating full length movie...");
    await $`ffmpeg -loglevel panic -framerate 1/${thumbMaxDuration} -i ${dir}/tmp_${baseFileName}%d.png -i ${file} -c:v libx264 -y -crf 23 -pix_fmt yuv420p ${movie}`;
    // remove tmp files
    let regex = new RegExp("^tmp_.*png$");
    fs.readdirSync(dir)
      .filter((f) => regex.test(f))
      .map((f) => fs.unlinkSync(`${dir}/${f}`));
    manifest.files.push({
      base: baseFileName,
      audio: `${audioFile}`,
      thumb: `${imagesDir}/${thumbsDir}/${thumbFile}`,
      movie: `${moviesDir}/${movieFile}`,
      record_date: date.mtime.toISOString(),
    });
  })
);

// sort manifest
manifest.files.sort((a, b) =>
  a.audio > b.audio ? 1 : b.audio > a.audio ? -1 : 0
);

import { birdnet } from "./lib/birdnet.mjs";
await birdnet(dir, "birdnet");

import { updateManifestWithBirdnetData } from "./lib/birdnetManifest.mjs";

await updateManifestWithBirdnetData(
  "./files/Kloster-Burbach/20210524_040000.WAV",
  manifest
);
await fs.writeJson(`${dir}/manifest.json`, manifest);

import { generateHTML } from "./lib/html.mjs";

await generateHTML(dir);

console.log("Done");
