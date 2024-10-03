
**⚠️⚠️⚠️ I am no longer maintaining this. ⚠️⚠️⚠️** I stopped using Notion, I don't like the direction that the product is headed in
and I got tired of having to constantly fight the API just to get my own data back. I have switched to Obsidian and don't plan on
looking back. You may, of course, still use this tool but I am not actively maintaining it. I will review PRs, slowly.

If someone with credible experience wants to take it over, please let me know.

# notion-backup

This is a very simple tool to export a workspace from [Notion](https://www.notion.so/), designed
to work as part of a GitHub workflow.

It reads `NOTION_TOKEN` and `NOTION_SPACE_ID` from the environment, and outputs the export to both
`html` and `markdown` directories in the current working directory, as well as to `html.zip` and
`markdown.zip`.

## Obtaining tokens

Automatically downloading backups from Notion requires two unique authentication tokens and your individual space ID which must be obtained for the script to work.

1. Log into your Notion account in your browser of choice if you haven't done so already.
2. Open a new tab in your browser and open the development tools. This is usually easiest done by right-click and selecting `Inspect Element` (Chrome, Edge, Safari) or `Inspect` (Firefox). Switch to the Network tab.
3. Open https://notion.so/f/. You must use this specific subdirectory to obtain the right cookies.
4. Insert `getSpaces` into the search filter of the Network tab. This should give you one result. Click on it.
5. In the Preview tab, look for the key `space`. There you should find a list of all the workspaces you have access to. Unless you're part of shared workspaces there should only be one.
6. Copy the UUID of the workspace you want to backup (e.g. `6e560115-7a65-4f65-bb04-1825b43748f1`). This is your `NOTION_SPACE_ID`.
6. Switch to the Application (Chrome, Edge) or Storage (Firefox, Safari) tab on the top.
7. In the left sidebar, select `Cookies` -> `https://www.notion.so` (Chrome, Edge, Firefox) or `Cookies – https://www.notion.so` (Safari).
8. Copy the value of `token_v2` as your `NOTION_TOKEN` and the value of `file_token` as your `NOTION_FILE_TOKEN`.
9. Set the three environment variables as secrets for actions in your GitHub repository.

**NOTE**: if you log out of your account or your session expires naturally, the `NOTION_TOKEN` and `NOTION_FILE_TOKEN` will get invalidated and the backup will fail. In this case you need to obtain new tokens by repeating this process. There is currently no practical way to automize this until Notion decide to add a backup endpoint to their official API, at which point this script will be able to use a proper authentication token.

## Setup

This assumes you are looking to set this up to back up Notion to GitHub.

1. Obtain the required values for the environment variables as explained above.
2. Create a repo for your backup. You probably want it private.
3. Set the `NOTION_TOKEN`, `NOTION_FILE_TOKEN` and `NOTION_SPACE_ID` environment variables as secrets in your GitHub repo.
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
          node-version: '18'

      - name: Delete previous backup
        run: rm -rf markdown html *.zip

      - name: Setup dependencies
        run: npm install -g notion-backup

      - name: Run backup
        run: notion-backup
        env:
          NOTION_TOKEN: ${{ secrets.NOTION_TOKEN }}
          NOTION_FILE_TOKEN: ${{ secrets.NOTION_FILE_TOKEN }}
          NOTION_SPACE_ID: ${{ secrets.NOTION_SPACE_ID }}
          NODE_OPTIONS: "--max-http-header-size 15000"

      - name: Delete zips
        run: |
          rm -f *.zip
          rm -f markdown/*-Part*.zip
          rm -f html/*-Part*.zip

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

## AWS S3 Support

Due to LFS storage constraints (batch response: This repository is over its data quota. Account responsible for LFS bandwidth should purchase more data packs to restore access.), we can't store the backup file on LFS. To solve this problem, you can store Notion export files on AWS S3.
Before using this workflow, please create an S3 bucket, an IAM User with Allow S3 PutObject policy(Please ref "AWS S3 IAM Policy" Section), and an IAM User Access key. After creating the S3 bucket and IAM User, add `AWS_S3_BUCKET_NAME`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, and `AWS_DEFAULT_REGION` to github Actions secrets and variables.

### Workflow file
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

env:
  AWS_S3_BUCKET_NAME: ${{ secrets.AWS_S3_BUCKET_NAME }}
  AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
  AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
  AWS_DEFAULT_REGION: ${{ secrets.AWS_DEFAULT_REGION }}

jobs:
  backup:
    runs-on: ubuntu-latest
    name: Backup
    timeout-minutes: 120
    steps:
      - uses: actions/checkout@v3

      - uses: actions/setup-node@v2
        with:
          node-version: '18'

      - name: Delete previous backup
        run: rm -rf markdown html *.zip

      - name: Setup dependencies
        run: npm install -g notion-backup
        
      - name: install awscli
        id: install-aws-cli
        uses: unfor19/install-aws-cli-action@master
        with:
          version: 2

      - name: Run backup
        run: notion-backup
        env:
          NOTION_TOKEN: ${{ secrets.NOTION_TOKEN }}
          NOTION_FILE_TOKEN: ${{ secrets.NOTION_FILE_TOKEN }}
          NOTION_SPACE_ID: ${{ secrets.NOTION_SPACE_ID }}
          NODE_OPTIONS: "--max-http-header-size 15000"
          
      - name: Upload to S3
        if: "${{ env.AWS_ACCESS_KEY_ID != '' }}"
        run: |
          aws s3 cp . s3://$AWS_S3_BUCKET_NAME/ --recursive --exclude "*" --include "*.zip"

      - name: Delete zips 
        if: "${{ env.AWS_ACCESS_KEY_ID == '' }}"
        run: |
          rm -f *.zip
          rm -f markdown/*-Part*.zip
          rm -f html/*-Part*.zip

      - name: Commit changes
        if: "${{ env.AWS_ACCESS_KEY_ID == '' }}"
        run: |
          git config user.name github-actions
          git config user.email github-actions@github.com
          git add .
          git commit -m "Automated snapshot"
          git push
```
### AWS S3 IAM Policy
```json
{
	"Version": "2012-10-17",
	"Statement": [
		{
			"Sid": "VisualEditor0",
			"Effect": "Allow",
			"Action": [
				"s3:PutObject"
			],
			"Resource": [
				"arn:aws:s3:::<Your S3 Bucket Name>",
				"arn:aws:s3:::<Your S3 Bucket Name>/*"
			]
		}
	]
}
```
