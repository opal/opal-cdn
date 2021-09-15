/* Generated by Opal 1.3.0.dev */
Opal.modules["prettyprint"] = function(Opal) {
  function $rb_times(lhs, rhs) {
    return (typeof(lhs) === 'number' && typeof(rhs) === 'number') ? lhs * rhs : lhs['$*'](rhs);
  }
  function $rb_lt(lhs, rhs) {
    return (typeof(lhs) === 'number' && typeof(rhs) === 'number') ? lhs < rhs : lhs['$<'](rhs);
  }
  function $rb_plus(lhs, rhs) {
    return (typeof(lhs) === 'number' && typeof(rhs) === 'number') ? lhs + rhs : lhs['$+'](rhs);
  }
  function $rb_minus(lhs, rhs) {
    return (typeof(lhs) === 'number' && typeof(rhs) === 'number') ? lhs - rhs : lhs['$-'](rhs);
  }
  var self = Opal.top, $nesting = [], nil = Opal.nil, $$$ = Opal.$$$, $$ = Opal.$$, $klass = Opal.klass, $send = Opal.send, $truthy = Opal.truthy;

  Opal.add_stubs(['$dup', '$lambda', '$*', '$new', '$to_proc', '$flush', '$attr_reader', '$last', '$<', '$+', '$deq', '$empty?', '$breakables', '$shift', '$output', '$-', '$width', '$!', '$===', '$first', '$length', '$<<', '$add', '$break_outmost_groups', '$group', '$breakable', '$break?', '$call', '$text', '$group_sub', '$nest', '$depth', '$push', '$enq', '$pop', '$delete', '$each', '$clear', '$indent', '$current_group', '$newline', '$genspace', '$group_queue', '$[]', '$downto', '$slice!', '$break', '$[]=']);
  return (function($base, $super, $parent_nesting) {
    var self = $klass($base, $super, 'PrettyPrint');

    var $nesting = [self].concat($parent_nesting), $PrettyPrint_format$1, $PrettyPrint_singleline_format$3, $PrettyPrint_initialize$4, $PrettyPrint_current_group$6, $PrettyPrint_break_outmost_groups$7, $PrettyPrint_text$8, $PrettyPrint_fill_breakable$9, $PrettyPrint_breakable$11, $PrettyPrint_group$12, $PrettyPrint_group_sub$15, $PrettyPrint_nest$16, $PrettyPrint_flush$17;

    self.$$prototype.group_stack = self.$$prototype.maxwidth = self.$$prototype.output_width = self.$$prototype.buffer_width = self.$$prototype.group_queue = self.$$prototype.buffer = self.$$prototype.output = self.$$prototype.newline = self.$$prototype.genspace = self.$$prototype.indent = nil;
    
    Opal.defs($$($nesting, 'PrettyPrint'), '$format', $PrettyPrint_format$1 = function $$format(output, maxwidth, newline, genspace) {
      var $$2, $iter = $PrettyPrint_format$1.$$p, $yield = $iter || nil, self = this, q = nil;

      if ($iter) $PrettyPrint_format$1.$$p = null;
      
      
      if (output == null) {
        output = "".$dup();
      };
      
      if (maxwidth == null) {
        maxwidth = 79;
      };
      
      if (newline == null) {
        newline = "\n";
      };
      
      if (genspace == null) {
        genspace = $send(self, 'lambda', [], ($$2 = function(n){var self = $$2.$$s == null ? this : $$2.$$s;

        
        
        if (n == null) {
          n = nil;
        };
        return $rb_times(" ", n);}, $$2.$$s = self, $$2.$$arity = 1, $$2));
      };
      q = $send($$($nesting, 'PrettyPrint'), 'new', [output, maxwidth, newline], genspace.$to_proc());
      Opal.yield1($yield, q);
      q.$flush();
      return output;
    }, $PrettyPrint_format$1.$$arity = -1);
    Opal.defs($$($nesting, 'PrettyPrint'), '$singleline_format', $PrettyPrint_singleline_format$3 = function $$singleline_format(output, maxwidth, newline, genspace) {
      var $iter = $PrettyPrint_singleline_format$3.$$p, $yield = $iter || nil, self = this, q = nil;

      if ($iter) $PrettyPrint_singleline_format$3.$$p = null;
      
      
      if (output == null) {
        output = "".$dup();
      };
      
      if (maxwidth == null) {
        maxwidth = nil;
      };
      
      if (newline == null) {
        newline = nil;
      };
      
      if (genspace == null) {
        genspace = nil;
      };
      q = $$($nesting, 'SingleLine').$new(output);
      Opal.yield1($yield, q);
      return output;
    }, $PrettyPrint_singleline_format$3.$$arity = -1);
    
    Opal.def(self, '$initialize', $PrettyPrint_initialize$4 = function $$initialize(output, maxwidth, newline) {
      var $iter = $PrettyPrint_initialize$4.$$p, genspace = $iter || nil, $$5, self = this, $ret_or_1 = nil, root_group = nil;

      if ($iter) $PrettyPrint_initialize$4.$$p = null;
      
      
      if ($iter) $PrettyPrint_initialize$4.$$p = null;;
      
      if (output == null) {
        output = "".$dup();
      };
      
      if (maxwidth == null) {
        maxwidth = 79;
      };
      
      if (newline == null) {
        newline = "\n";
      };
      self.output = output;
      self.maxwidth = maxwidth;
      self.newline = newline;
      self.genspace = (function() {if ($truthy(($ret_or_1 = genspace))) {
        return $ret_or_1
      } else {
        return $send(self, 'lambda', [], ($$5 = function(n){var self = $$5.$$s == null ? this : $$5.$$s;

          
          
          if (n == null) {
            n = nil;
          };
          return $rb_times(" ", n);}, $$5.$$s = self, $$5.$$arity = 1, $$5))
      }; return nil; })();
      self.output_width = 0;
      self.buffer_width = 0;
      self.buffer = [];
      root_group = $$($nesting, 'Group').$new(0);
      self.group_stack = [root_group];
      self.group_queue = $$($nesting, 'GroupQueue').$new(root_group);
      return (self.indent = 0);
    }, $PrettyPrint_initialize$4.$$arity = -1);
    self.$attr_reader("output");
    self.$attr_reader("maxwidth");
    self.$attr_reader("newline");
    self.$attr_reader("genspace");
    self.$attr_reader("indent");
    self.$attr_reader("group_queue");
    
    Opal.def(self, '$current_group', $PrettyPrint_current_group$6 = function $$current_group() {
      var self = this;

      return self.group_stack.$last()
    }, $PrettyPrint_current_group$6.$$arity = 0);
    
    Opal.def(self, '$break_outmost_groups', $PrettyPrint_break_outmost_groups$7 = function $$break_outmost_groups() {
      var $a, $b, self = this, group = nil, data = nil, $ret_or_2 = nil, text = nil;

      while ($truthy($rb_lt(self.maxwidth, $rb_plus(self.output_width, self.buffer_width)))) {
        
        if ($truthy((group = self.group_queue.$deq()))) {
        } else {
          return nil
        };
        while (!($truthy(group.$breakables()['$empty?']()))) {
          
          data = self.buffer.$shift();
          self.output_width = data.$output(self.output, self.output_width);
          self.buffer_width = $rb_minus(self.buffer_width, data.$width());
        };
        while ($truthy((function() {if ($truthy(($ret_or_2 = self.buffer['$empty?']()['$!']()))) {
          return $$($nesting, 'Text')['$==='](self.buffer.$first())
        } else {
          return $ret_or_2
        }; return nil; })())) {
          
          text = self.buffer.$shift();
          self.output_width = text.$output(self.output, self.output_width);
          self.buffer_width = $rb_minus(self.buffer_width, text.$width());
        };
      }
    }, $PrettyPrint_break_outmost_groups$7.$$arity = 0);
    
    Opal.def(self, '$text', $PrettyPrint_text$8 = function $$text(obj, width) {
      var self = this, text = nil;

      
      
      if (width == null) {
        width = obj.$length();
      };
      if ($truthy(self.buffer['$empty?']())) {
        
        self.output['$<<'](obj);
        return (self.output_width = $rb_plus(self.output_width, width));
      } else {
        
        text = self.buffer.$last();
        if ($truthy($$($nesting, 'Text')['$==='](text))) {
        } else {
          
          text = $$($nesting, 'Text').$new();
          self.buffer['$<<'](text);
        };
        text.$add(obj, width);
        self.buffer_width = $rb_plus(self.buffer_width, width);
        return self.$break_outmost_groups();
      };
    }, $PrettyPrint_text$8.$$arity = -2);
    
    Opal.def(self, '$fill_breakable', $PrettyPrint_fill_breakable$9 = function $$fill_breakable(sep, width) {
      var $$10, self = this;

      
      
      if (sep == null) {
        sep = " ";
      };
      
      if (width == null) {
        width = sep.$length();
      };
      return $send(self, 'group', [], ($$10 = function(){var self = $$10.$$s == null ? this : $$10.$$s;

        return self.$breakable(sep, width)}, $$10.$$s = self, $$10.$$arity = 0, $$10));
    }, $PrettyPrint_fill_breakable$9.$$arity = -1);
    
    Opal.def(self, '$breakable', $PrettyPrint_breakable$11 = function $$breakable(sep, width) {
      var self = this, group = nil;

      
      
      if (sep == null) {
        sep = " ";
      };
      
      if (width == null) {
        width = sep.$length();
      };
      group = self.group_stack.$last();
      if ($truthy(group['$break?']())) {
        
        self.$flush();
        self.output['$<<'](self.newline);
        self.output['$<<'](self.genspace.$call(self.indent));
        self.output_width = self.indent;
        return (self.buffer_width = 0);
      } else {
        
        self.buffer['$<<']($$($nesting, 'Breakable').$new(sep, width, self));
        self.buffer_width = $rb_plus(self.buffer_width, width);
        return self.$break_outmost_groups();
      };
    }, $PrettyPrint_breakable$11.$$arity = -1);
    
    Opal.def(self, '$group', $PrettyPrint_group$12 = function $$group(indent, open_obj, close_obj, open_width, close_width) {
      var $$13, $iter = $PrettyPrint_group$12.$$p, $yield = $iter || nil, self = this;

      if ($iter) $PrettyPrint_group$12.$$p = null;
      
      
      if (indent == null) {
        indent = 0;
      };
      
      if (open_obj == null) {
        open_obj = "";
      };
      
      if (close_obj == null) {
        close_obj = "";
      };
      
      if (open_width == null) {
        open_width = open_obj.$length();
      };
      
      if (close_width == null) {
        close_width = close_obj.$length();
      };
      self.$text(open_obj, open_width);
      $send(self, 'group_sub', [], ($$13 = function(){var self = $$13.$$s == null ? this : $$13.$$s, $$14;

        return $send(self, 'nest', [indent], ($$14 = function(){var self = $$14.$$s == null ? this : $$14.$$s;

          return Opal.yieldX($yield, []);}, $$14.$$s = self, $$14.$$arity = 0, $$14))}, $$13.$$s = self, $$13.$$arity = 0, $$13));
      return self.$text(close_obj, close_width);
    }, $PrettyPrint_group$12.$$arity = -1);
    
    Opal.def(self, '$group_sub', $PrettyPrint_group_sub$15 = function $$group_sub() {
      var $iter = $PrettyPrint_group_sub$15.$$p, $yield = $iter || nil, self = this, group = nil;

      if ($iter) $PrettyPrint_group_sub$15.$$p = null;
      
      group = $$($nesting, 'Group').$new($rb_plus(self.group_stack.$last().$depth(), 1));
      self.group_stack.$push(group);
      self.group_queue.$enq(group);
      
      return (function() { try {
      return Opal.yieldX($yield, []);
      } finally {
        (self.group_stack.$pop(), (function() {if ($truthy(group.$breakables()['$empty?']())) {
          return self.group_queue.$delete(group)
        } else {
          return nil
        }; return nil; })())
      }; })();;
    }, $PrettyPrint_group_sub$15.$$arity = 0);
    
    Opal.def(self, '$nest', $PrettyPrint_nest$16 = function $$nest(indent) {
      var $iter = $PrettyPrint_nest$16.$$p, $yield = $iter || nil, self = this;

      if ($iter) $PrettyPrint_nest$16.$$p = null;
      
      self.indent = $rb_plus(self.indent, indent);
      
      return (function() { try {
      return Opal.yieldX($yield, []);
      } finally {
        (self.indent = $rb_minus(self.indent, indent))
      }; })();;
    }, $PrettyPrint_nest$16.$$arity = 1);
    
    Opal.def(self, '$flush', $PrettyPrint_flush$17 = function $$flush() {
      var $$18, self = this;

      
      $send(self.buffer, 'each', [], ($$18 = function(data){var self = $$18.$$s == null ? this : $$18.$$s;
        if (self.output == null) self.output = nil;
        if (self.output_width == null) self.output_width = nil;

        
        
        if (data == null) {
          data = nil;
        };
        return (self.output_width = data.$output(self.output, self.output_width));}, $$18.$$s = self, $$18.$$arity = 1, $$18));
      self.buffer.$clear();
      return (self.buffer_width = 0);
    }, $PrettyPrint_flush$17.$$arity = 0);
    (function($base, $super, $parent_nesting) {
      var self = $klass($base, $super, 'Text');

      var $nesting = [self].concat($parent_nesting), $Text_initialize$19, $Text_output$20, $Text_add$22;

      self.$$prototype.objs = self.$$prototype.width = nil;
      
      
      Opal.def(self, '$initialize', $Text_initialize$19 = function $$initialize() {
        var self = this;

        
        self.objs = [];
        return (self.width = 0);
      }, $Text_initialize$19.$$arity = 0);
      self.$attr_reader("width");
      
      Opal.def(self, '$output', $Text_output$20 = function $$output(out, output_width) {
        var $$21, self = this;

        
        $send(self.objs, 'each', [], ($$21 = function(obj){var self = $$21.$$s == null ? this : $$21.$$s;

          
          
          if (obj == null) {
            obj = nil;
          };
          return out['$<<'](obj);}, $$21.$$s = self, $$21.$$arity = 1, $$21));
        return $rb_plus(output_width, self.width);
      }, $Text_output$20.$$arity = 2);
      return (Opal.def(self, '$add', $Text_add$22 = function $$add(obj, width) {
        var self = this;

        
        self.objs['$<<'](obj);
        return (self.width = $rb_plus(self.width, width));
      }, $Text_add$22.$$arity = 2), nil) && 'add';
    })($nesting[0], null, $nesting);
    (function($base, $super, $parent_nesting) {
      var self = $klass($base, $super, 'Breakable');

      var $nesting = [self].concat($parent_nesting), $Breakable_initialize$23, $Breakable_output$24;

      self.$$prototype.group = self.$$prototype.pp = self.$$prototype.indent = self.$$prototype.obj = self.$$prototype.width = nil;
      
      
      Opal.def(self, '$initialize', $Breakable_initialize$23 = function $$initialize(sep, width, q) {
        var self = this;

        
        self.obj = sep;
        self.width = width;
        self.pp = q;
        self.indent = q.$indent();
        self.group = q.$current_group();
        return self.group.$breakables().$push(self);
      }, $Breakable_initialize$23.$$arity = 3);
      self.$attr_reader("obj");
      self.$attr_reader("width");
      self.$attr_reader("indent");
      return (Opal.def(self, '$output', $Breakable_output$24 = function $$output(out, output_width) {
        var self = this;

        
        self.group.$breakables().$shift();
        if ($truthy(self.group['$break?']())) {
          
          out['$<<'](self.pp.$newline());
          out['$<<'](self.pp.$genspace().$call(self.indent));
          return self.indent;
        } else {
          
          if ($truthy(self.group.$breakables()['$empty?']())) {
            self.pp.$group_queue().$delete(self.group)};
          out['$<<'](self.obj);
          return $rb_plus(output_width, self.width);
        };
      }, $Breakable_output$24.$$arity = 2), nil) && 'output';
    })($nesting[0], null, $nesting);
    (function($base, $super, $parent_nesting) {
      var self = $klass($base, $super, 'Group');

      var $nesting = [self].concat($parent_nesting), $Group_initialize$25, $Group_break$26, $Group_break$ques$27, $Group_first$ques$28;

      self.$$prototype["break"] = nil;
      
      
      Opal.def(self, '$initialize', $Group_initialize$25 = function $$initialize(depth) {
        var self = this;

        
        self.depth = depth;
        self.breakables = [];
        return (self["break"] = false);
      }, $Group_initialize$25.$$arity = 1);
      self.$attr_reader("depth");
      self.$attr_reader("breakables");
      
      Opal.def(self, '$break', $Group_break$26 = function() {
        var self = this;

        return (self["break"] = true)
      }, $Group_break$26.$$arity = 0);
      
      Opal.def(self, '$break?', $Group_break$ques$27 = function() {
        var self = this;

        return self["break"]
      }, $Group_break$ques$27.$$arity = 0);
      return (Opal.def(self, '$first?', $Group_first$ques$28 = function() {
        var $a, self = this;

        if ($truthy((($a = self['first'], $a != null && $a !== nil) ? 'instance-variable' : nil))) {
          return false
        } else {
          
          self.first = false;
          return true;
        }
      }, $Group_first$ques$28.$$arity = 0), nil) && 'first?';
    })($nesting[0], null, $nesting);
    (function($base, $super, $parent_nesting) {
      var self = $klass($base, $super, 'GroupQueue');

      var $nesting = [self].concat($parent_nesting), $GroupQueue_initialize$29, $GroupQueue_enq$31, $GroupQueue_deq$32, $GroupQueue_delete$36;

      self.$$prototype.queue = nil;
      
      
      Opal.def(self, '$initialize', $GroupQueue_initialize$29 = function $$initialize($a) {
        var $post_args, groups, $$30, self = this;

        
        
        $post_args = Opal.slice.call(arguments, 0, arguments.length);
        
        groups = $post_args;;
        self.queue = [];
        return $send(groups, 'each', [], ($$30 = function(g){var self = $$30.$$s == null ? this : $$30.$$s;

          
          
          if (g == null) {
            g = nil;
          };
          return self.$enq(g);}, $$30.$$s = self, $$30.$$arity = 1, $$30));
      }, $GroupQueue_initialize$29.$$arity = -1);
      
      Opal.def(self, '$enq', $GroupQueue_enq$31 = function $$enq(group) {
        var $a, self = this, depth = nil;

        
        depth = group.$depth();
        while (!($truthy($rb_lt(depth, self.queue.$length())))) {
          self.queue['$<<']([])
        };
        return self.queue['$[]'](depth)['$<<'](group);
      }, $GroupQueue_enq$31.$$arity = 1);
      
      Opal.def(self, '$deq', $GroupQueue_deq$32 = function $$deq() {try {

        var $$33, self = this;

        
        $send(self.queue, 'each', [], ($$33 = function(gs){var self = $$33.$$s == null ? this : $$33.$$s, $$34, $$35;

          
          
          if (gs == null) {
            gs = nil;
          };
          $send($rb_minus(gs.$length(), 1), 'downto', [0], ($$34 = function(i){var self = $$34.$$s == null ? this : $$34.$$s, group = nil;

            
            
            if (i == null) {
              i = nil;
            };
            if ($truthy(gs['$[]'](i).$breakables()['$empty?']())) {
              return nil
            } else {
              
              group = gs['$slice!'](i, 1).$first();
              group.$break();
              Opal.ret(group);
            };}, $$34.$$s = self, $$34.$$arity = 1, $$34));
          $send(gs, 'each', [], ($$35 = function(group){var self = $$35.$$s == null ? this : $$35.$$s;

            
            
            if (group == null) {
              group = nil;
            };
            return group.$break();}, $$35.$$s = self, $$35.$$arity = 1, $$35));
          return gs.$clear();}, $$33.$$s = self, $$33.$$arity = 1, $$33));
        return nil;
        } catch ($returner) { if ($returner === Opal.returner) { return $returner.$v } throw $returner; }
      }, $GroupQueue_deq$32.$$arity = 0);
      return (Opal.def(self, '$delete', $GroupQueue_delete$36 = function(group) {
        var self = this;

        return self.queue['$[]'](group.$depth()).$delete(group)
      }, $GroupQueue_delete$36.$$arity = 1), nil) && 'delete';
    })($nesting[0], null, $nesting);
    return (function($base, $super, $parent_nesting) {
      var self = $klass($base, $super, 'SingleLine');

      var $nesting = [self].concat($parent_nesting), $SingleLine_initialize$37, $SingleLine_text$38, $SingleLine_breakable$39, $SingleLine_nest$40, $SingleLine_group$41, $SingleLine_flush$42, $SingleLine_first$ques$43;

      self.$$prototype.output = self.$$prototype.first = nil;
      
      
      Opal.def(self, '$initialize', $SingleLine_initialize$37 = function $$initialize(output, maxwidth, newline) {
        var self = this;

        
        
        if (maxwidth == null) {
          maxwidth = nil;
        };
        
        if (newline == null) {
          newline = nil;
        };
        self.output = output;
        return (self.first = [true]);
      }, $SingleLine_initialize$37.$$arity = -2);
      
      Opal.def(self, '$text', $SingleLine_text$38 = function $$text(obj, width) {
        var self = this;

        
        
        if (width == null) {
          width = nil;
        };
        return self.output['$<<'](obj);
      }, $SingleLine_text$38.$$arity = -2);
      
      Opal.def(self, '$breakable', $SingleLine_breakable$39 = function $$breakable(sep, width) {
        var self = this;

        
        
        if (sep == null) {
          sep = " ";
        };
        
        if (width == null) {
          width = nil;
        };
        return self.output['$<<'](sep);
      }, $SingleLine_breakable$39.$$arity = -1);
      
      Opal.def(self, '$nest', $SingleLine_nest$40 = function $$nest(indent) {
        var $iter = $SingleLine_nest$40.$$p, $yield = $iter || nil, self = this;

        if ($iter) $SingleLine_nest$40.$$p = null;
        return Opal.yieldX($yield, []);
      }, $SingleLine_nest$40.$$arity = 1);
      
      Opal.def(self, '$group', $SingleLine_group$41 = function $$group(indent, open_obj, close_obj, open_width, close_width) {
        var $iter = $SingleLine_group$41.$$p, $yield = $iter || nil, self = this;

        if ($iter) $SingleLine_group$41.$$p = null;
        
        
        if (indent == null) {
          indent = nil;
        };
        
        if (open_obj == null) {
          open_obj = "";
        };
        
        if (close_obj == null) {
          close_obj = "";
        };
        
        if (open_width == null) {
          open_width = nil;
        };
        
        if (close_width == null) {
          close_width = nil;
        };
        self.first.$push(true);
        self.output['$<<'](open_obj);
        Opal.yieldX($yield, []);
        self.output['$<<'](close_obj);
        return self.first.$pop();
      }, $SingleLine_group$41.$$arity = -1);
      
      Opal.def(self, '$flush', $SingleLine_flush$42 = function $$flush() {
        var self = this;

        return nil
      }, $SingleLine_flush$42.$$arity = 0);
      return (Opal.def(self, '$first?', $SingleLine_first$ques$43 = function() {
        var self = this, result = nil, $writer = nil;

        
        result = self.first['$[]'](-1);
        
        $writer = [-1, false];
        $send(self.first, '[]=', Opal.to_a($writer));
        $writer[$rb_minus($writer["length"], 1)];;
        return result;
      }, $SingleLine_first$ques$43.$$arity = 0), nil) && 'first?';
    })($nesting[0], null, $nesting);
  })($nesting[0], null, $nesting)
};
