Opal.modules["benchmark"] = function(Opal) {/* Generated by Opal 1.3.1 */
  function $rb_minus(lhs, rhs) {
    return (typeof(lhs) === 'number' && typeof(rhs) === 'number') ? lhs - rhs : lhs['$-'](rhs);
  }
  function $rb_plus(lhs, rhs) {
    return (typeof(lhs) === 'number' && typeof(rhs) === 'number') ? lhs + rhs : lhs['$+'](rhs);
  }
  function $rb_times(lhs, rhs) {
    return (typeof(lhs) === 'number' && typeof(rhs) === 'number') ? lhs * rhs : lhs['$*'](rhs);
  }
  function $rb_lt(lhs, rhs) {
    return (typeof(lhs) === 'number' && typeof(rhs) === 'number') ? lhs < rhs : lhs['$<'](rhs);
  }
  var self = Opal.top, $nesting = [], nil = Opal.nil, $$$ = Opal.$$$, $$ = Opal.$$, $module = Opal.module, $send = Opal.send, $truthy = Opal.truthy, $klass = Opal.klass, $alias = Opal.alias, $gvars = Opal.gvars, $hash2 = Opal.hash2;

  Opal.add_stubs(['$sync', '$sync=', '$-', '$+', '$empty?', '$print', '$*', '$new', '$===', '$each', '$grep', '$ljust', '$shift', '$label', '$format', '$list', '$nil?', '$benchmark', '$to_proc', '$width', '$puts', '$length', '$inject', '$measure', '$rjust', '$map', '$start', '$tap', '$times', '$clock_gettime', '$utime', '$stime', '$cutime', '$cstime', '$module_function', '$raise', '$to_s', '$<', '$<<', '$attr_reader', '$real', '$memberwise', '$gsub', '$dup', '$%', '$total', '$protected', '$__send__']);
  return (function($base, $parent_nesting) {
    var self = $module($base, 'Benchmark');

    var $nesting = [self].concat($parent_nesting), $Benchmark_benchmark$1, $Benchmark_bm$3, $Benchmark_bmbm$4, $a, $b, $Benchmark_measure$8, $Benchmark_realtime$9;

    
    Opal.const_set($nesting[0], 'BENCHMARK_VERSION', "2002-04-25");
    
    Opal.def(self, '$benchmark', $Benchmark_benchmark$1 = function $$benchmark($a, $b, $c, $d) {
      var $post_args, caption, label_width, format, labels, $$2, $iter = $Benchmark_benchmark$1.$$p, $yield = $iter || nil, self = this, sync = nil, $writer = nil, $ret_or_1 = nil, $ret_or_2 = nil, report = nil, results = nil, $ret_or_3 = nil;

      if ($iter) $Benchmark_benchmark$1.$$p = null;
      
      
      $post_args = Opal.slice.call(arguments, 0, arguments.length);
      
      if ($post_args.length > 0) {
        caption = $post_args[0];
        $post_args.splice(0, 1);
      }
      if (caption == null) {
        caption = "";
      };
      
      if ($post_args.length > 0) {
        label_width = $post_args[0];
        $post_args.splice(0, 1);
      }
      if (label_width == null) {
        label_width = nil;
      };
      
      if ($post_args.length > 0) {
        format = $post_args[0];
        $post_args.splice(0, 1);
      }
      if (format == null) {
        format = nil;
      };
      
      labels = $post_args;;
      return (function() { try {
      
      sync = $$($nesting, 'STDOUT').$sync();
      
      $writer = [true];
      $send($$($nesting, 'STDOUT'), 'sync=', Opal.to_a($writer));
      $writer[$rb_minus($writer["length"], 1)];;
      label_width = (function() {if ($truthy(($ret_or_1 = label_width))) {
        return $ret_or_1
      } else {
        return 0
      }; return nil; })();
      label_width = $rb_plus(label_width, 1);
      format = (function() {if ($truthy(($ret_or_2 = format))) {
        return $ret_or_2
      } else {
        return $$($nesting, 'FORMAT')
      }; return nil; })();
      if ($truthy(caption['$empty?']())) {
      } else {
        self.$print($rb_plus($rb_times(" ", label_width), caption))
      };
      report = $$($nesting, 'Report').$new(label_width, format);
      results = Opal.yield1($yield, report);
      if ($truthy(($ret_or_3 = $$($nesting, 'Array')['$==='](results)))) {
        $send(results.$grep($$($nesting, 'Tms')), 'each', [], ($$2 = function(t){var self = $$2.$$s == null ? this : $$2.$$s, $ret_or_4 = nil, $ret_or_5 = nil;

          
          
          if (t == null) {
            t = nil;
          };
          return self.$print((function() {if ($truthy(($ret_or_4 = (function() {if ($truthy(($ret_or_5 = labels.$shift()))) {
            return $ret_or_5
          } else {
            return t.$label()
          }; return nil; })()))) {
            return $ret_or_4
          } else {
            return ""
          }; return nil; })().$ljust(label_width), t.$format(format));}, $$2.$$s = self, $$2.$$arity = 1, $$2))
      } else {
        $ret_or_3
      };
      return report.$list();
      } finally {
        (function() {if ($truthy(sync['$nil?']())) {
          return nil
        } else {
          
          $writer = [sync];
          $send($$($nesting, 'STDOUT'), 'sync=', Opal.to_a($writer));
          return $writer[$rb_minus($writer["length"], 1)];
        }; return nil; })()
      }; })();
    }, $Benchmark_benchmark$1.$$arity = -1);
    
    Opal.def(self, '$bm', $Benchmark_bm$3 = function $$bm($a, $b) {
      var $iter = $Benchmark_bm$3.$$p, blk = $iter || nil, $post_args, label_width, labels, self = this;

      if ($iter) $Benchmark_bm$3.$$p = null;
      
      
      if ($iter) $Benchmark_bm$3.$$p = null;;
      
      $post_args = Opal.slice.call(arguments, 0, arguments.length);
      
      if ($post_args.length > 0) {
        label_width = $post_args[0];
        $post_args.splice(0, 1);
      }
      if (label_width == null) {
        label_width = 0;
      };
      
      labels = $post_args;;
      return $send(self, 'benchmark', [$$($nesting, 'CAPTION'), label_width, $$($nesting, 'FORMAT')].concat(Opal.to_a(labels)), blk.$to_proc());
    }, $Benchmark_bm$3.$$arity = -1);
    
    Opal.def(self, '$bmbm', $Benchmark_bmbm$4 = function $$bmbm(width) {
      var $$5, $$6, $iter = $Benchmark_bmbm$4.$$p, $yield = $iter || nil, self = this, job = nil, sync = nil, $writer = nil, ets = nil;

      if ($iter) $Benchmark_bmbm$4.$$p = null;
      
      
      if (width == null) {
        width = 0;
      };
      return (function() { try {
      
      job = $$($nesting, 'Job').$new(width);
      Opal.yield1($yield, job);
      width = $rb_plus(job.$width(), 1);
      sync = $$($nesting, 'STDOUT').$sync();
      
      $writer = [true];
      $send($$($nesting, 'STDOUT'), 'sync=', Opal.to_a($writer));
      $writer[$rb_minus($writer["length"], 1)];;
      self.$puts("Rehearsal ".$ljust($rb_plus(width, $$($nesting, 'CAPTION').$length()), "-"));
      ets = $send(job.$list(), 'inject', [$$($nesting, 'Tms').$new()], ($$5 = function(sum, $mlhs_tmp1){var self = $$5.$$s == null ? this : $$5.$$s, $a, $b, label = nil, item = nil, res = nil;

        
        
        if (sum == null) {
          sum = nil;
        };
        
        if ($mlhs_tmp1 == null) {
          $mlhs_tmp1 = nil;
        };
        $b = $mlhs_tmp1, $a = Opal.to_ary($b), (label = ($a[0] == null ? nil : $a[0])), (item = ($a[1] == null ? nil : $a[1])), $b;
        self.$print(label.$ljust(width));
        res = $send($$($nesting, 'Benchmark'), 'measure', [], item.$to_proc());
        self.$print(res.$format());
        return $rb_plus(sum, res);}, $$5.$$s = self, $$5.$$arity = 2, $$5.$$has_top_level_mlhs_arg = true, $$5)).$format("total: %tsec");
      self.$print(((("" + " ") + (ets)) + "\n\n").$rjust($rb_plus($rb_plus(width, $$($nesting, 'CAPTION').$length()), 2), "-"));
      self.$print($rb_plus($rb_times(" ", width), $$($nesting, 'CAPTION')));
      return $send(job.$list(), 'map', [], ($$6 = function(label, item){var self = $$6.$$s == null ? this : $$6.$$s, $$7;

        
        
        if (label == null) {
          label = nil;
        };
        
        if (item == null) {
          item = nil;
        };
        $$($nesting, 'GC').$start();
        self.$print(label.$ljust(width));
        return $send($send($$($nesting, 'Benchmark'), 'measure', [label], item.$to_proc()), 'tap', [], ($$7 = function(res){var self = $$7.$$s == null ? this : $$7.$$s;

          
          
          if (res == null) {
            res = nil;
          };
          return self.$print(res);}, $$7.$$s = self, $$7.$$arity = 1, $$7));}, $$6.$$s = self, $$6.$$arity = 2, $$6));
      } finally {
        (function() {if ($truthy(sync['$nil?']())) {
          return nil
        } else {
          
          $writer = [sync];
          $send($$($nesting, 'STDOUT'), 'sync=', Opal.to_a($writer));
          return $writer[$rb_minus($writer["length"], 1)];
        }; return nil; })()
      }; })();
    }, $Benchmark_bmbm$4.$$arity = -1);
    
    if ($truthy((($b = $$($nesting, 'Process', 'skip_raise')) && ($a = $$$($b, 'CLOCK_MONOTONIC', 'skip_raise')) ? 'constant' : nil))) {Opal.const_set($nesting[0], 'BENCHMARK_CLOCK', $$$($$($nesting, 'Process'), 'CLOCK_MONOTONIC'))}
    else {Opal.const_set($nesting[0], 'BENCHMARK_CLOCK', $$$($$($nesting, 'Process'), 'CLOCK_REALTIME'))};
    
    Opal.def(self, '$measure', $Benchmark_measure$8 = function $$measure(label) {
      var $a, $iter = $Benchmark_measure$8.$$p, $yield = $iter || nil, self = this, t0 = nil, r0 = nil, t1 = nil, r1 = nil;

      if ($iter) $Benchmark_measure$8.$$p = null;
      
      
      if (label == null) {
        label = "";
      };
      $a = [$$($nesting, 'Process').$times(), $$($nesting, 'Process').$clock_gettime($$($nesting, 'BENCHMARK_CLOCK'))], (t0 = $a[0]), (r0 = $a[1]), $a;
      Opal.yieldX($yield, []);
      $a = [$$($nesting, 'Process').$times(), $$($nesting, 'Process').$clock_gettime($$($nesting, 'BENCHMARK_CLOCK'))], (t1 = $a[0]), (r1 = $a[1]), $a;
      return $$$($$($nesting, 'Benchmark'), 'Tms').$new($rb_minus(t1.$utime(), t0.$utime()), $rb_minus(t1.$stime(), t0.$stime()), $rb_minus(t1.$cutime(), t0.$cutime()), $rb_minus(t1.$cstime(), t0.$cstime()), $rb_minus(r1, r0), label);
    }, $Benchmark_measure$8.$$arity = -1);
    
    Opal.def(self, '$realtime', $Benchmark_realtime$9 = function $$realtime() {
      var $iter = $Benchmark_realtime$9.$$p, $yield = $iter || nil, self = this, r0 = nil;

      if ($iter) $Benchmark_realtime$9.$$p = null;
      
      r0 = $$($nesting, 'Process').$clock_gettime($$($nesting, 'BENCHMARK_CLOCK'));
      Opal.yieldX($yield, []);
      return $rb_minus($$($nesting, 'Process').$clock_gettime($$($nesting, 'BENCHMARK_CLOCK')), r0);
    }, $Benchmark_realtime$9.$$arity = 0);
    self.$module_function("benchmark", "measure", "realtime", "bm", "bmbm");
    (function($base, $super, $parent_nesting) {
      var self = $klass($base, $super, 'Job');

      var $nesting = [self].concat($parent_nesting), $Job_initialize$10, $Job_item$11;

      self.$$prototype.width = self.$$prototype.list = nil;
      
      
      Opal.def(self, '$initialize', $Job_initialize$10 = function $$initialize(width) {
        var self = this;

        
        self.width = width;
        return (self.list = []);
      }, $Job_initialize$10.$$arity = 1);
      
      Opal.def(self, '$item', $Job_item$11 = function $$item(label) {
        var $iter = $Job_item$11.$$p, blk = $iter || nil, self = this, w = nil;

        if ($iter) $Job_item$11.$$p = null;
        
        
        if ($iter) $Job_item$11.$$p = null;;
        
        if (label == null) {
          label = "";
        };
        if ((blk !== nil)) {
        } else {
          self.$raise($$($nesting, 'ArgumentError'), "no block")
        };
        label = label.$to_s();
        w = label.$length();
        if ($truthy($rb_lt(self.width, w))) {
          self.width = w};
        self.list['$<<']([label, blk]);
        return self;
      }, $Job_item$11.$$arity = -1);
      $alias(self, "report", "item");
      self.$attr_reader("list");
      return self.$attr_reader("width");
    })($nesting[0], null, $nesting);
    (function($base, $super, $parent_nesting) {
      var self = $klass($base, $super, 'Report');

      var $nesting = [self].concat($parent_nesting), $Report_initialize$12, $Report_item$13;

      self.$$prototype.width = self.$$prototype.list = self.$$prototype.format = nil;
      
      
      Opal.def(self, '$initialize', $Report_initialize$12 = function $$initialize(width, format) {
        var $a, self = this;

        
        
        if (width == null) {
          width = 0;
        };
        
        if (format == null) {
          format = nil;
        };
        return $a = [width, format, []], (self.width = $a[0]), (self.format = $a[1]), (self.list = $a[2]), $a;
      }, $Report_initialize$12.$$arity = -1);
      
      Opal.def(self, '$item', $Report_item$13 = function $$item($a, $b) {
        var $iter = $Report_item$13.$$p, blk = $iter || nil, $post_args, label, format, self = this, res = nil;

        if ($iter) $Report_item$13.$$p = null;
        
        
        if ($iter) $Report_item$13.$$p = null;;
        
        $post_args = Opal.slice.call(arguments, 0, arguments.length);
        
        if ($post_args.length > 0) {
          label = $post_args[0];
          $post_args.splice(0, 1);
        }
        if (label == null) {
          label = "";
        };
        
        format = $post_args;;
        self.$print(label.$to_s().$ljust(self.width));
        self.list['$<<']((res = $send($$($nesting, 'Benchmark'), 'measure', [label], blk.$to_proc())));
        self.$print($send(res, 'format', [self.format].concat(Opal.to_a(format))));
        return res;
      }, $Report_item$13.$$arity = -1);
      $alias(self, "report", "item");
      return self.$attr_reader("list");
    })($nesting[0], null, $nesting);
    (function($base, $super, $parent_nesting) {
      var self = $klass($base, $super, 'Tms');

      var $nesting = [self].concat($parent_nesting), $Tms_initialize$14, $Tms_add$15, $Tms_add$excl$16, $Tms_$plus$17, $Tms_$minus$18, $Tms_$$19, $Tms_$slash$20, $Tms_format$21, $Tms_to_s$29, $Tms_to_a$30, $Tms_to_h$31, $Tms_memberwise$32;

      self.$$prototype.utime = self.$$prototype.stime = self.$$prototype.cutime = self.$$prototype.cstime = self.$$prototype.label = self.$$prototype.real = nil;
      
      Opal.const_set($nesting[0], 'CAPTION', "      user     system      total        real\n");
      Opal.const_set($nesting[0], 'FORMAT', "%10.6u %10.6y %10.6t %10.6r\n");
      self.$attr_reader("utime");
      self.$attr_reader("stime");
      self.$attr_reader("cutime");
      self.$attr_reader("cstime");
      self.$attr_reader("real");
      self.$attr_reader("total");
      self.$attr_reader("label");
      
      Opal.def(self, '$initialize', $Tms_initialize$14 = function $$initialize(utime, stime, cutime, cstime, real, label) {
        var $a, self = this;

        
        
        if (utime == null) {
          utime = 0.0;
        };
        
        if (stime == null) {
          stime = 0.0;
        };
        
        if (cutime == null) {
          cutime = 0.0;
        };
        
        if (cstime == null) {
          cstime = 0.0;
        };
        
        if (real == null) {
          real = 0.0;
        };
        
        if (label == null) {
          label = nil;
        };
        $a = [utime, stime, cutime, cstime, real, label.$to_s()], (self.utime = $a[0]), (self.stime = $a[1]), (self.cutime = $a[2]), (self.cstime = $a[3]), (self.real = $a[4]), (self.label = $a[5]), $a;
        return (self.total = $rb_plus($rb_plus($rb_plus(self.utime, self.stime), self.cutime), self.cstime));
      }, $Tms_initialize$14.$$arity = -1);
      
      Opal.def(self, '$add', $Tms_add$15 = function $$add() {
        var $iter = $Tms_add$15.$$p, blk = $iter || nil, self = this;

        if ($iter) $Tms_add$15.$$p = null;
        
        
        if ($iter) $Tms_add$15.$$p = null;;
        return $rb_plus(self, $send($$($nesting, 'Benchmark'), 'measure', [], blk.$to_proc()));
      }, $Tms_add$15.$$arity = 0);
      
      Opal.def(self, '$add!', $Tms_add$excl$16 = function() {
        var $iter = $Tms_add$excl$16.$$p, blk = $iter || nil, self = this, t = nil;

        if ($iter) $Tms_add$excl$16.$$p = null;
        
        
        if ($iter) $Tms_add$excl$16.$$p = null;;
        t = $send($$($nesting, 'Benchmark'), 'measure', [], blk.$to_proc());
        self.utime = $rb_plus(self.$utime(), t.$utime());
        self.stime = $rb_plus(self.$stime(), t.$stime());
        self.cutime = $rb_plus(self.$cutime(), t.$cutime());
        self.cstime = $rb_plus(self.$cstime(), t.$cstime());
        self.real = $rb_plus(self.$real(), t.$real());
        return self;
      }, $Tms_add$excl$16.$$arity = 0);
      
      Opal.def(self, '$+', $Tms_$plus$17 = function(other) {
        var self = this;

        return self.$memberwise("+", other)
      }, $Tms_$plus$17.$$arity = 1);
      
      Opal.def(self, '$-', $Tms_$minus$18 = function(other) {
        var self = this;

        return self.$memberwise("-", other)
      }, $Tms_$minus$18.$$arity = 1);
      
      Opal.def(self, '$*', $Tms_$$19 = function(x) {
        var self = this;

        return self.$memberwise("*", x)
      }, $Tms_$$19.$$arity = 1);
      
      Opal.def(self, '$/', $Tms_$slash$20 = function(x) {
        var self = this;

        return self.$memberwise("/", x)
      }, $Tms_$slash$20.$$arity = 1);
      
      Opal.def(self, '$format', $Tms_format$21 = function $$format($a, $b) {
        var $post_args, format, args, $$22, $$23, $$24, $$25, $$26, $$27, $$28, self = this, str = nil, $ret_or_6 = nil;

        
        
        $post_args = Opal.slice.call(arguments, 0, arguments.length);
        
        if ($post_args.length > 0) {
          format = $post_args[0];
          $post_args.splice(0, 1);
        }
        if (format == null) {
          format = nil;
        };
        
        args = $post_args;;
        str = $send($send($send($send($send($send($send((function() {if ($truthy(($ret_or_6 = format))) {
          return $ret_or_6
        } else {
          return $$($nesting, 'FORMAT')
        }; return nil; })().$dup(), 'gsub', [/(%[-+.\d]*)n/], ($$22 = function(){var self = $$22.$$s == null ? this : $$22.$$s, $c;

          return (("" + ((($c = $gvars['~']) === nil ? nil : $c['$[]'](1)))) + "s")['$%'](self.$label())}, $$22.$$s = self, $$22.$$arity = 0, $$22)), 'gsub', [/(%[-+.\d]*)u/], ($$23 = function(){var self = $$23.$$s == null ? this : $$23.$$s, $c;

          return (("" + ((($c = $gvars['~']) === nil ? nil : $c['$[]'](1)))) + "f")['$%'](self.$utime())}, $$23.$$s = self, $$23.$$arity = 0, $$23)), 'gsub', [/(%[-+.\d]*)y/], ($$24 = function(){var self = $$24.$$s == null ? this : $$24.$$s, $c;

          return (("" + ((($c = $gvars['~']) === nil ? nil : $c['$[]'](1)))) + "f")['$%'](self.$stime())}, $$24.$$s = self, $$24.$$arity = 0, $$24)), 'gsub', [/(%[-+.\d]*)U/], ($$25 = function(){var self = $$25.$$s == null ? this : $$25.$$s, $c;

          return (("" + ((($c = $gvars['~']) === nil ? nil : $c['$[]'](1)))) + "f")['$%'](self.$cutime())}, $$25.$$s = self, $$25.$$arity = 0, $$25)), 'gsub', [/(%[-+.\d]*)Y/], ($$26 = function(){var self = $$26.$$s == null ? this : $$26.$$s, $c;

          return (("" + ((($c = $gvars['~']) === nil ? nil : $c['$[]'](1)))) + "f")['$%'](self.$cstime())}, $$26.$$s = self, $$26.$$arity = 0, $$26)), 'gsub', [/(%[-+.\d]*)t/], ($$27 = function(){var self = $$27.$$s == null ? this : $$27.$$s, $c;

          return (("" + ((($c = $gvars['~']) === nil ? nil : $c['$[]'](1)))) + "f")['$%'](self.$total())}, $$27.$$s = self, $$27.$$arity = 0, $$27)), 'gsub', [/(%[-+.\d]*)r/], ($$28 = function(){var self = $$28.$$s == null ? this : $$28.$$s, $c;

          return ((("" + "(") + ((($c = $gvars['~']) === nil ? nil : $c['$[]'](1)))) + "f)")['$%'](self.$real())}, $$28.$$s = self, $$28.$$arity = 0, $$28));
        if ($truthy(format)) {
          return str['$%'](args)
        } else {
          return str
        };
      }, $Tms_format$21.$$arity = -1);
      
      Opal.def(self, '$to_s', $Tms_to_s$29 = function $$to_s() {
        var self = this;

        return self.$format()
      }, $Tms_to_s$29.$$arity = 0);
      
      Opal.def(self, '$to_a', $Tms_to_a$30 = function $$to_a() {
        var self = this;

        return [self.label, self.utime, self.stime, self.cutime, self.cstime, self.real]
      }, $Tms_to_a$30.$$arity = 0);
      
      Opal.def(self, '$to_h', $Tms_to_h$31 = function $$to_h() {
        var self = this;

        return $hash2(["label", "utime", "stime", "cutime", "cstime", "real"], {"label": self.label, "utime": self.utime, "stime": self.stime, "cutime": self.cutime, "cstime": self.cstime, "real": self.real})
      }, $Tms_to_h$31.$$arity = 0);
      self.$protected();
      return (Opal.def(self, '$memberwise', $Tms_memberwise$32 = function $$memberwise(op, x) {
        var self = this, $case = nil;

        return (function() {$case = x;
        if ($$$($$($nesting, 'Benchmark'), 'Tms')['$===']($case)) {return $$$($$($nesting, 'Benchmark'), 'Tms').$new(self.$utime().$__send__(op, x.$utime()), self.$stime().$__send__(op, x.$stime()), self.$cutime().$__send__(op, x.$cutime()), self.$cstime().$__send__(op, x.$cstime()), self.$real().$__send__(op, x.$real()))}
        else {return $$$($$($nesting, 'Benchmark'), 'Tms').$new(self.$utime().$__send__(op, x), self.$stime().$__send__(op, x), self.$cutime().$__send__(op, x), self.$cstime().$__send__(op, x), self.$real().$__send__(op, x))}})()
      }, $Tms_memberwise$32.$$arity = 2), nil) && 'memberwise';
    })($nesting[0], null, $nesting);
    Opal.const_set($nesting[0], 'CAPTION', $$$($$$($$($nesting, 'Benchmark'), 'Tms'), 'CAPTION'));
    return Opal.const_set($nesting[0], 'FORMAT', $$$($$$($$($nesting, 'Benchmark'), 'Tms'), 'FORMAT'));
  })($nesting[0], $nesting)
};
