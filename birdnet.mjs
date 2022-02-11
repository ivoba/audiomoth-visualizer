#!/usr/bin/env zx

import { resolve } from "path";

const dir = argv._[1];
if (!fs.existsSync(dir)) {
  console.log("no such dir ", dir);
  process.exit(1);
}

import { birdnet } from "./lib/birdnet.mjs";

const absolutePath = resolve(`${dir}`);
const manifest = require(`${absolutePath}/manifest.json`);
// rodo reuse config: dir names
await birdnet(`${absolutePath}`, "audios", "birdnet", manifest);

console.log("Done");
