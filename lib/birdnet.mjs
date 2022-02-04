import { $ } from "zx";

async function birdnet(path, audios, destination) {
  return $`docker run -v ${path}:/audio breallis/birdnet:cpu --i audio/${audios} --o /audio/${destination}`; //--lat 42.479 --lon -76.451 --week 12
}

export { birdnet };
