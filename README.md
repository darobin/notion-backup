
# notion-backup

This is a very simple tool to export a workspace from [Notion](https://www.notion.so/), designed
to work as part of a GitHub workflow.

It reads `NOTION_TOKEN` and `NOTION_SPACE_ID` from the environment, and outputs the export to both
`html` and `markdown` directories in the current working directory, as well as to `html.zip` and
`markdown.zip`.

## Setup

This assumes you are looking to set this up to back up Notion to GitHub.

1. Create a repo for your backup. You probably want it private.
2. Get the `NOTION_TOKEN` and `NOTION_SPACE_ID` as explained in
  [this blog post](https://medium.com/@arturburtsev/automated-notion-backups-f6af4edc298d).
3. Set them as secrets in your GitHub repo.
4. Install the following under `.github/workflows/whatever.yml` in your repo.

```yaml
name: "Notion backup"

on:
  push:
    branches:
      - master
  schedule:
    -   cron: "0 */4 * * *"

jobs:
  backup:
    runs-on: ubuntu-latest
    name: Backup
    timeout-minutes: 15
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '12'
      - name: Setup dependencies
        run: npm install -g notion-backup

      - name: Run backup
        run: notion-backup
        env:
          NOTION_TOKEN: ${{ secrets.NOTION_TOKEN }}
          NOTION_SPACE_ID: ${{ secrets.NOTION_SPACE_ID }}
      
      - name: Delete zips
        run: rm -f *.zip
        
      - name: Rename HTML
        run: mv html docs

      - name: Commit changes
        uses: elstudio/actions-js-build/commit@v3
        with:
          commitMessage: Automated snapshot
```
