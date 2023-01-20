Opal.modules["template"] = function(Opal) {/* Generated by Opal 1.7.2 */
  var $klass = Opal.klass, $hash2 = Opal.hash2, $truthy = Opal.truthy, $defs = Opal.defs, $send = Opal.send, $def = Opal.def, $alias = Opal.alias, $nesting = [], nil = Opal.nil;

  Opal.add_stubs('[],[]=,keys,attr_reader,instance_exec,new,to_proc,<<,join,append');
  return (function($base, $super, $parent_nesting) {
    var self = $klass($base, $super, 'Template');

    var $nesting = [self].concat($parent_nesting), $$ = Opal.$r($nesting), $proto = self.$$prototype;

    $proto.name = $proto.body = nil;
    
    self._cache = $hash2([], {});
    $defs(self, '$[]', function $Template_$$$1(name) {
      var self = this, $ret_or_1 = nil;
      if (self._cache == null) self._cache = nil;

      if ($truthy(($ret_or_1 = self._cache['$[]'](name)))) {
        return $ret_or_1
      } else {
        return self._cache['$[]']("templates/" + (name))
      }
    });
    $defs(self, '$[]=', function $Template_$$$eq$2(name, instance) {
      var $a, self = this;
      if (self._cache == null) self._cache = nil;

      return ($a = [name, instance], $send(self._cache, '[]=', $a), $a[$a.length - 1])
    });
    $defs(self, '$paths', function $$paths() {
      var self = this;
      if (self._cache == null) self._cache = nil;

      return self._cache.$keys()
    });
    self.$attr_reader("body");
    
    $def(self, '$initialize', function $$initialize(name) {
      var body = $$initialize.$$p || nil, $a, self = this;

      $$initialize.$$p = null;
      
      ;
      $a = [name, body], (self.name = $a[0]), (self.body = $a[1]), $a;
      return ($a = [name, self], $send($$('Template'), '[]=', $a), $a[$a.length - 1]);
    });
    
    $def(self, '$inspect', function $$inspect() {
      var self = this;

      return "#<Template: '" + (self.name) + "'>"
    });
    
    $def(self, '$render', function $$render(ctx) {
      var self = this;

      
      if (ctx == null) ctx = self;
      return $send(ctx, 'instance_exec', [$$('OutputBuffer').$new()], self.body.$to_proc());
    }, -1);
    return (function($base, $super) {
      var self = $klass($base, $super, 'OutputBuffer');

      var $proto = self.$$prototype;

      $proto.buffer = nil;
      
      
      $def(self, '$initialize', function $$initialize() {
        var self = this;

        return (self.buffer = [])
      });
      
      $def(self, '$append', function $$append(str) {
        var self = this;

        return self.buffer['$<<'](str)
      });
      
      $def(self, '$join', function $$join() {
        var self = this;

        return self.buffer.$join()
      });
      return $alias(self, "append=", "append");
    })($nesting[0], null);
  })($nesting[0], null, $nesting)
};
