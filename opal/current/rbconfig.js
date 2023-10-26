Opal.modules["rbconfig"] = function(Opal) {/* Generated by Opal 1.8.0 */
  var $module = Opal.module, $const_set = Opal.const_set, $nesting = [], nil = Opal.nil;

  Opal.add_stubs('split,[]');
  
  (function($base, $parent_nesting) {
    var self = $module($base, 'RbConfig');

    var $nesting = [self].concat($parent_nesting), $$ = Opal.$r($nesting), versions = nil;

    
    versions = $$('RUBY_VERSION').$split(".");
    return $const_set($nesting[0], 'CONFIG', (new Map([["ruby_version", $$('RUBY_VERSION')], ["MAJOR", versions['$[]'](0)], ["MINOR", versions['$[]'](1)], ["TEENY", versions['$[]'](2)], ["RUBY", $$('RUBY_ENGINE')], ["RUBY_INSTALL_NAME", $$('RUBY_ENGINE')], ["ruby_install_name", $$('RUBY_ENGINE')], ["RUBY_SO_NAME", $$('RUBY_ENGINE')], ["target_os", "ECMA-262"], ["host_os", "ECMA-262"], ["PATH_SEPARATOR", ":"], ["EXEEXT", ""], ["bindir", ""]])));
  })($nesting[0], $nesting);
  return $const_set($nesting[0], 'RUBY_EXE', "bundle exec exe/opal");
};
