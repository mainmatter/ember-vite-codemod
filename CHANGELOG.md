# Changelog

## Release (2025-03-20)

ember-vite-codemod 0.11.0 (minor)

#### :rocket: Enhancement
* `ember-vite-codemod`
  * [#68](https://github.com/mainmatter/ember-vite-codemod/pull/68) bump minimum version of @embroider/compat ([@mansona](https://github.com/mansona))
  * [#60](https://github.com/mainmatter/ember-vite-codemod/pull/60) Enable ember 3.28 ([@mansona](https://github.com/mansona))
  * [#56](https://github.com/mainmatter/ember-vite-codemod/pull/56) enable testing for 4.4 ([@mansona](https://github.com/mansona))

#### Committers: 1
- Chris Manson ([@mansona](https://github.com/mansona))

## Release (2025-03-18)

ember-vite-codemod 0.10.0 (minor)

#### :rocket: Enhancement
* `ember-vite-codemod`
  * [#63](https://github.com/mainmatter/ember-vite-codemod/pull/63) Remove `@embroider/webpack` + don't report `@embroider/macros` and `@embroider/util` ([@BlueCutOfficial](https://github.com/BlueCutOfficial))
  * [#54](https://github.com/mainmatter/ember-vite-codemod/pull/54) enable testing for 4.8 ([@mansona](https://github.com/mansona))
  * [#53](https://github.com/mainmatter/ember-vite-codemod/pull/53) enable testing for ember 4.12 ([@mansona](https://github.com/mansona))

#### :bug: Bug Fix
* `ember-vite-codemod`
  * [#52](https://github.com/mainmatter/ember-vite-codemod/pull/52) Throw error when modulePrefix does not match package.json#name ([@NullVoxPopuli](https://github.com/NullVoxPopuli))

#### :house: Internal
* `ember-vite-codemod`
  * [#59](https://github.com/mainmatter/ember-vite-codemod/pull/59) split CI by ember version ([@mansona](https://github.com/mansona))
  * [#57](https://github.com/mainmatter/ember-vite-codemod/pull/57) add a --environment=production test ([@mansona](https://github.com/mansona))

#### Committers: 3
- Chris Manson ([@mansona](https://github.com/mansona))
- Marine Dunstetter ([@BlueCutOfficial](https://github.com/BlueCutOfficial))
- [@NullVoxPopuli](https://github.com/NullVoxPopuli)

## Release (2025-03-14)

ember-vite-codemod 0.9.0 (minor)

#### :rocket: Enhancement
* `ember-vite-codemod`
  * [#24](https://github.com/mainmatter/ember-vite-codemod/pull/24) enable tests for Ember 5.4 ([@mansona](https://github.com/mansona))

#### Committers: 1
- Chris Manson ([@mansona](https://github.com/mansona))

## Release (2025-03-14)

ember-vite-codemod 0.8.0 (minor)

#### :rocket: Enhancement
* `ember-vite-codemod`
  * [#15](https://github.com/mainmatter/ember-vite-codemod/pull/15) bump minimum embroider versions and enable testing for ember-5.8 ([@mansona](https://github.com/mansona))

#### :house: Internal
* `ember-vite-codemod`
  * [#51](https://github.com/mainmatter/ember-vite-codemod/pull/51) add fail-fast: false to CI matrix ([@mansona](https://github.com/mansona))
  * [#49](https://github.com/mainmatter/ember-vite-codemod/pull/49) split out webpack and typescript tests properly ([@mansona](https://github.com/mansona))

#### Committers: 1
- Chris Manson ([@mansona](https://github.com/mansona))

## Release (2025-03-13)

ember-vite-codemod 0.7.0 (minor)

#### :rocket: Enhancement
* `ember-vite-codemod`
  * [#47](https://github.com/mainmatter/ember-vite-codemod/pull/47) Add `ember-template-imports` to packagesToRemove ([@johanrd](https://github.com/johanrd))

#### Committers: 1
- [@johanrd](https://github.com/johanrd)

## Release (2025-03-12)

ember-vite-codemod 0.6.0 (minor)

#### :rocket: Enhancement
* `ember-vite-codemod`
  * [#37](https://github.com/mainmatter/ember-vite-codemod/pull/37) Support transforming files with any extension ([@NullVoxPopuli](https://github.com/NullVoxPopuli))

#### Committers: 1
- [@NullVoxPopuli](https://github.com/NullVoxPopuli)

## Release (2025-03-11)

ember-vite-codemod 0.5.0 (minor)

#### :rocket: Enhancement
* `ember-vite-codemod`
  * [#39](https://github.com/mainmatter/ember-vite-codemod/pull/39) make sure the codemod doesn't exit if it comes across private packages ([@mansona](https://github.com/mansona))

#### Committers: 1
- Chris Manson ([@mansona](https://github.com/mansona))

## Release (2025-03-10)

ember-vite-codemod 0.4.1 (patch)

#### :bug: Bug Fix
* `ember-vite-codemod`
  * [#35](https://github.com/mainmatter/ember-vite-codemod/pull/35) move recast to a dependency ([@mansona](https://github.com/mansona))

#### Committers: 1
- Chris Manson ([@mansona](https://github.com/mansona))

## Release (2025-03-07)

ember-vite-codemod 0.4.0 (minor)

#### :rocket: Enhancement
* `ember-vite-codemod`
  * [#27](https://github.com/mainmatter/ember-vite-codemod/pull/27) Support apps building with @embroider/webpack ([@BlueCutOfficial](https://github.com/BlueCutOfficial))

#### :house: Internal
* `ember-vite-codemod`
  * [#33](https://github.com/mainmatter/ember-vite-codemod/pull/33) Remove devDep portfinder ([@BlueCutOfficial](https://github.com/BlueCutOfficial))
  * [#31](https://github.com/mainmatter/ember-vite-codemod/pull/31) start testing vite dev mode with testem ([@mansona](https://github.com/mansona))
  * [#30](https://github.com/mainmatter/ember-vite-codemod/pull/30) refactor tests to be easier to follow ([@mansona](https://github.com/mansona))

#### Committers: 2
- Chris Manson ([@mansona](https://github.com/mansona))
- Marine Dunstetter ([@BlueCutOfficial](https://github.com/BlueCutOfficial))

## Release (2025-03-05)

ember-vite-codemod 0.3.0 (minor)

#### :rocket: Enhancement
* `ember-vite-codemod`
  * [#26](https://github.com/mainmatter/ember-vite-codemod/pull/26) Add ember-composable-helpers and ember-cli-mirage to unsupported deps ([@BlueCutOfficial](https://github.com/BlueCutOfficial))

#### Committers: 1
- Marine Dunstetter ([@BlueCutOfficial](https://github.com/BlueCutOfficial))

## Release (2025-02-27)

ember-vite-codemod 0.2.0 (minor)

#### :rocket: Enhancement
* `ember-vite-codemod`
  * [#21](https://github.com/mainmatter/ember-vite-codemod/pull/21) Support Ember 5.12 (by updating packages) ([@BlueCutOfficial](https://github.com/BlueCutOfficial))

#### :house: Internal
* `ember-vite-codemod`
  * [#19](https://github.com/mainmatter/ember-vite-codemod/pull/19) Enable testing for Ember 5.12 ([@mansona](https://github.com/mansona))
  * [#22](https://github.com/mainmatter/ember-vite-codemod/pull/22) ignore changelog for linting ([@mansona](https://github.com/mansona))

#### Committers: 2
- Chris Manson ([@mansona](https://github.com/mansona))
- Marine Dunstetter ([@BlueCutOfficial](https://github.com/BlueCutOfficial))

## Release (2025-02-27)

ember-vite-codemod 0.1.0 (minor)

#### :rocket: Enhancement
* `ember-vite-codemod`
  * [#17](https://github.com/mainmatter/ember-vite-codemod/pull/17) Add `/tmp/` at to the top of .gitignore if not found ([@BlueCutOfficial](https://github.com/BlueCutOfficial))
  * [#18](https://github.com/mainmatter/ember-vite-codemod/pull/18) Iterate on ensure-v2-addon task ([@BlueCutOfficial](https://github.com/BlueCutOfficial))
  * [#16](https://github.com/mainmatter/ember-vite-codemod/pull/16) Check if the repository is clean ([@BlueCutOfficial](https://github.com/BlueCutOfficial))
  * [#10](https://github.com/mainmatter/ember-vite-codemod/pull/10) Implement each stage of the codemod ([@BlueCutOfficial](https://github.com/BlueCutOfficial))
  * [#2](https://github.com/mainmatter/ember-vite-codemod/pull/2) Initial basic implementation - adding missing files ([@mansona](https://github.com/mansona))

#### :memo: Documentation
* `ember-vite-codemod`
  * [#14](https://github.com/mainmatter/ember-vite-codemod/pull/14) Add a README.md ([@BlueCutOfficial](https://github.com/BlueCutOfficial))

#### :house: Internal
* `ember-vite-codemod`
  * [#11](https://github.com/mainmatter/ember-vite-codemod/pull/11) add a basic CI ([@mansona](https://github.com/mansona))
  * [#12](https://github.com/mainmatter/ember-vite-codemod/pull/12) set up release-plan ([@mansona](https://github.com/mansona))

#### Committers: 2
- Chris Manson ([@mansona](https://github.com/mansona))
- Marine Dunstetter ([@BlueCutOfficial](https://github.com/BlueCutOfficial))
