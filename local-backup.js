const { exec } = require("child_process");
const { mkdir, opendir } = require("fs/promises");
require("dotenv").config();
const nb = require("./notion-backup");

async function run() {
  if (!process.env.NOTION_BACKUP_DIR) {
    console.log("Env variable NOTION_BACKUP_DIR needs to be specified.");
    process.exit(1);
  }

  await mkdir(process.env.NOTION_BACKUP_DIR, { recursive: true });

  await nb.run();

  exec(
    `cd ${process.env.NOTION_BACKUP_DIR};` +
      "rm -f *.zip;" +
      'find markdown -name "*-Part*.zip" -type f -delete ;' +
      'find html -name "*-Part*.zip" -type f -delete ;',
    (_, stdout, stderr) => {
      if (stderr) console.log("STDOUT:", stdout, ", STDERR:", stderr);
    }
  );
}

async function dwada() {
  const dir = await opendir(process.env.NOTION_BACKUP_DIR, {
    recursive: true,
  });

  for await (let dirent of dir) {
    console.log(dirent.name);
    /*
    if (!dirent.isDirectory()) continue;

    const innerDir = await opendir(
      `${process.env.NOTION_BACKUP_DIR}\\${dirent.name}`
    );
    for await (let innerDirent of innerDir) {
      console.log(innerDirent.name);
    }*/
  }
}

//run();
dwada();
