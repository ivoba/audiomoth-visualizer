#!/usr/bin/env zx

const dir = argv._[1];
if (!fs.existsSync(dir)) {
  console.log("no such dir ", dir);
  process.exit(1);
}

import { generateHTML } from "./lib/html.mjs";

await generateHTML(dir);

console.log("Done");
