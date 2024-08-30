# Contributing to Cherry CLI

Thank you for considering contributing to Cherry CLI! We welcome contributions from the community and are excited to see
what you'll bring to the project.

## How to Report Issues

If you find a bug or have a feature request, please report it via
[GitHub Issues](https://github.com/cherrypush/cherry-cli/issues). When reporting an issue, please include as much detail
as possible to help us understand and resolve the problem.

## Running Tests

To run the full test suite, you can use the following command:

```bash
$ npm test
```

Note, however, that there's a lot to be improved in terms of testing. For instance, cherry diff tests won't pass if you
have currently uncommitted changes in your working directory. We need to come up with a better solution for tests, but I
don't have a clear answer to this issue yet. I'd appreciate any help on this matter.

## Development

The best place to get started is by taking a look at the bin/cherry.js file. This is the entry point for the CLI and
where you can find all the commands that Cherry CLI supports.

Once you've made your changes, you can test them by running the CLI directly from the project directory. For example, to
run the `run` command, you can use the following:

```bash
$ bin/cherry.js run
```

For more complex commands, you can use the `--help` flag to get more information about the available options or read the
README.md file for more detailed instructions.
