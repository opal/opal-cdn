Opal.queue(function(Opal) {/* Generated by Opal 1.6.0 */
  var $freeze = Opal.freeze, $klass = Opal.klass, $slice = Opal.slice, $defs = Opal.defs, $hash2 = Opal.hash2, $truthy = Opal.truthy, $eqeqeq = Opal.eqeqeq, $Kernel = Opal.Kernel, $send = Opal.send, $def = Opal.def, $eqeq = Opal.eqeq, $rb_lt = Opal.rb_lt, $rb_le = Opal.rb_le, $alias = Opal.alias, $module = Opal.module, $to_a = Opal.to_a, $nesting = [], nil = Opal.nil, $$$ = Opal.$$$;

  Opal.add_stubs('include,new,nil?,===,raise,each,add,merge,class,respond_to?,subtract,dup,join,to_a,equal?,instance_of?,==,instance_variable_get,size,is_a?,all?,include?,[]=,enum_for,[],<<,replace,compare_by_identity,name,compare_by_identity?,delete,select,frozen?,freeze,reject,delete_if,to_proc,keep_if,each_key,empty?,eql?,instance_eval,clear,<,<=,any?,!,intersect?,keys,|,proper_subset?,subset?,proper_superset?,superset?,-,select!,collect!');
  
  (function($base, $super, $parent_nesting) {
    var self = $klass($base, $super, 'Set');

    var $nesting = [self].concat($parent_nesting), $$ = Opal.$r($nesting), $ret_or_1 = nil, $proto = self.$$prototype;

    $proto.hash = nil;
    
    self.$include($$$('Enumerable'));
    $defs(self, '$[]', function $Set_$$$1($a) {
      var $post_args, ary, self = this;

      
      $post_args = $slice.call(arguments);
      ary = $post_args;
      return self.$new(ary);
    }, -1);
    
    $def(self, '$initialize', function $$initialize(enum$) {
      var block = $$initialize.$$p || nil, self = this;

      $$initialize.$$p = null;
      
      ;
      if (enum$ == null) enum$ = nil;
      self.hash = $hash2([], {});
      if ($truthy(enum$['$nil?']())) {
        return nil
      };
      if (!$eqeqeq($$$('Enumerable'), enum$)) {
        $Kernel.$raise($$$('ArgumentError'), "value must be enumerable")
      };
      if ($truthy(block)) {
        return $send(enum$, 'each', [], function $$2(item){var self = $$2.$$s == null ? this : $$2.$$s;

          
          if (item == null) item = nil;
          return self.$add(Opal.yield1(block, item));}, {$$arity: 1, $$s: self})
      } else {
        return self.$merge(enum$)
      };
    }, -1);
    
    $def(self, '$dup', function $$dup() {
      var self = this, result = nil;

      
      result = self.$class().$new();
      return result.$merge(self);
    }, 0);
    
    $def(self, '$-', function $Set_$minus$3(enum$) {
      var self = this;

      
      if (!$truthy(enum$['$respond_to?']("each"))) {
        $Kernel.$raise($$$('ArgumentError'), "value must be enumerable")
      };
      return self.$dup().$subtract(enum$);
    }, 1);
    
    $def(self, '$inspect', function $$inspect() {
      var self = this;

      return "#<Set: {" + (self.$to_a().$join(",")) + "}>"
    }, 0);
    
    $def(self, '$==', function $Set_$eq_eq$4(other) {
      var self = this;

      if ($truthy(self['$equal?'](other))) {
        return true
      } else if ($truthy(other['$instance_of?'](self.$class()))) {
        return self.hash['$=='](other.$instance_variable_get("@hash"))
      } else if (($truthy(other['$is_a?']($$$('Set'))) && ($eqeq(self.$size(), other.$size())))) {
        return $send(other, 'all?', [], function $$5(o){var self = $$5.$$s == null ? this : $$5.$$s;
          if (self.hash == null) self.hash = nil;

          
          if (o == null) o = nil;
          return self.hash['$include?'](o);}, {$$arity: 1, $$s: self})
      } else {
        return false
      }
    }, 1);
    
    $def(self, '$add', function $$add(o) {
      var self = this;

      
      self.hash['$[]='](o, true);
      return self;
    }, 1);
    
    $def(self, '$classify', function $$classify() {
      var block = $$classify.$$p || nil, self = this, result = nil;

      $$classify.$$p = null;
      
      ;
      if (!(block !== nil)) {
        return self.$enum_for("classify")
      };
      result = $send($$$('Hash'), 'new', [], function $$6(h, k){var $a, self = $$6.$$s == null ? this : $$6.$$s;

        
        if (h == null) h = nil;
        if (k == null) k = nil;
        return ($a = [k, self.$class().$new()], $send(h, '[]=', $a), $a[$a.length - 1]);}, {$$arity: 2, $$s: self});
      $send(self, 'each', [], function $$7(item){
        
        if (item == null) item = nil;
        return result['$[]'](Opal.yield1(block, item)).$add(item);}, 1);
      return result;
    }, 0);
    
    $def(self, '$collect!', function $Set_collect$excl$8() {
      var block = $Set_collect$excl$8.$$p || nil, self = this, result = nil;

      $Set_collect$excl$8.$$p = null;
      
      ;
      if (!(block !== nil)) {
        return self.$enum_for("collect!")
      };
      result = self.$class().$new();
      $send(self, 'each', [], function $$9(item){
        
        if (item == null) item = nil;
        return result['$<<'](Opal.yield1(block, item));}, 1);
      return self.$replace(result);
    }, 0);
    
    $def(self, '$compare_by_identity', function $$compare_by_identity() {
      var self = this;

      if ($truthy(self.hash['$respond_to?']("compare_by_identity"))) {
        
        self.hash.$compare_by_identity();
        return self;
      } else {
        return self.$raise($$('NotImplementedError'), "" + (self.$class().$name()) + "#" + ("compare_by_identity") + " is not implemented")
      }
    }, 0);
    
    $def(self, '$compare_by_identity?', function $Set_compare_by_identity$ques$10() {
      var self = this, $ret_or_1 = nil;

      if ($truthy(($ret_or_1 = self.hash['$respond_to?']("compare_by_identity?")))) {
        return self.hash['$compare_by_identity?']()
      } else {
        return $ret_or_1
      }
    }, 0);
    
    $def(self, '$delete', function $Set_delete$11(o) {
      var self = this;

      
      self.hash.$delete(o);
      return self;
    }, 1);
    
    $def(self, '$delete?', function $Set_delete$ques$12(o) {
      var self = this;

      if ($truthy(self['$include?'](o))) {
        
        self.$delete(o);
        return self;
      } else {
        return nil
      }
    }, 1);
    
    $def(self, '$delete_if', function $$delete_if() {
      var $yield = $$delete_if.$$p || nil, self = this;

      $$delete_if.$$p = null;
      
      if (!($yield !== nil)) {
        return self.$enum_for("delete_if")
      };
      $send($send(self, 'select', [], function $$13(o){
        
        if (o == null) o = nil;
        return Opal.yield1($yield, o);;}, 1), 'each', [], function $$14(o){var self = $$14.$$s == null ? this : $$14.$$s;
        if (self.hash == null) self.hash = nil;

        
        if (o == null) o = nil;
        return self.hash.$delete(o);}, {$$arity: 1, $$s: self});
      return self;
    }, 0);
    
    $def(self, '$freeze', function $$freeze() {
      var self = this;

      
      if ($truthy(self['$frozen?']())) {
        return self
      };
      self.hash.$freeze();
      return $freeze(self);;
    }, 0);
    
    $def(self, '$keep_if', function $$keep_if() {
      var $yield = $$keep_if.$$p || nil, self = this;

      $$keep_if.$$p = null;
      
      if (!($yield !== nil)) {
        return self.$enum_for("keep_if")
      };
      $send($send(self, 'reject', [], function $$15(o){
        
        if (o == null) o = nil;
        return Opal.yield1($yield, o);;}, 1), 'each', [], function $$16(o){var self = $$16.$$s == null ? this : $$16.$$s;
        if (self.hash == null) self.hash = nil;

        
        if (o == null) o = nil;
        return self.hash.$delete(o);}, {$$arity: 1, $$s: self});
      return self;
    }, 0);
    
    $def(self, '$reject!', function $Set_reject$excl$17() {
      var block = $Set_reject$excl$17.$$p || nil, self = this, before = nil;

      $Set_reject$excl$17.$$p = null;
      
      ;
      if (!(block !== nil)) {
        return self.$enum_for("reject!")
      };
      before = self.$size();
      $send(self, 'delete_if', [], block.$to_proc());
      if ($eqeq(self.$size(), before)) {
        return nil
      } else {
        return self
      };
    }, 0);
    
    $def(self, '$select!', function $Set_select$excl$18() {
      var block = $Set_select$excl$18.$$p || nil, self = this, before = nil;

      $Set_select$excl$18.$$p = null;
      
      ;
      if (!(block !== nil)) {
        return self.$enum_for("select!")
      };
      before = self.$size();
      $send(self, 'keep_if', [], block.$to_proc());
      if ($eqeq(self.$size(), before)) {
        return nil
      } else {
        return self
      };
    }, 0);
    
    $def(self, '$add?', function $Set_add$ques$19(o) {
      var self = this;

      if ($truthy(self['$include?'](o))) {
        return nil
      } else {
        return self.$add(o)
      }
    }, 1);
    
    $def(self, '$each', function $$each() {
      var block = $$each.$$p || nil, self = this;

      $$each.$$p = null;
      
      ;
      if (!(block !== nil)) {
        return self.$enum_for("each")
      };
      $send(self.hash, 'each_key', [], block.$to_proc());
      return self;
    }, 0);
    
    $def(self, '$empty?', function $Set_empty$ques$20() {
      var self = this;

      return self.hash['$empty?']()
    }, 0);
    
    $def(self, '$eql?', function $Set_eql$ques$21(other) {
      var self = this;

      return self.hash['$eql?']($send(other, 'instance_eval', [], function $$22(){var self = $$22.$$s == null ? this : $$22.$$s;
        if (self.hash == null) self.hash = nil;

        return self.hash}, {$$arity: 0, $$s: self}))
    }, 1);
    
    $def(self, '$clear', function $$clear() {
      var self = this;

      
      self.hash.$clear();
      return self;
    }, 0);
    
    $def(self, '$include?', function $Set_include$ques$23(o) {
      var self = this;

      return self.hash['$include?'](o)
    }, 1);
    
    $def(self, '$merge', function $$merge(enum$) {
      var self = this;

      
      $send(enum$, 'each', [], function $$24(item){var self = $$24.$$s == null ? this : $$24.$$s;

        
        if (item == null) item = nil;
        return self.$add(item);}, {$$arity: 1, $$s: self});
      return self;
    }, 1);
    
    $def(self, '$replace', function $$replace(enum$) {
      var self = this;

      
      self.$clear();
      self.$merge(enum$);
      return self;
    }, 1);
    
    $def(self, '$size', function $$size() {
      var self = this;

      return self.hash.$size()
    }, 0);
    
    $def(self, '$subtract', function $$subtract(enum$) {
      var self = this;

      
      $send(enum$, 'each', [], function $$25(item){var self = $$25.$$s == null ? this : $$25.$$s;

        
        if (item == null) item = nil;
        return self.$delete(item);}, {$$arity: 1, $$s: self});
      return self;
    }, 1);
    
    $def(self, '$|', function $Set_$$26(enum$) {
      var self = this;

      
      if (!$truthy(enum$['$respond_to?']("each"))) {
        $Kernel.$raise($$$('ArgumentError'), "value must be enumerable")
      };
      return self.$dup().$merge(enum$);
    }, 1);
    
    function is_set(set) {
      ($truthy(($ret_or_1 = (set)['$is_a?']($$$('Set')))) ? ($ret_or_1) : ($Kernel.$raise($$$('ArgumentError'), "value must be a set")))
    }
  ;
    
    $def(self, '$superset?', function $Set_superset$ques$27(set) {
      var self = this;

      
      is_set(set);
      if ($truthy($rb_lt(self.$size(), set.$size()))) {
        return false
      };
      return $send(set, 'all?', [], function $$28(o){var self = $$28.$$s == null ? this : $$28.$$s;

        
        if (o == null) o = nil;
        return self['$include?'](o);}, {$$arity: 1, $$s: self});
    }, 1);
    
    $def(self, '$proper_superset?', function $Set_proper_superset$ques$29(set) {
      var self = this;

      
      is_set(set);
      if ($truthy($rb_le(self.$size(), set.$size()))) {
        return false
      };
      return $send(set, 'all?', [], function $$30(o){var self = $$30.$$s == null ? this : $$30.$$s;

        
        if (o == null) o = nil;
        return self['$include?'](o);}, {$$arity: 1, $$s: self});
    }, 1);
    
    $def(self, '$subset?', function $Set_subset$ques$31(set) {
      var self = this;

      
      is_set(set);
      if ($truthy($rb_lt(set.$size(), self.$size()))) {
        return false
      };
      return $send(self, 'all?', [], function $$32(o){
        
        if (o == null) o = nil;
        return set['$include?'](o);}, 1);
    }, 1);
    
    $def(self, '$proper_subset?', function $Set_proper_subset$ques$33(set) {
      var self = this;

      
      is_set(set);
      if ($truthy($rb_le(set.$size(), self.$size()))) {
        return false
      };
      return $send(self, 'all?', [], function $$34(o){
        
        if (o == null) o = nil;
        return set['$include?'](o);}, 1);
    }, 1);
    
    $def(self, '$intersect?', function $Set_intersect$ques$35(set) {
      var self = this;

      
      is_set(set);
      if ($truthy($rb_lt(self.$size(), set.$size()))) {
        return $send(self, 'any?', [], function $$36(o){
          
          if (o == null) o = nil;
          return set['$include?'](o);}, 1)
      } else {
        return $send(set, 'any?', [], function $$37(o){var self = $$37.$$s == null ? this : $$37.$$s;

          
          if (o == null) o = nil;
          return self['$include?'](o);}, {$$arity: 1, $$s: self})
      };
    }, 1);
    
    $def(self, '$disjoint?', function $Set_disjoint$ques$38(set) {
      var self = this;

      return self['$intersect?'](set)['$!']()
    }, 1);
    
    $def(self, '$to_a', function $$to_a() {
      var self = this;

      return self.hash.$keys()
    }, 0);
    $alias(self, "+", "|");
    $alias(self, "<", "proper_subset?");
    $alias(self, "<<", "add");
    $alias(self, "<=", "subset?");
    $alias(self, ">", "proper_superset?");
    $alias(self, ">=", "superset?");
    $alias(self, "difference", "-");
    $alias(self, "filter!", "select!");
    $alias(self, "length", "size");
    $alias(self, "map!", "collect!");
    $alias(self, "member?", "include?");
    return $alias(self, "union", "|");
  })('::', null, $nesting);
  return (function($base, $parent_nesting) {
    var self = $module($base, 'Enumerable');

    var $nesting = [self].concat($parent_nesting), $$ = Opal.$r($nesting);

    return $def(self, '$to_set', function $$to_set($a, $b) {
      var block = $$to_set.$$p || nil, $post_args, klass, args, self = this;

      $$to_set.$$p = null;
      
      ;
      $post_args = $slice.call(arguments);
      
      if ($post_args.length > 0) klass = $post_args.shift();if (klass == null) klass = $$('Set');
      args = $post_args;
      return $send(klass, 'new', [self].concat($to_a(args)), block.$to_proc());
    }, -1)
  })('::', $nesting);
});
