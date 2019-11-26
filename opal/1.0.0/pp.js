/* Generated by Opal 1.0.0 */
Opal.modules["pp"] = function(Opal) {
  function $rb_le(lhs, rhs) {
    return (typeof(lhs) === 'number' && typeof(rhs) === 'number') ? lhs <= rhs : lhs['$<='](rhs);
  }
  function $rb_plus(lhs, rhs) {
    return (typeof(lhs) === 'number' && typeof(rhs) === 'number') ? lhs + rhs : lhs['$+'](rhs);
  }
  var self = Opal.top, $nesting = [], nil = Opal.nil, $$$ = Opal.const_get_qualified, $$ = Opal.const_get_relative, $breaker = Opal.breaker, $slice = Opal.slice, $module = Opal.module, $send = Opal.send, $truthy = Opal.truthy, $klass = Opal.klass, $gvars = Opal.gvars;

  Opal.add_stubs(['$inspect', '$each', '$pp', '$<=', '$size', '$first', '$module_function', '$p', '$args', '$===', '$+', '$<<']);
  
  (function($base, $parent_nesting) {
    var self = $module($base, 'Kernel');

    var $nesting = [self].concat($parent_nesting), $Kernel_pretty_inspect$1, $Kernel_pp$2;

    
    
    Opal.def(self, '$pretty_inspect', $Kernel_pretty_inspect$1 = function $$pretty_inspect() {
      var self = this;

      return self.$inspect()
    }, $Kernel_pretty_inspect$1.$$arity = 0);
    
    Opal.def(self, '$pp', $Kernel_pp$2 = function $$pp($a) {
      var $post_args, objs, $$3, self = this;

      
      
      $post_args = Opal.slice.call(arguments, 0, arguments.length);
      
      objs = $post_args;;
      $send(objs, 'each', [], ($$3 = function(obj){var self = $$3.$$s || this;

      
        
        if (obj == null) {
          obj = nil;
        };
        return $$($nesting, 'PP').$pp(obj);}, $$3.$$s = self, $$3.$$arity = 1, $$3));
      if ($truthy($rb_le(objs.$size(), 1))) {
        return objs.$first()
      } else {
        return objs
      };
    }, $Kernel_pp$2.$$arity = -1);
    self.$module_function("pp");
  })($nesting[0], $nesting);
  return (function($base, $super, $parent_nesting) {
    var self = $klass($base, $super, 'PP');

    var $nesting = [self].concat($parent_nesting);

    return (function(self, $parent_nesting) {
      var $nesting = [self].concat($parent_nesting), $pp$4, $pp$5;

      
      if ($truthy((typeof(console) === "undefined" || typeof(console.log) === "undefined"))) {
        
        Opal.def(self, '$pp', $pp$4 = function $$pp(obj, out, width) {
          var self = this;
          if ($gvars.stdout == null) $gvars.stdout = nil;

          
          
          if (out == null) {
            out = $gvars.stdout;
          };
          
          if (width == null) {
            width = 79;
          };
          return $send(self, 'p', Opal.to_a(self.$args()));
        }, $pp$4.$$arity = -2)
      } else {
        
        Opal.def(self, '$pp', $pp$5 = function $$pp(obj, out, width) {
          var self = this;
          if ($gvars.stdout == null) $gvars.stdout = nil;

          
          
          if (out == null) {
            out = $gvars.stdout;
          };
          
          if (width == null) {
            width = 79;
          };
          if ($truthy($$($nesting, 'String')['$==='](out))) {
            return $rb_plus($rb_plus(out, obj.$inspect()), "\n")
          } else {
            return out['$<<']($rb_plus(obj.$inspect(), "\n"))
          };
        }, $pp$5.$$arity = -2)
      };
      return Opal.alias(self, "singleline_pp", "pp");
    })(Opal.get_singleton_class(self), $nesting)
  })($nesting[0], null, $nesting);
};