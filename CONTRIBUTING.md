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

## Releasing a new version

We're using (release-please)[https://github.com/googleapis/release-please] to automate the release process, so we need
to follow a few guidelines when creating pull requests. In short, release Please assumes you are using Conventional
Commit messages and most important prefixes you should have in mind are:

- fix: which represents bug fixes, and correlates to a SemVer patch.
- feat: which represents a new feature, and correlates to a SemVer minor. -feat!:, or fix!:, refactor!:, etc., which
  represent a breaking change (indicated by the !) and will result in a SemVer major.

Also note that:

- release-please will only create a new release if the pull request contains a "releasable unit".
  - a releasable unit is a commit with one of the following prefixes: "feat", "fix", and "deps".
  - a "chore" or "build" commit, for instance, is not considered a releasable unit.

If you name your pull requests accordingly, release-please will automatically create a new release PR. Once merged, an
automatic workflow will create a new release and publish the package to npm.

If you're interested in the setup, you can check the following files:

- release-please-config.json
- .github/workflows/release-please.yml
