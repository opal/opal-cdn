/* Generated by Opal 1.0.0 */
Opal.modules["securerandom"] = function(Opal) {
  var self = Opal.top, $nesting = [], nil = Opal.nil, $$$ = Opal.const_get_qualified, $$ = Opal.const_get_relative, $breaker = Opal.breaker, $slice = Opal.slice, $module = Opal.module, $send = Opal.send;

  Opal.add_stubs(['$gsub']);
  return (function($base, $parent_nesting) {
    var self = $module($base, 'SecureRandom');

    var $nesting = [self].concat($parent_nesting), $SecureRandom_uuid$1;

    Opal.defs(self, '$uuid', $SecureRandom_uuid$1 = function $$uuid() {
      var $$2, self = this;

      return $send("xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx", 'gsub', [/[xy]/], ($$2 = function(ch){var self = $$2.$$s || this;

      
        
        if (ch == null) {
          ch = nil;
        };
        
        var r = Math.random() * 16 | 0,
            v = ch == "x" ? r : (r & 3 | 8);

        return v.toString(16);
      ;}, $$2.$$s = self, $$2.$$arity = 1, $$2.$$has_trailing_comma_in_args = true, $$2))
    }, $SecureRandom_uuid$1.$$arity = 0)
  })($nesting[0], $nesting)
};
