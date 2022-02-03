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

    const css = await sass.compile("views/style.scss");
    fs.writeFileSync(`${dir}/style.css`, css.css.toString());

    const dateFormatter = (str) => {
      const date = new Date(str);
      const df = new Intl.DateTimeFormat("de-DE", {
        day: "numeric",
        month: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "numeric",
        second: "numeric",
        timeZone: "Europe/Berlin", // todo dynamic locale and timezone
      });
      return df.format(date);
    };

    const contentPlugin = content({
      dateformat: (str) => dateFormatter(str),
      firstDate: (filesJson) => {
        const files = JSON.parse(filesJson);
        return dateFormatter(files[0].record_date);
      },
      lastDate: (filesJson) => {
        const files = JSON.parse(filesJson);
        return dateFormatter(files[files.length - 1].record_date);
      },
    });
    posthtml([expressions({ locals: manifest }), contentPlugin])
      .process(fs.readFileSync("views/index.html", "utf8"))
      .then((result) => fs.writeFileSync(`${dir}/index.html`, result.html));
  }
}

export { generateHTML };
