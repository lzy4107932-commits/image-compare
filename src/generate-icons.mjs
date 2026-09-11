import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import pngToIco from "png-to-ico";

const currentFile = fileURLToPath(import.meta.url);
const currentDirectory = path.dirname(currentFile);
const projectDirectory = path.resolve(currentDirectory, "..");

const sourceFile = path.join(projectDirectory, "public", "app-logo.svg");

const outputDirectory = path.join(projectDirectory, "build");

const pngFile = path.join(outputDirectory, "icon.png");
const icoFile = path.join(outputDirectory, "icon.ico");

await fs.mkdir(outputDirectory, {
  recursive: true,
});

await sharp(sourceFile).resize(512, 512).png().toFile(pngFile);

const icoBuffer = await pngToIco(pngFile);

await fs.writeFile(icoFile, icoBuffer);

console.log("图标生成成功：");
console.log(`PNG：${pngFile}`);
console.log(`ICO：${icoFile}`);
