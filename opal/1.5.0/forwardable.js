Opal.modules["forwardable"] = function(Opal) {/* Generated by Opal 1.5.0 */
  var $nesting = [], nil = Opal.nil, $module = Opal.module, $send = Opal.send, $truthy = Opal.truthy, $def = Opal.def, $to_a = Opal.to_a, $alias = Opal.alias;

  Opal.add_stubs('each,respond_to?,def_instance_delegator,include?,start_with?,to_s,define_method,__send__,instance_variable_get,to_proc,instance_delegate,def_instance_delegators,def_single_delegator,define_singleton_method,single_delegate,def_single_delegators');
  
  (function($base) {
    var self = $module($base, 'Forwardable');

    
    
    
    $def(self, '$instance_delegate', function $$instance_delegate(hash) {
      var self = this;

      return $send(hash, 'each', [], function $$1(methods, accessor){var self = $$1.$$s == null ? this : $$1.$$s;

        
        
        if (methods == null) methods = nil;;
        
        if (accessor == null) accessor = nil;;
        if (!$truthy(methods['$respond_to?']("each"))) {
          methods = [methods]
        };
        return $send(methods, 'each', [], function $$2(method){var self = $$2.$$s == null ? this : $$2.$$s;

          
          
          if (method == null) method = nil;;
          return self.$def_instance_delegator(accessor, method);}, {$$arity: 1, $$s: self});}, {$$arity: 2, $$s: self})
    }, 1);
    
    $def(self, '$def_instance_delegators', function $$def_instance_delegators(accessor, $a) {
      var $post_args, methods, self = this;

      
      
      $post_args = Opal.slice.call(arguments, 1);
      
      methods = $post_args;;
      return $send(methods, 'each', [], function $$3(method){var self = $$3.$$s == null ? this : $$3.$$s;

        
        
        if (method == null) method = nil;;
        if ($truthy(["__send__", "__id__"]['$include?'](method))) {
          return nil;
        };
        return self.$def_instance_delegator(accessor, method);}, {$$arity: 1, $$s: self});
    }, -2);
    
    $def(self, '$def_instance_delegator', function $$def_instance_delegator(accessor, method, ali) {
      var $yield = $$def_instance_delegator.$$p || nil, self = this;

      delete $$def_instance_delegator.$$p;
      
      
      if (ali == null) ali = method;;
      if ($truthy(accessor.$to_s()['$start_with?']("@"))) {
        return $send(self, 'define_method', [ali], function $$4($a){var block = $$4.$$p || nil, $post_args, args, self = $$4.$$s == null ? this : $$4.$$s;

          delete $$4.$$p;
          
          ;
          
          $post_args = Opal.slice.call(arguments);
          
          args = $post_args;;
          return $send(self.$instance_variable_get(accessor), '__send__', [method].concat($to_a(args)), block.$to_proc());}, {$$arity: -1, $$s: self})
      } else {
        return $send(self, 'define_method', [ali], function $$5($a){var block = $$5.$$p || nil, $post_args, args, self = $$5.$$s == null ? this : $$5.$$s;

          delete $$5.$$p;
          
          ;
          
          $post_args = Opal.slice.call(arguments);
          
          args = $post_args;;
          return $send(self.$__send__(accessor), '__send__', [method].concat($to_a(args)), block.$to_proc());}, {$$arity: -1, $$s: self})
      };
    }, -3);
    $alias(self, "delegate", "instance_delegate");
    $alias(self, "def_delegators", "def_instance_delegators");
    return $alias(self, "def_delegator", "def_instance_delegator");
  })($nesting[0]);
  return (function($base) {
    var self = $module($base, 'SingleForwardable');

    
    
    
    $def(self, '$single_delegate', function $$single_delegate(hash) {
      var self = this;

      return $send(hash, 'each', [], function $$6(methods, accessor){var self = $$6.$$s == null ? this : $$6.$$s;

        
        
        if (methods == null) methods = nil;;
        
        if (accessor == null) accessor = nil;;
        if (!$truthy(methods['$respond_to?']("each"))) {
          methods = [methods]
        };
        return $send(methods, 'each', [], function $$7(method){var self = $$7.$$s == null ? this : $$7.$$s;

          
          
          if (method == null) method = nil;;
          return self.$def_single_delegator(accessor, method);}, {$$arity: 1, $$s: self});}, {$$arity: 2, $$s: self})
    }, 1);
    
    $def(self, '$def_single_delegators', function $$def_single_delegators(accessor, $a) {
      var $post_args, methods, self = this;

      
      
      $post_args = Opal.slice.call(arguments, 1);
      
      methods = $post_args;;
      return $send(methods, 'each', [], function $$8(method){var self = $$8.$$s == null ? this : $$8.$$s;

        
        
        if (method == null) method = nil;;
        if ($truthy(["__send__", "__id__"]['$include?'](method))) {
          return nil;
        };
        return self.$def_single_delegator(accessor, method);}, {$$arity: 1, $$s: self});
    }, -2);
    
    $def(self, '$def_single_delegator', function $$def_single_delegator(accessor, method, ali) {
      var $yield = $$def_single_delegator.$$p || nil, self = this;

      delete $$def_single_delegator.$$p;
      
      
      if (ali == null) ali = method;;
      if ($truthy(accessor.$to_s()['$start_with?']("@"))) {
        return $send(self, 'define_singleton_method', [ali], function $$9($a){var block = $$9.$$p || nil, $post_args, args, self = $$9.$$s == null ? this : $$9.$$s;

          delete $$9.$$p;
          
          ;
          
          $post_args = Opal.slice.call(arguments);
          
          args = $post_args;;
          return $send(self.$instance_variable_get(accessor), '__send__', [method].concat($to_a(args)), block.$to_proc());}, {$$arity: -1, $$s: self})
      } else {
        return $send(self, 'define_singleton_method', [ali], function $$10($a){var block = $$10.$$p || nil, $post_args, args, self = $$10.$$s == null ? this : $$10.$$s;

          delete $$10.$$p;
          
          ;
          
          $post_args = Opal.slice.call(arguments);
          
          args = $post_args;;
          return $send(self.$__send__(accessor), '__send__', [method].concat($to_a(args)), block.$to_proc());}, {$$arity: -1, $$s: self})
      };
    }, -3);
    $alias(self, "delegate", "single_delegate");
    $alias(self, "def_delegators", "def_single_delegators");
    return $alias(self, "def_delegator", "def_single_delegator");
  })($nesting[0]);
};