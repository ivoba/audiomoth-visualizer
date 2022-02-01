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

    const css = sass.renderSync({ file: "views/style.scss" });
    fs.writeFileSync(`${dir}/style.css`, css.css.toString());

    const contentPlugin = content({
      dateformat: (str) => {
        const date = new Date(str);
        const df = new Intl.DateTimeFormat("de-DE", {
          day: "numeric",
          month: "numeric",
          year: "numeric",
          hour: "numeric",
          minute: "numeric",
          second: "numeric",
          timeZone: "Europe/Berlin",
        });
        return df.format(date);
      },
    });
    posthtml([expressions({ locals: manifest }), contentPlugin])
      .process(fs.readFileSync("views/index.html", "utf8"))
      .then((result) => fs.writeFileSync(`${dir}/index.html`, result.html));
  }
}

export { generateHTML };
