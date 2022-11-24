Opal.modules["observer"] = function(Opal) {/* Generated by Opal 1.6.0 */
  var $module = Opal.module, $truthy = Opal.truthy, $hash2 = Opal.hash2, $send = Opal.send, $def = Opal.def, $slice = Opal.slice, $to_a = Opal.to_a, $nesting = [], nil = Opal.nil;

  Opal.add_stubs('respond_to?,raise,new,to_s,[]=,delete,clear,size,each,send');
  return (function($base, $parent_nesting) {
    var self = $module($base, 'Observable');

    var $nesting = [self].concat($parent_nesting), $$ = Opal.$r($nesting);

    
    
    $def(self, '$add_observer', function $$add_observer(observer, func) {
      var $a, $b, self = this;
      if (self.observer_peers == null) self.observer_peers = nil;

      
      if (func == null) func = "update";
      if (!$truthy((($a = self['observer_peers'], $a != null && $a !== nil) ? 'instance-variable' : nil))) {
        self.observer_peers = $hash2([], {})
      };
      if (!$truthy(observer['$respond_to?'](func))) {
        self.$raise($$('NoMethodError').$new("observer does not respond to `" + (func.$to_s()) + "'", func.$to_s()))
      };
      return ($b = [observer, func], $send(self.observer_peers, '[]=', $b), $b[$b.length - 1]);
    }, -2);
    
    $def(self, '$delete_observer', function $$delete_observer(observer) {
      var $a, self = this;
      if (self.observer_peers == null) self.observer_peers = nil;

      if ($truthy((($a = self['observer_peers'], $a != null && $a !== nil) ? 'instance-variable' : nil))) {
        return self.observer_peers.$delete(observer)
      } else {
        return nil
      }
    }, 1);
    
    $def(self, '$delete_observers', function $$delete_observers() {
      var $a, self = this;
      if (self.observer_peers == null) self.observer_peers = nil;

      if ($truthy((($a = self['observer_peers'], $a != null && $a !== nil) ? 'instance-variable' : nil))) {
        return self.observer_peers.$clear()
      } else {
        return nil
      }
    }, 0);
    
    $def(self, '$count_observers', function $$count_observers() {
      var $a, self = this;
      if (self.observer_peers == null) self.observer_peers = nil;

      if ($truthy((($a = self['observer_peers'], $a != null && $a !== nil) ? 'instance-variable' : nil))) {
        return self.observer_peers.$size()
      } else {
        return 0
      }
    }, 0);
    
    $def(self, '$changed', function $$changed(state) {
      var self = this;

      
      if (state == null) state = true;
      return (self.observer_state = state);
    }, -1);
    
    $def(self, '$changed?', function $Observable_changed$ques$1() {
      var $a, self = this;
      if (self.observer_state == null) self.observer_state = nil;

      if (($truthy((($a = self['observer_state'], $a != null && $a !== nil) ? 'instance-variable' : nil)) && ($truthy(self.observer_state)))) {
        return true
      } else {
        return false
      }
    }, 0);
    return $def(self, '$notify_observers', function $$notify_observers($a) {
      var $post_args, arg, $b, $c, self = this;
      if (self.observer_state == null) self.observer_state = nil;
      if (self.observer_peers == null) self.observer_peers = nil;

      
      $post_args = $slice.call(arguments);
      arg = $post_args;
      if (($truthy((($b = self['observer_state'], $b != null && $b !== nil) ? 'instance-variable' : nil)) && ($truthy(self.observer_state)))) {
        
        if ($truthy((($c = self['observer_peers'], $c != null && $c !== nil) ? 'instance-variable' : nil))) {
          $send(self.observer_peers, 'each', [], function $$2(k, v){
            
            if (k == null) k = nil;
            if (v == null) v = nil;
            return $send(k, 'send', [v].concat($to_a(arg)));}, 2)
        };
        return (self.observer_state = false);
      } else {
        return nil
      };
    }, -1);
  })($nesting[0], $nesting)
};
