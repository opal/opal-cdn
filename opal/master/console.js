Opal.modules["native"] = function(Opal) {/* Generated by Opal 1.5.0.dev */
  var self = Opal.top, $nesting = [], $$ = Opal.$r($nesting), nil = Opal.nil, $$$ = Opal.$$$, $module = Opal.module, $defs = Opal.defs, $truthy = Opal.truthy, $send = Opal.send, $Kernel = Opal.Kernel, $hash2 = Opal.hash2, $range = Opal.range, $to_a = Opal.to_a, $def = Opal.def, $alias = Opal.alias, $klass = Opal.klass, $rb_minus = Opal.rb_minus, $send2 = Opal.send2, $find_super = Opal.find_super, $eqeqeq = Opal.eqeqeq, $rb_ge = Opal.rb_ge, $gvars = Opal.gvars;

  Opal.add_stubs('try_convert,native?,respond_to?,to_n,raise,inspect,Native,proc,map!,end_with?,define_method,[],convert,call,to_proc,new,each,native_reader,native_writer,extend,warn,include,is_a?,map,to_a,_Array,method_missing,bind,instance_method,slice,-,length,[]=,enum_for,===,>=,<<,each_pair,method_defined?,_initialize,name,native_module');
  
  (function($base, $parent_nesting) {
    var self = $module($base, 'Native');

    var $nesting = [self].concat($parent_nesting), $$ = Opal.$r($nesting);

    
    $defs(self, '$is_a?', function $Native_is_a$ques$1(object, klass) {
      var self = this;

      
      try {
        return object instanceof self.$try_convert(klass);
      }
      catch (e) {
        return false;
      }
    
    }, 2);
    $defs(self, '$try_convert', function $$try_convert(value, default$) {
      var self = this;

      
      
      if (default$ == null) default$ = nil;;
      
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
    }, -2);
    $defs(self, '$convert', function $$convert(value) {
      var self = this;

      
      if (self['$native?'](value)) {
        return value;
      }
      else if (value['$respond_to?']("to_n")) {
        return value.$to_n();
      }
      else {
        self.$raise($$('ArgumentError'), "" + (value.$inspect()) + " isn't native");
      }
    
    }, 1);
    $defs(self, '$call', function $$call(obj, key, $a) {
      var block = $$call.$$p || nil, $post_args, args, self = this;

      delete $$call.$$p;
      
      ;
      
      $post_args = Opal.slice.call(arguments, 2);
      
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
    }, -3);
    $defs(self, '$proc', function $$proc() {
      var block = $$proc.$$p || nil, self = this;

      delete $$proc.$$p;
      
      ;
      if (!$truthy(block)) {
        self.$raise($$('LocalJumpError'), "no block given")
      };
      return $send($Kernel, 'proc', [], function $$2($a){var $post_args, args, self = $$2.$$s == null ? this : $$2.$$s, instance = nil;

        
        
        $post_args = Opal.slice.call(arguments);
        
        args = $post_args;;
        $send(args, 'map!', [], function $$3(arg){var self = $$3.$$s == null ? this : $$3.$$s;

          
          
          if (arg == null) arg = nil;;
          return self.$Native(arg);}, {$$arity: 1, $$s: self});
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
      ;}, {$$arity: -1, $$s: self});
    }, 0);
    (function($base, $parent_nesting) {
      var self = $module($base, 'Helpers');

      var $nesting = [self].concat($parent_nesting), $$ = Opal.$r($nesting);

      
      
      $def(self, '$alias_native', function $$alias_native(new$, $a, $b) {
        var $post_args, $kwargs, old, as, $yield = $$alias_native.$$p || nil, self = this;

        delete $$alias_native.$$p;
        
        
        $post_args = Opal.slice.call(arguments, 1);
        
        $kwargs = Opal.extract_kwargs($post_args);
        
        if ($kwargs == null) {
          $kwargs = $hash2([], {});
        } else if (!$kwargs.$$is_hash) {
          throw Opal.ArgumentError.$new('expected kwargs');
        };
        
        if ($post_args.length > 0) old = $post_args.shift();
        if (old == null) old = new$;;
        
        as = $kwargs.$$smap["as"];
        if (as == null) as = nil;
        if ($truthy(old['$end_with?']("="))) {
          return $send(self, 'define_method', [new$], function $$4(value){var self = $$4.$$s == null ? this : $$4.$$s;
            if (self["native"] == null) self["native"] = nil;

            
            
            if (value == null) value = nil;;
            self["native"][old['$[]']($range(0, -2, false))] = $$('Native').$convert(value);
            return value;}, {$$arity: 1, $$s: self})
        } else if ($truthy(as)) {
          return $send(self, 'define_method', [new$], function $$5($c){var block = $$5.$$p || nil, $post_args, args, self = $$5.$$s == null ? this : $$5.$$s, value = nil;
            if (self["native"] == null) self["native"] = nil;

            delete $$5.$$p;
            
            ;
            
            $post_args = Opal.slice.call(arguments);
            
            args = $post_args;;
            value = $send($$('Native'), 'call', [self["native"], old].concat($to_a(args)), block.$to_proc());
            if ($truthy(value)) {
              return as.$new(value.$to_n())
            } else {
              return nil
            };}, {$$arity: -1, $$s: self})
        } else {
          return $send(self, 'define_method', [new$], function $$6($c){var block = $$6.$$p || nil, $post_args, args, self = $$6.$$s == null ? this : $$6.$$s;
            if (self["native"] == null) self["native"] = nil;

            delete $$6.$$p;
            
            ;
            
            $post_args = Opal.slice.call(arguments);
            
            args = $post_args;;
            return $send($$('Native'), 'call', [self["native"], old].concat($to_a(args)), block.$to_proc());}, {$$arity: -1, $$s: self})
        };
      }, -2);
      
      $def(self, '$native_reader', function $$native_reader($a) {
        var $post_args, names, self = this;

        
        
        $post_args = Opal.slice.call(arguments);
        
        names = $post_args;;
        return $send(names, 'each', [], function $$7(name){var self = $$7.$$s == null ? this : $$7.$$s;

          
          
          if (name == null) name = nil;;
          return $send(self, 'define_method', [name], function $$8(){var self = $$8.$$s == null ? this : $$8.$$s;
            if (self["native"] == null) self["native"] = nil;

            return self.$Native(self["native"][name])}, {$$arity: 0, $$s: self});}, {$$arity: 1, $$s: self});
      }, -1);
      
      $def(self, '$native_writer', function $$native_writer($a) {
        var $post_args, names, self = this;

        
        
        $post_args = Opal.slice.call(arguments);
        
        names = $post_args;;
        return $send(names, 'each', [], function $$9(name){var self = $$9.$$s == null ? this : $$9.$$s;

          
          
          if (name == null) name = nil;;
          return $send(self, 'define_method', ["" + (name) + "="], function $$10(value){var self = $$10.$$s == null ? this : $$10.$$s;
            if (self["native"] == null) self["native"] = nil;

            
            
            if (value == null) value = nil;;
            return self.$Native(self["native"][name] = value);}, {$$arity: 1, $$s: self});}, {$$arity: 1, $$s: self});
      }, -1);
      return $def(self, '$native_accessor', function $$native_accessor($a) {
        var $post_args, names, self = this;

        
        
        $post_args = Opal.slice.call(arguments);
        
        names = $post_args;;
        $send(self, 'native_reader', $to_a(names));
        return $send(self, 'native_writer', $to_a(names));
      }, -1);
    })($nesting[0], $nesting);
    (function($base, $parent_nesting) {
      var self = $module($base, 'Wrapper');

      var $nesting = [self].concat($parent_nesting), $$ = Opal.$r($nesting);

      
      
      $def(self, '$initialize', function $$initialize(native$) {
        var self = this;

        
        if (!$truthy($Kernel['$native?'](native$))) {
          $Kernel.$raise($$('ArgumentError'), "" + (native$.$inspect()) + " isn't native")
        };
        return (self["native"] = native$);
      }, 1);
      
      $def(self, '$to_n', function $$to_n() {
        var self = this;
        if (self["native"] == null) self["native"] = nil;

        return self["native"]
      }, 0);
      return $defs(self, '$included', function $$included(klass) {
        
        return klass.$extend($$('Helpers'))
      }, 1);
    })($nesting[0], $nesting);
    return $defs(self, '$included', function $$included(base) {
      var self = this;

      
      self.$warn("Including ::Native is deprecated. Please include Native::Wrapper instead.");
      return base.$include($$('Wrapper'));
    }, 1);
  })($nesting[0], $nesting);
  (function($base, $parent_nesting) {
    var self = $module($base, 'Kernel');

    var $nesting = [self].concat($parent_nesting), $$ = Opal.$r($nesting);

    
    
    $def(self, '$native?', function $Kernel_native$ques$11(value) {
      
      return value == null || !value.$$class;
    }, 1);
    
    $def(self, '$Native', function $$Native(obj) {
      var $yield = $$Native.$$p || nil, self = this;

      delete $$Native.$$p;
      if ($truthy(obj == null)) {
        return nil
      } else if ($truthy(self['$native?'](obj))) {
        return $$$($$('Native'), 'Object').$new(obj)
      } else if ($truthy(obj['$is_a?']($$('Array')))) {
        return $send(obj, 'map', [], function $$12(o){var self = $$12.$$s == null ? this : $$12.$$s;

          
          
          if (o == null) o = nil;;
          return self.$Native(o);}, {$$arity: 1, $$s: self})
      } else if ($truthy(obj['$is_a?']($$('Proc')))) {
        return $send(self, 'proc', [], function $$13($a){var block = $$13.$$p || nil, $post_args, args, self = $$13.$$s == null ? this : $$13.$$s;

          delete $$13.$$p;
          
          ;
          
          $post_args = Opal.slice.call(arguments);
          
          args = $post_args;;
          return self.$Native($send(obj, 'call', $to_a(args), block.$to_proc()));}, {$$arity: -1, $$s: self})
      } else {
        return obj
      }
    }, 1);
    $alias(self, "_Array", "Array");
    return $def(self, '$Array', function $$Array(object, $a) {
      var block = $$Array.$$p || nil, $post_args, args, self = this;

      delete $$Array.$$p;
      
      ;
      
      $post_args = Opal.slice.call(arguments, 1);
      
      args = $post_args;;
      if ($truthy(self['$native?'](object))) {
        return $send($$$($$('Native'), 'Array'), 'new', [object].concat($to_a(args)), block.$to_proc()).$to_a()
      };
      return self.$_Array(object);
    }, -2);
  })($nesting[0], $nesting);
  (function($base, $super) {
    var self = $klass($base, $super, 'Object');

    var $proto = self.$$prototype;

    $proto["native"] = nil;
    
    self.$include($$$($$$('Native'), 'Wrapper'));
    
    $def(self, '$==', function $Object_$eq_eq$14(other) {
      var self = this;

      return self["native"] === $$$('Native').$try_convert(other)
    }, 1);
    
    $def(self, '$has_key?', function $Object_has_key$ques$15(name) {
      var self = this;

      return Opal.hasOwnProperty.call(self["native"], name)
    }, 1);
    
    $def(self, '$each', function $$each($a) {
      var $post_args, args, $yield = $$each.$$p || nil, self = this;

      delete $$each.$$p;
      
      
      $post_args = Opal.slice.call(arguments);
      
      args = $post_args;;
      if (($yield !== nil)) {
        
        
        for (var key in self["native"]) {
          Opal.yieldX($yield, [key, self["native"][key]])
        }
      ;
        return self;
      } else {
        return $send(self, 'method_missing', ["each"].concat($to_a(args)))
      };
    }, -1);
    
    $def(self, '$[]', function $Object_$$$16(key) {
      var self = this;

      
      var prop = self["native"][key];

      if (prop instanceof Function) {
        return prop;
      }
      else {
        return $$$('Native').$call(self["native"], key)
      }
    
    }, 1);
    
    $def(self, '$[]=', function $Object_$$$eq$17(key, value) {
      var self = this, native$ = nil;

      
      native$ = $$$('Native').$try_convert(value);
      if ($truthy(native$ === nil)) {
        return self["native"][key] = value
      } else {
        return self["native"][key] = native$
      };
    }, 2);
    
    $def(self, '$merge!', function $Object_merge$excl$18(other) {
      var self = this;

      
      
      other = $$$('Native').$convert(other);

      for (var prop in other) {
        self["native"][prop] = other[prop];
      }
    ;
      return self;
    }, 1);
    
    $def(self, '$respond_to?', function $Object_respond_to$ques$19(name, include_all) {
      var self = this;

      
      
      if (include_all == null) include_all = false;;
      return $Kernel.$instance_method("respond_to?").$bind(self).$call(name, include_all);
    }, -2);
    
    $def(self, '$respond_to_missing?', function $Object_respond_to_missing$ques$20(name, include_all) {
      var self = this;

      
      
      if (include_all == null) include_all = false;;
      return Opal.hasOwnProperty.call(self["native"], name);
    }, -2);
    
    $def(self, '$method_missing', function $$method_missing(mid, $a) {
      var block = $$method_missing.$$p || nil, $post_args, args, self = this, $writer = nil;

      delete $$method_missing.$$p;
      
      ;
      
      $post_args = Opal.slice.call(arguments, 1);
      
      args = $post_args;;
      
      if (mid.charAt(mid.length - 1) === '=') {
        return (($writer = [mid.$slice(0, $rb_minus(mid.$length(), 1)), args['$[]'](0)]), $send(self, '[]=', $to_a($writer)), $writer[$rb_minus($writer["length"], 1)]);
      }
      else {
        return $send($$$('Native'), 'call', [self["native"], mid].concat($to_a(args)), block.$to_proc());
      }
    ;
    }, -2);
    
    $def(self, '$nil?', function $Object_nil$ques$21() {
      
      return false
    }, 0);
    
    $def(self, '$is_a?', function $Object_is_a$ques$22(klass) {
      var self = this;

      return Opal.is_a(self, klass);
    }, 1);
    
    $def(self, '$instance_of?', function $Object_instance_of$ques$23(klass) {
      var self = this;

      return self.$$class === klass;
    }, 1);
    
    $def(self, '$class', function $Object_class$24() {
      var self = this;

      return self.$$class;
    }, 0);
    
    $def(self, '$to_a', function $$to_a(options) {
      var block = $$to_a.$$p || nil, self = this;

      delete $$to_a.$$p;
      
      ;
      
      if (options == null) options = $hash2([], {});;
      return $send($$$($$$('Native'), 'Array'), 'new', [self["native"], options], block.$to_proc()).$to_a();
    }, -1);
    
    $def(self, '$inspect', function $$inspect() {
      var self = this;

      return "#<Native:" + (String(self["native"])) + ">"
    }, 0);
    $alias(self, "include?", "has_key?");
    $alias(self, "key?", "has_key?");
    $alias(self, "kind_of?", "is_a?");
    return $alias(self, "member?", "has_key?");
  })($$('Native'), $$('BasicObject'));
  (function($base, $super, $parent_nesting) {
    var self = $klass($base, $super, 'Array');

    var $nesting = [self].concat($parent_nesting), $$ = Opal.$r($nesting), $proto = self.$$prototype;

    $proto.named = $proto["native"] = $proto.get = $proto.block = $proto.set = $proto.length = nil;
    
    self.$include($$$($$('Native'), 'Wrapper'));
    self.$include($$('Enumerable'));
    
    $def(self, '$initialize', function $$initialize(native$, options) {
      var block = $$initialize.$$p || nil, self = this, $ret_or_1 = nil;

      delete $$initialize.$$p;
      
      ;
      
      if (options == null) options = $hash2([], {});;
      $send2(self, $find_super(self, 'initialize', $$initialize, false, true), 'initialize', [native$], null);
      self.get = ($truthy(($ret_or_1 = options['$[]']("get"))) ? ($ret_or_1) : (options['$[]']("access")));
      self.named = options['$[]']("named");
      self.set = ($truthy(($ret_or_1 = options['$[]']("set"))) ? ($ret_or_1) : (options['$[]']("access")));
      self.length = ($truthy(($ret_or_1 = options['$[]']("length"))) ? ($ret_or_1) : ("length"));
      self.block = block;
      if ($truthy(self.$length() == null)) {
        return self.$raise($$('ArgumentError'), "no length found on the array-like object")
      } else {
        return nil
      };
    }, -2);
    
    $def(self, '$each', function $$each() {
      var block = $$each.$$p || nil, self = this;

      delete $$each.$$p;
      
      ;
      if (!$truthy(block)) {
        return self.$enum_for("each")
      };
      
      for (var i = 0, length = self.$length(); i < length; i++) {
        Opal.yield1(block, self['$[]'](i));
      }
    ;
      return self;
    }, 0);
    
    $def(self, '$[]', function $Array_$$$25(index) {
      var self = this, result = nil, $ret_or_1 = nil;

      
      result = (($eqeqeq($$('String'), ($ret_or_1 = index)) || ($eqeqeq($$('Symbol'), $ret_or_1))) ? (($truthy(self.named) ? (self["native"][self.named](index)) : (self["native"][index]))) : ($eqeqeq($$('Integer'), $ret_or_1) ? (($truthy(self.get) ? (self["native"][self.get](index)) : (self["native"][index]))) : (nil)));
      if ($truthy(result)) {
        if ($truthy(self.block)) {
          return self.block.$call(result)
        } else {
          return self.$Native(result)
        }
      } else {
        return nil
      };
    }, 1);
    
    $def(self, '$[]=', function $Array_$$$eq$26(index, value) {
      var self = this;

      if ($truthy(self.set)) {
        return self["native"][self.set](index, $$('Native').$convert(value))
      } else {
        return self["native"][index] = $$('Native').$convert(value)
      }
    }, 2);
    
    $def(self, '$last', function $$last(count) {
      var $a, self = this, index = nil, result = nil;

      
      
      if (count == null) count = nil;;
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
    }, -1);
    
    $def(self, '$length', function $$length() {
      var self = this;

      return self["native"][self.length]
    }, 0);
    
    $def(self, '$inspect', function $$inspect() {
      var self = this;

      return self.$to_a().$inspect()
    }, 0);
    return $alias(self, "to_ary", "to_a");
  })($$('Native'), null, $nesting);
  (function($base, $super) {
    var self = $klass($base, $super, 'Numeric');

    
    return $def(self, '$to_n', function $$to_n() {
      var self = this;

      return self.valueOf();
    }, 0)
  })($nesting[0], null);
  (function($base, $super) {
    var self = $klass($base, $super, 'Proc');

    
    return $def(self, '$to_n', function $$to_n() {
      var self = this;

      return self
    }, 0)
  })($nesting[0], null);
  (function($base, $super) {
    var self = $klass($base, $super, 'String');

    
    return $def(self, '$to_n', function $$to_n() {
      var self = this;

      return self.valueOf();
    }, 0)
  })($nesting[0], null);
  (function($base, $super) {
    var self = $klass($base, $super, 'Regexp');

    
    return $def(self, '$to_n', function $$to_n() {
      var self = this;

      return self.valueOf();
    }, 0)
  })($nesting[0], null);
  (function($base, $super) {
    var self = $klass($base, $super, 'MatchData');

    var $proto = self.$$prototype;

    $proto.matches = nil;
    return $def(self, '$to_n', function $$to_n() {
      var self = this;

      return self.matches
    }, 0)
  })($nesting[0], null);
  (function($base, $super, $parent_nesting) {
    var self = $klass($base, $super, 'Struct');

    var $nesting = [self].concat($parent_nesting), $$ = Opal.$r($nesting);

    return $def(self, '$to_n', function $$to_n() {
      var self = this, result = nil;

      
      result = {};
      $send(self, 'each_pair', [], function $$27(name, value){
        
        
        if (name == null) name = nil;;
        
        if (value == null) value = nil;;
        return result[name] = $$('Native').$try_convert(value, value);}, 2);
      return result;
    }, 0)
  })($nesting[0], null, $nesting);
  (function($base, $super, $parent_nesting) {
    var self = $klass($base, $super, 'Array');

    var $nesting = [self].concat($parent_nesting), $$ = Opal.$r($nesting);

    return $def(self, '$to_n', function $$to_n() {
      var self = this;

      
      var result = [];

      for (var i = 0, length = self.length; i < length; i++) {
        var obj = self[i];

        result.push($$('Native').$try_convert(obj, obj));
      }

      return result;
    
    }, 0)
  })($nesting[0], null, $nesting);
  (function($base, $super) {
    var self = $klass($base, $super, 'Boolean');

    
    return $def(self, '$to_n', function $$to_n() {
      var self = this;

      return self.valueOf();
    }, 0)
  })($nesting[0], null);
  (function($base, $super) {
    var self = $klass($base, $super, 'Time');

    
    return $def(self, '$to_n', function $$to_n() {
      var self = this;

      return self
    }, 0)
  })($nesting[0], null);
  (function($base, $super) {
    var self = $klass($base, $super, 'NilClass');

    
    return $def(self, '$to_n', function $$to_n() {
      
      return null;
    }, 0)
  })($nesting[0], null);
  if (!$truthy($$('Hash')['$method_defined?']("_initialize"))) {
    (function($base, $super, $parent_nesting) {
      var self = $klass($base, $super, 'Hash');

      var $nesting = [self].concat($parent_nesting), $$ = Opal.$r($nesting);

      
      $alias(self, "_initialize", "initialize");
      
      $def(self, '$initialize', function $$initialize(defaults) {
        var block = $$initialize.$$p || nil, self = this;

        delete $$initialize.$$p;
        
        ;
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
              smap[key] = $$('Hash').$new(value);
            } else if (value && value.$$is_array) {
              value = value.map(function(item) {
                if (item &&
                     (item.constructor === undefined ||
                       item.constructor === Object)) {
                  return $$('Hash').$new(item);
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
      }, -1);
      return $def(self, '$to_n', function $$to_n() {
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

          result[key] = $$('Native').$try_convert(value, value);
        }

        return result;
      
      }, 0);
    })($nesting[0], null, $nesting)
  };
  (function($base, $super) {
    var self = $klass($base, $super, 'Module');

    
    return $def(self, '$native_module', function $$native_module() {
      var self = this;

      return Opal.global[self.$name()] = self
    }, 0)
  })($nesting[0], null);
  (function($base, $super, $parent_nesting) {
    var self = $klass($base, $super, 'Class');

    var $nesting = [self].concat($parent_nesting), $$ = Opal.$r($nesting);

    
    
    $def(self, '$native_alias', function $$native_alias(new_jsid, existing_mid) {
      var self = this;

      
      var aliased = self.prototype['$' + existing_mid];
      if (!aliased) {
        self.$raise($$('NameError').$new("undefined method `" + (existing_mid) + "' for class `" + (self.$inspect()) + "'", existing_mid));
      }
      self.prototype[new_jsid] = aliased;
    
    }, 2);
    return $def(self, '$native_class', function $$native_class() {
      var self = this;

      
      self.$native_module();
      return self["new"] = self.$new;;
    }, 0);
  })($nesting[0], null, $nesting);
  return ($gvars.$ = ($gvars.global = self.$Native(Opal.global)));
};

Opal.modules["console"] = function(Opal) {/* Generated by Opal 1.5.0.dev */
  var self = Opal.top, $nesting = [], $$ = Opal.$r($nesting), nil = Opal.nil, $$$ = Opal.$$$, $klass = Opal.klass, $def = Opal.def, $truthy = Opal.truthy, $eqeq = Opal.eqeq, $send = Opal.send, $gvars = Opal.gvars;

  Opal.add_stubs('require,include,raise,==,arity,instance_exec,to_proc,new');
  
  self.$require("native");
  (function($base, $super, $parent_nesting) {
    var self = $klass($base, $super, 'Console');

    var $nesting = [self].concat($parent_nesting), $$ = Opal.$r($nesting), $proto = self.$$prototype;

    $proto["native"] = nil;
    
    self.$include($$$($$('Native'), 'Wrapper'));
    
    $def(self, '$clear', function $$clear() {
      var self = this;

      return self["native"].clear()
    }, 0);
    
    $def(self, '$trace', function $$trace() {
      var self = this;

      return self["native"].trace()
    }, 0);
    
    $def(self, '$log', function $$log($a) {
      var $post_args, args, self = this;

      
      
      $post_args = Opal.slice.call(arguments);
      
      args = $post_args;;
      return self["native"].log.apply(self["native"], args);
    }, -1);
    
    $def(self, '$info', function $$info($a) {
      var $post_args, args, self = this;

      
      
      $post_args = Opal.slice.call(arguments);
      
      args = $post_args;;
      return self["native"].info.apply(self["native"], args);
    }, -1);
    
    $def(self, '$warn', function $$warn($a) {
      var $post_args, args, self = this;

      
      
      $post_args = Opal.slice.call(arguments);
      
      args = $post_args;;
      return self["native"].warn.apply(self["native"], args);
    }, -1);
    
    $def(self, '$error', function $$error($a) {
      var $post_args, args, self = this;

      
      
      $post_args = Opal.slice.call(arguments);
      
      args = $post_args;;
      return self["native"].error.apply(self["native"], args);
    }, -1);
    
    $def(self, '$time', function $$time(label) {
      var block = $$time.$$p || nil, self = this;

      delete $$time.$$p;
      
      ;
      if (!$truthy(block)) {
        self.$raise($$('ArgumentError'), "no block given")
      };
      self["native"].time(label);
      
      return (function() { try {
      if ($eqeq(block.$arity(), 0)) {
        return $send(self, 'instance_exec', [], block.$to_proc())
      } else {
        return Opal.yield1(block, self);
      }
      } finally {
        self["native"].timeEnd()
      }; })();;
    }, 1);
    
    $def(self, '$group', function $$group($a) {
      var block = $$group.$$p || nil, $post_args, args, self = this;

      delete $$group.$$p;
      
      ;
      
      $post_args = Opal.slice.call(arguments);
      
      args = $post_args;;
      if (!$truthy(block)) {
        self.$raise($$('ArgumentError'), "no block given")
      };
      self["native"].group.apply(self["native"], args);
      
      return (function() { try {
      if ($eqeq(block.$arity(), 0)) {
        return $send(self, 'instance_exec', [], block.$to_proc())
      } else {
        return Opal.yield1(block, self);
      }
      } finally {
        self["native"].groupEnd()
      }; })();;
    }, -1);
    return $def(self, '$group!', function $Console_group$excl$1($a) {
      var block = $Console_group$excl$1.$$p || nil, $post_args, args, self = this;

      delete $Console_group$excl$1.$$p;
      
      ;
      
      $post_args = Opal.slice.call(arguments);
      
      args = $post_args;;
      if (!(block !== nil)) {
        return nil
      };
      self["native"].groupCollapsed.apply(self["native"], args);
      
      return (function() { try {
      if ($eqeq(block.$arity(), 0)) {
        return $send(self, 'instance_exec', [], block.$to_proc())
      } else {
        return Opal.yield1(block, self);
      }
      } finally {
        self["native"].groupEnd()
      }; })();;
    }, -1);
  })($nesting[0], null, $nesting);
  if ($truthy((typeof(Opal.global.console) !== "undefined"))) {
    return ($gvars.console = $$('Console').$new(Opal.global.console))
  } else {
    return nil
  };
};
