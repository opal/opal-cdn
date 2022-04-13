Opal.modules["ostruct"] = function(Opal) {/* Generated by Opal 1.5.0 */
  var $nesting = [], nil = Opal.nil, $klass = Opal.klass, $hash2 = Opal.hash2, $truthy = Opal.truthy, $send = Opal.send, $def = Opal.def, $rb_gt = Opal.rb_gt, $neqeq = Opal.neqeq, $range = Opal.range, $send2 = Opal.send2, $find_super = Opal.find_super, $rb_plus = Opal.rb_plus, $alias = Opal.alias;

  Opal.add_stubs('each_pair,[]=,new_ostruct_member,[],to_sym,>,length,raise,new,end_with?,!=,chomp,to_s,key?,enum_for,is_a?,==,instance_variable_get,===,eql?,dup,to_n,hash,attr_reader,__send__,singleton_class,delete,respond_to?,define_singleton_method,__id__,class,any?,+,join,map,inspect');
  return (function($base, $super, $parent_nesting) {
    var self = $klass($base, $super, 'OpenStruct');

    var $nesting = [self].concat($parent_nesting), $$ = Opal.$r($nesting), $proto = self.$$prototype;

    $proto.table = nil;
    
    
    $def(self, '$initialize', function $$initialize(hash) {
      var self = this;

      
      
      if (hash == null) hash = nil;;
      self.table = $hash2([], {});
      if ($truthy(hash)) {
        return $send(hash, 'each_pair', [], function $$1(key, value){var $a, self = $$1.$$s == null ? this : $$1.$$s;
          if (self.table == null) self.table = nil;

          
          
          if (key == null) key = nil;;
          
          if (value == null) value = nil;;
          return ($a = [self.$new_ostruct_member(key), value], $send(self.table, '[]=', $a), $a[$a.length - 1]);}, {$$arity: 2, $$s: self})
      } else {
        return nil
      };
    }, -1);
    
    $def(self, '$[]', function $OpenStruct_$$$2(name) {
      var self = this;

      return self.table['$[]'](name.$to_sym())
    }, 1);
    
    $def(self, '$[]=', function $OpenStruct_$$$eq$3(name, value) {
      var $a, self = this;

      return ($a = [self.$new_ostruct_member(name), value], $send(self.table, '[]=', $a), $a[$a.length - 1])
    }, 2);
    
    $def(self, '$method_missing', function $$method_missing(name, $a) {
      var $post_args, args, $b, self = this;

      
      
      $post_args = Opal.slice.call(arguments, 1);
      
      args = $post_args;;
      if ($truthy($rb_gt(args.$length(), 2))) {
        self.$raise($$('NoMethodError').$new("undefined method `" + (name) + "' for #<OpenStruct>", name))
      };
      if ($truthy(name['$end_with?']("="))) {
        
        if ($neqeq(args.$length(), 1)) {
          self.$raise($$('ArgumentError'), "wrong number of arguments (0 for 1)")
        };
        return ($b = [self.$new_ostruct_member(name['$[]']($range(0, -2, false))), args['$[]'](0)], $send(self.table, '[]=', $b), $b[$b.length - 1]);
      } else {
        return self.table['$[]'](name.$to_sym())
      };
    }, -2);
    
    $def(self, '$respond_to_missing?', function $OpenStruct_respond_to_missing$ques$4(mid, include_private) {
      var $a, $yield = $OpenStruct_respond_to_missing$ques$4.$$p || nil, self = this, mname = nil, $ret_or_1 = nil;

      delete $OpenStruct_respond_to_missing$ques$4.$$p;
      
      
      if (include_private == null) include_private = false;;
      mname = mid.$to_s().$chomp("=").$to_sym();
      if ($truthy(($ret_or_1 = ($a = self.table, ($a === nil || $a == null) ? nil : self.table['$key?'](mname))))) {
        return $ret_or_1
      } else {
        return $send2(self, $find_super(self, 'respond_to_missing?', $OpenStruct_respond_to_missing$ques$4, false, true), 'respond_to_missing?', [mid, include_private], $yield)
      };
    }, -2);
    
    $def(self, '$each_pair', function $$each_pair() {
      var $yield = $$each_pair.$$p || nil, self = this;

      delete $$each_pair.$$p;
      
      if (!($yield !== nil)) {
        return self.$enum_for("each_pair")
      };
      return $send(self.table, 'each_pair', [], function $$5(pair){
        
        
        if (pair == null) pair = nil;;
        return Opal.yield1($yield, pair);;}, 1);
    }, 0);
    
    $def(self, '$==', function $OpenStruct_$eq_eq$6(other) {
      var self = this;

      
      if (!$truthy(other['$is_a?']($$('OpenStruct')))) {
        return false
      };
      return self.table['$=='](other.$instance_variable_get("@table"));
    }, 1);
    
    $def(self, '$===', function $OpenStruct_$eq_eq_eq$7(other) {
      var self = this;

      
      if (!$truthy(other['$is_a?']($$('OpenStruct')))) {
        return false
      };
      return self.table['$==='](other.$instance_variable_get("@table"));
    }, 1);
    
    $def(self, '$eql?', function $OpenStruct_eql$ques$8(other) {
      var self = this;

      
      if (!$truthy(other['$is_a?']($$('OpenStruct')))) {
        return false
      };
      return self.table['$eql?'](other.$instance_variable_get("@table"));
    }, 1);
    
    $def(self, '$to_h', function $$to_h() {
      var self = this;

      return self.table.$dup()
    }, 0);
    
    $def(self, '$to_n', function $$to_n() {
      var self = this;

      return self.table.$to_n()
    }, 0);
    
    $def(self, '$hash', function $$hash() {
      var self = this;

      return self.table.$hash()
    }, 0);
    self.$attr_reader("table");
    
    $def(self, '$delete_field', function $$delete_field(name) {
      var self = this, sym = nil;

      
      sym = name.$to_sym();
      
      try {
        self.$singleton_class().$__send__("remove_method", sym, "" + (sym) + "=")
      } catch ($err) {
        if (Opal.rescue($err, [$$('NameError')])) {
          try {
            nil
          } finally { Opal.pop_exception(); }
        } else { throw $err; }
      };;
      return self.table.$delete(sym);
    }, 1);
    
    $def(self, '$new_ostruct_member', function $$new_ostruct_member(name) {
      var self = this;

      
      name = name.$to_sym();
      if (!$truthy(self['$respond_to?'](name))) {
        
        $send(self, 'define_singleton_method', [name], function $$9(){var self = $$9.$$s == null ? this : $$9.$$s;
          if (self.table == null) self.table = nil;

          return self.table['$[]'](name)}, {$$arity: 0, $$s: self});
        $send(self, 'define_singleton_method', ["" + (name) + "="], function $$10(x){var $a, self = $$10.$$s == null ? this : $$10.$$s;
          if (self.table == null) self.table = nil;

          
          
          if (x == null) x = nil;;
          return ($a = [name, x], $send(self.table, '[]=', $a), $a[$a.length - 1]);}, {$$arity: 1, $$s: self});
      };
      return name;
    }, 1);
    var ostruct_ids;;
    
    $def(self, '$inspect', function $$inspect() {
      var self = this, result = nil;

      
      
      var top = (ostruct_ids === undefined),
          ostruct_id = self.$__id__();
    ;
      
      return (function() { try {
      
      result = "#<" + (self.$class());
      
        if (top) {
          ostruct_ids = {};
        }
        if (ostruct_ids.hasOwnProperty(ostruct_id)) {
          return result + ' ...>';
        }
        ostruct_ids[ostruct_id] = true;
      ;
      if ($truthy(self.table['$any?']())) {
        result = $rb_plus(result, " ")
      };
      result = $rb_plus(result, $send(self.$each_pair(), 'map', [], function $$11(name, value){
        
        
        if (name == null) name = nil;;
        
        if (value == null) value = nil;;
        return "" + (name) + "=" + (value.$inspect());}, 2).$join(", "));
      result = $rb_plus(result, ">");
      return result;
      } finally {
        
        if (top) {
          ostruct_ids = undefined;
        }
      
      }; })();;
    }, 0);
    return $alias(self, "to_s", "inspect");
  })($nesting[0], null, $nesting)
};
