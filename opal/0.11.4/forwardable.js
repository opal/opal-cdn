/* Generated by Opal 0.11.99.dev */
Opal.modules["forwardable"] = function(Opal) {
  var self = Opal.top, $nesting = [], nil = Opal.nil, $$$ = Opal.const_get_qualified, $$ = Opal.const_get_relative, $breaker = Opal.breaker, $slice = Opal.slice, $module = Opal.module, $send = Opal.send, $truthy = Opal.truthy;

  Opal.add_stubs(['$each', '$respond_to?', '$def_instance_delegator', '$include?', '$start_with?', '$to_s', '$define_method', '$__send__', '$instance_variable_get', '$to_proc', '$def_single_delegator', '$define_singleton_method']);
  
  (function($base, $parent_nesting) {
    function $Forwardable() {};
    var self = $Forwardable = $module($base, 'Forwardable', $Forwardable);

    var def = self.prototype, $nesting = [self].concat($parent_nesting), TMP_Forwardable_instance_delegate_1, TMP_Forwardable_def_instance_delegators_4, TMP_Forwardable_def_instance_delegator_6;

    
    
    Opal.def(self, '$instance_delegate', TMP_Forwardable_instance_delegate_1 = function $$instance_delegate(hash) {
      var TMP_2, self = this;

      return $send(hash, 'each', [], (TMP_2 = function(methods, accessor){var self = TMP_2.$$s || this, TMP_3;

      
        
        if (methods == null) {
          methods = nil;
        };
        
        if (accessor == null) {
          accessor = nil;
        };
        if ($truthy(methods['$respond_to?']("each"))) {
        } else {
          methods = [methods]
        };
        return $send(methods, 'each', [], (TMP_3 = function(method){var self = TMP_3.$$s || this;

        
          
          if (method == null) {
            method = nil;
          };
          return self.$def_instance_delegator(accessor, method);}, TMP_3.$$s = self, TMP_3.$$arity = 1, TMP_3));}, TMP_2.$$s = self, TMP_2.$$arity = 2, TMP_2))
    }, TMP_Forwardable_instance_delegate_1.$$arity = 1);
    
    Opal.def(self, '$def_instance_delegators', TMP_Forwardable_def_instance_delegators_4 = function $$def_instance_delegators(accessor, $a) {
      var $post_args, methods, TMP_5, self = this;

      
      
      $post_args = Opal.slice.call(arguments, 1, arguments.length);
      
      methods = $post_args;;
      return $send(methods, 'each', [], (TMP_5 = function(method){var self = TMP_5.$$s || this;

      
        
        if (method == null) {
          method = nil;
        };
        if ($truthy(["__send__", "__id__"]['$include?'](method))) {
          return nil;};
        return self.$def_instance_delegator(accessor, method);}, TMP_5.$$s = self, TMP_5.$$arity = 1, TMP_5));
    }, TMP_Forwardable_def_instance_delegators_4.$$arity = -2);
    
    Opal.def(self, '$def_instance_delegator', TMP_Forwardable_def_instance_delegator_6 = function $$def_instance_delegator(accessor, method, ali) {
      var TMP_7, TMP_8, $iter = TMP_Forwardable_def_instance_delegator_6.$$p, $yield = $iter || nil, self = this;

      if ($iter) TMP_Forwardable_def_instance_delegator_6.$$p = null;
      
      
      if (ali == null) {
        ali = method;
      };
      if ($truthy(accessor.$to_s()['$start_with?']("@"))) {
        return $send(self, 'define_method', [ali], (TMP_7 = function($a){var self = TMP_7.$$s || this, $iter = TMP_7.$$p, block = $iter || nil, $post_args, args;

        
          
          if ($iter) TMP_7.$$p = null;;
          
          $post_args = Opal.slice.call(arguments, 0, arguments.length);
          
          args = $post_args;;
          return $send(self.$instance_variable_get(accessor), '__send__', [method].concat(Opal.to_a(args)), block.$to_proc());}, TMP_7.$$s = self, TMP_7.$$arity = -1, TMP_7))
      } else {
        return $send(self, 'define_method', [ali], (TMP_8 = function($a){var self = TMP_8.$$s || this, $iter = TMP_8.$$p, block = $iter || nil, $post_args, args;

        
          
          if ($iter) TMP_8.$$p = null;;
          
          $post_args = Opal.slice.call(arguments, 0, arguments.length);
          
          args = $post_args;;
          return $send(self.$__send__(accessor), '__send__', [method].concat(Opal.to_a(args)), block.$to_proc());}, TMP_8.$$s = self, TMP_8.$$arity = -1, TMP_8))
      };
    }, TMP_Forwardable_def_instance_delegator_6.$$arity = -3);
    Opal.alias(self, "delegate", "instance_delegate");
    Opal.alias(self, "def_delegators", "def_instance_delegators");
    Opal.alias(self, "def_delegator", "def_instance_delegator");
  })($nesting[0], $nesting);
  return (function($base, $parent_nesting) {
    function $SingleForwardable() {};
    var self = $SingleForwardable = $module($base, 'SingleForwardable', $SingleForwardable);

    var def = self.prototype, $nesting = [self].concat($parent_nesting), TMP_SingleForwardable_single_delegate_9, TMP_SingleForwardable_def_single_delegators_12, TMP_SingleForwardable_def_single_delegator_14;

    
    
    Opal.def(self, '$single_delegate', TMP_SingleForwardable_single_delegate_9 = function $$single_delegate(hash) {
      var TMP_10, self = this;

      return $send(hash, 'each', [], (TMP_10 = function(methods, accessor){var self = TMP_10.$$s || this, TMP_11;

      
        
        if (methods == null) {
          methods = nil;
        };
        
        if (accessor == null) {
          accessor = nil;
        };
        if ($truthy(methods['$respond_to?']("each"))) {
        } else {
          methods = [methods]
        };
        return $send(methods, 'each', [], (TMP_11 = function(method){var self = TMP_11.$$s || this;

        
          
          if (method == null) {
            method = nil;
          };
          return self.$def_single_delegator(accessor, method);}, TMP_11.$$s = self, TMP_11.$$arity = 1, TMP_11));}, TMP_10.$$s = self, TMP_10.$$arity = 2, TMP_10))
    }, TMP_SingleForwardable_single_delegate_9.$$arity = 1);
    
    Opal.def(self, '$def_single_delegators', TMP_SingleForwardable_def_single_delegators_12 = function $$def_single_delegators(accessor, $a) {
      var $post_args, methods, TMP_13, self = this;

      
      
      $post_args = Opal.slice.call(arguments, 1, arguments.length);
      
      methods = $post_args;;
      return $send(methods, 'each', [], (TMP_13 = function(method){var self = TMP_13.$$s || this;

      
        
        if (method == null) {
          method = nil;
        };
        if ($truthy(["__send__", "__id__"]['$include?'](method))) {
          return nil;};
        return self.$def_single_delegator(accessor, method);}, TMP_13.$$s = self, TMP_13.$$arity = 1, TMP_13));
    }, TMP_SingleForwardable_def_single_delegators_12.$$arity = -2);
    
    Opal.def(self, '$def_single_delegator', TMP_SingleForwardable_def_single_delegator_14 = function $$def_single_delegator(accessor, method, ali) {
      var TMP_15, TMP_16, $iter = TMP_SingleForwardable_def_single_delegator_14.$$p, $yield = $iter || nil, self = this;

      if ($iter) TMP_SingleForwardable_def_single_delegator_14.$$p = null;
      
      
      if (ali == null) {
        ali = method;
      };
      if ($truthy(accessor.$to_s()['$start_with?']("@"))) {
        return $send(self, 'define_singleton_method', [ali], (TMP_15 = function($a){var self = TMP_15.$$s || this, $iter = TMP_15.$$p, block = $iter || nil, $post_args, args;

        
          
          if ($iter) TMP_15.$$p = null;;
          
          $post_args = Opal.slice.call(arguments, 0, arguments.length);
          
          args = $post_args;;
          return $send(self.$instance_variable_get(accessor), '__send__', [method].concat(Opal.to_a(args)), block.$to_proc());}, TMP_15.$$s = self, TMP_15.$$arity = -1, TMP_15))
      } else {
        return $send(self, 'define_singleton_method', [ali], (TMP_16 = function($a){var self = TMP_16.$$s || this, $iter = TMP_16.$$p, block = $iter || nil, $post_args, args;

        
          
          if ($iter) TMP_16.$$p = null;;
          
          $post_args = Opal.slice.call(arguments, 0, arguments.length);
          
          args = $post_args;;
          return $send(self.$__send__(accessor), '__send__', [method].concat(Opal.to_a(args)), block.$to_proc());}, TMP_16.$$s = self, TMP_16.$$arity = -1, TMP_16))
      };
    }, TMP_SingleForwardable_def_single_delegator_14.$$arity = -3);
    Opal.alias(self, "delegate", "single_delegate");
    Opal.alias(self, "def_delegators", "def_single_delegators");
    Opal.alias(self, "def_delegator", "def_single_delegator");
  })($nesting[0], $nesting);
};
