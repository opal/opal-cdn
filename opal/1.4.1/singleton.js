Opal.modules["singleton"] = function(Opal) {/* Generated by Opal 1.4.1 */
  var $nesting = [], nil = Opal.nil, $module = Opal.module, $def = Opal.def, $send2 = Opal.send2, $find_super = Opal.find_super, $send = Opal.send, $truthy = Opal.truthy, $defs = Opal.defs;

  Opal.add_stubs('raise,class,__init__,instance_eval,new,extend');
  return (function($base, $parent_nesting) {
    var self = $module($base, 'Singleton');

    var $nesting = [self].concat($parent_nesting), $$ = Opal.$r($nesting);

    
    
    $def(self, '$clone', function $$clone() {
      var self = this;

      return self.$raise($$('TypeError'), "can't clone instance of singleton " + (self.$class()))
    }, 0);
    
    $def(self, '$dup', function $$dup() {
      var self = this;

      return self.$raise($$('TypeError'), "can't dup instance of singleton " + (self.$class()))
    }, 0);
    (function($base, $parent_nesting) {
      var self = $module($base, 'SingletonClassMethods');

      var $nesting = [self].concat($parent_nesting), $$ = Opal.$r($nesting);

      
      
      $def(self, '$clone', function $$clone() {
        var $yield = $$clone.$$p || nil, self = this;

        delete $$clone.$$p;
        return $$('Singleton').$__init__($send2(self, $find_super(self, 'clone', $$clone, false, true), 'clone', [], $yield))
      }, 0);
      return $def(self, '$inherited', function $$inherited(sub_klass) {
        var $yield = $$inherited.$$p || nil, self = this;

        delete $$inherited.$$p;
        
        $send2(self, $find_super(self, 'inherited', $$inherited, false, true), 'inherited', [sub_klass], $yield);
        return $$('Singleton').$__init__(sub_klass);
      }, 1);
    })($nesting[0], $nesting);
    return (function(self, $parent_nesting) {
      var $nesting = [self].concat($parent_nesting), $$ = Opal.$r($nesting);

      
      
      $def(self, '$__init__', function $$__init__(klass) {
        var self = this;

        
        $send(klass, 'instance_eval', [], function $$1(){var self = $$1.$$s == null ? this : $$1.$$s;

          return (self.singleton__instance__ = nil)}, {$$arity: 0, $$s: self});
        $defs(klass, '$instance', function $$instance() {
          var self = this;
          if (self.singleton__instance__ == null) self.singleton__instance__ = nil;

          
          if ($truthy(self.singleton__instance__)) {
            return self.singleton__instance__
          };
          return (self.singleton__instance__ = self.$new());
        }, 0);
        return klass;
      }, 1);
      return $def(self, '$included', function $$included(klass) {
        var $yield = $$included.$$p || nil, self = this;

        delete $$included.$$p;
        
        $send2(self, $find_super(self, 'included', $$included, false, true), 'included', [klass], $yield);
        klass.$extend($$('SingletonClassMethods'));
        return $$('Singleton').$__init__(klass);
      }, 1);
    })(Opal.get_singleton_class($$('Singleton')), $nesting);
  })($nesting[0], $nesting)
};
