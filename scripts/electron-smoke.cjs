const { spawn } = require("child_process");
const fs = require("fs");
const os = require("os");
const path = require("path");

const electronPath = require("electron");
const projectDirectory = path.resolve(__dirname, "..");
const usePackagedApplication = process.argv.includes("--packaged");

function findPackagedExecutable() {
  const candidates =
    process.platform === "darwin"
      ? ["mac-arm64", "mac-universal", "mac"].map((directory) =>
          path.join(
            projectDirectory,
            "release",
            directory,
            "图片对比工具.app",
            "Contents",
            "MacOS",
            "图片对比工具",
          ),
        )
      : process.platform === "win32"
        ? [
            path.join(
              projectDirectory,
              "release",
              "win-unpacked",
              "图片对比工具.exe",
            ),
          ]
        : [
            path.join(
              projectDirectory,
              "release",
              "linux-unpacked",
              "图片对比工具",
            ),
          ];

  return candidates.find((candidate) => fs.existsSync(candidate));
}

const packagedExecutable = findPackagedExecutable();

if (usePackagedApplication && !packagedExecutable) {
  console.error("Packaged application not found. Run npm run electron:build first.");
  process.exit(1);
}

const profileDirectory = fs.mkdtempSync(
  path.join(os.tmpdir(), "image-compare-smoke-"),
);

const child = spawn(
  usePackagedApplication ? packagedExecutable : electronPath,
  usePackagedApplication
    ? [`--user-data-dir=${profileDirectory}`]
    : [`--user-data-dir=${profileDirectory}`, projectDirectory],
  {
  cwd: projectDirectory,
  env: {
    ...process.env,
    IMAGE_COMPARE_SMOKE_TEST: "1",
  },
  stdio: ["ignore", "pipe", "pipe"],
    windowsHide: process.platform === "win32",
  },
);

let output = "";
let timedOut = false;

child.stdout.on("data", (chunk) => {
  output += chunk.toString();
});

child.stderr.on("data", (chunk) => {
  output += chunk.toString();
});

const timeout = setTimeout(() => {
  timedOut = true;
  child.kill();
}, 30_000);

child.on("error", () => {
  clearTimeout(timeout);
  fs.rmSync(profileDirectory, { recursive: true, force: true });
  console.error("Electron smoke test could not start the application process.");
  process.exitCode = 1;
});

child.on("close", (code) => {
  clearTimeout(timeout);
  fs.rmSync(profileDirectory, { recursive: true, force: true });

  if (
    timedOut ||
    code !== 0 ||
    !output.includes("IMAGE_COMPARE_ELECTRON_SMOKE_OK")
  ) {
    console.error(
      timedOut
        ? "Electron smoke test timed out."
        : `Electron smoke test failed with exit code ${code ?? "unknown"}.`,
    );
    process.exitCode = 1;
    return;
  }

  console.log("Electron smoke test passed.");
});
