# Changelog

## [1.3.0](https://github.com/cherrypush/cherry-cli/compare/v1.2.2...v1.3.0) (2023-12-02)


### Features

* allow cherry diff to take a json file as input ([451dcc7](https://github.com/cherrypush/cherry-cli/commit/451dcc70b368a4b4fc26f8c7b9d6577d74d81d19))

## 1.2.2 (2023-11-28)

### Features

- **cli:** add SARIF output ([#167](https://github.com/cherrypush/cherry-cli/issues/167))
  ([4c31c2b](https://github.com/cherrypush/cherry-cli/commit/4c31c2b70f76bcc59a3cc9292ac212705087cc56))

### Bug Fixes

- cannot delete metrics with charts
  ([ffbe57b](https://github.com/cherrypush/cherry-cli/commit/ffbe57b556faa73b03af4edb3fb43cd459057b9f))
- **cli:** declare p-limit as a direct dependency ([#44](https://github.com/cherrypush/cherry-cli/issues/44))
  ([2b2ddb4](https://github.com/cherrypush/cherry-cli/commit/2b2ddb4e4865fdff30d0efb123c6b4dbbf8880d8))
- contributions do not count total diff on metrics with groupByFile
  ([#80](https://github.com/cherrypush/cherry-cli/issues/80))
  ([39f1cd7](https://github.com/cherrypush/cherry-cli/commit/39f1cd7d3f952e6673e7c0279ec186fbf6ba4c9b))
- count by metric when value is zero
  ([c032b23](https://github.com/cherrypush/cherry-cli/commit/c032b23eec5ca138c68aa62f95a6e4855f08d4e2))
- deprecated capabilities on capybara driver
  ([6622eab](https://github.com/cherrypush/cherry-cli/commit/6622eab83da0b912a872c6dfefba08357057f083))
- do not deliver weekly reports to users who opted out
  ([750e3af](https://github.com/cherrypush/cherry-cli/commit/750e3aff4b3bb9b68fc687b73fafb1fb62b4d220))
- handle deleted users when creating notifications
  ([86fe3db](https://github.com/cherrypush/cherry-cli/commit/86fe3db94bf33c4eeb42c1e79c20548400be82c5))
- metrics with no occurrences should get down to zero ([#158](https://github.com/cherrypush/cherry-cli/issues/158))
  ([96b688f](https://github.com/cherrypush/cherry-cli/commit/96b688f102266ba21f1d0df86bc70785786f145d))
- occurrences were not filtering based on owners
  ([4498e21](https://github.com/cherrypush/cherry-cli/commit/4498e2110ce440f23c54a1f7777659bd196d1b33))
- remove from favorites
  ([38493f0](https://github.com/cherrypush/cherry-cli/commit/38493f092f132bfbb9b35dbe7c7a19729196fd76))
- report should add up to previous values
  ([cc137df](https://github.com/cherrypush/cherry-cli/commit/cc137dffc53fe55bb6ec0b176027743b5b65813a))
- users should be able to delete metrics from the organizations they belong to
  ([3d50395](https://github.com/cherrypush/cherry-cli/commit/3d50395805d1e1edfcdd49ac1ba1d88199dfb42b))
- users should see other users belonging to same org
  ([9a4a495](https://github.com/cherrypush/cherry-cli/commit/9a4a495388534bf8de98933ac1ef1eabfb06c6d6))

### Miscellaneous Chores

- release 1.2.2 ([d7392eb](https://github.com/cherrypush/cherry-cli/commit/d7392eb2ea45ca9c6db5cee37187f27d593404b2))
