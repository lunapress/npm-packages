import { writeFileSync, mkdirSync, existsSync, readdirSync, readFileSync } from "node:fs";
import { execSync } from "node:child_process";
import * as path from "node:path";

const packagesRoot = path.resolve("packages");
const packageDirs = readdirSync(packagesRoot, { withFileTypes: true })
    .filter((dir) => dir.isDirectory())
    .map((dir) => path.join(packagesRoot, dir.name));

const packageNames: string[] = [];

for (const dir of packageDirs) {
    try {
        const pkg = JSON.parse(
            readFileSync(path.join(dir, "package.json"), "utf8")
        );
        if (pkg.name) packageNames.push(pkg.name);
    } catch {}
}

if (!existsSync(".changeset")) mkdirSync(".changeset");

const header = packageNames.map((name) => `"${name}": patch`).join("\n");

writeFileSync(
    `.changeset/force-dev.md`,
    `---\n${header}\n---\nforce dev snapshot\n`
);

execSync(`pnpm build:all`, { stdio: "inherit" });
execSync(`pnpm changeset version --snapshot dev`, { stdio: "inherit" });
execSync(`pnpm changeset publish --snapshot --tag dev`, { stdio: "inherit" });

console.log("✔ dev release");
