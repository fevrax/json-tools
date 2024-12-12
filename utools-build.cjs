const fs = require("fs");
const path = require("path");

const cssDir = path.join(__dirname, "out", "_next", "static", "css");

function replaceInFile(filePath) {
  fs.readFile(filePath, "utf8", (err, data) => {
    if (err) {
      console.error(`Error reading file ${filePath}:`, err);

      return;
    }

    const result = data.replace(
      /_next\/static\/media\/codicon/g,
      "../media/codicon",
    );

    fs.writeFile(filePath, result, "utf8", (err) => {
      if (err) {
        console.error(`Error writing file ${filePath}:`, err);
      } else {
        console.log(`Successfully replaced _next/static/media/codicon in ${filePath}`);
      }
    });
  });
}

fs.readdir(cssDir, (err, files) => {
  if (err) {
    console.error("Error reading directory:", err);

    return;
  }

  files.forEach((file) => {
    if (path.extname(file) === ".css") {
      const filePath = path.join(cssDir, file);

      replaceInFile(filePath);
    }
  });
});
