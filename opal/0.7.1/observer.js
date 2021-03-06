/* Generated by Opal 0.7.1 */
(function(Opal) {
  Opal.dynamic_require_severity = "warning";
  var self = Opal.top, $scope = Opal, nil = Opal.nil, $breaker = Opal.breaker, $slice = Opal.slice, $module = Opal.module, $hash2 = Opal.hash2;

  Opal.add_stubs(['$respond_to?', '$raise', '$to_s', '$[]=', '$delete', '$clear', '$size', '$each', '$send']);
  return (function($base) {
    var self = $module($base, 'Observable');

    var def = self.$$proto, $scope = self.$$scope;

    Opal.defn(self, '$add_observer', function(observer, func) {
      var $a, $b, self = this;
      if (self.observer_peers == null) self.observer_peers = nil;

      if (func == null) {
        func = "update"
      }
      if ((($a = (($b = self['observer_peers'], $b != null && $b !== nil) ? 'instance-variable' : nil)) !== nil && (!$a.$$is_boolean || $a == true))) {
        } else {
        self.observer_peers = $hash2([], {})
      };
      if ((($a = observer['$respond_to?'](func)) !== nil && (!$a.$$is_boolean || $a == true))) {
        } else {
        self.$raise($scope.get('NoMethodError'), "observer does not respond to `" + (func.$to_s()) + "'")
      };
      return self.observer_peers['$[]='](observer, func);
    });

    Opal.defn(self, '$delete_observer', function(observer) {
      var $a, $b, self = this;
      if (self.observer_peers == null) self.observer_peers = nil;

      if ((($a = (($b = self['observer_peers'], $b != null && $b !== nil) ? 'instance-variable' : nil)) !== nil && (!$a.$$is_boolean || $a == true))) {
        return self.observer_peers.$delete(observer)
        } else {
        return nil
      };
    });

    Opal.defn(self, '$delete_observers', function() {
      var $a, $b, self = this;
      if (self.observer_peers == null) self.observer_peers = nil;

      if ((($a = (($b = self['observer_peers'], $b != null && $b !== nil) ? 'instance-variable' : nil)) !== nil && (!$a.$$is_boolean || $a == true))) {
        return self.observer_peers.$clear()
        } else {
        return nil
      };
    });

    Opal.defn(self, '$count_observers', function() {
      var $a, $b, self = this;
      if (self.observer_peers == null) self.observer_peers = nil;

      if ((($a = (($b = self['observer_peers'], $b != null && $b !== nil) ? 'instance-variable' : nil)) !== nil && (!$a.$$is_boolean || $a == true))) {
        return self.observer_peers.$size()
        } else {
        return 0
      };
    });

    Opal.defn(self, '$changed', function(state) {
      var self = this;

      if (state == null) {
        state = true
      }
      return self.observer_state = state;
    });

    Opal.defn(self, '$changed?', function() {
      var $a, $b, $c, self = this;
      if (self.observer_state == null) self.observer_state = nil;

      if ((($a = ($b = (($c = self['observer_state'], $c != null && $c !== nil) ? 'instance-variable' : nil), $b !== false && $b !== nil ?self.observer_state : $b)) !== nil && (!$a.$$is_boolean || $a == true))) {
        return true
        } else {
        return false
      };
    });

    Opal.defn(self, '$notify_observers', function(arg) {
      var $a, $b, $c, TMP_1, self = this;
      if (self.observer_state == null) self.observer_state = nil;
      if (self.observer_peers == null) self.observer_peers = nil;

      arg = $slice.call(arguments, 0);
      if ((($a = ($b = (($c = self['observer_state'], $c != null && $c !== nil) ? 'instance-variable' : nil), $b !== false && $b !== nil ?self.observer_state : $b)) !== nil && (!$a.$$is_boolean || $a == true))) {
        if ((($a = (($b = self['observer_peers'], $b != null && $b !== nil) ? 'instance-variable' : nil)) !== nil && (!$a.$$is_boolean || $a == true))) {
          ($a = ($b = self.observer_peers).$each, $a.$$p = (TMP_1 = function(k, v){var self = TMP_1.$$s || this, $a;
if (k == null) k = nil;if (v == null) v = nil;
          return ($a = k).$send.apply($a, [v].concat(arg))}, TMP_1.$$s = self, TMP_1), $a).call($b)};
        return self.observer_state = false;
        } else {
        return nil
      };
    });
  })(self)
})(Opal);

//# sourceMappingURL=observer.map
;
