/* Generated by Opal 1.3.0.dev */
Opal.modules["template"] = function(Opal) {
  function $rb_minus(lhs, rhs) {
    return (typeof(lhs) === 'number' && typeof(rhs) === 'number') ? lhs - rhs : lhs['$-'](rhs);
  }
  var self = Opal.top, $nesting = [], nil = Opal.nil, $$$ = Opal.$$$, $$ = Opal.$$, $klass = Opal.klass, $hash2 = Opal.hash2, $truthy = Opal.truthy, $send = Opal.send, $alias = Opal.alias;

  Opal.add_stubs(['$[]', '$[]=', '$-', '$keys', '$attr_reader', '$instance_exec', '$new', '$to_proc', '$<<', '$join']);
  return (function($base, $super, $parent_nesting) {
    var self = $klass($base, $super, 'Template');

    var $nesting = [self].concat($parent_nesting), $Template_$$$1, $Template_$$$eq$2, $Template_paths$3, $Template_initialize$4, $Template_inspect$5, $Template_render$6;

    self.$$prototype.name = self.$$prototype.body = nil;
    
    self._cache = $hash2([], {});
    Opal.defs(self, '$[]', $Template_$$$1 = function(name) {
      var self = this, $ret_or_1 = nil;
      if (self._cache == null) self._cache = nil;

      if ($truthy(($ret_or_1 = self._cache['$[]'](name)))) {
        return $ret_or_1
      } else {
        return self._cache['$[]']("" + "templates/" + (name))
      }
    }, $Template_$$$1.$$arity = 1);
    Opal.defs(self, '$[]=', $Template_$$$eq$2 = function(name, instance) {
      var self = this, $writer = nil;
      if (self._cache == null) self._cache = nil;

      
      $writer = [name, instance];
      $send(self._cache, '[]=', Opal.to_a($writer));
      return $writer[$rb_minus($writer["length"], 1)];
    }, $Template_$$$eq$2.$$arity = 2);
    Opal.defs(self, '$paths', $Template_paths$3 = function $$paths() {
      var self = this;
      if (self._cache == null) self._cache = nil;

      return self._cache.$keys()
    }, $Template_paths$3.$$arity = 0);
    self.$attr_reader("body");
    
    Opal.def(self, '$initialize', $Template_initialize$4 = function $$initialize(name) {
      var $iter = $Template_initialize$4.$$p, body = $iter || nil, $a, self = this, $writer = nil;

      if ($iter) $Template_initialize$4.$$p = null;
      
      
      if ($iter) $Template_initialize$4.$$p = null;;
      $a = [name, body], (self.name = $a[0]), (self.body = $a[1]), $a;
      
      $writer = [name, self];
      $send($$($nesting, 'Template'), '[]=', Opal.to_a($writer));
      return $writer[$rb_minus($writer["length"], 1)];;
    }, $Template_initialize$4.$$arity = 1);
    
    Opal.def(self, '$inspect', $Template_inspect$5 = function $$inspect() {
      var self = this;

      return "" + "#<Template: '" + (self.name) + "'>"
    }, $Template_inspect$5.$$arity = 0);
    
    Opal.def(self, '$render', $Template_render$6 = function $$render(ctx) {
      var self = this;

      
      
      if (ctx == null) {
        ctx = self;
      };
      return $send(ctx, 'instance_exec', [$$($nesting, 'OutputBuffer').$new()], self.body.$to_proc());
    }, $Template_render$6.$$arity = -1);
    return (function($base, $super, $parent_nesting) {
      var self = $klass($base, $super, 'OutputBuffer');

      var $nesting = [self].concat($parent_nesting), $OutputBuffer_initialize$7, $OutputBuffer_append$8, $OutputBuffer_join$9;

      self.$$prototype.buffer = nil;
      
      
      Opal.def(self, '$initialize', $OutputBuffer_initialize$7 = function $$initialize() {
        var self = this;

        return (self.buffer = [])
      }, $OutputBuffer_initialize$7.$$arity = 0);
      
      Opal.def(self, '$append', $OutputBuffer_append$8 = function $$append(str) {
        var self = this;

        return self.buffer['$<<'](str)
      }, $OutputBuffer_append$8.$$arity = 1);
      $alias(self, "append=", "append");
      return (Opal.def(self, '$join', $OutputBuffer_join$9 = function $$join() {
        var self = this;

        return self.buffer.$join()
      }, $OutputBuffer_join$9.$$arity = 0), nil) && 'join';
    })($nesting[0], null, $nesting);
  })($nesting[0], null, $nesting)
};

/* Generated by Opal 1.3.0.dev */
Opal.modules["erb"] = function(Opal) {
  var self = Opal.top, $nesting = [], nil = Opal.nil, $$$ = Opal.$$$, $$ = Opal.$$, $klass = Opal.klass, $module = Opal.module, $alias = Opal.alias;

  Opal.add_stubs(['$require', '$module_function']);
  
  self.$require("template");
  return (function($base, $super, $parent_nesting) {
    var self = $klass($base, $super, 'ERB');

    var $nesting = [self].concat($parent_nesting);

    return (function($base, $parent_nesting) {
      var self = $module($base, 'Util');

      var $nesting = [self].concat($parent_nesting), $Util_html_escape$1;

      
      var escapes = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'};;
      var escape_regexp = /[&<>"']/g;;
      
      Opal.def(self, '$html_escape', $Util_html_escape$1 = function $$html_escape(str) {
        var self = this;

        return ("" + str).replace(escape_regexp, function (m) { return escapes[m] });
      }, $Util_html_escape$1.$$arity = 1);
      $alias(self, "h", "html_escape");
      self.$module_function("h");
      return self.$module_function("html_escape");
    })($nesting[0], $nesting)
  })($nesting[0], null, $nesting);
};
