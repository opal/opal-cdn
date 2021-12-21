Opal.modules["promise"] = function(Opal) {/* Generated by Opal 1.4.0.alpha1 */
  var $nesting = [], $$ = Opal.$r($nesting), nil = Opal.nil, $klass = Opal.klass, $defs = Opal.defs, $hash2 = Opal.hash2, $def = Opal.def, $eqeqeq = Opal.eqeqeq, $truthy = Opal.truthy, $not = Opal.not, $send = Opal.send, $to_a = Opal.to_a, $rb_plus = Opal.rb_plus, $alias = Opal.alias, $send2 = Opal.send2, $find_super = Opal.find_super, $rb_le = Opal.rb_le, $rb_minus = Opal.rb_minus, $const_set = Opal.const_set;

  Opal.add_stubs('resolve,new,reject,attr_reader,===,value,key?,keys,!=,==,<<,>>,exception?,[],resolved?,rejected?,!,error,include?,action,realized?,raise,^,call,resolve!,exception!,any?,each,reject!,there_can_be_only_one!,then,to_proc,fail,always,trace,class,object_id,+,inspect,rescue,nil?,prev,act?,push,concat,it,proc,reverse,pop,<=,length,shift,-,wait,map,reduce,try,tap,all?,find');
  
  (function($base, $super, $parent_nesting) {
    var self = $klass($base, $super, 'Promise');

    var $nesting = [self].concat($parent_nesting), $$ = Opal.$r($nesting), $proto = self.$$prototype;

    $proto.value = $proto.action = $proto.exception = $proto.realized = $proto.next = $proto.delayed = $proto.error = $proto.prev = nil;
    
    $defs(self, '$value', function $$value(value) {
      var self = this;

      return self.$new().$resolve(value)
    }, 1);
    $defs(self, '$error', function $$error(value) {
      var self = this;

      return self.$new().$reject(value)
    }, 1);
    $defs(self, '$when', function $$when($a) {
      var $post_args, promises;

      
      
      $post_args = Opal.slice.call(arguments);
      
      promises = $post_args;;
      return $$('When').$new(promises);
    }, -1);
    self.$attr_reader("error", "prev", "next");
    
    $def(self, '$initialize', function $$initialize(action) {
      var self = this;

      
      
      if (action == null) action = $hash2([], {});;
      self.action = action;
      self.realized = false;
      self.exception = false;
      self.value = nil;
      self.error = nil;
      self.delayed = false;
      self.prev = nil;
      return (self.next = []);
    }, -1);
    
    $def(self, '$value', function $$value() {
      var self = this;

      if ($eqeqeq($$('Promise'), self.value)) {
        return self.value.$value()
      } else {
        return self.value
      }
    }, 0);
    
    $def(self, '$act?', function $Promise_act$ques$1() {
      var self = this, $ret_or_1 = nil;

      if ($truthy(($ret_or_1 = self.action['$key?']("success")))) {
        return $ret_or_1
      } else {
        return self.action['$key?']("always")
      }
    }, 0);
    
    $def(self, '$action', function $$action() {
      var self = this;

      return self.action.$keys()
    }, 0);
    
    $def(self, '$exception?', function $Promise_exception$ques$2() {
      var self = this;

      return self.exception
    }, 0);
    
    $def(self, '$realized?', function $Promise_realized$ques$3() {
      var self = this;

      return self.realized['$!='](false)
    }, 0);
    
    $def(self, '$resolved?', function $Promise_resolved$ques$4() {
      var self = this;

      return self.realized['$==']("resolve")
    }, 0);
    
    $def(self, '$rejected?', function $Promise_rejected$ques$5() {
      var self = this;

      return self.realized['$==']("reject")
    }, 0);
    
    $def(self, '$^', function $Promise_$$6(promise) {
      var self = this;

      
      promise['$<<'](self);
      self['$>>'](promise);
      return promise;
    }, 1);
    
    $def(self, '$<<', function $Promise_$lt$lt$7(promise) {
      var self = this;

      
      self.prev = promise;
      return self;
    }, 1);
    
    $def(self, '$>>', function $Promise_$gt$gt$8(promise) {
      var self = this;

      
      self.next['$<<'](promise);
      if ($truthy(self['$exception?']())) {
        promise.$reject(self.delayed['$[]'](0))
      } else if ($truthy(self['$resolved?']())) {
        promise.$resolve(($truthy(self.delayed) ? (self.delayed['$[]'](0)) : (self.$value())))
      } else if ($truthy(self['$rejected?']())) {
        if (($not(self.action['$key?']("failure")) || ($eqeqeq($$('Promise'), ($truthy(self.delayed) ? (self.delayed['$[]'](0)) : (self.error)))))) {
          promise.$reject(($truthy(self.delayed) ? (self.delayed['$[]'](0)) : (self.$error())))
        } else if ($truthy(promise.$action()['$include?']("always"))) {
          promise.$reject(($truthy(self.delayed) ? (self.delayed['$[]'](0)) : (self.$error())))
        }
      };
      return self;
    }, 1);
    
    $def(self, '$resolve', function $$resolve(value) {
      var self = this, block = nil, $ret_or_1 = nil, e = nil;

      
      
      if (value == null) value = nil;;
      if ($truthy(self['$realized?']())) {
        self.$raise($$('ArgumentError'), "the promise has already been realized")
      };
      if ($eqeqeq($$('Promise'), value)) {
        return value['$<<'](self.prev)['$^'](self)
      };
      
      try {
        
        block = ($truthy(($ret_or_1 = self.action['$[]']("success"))) ? ($ret_or_1) : (self.action['$[]']("always")));
        if ($truthy(block)) {
          value = block.$call(value)
        };
        self['$resolve!'](value);
      } catch ($err) {
        if (Opal.rescue($err, [$$('Exception')])) {(e = $err)
          try {
            self['$exception!'](e)
          } finally { Opal.pop_exception(); }
        } else { throw $err; }
      };;
      return self;
    }, -1);
    
    $def(self, '$resolve!', function $Promise_resolve$excl$9(value) {
      var self = this;

      
      self.realized = "resolve";
      self.value = value;
      if ($truthy(self.next['$any?']())) {
        return $send(self.next, 'each', [], function $$10(p){
          
          
          if (p == null) p = nil;;
          return p.$resolve(value);}, 1)
      } else {
        return (self.delayed = [value])
      };
    }, 1);
    
    $def(self, '$reject', function $$reject(value) {
      var self = this, block = nil, $ret_or_1 = nil, e = nil;

      
      
      if (value == null) value = nil;;
      if ($truthy(self['$realized?']())) {
        self.$raise($$('ArgumentError'), "the promise has already been realized")
      };
      if ($eqeqeq($$('Promise'), value)) {
        return value['$<<'](self.prev)['$^'](self)
      };
      
      try {
        
        block = ($truthy(($ret_or_1 = self.action['$[]']("failure"))) ? ($ret_or_1) : (self.action['$[]']("always")));
        if ($truthy(block)) {
          value = block.$call(value)
        };
        if ($truthy(self.action['$key?']("always"))) {
          self['$resolve!'](value)
        } else {
          self['$reject!'](value)
        };
      } catch ($err) {
        if (Opal.rescue($err, [$$('Exception')])) {(e = $err)
          try {
            self['$exception!'](e)
          } finally { Opal.pop_exception(); }
        } else { throw $err; }
      };;
      return self;
    }, -1);
    
    $def(self, '$reject!', function $Promise_reject$excl$11(value) {
      var self = this;

      
      self.realized = "reject";
      self.error = value;
      if ($truthy(self.next['$any?']())) {
        return $send(self.next, 'each', [], function $$12(p){
          
          
          if (p == null) p = nil;;
          return p.$reject(value);}, 1)
      } else {
        return (self.delayed = [value])
      };
    }, 1);
    
    $def(self, '$exception!', function $Promise_exception$excl$13(error) {
      var self = this;

      
      self.exception = true;
      return self['$reject!'](error);
    }, 1);
    
    $def(self, '$then', function $$then() {
      var block = $$then.$$p || nil, self = this;

      delete $$then.$$p;
      
      ;
      return self['$^']($$('Promise').$new($hash2(["success"], {"success": block})));
    }, 0);
    
    $def(self, '$then!', function $Promise_then$excl$14() {
      var block = $Promise_then$excl$14.$$p || nil, self = this;

      delete $Promise_then$excl$14.$$p;
      
      ;
      self['$there_can_be_only_one!']();
      return $send(self, 'then', [], block.$to_proc());
    }, 0);
    
    $def(self, '$fail', function $$fail() {
      var block = $$fail.$$p || nil, self = this;

      delete $$fail.$$p;
      
      ;
      return self['$^']($$('Promise').$new($hash2(["failure"], {"failure": block})));
    }, 0);
    
    $def(self, '$fail!', function $Promise_fail$excl$15() {
      var block = $Promise_fail$excl$15.$$p || nil, self = this;

      delete $Promise_fail$excl$15.$$p;
      
      ;
      self['$there_can_be_only_one!']();
      return $send(self, 'fail', [], block.$to_proc());
    }, 0);
    
    $def(self, '$always', function $$always() {
      var block = $$always.$$p || nil, self = this;

      delete $$always.$$p;
      
      ;
      return self['$^']($$('Promise').$new($hash2(["always"], {"always": block})));
    }, 0);
    
    $def(self, '$always!', function $Promise_always$excl$16() {
      var block = $Promise_always$excl$16.$$p || nil, self = this;

      delete $Promise_always$excl$16.$$p;
      
      ;
      self['$there_can_be_only_one!']();
      return $send(self, 'always', [], block.$to_proc());
    }, 0);
    
    $def(self, '$trace', function $$trace(depth) {
      var block = $$trace.$$p || nil, self = this;

      delete $$trace.$$p;
      
      ;
      
      if (depth == null) depth = nil;;
      return self['$^']($$('Trace').$new(depth, block));
    }, -1);
    
    $def(self, '$trace!', function $Promise_trace$excl$17($a) {
      var block = $Promise_trace$excl$17.$$p || nil, $post_args, args, self = this;

      delete $Promise_trace$excl$17.$$p;
      
      ;
      
      $post_args = Opal.slice.call(arguments);
      
      args = $post_args;;
      self['$there_can_be_only_one!']();
      return $send(self, 'trace', $to_a(args), block.$to_proc());
    }, -1);
    
    $def(self, '$there_can_be_only_one!', function $Promise_there_can_be_only_one$excl$18() {
      var self = this;

      if ($truthy(self.next['$any?']())) {
        return self.$raise($$('ArgumentError'), "a promise has already been chained")
      } else {
        return nil
      }
    }, 0);
    
    $def(self, '$inspect', function $$inspect() {
      var self = this, result = nil, $ret_or_1 = nil;

      
      result = "#<" + (self.$class()) + "(" + (self.$object_id()) + ")";
      if ($truthy(self.next['$any?']())) {
        result = $rb_plus(result, " >> " + (self.next.$inspect()))
      };
      result = $rb_plus(result, ($truthy(self['$realized?']()) ? (": " + (($truthy(($ret_or_1 = self.value)) ? ($ret_or_1) : (self.error)).$inspect()) + ">") : (">")));
      return result;
    }, 0);
    
    $def(self, '$to_v2', function $$to_v2() {
      var self = this, v2 = nil;

      
      v2 = $$('PromiseV2').$new();
      $send($send(self, 'then', [], function $$19(i){
        
        
        if (i == null) i = nil;;
        return v2.$resolve(i);}, 1), 'rescue', [], function $$20(i){
        
        
        if (i == null) i = nil;;
        return v2.$reject(i);}, 1);
      return v2;
    }, 0);
    $alias(self, "catch", "fail");
    $alias(self, "catch!", "fail!");
    $alias(self, "do", "then");
    $alias(self, "do!", "then!");
    $alias(self, "ensure", "always");
    $alias(self, "ensure!", "always!");
    $alias(self, "finally", "always");
    $alias(self, "finally!", "always!");
    $alias(self, "rescue", "fail");
    $alias(self, "rescue!", "fail!");
    $alias(self, "to_n", "to_v2");
    $alias(self, "to_v1", "itself");
    (function($base, $super, $parent_nesting) {
      var self = $klass($base, $super, 'Trace');

      var $nesting = [self].concat($parent_nesting), $$ = Opal.$r($nesting);

      
      $defs(self, '$it', function $$it(promise) {
        var self = this, current = nil, prev = nil;

        
        current = [];
        if (($truthy(promise['$act?']()) || ($truthy(promise.$prev()['$nil?']())))) {
          current.$push(promise.$value())
        };
        prev = promise.$prev();
        if ($truthy(prev)) {
          return current.$concat(self.$it(prev))
        } else {
          return current
        };
      }, 1);
      return $def(self, '$initialize', function $$initialize(depth, block) {
        var $yield = $$initialize.$$p || nil, self = this;

        delete $$initialize.$$p;
        
        self.depth = depth;
        return $send2(self, $find_super(self, 'initialize', $$initialize, false, true), 'initialize', [$hash2(["success"], {"success": $send(self, 'proc', [], function $$21(){var self = $$21.$$s == null ? this : $$21.$$s, trace = nil;

          
          trace = $$('Trace').$it(self).$reverse();
          trace.$pop();
          if (($truthy(depth) && ($truthy($rb_le(depth, trace.$length()))))) {
            trace.$shift($rb_minus(trace.$length(), depth))
          };
          return $send(block, 'call', $to_a(trace));}, {$$arity: 0, $$s: self})})], null);
      }, 2);
    })($nesting[0], self, $nesting);
    return (function($base, $super, $parent_nesting) {
      var self = $klass($base, $super, 'When');

      var $nesting = [self].concat($parent_nesting), $$ = Opal.$r($nesting), $proto = self.$$prototype;

      $proto.wait = nil;
      
      
      $def(self, '$initialize', function $$initialize(promises) {
        var $yield = $$initialize.$$p || nil, self = this;

        delete $$initialize.$$p;
        
        
        if (promises == null) promises = [];;
        $send2(self, $find_super(self, 'initialize', $$initialize, false, true), 'initialize', [], null);
        self.wait = [];
        return $send(promises, 'each', [], function $$22(promise){var self = $$22.$$s == null ? this : $$22.$$s;

          
          
          if (promise == null) promise = nil;;
          return self.$wait(promise);}, {$$arity: 1, $$s: self});
      }, -1);
      
      $def(self, '$each', function $$each() {
        var block = $$each.$$p || nil, self = this;

        delete $$each.$$p;
        
        ;
        if (!$truthy(block)) {
          self.$raise($$('ArgumentError'), "no block given")
        };
        return $send(self, 'then', [], function $$23(values){
          
          
          if (values == null) values = nil;;
          return $send(values, 'each', [], block.$to_proc());}, 1);
      }, 0);
      
      $def(self, '$collect', function $$collect() {
        var block = $$collect.$$p || nil, self = this;

        delete $$collect.$$p;
        
        ;
        if (!$truthy(block)) {
          self.$raise($$('ArgumentError'), "no block given")
        };
        return $send(self, 'then', [], function $$24(values){
          
          
          if (values == null) values = nil;;
          return $$('When').$new($send(values, 'map', [], block.$to_proc()));}, 1);
      }, 0);
      
      $def(self, '$inject', function $$inject($a) {
        var block = $$inject.$$p || nil, $post_args, args, self = this;

        delete $$inject.$$p;
        
        ;
        
        $post_args = Opal.slice.call(arguments);
        
        args = $post_args;;
        return $send(self, 'then', [], function $$25(values){
          
          
          if (values == null) values = nil;;
          return $send(values, 'reduce', $to_a(args), block.$to_proc());}, 1);
      }, -1);
      
      $def(self, '$wait', function $$wait(promise) {
        var self = this;

        
        if (!$eqeqeq($$('Promise'), promise)) {
          promise = $$('Promise').$value(promise)
        };
        if ($truthy(promise['$act?']())) {
          promise = promise.$then()
        };
        self.wait['$<<'](promise);
        $send(promise, 'always', [], function $$26(){var self = $$26.$$s == null ? this : $$26.$$s;
          if (self.next == null) self.next = nil;

          if ($truthy(self.next['$any?']())) {
            return self.$try()
          } else {
            return nil
          }}, {$$arity: 0, $$s: self});
        return self;
      }, 1);
      
      $def(self, '$>>', function $When_$gt$gt$27($a) {
        var $post_args, $rest_arg, $yield = $When_$gt$gt$27.$$p || nil, self = this;

        delete $When_$gt$gt$27.$$p;
        
        
        $post_args = Opal.slice.call(arguments);
        
        $rest_arg = $post_args;;
        return $send($send2(self, $find_super(self, '>>', $When_$gt$gt$27, false, true), '>>', $to_a($rest_arg), $yield), 'tap', [], function $$28(){var self = $$28.$$s == null ? this : $$28.$$s;

          return self.$try()}, {$$arity: 0, $$s: self});
      }, -1);
      
      $def(self, '$try', function $When_try$29() {
        var self = this, promise = nil;

        if ($truthy($send(self.wait, 'all?', [], "realized?".$to_proc()))) {
          
          promise = $send(self.wait, 'find', [], "rejected?".$to_proc());
          if ($truthy(promise)) {
            return self.$reject(promise.$error())
          } else {
            return self.$resolve($send(self.wait, 'map', [], "value".$to_proc()))
          };
        } else {
          return nil
        }
      }, 0);
      $alias(self, "map", "collect");
      $alias(self, "reduce", "inject");
      return $alias(self, "and", "wait");
    })($nesting[0], self, $nesting);
  })($nesting[0], null, $nesting);
  return $const_set($nesting[0], 'PromiseV1', $$('Promise'));
};
