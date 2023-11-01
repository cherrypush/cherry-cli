# Initial setup ⚡️

Install the CLI globally with:

```sh
npm install -g cherrypush
```

Inside the root of your project, initialize your cherry configuration:

```sh
cherry init
```

Add your API key into a .env file at the root of your project:

```sh
CHERRY_API_KEY=find-your-api-key-here
```

# CLI commands 😌

## cherry init

The init command will initialize your config file `.cherry.js` and create a sample GitHub workflow file that you can use
to integrate Cherry to your CI/CD workflow via GitHub Actions.

A very minimal config file can look something like this:

```js
module.exports = {
  project_name: 'PROJECT_NAME',
  plugins: ['loc'],
  metrics: [
    {
      name: 'TODO/FIXME',
      pattern: /(TODO|FIXME):/i, // the i flag makes the regex case insensitive
    },
  ],
}
```

For more info about CI/CD integration, refer to the Integrations section below.

## cherry run

The run command accepts a couple of different options:

```sh
cherry run [--metric=<metric>] [--owner=<owners>]
```

When used without options, it logs ALL metric stats for your project:

```sh
$ cherry run
┌─────────┬────────┐
│ (index) │ Values │
├─────────┼────────┤
│  todo   │   16   │
│  fixme  │   12   │
│ rubocop │    1   │
│ eslint  │   13   │
└─────────┴────────┘
```

To filter metrics, you can combine the different options such as:

```sh
cherry run --metric="Skipped tests"
```

```sh
cherry run --owner=@fwuensche,@rchoquet
```

```sh
cherry run --metric="Skipped tests" --owner=@fwuensche,@rchoquet
```

## cherry push

Your most used command. It submits current project stats to cherrypush.com:

```sh
$ cherry push
Uploading 42 occurrences...
Response: { status: 'ok' }
Your dashboard is available at https://www.cherrypush.com/user/projects
```

## cherry backfill

Totally optional. This will submit your historic data to cherrypush.com:

```sh
cherry backfill [--since=<date>] [--until=<date>] [--interval=<days>]
--since will default to a month ago
--until will default to today
--interval will default to 1 day
```

Use the options to customize the dates you want to generate reports for:

```sh
cherry backfill --since=2023-01-01 --until=2022-01-07
```

If the range is too wide, increase your interval to save time:

```sh
cherry backfill --since=2023-01-01 --until=2023-12-01 --interval=30
```

## cherry diff

You can run this command directly in your terminal to compare the current status of a certain metric to the last
reported status on cherrypush.com.

```sh
cherry diff --metric="JS lines of code"
```

This command is specifically useful when you want to enforce blocking certain patterns in your codebase.

It will check the diff between the current commit and the previous one. If there is an increase in your metric, it will
raise an error, making the CI build fail.

```yml
name: Block the introduction of new violations

on:
  pull_request:

jobs:
  cherry_diff:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout repo
        uses: actions/checkout@v3

      - name: Install dependencies
        run: npm i -g cherrypush

      - name: Raise if new JS code added
        run: ./cli/bin/cherry.js diff --metric='todo' --api-key=${{ secrets.CHERRY_API_KEY }} --error-if-increase
```

# Integrations 🧩

## GitHub Actions

You can automate Cherry to submit reports on every commit to master.

For a basic use case, all you need is a workflow file as below:

```yml
# .github/workflows/cherry_push.yml

name: Track codebase metrics

on:
  push:
    branches:
      - main

jobs:
  cherry_push:
    runs-on: ubuntu-latest
    env:
      CHERRY_API_KEY: ${{ secrets.CHERRY_API_KEY }}

    steps:
      - name: Checkout project
        uses: actions/checkout@v3
        with:
          fetch-depth: 2 // required to track contributions, i.e, the diff between commits

      - name: Install cherry
        run: npm i -g cherrypush

      - name: Push metrics
        run: cherry push --api-key=${{ secrets.CHERRY_API_KEY }}
```

## GitLab CI/CD

Same as with GitHub Actions, but for GitLab. A minimalist example:

```yml
# .gitlab-ci.yml

cherry_push:
  stage: build
  image: node:latest
  variables:
    CHERRY_API_KEY: $CHERRY_API_KEY

  script:
    - npm i -g cherrypush
    - git checkout $CI_COMMIT_REF_NAME
    - cherry push

  only:
    refs:
      - main
```

# Live demo 🔴

To see what Cherry looks like in a real project, you can refer to our own project here: https://www.cherrypush.com/demo

Found a bug? Report directly to me via Twitter or email.
