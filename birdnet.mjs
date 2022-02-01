#!/usr/bin/env zx

const dir = argv._[1];
if (!fs.existsSync(dir)) {
  console.log("no such dir ", dir);
  process.exit(1);
}

import { birdnet } from "./lib/birdnet.mjs";

await birdnet(dir, "birdnet");

console.log("Done");
