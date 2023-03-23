Opal.modules["js"] = function(Opal) {/* Generated by Opal 1.7.3 */
  var $module = Opal.module, $def = Opal.def, $truthy = Opal.truthy, $slice = Opal.slice, $alias = Opal.alias, $nesting = [], nil = Opal.nil;

  Opal.add_stubs('insert,<<,global,call,extend');
  return (function($base) {
    var self = $module($base, 'JS');

    
    
    
    $def(self, '$delete', function $JS_delete$1(object, property) {
      
      return delete object[property]
    });
    
    $def(self, '$global', function $$global() {
      
      return Opal.global;
    });
    
    $def(self, '$in', function $JS_in$2(property, object) {
      
      return property in object
    });
    
    $def(self, '$instanceof', function $JS_instanceof$3(value, func) {
      
      return value instanceof func
    });
    if ($truthy(typeof Function.prototype.bind == 'function')) {
      
      $def(self, '$new', function $JS_new$4(func, $a) {
        var block = $JS_new$4.$$p || nil, $post_args, args;

        $JS_new$4.$$p = null;
        
        ;
        $post_args = $slice(arguments, 1);
        args = $post_args;
        args.$insert(0, this);
        if ($truthy(block)) {
          args['$<<'](block)
        };
        return new (func.bind.apply(func, args))();
      }, -2)
    } else {
      
      $def(self, '$new', function $JS_new$5(func, $a) {
        var block = $JS_new$5.$$p || nil, $post_args, args, f = nil;

        $JS_new$5.$$p = null;
        
        ;
        $post_args = $slice(arguments, 1);
        args = $post_args;
        if ($truthy(block)) {
          args['$<<'](block)
        };
        f = function(){return func.apply(this, args)};
        f["prototype"] = func["prototype"];
        return new f();;
      }, -2)
    };
    
    $def(self, '$typeof', function $JS_typeof$6(value) {
      
      return typeof value
    });
    
    $def(self, '$void', function $JS_void$7(expr) {
      
      return void expr
    });
    
    $def(self, '$call', function $$call(func, $a) {
      var block = $$call.$$p || nil, $post_args, args, self = this, g = nil;

      $$call.$$p = null;
      
      ;
      $post_args = $slice(arguments, 1);
      args = $post_args;
      g = self.$global();
      if ($truthy(block)) {
        args['$<<'](block)
      };
      return g[func].apply(g, args);
    }, -2);
    
    $def(self, '$[]', function $JS_$$$8(name) {
      
      return Opal.global[name]
    });
    $alias(self, "method_missing", "call");
    return self.$extend(self);
  })($nesting[0])
};
