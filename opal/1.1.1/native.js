/* Generated by Opal 1.1.1 */
Opal.modules["native"] = function(Opal) {
  function $rb_minus(lhs, rhs) {
    return (typeof(lhs) === 'number' && typeof(rhs) === 'number') ? lhs - rhs : lhs['$-'](rhs);
  }
  function $rb_ge(lhs, rhs) {
    return (typeof(lhs) === 'number' && typeof(rhs) === 'number') ? lhs >= rhs : lhs['$>='](rhs);
  }
  var self = Opal.top, $nesting = [], nil = Opal.nil, $$$ = Opal.$$$, $$ = Opal.$$, $module = Opal.module, $truthy = Opal.truthy, $send = Opal.send, $hash2 = Opal.hash2, $range = Opal.range, $klass = Opal.klass, $send2 = Opal.send2, $gvars = Opal.gvars;

  Opal.add_stubs(['$try_convert', '$native?', '$respond_to?', '$to_n', '$raise', '$inspect', '$Native', '$proc', '$map!', '$end_with?', '$define_method', '$[]', '$convert', '$call', '$to_proc', '$new', '$each', '$native_reader', '$native_writer', '$extend', '$warn', '$include', '$is_a?', '$map', '$to_a', '$_Array', '$method_missing', '$bind', '$instance_method', '$slice', '$-', '$length', '$[]=', '$enum_for', '$===', '$>=', '$<<', '$each_pair', '$_initialize', '$name', '$native_module']);
  
  (function($base, $parent_nesting) {
    var self = $module($base, 'Native');

    var $nesting = [self].concat($parent_nesting), $Native_is_a$ques$1, $Native_try_convert$2, $Native_convert$3, $Native_call$4, $Native_proc$5, $Native_included$22;

    
    Opal.defs(self, '$is_a?', $Native_is_a$ques$1 = function(object, klass) {
      var self = this;

      
      try {
        return object instanceof self.$try_convert(klass);
      }
      catch (e) {
        return false;
      }
    
    }, $Native_is_a$ques$1.$$arity = 2);
    Opal.defs(self, '$try_convert', $Native_try_convert$2 = function $$try_convert(value, default$) {
      var self = this;

      
      
      if (default$ == null) {
        default$ = nil;
      };
      
      if (self['$native?'](value)) {
        return value;
      }
      else if (value['$respond_to?']("to_n")) {
        return value.$to_n();
      }
      else {
        return default$;
      }
    ;
    }, $Native_try_convert$2.$$arity = -2);
    Opal.defs(self, '$convert', $Native_convert$3 = function $$convert(value) {
      var self = this;

      
      if (self['$native?'](value)) {
        return value;
      }
      else if (value['$respond_to?']("to_n")) {
        return value.$to_n();
      }
      else {
        self.$raise($$($nesting, 'ArgumentError'), "" + (value.$inspect()) + " isn't native");
      }
    
    }, $Native_convert$3.$$arity = 1);
    Opal.defs(self, '$call', $Native_call$4 = function $$call(obj, key, $a) {
      var $iter = $Native_call$4.$$p, block = $iter || nil, $post_args, args, self = this;

      if ($iter) $Native_call$4.$$p = null;
      
      
      if ($iter) $Native_call$4.$$p = null;;
      
      $post_args = Opal.slice.call(arguments, 2, arguments.length);
      
      args = $post_args;;
      
      var prop = obj[key];

      if (prop instanceof Function) {
        var converted = new Array(args.length);

        for (var i = 0, l = args.length; i < l; i++) {
          var item = args[i],
              conv = self.$try_convert(item);

          converted[i] = conv === nil ? item : conv;
        }

        if (block !== nil) {
          converted.push(block);
        }

        return self.$Native(prop.apply(obj, converted));
      }
      else {
        return self.$Native(prop);
      }
    ;
    }, $Native_call$4.$$arity = -3);
    Opal.defs(self, '$proc', $Native_proc$5 = function $$proc() {
      var $iter = $Native_proc$5.$$p, block = $iter || nil, $$6, self = this;

      if ($iter) $Native_proc$5.$$p = null;
      
      
      if ($iter) $Native_proc$5.$$p = null;;
      if ($truthy(block)) {
      } else {
        self.$raise($$($nesting, 'LocalJumpError'), "no block given")
      };
      return $send($$$('::', 'Kernel'), 'proc', [], ($$6 = function($a){var self = $$6.$$s == null ? this : $$6.$$s, $post_args, args, $$7, instance = nil;

      
        
        $post_args = Opal.slice.call(arguments, 0, arguments.length);
        
        args = $post_args;;
        $send(args, 'map!', [], ($$7 = function(arg){var self = $$7.$$s == null ? this : $$7.$$s;

        
          
          if (arg == null) {
            arg = nil;
          };
          return self.$Native(arg);}, $$7.$$s = self, $$7.$$arity = 1, $$7));
        instance = self.$Native(this);
        
        // if global is current scope, run the block in the scope it was defined
        if (this === Opal.global) {
          return block.apply(self, args);
        }

        var self_ = block.$$s;
        block.$$s = null;

        try {
          return block.apply(instance, args);
        }
        finally {
          block.$$s = self_;
        }
      ;}, $$6.$$s = self, $$6.$$arity = -1, $$6));
    }, $Native_proc$5.$$arity = 0);
    (function($base, $parent_nesting) {
      var self = $module($base, 'Helpers');

      var $nesting = [self].concat($parent_nesting), $Helpers_alias_native$8, $Helpers_native_reader$12, $Helpers_native_writer$15, $Helpers_native_accessor$18;

      
      
      Opal.def(self, '$alias_native', $Helpers_alias_native$8 = function $$alias_native(new$, $a, $b) {
        var $post_args, $kwargs, old, as, $$9, $$10, $$11, $iter = $Helpers_alias_native$8.$$p, $yield = $iter || nil, self = this;

        if ($iter) $Helpers_alias_native$8.$$p = null;
        
        
        $post_args = Opal.slice.call(arguments, 1, arguments.length);
        
        $kwargs = Opal.extract_kwargs($post_args);
        
        if ($kwargs == null) {
          $kwargs = $hash2([], {});
        } else if (!$kwargs.$$is_hash) {
          throw Opal.ArgumentError.$new('expected kwargs');
        };
        
        if ($post_args.length > 0) {
          old = $post_args[0];
          $post_args.splice(0, 1);
        }
        if (old == null) {
          old = new$;
        };
        
        as = $kwargs.$$smap["as"];
        if (as == null) {
          as = nil
        };
        if ($truthy(old['$end_with?']("="))) {
          return $send(self, 'define_method', [new$], ($$9 = function(value){var self = $$9.$$s == null ? this : $$9.$$s;
            if (self["native"] == null) self["native"] = nil;

          
            
            if (value == null) {
              value = nil;
            };
            self["native"][old['$[]']($range(0, -2, false))] = $$($nesting, 'Native').$convert(value);
            return value;}, $$9.$$s = self, $$9.$$arity = 1, $$9))
        } else if ($truthy(as)) {
          return $send(self, 'define_method', [new$], ($$10 = function($c){var self = $$10.$$s == null ? this : $$10.$$s, $iter = $$10.$$p, block = $iter || nil, $post_args, args, value = nil;
            if (self["native"] == null) self["native"] = nil;

          
            
            if ($iter) $$10.$$p = null;;
            
            $post_args = Opal.slice.call(arguments, 0, arguments.length);
            
            args = $post_args;;
            value = $send($$($nesting, 'Native'), 'call', [self["native"], old].concat(Opal.to_a(args)), block.$to_proc());
            if ($truthy(value)) {
              return as.$new(value.$to_n())
            } else {
              return nil
            };}, $$10.$$s = self, $$10.$$arity = -1, $$10))
        } else {
          return $send(self, 'define_method', [new$], ($$11 = function($c){var self = $$11.$$s == null ? this : $$11.$$s, $iter = $$11.$$p, block = $iter || nil, $post_args, args;
            if (self["native"] == null) self["native"] = nil;

          
            
            if ($iter) $$11.$$p = null;;
            
            $post_args = Opal.slice.call(arguments, 0, arguments.length);
            
            args = $post_args;;
            return $send($$($nesting, 'Native'), 'call', [self["native"], old].concat(Opal.to_a(args)), block.$to_proc());}, $$11.$$s = self, $$11.$$arity = -1, $$11))
        };
      }, $Helpers_alias_native$8.$$arity = -2);
      
      Opal.def(self, '$native_reader', $Helpers_native_reader$12 = function $$native_reader($a) {
        var $post_args, names, $$13, self = this;

        
        
        $post_args = Opal.slice.call(arguments, 0, arguments.length);
        
        names = $post_args;;
        return $send(names, 'each', [], ($$13 = function(name){var self = $$13.$$s == null ? this : $$13.$$s, $$14;

        
          
          if (name == null) {
            name = nil;
          };
          return $send(self, 'define_method', [name], ($$14 = function(){var self = $$14.$$s == null ? this : $$14.$$s;
            if (self["native"] == null) self["native"] = nil;

          return self.$Native(self["native"][name])}, $$14.$$s = self, $$14.$$arity = 0, $$14));}, $$13.$$s = self, $$13.$$arity = 1, $$13));
      }, $Helpers_native_reader$12.$$arity = -1);
      
      Opal.def(self, '$native_writer', $Helpers_native_writer$15 = function $$native_writer($a) {
        var $post_args, names, $$16, self = this;

        
        
        $post_args = Opal.slice.call(arguments, 0, arguments.length);
        
        names = $post_args;;
        return $send(names, 'each', [], ($$16 = function(name){var self = $$16.$$s == null ? this : $$16.$$s, $$17;

        
          
          if (name == null) {
            name = nil;
          };
          return $send(self, 'define_method', ["" + (name) + "="], ($$17 = function(value){var self = $$17.$$s == null ? this : $$17.$$s;
            if (self["native"] == null) self["native"] = nil;

          
            
            if (value == null) {
              value = nil;
            };
            return self.$Native(self["native"][name] = value);}, $$17.$$s = self, $$17.$$arity = 1, $$17));}, $$16.$$s = self, $$16.$$arity = 1, $$16));
      }, $Helpers_native_writer$15.$$arity = -1);
      
      Opal.def(self, '$native_accessor', $Helpers_native_accessor$18 = function $$native_accessor($a) {
        var $post_args, names, self = this;

        
        
        $post_args = Opal.slice.call(arguments, 0, arguments.length);
        
        names = $post_args;;
        $send(self, 'native_reader', Opal.to_a(names));
        return $send(self, 'native_writer', Opal.to_a(names));
      }, $Helpers_native_accessor$18.$$arity = -1);
    })($nesting[0], $nesting);
    (function($base, $parent_nesting) {
      var self = $module($base, 'Wrapper');

      var $nesting = [self].concat($parent_nesting), $Wrapper_initialize$19, $Wrapper_to_n$20, $Wrapper_included$21;

      
      
      Opal.def(self, '$initialize', $Wrapper_initialize$19 = function $$initialize(native$) {
        var self = this;

        
        if ($truthy($$$('::', 'Kernel')['$native?'](native$))) {
        } else {
          $$$('::', 'Kernel').$raise($$($nesting, 'ArgumentError'), "" + (native$.$inspect()) + " isn't native")
        };
        return (self["native"] = native$);
      }, $Wrapper_initialize$19.$$arity = 1);
      
      Opal.def(self, '$to_n', $Wrapper_to_n$20 = function $$to_n() {
        var self = this;
        if (self["native"] == null) self["native"] = nil;

        return self["native"]
      }, $Wrapper_to_n$20.$$arity = 0);
      Opal.defs(self, '$included', $Wrapper_included$21 = function $$included(klass) {
        var self = this;

        return klass.$extend($$($nesting, 'Helpers'))
      }, $Wrapper_included$21.$$arity = 1);
    })($nesting[0], $nesting);
    Opal.defs(self, '$included', $Native_included$22 = function $$included(base) {
      var self = this;

      
      self.$warn("Including ::Native is deprecated. Please include Native::Wrapper instead.");
      return base.$include($$($nesting, 'Wrapper'));
    }, $Native_included$22.$$arity = 1);
  })($nesting[0], $nesting);
  (function($base, $parent_nesting) {
    var self = $module($base, 'Kernel');

    var $nesting = [self].concat($parent_nesting), $Kernel_native$ques$23, $Kernel_Native$24, $Kernel_Array$27;

    
    
    Opal.def(self, '$native?', $Kernel_native$ques$23 = function(value) {
      var self = this;

      return value == null || !value.$$class;
    }, $Kernel_native$ques$23.$$arity = 1);
    
    Opal.def(self, '$Native', $Kernel_Native$24 = function $$Native(obj) {
      var $$25, $$26, $iter = $Kernel_Native$24.$$p, $yield = $iter || nil, self = this;

      if ($iter) $Kernel_Native$24.$$p = null;
      if ($truthy(obj == null)) {
        return nil
      } else if ($truthy(self['$native?'](obj))) {
        return $$$($$($nesting, 'Native'), 'Object').$new(obj)
      } else if ($truthy(obj['$is_a?']($$($nesting, 'Array')))) {
        return $send(obj, 'map', [], ($$25 = function(o){var self = $$25.$$s == null ? this : $$25.$$s;

        
          
          if (o == null) {
            o = nil;
          };
          return self.$Native(o);}, $$25.$$s = self, $$25.$$arity = 1, $$25))
      } else if ($truthy(obj['$is_a?']($$($nesting, 'Proc')))) {
        return $send(self, 'proc', [], ($$26 = function($a){var self = $$26.$$s == null ? this : $$26.$$s, $iter = $$26.$$p, block = $iter || nil, $post_args, args;

        
          
          if ($iter) $$26.$$p = null;;
          
          $post_args = Opal.slice.call(arguments, 0, arguments.length);
          
          args = $post_args;;
          return self.$Native($send(obj, 'call', Opal.to_a(args), block.$to_proc()));}, $$26.$$s = self, $$26.$$arity = -1, $$26))
      } else {
        return obj
      }
    }, $Kernel_Native$24.$$arity = 1);
    Opal.alias(self, "_Array", "Array");
    
    Opal.def(self, '$Array', $Kernel_Array$27 = function $$Array(object, $a) {
      var $iter = $Kernel_Array$27.$$p, block = $iter || nil, $post_args, args, self = this;

      if ($iter) $Kernel_Array$27.$$p = null;
      
      
      if ($iter) $Kernel_Array$27.$$p = null;;
      
      $post_args = Opal.slice.call(arguments, 1, arguments.length);
      
      args = $post_args;;
      if ($truthy(self['$native?'](object))) {
        return $send($$$($$($nesting, 'Native'), 'Array'), 'new', [object].concat(Opal.to_a(args)), block.$to_proc()).$to_a()};
      return self.$_Array(object);
    }, $Kernel_Array$27.$$arity = -2);
  })($nesting[0], $nesting);
  (function($base, $super, $parent_nesting) {
    var self = $klass($base, $super, 'Object');

    var $nesting = [self].concat($parent_nesting), $Object_$eq_eq$28, $Object_has_key$ques$29, $Object_each$30, $Object_$$$31, $Object_$$$eq$32, $Object_merge$excl$33, $Object_respond_to$ques$34, $Object_respond_to_missing$ques$35, $Object_method_missing$36, $Object_nil$ques$37, $Object_is_a$ques$38, $Object_instance_of$ques$39, $Object_class$40, $Object_to_a$41, $Object_inspect$42;

    self.$$prototype["native"] = nil;
    
    self.$include($$$($$$('::', 'Native'), 'Wrapper'));
    
    Opal.def(self, '$==', $Object_$eq_eq$28 = function(other) {
      var self = this;

      return self["native"] === $$$('::', 'Native').$try_convert(other)
    }, $Object_$eq_eq$28.$$arity = 1);
    
    Opal.def(self, '$has_key?', $Object_has_key$ques$29 = function(name) {
      var self = this;

      return Opal.hasOwnProperty.call(self["native"], name)
    }, $Object_has_key$ques$29.$$arity = 1);
    Opal.alias(self, "key?", "has_key?");
    Opal.alias(self, "include?", "has_key?");
    Opal.alias(self, "member?", "has_key?");
    
    Opal.def(self, '$each', $Object_each$30 = function $$each($a) {
      var $post_args, args, $iter = $Object_each$30.$$p, $yield = $iter || nil, self = this;

      if ($iter) $Object_each$30.$$p = null;
      
      
      $post_args = Opal.slice.call(arguments, 0, arguments.length);
      
      args = $post_args;;
      if (($yield !== nil)) {
        
        
        for (var key in self["native"]) {
          Opal.yieldX($yield, [key, self["native"][key]])
        }
      ;
        return self;
      } else {
        return $send(self, 'method_missing', ["each"].concat(Opal.to_a(args)))
      };
    }, $Object_each$30.$$arity = -1);
    
    Opal.def(self, '$[]', $Object_$$$31 = function(key) {
      var self = this;

      
      var prop = self["native"][key];

      if (prop instanceof Function) {
        return prop;
      }
      else {
        return $$$('::', 'Native').$call(self["native"], key)
      }
    
    }, $Object_$$$31.$$arity = 1);
    
    Opal.def(self, '$[]=', $Object_$$$eq$32 = function(key, value) {
      var self = this, native$ = nil;

      
      native$ = $$$('::', 'Native').$try_convert(value);
      if ($truthy(native$ === nil)) {
        return self["native"][key] = value
      } else {
        return self["native"][key] = native$
      };
    }, $Object_$$$eq$32.$$arity = 2);
    
    Opal.def(self, '$merge!', $Object_merge$excl$33 = function(other) {
      var self = this;

      
      
      other = $$$('::', 'Native').$convert(other);

      for (var prop in other) {
        self["native"][prop] = other[prop];
      }
    ;
      return self;
    }, $Object_merge$excl$33.$$arity = 1);
    
    Opal.def(self, '$respond_to?', $Object_respond_to$ques$34 = function(name, include_all) {
      var self = this;

      
      
      if (include_all == null) {
        include_all = false;
      };
      return $$$('::', 'Kernel').$instance_method("respond_to?").$bind(self).$call(name, include_all);
    }, $Object_respond_to$ques$34.$$arity = -2);
    
    Opal.def(self, '$respond_to_missing?', $Object_respond_to_missing$ques$35 = function(name, include_all) {
      var self = this;

      
      
      if (include_all == null) {
        include_all = false;
      };
      return Opal.hasOwnProperty.call(self["native"], name);
    }, $Object_respond_to_missing$ques$35.$$arity = -2);
    
    Opal.def(self, '$method_missing', $Object_method_missing$36 = function $$method_missing(mid, $a) {
      var $iter = $Object_method_missing$36.$$p, block = $iter || nil, $post_args, args, self = this, $writer = nil;

      if ($iter) $Object_method_missing$36.$$p = null;
      
      
      if ($iter) $Object_method_missing$36.$$p = null;;
      
      $post_args = Opal.slice.call(arguments, 1, arguments.length);
      
      args = $post_args;;
      
      if (mid.charAt(mid.length - 1) === '=') {
        return (($writer = [mid.$slice(0, $rb_minus(mid.$length(), 1)), args['$[]'](0)]), $send(self, '[]=', Opal.to_a($writer)), $writer[$rb_minus($writer["length"], 1)]);
      }
      else {
        return $send($$$('::', 'Native'), 'call', [self["native"], mid].concat(Opal.to_a(args)), block.$to_proc());
      }
    ;
    }, $Object_method_missing$36.$$arity = -2);
    
    Opal.def(self, '$nil?', $Object_nil$ques$37 = function() {
      var self = this;

      return false
    }, $Object_nil$ques$37.$$arity = 0);
    
    Opal.def(self, '$is_a?', $Object_is_a$ques$38 = function(klass) {
      var self = this;

      return Opal.is_a(self, klass);
    }, $Object_is_a$ques$38.$$arity = 1);
    Opal.alias(self, "kind_of?", "is_a?");
    
    Opal.def(self, '$instance_of?', $Object_instance_of$ques$39 = function(klass) {
      var self = this;

      return self.$$class === klass;
    }, $Object_instance_of$ques$39.$$arity = 1);
    
    Opal.def(self, '$class', $Object_class$40 = function() {
      var self = this;

      return self.$$class;
    }, $Object_class$40.$$arity = 0);
    
    Opal.def(self, '$to_a', $Object_to_a$41 = function $$to_a(options) {
      var $iter = $Object_to_a$41.$$p, block = $iter || nil, self = this;

      if ($iter) $Object_to_a$41.$$p = null;
      
      
      if ($iter) $Object_to_a$41.$$p = null;;
      
      if (options == null) {
        options = $hash2([], {});
      };
      return $send($$$($$$('::', 'Native'), 'Array'), 'new', [self["native"], options], block.$to_proc()).$to_a();
    }, $Object_to_a$41.$$arity = -1);
    return (Opal.def(self, '$inspect', $Object_inspect$42 = function $$inspect() {
      var self = this;

      return "" + "#<Native:" + (String(self["native"])) + ">"
    }, $Object_inspect$42.$$arity = 0), nil) && 'inspect';
  })($$($nesting, 'Native'), $$($nesting, 'BasicObject'), $nesting);
  (function($base, $super, $parent_nesting) {
    var self = $klass($base, $super, 'Array');

    var $nesting = [self].concat($parent_nesting), $Array_initialize$43, $Array_each$44, $Array_$$$45, $Array_$$$eq$46, $Array_last$47, $Array_length$48, $Array_inspect$49;

    self.$$prototype.named = self.$$prototype["native"] = self.$$prototype.get = self.$$prototype.block = self.$$prototype.set = self.$$prototype.length = nil;
    
    self.$include($$$($$($nesting, 'Native'), 'Wrapper'));
    self.$include($$($nesting, 'Enumerable'));
    
    Opal.def(self, '$initialize', $Array_initialize$43 = function $$initialize(native$, options) {
      var $iter = $Array_initialize$43.$$p, block = $iter || nil, self = this, $ret_or_1 = nil, $ret_or_2 = nil, $ret_or_3 = nil;

      if ($iter) $Array_initialize$43.$$p = null;
      
      
      if ($iter) $Array_initialize$43.$$p = null;;
      
      if (options == null) {
        options = $hash2([], {});
      };
      $send2(self, Opal.find_super_dispatcher(self, 'initialize', $Array_initialize$43, false, true), 'initialize', [native$], null);
      self.get = (function() {if ($truthy(($ret_or_1 = options['$[]']("get")))) {
        return $ret_or_1
      } else {
        return options['$[]']("access")
      }; return nil; })();
      self.named = options['$[]']("named");
      self.set = (function() {if ($truthy(($ret_or_2 = options['$[]']("set")))) {
        return $ret_or_2
      } else {
        return options['$[]']("access")
      }; return nil; })();
      self.length = (function() {if ($truthy(($ret_or_3 = options['$[]']("length")))) {
        return $ret_or_3
      } else {
        return "length"
      }; return nil; })();
      self.block = block;
      if ($truthy(self.$length() == null)) {
        return self.$raise($$($nesting, 'ArgumentError'), "no length found on the array-like object")
      } else {
        return nil
      };
    }, $Array_initialize$43.$$arity = -2);
    
    Opal.def(self, '$each', $Array_each$44 = function $$each() {
      var $iter = $Array_each$44.$$p, block = $iter || nil, self = this;

      if ($iter) $Array_each$44.$$p = null;
      
      
      if ($iter) $Array_each$44.$$p = null;;
      if ($truthy(block)) {
      } else {
        return self.$enum_for("each")
      };
      
      for (var i = 0, length = self.$length(); i < length; i++) {
        Opal.yield1(block, self['$[]'](i));
      }
    ;
      return self;
    }, $Array_each$44.$$arity = 0);
    
    Opal.def(self, '$[]', $Array_$$$45 = function(index) {
      var self = this, result = nil, $case = nil;

      
      result = (function() {$case = index;
      if ($$($nesting, 'String')['$===']($case) || $$($nesting, 'Symbol')['$===']($case)) {if ($truthy(self.named)) {
        return self["native"][self.named](index)
      } else {
        return self["native"][index]
      }}
      else if ($$($nesting, 'Integer')['$===']($case)) {if ($truthy(self.get)) {
        return self["native"][self.get](index)
      } else {
        return self["native"][index]
      }}
      else { return nil }})();
      if ($truthy(result)) {
        if ($truthy(self.block)) {
          return self.block.$call(result)
        } else {
          return self.$Native(result)
        }
      } else {
        return nil
      };
    }, $Array_$$$45.$$arity = 1);
    
    Opal.def(self, '$[]=', $Array_$$$eq$46 = function(index, value) {
      var self = this;

      if ($truthy(self.set)) {
        return self["native"][self.set](index, $$($nesting, 'Native').$convert(value))
      } else {
        return self["native"][index] = $$($nesting, 'Native').$convert(value)
      }
    }, $Array_$$$eq$46.$$arity = 2);
    
    Opal.def(self, '$last', $Array_last$47 = function $$last(count) {
      var $a, self = this, index = nil, result = nil;

      
      
      if (count == null) {
        count = nil;
      };
      if ($truthy(count)) {
        
        index = $rb_minus(self.$length(), 1);
        result = [];
        while ($truthy($rb_ge(index, 0))) {
          
          result['$<<'](self['$[]'](index));
          index = $rb_minus(index, 1);
        };
        return result;
      } else {
        return self['$[]']($rb_minus(self.$length(), 1))
      };
    }, $Array_last$47.$$arity = -1);
    
    Opal.def(self, '$length', $Array_length$48 = function $$length() {
      var self = this;

      return self["native"][self.length]
    }, $Array_length$48.$$arity = 0);
    Opal.alias(self, "to_ary", "to_a");
    return (Opal.def(self, '$inspect', $Array_inspect$49 = function $$inspect() {
      var self = this;

      return self.$to_a().$inspect()
    }, $Array_inspect$49.$$arity = 0), nil) && 'inspect';
  })($$($nesting, 'Native'), null, $nesting);
  (function($base, $super, $parent_nesting) {
    var self = $klass($base, $super, 'Numeric');

    var $nesting = [self].concat($parent_nesting), $Numeric_to_n$50;

    return (Opal.def(self, '$to_n', $Numeric_to_n$50 = function $$to_n() {
      var self = this;

      return self.valueOf();
    }, $Numeric_to_n$50.$$arity = 0), nil) && 'to_n'
  })($nesting[0], null, $nesting);
  (function($base, $super, $parent_nesting) {
    var self = $klass($base, $super, 'Proc');

    var $nesting = [self].concat($parent_nesting), $Proc_to_n$51;

    return (Opal.def(self, '$to_n', $Proc_to_n$51 = function $$to_n() {
      var self = this;

      return self
    }, $Proc_to_n$51.$$arity = 0), nil) && 'to_n'
  })($nesting[0], null, $nesting);
  (function($base, $super, $parent_nesting) {
    var self = $klass($base, $super, 'String');

    var $nesting = [self].concat($parent_nesting), $String_to_n$52;

    return (Opal.def(self, '$to_n', $String_to_n$52 = function $$to_n() {
      var self = this;

      return self.valueOf();
    }, $String_to_n$52.$$arity = 0), nil) && 'to_n'
  })($nesting[0], null, $nesting);
  (function($base, $super, $parent_nesting) {
    var self = $klass($base, $super, 'Regexp');

    var $nesting = [self].concat($parent_nesting), $Regexp_to_n$53;

    return (Opal.def(self, '$to_n', $Regexp_to_n$53 = function $$to_n() {
      var self = this;

      return self.valueOf();
    }, $Regexp_to_n$53.$$arity = 0), nil) && 'to_n'
  })($nesting[0], null, $nesting);
  (function($base, $super, $parent_nesting) {
    var self = $klass($base, $super, 'MatchData');

    var $nesting = [self].concat($parent_nesting), $MatchData_to_n$54;

    self.$$prototype.matches = nil;
    return (Opal.def(self, '$to_n', $MatchData_to_n$54 = function $$to_n() {
      var self = this;

      return self.matches
    }, $MatchData_to_n$54.$$arity = 0), nil) && 'to_n'
  })($nesting[0], null, $nesting);
  (function($base, $super, $parent_nesting) {
    var self = $klass($base, $super, 'Struct');

    var $nesting = [self].concat($parent_nesting), $Struct_to_n$55;

    return (Opal.def(self, '$to_n', $Struct_to_n$55 = function $$to_n() {
      var $$56, self = this, result = nil;

      
      result = {};
      $send(self, 'each_pair', [], ($$56 = function(name, value){var self = $$56.$$s == null ? this : $$56.$$s;

      
        
        if (name == null) {
          name = nil;
        };
        
        if (value == null) {
          value = nil;
        };
        return result[name] = $$($nesting, 'Native').$try_convert(value, value);}, $$56.$$s = self, $$56.$$arity = 2, $$56));
      return result;
    }, $Struct_to_n$55.$$arity = 0), nil) && 'to_n'
  })($nesting[0], null, $nesting);
  (function($base, $super, $parent_nesting) {
    var self = $klass($base, $super, 'Array');

    var $nesting = [self].concat($parent_nesting), $Array_to_n$57;

    return (Opal.def(self, '$to_n', $Array_to_n$57 = function $$to_n() {
      var self = this;

      
      var result = [];

      for (var i = 0, length = self.length; i < length; i++) {
        var obj = self[i];

        result.push($$($nesting, 'Native').$try_convert(obj, obj));
      }

      return result;
    
    }, $Array_to_n$57.$$arity = 0), nil) && 'to_n'
  })($nesting[0], null, $nesting);
  (function($base, $super, $parent_nesting) {
    var self = $klass($base, $super, 'Boolean');

    var $nesting = [self].concat($parent_nesting), $Boolean_to_n$58;

    return (Opal.def(self, '$to_n', $Boolean_to_n$58 = function $$to_n() {
      var self = this;

      return self.valueOf();
    }, $Boolean_to_n$58.$$arity = 0), nil) && 'to_n'
  })($nesting[0], null, $nesting);
  (function($base, $super, $parent_nesting) {
    var self = $klass($base, $super, 'Time');

    var $nesting = [self].concat($parent_nesting), $Time_to_n$59;

    return (Opal.def(self, '$to_n', $Time_to_n$59 = function $$to_n() {
      var self = this;

      return self
    }, $Time_to_n$59.$$arity = 0), nil) && 'to_n'
  })($nesting[0], null, $nesting);
  (function($base, $super, $parent_nesting) {
    var self = $klass($base, $super, 'NilClass');

    var $nesting = [self].concat($parent_nesting), $NilClass_to_n$60;

    return (Opal.def(self, '$to_n', $NilClass_to_n$60 = function $$to_n() {
      var self = this;

      return null;
    }, $NilClass_to_n$60.$$arity = 0), nil) && 'to_n'
  })($nesting[0], null, $nesting);
  (function($base, $super, $parent_nesting) {
    var self = $klass($base, $super, 'Hash');

    var $nesting = [self].concat($parent_nesting), $Hash_initialize$61, $Hash_to_n$62;

    
    Opal.alias(self, "_initialize", "initialize");
    
    Opal.def(self, '$initialize', $Hash_initialize$61 = function $$initialize(defaults) {
      var $iter = $Hash_initialize$61.$$p, block = $iter || nil, self = this;

      if ($iter) $Hash_initialize$61.$$p = null;
      
      
      if ($iter) $Hash_initialize$61.$$p = null;;
      ;
      
      if (defaults != null &&
           (defaults.constructor === undefined ||
             defaults.constructor === Object)) {
        var smap = self.$$smap,
            keys = self.$$keys,
            key, value;

        for (key in defaults) {
          value = defaults[key];

          if (value &&
               (value.constructor === undefined ||
                 value.constructor === Object)) {
            smap[key] = $$($nesting, 'Hash').$new(value);
          } else if (value && value.$$is_array) {
            value = value.map(function(item) {
              if (item &&
                   (item.constructor === undefined ||
                     item.constructor === Object)) {
                return $$($nesting, 'Hash').$new(item);
              }

              return self.$Native(item);
            });
            smap[key] = value
          } else {
            smap[key] = self.$Native(value);
          }

          keys.push(key);
        }

        return self;
      }

      return $send(self, '_initialize', [defaults], block.$to_proc());
    ;
    }, $Hash_initialize$61.$$arity = -1);
    return (Opal.def(self, '$to_n', $Hash_to_n$62 = function $$to_n() {
      var self = this;

      
      var result = {},
          keys = self.$$keys,
          smap = self.$$smap,
          key, value;

      for (var i = 0, length = keys.length; i < length; i++) {
        key = keys[i];

        if (key.$$is_string) {
          value = smap[key];
        } else {
          key = key.key;
          value = key.value;
        }

        result[key] = $$($nesting, 'Native').$try_convert(value, value);
      }

      return result;
    
    }, $Hash_to_n$62.$$arity = 0), nil) && 'to_n';
  })($nesting[0], null, $nesting);
  (function($base, $super, $parent_nesting) {
    var self = $klass($base, $super, 'Module');

    var $nesting = [self].concat($parent_nesting), $Module_native_module$63;

    return (Opal.def(self, '$native_module', $Module_native_module$63 = function $$native_module() {
      var self = this;

      return Opal.global[self.$name()] = self
    }, $Module_native_module$63.$$arity = 0), nil) && 'native_module'
  })($nesting[0], null, $nesting);
  (function($base, $super, $parent_nesting) {
    var self = $klass($base, $super, 'Class');

    var $nesting = [self].concat($parent_nesting), $Class_native_alias$64, $Class_native_class$65;

    
    
    Opal.def(self, '$native_alias', $Class_native_alias$64 = function $$native_alias(new_jsid, existing_mid) {
      var self = this;

      
      var aliased = self.prototype['$' + existing_mid];
      if (!aliased) {
        self.$raise($$($nesting, 'NameError').$new("" + "undefined method `" + (existing_mid) + "' for class `" + (self.$inspect()) + "'", existing_mid));
      }
      self.prototype[new_jsid] = aliased;
    
    }, $Class_native_alias$64.$$arity = 2);
    return (Opal.def(self, '$native_class', $Class_native_class$65 = function $$native_class() {
      var self = this;

      
      self.$native_module();
      return self["new"] = self.$new;;
    }, $Class_native_class$65.$$arity = 0), nil) && 'native_class';
  })($nesting[0], null, $nesting);
  return ($gvars.$ = ($gvars.global = self.$Native(Opal.global)));
};
