/* Generated by Opal 1.1.1 */
Opal.modules["e2mmap"] = function(Opal) {
  function $rb_lt(lhs, rhs) {
    return (typeof(lhs) === 'number' && typeof(rhs) === 'number') ? lhs < rhs : lhs['$<'](rhs);
  }
  function $rb_minus(lhs, rhs) {
    return (typeof(lhs) === 'number' && typeof(rhs) === 'number') ? lhs - rhs : lhs['$-'](rhs);
  }
  var self = Opal.top, $nesting = [], nil = Opal.nil, $$$ = Opal.$$$, $$ = Opal.$$, $module = Opal.module, $send2 = Opal.send2, $truthy = Opal.truthy, $send = Opal.send, $hash2 = Opal.hash2, $gvars = Opal.gvars, $enc = Opal.enc;

  Opal.add_stubs(['$<', '$bind', '$module_eval', '$Raise', '$class', '$extend', '$def_e2message', '$def_exception', '$instance_eval', '$[]=', '$-', '$new', '$const_defined?', '$remove_const', '$const_set', '$e2mm_message', '$nil?', '$caller', '$=~', '$[]', '$quote', '$shift', '$raise', '$sprintf', '$Fail', '$inspect', '$each', '$ancestors']);
  return (function($base, $parent_nesting) {
    var self = $module($base, 'Exception2MessageMapper');

    var $nesting = [self].concat($parent_nesting), $Exception2MessageMapper_extend_object$1, $Exception2MessageMapper_bind$2, $Exception2MessageMapper_Raise$6, $Exception2MessageMapper_def_e2message$7, $Exception2MessageMapper_def_exception$8, $Exception2MessageMapper_def_e2message$9, $Exception2MessageMapper_def_exception$11, $Exception2MessageMapper_Raise$14, $Exception2MessageMapper_e2mm_message$15;

    
    Opal.const_set($nesting[0], 'E2MM', $$($nesting, 'Exception2MessageMapper'));
    Opal.defs($$($nesting, 'E2MM'), '$extend_object', $Exception2MessageMapper_extend_object$1 = function $$extend_object(cl) {
      var $iter = $Exception2MessageMapper_extend_object$1.$$p, $yield = $iter || nil, self = this, $zuper = nil, $zuper_i = nil, $zuper_ii = nil;

      if ($iter) $Exception2MessageMapper_extend_object$1.$$p = null;
      // Prepare super implicit arguments
      for($zuper_i = 0, $zuper_ii = arguments.length, $zuper = new Array($zuper_ii); $zuper_i < $zuper_ii; $zuper_i++) {
        $zuper[$zuper_i] = arguments[$zuper_i];
      }
      
      $send2(self, Opal.find_super_dispatcher(self, 'extend_object', $Exception2MessageMapper_extend_object$1, false, true), 'extend_object', $zuper, $iter);
      if ($truthy($rb_lt(cl, $$($nesting, 'E2MM')))) {
        return nil
      } else {
        return cl.$bind(self)
      };
    }, $Exception2MessageMapper_extend_object$1.$$arity = 1);
    
    Opal.def(self, '$bind', $Exception2MessageMapper_bind$2 = function $$bind(cl) {
      var $$3, self = this;

      return $send(self, 'module_eval', [], ($$3 = function(){var self = $$3.$$s == null ? this : $$3.$$s, $Raise$4, $included$5;

      
        
        Opal.def(self, '$Raise', $Raise$4 = function $$Raise($a, $b) {
          var $post_args, err, rest, self = this;

          
          
          $post_args = Opal.slice.call(arguments, 0, arguments.length);
          
          if ($post_args.length > 0) {
            err = $post_args[0];
            $post_args.splice(0, 1);
          }
          if (err == null) {
            err = nil;
          };
          
          rest = $post_args;;
          return $send($$($nesting, 'Exception2MessageMapper'), 'Raise', [self.$class(), err].concat(Opal.to_a(rest)));
        }, $Raise$4.$$arity = -1);
        Opal.alias(self, "Fail", "Raise");
        (function(self, $parent_nesting) {
          var $nesting = [self].concat($parent_nesting);

          
          
          Opal.udef(self, '$' + "included");;
          return nil;
        })(Opal.get_singleton_class(self), $nesting);
        return (Opal.defs(self, '$included', $included$5 = function $$included(mod) {
          var self = this;

          return mod.$extend($$($nesting, 'Exception2MessageMapper'))
        }, $included$5.$$arity = 1), nil) && 'included';}, $$3.$$s = self, $$3.$$arity = 0, $$3))
    }, $Exception2MessageMapper_bind$2.$$arity = 1);
    
    Opal.def(self, '$Raise', $Exception2MessageMapper_Raise$6 = function $$Raise($a, $b) {
      var $post_args, err, rest, self = this;

      
      
      $post_args = Opal.slice.call(arguments, 0, arguments.length);
      
      if ($post_args.length > 0) {
        err = $post_args[0];
        $post_args.splice(0, 1);
      }
      if (err == null) {
        err = nil;
      };
      
      rest = $post_args;;
      return $send($$($nesting, 'E2MM'), 'Raise', [self, err].concat(Opal.to_a(rest)));
    }, $Exception2MessageMapper_Raise$6.$$arity = -1);
    Opal.alias(self, "Fail", "Raise");
    Opal.alias(self, "fail", "Raise");
    
    Opal.def(self, '$def_e2message', $Exception2MessageMapper_def_e2message$7 = function $$def_e2message(c, m) {
      var self = this;

      return $$($nesting, 'E2MM').$def_e2message(self, c, m)
    }, $Exception2MessageMapper_def_e2message$7.$$arity = 2);
    
    Opal.def(self, '$def_exception', $Exception2MessageMapper_def_exception$8 = function $$def_exception(n, m, s) {
      var self = this;

      
      
      if (s == null) {
        s = $$($nesting, 'StandardError');
      };
      return $$($nesting, 'E2MM').$def_exception(self, n, m, s);
    }, $Exception2MessageMapper_def_exception$8.$$arity = -3);
    self.MessageMap = $hash2([], {});
    Opal.defs($$($nesting, 'E2MM'), '$def_e2message', $Exception2MessageMapper_def_e2message$9 = function $$def_e2message(k, c, m) {
      var $$10, self = this;

      
      $send($$($nesting, 'E2MM'), 'instance_eval', [], ($$10 = function(){var self = $$10.$$s == null ? this : $$10.$$s, $writer = nil;
        if (self.MessageMap == null) self.MessageMap = nil;

      
        $writer = [[k, c], m];
        $send(self.MessageMap, '[]=', Opal.to_a($writer));
        return $writer[$rb_minus($writer["length"], 1)];}, $$10.$$s = self, $$10.$$arity = 0, $$10));
      return c;
    }, $Exception2MessageMapper_def_e2message$9.$$arity = 3);
    Opal.defs($$($nesting, 'E2MM'), '$def_exception', $Exception2MessageMapper_def_exception$11 = function $$def_exception(k, n, m, s) {
      var $$12, $$13, self = this, e = nil;

      
      
      if (s == null) {
        s = $$($nesting, 'StandardError');
      };
      e = $$($nesting, 'Class').$new(s);
      $send($$($nesting, 'E2MM'), 'instance_eval', [], ($$12 = function(){var self = $$12.$$s == null ? this : $$12.$$s, $writer = nil;
        if (self.MessageMap == null) self.MessageMap = nil;

      
        $writer = [[k, e], m];
        $send(self.MessageMap, '[]=', Opal.to_a($writer));
        return $writer[$rb_minus($writer["length"], 1)];}, $$12.$$s = self, $$12.$$arity = 0, $$12));
      if ($truthy(k['$const_defined?'](n, false))) {
        $send(k, 'module_eval', [], ($$13 = function(){var self = $$13.$$s == null ? this : $$13.$$s;

        return self.$remove_const(n)}, $$13.$$s = self, $$13.$$arity = 0, $$13))};
      return k.$const_set(n, e);
    }, $Exception2MessageMapper_def_exception$11.$$arity = -4);
    Opal.defs($$($nesting, 'E2MM'), '$Raise', $Exception2MessageMapper_Raise$14 = function $$Raise($a, $b, $c) {
      var $post_args, klass, err, rest, self = this, form = nil, b = nil;
      if ($gvars["@"] == null) $gvars["@"] = nil;

      
      
      $post_args = Opal.slice.call(arguments, 0, arguments.length);
      
      if ($post_args.length > 0) {
        klass = $post_args[0];
        $post_args.splice(0, 1);
      }
      if (klass == null) {
        klass = $$($nesting, 'E2MM');
      };
      
      if ($post_args.length > 0) {
        err = $post_args[0];
        $post_args.splice(0, 1);
      }
      if (err == null) {
        err = nil;
      };
      
      rest = $post_args;;
      if ($truthy((form = self.$e2mm_message(klass, err)))) {
        
        b = (function() {if ($truthy($gvars["@"]['$nil?']())) {
          return self.$caller(1)
        } else {
          return $gvars["@"]
        }; return nil; })();
        if ($truthy(b['$[]'](0)['$=~'](Opal.regexp(["^", $$($nesting, 'Regexp').$quote($enc("./e2mmap.rb", "US-ASCII")), ":"])))) {
          b.$shift()};
        return self.$raise(err, $send(self, 'sprintf', [form].concat(Opal.to_a(rest))), b);
      } else {
        return $$($nesting, 'E2MM').$Fail($$($nesting, 'E2MM'), $$($nesting, 'ErrNotRegisteredException'), err.$inspect())
      };
    }, $Exception2MessageMapper_Raise$14.$$arity = -1);
    (function(self, $parent_nesting) {
      var $nesting = [self].concat($parent_nesting);

      return Opal.alias(self, "Fail", "Raise")
    })(Opal.get_singleton_class($$($nesting, 'E2MM')), $nesting);
    Opal.defs($$($nesting, 'E2MM'), '$e2mm_message', $Exception2MessageMapper_e2mm_message$15 = function $$e2mm_message(klass, exp) {try {

      var $$16, self = this;

      
      $send(klass.$ancestors(), 'each', [], ($$16 = function(c){var self = $$16.$$s == null ? this : $$16.$$s, mes = nil;
        if (self.MessageMap == null) self.MessageMap = nil;

      
        
        if (c == null) {
          c = nil;
        };
        if ($truthy((mes = self.MessageMap['$[]']([c, exp])))) {
          Opal.ret(mes)
        } else {
          return nil
        };}, $$16.$$s = self, $$16.$$arity = 1, $$16));
      return nil;
      } catch ($returner) { if ($returner === Opal.returner) { return $returner.$v } throw $returner; }
    }, $Exception2MessageMapper_e2mm_message$15.$$arity = 2);
    (function(self, $parent_nesting) {
      var $nesting = [self].concat($parent_nesting);

      return Opal.alias(self, "message", "e2mm_message")
    })(Opal.get_singleton_class(self), $nesting);
    $$($nesting, 'E2MM').$def_exception($$($nesting, 'E2MM'), "ErrNotRegisteredException", "not registered exception(%s)");
  })($nesting[0], $nesting)
};
