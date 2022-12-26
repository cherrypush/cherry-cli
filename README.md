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

```json
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

# Live demo 🔴

The above commands are everything you could learn about the `cherry` CLI.

If you want to see a demo of what it looks like in practice, take a look at the Open Projects section available at https://www.cherrypush.com/projects.

And if you see opportunities for improvement, don't hesitate to submit constructive feedback via twitter to https://twitter.com/@fwuensche or https://twitter.com/@r_chqt
