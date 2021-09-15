/* Generated by Opal 1.1.1 */
Opal.modules["delegate"] = function(Opal) {
  var $DelegateClass$6, self = Opal.top, $nesting = [], nil = Opal.nil, $$$ = Opal.$$$, $$ = Opal.$$, $klass = Opal.klass, $truthy = Opal.truthy, $send = Opal.send, $send2 = Opal.send2;

  Opal.add_stubs(['$__setobj__', '$__getobj__', '$respond_to?', '$__send__', '$to_proc']);
  
  (function($base, $super, $parent_nesting) {
    var self = $klass($base, $super, 'Delegator');

    var $nesting = [self].concat($parent_nesting), $Delegator_initialize$1, $Delegator_method_missing$2, $Delegator_respond_to_missing$ques$3;

    
    
    Opal.def(self, '$initialize', $Delegator_initialize$1 = function $$initialize(obj) {
      var self = this;

      return self.$__setobj__(obj)
    }, $Delegator_initialize$1.$$arity = 1);
    
    Opal.def(self, '$method_missing', $Delegator_method_missing$2 = function $$method_missing(m, $a) {
      var $iter = $Delegator_method_missing$2.$$p, block = $iter || nil, $post_args, args, self = this, target = nil;

      if ($iter) $Delegator_method_missing$2.$$p = null;
      
      
      if ($iter) $Delegator_method_missing$2.$$p = null;;
      
      $post_args = Opal.slice.call(arguments, 1, arguments.length);
      
      args = $post_args;;
      target = self.$__getobj__();
      if ($truthy(target['$respond_to?'](m))) {
        return $send(target, '__send__', [m].concat(Opal.to_a(args)), block.$to_proc())
      } else {
        return $send2(self, Opal.find_super_dispatcher(self, 'method_missing', $Delegator_method_missing$2, false, true), 'method_missing', [m].concat(Opal.to_a(args)), block.$to_proc())
      };
    }, $Delegator_method_missing$2.$$arity = -2);
    return (Opal.def(self, '$respond_to_missing?', $Delegator_respond_to_missing$ques$3 = function(m, include_private) {
      var self = this;

      return self.$__getobj__()['$respond_to?'](m, include_private)
    }, $Delegator_respond_to_missing$ques$3.$$arity = 2), nil) && 'respond_to_missing?';
  })($nesting[0], $$($nesting, 'BasicObject'), $nesting);
  (function($base, $super, $parent_nesting) {
    var self = $klass($base, $super, 'SimpleDelegator');

    var $nesting = [self].concat($parent_nesting), $SimpleDelegator___getobj__$4, $SimpleDelegator___setobj__$5;

    self.$$prototype.delegate_sd_obj = nil;
    
    
    Opal.def(self, '$__getobj__', $SimpleDelegator___getobj__$4 = function $$__getobj__() {
      var self = this;

      return self.delegate_sd_obj
    }, $SimpleDelegator___getobj__$4.$$arity = 0);
    return (Opal.def(self, '$__setobj__', $SimpleDelegator___setobj__$5 = function $$__setobj__(obj) {
      var self = this;

      return (self.delegate_sd_obj = obj)
    }, $SimpleDelegator___setobj__$5.$$arity = 1), nil) && '__setobj__';
  })($nesting[0], $$($nesting, 'Delegator'), $nesting);
  return (Opal.def(self, '$DelegateClass', $DelegateClass$6 = function $$DelegateClass(superklass) {
    var self = this;

    return $$($nesting, 'SimpleDelegator')
  }, $DelegateClass$6.$$arity = 1), nil) && 'DelegateClass';
};
