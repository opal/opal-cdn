Opal.modules["e2mmap"] = function(Opal) {/* Generated by Opal 1.7.1 */
  var $module = Opal.module, $const_set = Opal.const_set, $send2 = Opal.send2, $find_super = Opal.find_super, $truthy = Opal.truthy, $rb_lt = Opal.rb_lt, $defs = Opal.defs, $send = Opal.send, $slice = Opal.slice, $to_a = Opal.to_a, $def = Opal.def, $alias = Opal.alias, $hash2 = Opal.hash2, $gvars = Opal.gvars, $regexp = Opal.regexp, $thrower = Opal.thrower, $nesting = [], nil = Opal.nil;

  Opal.add_stubs('<,bind,module_eval,Raise,class,extend,def_e2message,def_exception,instance_eval,[]=,new,const_defined?,remove_const,const_set,e2mm_message,nil?,caller,=~,[],quote,shift,raise,sprintf,Fail,inspect,each,ancestors');
  return (function($base, $parent_nesting) {
    var self = $module($base, 'Exception2MessageMapper');

    var $nesting = [self].concat($parent_nesting), $$ = Opal.$r($nesting);

    
    $const_set($nesting[0], 'E2MM', $$('Exception2MessageMapper'));
    $defs($$('E2MM'), '$extend_object', function $$extend_object(cl) {
      var $yield = $$extend_object.$$p || nil, self = this;

      $$extend_object.$$p = null;
      
      $send2(self, $find_super(self, 'extend_object', $$extend_object, false, true), 'extend_object', [cl], $yield);
      if ($truthy($rb_lt(cl, $$('E2MM')))) {
        return nil
      } else {
        return cl.$bind(self)
      };
    });
    
    $def(self, '$bind', function $$bind(cl) {
      var self = this;

      return $send(self, 'module_eval', [], function $$1(){var self = $$1.$$s == null ? this : $$1.$$s;

        
        
        $def(self, '$Raise', function $$Raise($a, $b) {
          var $post_args, err, rest, self = this;

          
          $post_args = $slice(arguments);
          
          if ($post_args.length > 0) err = $post_args.shift();if (err == null) err = nil;
          rest = $post_args;
          return $send($$('Exception2MessageMapper'), 'Raise', [self.$class(), err].concat($to_a(rest)));
        }, -1);
        $alias(self, "Fail", "Raise");
        (function(self, $parent_nesting) {
          
          
          
          Opal.udef(self, '$' + "included");;
          return nil;
        })(Opal.get_singleton_class(self), $nesting);
        return $defs(self, '$included', function $$included(mod) {
          
          return mod.$extend($$('Exception2MessageMapper'))
        });}, {$$s: self})
    });
    
    $def(self, '$Raise', function $$Raise($a, $b) {
      var $post_args, err, rest, self = this;

      
      $post_args = $slice(arguments);
      
      if ($post_args.length > 0) err = $post_args.shift();if (err == null) err = nil;
      rest = $post_args;
      return $send($$('E2MM'), 'Raise', [self, err].concat($to_a(rest)));
    }, -1);
    $alias(self, "Fail", "Raise");
    $alias(self, "fail", "Raise");
    
    $def(self, '$def_e2message', function $$def_e2message(c, m) {
      var self = this;

      return $$('E2MM').$def_e2message(self, c, m)
    });
    
    $def(self, '$def_exception', function $$def_exception(n, m, s) {
      var self = this;

      
      if (s == null) s = $$('StandardError');
      return $$('E2MM').$def_exception(self, n, m, s);
    }, -3);
    self.MessageMap = $hash2([], {});
    $defs($$('E2MM'), '$def_e2message', function $$def_e2message(k, c, m) {
      var self = this;

      
      $send($$('E2MM'), 'instance_eval', [], function $$2(){var $a, self = $$2.$$s == null ? this : $$2.$$s;
        if (self.MessageMap == null) self.MessageMap = nil;

        return ($a = [[k, c], m], $send(self.MessageMap, '[]=', $a), $a[$a.length - 1])}, {$$s: self});
      return c;
    });
    $defs($$('E2MM'), '$def_exception', function $$def_exception(k, n, m, s) {
      var self = this, e = nil;

      
      if (s == null) s = $$('StandardError');
      e = $$('Class').$new(s);
      $send($$('E2MM'), 'instance_eval', [], function $$3(){var $a, self = $$3.$$s == null ? this : $$3.$$s;
        if (self.MessageMap == null) self.MessageMap = nil;

        return ($a = [[k, e], m], $send(self.MessageMap, '[]=', $a), $a[$a.length - 1])}, {$$s: self});
      if ($truthy(k['$const_defined?'](n, false))) {
        $send(k, 'module_eval', [], function $$4(){var self = $$4.$$s == null ? this : $$4.$$s;

          return self.$remove_const(n)}, {$$s: self})
      };
      return k.$const_set(n, e);
    }, -4);
    $defs($$('E2MM'), '$Raise', function $$Raise($a, $b, $c) {
      var $post_args, klass, err, rest, self = this, form = nil, b = nil;
      if ($gvars["@"] == null) $gvars["@"] = nil;

      
      $post_args = $slice(arguments);
      
      if ($post_args.length > 0) klass = $post_args.shift();if (klass == null) klass = $$('E2MM');
      
      if ($post_args.length > 0) err = $post_args.shift();if (err == null) err = nil;
      rest = $post_args;
      if ($truthy((form = self.$e2mm_message(klass, err)))) {
        
        b = ($truthy($gvars["@"]['$nil?']()) ? (self.$caller(1)) : ($gvars["@"]));
        if ($truthy(b['$[]'](0)['$=~']($regexp(["^", $$('Regexp').$quote("./e2mmap.rb"), ":"])))) {
          b.$shift()
        };
        return self.$raise(err, $send(self, 'sprintf', [form].concat($to_a(rest))), b);
      } else {
        return $$('E2MM').$Fail($$('E2MM'), $$('ErrNotRegisteredException'), err.$inspect())
      };
    }, -1);
    (function(self, $parent_nesting) {
      
      return $alias(self, "Fail", "Raise")
    })(Opal.get_singleton_class($$('E2MM')), $nesting);
    $defs($$('E2MM'), '$e2mm_message', function $$e2mm_message(klass, exp) {try { var $t_return = $thrower('return'); 
      var self = this;

      
      $send(klass.$ancestors(), 'each', [], function $$5(c){var self = $$5.$$s == null ? this : $$5.$$s, mes = nil;
        if (self.MessageMap == null) self.MessageMap = nil;

        
        if (c == null) c = nil;
        if ($truthy((mes = self.MessageMap['$[]']([c, exp])))) {
          $t_return.$throw(mes)
        } else {
          return nil
        };}, {$$s: self, $$ret: $t_return});
      return nil;} catch($e) {
        if ($e === $t_return) return $e.$v;
        throw $e;
      }
    });
    (function(self, $parent_nesting) {
      
      return $alias(self, "message", "e2mm_message")
    })(Opal.get_singleton_class(self), $nesting);
    return $$('E2MM').$def_exception($$('E2MM'), "ErrNotRegisteredException", "not registered exception(%s)");
  })($nesting[0], $nesting)
};
