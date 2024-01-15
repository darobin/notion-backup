#!/usr/bin/env node

let { program } = require("commander"),
  { writeFileSync, mkdirSync } = require("fs"),
  { join, isAbsolute, dirname } = require("path"),
  { NotionAPI } = require("notion-client"),
  { parsePageId } = require("notion-utils"),
  { NOTION_TOKEN, NOTION_BACKUP_DIR } = process.env,
  nc = new NotionAPI({ authToken: NOTION_TOKEN }),
  die = (str) => {
    console.error(str);
    process.exit(1);
  };
// --version
program.version(require("./package.json").version);

program
  .option("-i, --id <id>", "ID of the Notion document")
  .option("-c, --collection <collection>", "ID of the Notion collection")
  .option("-v, --view <view>", "ID of the Notion collection view")
  .option("-o, --out <file>", "File to write to");

// now do something
program.parse(process.argv);

async function run() {
  let { id, collection, view, out } = program.opts(),
    refPage;
  if (collection) {
    if (!view)
      die("The --collection option requires --view to also be specified.");
    if (id) console.warn("Warning: --id will be ignored.");
    refPage = await nc.getCollectionData(
      parsePageId(collection),
      parsePageId(view)
    );
  } else if (id) {
    if (view) console.warn("Warning: --view will be ignored.");
    refPage = await nc.getPage(parsePageId(id));
  } else die("Must specify one of --id or --collection/--view.");
  let json = JSON.stringify(refPage, null, 2);
  if (out) {
    let file = isAbsolute(out)
      ? out
      : join(NOTION_BACKUP_DIR ?? process.cwd(), out);
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, json);
  } else process.stdout.write(json);
}
run();
