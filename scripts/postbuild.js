import { cp, copyFile, mkdir } from "node:fs/promises";

await mkdir("dist", { recursive: true });
await cp("tests", "dist/tests", { recursive: true });
await copyFile("site-config.json", "dist/site-config.json");
