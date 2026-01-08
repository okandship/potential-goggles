import { mkdirSync } from "node:fs";
import { markdownToDataObject } from "@okandship/h3kv";
import type { z } from "zod";
import { ModelCoreSchema } from "../schemas/model";

const models: z.output<typeof ModelCoreSchema>[] = [];

const glob = new Bun.Glob("models/*.md");

console.log("🔮 scanning model files...");

for await (const filePath of glob.scan()) {
  const content = await Bun.file(filePath).text();
  const data = markdownToDataObject(content, ModelCoreSchema);
  models.push(data);
}

// sort by release date desc
models.sort((a, b) => {
  return (
    new Date(b["release date"]).getTime() -
    new Date(a["release date"]).getTime()
  );
});

const outputDir = "public/api";
mkdirSync(outputDir, { recursive: true });
const outputPath = `${outputDir}/models.json`;
await Bun.write(outputPath, JSON.stringify(models, null, 2));

console.log(`👑 api built: ${models.length} models -> ${outputPath}`);
