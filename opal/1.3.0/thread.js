Opal.modules["thread"] = function(Opal) {/* Generated by Opal 1.3.0 */
  function $rb_minus(lhs, rhs) {
    return (typeof(lhs) === 'number' && typeof(rhs) === 'number') ? lhs - rhs : lhs['$-'](rhs);
  }
  var self = Opal.top, $nesting = [], nil = Opal.nil, $$$ = Opal.$$$, $$ = Opal.$$, $klass = Opal.klass, $truthy = Opal.truthy, $send = Opal.send, $hash2 = Opal.hash2, $alias = Opal.alias;

  Opal.add_stubs(['$allocate', '$core_initialize!', '$current', '$raise', '$[]', '$coerce_key_name', '$[]=', '$-', '$key?', '$keys', '$private', '$coerce_to!', '$clear', '$empty?', '$size', '$shift', '$push', '$each', '$to_proc', '$=~', '$last_match', '$to_i', '$inspect', '$attr_reader', '$locked?', '$lock', '$unlock']);
  
  (function($base, $super, $parent_nesting) {
    var self = $klass($base, $super, 'ThreadError');

    var $nesting = [self].concat($parent_nesting);

    return nil
  })($nesting[0], $$($nesting, 'StandardError'), $nesting);
  (function($base, $super, $parent_nesting) {
    var self = $klass($base, $super, 'Thread');

    var $nesting = [self].concat($parent_nesting), $Thread_current$1, $Thread_list$2, $Thread_initialize$3, $Thread_$$$4, $Thread_$$$eq$5, $Thread_key$ques$6, $Thread_keys$7, $Thread_thread_variable_get$8, $Thread_thread_variable_set$9, $Thread_thread_variable$ques$10, $Thread_thread_variables$11, $Thread_core_initialize$excl$12, $Thread_coerce_key_name$13;

    self.$$prototype.fiber_locals = self.$$prototype.thread_locals = nil;
    
    Opal.defs(self, '$current', $Thread_current$1 = function $$current() {
      var self = this;
      if (self.current == null) self.current = nil;

      
      if ($truthy(self.current)) {
      } else {
        
        self.current = self.$allocate();
        self.current['$core_initialize!']();
      };
      return self.current;
    }, $Thread_current$1.$$arity = 0);
    Opal.defs(self, '$list', $Thread_list$2 = function $$list() {
      var self = this;

      return [self.$current()]
    }, $Thread_list$2.$$arity = 0);
    
    Opal.def(self, '$initialize', $Thread_initialize$3 = function $$initialize($a) {
      var $post_args, args, self = this;

      
      
      $post_args = Opal.slice.call(arguments, 0, arguments.length);
      
      args = $post_args;;
      return self.$raise($$($nesting, 'NotImplementedError'), "Thread creation not available");
    }, $Thread_initialize$3.$$arity = -1);
    
    Opal.def(self, '$[]', $Thread_$$$4 = function(key) {
      var self = this;

      return self.fiber_locals['$[]'](self.$coerce_key_name(key))
    }, $Thread_$$$4.$$arity = 1);
    
    Opal.def(self, '$[]=', $Thread_$$$eq$5 = function(key, value) {
      var self = this, $writer = nil;

      
      $writer = [self.$coerce_key_name(key), value];
      $send(self.fiber_locals, '[]=', Opal.to_a($writer));
      return $writer[$rb_minus($writer["length"], 1)];
    }, $Thread_$$$eq$5.$$arity = 2);
    
    Opal.def(self, '$key?', $Thread_key$ques$6 = function(key) {
      var self = this;

      return self.fiber_locals['$key?'](self.$coerce_key_name(key))
    }, $Thread_key$ques$6.$$arity = 1);
    
    Opal.def(self, '$keys', $Thread_keys$7 = function $$keys() {
      var self = this;

      return self.fiber_locals.$keys()
    }, $Thread_keys$7.$$arity = 0);
    
    Opal.def(self, '$thread_variable_get', $Thread_thread_variable_get$8 = function $$thread_variable_get(key) {
      var self = this;

      return self.thread_locals['$[]'](self.$coerce_key_name(key))
    }, $Thread_thread_variable_get$8.$$arity = 1);
    
    Opal.def(self, '$thread_variable_set', $Thread_thread_variable_set$9 = function $$thread_variable_set(key, value) {
      var self = this, $writer = nil;

      
      $writer = [self.$coerce_key_name(key), value];
      $send(self.thread_locals, '[]=', Opal.to_a($writer));
      return $writer[$rb_minus($writer["length"], 1)];
    }, $Thread_thread_variable_set$9.$$arity = 2);
    
    Opal.def(self, '$thread_variable?', $Thread_thread_variable$ques$10 = function(key) {
      var self = this;

      return self.thread_locals['$key?'](self.$coerce_key_name(key))
    }, $Thread_thread_variable$ques$10.$$arity = 1);
    
    Opal.def(self, '$thread_variables', $Thread_thread_variables$11 = function $$thread_variables() {
      var self = this;

      return self.thread_locals.$keys()
    }, $Thread_thread_variables$11.$$arity = 0);
    self.$private();
    
    Opal.def(self, '$core_initialize!', $Thread_core_initialize$excl$12 = function() {
      var self = this;

      
      self.thread_locals = $hash2([], {});
      return (self.fiber_locals = $hash2([], {}));
    }, $Thread_core_initialize$excl$12.$$arity = 0);
    
    Opal.def(self, '$coerce_key_name', $Thread_coerce_key_name$13 = function $$coerce_key_name(key) {
      var self = this;

      return $$($nesting, 'Opal')['$coerce_to!'](key, $$($nesting, 'String'), "to_s")
    }, $Thread_coerce_key_name$13.$$arity = 1);
    (function($base, $super, $parent_nesting) {
      var self = $klass($base, $super, 'Queue');

      var $nesting = [self].concat($parent_nesting), $Queue_initialize$14, $Queue_clear$15, $Queue_empty$ques$16, $Queue_size$17, $Queue_pop$18, $Queue_push$19, $Queue_each$20;

      self.$$prototype.storage = nil;
      
      
      Opal.def(self, '$initialize', $Queue_initialize$14 = function $$initialize() {
        var self = this;

        return self.$clear()
      }, $Queue_initialize$14.$$arity = 0);
      
      Opal.def(self, '$clear', $Queue_clear$15 = function $$clear() {
        var self = this;

        return (self.storage = [])
      }, $Queue_clear$15.$$arity = 0);
      
      Opal.def(self, '$empty?', $Queue_empty$ques$16 = function() {
        var self = this;

        return self.storage['$empty?']()
      }, $Queue_empty$ques$16.$$arity = 0);
      
      Opal.def(self, '$size', $Queue_size$17 = function $$size() {
        var self = this;

        return self.storage.$size()
      }, $Queue_size$17.$$arity = 0);
      $alias(self, "length", "size");
      
      Opal.def(self, '$pop', $Queue_pop$18 = function $$pop(non_block) {
        var self = this;

        
        
        if (non_block == null) {
          non_block = false;
        };
        if ($truthy(self['$empty?']())) {
          
          if ($truthy(non_block)) {
            self.$raise($$($nesting, 'ThreadError'), "Queue empty")};
          self.$raise($$($nesting, 'ThreadError'), "Deadlock");};
        return self.storage.$shift();
      }, $Queue_pop$18.$$arity = -1);
      $alias(self, "shift", "pop");
      $alias(self, "deq", "pop");
      
      Opal.def(self, '$push', $Queue_push$19 = function $$push(value) {
        var self = this;

        return self.storage.$push(value)
      }, $Queue_push$19.$$arity = 1);
      $alias(self, "<<", "push");
      $alias(self, "enq", "push");
      return (Opal.def(self, '$each', $Queue_each$20 = function $$each() {
        var $iter = $Queue_each$20.$$p, block = $iter || nil, self = this;

        if ($iter) $Queue_each$20.$$p = null;
        
        
        if ($iter) $Queue_each$20.$$p = null;;
        return $send(self.storage, 'each', [], block.$to_proc());
      }, $Queue_each$20.$$arity = 0), nil) && 'each';
    })($nesting[0], null, $nesting);
    return (function($base, $super, $parent_nesting) {
      var self = $klass($base, $super, 'Backtrace');

      var $nesting = [self].concat($parent_nesting);

      return (function($base, $super, $parent_nesting) {
        var self = $klass($base, $super, 'Location');

        var $nesting = [self].concat($parent_nesting), $Location_initialize$21, $Location_to_s$22, $Location_inspect$23;

        self.$$prototype.label = self.$$prototype.str = nil;
        
        
        Opal.def(self, '$initialize', $Location_initialize$21 = function $$initialize(str) {
          var self = this, $ret_or_1 = nil;

          
          self.str = str;
          str['$=~'](/^(.*?):(\d+):(\d+):in `(.*?)'$/);
          self.path = $$($nesting, 'Regexp').$last_match(1);
          self.label = $$($nesting, 'Regexp').$last_match(4);
          self.lineno = $$($nesting, 'Regexp').$last_match(2).$to_i();
          self.label['$=~'](/(\w+)$/);
          return (self.base_label = (function() {if ($truthy(($ret_or_1 = $$($nesting, 'Regexp').$last_match(1)))) {
            return $ret_or_1
          } else {
            return self.label
          }; return nil; })());
        }, $Location_initialize$21.$$arity = 1);
        
        Opal.def(self, '$to_s', $Location_to_s$22 = function $$to_s() {
          var self = this;

          return self.str
        }, $Location_to_s$22.$$arity = 0);
        
        Opal.def(self, '$inspect', $Location_inspect$23 = function $$inspect() {
          var self = this;

          return self.str.$inspect()
        }, $Location_inspect$23.$$arity = 0);
        self.$attr_reader("base_label", "label", "lineno", "path");
        return $alias(self, "absolute_path", "path");
      })($nesting[0], null, $nesting)
    })($nesting[0], null, $nesting);
  })($nesting[0], null, $nesting);
  Opal.const_set($nesting[0], 'Queue', $$$($$($nesting, 'Thread'), 'Queue'));
  return (function($base, $super, $parent_nesting) {
    var self = $klass($base, $super, 'Mutex');

    var $nesting = [self].concat($parent_nesting), $Mutex_initialize$24, $Mutex_lock$25, $Mutex_locked$ques$26, $Mutex_owned$ques$27, $Mutex_try_lock$28, $Mutex_unlock$29, $Mutex_synchronize$30;

    self.$$prototype.locked = nil;
    
    
    Opal.def(self, '$initialize', $Mutex_initialize$24 = function $$initialize() {
      var self = this;

      return (self.locked = false)
    }, $Mutex_initialize$24.$$arity = 0);
    
    Opal.def(self, '$lock', $Mutex_lock$25 = function $$lock() {
      var self = this;

      
      if ($truthy(self.locked)) {
        self.$raise($$($nesting, 'ThreadError'), "Deadlock")};
      self.locked = true;
      return self;
    }, $Mutex_lock$25.$$arity = 0);
    
    Opal.def(self, '$locked?', $Mutex_locked$ques$26 = function() {
      var self = this;

      return self.locked
    }, $Mutex_locked$ques$26.$$arity = 0);
    
    Opal.def(self, '$owned?', $Mutex_owned$ques$27 = function() {
      var self = this;

      return self.locked
    }, $Mutex_owned$ques$27.$$arity = 0);
    
    Opal.def(self, '$try_lock', $Mutex_try_lock$28 = function $$try_lock() {
      var self = this;

      if ($truthy(self['$locked?']())) {
        return false
      } else {
        
        self.$lock();
        return true;
      }
    }, $Mutex_try_lock$28.$$arity = 0);
    
    Opal.def(self, '$unlock', $Mutex_unlock$29 = function $$unlock() {
      var self = this;

      
      if ($truthy(self.locked)) {
      } else {
        self.$raise($$($nesting, 'ThreadError'), "Mutex not locked")
      };
      self.locked = false;
      return self;
    }, $Mutex_unlock$29.$$arity = 0);
    return (Opal.def(self, '$synchronize', $Mutex_synchronize$30 = function $$synchronize() {
      var $iter = $Mutex_synchronize$30.$$p, $yield = $iter || nil, self = this;

      if ($iter) $Mutex_synchronize$30.$$p = null;
      
      self.$lock();
      
      return (function() { try {
      return Opal.yieldX($yield, []);
      } finally {
        self.$unlock()
      }; })();;
    }, $Mutex_synchronize$30.$$arity = 0), nil) && 'synchronize';
  })($nesting[0], null, $nesting);
};
