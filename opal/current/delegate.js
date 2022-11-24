Opal.modules["ruby2_keywords"] = function(Opal) {/* Generated by Opal 1.6.0 */
  var $klass = Opal.klass, $truthy = Opal.truthy, $slice = Opal.slice, $def = Opal.def, $defs = Opal.defs, $return_self = Opal.return_self, $return_val = Opal.return_val, $nesting = [], $$ = Opal.$r($nesting), nil = Opal.nil, main = nil;

  Opal.add_stubs('private_method_defined?,private,eval,respond_to?,method_defined?,dup');
  
  (function($base, $super) {
    var self = $klass($base, $super, 'Module');

    
    if ($truthy(self['$private_method_defined?']("ruby2_keywords"))) {
      return nil
    } else {
      
      self.$private();
      return $def(self, '$ruby2_keywords', function $$ruby2_keywords(name, $a) {
        var $post_args, $rest_arg;

        
        $post_args = $slice.call(arguments, 1);
        $rest_arg = $post_args;
        return nil;
      }, -2);
    }
  })($nesting[0], null);
  main = $$('TOPLEVEL_BINDING').$eval("self");
  if (!$truthy(main['$respond_to?']("ruby2_keywords", true))) {
    $defs(main, '$ruby2_keywords', function $$ruby2_keywords(name, $a) {
      var $post_args, $rest_arg;

      
      $post_args = $slice.call(arguments, 1);
      $rest_arg = $post_args;
      return nil;
    }, -2)
  };
  (function($base, $super) {
    var self = $klass($base, $super, 'Proc');

    
    if ($truthy(self['$method_defined?']("ruby2_keywords"))) {
      return nil
    } else {
      return $def(self, '$ruby2_keywords', $return_self, 0)
    }
  })($nesting[0], null);
  return (function(self, $parent_nesting) {
    
    
    if (!$truthy(self['$method_defined?']("ruby2_keywords_hash?"))) {
      
      $def(self, '$ruby2_keywords_hash?', $return_val(false), 0)
    };
    if ($truthy(self['$method_defined?']("ruby2_keywords_hash"))) {
      return nil
    } else {
      return $def(self, '$ruby2_keywords_hash', function $$ruby2_keywords_hash(hash) {
        
        return hash.$dup()
      }, 1)
    };
  })(Opal.get_singleton_class($$('Hash')), $nesting);
};

Opal.modules["delegate"] = function(Opal) {/* Generated by Opal 1.6.0 */
  var $freeze = Opal.freeze, $freeze_props = Opal.freeze_props, $klass = Opal.klass, $const_set = Opal.const_set, $Kernel = Opal.Kernel, $send = Opal.send, $truthy = Opal.truthy, $Object = Opal.Object, $defs = Opal.defs, $def = Opal.def, $slice = Opal.slice, $to_a = Opal.to_a, $send2 = Opal.send2, $find_super = Opal.find_super, $not = Opal.not, $hash2 = Opal.hash2, $eqeqeq = Opal.eqeqeq, $to_ary = Opal.to_ary, $eqeq = Opal.eqeq, $ensure_kwargs = Opal.ensure_kwargs, $return_ivar = Opal.return_ivar, $lambda = Opal.lambda, $rb_minus = Opal.rb_minus, $find_block_super = Opal.find_block_super, self = Opal.top, $nesting = [], $$ = Opal.$r($nesting), nil = Opal.nil, $$$ = Opal.$$$;

  Opal.add_stubs('require,dup,class_eval,alias_method,each,private_instance_methods,=~,undef_method,include,const_get,__setobj__,ruby2_keywords,__getobj__,target_respond_to?,__send__,to_proc,private_method_defined?,method_defined?,bind_call,instance_method,!,warn,private_constant,private,===,respond_to?,|,methods,public_methods,protected_methods,equal?,==,!=,eql?,__raise__,reject,instance_variables,map,instance_variable_get,each_with_index,instance_variable_set,[],clone,freeze,public_instance_methods,new,public_api,protected_instance_methods,-,module_eval,define_method,delegating_block,protected,define_singleton_method,instance_methods,include?,raise,public_instance_method');
  
  self.$require("ruby2_keywords");
  (function($base, $super, $parent_nesting) {
    var self = $klass($base, $super, 'Delegator');

    var $nesting = [self].concat($parent_nesting), $$ = Opal.$r($nesting), kernel = nil;

    
    $const_set($nesting[0], 'VERSION', "0.2.0");
    kernel = $Kernel.$dup();
    $send(kernel, 'class_eval', [], function $Delegator$1(){var self = $Delegator$1.$$s == null ? this : $Delegator$1.$$s;

      
      self.$alias_method("__raise__", "raise");
      return $send(self.$private_instance_methods(), 'each', [], function $$2(m){var self = $$2.$$s == null ? this : $$2.$$s;

        
        if (m == null) m = nil;
        if ($truthy(/^block_given\?$|^iterator\?$|^__.*__$/['$=~'](m))) {
          return nil
        };
        return self.$undef_method(m);}, {$$arity: 1, $$s: self});}, {$$arity: 0, $$s: self});
    self.$include(kernel);
    $defs(self, '$const_missing', function $$const_missing(n) {
      
      return $Object.$const_get(n)
    }, 1);
    
    $def(self, '$initialize', function $$initialize(obj) {
      var self = this;

      return self.$__setobj__(obj)
    }, 1);
    self.$ruby2_keywords($def(self, '$method_missing', function $$method_missing(m, $a) {
      var block = $$method_missing.$$p || nil, $post_args, args, self = this, r = nil, target = nil;

      $$method_missing.$$p = null;
      
      ;
      $post_args = $slice.call(arguments, 1);
      args = $post_args;
      r = true;
      target = $send(self, '__getobj__', [], function $$3(){
        return (r = false)}, 0);
      if (($truthy(r) && ($truthy(self['$target_respond_to?'](target, m, false))))) {
        return $send(target, '__send__', [m].concat($to_a(args)), block.$to_proc())
      } else if (($truthy($Kernel['$method_defined?'](m)) || ($truthy($Kernel['$private_method_defined?'](m))))) {
        return $send($Kernel.$instance_method(m), 'bind_call', [self].concat($to_a(args)), block.$to_proc())
      } else {
        return $send2(self, $find_super(self, 'method_missing', $$method_missing, false, true), 'method_missing', [m].concat($to_a(args)), block.$to_proc())
      };
    }, -2));
    
    $def(self, '$respond_to_missing?', function $Delegator_respond_to_missing$ques$4(m, include_private) {
      var self = this, r = nil, target = nil, $ret_or_1 = nil;

      
      r = true;
      target = $send(self, '__getobj__', [], function $$5(){
        return (r = false)}, 0);
      r = ($truthy(($ret_or_1 = r)) ? (self['$target_respond_to?'](target, m, include_private)) : ($ret_or_1));
      if ((($truthy(r) && ($truthy(include_private))) && ($not(self['$target_respond_to?'](target, m, false))))) {
        
        self.$warn("delegator does not forward private method #" + (m), $hash2(["uplevel"], {"uplevel": 3}));
        return false;
      };
      return r;
    }, 2);
    $const_set($nesting[0], 'KERNEL_RESPOND_TO', $Kernel.$instance_method("respond_to?"));
    self.$private_constant("KERNEL_RESPOND_TO");
    self.$private($def(self, '$target_respond_to?', function $Delegator_target_respond_to$ques$6(target, m, include_private) {
      var $ret_or_1 = nil;

      if ($eqeqeq($$('Object'), ($ret_or_1 = target))) {
        return target['$respond_to?'](m, include_private)
      } else if ($truthy($$('KERNEL_RESPOND_TO').$bind_call(target, "respond_to?"))) {
        return target['$respond_to?'](m, include_private)
      } else {
        return $$('KERNEL_RESPOND_TO').$bind_call(target, m, include_private)
      }
    }, 3));
    
    $def(self, '$methods', function $$methods(all) {
      var $yield = $$methods.$$p || nil, self = this;

      $$methods.$$p = null;
      
      if (all == null) all = true;
      return self.$__getobj__().$methods(all)['$|']($send2(self, $find_super(self, 'methods', $$methods, false, true), 'methods', [all], $yield));
    }, -1);
    
    $def(self, '$public_methods', function $$public_methods(all) {
      var $yield = $$public_methods.$$p || nil, self = this;

      $$public_methods.$$p = null;
      
      if (all == null) all = true;
      return self.$__getobj__().$public_methods(all)['$|']($send2(self, $find_super(self, 'public_methods', $$public_methods, false, true), 'public_methods', [all], $yield));
    }, -1);
    
    $def(self, '$protected_methods', function $$protected_methods(all) {
      var $yield = $$protected_methods.$$p || nil, self = this;

      $$protected_methods.$$p = null;
      
      if (all == null) all = true;
      return self.$__getobj__().$protected_methods(all)['$|']($send2(self, $find_super(self, 'protected_methods', $$protected_methods, false, true), 'protected_methods', [all], $yield));
    }, -1);
    
    $def(self, '$==', function $Delegator_$eq_eq$7(obj) {
      var self = this;

      
      if ($truthy(obj['$equal?'](self))) {
        return true
      };
      return self.$__getobj__()['$=='](obj);
    }, 1);
    
    $def(self, '$!=', function $Delegator_$not_eq$8(obj) {
      var self = this;

      
      if ($truthy(obj['$equal?'](self))) {
        return false
      };
      return self.$__getobj__()['$!='](obj);
    }, 1);
    
    $def(self, '$eql?', function $Delegator_eql$ques$9(obj) {
      var self = this;

      
      if ($truthy(obj['$equal?'](self))) {
        return true
      };
      return obj['$eql?'](self.$__getobj__());
    }, 1);
    
    $def(self, '$!', function $Delegator_$excl$10() {
      var self = this;

      return self.$__getobj__()['$!']()
    }, 0);
    
    $def(self, '$__getobj__', function $$__getobj__() {
      var self = this;

      return self.$__raise__($$$('NotImplementedError'), "need to define `__getobj__'")
    }, 0);
    
    $def(self, '$__setobj__', function $$__setobj__(obj) {
      var self = this;

      return self.$__raise__($$$('NotImplementedError'), "need to define `__setobj__'")
    }, 1);
    
    $def(self, '$marshal_dump', function $$marshal_dump() {
      var self = this, ivars = nil;

      
      ivars = $send(self.$instance_variables(), 'reject', [], function $$11(var$){
        
        if (var$ == null) var$ = nil;
        return /^@delegate_/['$=~'](var$);}, 1);
      return ["__v2__", ivars, $send(ivars, 'map', [], function $$12(var$){var self = $$12.$$s == null ? this : $$12.$$s;

        
        if (var$ == null) var$ = nil;
        return self.$instance_variable_get(var$);}, {$$arity: 1, $$s: self}), self.$__getobj__()];
    }, 0);
    
    $def(self, '$marshal_load', function $$marshal_load(data) {
      var $a, $b, self = this, version = nil, vars = nil, values = nil, obj = nil;

      
      $b = data, $a = $to_ary($b), (version = ($a[0] == null ? nil : $a[0])), (vars = ($a[1] == null ? nil : $a[1])), (values = ($a[2] == null ? nil : $a[2])), (obj = ($a[3] == null ? nil : $a[3])), $b;
      if ($eqeq(version, "__v2__")) {
        
        $send(vars, 'each_with_index', [], function $$13(var$, i){var self = $$13.$$s == null ? this : $$13.$$s;

          
          if (var$ == null) var$ = nil;
          if (i == null) i = nil;
          return self.$instance_variable_set(var$, values['$[]'](i));}, {$$arity: 2, $$s: self});
        return self.$__setobj__(obj);
      } else {
        return self.$__setobj__(data)
      };
    }, 1);
    
    $def(self, '$initialize_clone', function $$initialize_clone(obj, $kwargs) {
      var freeze, self = this;

      
      $kwargs = $ensure_kwargs($kwargs);
      
      freeze = $kwargs.$$smap["freeze"];if (freeze == null) freeze = nil;
      return self.$__setobj__(obj.$__getobj__().$clone($hash2(["freeze"], {"freeze": freeze})));
    }, -2);
    
    $def(self, '$initialize_dup', function $$initialize_dup(obj) {
      var self = this;

      return self.$__setobj__(obj.$__getobj__().$dup())
    }, 1);
    self.$private("initialize_clone", "initialize_dup");
    
    $def(self, '$freeze', function $$freeze() {
      var self = this;

      
      self.$__getobj__().$freeze();
      $freeze_props(self);
      return $freeze(self);;
    }, 0);
    
    $def(self, '$frozen?', function $Delegator_frozen$ques$14() {
      var self = this;

      return (self.$$frozen || false);
    }, 0);
    self.delegator_api = self.$public_instance_methods();
    return $defs(self, '$public_api', $return_ivar("delegator_api"), 0);
  })($nesting[0], $$('BasicObject'), $nesting);
  (function($base, $super) {
    var self = $klass($base, $super, 'SimpleDelegator');

    var $proto = self.$$prototype;

    $proto.delegate_sd_obj = nil;
    
    
    $def(self, '$__getobj__', function $$__getobj__() {
      var $a, $yield = $$__getobj__.$$p || nil, self = this;

      $$__getobj__.$$p = null;
      
      if (!$truthy((($a = self['delegate_sd_obj'], $a != null && $a !== nil) ? 'instance-variable' : nil))) {
        
        if (($yield !== nil)) {
          return Opal.yieldX($yield, [])
        };
        self.$__raise__($$$('ArgumentError'), "not delegated");
      };
      return self.delegate_sd_obj;
    }, 0);
    return $def(self, '$__setobj__', function $$__setobj__(obj) {
      var self = this;

      
      if ($truthy(self['$equal?'](obj))) {
        self.$__raise__($$$('ArgumentError'), "cannot delegate to self")
      };
      return (self.delegate_sd_obj = obj);
    }, 1);
  })($nesting[0], $$('Delegator'));
  $defs($$('Delegator'), '$delegating_block', function $$delegating_block(mid) {
    var $yield = $$delegating_block.$$p || nil, self = this;

    $$delegating_block.$$p = null;
    return $lambda(function $$15($a){var block = $$15.$$p || nil, $post_args, args, self = $$15.$$s == null ? this : $$15.$$s, target = nil;

      $$15.$$p = null;
      
      ;
      $post_args = $slice.call(arguments);
      args = $post_args;
      target = self.$__getobj__();
      return $send(target, '__send__', [mid].concat($to_a(args)), block.$to_proc());}, {$$arity: -1, $$s: self}).$ruby2_keywords()
  }, 1);
  return $def(self, '$DelegateClass', function $$DelegateClass(superclass) {
    var block = $$DelegateClass.$$p || nil, self = this, klass = nil, ignores = nil, protected_instance_methods = nil, public_instance_methods = nil;

    $$DelegateClass.$$p = null;
    
    ;
    klass = $$('Class').$new($$('Delegator'));
    ignores = [].concat($to_a($$$('Delegator').$public_api())).concat(["to_s", "inspect", "=~", "!~", "==="]);
    protected_instance_methods = superclass.$protected_instance_methods();
    protected_instance_methods = $rb_minus(protected_instance_methods, ignores);
    public_instance_methods = superclass.$public_instance_methods();
    public_instance_methods = $rb_minus(public_instance_methods, ignores);
    $send(klass, 'module_eval', [], function $$16(){var self = $$16.$$s == null ? this : $$16.$$s;

      
      
      $def(self, '$__getobj__', function $$__getobj__() {
        var $a, $yield = $$__getobj__.$$p || nil, self = this;
        if (self.delegate_dc_obj == null) self.delegate_dc_obj = nil;

        $$__getobj__.$$p = null;
        
        if (!$truthy((($a = self['delegate_dc_obj'], $a != null && $a !== nil) ? 'instance-variable' : nil))) {
          
          if (($yield !== nil)) {
            return Opal.yieldX($yield, [])
          };
          self.$__raise__($$$('ArgumentError'), "not delegated");
        };
        return self.delegate_dc_obj;
      }, 0);
      
      $def(self, '$__setobj__', function $$__setobj__(obj) {
        var self = this;

        
        if ($truthy(self['$equal?'](obj))) {
          self.$__raise__($$$('ArgumentError'), "cannot delegate to self")
        };
        return (self.delegate_dc_obj = obj);
      }, 1);
      $send(protected_instance_methods, 'each', [], function $$17(method){var self = $$17.$$s == null ? this : $$17.$$s;

        
        if (method == null) method = nil;
        self.$define_method(method, $$('Delegator').$delegating_block(method));
        return self.$protected(method);}, {$$arity: 1, $$s: self});
      return $send(public_instance_methods, 'each', [], function $$18(method){var self = $$18.$$s == null ? this : $$18.$$s;

        
        if (method == null) method = nil;
        return self.$define_method(method, $$('Delegator').$delegating_block(method));}, {$$arity: 1, $$s: self});}, {$$arity: 0, $$s: self});
    $send(klass, 'define_singleton_method', ["public_instance_methods"], function $$19(all){var self = $$19.$$s == null ? this : $$19.$$s;

      
      if (all == null) all = true;
      return $send2(self, $find_block_super(self, 'DelegateClass', ($$19.$$def || $$DelegateClass), false, false), 'DelegateClass', [all], null)['$|'](superclass.$public_instance_methods());}, {$$arity: -1, $$s: self});
    $send(klass, 'define_singleton_method', ["protected_instance_methods"], function $$20(all){var self = $$20.$$s == null ? this : $$20.$$s;

      
      if (all == null) all = true;
      return $send2(self, $find_block_super(self, 'DelegateClass', ($$20.$$def || $$DelegateClass), false, false), 'DelegateClass', [all], null)['$|'](superclass.$protected_instance_methods());}, {$$arity: -1, $$s: self});
    $send(klass, 'define_singleton_method', ["instance_methods"], function $$21(all){var self = $$21.$$s == null ? this : $$21.$$s;

      
      if (all == null) all = true;
      return $send2(self, $find_block_super(self, 'DelegateClass', ($$21.$$def || $$DelegateClass), false, false), 'DelegateClass', [all], null)['$|'](superclass.$instance_methods());}, {$$arity: -1, $$s: self});
    $send(klass, 'define_singleton_method', ["public_instance_method"], function $$22(name){var self = $$22.$$s == null ? this : $$22.$$s;

      
      if (name == null) name = nil;
      try {
        return $send2(self, $find_block_super(self, 'DelegateClass', ($$22.$$def || $$DelegateClass), false, false), 'DelegateClass', [name], null)
      } catch ($err) {
        if (Opal.rescue($err, [$$('NameError')])) {
          try {
            
            if (!$truthy(self.$public_instance_methods()['$include?'](name))) {
              self.$raise()
            };
            return superclass.$public_instance_method(name);
          } finally { Opal.pop_exception(); }
        } else { throw $err; }
      };}, {$$arity: 1, $$s: self});
    $send(klass, 'define_singleton_method', ["instance_method"], function $$23(name){var self = $$23.$$s == null ? this : $$23.$$s;

      
      if (name == null) name = nil;
      try {
        return $send2(self, $find_block_super(self, 'DelegateClass', ($$23.$$def || $$DelegateClass), false, false), 'DelegateClass', [name], null)
      } catch ($err) {
        if (Opal.rescue($err, [$$('NameError')])) {
          try {
            
            if (!$truthy(self.$instance_methods()['$include?'](name))) {
              self.$raise()
            };
            return superclass.$instance_method(name);
          } finally { Opal.pop_exception(); }
        } else { throw $err; }
      };}, {$$arity: 1, $$s: self});
    if ($truthy(block)) {
      $send(klass, 'module_eval', [], block.$to_proc())
    };
    return klass;
  }, 1);
};
