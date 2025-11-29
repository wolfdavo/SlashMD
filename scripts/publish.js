#!/usr/bin/env node

import { select, password } from "@inquirer/prompts";
import ora from "ora";
import chalk from "chalk";
import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, "..");
const EXTENSION_DIR = path.join(ROOT_DIR, "packages", "extension-host");
const PACKAGE_JSON_PATH = path.join(EXTENSION_DIR, "package.json");

function getPackageJson() {
  return JSON.parse(fs.readFileSync(PACKAGE_JSON_PATH, "utf-8"));
}

function writePackageJson(pkg) {
  fs.writeFileSync(PACKAGE_JSON_PATH, JSON.stringify(pkg, null, 2) + "\n");
}

function incrementVersion(version, type) {
  const parts = version.split(".").map(Number);
  switch (type) {
    case "major":
      return `${parts[0] + 1}.0.0`;
    case "minor":
      return `${parts[0]}.${parts[1] + 1}.0`;
    case "patch":
      return `${parts[0]}.${parts[1]}.${parts[2] + 1}`;
    default:
      return version;
  }
}

function exec(command, options = {}) {
  return execSync(command, {
    stdio: "pipe",
    cwd: ROOT_DIR,
    encoding: "utf-8",
    ...options,
  });
}

async function runStep(label, fn) {
  const spinner = ora(label).start();
  try {
    const result = await fn();
    spinner.succeed();
    return result;
  } catch (error) {
    spinner.fail();
    throw error;
  }
}

async function main() {
  console.log(chalk.bold.cyan("\n  SlashMD Publisher\n"));

  // Get current version
  const pkg = getPackageJson();
  const currentVersion = pkg.version;

  console.log(
    chalk.gray(`  Current version: ${chalk.white(currentVersion)}\n`)
  );

  // Version selection
  const versionBump = await select({
    message: "Version bump:",
    choices: [
      {
        name: `patch  ${chalk.gray(`${currentVersion} → ${incrementVersion(currentVersion, "patch")}`)}`,
        value: "patch",
      },
      {
        name: `minor  ${chalk.gray(`${currentVersion} → ${incrementVersion(currentVersion, "minor")}`)}`,
        value: "minor",
      },
      {
        name: `major  ${chalk.gray(`${currentVersion} → ${incrementVersion(currentVersion, "major")}`)}`,
        value: "major",
      },
      {
        name: `none   ${chalk.gray("keep current version")}`,
        value: "none",
      },
    ],
  });

  let newVersion = currentVersion;
  if (versionBump !== "none") {
    newVersion = incrementVersion(currentVersion, versionBump);
    pkg.version = newVersion;
    writePackageJson(pkg);
    console.log(
      chalk.green(`\n  ✓ Version updated to ${chalk.bold(newVersion)}\n`)
    );
  } else {
    console.log();
  }

  // Build
  await runStep("Building extension", () => {
    exec("npm run build");
  });

  // Package
  await runStep("Packaging extension", () => {
    exec("npm run package");
  });

  const vsixPath = path.join(EXTENSION_DIR, "slashmd.vsix");
  if (!fs.existsSync(vsixPath)) {
    console.error(chalk.red("\n  ✗ slashmd.vsix not found after packaging\n"));
    process.exit(1);
  }

  const stats = fs.statSync(vsixPath);
  const sizeKB = Math.round(stats.size / 1024);
  console.log(chalk.gray(`\n  Package size: ${sizeKB} KB\n`));

  // Publish to VS Code Marketplace
  await runStep("Publishing to VS Code Marketplace", () => {
    exec(`npx vsce publish --packagePath slashmd.vsix`, { cwd: EXTENSION_DIR });
  });

  // Get Open VSX token
  console.log();
  const ovsxToken = await password({
    message: "Open VSX token:",
    mask: "*",
    validate: (input) =>
      input.length > 0 || "Token is required for Open VSX publishing",
  });

  // Publish to Open VSX
  await runStep("Publishing to Open VSX", () => {
    exec(`npx ovsx publish slashmd.vsix -p ${ovsxToken}`, {
      cwd: EXTENSION_DIR,
    });
  });

  // Success
  console.log(chalk.bold.green("\n  ✓ Published successfully!\n"));
  console.log(chalk.gray("  Version:      ") + chalk.white(newVersion));
  console.log(
    chalk.gray("  VS Code:      ") +
      chalk.cyan(
        "https://marketplace.visualstudio.com/items?itemName=slashmd.slashmd"
      )
  );
  console.log(
    chalk.gray("  Open VSX:     ") +
      chalk.cyan("https://open-vsx.org/extension/slashmd/slashmd")
  );
  console.log();
}

main().catch((err) => {
  console.error(chalk.red(`\n  ✗ ${err.message}\n`));
  process.exit(1);
});
