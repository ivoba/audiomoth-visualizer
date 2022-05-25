import fs from "fs";
import posthtml from "posthtml";
import content from "posthtml-content";
import expressions from "posthtml-expressions";
import sass from "sass";
import { updateManifestWithBirdnetData } from "./birdnetManifest.mjs";

async function generateHTML(dir) {
  if (fs.existsSync(dir)) {
    const manifest = JSON.parse(
      fs.readFileSync(`${dir}/manifest.json`).toString()
    );
    await updateManifestWithBirdnetData(dir, manifest);

    const css = await sass.compile(
      new URL("../views/style.scss", import.meta.url).pathname
    );
    fs.writeFileSync(`${dir}/style.css`, css.css.toString());

    const dateFormatter = (str, locale, timeZone) => {
      const date = new Date(str);
      const df = new Intl.DateTimeFormat(locale, {
        day: "numeric",
        month: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "numeric",
        second: "numeric",
        timeZone: timeZone,
      });
      return df.format(date);
    };

    const contentPlugin = content({
      dateformat: (str) => dateFormatter(str),
      firstDate: (filesJson) => {
        const files = JSON.parse(filesJson);
        return dateFormatter(
          files[0].record_date,
          manifest.locale,
          manifest.time_zone
        );
      },
      lastDate: (filesJson) => {
        const files = JSON.parse(filesJson);
        return dateFormatter(
          files[files.length - 1].record_date,
          manifest.locale,
          manifest.time_zone
        );
      },
      filesCount: (filesJson) => {
        const files = JSON.parse(filesJson);
        return files.length;
      },
      roundConfidence: (confidence) => {
        return Math.round(confidence * 100) / 100;
      },
    });
    posthtml([expressions({ locals: manifest }), contentPlugin])
      .process(
        fs.readFileSync(new URL("../views/index.html", import.meta.url), "utf8")
      )
      .then((result) => fs.writeFileSync(`${dir}/index.html`, result.html));
  }
}

export { generateHTML };
