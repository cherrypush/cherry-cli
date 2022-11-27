# Installation

```sh
npm install -g cherrypush
```

# Usage

Create your `.cherry.js` configuration file:

```sh
cherry init
```

Check if everything is working properly:

```sh
cherry run
```

You should see a list of occurences matching the rules in your `.cherry.js` configuration file:

```json
[
  {
    "commit_sha": "master",
    "file_path": "bin/cherry.js",
    "line_number": 8,
    "line_content": "const API_BASE_URL = 'http://localhost:3000/api' // TODO: convert to production url",
    "repo": "cherrypush/cherry-cli",
    "owners": [],
    "metric_name": "todos"
  }
]
```

Submit the latest occurrences to your cherry server:

```sh
cherry push
```

```sh
Uploading 12 occurrences...
Response: { status: 'ok' }
```
