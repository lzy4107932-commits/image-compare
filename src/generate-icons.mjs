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
const icnsFile = path.join(outputDirectory, "icon.icns");

function createIcnsChunk(type, data) {
  const header = Buffer.alloc(8);
  header.write(type, 0, 4, "ascii");
  header.writeUInt32BE(data.length + header.length, 4);
  return Buffer.concat([header, data]);
}

async function createIcns(source) {
  const iconTypes = [
    ["icp4", 16],
    ["icp5", 32],
    ["icp6", 64],
    ["ic07", 128],
    ["ic08", 256],
    ["ic09", 512],
    ["ic10", 1024],
    ["ic11", 32],
    ["ic12", 64],
    ["ic13", 256],
    ["ic14", 512],
  ];

  const chunks = await Promise.all(
    iconTypes.map(async ([type, size]) => {
      const png = await sharp(source).resize(size, size).png().toBuffer();
      return createIcnsChunk(type, png);
    }),
  );
  const payload = Buffer.concat(chunks);
  const header = Buffer.alloc(8);
  header.write("icns", 0, 4, "ascii");
  header.writeUInt32BE(payload.length + header.length, 4);
  return Buffer.concat([header, payload]);
}

await fs.mkdir(outputDirectory, {
  recursive: true,
});

await sharp(sourceFile).resize(512, 512).png().toFile(pngFile);

const icoBuffer = await pngToIco(pngFile);
const icnsBuffer = await createIcns(sourceFile);

await fs.writeFile(icoFile, icoBuffer);
await fs.writeFile(icnsFile, icnsBuffer);

console.log("图标生成成功：");
console.log(`PNG：${pngFile}`);
console.log(`ICO：${icoFile}`);
console.log(`ICNS：${icnsFile}`);
