import fs from "fs";
import csvreader from "csv-reader";
import * as path from "path";

const updateManifestWithBirdnetData = async (dir, manifest) => {
  return await Promise.all(
    manifest.files.map(async (fileData) => {
      const birdnetFile = new URL(
        `${dir}/birdnet/${fileData.base}.BirdNET.selections.txt`,
        import.meta.url
      );
      //`${__dirname}/${dir}/birdnet/${fileData.base}.BirdNET.selections.txt`;
      if (!fs.existsSync(birdnetFile)) {
        return fileData;
      }
      return mergeFileData(fileData, birdnetFile);
    })
  );
};

const mergeFileData = async (fileData, birdnetFile) => {
  let inputStream = fs.createReadStream(birdnetFile, "utf8");
  let data = {};
  inputStream
    .pipe(
      new csvreader({
        delimiter: "\t",
        parseNumbers: true,
        parseBooleans: true,
        trim: true,
        skipHeader: true,
      })
    )
    .on("data", function (row) {
      let time = `${row[4]}-${row[5]}`;
      let timeData = {
        start: row[4],
        end: row[5],
        specie: row[9],
        rank: row[11],
        confidence: row[10]
      };
      if (data[time] === undefined) {
        data[time] = [timeData];
      } else {
        data[time].push(timeData);
      }
    })
    .on("end", function () {
      data = Object.keys(data)
        .sort()
        .reduce((obj, key) => {
          obj[key] = data[key];
          return obj;
        }, {});
      fileData.birdnet = data;
    });

  return new Promise(function (resolve, reject) {
    inputStream.on("end", () => resolve(fileData));
    inputStream.on("error", reject); // or something like that. might need to close `hash`
  });
};

const loadBirdnetFile = async (file, manifest) => {
  const basename = path.basename(file, "WAV");
  const dir = path.dirname(file);
  const birdnetFile = `${dir}/birdnet/${basename}BirdNET.selections.txt`;
  if (!fs.existsSync(birdnetFile)) {
    return null;
  }

  let inputStream = fs.createReadStream(birdnetFile, "utf8");
  let data = {};

  inputStream
    .pipe(
      new csvreader({
        delimiter: "\t",
        parseNumbers: true,
        parseBooleans: true,
        trim: true,
        skipHeader: true,
      })
    )
    .on("data", function (row) {
      let time = `${row[4]}-${row[5]}`;
      let timeData = {
        start: row[4],
        end: row[5],
        specie: row[9],
        rank: row[11],
        confidence: row[10]
      };
      if (data[time] === undefined) {
        data[time] = [timeData];
      } else {
        data[time].push(timeData);
      }
    })
    .on("end", function () {
      let obj = manifest.files.find((el) => el.base === basename.slice(0, -1));
      if (obj) {
        data.sort();
        obj.birdnet = data;
      }
    });

  return new Promise(function (resolve, reject) {
    inputStream.on("end", () => resolve(manifest));
    inputStream.on("error", reject); // or something like that. might need to close `hash`
  });
};

export { updateManifestWithBirdnetData, loadBirdnetFile };
