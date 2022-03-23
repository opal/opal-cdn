### Added

- Introduce timezone support for Time (#2394)
- DateTime and Date refactor (#2398)
- Implement `Number#prev_float`/`#next_float` (#2404)

### Changed

- Move Math IE11-supporting polyfills to a separate file (#2395)

### Internal

- Improve performance of argument coertion, fast-track `Integer`, `String`, and calling the designed coertion method (#2383)
- Optimize `Array#[]=` by moving the implementation to JavaScript and inlining type checks (#2383)
- Optimize internal runtime passing of block-options (#2383)

### Fixed

- Fix `Regexp.new`, previously `\A` and `\z` didn't match beginning and end of input (#2079)
- Fix exception during `Hash#each` and `Hash#each_key` if keys get deleted during the loop (#2403)

### Internal

- Rewriters refactor, fix interaction between cache and iverted runner (#2400)

<!--
### Internal
### Changed
### Added
### Removed
### Deprecated
-->
