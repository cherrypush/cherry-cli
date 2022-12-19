# Installation

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

You're done! 🎉

# Usage

## The `run` command

To get the stats for all metrics inside your `.cherry.js` file:

```sh
cherry run
```

And it should output a table with the number of occurrences per metric:

```json
┌─────────┬────────┐
│ (index) │ Values │
├─────────┼────────┤
│  todo   │   16   │
│  fixme  │   12   │
│ rubocop │    1   │
│ eslint  │   13   │
└─────────┴────────┘
```

### Filter by `--owner`

To filter by CODEOWNERS, just provide a comma-separated list of owners:

```sh
cherry run --owner=@fwuensche,@rchoquet
```

### Filter by `--metric`

To filter by metric:

```sh
cherry run --metric=eslint
```

## The `push` command

To submit a report:

```sh
cherry push
```

And you should see the following output:

```sh
Uploading 42 occurrences...
Response: { status: 'ok' }
Your dashboard is available at https://www.cherrypush.com/user/projects
```

## The `backfill` command

To create reports for previous dates, the only mandatory option is `since`:

```sh
cherry backfill --since=2023-01-01
```

If you want to limit to a certain date range you can provide an additional param:

```sh
cherry backfill --since=2023-01-01 --until=2022-01-07
```

If the date range is too wide, you might want to set a custom interval (defaults to 1 day):

```sh
cherry backfill --since=2023-01-01 --until=2023-12-01 --interval=30
```

# Demo

The above commands are everything you could learn about the `cherry` CLI.

If you want to see a demo of what it looks like in practice, take a look at the Open Projects section available at https://www.cherrypush.com/projects.

And if you see opportunities for improvement, don't hesitate to submit constructive feedback via twitter to https://twitter.com/@fwuensche or https://twitter.com/r_chqt
