/* Generated by Opal 0.11.99.dev */
Opal.modules["time"] = function(Opal) {
  var self = Opal.top, $nesting = [], nil = Opal.nil, $$$ = Opal.const_get_qualified, $$ = Opal.const_get_relative, $breaker = Opal.breaker, $slice = Opal.slice, $klass = Opal.klass;

  Opal.add_stubs(['$strftime']);
  return (function($base, $super, $parent_nesting) {
    function $Time(){};
    var self = $Time = $klass($base, $super, 'Time', $Time);

    var def = self.prototype, $nesting = [self].concat($parent_nesting), TMP_Time_parse_1, TMP_Time_iso8601_2;

    
    Opal.defs(self, '$parse', TMP_Time_parse_1 = function $$parse(str) {
      var self = this;

      return new Date(Date.parse(str));
    }, TMP_Time_parse_1.$$arity = 1);
    return (Opal.def(self, '$iso8601', TMP_Time_iso8601_2 = function $$iso8601() {
      var self = this;

      return self.$strftime("%FT%T%z")
    }, TMP_Time_iso8601_2.$$arity = 0), nil) && 'iso8601';
  })($nesting[0], null, $nesting)
};
