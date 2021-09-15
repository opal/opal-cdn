/* Generated by Opal 1.1.0 */
Opal.modules["securerandom"] = function(Opal) {
  function $rb_lt(lhs, rhs) {
    return (typeof(lhs) === 'number' && typeof(rhs) === 'number') ? lhs < rhs : lhs['$<'](rhs);
  }
  var self = Opal.top, $nesting = [], nil = Opal.nil, $$$ = Opal.$$$, $$ = Opal.$$, $module = Opal.module, $truthy = Opal.truthy, $send = Opal.send;

  Opal.add_stubs(['$to_int', '$<', '$raise', '$gsub']);
  return (function($base, $parent_nesting) {
    var self = $module($base, 'SecureRandom');

    var $nesting = [self].concat($parent_nesting), $SecureRandom_hex$1, $SecureRandom_uuid$2;

    
    Opal.defs(self, '$hex', $SecureRandom_hex$1 = function $$hex(count) {
      var self = this, $ret_or_1 = nil;

      
      
      if (count == null) {
        count = nil;
      };
      count = (function() {if ($truthy(($ret_or_1 = count))) {
        return $ret_or_1
      } else {
        return 16
      }; return nil; })();
      if ($truthy(typeof count === "number")) {
      } else {
        count = count.$to_int()
      };
      if ($truthy($rb_lt(count, 0))) {
        self.$raise($$($nesting, 'ArgumentError'), "count of hex numbers must be positive")};
      
      count = Math.floor(count);
      var repeat = Math.floor(count / 6),
          remain = count % 6,
          remain_total = remain * 2,
          string = '',
          temp;
      for (var i = 0; i < repeat; i++) {
        // parseInt('ff'.repeat(6), 16) == 281474976710655
        temp = Math.floor(Math.random() * 281474976710655).toString(16);
        if (temp.length < 12) {
          // account for leading zeros gone missing
          temp = '0'.repeat(12 - temp.length) + temp;
        }
        string = string + temp;
      }
      if (remain > 0) {
        temp = Math.floor(Math.random()*parseInt('ff'.repeat(remain), 16)).toString(16);
        if (temp.length < remain_total) {
          // account for leading zeros gone missing
          temp = '0'.repeat(remain_total - temp.length) + temp;
        }
        string = string + temp;
      }
      return string;
    ;
    }, $SecureRandom_hex$1.$$arity = -1);
    Opal.defs(self, '$uuid', $SecureRandom_uuid$2 = function $$uuid() {
      var $$3, self = this;

      return $send("xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx", 'gsub', [/[xy]/], ($$3 = function(ch){var self = $$3.$$s == null ? this : $$3.$$s;

      
        
        if (ch == null) {
          ch = nil;
        };
        
        var r = Math.random() * 16 | 0,
            v = ch == "x" ? r : (r & 3 | 8);

        return v.toString(16);
      ;}, $$3.$$s = self, $$3.$$arity = 1, $$3.$$has_trailing_comma_in_args = true, $$3))
    }, $SecureRandom_uuid$2.$$arity = 0);
  })($nesting[0], $nesting)
};
