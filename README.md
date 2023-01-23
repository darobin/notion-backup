
# notion-backup

This is a very simple tool to export a workspace from [Notion](https://www.notion.so/), designed
to work as part of a GitHub workflow.

It reads `NOTION_TOKEN` and `NOTION_SPACE_ID` from the environment, and outputs the export to both
`html` and `markdown` directories in the current working directory, as well as to `html.zip` and
`markdown.zip`.

**NOTE**: if you log out of your account, the `NOTION_TOKEN` will get invalidated and this process
will fail. There isn't anything that I know of that I can do about that until Notion decide to add
a backup endpoint to their official API, at which point this will be able to use a proper
authentication token.

## Setup

This assumes you are looking to set this up to back up Notion to GitHub.

1. Create a repo for your backup. You probably want it private.
2. Get the `NOTION_TOKEN` and `NOTION_SPACE_ID` as explained in
  [this blog post](https://medium.com/@arturburtsev/automated-notion-backups-f6af4edc298d).
3. Set them as secrets in your GitHub repo.
4. Give Actions write access to your repository: `Settings` > `Actions` > `General` > `Workflow permissions` > choose `Read and write permissions`
5. Install the following under `.github/workflows/whatever.yml` in your repo.
6. Configure the frequency by changing the `cron` value. You can use [Crontab.guru](https://crontab.guru/#0_*/4_*_*_*).
7. Push and control your backup workflow from the `Actions` tab of your repository Github page.

```yaml
name: "Notion backup"

on:
  push:
    branches:
      - master
  schedule:
    -   cron: "0 */4 * * *"
    
  # Allows you to run this workflow manually from the Actions tab
  workflow_dispatch:

jobs:
  backup:
    runs-on: ubuntu-latest
    name: Backup
    timeout-minutes: 15
    steps:
      - uses: actions/checkout@v3

      - uses: actions/setup-node@v2
        with:
          node-version: '12'
          
      - name: Delete previous backup
        run: rm -rf markdown html *.zip

      - name: Setup dependencies
        run: npm install -g notion-backup

      - name: Run backup
        run: notion-backup
        env:
          NOTION_TOKEN: ${{ secrets.NOTION_TOKEN }}
          NOTION_SPACE_ID: ${{ secrets.NOTION_SPACE_ID }}
          NODE_OPTIONS: "--max-http-header-size 15000"

      - name: Delete zips
        run: rm -f *.zip

      - name: Commit changes
        run: |
          git config user.name github-actions
          git config user.email github-actions@github.com
          git add .
          git commit -m "Automated snapshot"
          git push
```

## LFS Support

You won't be able to backup files exceeding a size of 100MB unless you enable [Git LFS](https://git-lfs.github.com/). Add a file named `.gitattributes` at the root of your repository and add the following. If you want to support other file types, just add a new line for that file type.

```
*.zip filter=lfs diff=lfs merge=lfs -text
*.png filter=lfs diff=lfs merge=lfs -text
*.jpg filter=lfs diff=lfs merge=lfs -text
*.jpeg filter=lfs diff=lfs merge=lfs -text
*.psd filter=lfs diff=lfs merge=lfs -text
```
