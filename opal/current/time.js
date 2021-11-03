Opal.modules["time"] = function(Opal) {/* Generated by Opal 1.3.1 */
  var self = Opal.top, $nesting = [], nil = Opal.nil, $$$ = Opal.$$$, $$ = Opal.$$, $klass = Opal.klass;

  Opal.add_stubs(['$strftime']);
  return (function($base, $super, $parent_nesting) {
    var self = $klass($base, $super, 'Time');

    var $nesting = [self].concat($parent_nesting), $Time_parse$1, $Time_iso8601$2;

    
    Opal.defs(self, '$parse', $Time_parse$1 = function $$parse(str) {
      var self = this;

      return new Date(Date.parse(str));
    }, $Time_parse$1.$$arity = 1);
    return (Opal.def(self, '$iso8601', $Time_iso8601$2 = function $$iso8601() {
      var self = this;

      return self.$strftime("%FT%T%z")
    }, $Time_iso8601$2.$$arity = 0), nil) && 'iso8601';
  })($nesting[0], null, $nesting)
};
