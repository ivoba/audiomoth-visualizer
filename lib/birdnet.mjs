import { $ } from "zx";
import { getWeek } from "date-fns";

async function birdnet(path, audios, destination, manifest) {
  const firstFileDate = new Date(manifest.files[0].record_date);
  const week = getWeek(firstFileDate);
  return $`docker run -v ${path}:/audio breallis/birdnet:cpu --i audio/${audios} --o /audio/${destination} --lat ${
    manifest.location.lat ?? -1
  } --lon ${manifest.location.lng ?? -1} --week ${week}`;
}

export { birdnet };
