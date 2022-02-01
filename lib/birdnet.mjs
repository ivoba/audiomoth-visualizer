import { $, fs } from "zx";

async function birdnet(dir, birdnetDir) {
  const birdnetPath = `${__dirname}/${dir}/${birdnetDir}`;

  if (!fs.existsSync(birdnetPath)) {
    fs.mkdirSync(birdnetPath);
  }

  const path = `${__dirname}/${dir}`;
  return $`docker run -v ${path}:/audio breallis/birdnet:cpu --i audio --o /audio/${birdnetDir}`; //--lat 42.479 --lon -76.451 --week 12
}

export { birdnet };
