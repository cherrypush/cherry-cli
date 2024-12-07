# Initial Setup ⚡️

## 1. Install the CLI

```
npm install -g cherrypush
```

## 2. Initialize Cherry

Go to your project’s root directory and run:

```
cherry init
```

This command creates a `.cherry.js` configuration file tailored to your repository, as well as a GitHub Actions workflow
file to automate the submission of your metrics.

## 3. Add Your API Key

Create a `.env` file in your project’s root directory and add:

```
CHERRY_API_KEY={{YOUR_API_KEY}}
```

You can find your API key by visiting [your Cherry account settings](https://www.cherrypush.com/user/settings).

With that, you’re ready to start tracking your codebase metrics!

# CLI Commands 😌

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

# Configuration 🛠

Your configuration file `.cherry.js` is where you define your project's metrics and plugins.

Here's a kind of self-explanatory example:

```js
module.exports = {
  project_name: 'cherrypush/cherry-cli',
  plugins: { loc: {}, eslint: {} },
  metrics: [
    // Classic metrics allow you to rely on patterns to include, exclude, and group results by file:
    {
      name: 'TODO/FIXME',
      pattern: /(TODO|FIXME):/i, // the i flag makes the regex case insensitive
    },
    // You can include and exclude files using glob patterns:
    {
      name: 'Skipped tests',
      pattern: /@skip/,
      include: '**/*.test.{ts,tsx}', // Will only include test files, ignoring everything else
    },
    // You can also group results by file to avoid the noise of having too many occurrences in the same file:
    {
      name: '[TypeScript Migration] TS lines of code',
      include: '**/*.{ts,tsx}',
      exclude: '**/*.test.{ts,tsx}', // Exclude test files if you want to focus on the source code
      groupByFile: true, // Group results by file
    },
    // If you need more customization, you can use the eval function to implement your own custom metrics using JavaScript.
    {
      name: 'Runtime per test file in seconds',
      eval: () => getTestDurations().map(([filePath, duration]) => ({ text: filePath, value: duration, filePath })),
    },
  ],
}
```

If you prefer a more detailed structure, here's a breakdown of the configuration object and its properties:

| Property                  | Type                                                        | Description                                                                                                                                                                                                                                                                                                                                      |
| ------------------------- | ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `project_name`            | `string`                                                    | **Required.** The name of your project.                                                                                                                                                                                                                                                                                                          |
| `$.permalink`             | `({filePath: string, lineNumber: number}) => string`        | **Optional.** A function that returns a custom permalink for your metrics. Provides an object with the `filePath` and `lineNumber` so you can use them to build your URL pattern. This is especiallly useful if you use anything other than GitHub for source control, in which case you might want to setup custom permalinks for your metrics. |
| `$.plugins`               | `object`                                                    | **Optional.** An object containing the plugins to activate.                                                                                                                                                                                                                                                                                      |
| `$.plugins.plugin`        | `object`                                                    | **Required.** Each plugin must provide an options object (even if empty).                                                                                                                                                                                                                                                                        |
| `$.metrics`               | `object[]`                                                  | **Required.** An array of objects defining the metrics to track.                                                                                                                                                                                                                                                                                 |
| `$.metrics[].name`        | `string`                                                    | **Required.** The name of the metric (e.g., `'[TS Migration] TS lines of code'`).                                                                                                                                                                                                                                                                |
| `$.metrics[].include`     | `string` (glob)                                             | **Optional.** Glob pattern for files to include (e.g., `'**/*.{ts,tsx}'`).                                                                                                                                                                                                                                                                       |
| `$.metrics[].exclude`     | `string` (glob)                                             | **Optional.** Glob pattern for files to exclude (e.g., `'**/*.test.{ts,tsx}'`).                                                                                                                                                                                                                                                                  |
| `$.metrics[].groupByFile` | `boolean`                                                   | **Optional.** Whether to group results by file. Defaults to `false`.                                                                                                                                                                                                                                                                             |
| `$.metrics[].eval`        | `() => ({ text: string, value: number, filePath: string })` | **Optional.** Use eval to implement your own custom metrics using JavaScript. As long as you return a valid format of occurrence, you're good to go.                                                                                                                                                                                             |

This structure should now be clearer, but there are some additional hidden features (especially concerning evals) that I
preferred to keep out of the documentation to keep it simple. If you're interested, let me know and I'll create a
dedicated folder with further examples and explanations.

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

# Feedback 💌

We’d love to hear from you! If you find a bug or have a suggestion, please open an issue on our
[GitHub Issues](https://github.com/cherrypush/cherry-cli/issues). Your input is what makes Cherry better for everyone.
