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
CHERRY_API_KEY=YOUR_API_KEY
```

You can find your API key at https://www.cherrypush.com/user/settings

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

```
$ cherry run --help
Usage: cherry run [options]

Options:
  --owner <owner>        only consider given owner code
  --metric <metric>      only consider given metric
  -o, --output <output>  export stats into a local file
  -f, --format <format>  export format (json, sarif, sonar). default: json
  --quiet                reduce output to a minimum
  -h, --help             display help for command
```

When used without options, it logs all metrics for the current project:

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

To filter by multiple metrics, you can combine the different options such as:

```sh
cherry run --metric "todo" --metric "eslint"
```

Or filter by owner:

```sh
cherry run --owner @fwuensche
```

Or mix both:

```sh
cherry run --metric "Skipped tests" --owner @fwuensche
```

## cherry push

Your most used command. It submits your project stats to the online dashboard at cherrypush.com:

```
$ cherry push
Uploading 42 occurrences...
Response: { status: 'ok' }
Your dashboard is available at https://www.cherrypush.com/user/projects
```

## cherry backfill

Totally optional, but quite handy when you're just starting with Cherry.

This allows you to retroactively submit your project stats to the online dashboard at cherrypush.com.

```
$ cherry backfill --help
Usage: cherry backfill [options]

Options:
  --api-key <api_key>    Your cherrypush.com api key
  --since <since>        yyyy-mm-dd | The date at which the backfill will start (defaults to 90 days ago)
  --until <until>        yyyy-mm-dd | The date at which the backfill will stop (defaults to today)
  --interval <interval>  The number of days between backfills (defaults to 30 days)
  --quiet                reduce output to a minimum
  -h, --help             display help for command
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

You can run this command directly in your terminal to compare the current status of your branch if compared to the main
branch. Note that you must be working from a branch, and have all your changes committed.

```sh
cherry diff --metric="JS lines of code"
```

This command is specifically useful when you want to prevent specific patterns in your codebase.

When integrated to your CI, it will check the diff between the current commit and the base branch.

If there is an increase in the metric, it will raise an error, making the CI build fail.

```yml
name: cherry diff

on:
  pull_request:

jobs:
  cherry_diff:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout project
        uses: actions/checkout@v4

      - name: Install dependencies
        run: npm i -g cherrypush

      - name: Raise if new violations are introduced
        run: ./cli/bin/cherry.js diff --metric='eslint' --error-if-increase --quiet
```

# Integrations 🧩

## GitHub Actions

You can automate Cherry to submit reports on every commit to master.

For a basic use case, all you need is a workflow file as below:

```yml
# .github/workflows/cherry_push.yml

name: cherry push

on:
  push:
    branches: [main]

jobs:
  cherry_push:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout project
        uses: actions/checkout@v4
        with:
          fetch-depth: 2 // required to track contributions, i.e, the diff between commits

      - name: Install cherry
        run: npm i -g cherrypush

      - name: Push metrics
        run: cherry push --quiet --api-key=${{ secrets.CHERRY_API_KEY }}
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
    - cherry push --quiet

  only:
    refs:
      - main
```

# Configuration

## Permalink

Especially if you're using Cherry in a GitLab project, you might want to setup custom permalinks for your metrics.

You can do this by adding a `permalink` property to your configuration file, such as:

```js
// .cherry.js
module.exports = {
  project_name: 'cherrypush/cherry-cli',
  permalink: ({ filePath, lineNumber }) =>
    `https://gitlab.com/cherrypush/cherry-cli/blob/HEAD/${filePath}${lineNumber ? `#L${lineNumber}` : ''}`,
  plugins: { eslint: {} },
}
```

# Feedback 🙏

Any further question or suggestion?

- report a bug or suggest new features via [GitHub Issues](https://github.com/cherrypush/cherry-cli/issues)
- or shoot me a message on [twitter.com/fwuensche](https://twitter.com/fwuensche)
