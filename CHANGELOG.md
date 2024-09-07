# Changelog

## [1.12.0](https://github.com/cherrypush/cherry-cli/compare/v1.11.0...v1.12.0) (2024-09-07)


### Features

* handle https remotes when trying to guess project name ([#73](https://github.com/cherrypush/cherry-cli/issues/73)) ([a254986](https://github.com/cherrypush/cherry-cli/commit/a2549866f083d23828dd158cd4f9ac37bcf04858))

## [1.11.0](https://github.com/cherrypush/cherry-cli/compare/v1.10.0...v1.11.0) (2024-09-06)


### Features

* filter out metrics for cherry diff (part 2) ([36024aa](https://github.com/cherrypush/cherry-cli/commit/36024aa2bcbde6ee1cd52a944e674e48aef8b3b7))

## [1.10.0](https://github.com/cherrypush/cherry-cli/compare/v1.9.2...v1.10.0) (2024-09-05)


### Features

* filter out metrics for cherry diff ([#68](https://github.com/cherrypush/cherry-cli/issues/68)) ([12189df](https://github.com/cherrypush/cherry-cli/commit/12189dfd715ac1260d30c6733884cc66659ebf2a))

## [1.9.2](https://github.com/cherrypush/cherry-cli/compare/v1.9.1...v1.9.2) (2024-09-05)


### Bug Fixes

* add registry url to setup node step ([2157ef0](https://github.com/cherrypush/cherry-cli/commit/2157ef0d9b85ac6b4661132899616fc356efd379))
* automate package publishing ([#64](https://github.com/cherrypush/cherry-cli/issues/64)) ([6e4a420](https://github.com/cherrypush/cherry-cli/commit/6e4a4203277f6532cff6961357ed6ed698a57c2e))

## [1.9.1](https://github.com/cherrypush/cherry-cli/compare/v1.9.0...v1.9.1) (2024-09-05)


### Bug Fixes

* automation to release package ([#62](https://github.com/cherrypush/cherry-cli/issues/62)) ([a6ba9d7](https://github.com/cherrypush/cherry-cli/commit/a6ba9d731eb59f37eab284232b12f3c7bfddf1f6))

## [1.9.0](https://github.com/cherrypush/cherry-cli/compare/v1.8.0...v1.9.0) (2024-09-05)


### Features

* update madge (used for jsCircularDependencies plugin) ([#60](https://github.com/cherrypush/cherry-cli/issues/60)) ([7bf126a](https://github.com/cherrypush/cherry-cli/commit/7bf126ab5e734f393ae466d84ab3b0161592c9a0))

## [1.8.0](https://github.com/cherrypush/cherry-cli/compare/v1.7.0...v1.8.0) (2024-08-30)


### Features

* automatically publish npm package when release please pr is merged ([7bdfaf2](https://github.com/cherrypush/cherry-cli/commit/7bdfaf26bd5c1f1e65e28f394b29952845ad48cc))

## [1.7.0](https://github.com/cherrypush/cherry-cli/compare/v1.6.0...v1.7.0) (2024-08-30)


### Features

* allow to provide multiple metrics to cherry run ([#56](https://github.com/cherrypush/cherry-cli/issues/56)) ([8350602](https://github.com/cherrypush/cherry-cli/commit/8350602a4ed5deef2025dfdd402c890bf6916e0f))

## [1.6.0](https://github.com/cherrypush/cherry-cli/compare/v1.5.0...v1.6.0) (2024-07-01)


### Features

* **performance-alerts:** WIP ([#51](https://github.com/cherrypush/cherry-cli/issues/51)) ([6c9ae5f](https://github.com/cherrypush/cherry-cli/commit/6c9ae5f6d7c2e63513064db2796837d59673c0e2))


### Bug Fixes

* checkout merge base for cherry diff ([#37](https://github.com/cherrypush/cherry-cli/issues/37)) ([db1106b](https://github.com/cherrypush/cherry-cli/commit/db1106bcff3792946ea0e7abc75e67506cd8bee7))

## [1.5.0](https://github.com/cherrypush/cherry-cli/compare/v1.4.0...v1.5.0) (2023-12-16)


### Features

* make cherry diff agnostic from cherrypush.com  ([#31](https://github.com/cherrypush/cherry-cli/issues/31)) ([63bb651](https://github.com/cherrypush/cherry-cli/commit/63bb65126dc3b65dd822f930a13a03fcf25355d7))

## [1.4.0](https://github.com/cherrypush/cherry-cli/compare/v1.3.0...v1.4.0) (2023-12-02)

### Features

- allow cherry commands to be run in quiet mode ([#27](https://github.com/cherrypush/cherry-cli/issues/27))
  ([7ec5cd0](https://github.com/cherrypush/cherry-cli/commit/7ec5cd0e4ff225db80f9058f85a599f56a01f684))

## [1.3.0](https://github.com/cherrypush/cherry-cli/compare/v1.2.2...v1.3.0) (2023-12-02)

### Features

- allow cherry diff to take a json file as input
  ([451dcc7](https://github.com/cherrypush/cherry-cli/commit/451dcc70b368a4b4fc26f8c7b9d6577d74d81d19))

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
