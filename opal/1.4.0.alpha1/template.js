Opal.modules["template"] = function(Opal) {/* Generated by Opal 1.4.0.alpha1 */
  var $nesting = [], nil = Opal.nil, $klass = Opal.klass, $hash2 = Opal.hash2, $truthy = Opal.truthy, $defs = Opal.defs, $send = Opal.send, $to_a = Opal.to_a, $rb_minus = Opal.rb_minus, $def = Opal.def, $alias = Opal.alias;

  Opal.add_stubs('[],[]=,-,keys,attr_reader,instance_exec,new,to_proc,<<,join');
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
    }, 1);
    $defs(self, '$[]=', function $Template_$$$eq$2(name, instance) {
      var self = this, $writer = nil;
      if (self._cache == null) self._cache = nil;

      
      $writer = [name, instance];
      $send(self._cache, '[]=', $to_a($writer));
      return $writer[$rb_minus($writer["length"], 1)];
    }, 2);
    $defs(self, '$paths', function $$paths() {
      var self = this;
      if (self._cache == null) self._cache = nil;

      return self._cache.$keys()
    }, 0);
    self.$attr_reader("body");
    
    $def(self, '$initialize', function $$initialize(name) {
      var body = $$initialize.$$p || nil, $a, self = this, $writer = nil;

      delete $$initialize.$$p;
      
      ;
      $a = [name, body], (self.name = $a[0]), (self.body = $a[1]), $a;
      
      $writer = [name, self];
      $send($$('Template'), '[]=', $to_a($writer));
      return $writer[$rb_minus($writer["length"], 1)];;
    }, 1);
    
    $def(self, '$inspect', function $$inspect() {
      var self = this;

      return "#<Template: '" + (self.name) + "'>"
    }, 0);
    
    $def(self, '$render', function $$render(ctx) {
      var self = this;

      
      
      if (ctx == null) ctx = self;;
      return $send(ctx, 'instance_exec', [$$('OutputBuffer').$new()], self.body.$to_proc());
    }, -1);
    return (function($base, $super) {
      var self = $klass($base, $super, 'OutputBuffer');

      var $proto = self.$$prototype;

      $proto.buffer = nil;
      
      
      $def(self, '$initialize', function $$initialize() {
        var self = this;

        return (self.buffer = [])
      }, 0);
      
      $def(self, '$append', function $$append(str) {
        var self = this;

        return self.buffer['$<<'](str)
      }, 1);
      
      $def(self, '$join', function $$join() {
        var self = this;

        return self.buffer.$join()
      }, 0);
      return $alias(self, "append=", "append");
    })($nesting[0], null);
  })($nesting[0], null, $nesting)
};
