import { appendFileSync } from "node:fs";
import { dataObjectToMarkdown, markdownToDataObject } from "@okandship/h3kv";
import { createModelSlug, ModelCoreSchema } from "../schemas/model";

const inputMarkdown = Bun.env.ISSUE_BODY;

if (!inputMarkdown) {
  console.error("::error::no ISSUE_BODY provided");
  process.exit(1);
}

const model = markdownToDataObject(inputMarkdown, ModelCoreSchema);

if (!(model.id && model.name)) {
  console.error("::error::missing model id or name");
  process.exit(1);
}

const outputMarkdown = dataObjectToMarkdown(model, ModelCoreSchema);

const modelPath = `models/${model.id}.md`;

const modelFile = Bun.file(modelPath);
if (await modelFile.exists()) {
  console.error(
    `::error::duplicate model detected: ${modelPath} already exists`
  );
  process.exit(1);
}

await Bun.write(modelPath, outputMarkdown);
console.log(`successfully created ${modelPath}`);

const outputsPath = Bun.env.GITHUB_OUTPUT;

if (!outputsPath) {
  console.error("::error::no GITHUB_OUTPUT provided");
  process.exit(1);
}

appendFileSync(
  outputsPath,
  Object.entries({
    "branch-name": createModelSlug(model.creator, model.name),
    "model-id": model.id,
    "model-name": model.name,
  })
    .map(([key, value]) => `${key}=${value}`)
    .join("\n")
);
