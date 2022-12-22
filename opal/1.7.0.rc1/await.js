Opal.modules["promise/v2"] = function(Opal) {/* Generated by Opal 1.7.0.rc1 */
  var $klass = Opal.klass, $def = Opal.def, $slice = Opal.slice, $eqeq = Opal.eqeq, $send = Opal.send, $alias = Opal.alias, $truthy = Opal.truthy, $rb_gt = Opal.rb_gt, $rb_minus = Opal.rb_minus, $to_a = Opal.to_a, $eqeqeq = Opal.eqeqeq, $rb_plus = Opal.rb_plus, $nesting = [], nil = Opal.nil;

  Opal.add_stubs('instance_variable_set,Array,==,length,first,tap,when,reject,resolve,attr_reader,!=,native?,raise,include?,any?,proc,call,nativity_check!,gen_tracing_proc,<<,there_can_be_only_one!,then,to_proc,fail,always,!,>,value,unshift,-,prev,trace,light_nativity_check!,nil?,resolved?,===,rejected?,map,new,rescue,class,+,object_id,inspect,fail!,then!,always!,itself');
  return (function($base, $super, $parent_nesting) {
    var self = $klass($base, $super, 'PromiseV2');

    var $nesting = [self].concat($parent_nesting), $$ = Opal.$r($nesting), $proto = self.$$prototype;

    $proto.type = $proto.next = $proto.realized = $proto.resolve_proc = $proto.reject_proc = $proto.value = nil;
    
    (function(self, $parent_nesting) {
      
      
      
      $def(self, '$allocate', function $$allocate() {
        var $a, self = this, ok = nil, fail = nil, prom = nil;

        
        $a = [nil, nil], (ok = $a[0]), (fail = $a[1]), $a;
        prom = new self.$$constructor(function(_ok, _fail) { ok = _ok; fail = _fail; });
        prom.$instance_variable_set("@type", "opal");
        prom.$instance_variable_set("@resolve_proc", ok);
        prom.$instance_variable_set("@reject_proc", fail);
        return prom;
      });
      
      $def(self, '$when', function $$when($a) {
        var $post_args, promises, self = this;

        
        $post_args = $slice(arguments);
        promises = $post_args;
        promises = self.$Array(($eqeq(promises.$length(), 1) ? (promises.$first()) : (promises)));
        return $send((Promise.all(promises)), 'tap', [], function $$1(prom){
          
          if (prom == null) prom = nil;
          return prom.$instance_variable_set("@type", "when");});
      }, -1);
      
      $def(self, '$all_resolved', function $$all_resolved($a) {
        var $post_args, promises, self = this;

        
        $post_args = $slice(arguments);
        promises = $post_args;
        promises = self.$Array(($eqeq(promises.$length(), 1) ? (promises.$first()) : (promises)));
        return $send((Promise.allResolved(promises)), 'tap', [], function $$2(prom){
          
          if (prom == null) prom = nil;
          return prom.$instance_variable_set("@type", "all_resolved");});
      }, -1);
      
      $def(self, '$any', function $$any($a) {
        var $post_args, promises, self = this;

        
        $post_args = $slice(arguments);
        promises = $post_args;
        promises = self.$Array(($eqeq(promises.$length(), 1) ? (promises.$first()) : (promises)));
        return $send((Promise.any(promises)), 'tap', [], function $$3(prom){
          
          if (prom == null) prom = nil;
          return prom.$instance_variable_set("@type", "any");});
      }, -1);
      
      $def(self, '$race', function $$race($a) {
        var $post_args, promises, self = this;

        
        $post_args = $slice(arguments);
        promises = $post_args;
        promises = self.$Array(($eqeq(promises.$length(), 1) ? (promises.$first()) : (promises)));
        return $send((Promise.race(promises)), 'tap', [], function $$4(prom){
          
          if (prom == null) prom = nil;
          return prom.$instance_variable_set("@type", "race");});
      }, -1);
      
      $def(self, '$resolve', function $$resolve(value) {
        
        
        if (value == null) value = nil;
        return $send((Promise.resolve(value)), 'tap', [], function $$5(prom){
          
          if (prom == null) prom = nil;
          prom.$instance_variable_set("@type", "resolve");
          prom.$instance_variable_set("@realized", "resolve");
          return prom.$instance_variable_set("@value", value);});
      }, -1);
      
      $def(self, '$reject', function $$reject(value) {
        
        
        if (value == null) value = nil;
        return $send((Promise.reject(value)), 'tap', [], function $$6(prom){
          
          if (prom == null) prom = nil;
          prom.$instance_variable_set("@type", "reject");
          prom.$instance_variable_set("@realized", "reject");
          return prom.$instance_variable_set("@value", value);});
      }, -1);
      $alias(self, "all", "when");
      $alias(self, "error", "reject");
      return $alias(self, "value", "resolve");
    })(Opal.get_singleton_class(self), $nesting);
    self.$attr_reader("prev", "next");
    
    $def(self, '$native?', function $PromiseV2_native$ques$7() {
      var self = this;

      return self.type['$!=']("opal")
    });
    
    $def(self, '$nativity_check!', function $PromiseV2_nativity_check$excl$8() {
      var self = this;

      if ($truthy(self['$native?']())) {
        return self.$raise($$('ArgumentError'), "this promise is native to JavaScript")
      } else {
        return nil
      }
    });
    
    $def(self, '$light_nativity_check!', function $PromiseV2_light_nativity_check$excl$9() {
      var self = this;

      
      if ($truthy(["reject", "resolve", "trace", "always", "fail", "then"]['$include?'](self.type))) {
        return nil
      };
      if ($truthy(self['$native?']())) {
        return self.$raise($$('ArgumentError'), "this promise is native to JavaScript")
      } else {
        return nil
      };
    });
    
    $def(self, '$there_can_be_only_one!', function $PromiseV2_there_can_be_only_one$excl$10() {
      var self = this;

      if (($truthy(self.next) && ($truthy(self.next['$any?']())))) {
        return self.$raise($$('ArgumentError'), "a promise has already been chained")
      } else {
        return nil
      }
    });
    
    $def(self, '$gen_tracing_proc', function $$gen_tracing_proc(passing) {
      var block = $$gen_tracing_proc.$$p || nil, self = this;

      $$gen_tracing_proc.$$p = null;
      
      ;
      return $send(self, 'proc', [], function $$11(i){var res = nil;

        
        if (i == null) i = nil;
        res = passing.$call(i);
        Opal.yield1(block, res);
        return res;});
    });
    
    $def(self, '$resolve', function $$resolve(value) {
      var self = this;

      
      if (value == null) value = nil;
      self['$nativity_check!']();
      if ($truthy(self.realized)) {
        self.$raise($$('ArgumentError'), "this promise was already resolved")
      };
      self.value = value;
      self.realized = "resolve";
      self.resolve_proc.$call(value);
      return self;
    }, -1);
    
    $def(self, '$reject', function $$reject(value) {
      var self = this;

      
      if (value == null) value = nil;
      self['$nativity_check!']();
      if ($truthy(self.realized)) {
        self.$raise($$('ArgumentError'), "this promise was already resolved")
      };
      self.value = value;
      self.realized = "reject";
      self.reject_proc.$call(value);
      return self;
    }, -1);
    
    $def(self, '$then', function $$then() {
      var block = $$then.$$p || nil, self = this, prom = nil, blk = nil, $ret_or_1 = nil;

      $$then.$$p = null;
      
      ;
      prom = nil;
      blk = $send(self, 'gen_tracing_proc', [block], function $$12(val){
        
        if (val == null) val = nil;
        prom.$instance_variable_set("@realized", "resolve");
        return prom.$instance_variable_set("@value", val);});
      prom = self.then(blk);
      prom.$instance_variable_set("@prev", self);
      prom.$instance_variable_set("@type", "then");
      (self.next = ($truthy(($ret_or_1 = self.next)) ? ($ret_or_1) : ([])))['$<<'](prom);
      return prom;
    });
    
    $def(self, '$then!', function $PromiseV2_then$excl$13() {
      var block = $PromiseV2_then$excl$13.$$p || nil, self = this;

      $PromiseV2_then$excl$13.$$p = null;
      
      ;
      self['$there_can_be_only_one!']();
      return $send(self, 'then', [], block.$to_proc());
    });
    
    $def(self, '$fail', function $$fail() {
      var block = $$fail.$$p || nil, self = this, prom = nil, blk = nil, $ret_or_1 = nil;

      $$fail.$$p = null;
      
      ;
      prom = nil;
      blk = $send(self, 'gen_tracing_proc', [block], function $$14(val){
        
        if (val == null) val = nil;
        prom.$instance_variable_set("@realized", "resolve");
        return prom.$instance_variable_set("@value", val);});
      prom = self.catch(blk);
      prom.$instance_variable_set("@prev", self);
      prom.$instance_variable_set("@type", "fail");
      (self.next = ($truthy(($ret_or_1 = self.next)) ? ($ret_or_1) : ([])))['$<<'](prom);
      return prom;
    });
    
    $def(self, '$fail!', function $PromiseV2_fail$excl$15() {
      var block = $PromiseV2_fail$excl$15.$$p || nil, self = this;

      $PromiseV2_fail$excl$15.$$p = null;
      
      ;
      self['$there_can_be_only_one!']();
      return $send(self, 'fail', [], block.$to_proc());
    });
    
    $def(self, '$always', function $$always() {
      var block = $$always.$$p || nil, self = this, prom = nil, blk = nil, $ret_or_1 = nil;

      $$always.$$p = null;
      
      ;
      prom = nil;
      blk = $send(self, 'gen_tracing_proc', [block], function $$16(val){
        
        if (val == null) val = nil;
        prom.$instance_variable_set("@realized", "resolve");
        return prom.$instance_variable_set("@value", val);});
      prom = self.finally(blk);
      prom.$instance_variable_set("@prev", self);
      prom.$instance_variable_set("@type", "always");
      (self.next = ($truthy(($ret_or_1 = self.next)) ? ($ret_or_1) : ([])))['$<<'](prom);
      return prom;
    });
    
    $def(self, '$always!', function $PromiseV2_always$excl$17() {
      var block = $PromiseV2_always$excl$17.$$p || nil, self = this;

      $PromiseV2_always$excl$17.$$p = null;
      
      ;
      self['$there_can_be_only_one!']();
      return $send(self, 'always', [], block.$to_proc());
    });
    
    $def(self, '$trace', function $$trace(depth) {
      var block = $$trace.$$p || nil, self = this, prom = nil;

      $$trace.$$p = null;
      
      ;
      if (depth == null) depth = nil;
      prom = $send(self, 'then', [], function $$18(){var self = $$18.$$s == null ? this : $$18.$$s, values = nil, $ret_or_1 = nil, $ret_or_2 = nil, val = nil;

        
        values = [];
        prom = self;
        while ($truthy(($truthy(($ret_or_1 = prom)) ? (($truthy(($ret_or_2 = depth['$!']())) ? ($ret_or_2) : ($rb_gt(depth, 0)))) : ($ret_or_1)))) {
        
          val = nil;
          
          try {
            val = prom.$value()
          } catch ($err) {
            if (Opal.rescue($err, [$$('ArgumentError')])) {
              try {
                val = "native"
              } finally { Opal.pop_exception(); }
            } else { throw $err; }
          };;
          values.$unshift(val);
          if ($truthy(depth)) {
            depth = $rb_minus(depth, 1)
          };
          prom = prom.$prev();
        };
        return Opal.yieldX(block, $to_a(values));;}, {$$s: self});
      prom.$instance_variable_set("@type", "trace");
      return prom;
    }, -1);
    
    $def(self, '$trace!', function $PromiseV2_trace$excl$19($a) {
      var block = $PromiseV2_trace$excl$19.$$p || nil, $post_args, args, self = this;

      $PromiseV2_trace$excl$19.$$p = null;
      
      ;
      $post_args = $slice(arguments);
      args = $post_args;
      self['$there_can_be_only_one!']();
      return $send(self, 'trace', $to_a(args), block.$to_proc());
    }, -1);
    
    $def(self, '$resolved?', function $PromiseV2_resolved$ques$20() {
      var self = this;

      
      self['$light_nativity_check!']();
      return self.realized['$==']("resolve");
    });
    
    $def(self, '$rejected?', function $PromiseV2_rejected$ques$21() {
      var self = this;

      
      self['$light_nativity_check!']();
      return self.realized['$==']("reject");
    });
    
    $def(self, '$realized?', function $PromiseV2_realized$ques$22() {
      var self = this;

      
      self['$light_nativity_check!']();
      return self.realized['$nil?']()['$!']();
    });
    
    $def(self, '$value', function $$value() {
      var self = this;

      if ($truthy(self['$resolved?']())) {
        if ($eqeqeq($$('PromiseV2'), self.value)) {
          return self.value.$value()
        } else {
          return self.value
        }
      } else {
        return nil
      }
    });
    
    $def(self, '$error', function $$error() {
      var self = this;

      
      self['$light_nativity_check!']();
      if ($truthy(self['$rejected?']())) {
        return self.value
      } else {
        return nil
      };
    });
    
    $def(self, '$and', function $$and($a) {
      var $post_args, promises, self = this;

      
      $post_args = $slice(arguments);
      promises = $post_args;
      promises = $send(promises, 'map', [], function $$23(i){
        
        if (i == null) i = nil;
        if ($eqeqeq($$('PromiseV2'), i)) {
          return i
        } else {
          return $$('PromiseV2').$value(i)
        };});
      return $send($send($$('PromiseV2'), 'when', [self].concat($to_a(promises))), 'then', [], function $$24(a, $b){var $post_args, b;

        
        if (a == null) a = nil;
        $post_args = $slice(arguments, 1);
        b = $post_args;
        return [].concat($to_a(a)).concat($to_a(b));}, -2);
    }, -1);
    
    $def(self, '$initialize', function $$initialize() {
      var block = $$initialize.$$p || nil, self = this;

      $$initialize.$$p = null;
      
      ;
      if ((block !== nil)) {
        return Opal.yield1(block, self);
      } else {
        return nil
      };
    });
    
    $def(self, '$to_v1', function $$to_v1() {
      var self = this, v1 = nil;

      
      v1 = $$('PromiseV1').$new();
      $send($send(self, 'then', [], function $$25(i){
        
        if (i == null) i = nil;
        return v1.$resolve(i);}), 'rescue', [], function $$26(i){
        
        if (i == null) i = nil;
        return v1.$reject(i);});
      return v1;
    });
    
    $def(self, '$inspect', function $$inspect() {
      var self = this, result = nil;

      
      result = "#<" + (self.$class());
      if ($truthy(self.type)) {
        if (!$truthy(["opal", "resolve", "reject"]['$include?'](self.type))) {
          result = $rb_plus(result, ":" + (self.type))
        }
      } else {
        result = $rb_plus(result, ":native")
      };
      if ($truthy(self.realized)) {
        result = $rb_plus(result, ":" + (self.realized))
      };
      result = $rb_plus(result, "(" + (self.$object_id()) + ")");
      if (($truthy(self.next) && ($truthy(self.next['$any?']())))) {
        result = $rb_plus(result, " >> " + (self.next.$inspect()))
      };
      if ($truthy(self.value)) {
        result = $rb_plus(result, ": " + (self.value.$inspect()))
      };
      result = $rb_plus(result, ">");
      return result;
    });
    $alias(self, "catch", "fail");
    $alias(self, "catch!", "fail!");
    $alias(self, "do", "then");
    $alias(self, "do!", "then!");
    $alias(self, "ensure", "always");
    $alias(self, "ensure!", "always!");
    $alias(self, "finally", "always");
    $alias(self, "finally!", "always!");
    $alias(self, "reject!", "reject");
    $alias(self, "rescue", "fail");
    $alias(self, "rescue!", "fail!");
    $alias(self, "resolve!", "resolve");
    $alias(self, "to_n", "itself");
    return $alias(self, "to_v2", "itself");
  })($nesting[0], Promise, $nesting)
};

Opal.queue(function(Opal) {/* Generated by Opal 1.7.0.rc1 */
  var $coerce_to = Opal.coerce_to, $klass = Opal.klass, $truthy = Opal.truthy, $rb_lt = Opal.rb_lt, $rb_plus = Opal.rb_plus, $def = Opal.def, $module = Opal.module, $send = Opal.send, $to_a = Opal.to_a, $gvars = Opal.gvars, $rb_times = Opal.rb_times, $alias = Opal.alias, $slice = Opal.slice, $Kernel = Opal.Kernel, self = Opal.top, $nesting = [], nil = Opal.nil, $$$ = Opal.$$$;

  Opal.add_stubs('require,<,<<,await,[],+,when,map,to_proc,empty?,pop,call,new,proc,resolve,*,itself,async?,raise');
  
    var AsyncFunction = Object.getPrototypeOf(async function() {}).constructor;;
  self.$require("promise/v2");
  (function($base, $super) {
    var self = $klass($base, $super, 'Array');

    
    
    
    $def(self, '$map_await', async function $$map_await() {
      var block = $$map_await.$$p || nil, self = this, i = nil, results = nil;

      $$map_await.$$p = null;
      
      ;
      i = 0;
      results = [];
      while ($truthy($rb_lt(i, self.length))) {
      
        results['$<<']((await Opal.yield1(block, self['$[]'](i)).$await()));
        i = $rb_plus(i, 1);
      };
      return results;
    });
    return $def(self, '$each_await', async function $$each_await() {
      var block = $$each_await.$$p || nil, self = this, i = nil;

      $$each_await.$$p = null;
      
      ;
      i = 0;
      while ($truthy($rb_lt(i, self.length))) {
      
        (await Opal.yield1(block, self['$[]'](i)).$await());
        i = $rb_plus(i, 1);
      };
      return self;
    });
  })($nesting[0], null);
  (function($base, $parent_nesting) {
    var self = $module($base, 'Enumerable');

    var $nesting = [self].concat($parent_nesting), $$ = Opal.$r($nesting);

    return $def(self, '$each_async', async function $$each_async() {
      var block = $$each_async.$$p || nil, self = this;

      $$each_async.$$p = null;
      
      ;
      return (await $send($$('PromiseV2'), 'when', $to_a($send(self, 'map', [], block.$to_proc()))).$await());
    })
  })($nesting[0], $nesting);
  (function($base, $parent_nesting) {
    var self = $module($base, 'Kernel');

    var $nesting = [self].concat($parent_nesting), $$ = Opal.$r($nesting);

    
    
    $def(self, '$exit', async function $$exit(status) {
      var $ret_or_1 = nil, block = nil;
      if ($gvars.__at_exit__ == null) $gvars.__at_exit__ = nil;

      
      if (status == null) status = true;
      $gvars.__at_exit__ = ($truthy(($ret_or_1 = $gvars.__at_exit__)) ? ($ret_or_1) : ([]));
      while (!($truthy($gvars.__at_exit__['$empty?']()))) {
      
        block = $gvars.__at_exit__.$pop();
        (await block.$call().$await());
      };
      
      if (status.$$is_boolean) {
        status = status ? 0 : 1;
      } else {
        status = $coerce_to(status, $$('Integer'), 'to_int')
      }

      Opal.exit(status);
    ;
      return nil;
    }, -1);
    
    $def(self, '$sleep', function $$sleep(seconds) {
      var self = this, prom = nil;

      
      prom = $$('PromiseV2').$new();
      setTimeout($send(self, 'proc', [], function $$1(){
        return prom.$resolve()}), $rb_times(seconds, 1000));
      return prom;
    });
    return $alias(self, "await", "itself");
  })($nesting[0], $nesting);
  (function($base, $super) {
    var self = $klass($base, $super, 'Proc');

    
    return $def(self, '$async?', function $Proc_async$ques$2() {
      var self = this;

      return self instanceof AsyncFunction;
    })
  })($nesting[0], null);
  (function($base, $super) {
    var self = $klass($base, $super, 'Method');

    var $proto = self.$$prototype;

    $proto.method = nil;
    return $def(self, '$async?', function $Method_async$ques$3() {
      var self = this;

      return self.method['$async?']()
    })
  })($nesting[0], null);
  return (function($base, $super) {
    var self = $klass($base, $super, 'BasicObject');

    
    return $def(self, '$instance_exec_await', async function $$instance_exec_await($a) {
      var block = $$instance_exec_await.$$p || nil, $post_args, args, self = this;

      $$instance_exec_await.$$p = null;
      
      ;
      $post_args = $slice(arguments);
      args = $post_args;
      if (!$truthy(block)) {
        $Kernel.$raise($$$('ArgumentError'), "no block given")
      };
      (await (nil));
      
      var block_self = block.$$s,
          result;

      block.$$s = null;

      if (self.$$is_a_module) {
        self.$$eval = true;
        try {
          result = await block.apply(self, args);
        }
        finally {
          self.$$eval = false;
        }
      }
      else {
        result = await block.apply(self, args);
      }

      block.$$s = block_self;

      return result;
    ;
    }, -1)
  })($nesting[0], null);
});
