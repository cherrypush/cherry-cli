# Easy installation 😌

```sh
npm install -g cherrypush
```

Create your `.cherry.js` configuration file:

```sh
cherry init
```

Add your API key into a `.env` file at the root of your project:

```env
CHERRY_API_KEY=16eo4cac-77a3-4005-a90b-eedcd3117b9f
```

# Running commands 🏃🏻‍♂️

## cherry run

Outputs stats for current commit. Useful for debugging your config file.

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

You can also filter occurrences by metrics and owners:

```sh
cherry run --metric=eslint --owner=@fwuensche,@rchoquet
```

## cherry push

Submits stats to cherrypush.com:

```sh
$ cherry push
Uploading 42 occurrences...
Response: { status: 'ok' }
Your dashboard is available at https://www.cherrypush.com/user/projects
```

## cherry backfill

Submits historic data to cherrypush.com:

```sh
$ cherry backfill --since=2023-01-01
```

If you want to limit to a certain date range you can provide an additional param:

```sh
$ cherry backfill --since=2023-01-01 --until=2022-01-07
```

If the date range is too wide, you might want to set a custom interval (defaults to 1 day):

```sh
$ cherry backfill --since=2023-01-01 --until=2023-12-01 --interval=30
```

# Integrating with GitHub Actions

You can easily automate Cherry to submit reports on every commit to master.

You just need to add create a `.github/workflows/cherry.yml` file with the following:

```
name: Upload codebase metrics to cherrypush.com

on:
  push:
    branches:
      - master

jobs:
  cherry:
    name: runner / cherry
    runs-on: ubuntu-22.04
    steps:
      - name: Checkout
        uses: actions/checkout@v3
        with:
          fetch-depth: 0
      - name: Install cherry
        run: npm i -g cherrypush
      - name: Push metrics
        run: cherry push --api-key=${{ secrets.CHERRY_API_KEY }}
```

# Live demo 🔴

If you'd like to see a live demo: https://www.cherrypush.com/demo

Have you found a bug? Report to us via https://twitter.com/@fwuensche or https://twitter.com/@r_chqt
