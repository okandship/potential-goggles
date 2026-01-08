import { appendFileSync } from "node:fs";
import { dataObjectToMarkdown, markdownToDataObject } from "@okandship/h3kv";
import type { z } from "zod";
import { ModelCoreSchema } from "../schemas/model";

const issueBody = Bun.env.ISSUE_BODY;

if (!issueBody) {
  console.error("::error::No ISSUE_BODY provided.");
  process.exit(1);
}

let dataObject: z.output<typeof ModelCoreSchema>;
try {
  dataObject = markdownToDataObject(issueBody, ModelCoreSchema);
} catch (err) {
  console.error("::error::Form validation failed.", err);
  process.exit(1);
}

if (!dataObject.id) {
  console.error("::error::Missing 'id' in form data.");
  process.exit(1);
}

const outputMarkdown = dataObjectToMarkdown(dataObject, ModelCoreSchema);

const filePath = `models/${dataObject.id}.md`;

const file = Bun.file(filePath);
if (await file.exists()) {
  console.error(`::error::Duplicate detected: ${filePath} already exists.`);
  process.exit(1);
}

await Bun.write(filePath, outputMarkdown);
console.log(`Successfully created ${filePath}`);

const githubOutputPath = Bun.env.GITHUB_OUTPUT;
if (githubOutputPath) {
  const outputs = `model-id=${dataObject.id}\nmodel-name=${dataObject.name}\n`;
  appendFileSync(githubOutputPath, outputs);
}
