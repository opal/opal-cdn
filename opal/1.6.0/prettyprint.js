Opal.modules["prettyprint"] = function(Opal) {/* Generated by Opal 1.6.0 */
  var $klass = Opal.klass, $send = Opal.send, $rb_times = Opal.rb_times, $defs = Opal.defs, $truthy = Opal.truthy, $def = Opal.def, $rb_lt = Opal.rb_lt, $rb_plus = Opal.rb_plus, $rb_minus = Opal.rb_minus, $eqeqeq = Opal.eqeqeq, $assign_ivar_val = Opal.assign_ivar_val, $return_ivar = Opal.return_ivar, $slice = Opal.slice, $thrower = Opal.thrower, $return_val = Opal.return_val, $nesting = [], nil = Opal.nil;

  Opal.add_stubs('dup,lambda,*,new,to_proc,flush,attr_reader,last,<,+,deq,empty?,breakables,shift,output,-,width,!,===,first,length,<<,add,break_outmost_groups,group,breakable,break?,call,text,group_sub,nest,depth,push,enq,pop,delete,each,clear,indent,current_group,newline,genspace,group_queue,[],downto,slice!,break,[]=');
  return (function($base, $super, $parent_nesting) {
    var self = $klass($base, $super, 'PrettyPrint');

    var $nesting = [self].concat($parent_nesting), $$ = Opal.$r($nesting), $proto = self.$$prototype;

    $proto.group_stack = $proto.maxwidth = $proto.output_width = $proto.buffer_width = $proto.group_queue = $proto.buffer = $proto.output = $proto.newline = $proto.genspace = $proto.indent = nil;
    
    $defs($$('PrettyPrint'), '$format', function $$format(output, maxwidth, newline, genspace) {
      var $yield = $$format.$$p || nil, self = this, q = nil;

      $$format.$$p = null;
      
      if (output == null) output = "".$dup();
      if (maxwidth == null) maxwidth = 79;
      if (newline == null) newline = "\n";
      if (genspace == null) genspace = $send(self, 'lambda', [], function $$1(n){
        
        if (n == null) n = nil;
        return $rb_times(" ", n);}, 1);
      q = $send($$('PrettyPrint'), 'new', [output, maxwidth, newline], genspace.$to_proc());
      Opal.yield1($yield, q);
      q.$flush();
      return output;
    }, -1);
    $defs($$('PrettyPrint'), '$singleline_format', function $$singleline_format(output, maxwidth, newline, genspace) {
      var $yield = $$singleline_format.$$p || nil, q = nil;

      $$singleline_format.$$p = null;
      
      if (output == null) output = "".$dup();
      if (maxwidth == null) maxwidth = nil;
      if (newline == null) newline = nil;
      if (genspace == null) genspace = nil;
      q = $$('SingleLine').$new(output);
      Opal.yield1($yield, q);
      return output;
    }, -1);
    
    $def(self, '$initialize', function $$initialize(output, maxwidth, newline) {
      var genspace = $$initialize.$$p || nil, self = this, $ret_or_1 = nil, root_group = nil;

      $$initialize.$$p = null;
      
      ;
      if (output == null) output = "".$dup();
      if (maxwidth == null) maxwidth = 79;
      if (newline == null) newline = "\n";
      self.output = output;
      self.maxwidth = maxwidth;
      self.newline = newline;
      self.genspace = ($truthy(($ret_or_1 = genspace)) ? ($ret_or_1) : ($send(self, 'lambda', [], function $$2(n){
        
        if (n == null) n = nil;
        return $rb_times(" ", n);}, 1)));
      self.output_width = 0;
      self.buffer_width = 0;
      self.buffer = [];
      root_group = $$('Group').$new(0);
      self.group_stack = [root_group];
      self.group_queue = $$('GroupQueue').$new(root_group);
      return (self.indent = 0);
    }, -1);
    self.$attr_reader("output");
    self.$attr_reader("maxwidth");
    self.$attr_reader("newline");
    self.$attr_reader("genspace");
    self.$attr_reader("indent");
    self.$attr_reader("group_queue");
    
    $def(self, '$current_group', function $$current_group() {
      var self = this;

      return self.group_stack.$last()
    }, 0);
    
    $def(self, '$break_outmost_groups', function $$break_outmost_groups() {
      var self = this, group = nil, data = nil, $ret_or_1 = nil, text = nil;

      while ($truthy($rb_lt(self.maxwidth, $rb_plus(self.output_width, self.buffer_width)))) {
      
        if (!$truthy((group = self.group_queue.$deq()))) {
          return nil
        };
        while (!($truthy(group.$breakables()['$empty?']()))) {
        
          data = self.buffer.$shift();
          self.output_width = data.$output(self.output, self.output_width);
          self.buffer_width = $rb_minus(self.buffer_width, data.$width());
        };
        while ($truthy(($truthy(($ret_or_1 = self.buffer['$empty?']()['$!']())) ? ($$('Text')['$==='](self.buffer.$first())) : ($ret_or_1)))) {
        
          text = self.buffer.$shift();
          self.output_width = text.$output(self.output, self.output_width);
          self.buffer_width = $rb_minus(self.buffer_width, text.$width());
        };
      }
    }, 0);
    
    $def(self, '$text', function $$text(obj, width) {
      var self = this, text = nil;

      
      if (width == null) width = obj.$length();
      if ($truthy(self.buffer['$empty?']())) {
        
        self.output['$<<'](obj);
        return (self.output_width = $rb_plus(self.output_width, width));
      } else {
        
        text = self.buffer.$last();
        if (!$eqeqeq($$('Text'), text)) {
          
          text = $$('Text').$new();
          self.buffer['$<<'](text);
        };
        text.$add(obj, width);
        self.buffer_width = $rb_plus(self.buffer_width, width);
        return self.$break_outmost_groups();
      };
    }, -2);
    
    $def(self, '$fill_breakable', function $$fill_breakable(sep, width) {
      var self = this;

      
      if (sep == null) sep = " ";
      if (width == null) width = sep.$length();
      return $send(self, 'group', [], function $$3(){var self = $$3.$$s == null ? this : $$3.$$s;

        return self.$breakable(sep, width)}, {$$arity: 0, $$s: self});
    }, -1);
    
    $def(self, '$breakable', function $$breakable(sep, width) {
      var self = this, group = nil;

      
      if (sep == null) sep = " ";
      if (width == null) width = sep.$length();
      group = self.group_stack.$last();
      if ($truthy(group['$break?']())) {
        
        self.$flush();
        self.output['$<<'](self.newline);
        self.output['$<<'](self.genspace.$call(self.indent));
        self.output_width = self.indent;
        return (self.buffer_width = 0);
      } else {
        
        self.buffer['$<<']($$('Breakable').$new(sep, width, self));
        self.buffer_width = $rb_plus(self.buffer_width, width);
        return self.$break_outmost_groups();
      };
    }, -1);
    
    $def(self, '$group', function $$group(indent, open_obj, close_obj, open_width, close_width) {
      var $yield = $$group.$$p || nil, self = this;

      $$group.$$p = null;
      
      if (indent == null) indent = 0;
      if (open_obj == null) open_obj = "";
      if (close_obj == null) close_obj = "";
      if (open_width == null) open_width = open_obj.$length();
      if (close_width == null) close_width = close_obj.$length();
      self.$text(open_obj, open_width);
      $send(self, 'group_sub', [], function $$4(){var self = $$4.$$s == null ? this : $$4.$$s;

        return $send(self, 'nest', [indent], function $$5(){
          return Opal.yieldX($yield, []);}, 0)}, {$$arity: 0, $$s: self});
      return self.$text(close_obj, close_width);
    }, -1);
    
    $def(self, '$group_sub', function $$group_sub() {
      var $yield = $$group_sub.$$p || nil, self = this, group = nil;

      $$group_sub.$$p = null;
      
      group = $$('Group').$new($rb_plus(self.group_stack.$last().$depth(), 1));
      self.group_stack.$push(group);
      self.group_queue.$enq(group);
      
      return (function() { try {
      return Opal.yieldX($yield, []);
      } finally {
        (self.group_stack.$pop(), ($truthy(group.$breakables()['$empty?']()) ? (self.group_queue.$delete(group)) : nil))
      }; })();;
    }, 0);
    
    $def(self, '$nest', function $$nest(indent) {
      var $yield = $$nest.$$p || nil, self = this;

      $$nest.$$p = null;
      
      self.indent = $rb_plus(self.indent, indent);
      
      return (function() { try {
      return Opal.yieldX($yield, []);
      } finally {
        (self.indent = $rb_minus(self.indent, indent))
      }; })();;
    }, 1);
    
    $def(self, '$flush', function $$flush() {
      var self = this;

      
      $send(self.buffer, 'each', [], function $$6(data){var self = $$6.$$s == null ? this : $$6.$$s;
        if (self.output == null) self.output = nil;
        if (self.output_width == null) self.output_width = nil;

        
        if (data == null) data = nil;
        return (self.output_width = data.$output(self.output, self.output_width));}, {$$arity: 1, $$s: self});
      self.buffer.$clear();
      return (self.buffer_width = 0);
    }, 0);
    (function($base, $super) {
      var self = $klass($base, $super, 'Text');

      var $proto = self.$$prototype;

      $proto.objs = $proto.width = nil;
      
      
      $def(self, '$initialize', function $$initialize() {
        var self = this;

        
        self.objs = [];
        return (self.width = 0);
      }, 0);
      self.$attr_reader("width");
      
      $def(self, '$output', function $$output(out, output_width) {
        var self = this;

        
        $send(self.objs, 'each', [], function $$7(obj){
          
          if (obj == null) obj = nil;
          return out['$<<'](obj);}, 1);
        return $rb_plus(output_width, self.width);
      }, 2);
      return $def(self, '$add', function $$add(obj, width) {
        var self = this;

        
        self.objs['$<<'](obj);
        return (self.width = $rb_plus(self.width, width));
      }, 2);
    })($nesting[0], null);
    (function($base, $super) {
      var self = $klass($base, $super, 'Breakable');

      var $proto = self.$$prototype;

      $proto.group = $proto.pp = $proto.indent = $proto.obj = $proto.width = nil;
      
      
      $def(self, '$initialize', function $$initialize(sep, width, q) {
        var self = this;

        
        self.obj = sep;
        self.width = width;
        self.pp = q;
        self.indent = q.$indent();
        self.group = q.$current_group();
        return self.group.$breakables().$push(self);
      }, 3);
      self.$attr_reader("obj");
      self.$attr_reader("width");
      self.$attr_reader("indent");
      return $def(self, '$output', function $$output(out, output_width) {
        var self = this;

        
        self.group.$breakables().$shift();
        if ($truthy(self.group['$break?']())) {
          
          out['$<<'](self.pp.$newline());
          out['$<<'](self.pp.$genspace().$call(self.indent));
          return self.indent;
        } else {
          
          if ($truthy(self.group.$breakables()['$empty?']())) {
            self.pp.$group_queue().$delete(self.group)
          };
          out['$<<'](self.obj);
          return $rb_plus(output_width, self.width);
        };
      }, 2);
    })($nesting[0], null);
    (function($base, $super) {
      var self = $klass($base, $super, 'Group');

      
      
      
      $def(self, '$initialize', function $$initialize(depth) {
        var self = this;

        
        self.depth = depth;
        self.breakables = [];
        return (self["break"] = false);
      }, 1);
      self.$attr_reader("depth");
      self.$attr_reader("breakables");
      
      $def(self, '$break', $assign_ivar_val("break", true), 0);
      
      $def(self, '$break?', $return_ivar("break"), 0);
      return $def(self, '$first?', function $Group_first$ques$8() {
        var $a, self = this;

        if ($truthy((($a = self['first'], $a != null && $a !== nil) ? 'instance-variable' : nil))) {
          return false
        } else {
          
          self.first = false;
          return true;
        }
      }, 0);
    })($nesting[0], null);
    (function($base, $super) {
      var self = $klass($base, $super, 'GroupQueue');

      var $proto = self.$$prototype;

      $proto.queue = nil;
      
      
      $def(self, '$initialize', function $$initialize($a) {
        var $post_args, groups, self = this;

        
        $post_args = $slice.call(arguments);
        groups = $post_args;
        self.queue = [];
        return $send(groups, 'each', [], function $$9(g){var self = $$9.$$s == null ? this : $$9.$$s;

          
          if (g == null) g = nil;
          return self.$enq(g);}, {$$arity: 1, $$s: self});
      }, -1);
      
      $def(self, '$enq', function $$enq(group) {
        var self = this, depth = nil;

        
        depth = group.$depth();
        while (!($truthy($rb_lt(depth, self.queue.$length())))) {
        self.queue['$<<']([])
        };
        return self.queue['$[]'](depth)['$<<'](group);
      }, 1);
      
      $def(self, '$deq', function $$deq() {try { var $t_return = $thrower('return'); 
        var self = this;

        
        $send(self.queue, 'each', [], function $$10(gs){
          
          if (gs == null) gs = nil;
          $send($rb_minus(gs.$length(), 1), 'downto', [0], function $$11(i){var group = nil;

            
            if (i == null) i = nil;
            if ($truthy(gs['$[]'](i).$breakables()['$empty?']())) {
              return nil
            } else {
              
              group = gs['$slice!'](i, 1).$first();
              group.$break();
              $t_return.$throw(group);
            };}, {$$arity: 1, $$ret: $t_return});
          $send(gs, 'each', [], function $$12(group){
            
            if (group == null) group = nil;
            return group.$break();}, 1);
          return gs.$clear();}, 1);
        return nil;} catch($e) {
          if ($e === $t_return) return $e.$v;
          throw $e;
        }
      }, 0);
      return $def(self, '$delete', function $GroupQueue_delete$13(group) {
        var self = this;

        return self.queue['$[]'](group.$depth()).$delete(group)
      }, 1);
    })($nesting[0], null);
    return (function($base, $super) {
      var self = $klass($base, $super, 'SingleLine');

      var $proto = self.$$prototype;

      $proto.output = $proto.first = nil;
      
      
      $def(self, '$initialize', function $$initialize(output, maxwidth, newline) {
        var self = this;

        
        if (maxwidth == null) maxwidth = nil;
        if (newline == null) newline = nil;
        self.output = output;
        return (self.first = [true]);
      }, -2);
      
      $def(self, '$text', function $$text(obj, width) {
        var self = this;

        
        if (width == null) width = nil;
        return self.output['$<<'](obj);
      }, -2);
      
      $def(self, '$breakable', function $$breakable(sep, width) {
        var self = this;

        
        if (sep == null) sep = " ";
        if (width == null) width = nil;
        return self.output['$<<'](sep);
      }, -1);
      
      $def(self, '$nest', function $$nest(indent) {
        var $yield = $$nest.$$p || nil;

        $$nest.$$p = null;
        return Opal.yieldX($yield, []);
      }, 1);
      
      $def(self, '$group', function $$group(indent, open_obj, close_obj, open_width, close_width) {
        var $yield = $$group.$$p || nil, self = this;

        $$group.$$p = null;
        
        if (indent == null) indent = nil;
        if (open_obj == null) open_obj = "";
        if (close_obj == null) close_obj = "";
        if (open_width == null) open_width = nil;
        if (close_width == null) close_width = nil;
        self.first.$push(true);
        self.output['$<<'](open_obj);
        Opal.yieldX($yield, []);
        self.output['$<<'](close_obj);
        return self.first.$pop();
      }, -1);
      
      $def(self, '$flush', $return_val(nil), 0);
      return $def(self, '$first?', function $SingleLine_first$ques$14() {
        var self = this, result = nil;

        
        result = self.first['$[]'](-1);
        self.first['$[]='](-1, false);
        return result;
      }, 0);
    })($nesting[0], null);
  })($nesting[0], null, $nesting)
};
