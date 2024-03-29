Opal.modules["delegate"] = function(Opal) {/* Generated by Opal 1.5.0.rc1 */
  var self = Opal.top, $nesting = [], $$ = Opal.$r($nesting), nil = Opal.nil, $klass = Opal.klass, $def = Opal.def, $truthy = Opal.truthy, $send = Opal.send, $to_a = Opal.to_a, $send2 = Opal.send2, $find_super = Opal.find_super, $return_ivar = Opal.return_ivar, $assign_ivar = Opal.assign_ivar;

  Opal.add_stubs('__setobj__,__getobj__,respond_to?,__send__,to_proc');
  
  (function($base, $super) {
    var self = $klass($base, $super, 'Delegator');

    
    
    
    $def(self, '$initialize', function $$initialize(obj) {
      var self = this;

      return self.$__setobj__(obj)
    }, 1);
    
    $def(self, '$method_missing', function $$method_missing(m, $a) {
      var block = $$method_missing.$$p || nil, $post_args, args, self = this, target = nil;

      delete $$method_missing.$$p;
      
      ;
      
      $post_args = Opal.slice.call(arguments, 1);
      
      args = $post_args;;
      target = self.$__getobj__();
      if ($truthy(target['$respond_to?'](m))) {
        return $send(target, '__send__', [m].concat($to_a(args)), block.$to_proc())
      } else {
        return $send2(self, $find_super(self, 'method_missing', $$method_missing, false, true), 'method_missing', [m].concat($to_a(args)), block.$to_proc())
      };
    }, -2);
    return $def(self, '$respond_to_missing?', function $Delegator_respond_to_missing$ques$1(m, include_private) {
      var self = this;

      return self.$__getobj__()['$respond_to?'](m, include_private)
    }, 2);
  })($nesting[0], $$('BasicObject'));
  (function($base, $super) {
    var self = $klass($base, $super, 'SimpleDelegator');

    
    
    
    $def(self, '$__getobj__', $return_ivar("delegate_sd_obj"), 0);
    return $def(self, '$__setobj__', $assign_ivar("delegate_sd_obj"), 0);
  })($nesting[0], $$('Delegator'));
  return $def(self, '$DelegateClass', function $$DelegateClass(superklass) {
    
    return $$('SimpleDelegator')
  }, 1);
};
