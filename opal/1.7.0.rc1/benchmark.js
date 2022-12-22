Opal.queue(function(Opal) {/* Generated by Opal 1.7.0.rc1 */
  var $module = Opal.module, $const_set = Opal.const_set, $slice = Opal.slice, $truthy = Opal.truthy, $rb_plus = Opal.rb_plus, $rb_times = Opal.rb_times, $send = Opal.send, $def = Opal.def, $to_a = Opal.to_a, $to_ary = Opal.to_ary, $rb_minus = Opal.rb_minus, $klass = Opal.klass, $rb_lt = Opal.rb_lt, $alias = Opal.alias, $gvars = Opal.gvars, $hash2 = Opal.hash2, $eqeqeq = Opal.eqeqeq, $nesting = [], nil = Opal.nil, $$$ = Opal.$$$;

  Opal.add_stubs('sync,sync=,+,empty?,print,*,new,===,each,grep,ljust,shift,label,format,list,nil?,benchmark,to_proc,width,puts,length,inject,measure,rjust,map,start,tap,times,clock_gettime,-,utime,stime,cutime,cstime,module_function,raise,to_s,<,<<,item,attr_reader,real,memberwise,gsub,dup,%,total,protected,__send__');
  return (function($base, $parent_nesting) {
    var self = $module($base, 'Benchmark');

    var $a, $b, $nesting = [self].concat($parent_nesting), $$ = Opal.$r($nesting);

    
    $const_set($nesting[0], 'BENCHMARK_VERSION', "2002-04-25");
    
    $def(self, '$benchmark', function $$benchmark($a, $b, $c, $d) {
      var $post_args, caption, label_width, format, labels, $e, $yield = $$benchmark.$$p || nil, self = this, sync = nil, $ret_or_1 = nil, report = nil, results = nil;

      $$benchmark.$$p = null;
      
      $post_args = $slice(arguments);
      
      if ($post_args.length > 0) caption = $post_args.shift();if (caption == null) caption = "";
      
      if ($post_args.length > 0) label_width = $post_args.shift();if (label_width == null) label_width = nil;
      
      if ($post_args.length > 0) format = $post_args.shift();if (format == null) format = nil;
      labels = $post_args;
      return (function() { try {
      
      sync = $$('STDOUT').$sync();
      $$('STDOUT')['$sync='](true);
      label_width = ($truthy(($ret_or_1 = label_width)) ? ($ret_or_1) : (0));
      label_width = $rb_plus(label_width, 1);
      format = ($truthy(($ret_or_1 = format)) ? ($ret_or_1) : ($$('FORMAT')));
      if (!$truthy(caption['$empty?']())) {
        self.$print($rb_plus($rb_times(" ", label_width), caption))
      };
      report = $$('Report').$new(label_width, format);
      results = Opal.yield1($yield, report);
      if ($truthy(($ret_or_1 = $$('Array')['$==='](results)))) {
        $send(results.$grep($$('Tms')), 'each', [], function $$1(t){var self = $$1.$$s == null ? this : $$1.$$s, $ret_or_2 = nil, $ret_or_3 = nil;

          
          if (t == null) t = nil;
          return self.$print(($truthy(($ret_or_2 = ($truthy(($ret_or_3 = labels.$shift())) ? ($ret_or_3) : (t.$label())))) ? ($ret_or_2) : ("")).$ljust(label_width), t.$format(format));}, {$$s: self})
      } else {
        $ret_or_1
      };
      return report.$list();
      } finally {
        ($truthy(sync['$nil?']()) ? (nil) : (($e = [sync], $send($$('STDOUT'), 'sync=', $e), $e[$e.length - 1])))
      }; })();
    }, -1);
    
    $def(self, '$bm', function $$bm($a, $b) {
      var blk = $$bm.$$p || nil, $post_args, label_width, labels, self = this;

      $$bm.$$p = null;
      
      ;
      $post_args = $slice(arguments);
      
      if ($post_args.length > 0) label_width = $post_args.shift();if (label_width == null) label_width = 0;
      labels = $post_args;
      return $send(self, 'benchmark', [$$('CAPTION'), label_width, $$('FORMAT')].concat($to_a(labels)), blk.$to_proc());
    }, -1);
    
    $def(self, '$bmbm', function $$bmbm(width) {
      var $a, $yield = $$bmbm.$$p || nil, self = this, job = nil, sync = nil, ets = nil;

      $$bmbm.$$p = null;
      
      if (width == null) width = 0;
      return (function() { try {
      
      job = $$('Job').$new(width);
      Opal.yield1($yield, job);
      width = $rb_plus(job.$width(), 1);
      sync = $$('STDOUT').$sync();
      $$('STDOUT')['$sync='](true);
      self.$puts("Rehearsal ".$ljust($rb_plus(width, $$('CAPTION').$length()), "-"));
      ets = $send(job.$list(), 'inject', [$$('Tms').$new()], function $$2(sum, $mlhs_tmp1){var $a, $b, self = $$2.$$s == null ? this : $$2.$$s, label = nil, item = nil, res = nil;

        
        if (sum == null) sum = nil;
        if ($mlhs_tmp1 == null) $mlhs_tmp1 = nil;
        $b = $mlhs_tmp1, $a = $to_ary($b), (label = ($a[0] == null ? nil : $a[0])), (item = ($a[1] == null ? nil : $a[1])), $b;
        self.$print(label.$ljust(width));
        res = $send($$('Benchmark'), 'measure', [], item.$to_proc());
        self.$print(res.$format());
        return $rb_plus(sum, res);}, {$$s: self, $$has_top_level_mlhs_arg: true}).$format("total: %tsec");
      self.$print((((" ") + (ets)) + "\n\n").$rjust($rb_plus($rb_plus(width, $$('CAPTION').$length()), 2), "-"));
      self.$print($rb_plus($rb_times(" ", width), $$('CAPTION')));
      return $send(job.$list(), 'map', [], function $$3(label, item){var self = $$3.$$s == null ? this : $$3.$$s;

        
        if (label == null) label = nil;
        if (item == null) item = nil;
        $$('GC').$start();
        self.$print(label.$ljust(width));
        return $send($send($$('Benchmark'), 'measure', [label], item.$to_proc()), 'tap', [], function $$4(res){var self = $$4.$$s == null ? this : $$4.$$s;

          
          if (res == null) res = nil;
          return self.$print(res);}, {$$s: self});}, {$$s: self});
      } finally {
        ($truthy(sync['$nil?']()) ? (nil) : (($a = [sync], $send($$('STDOUT'), 'sync=', $a), $a[$a.length - 1])))
      }; })();
    }, -1);
    if ($truthy((($b = $$('Process', 'skip_raise')) && ($a = $$$($b, 'CLOCK_MONOTONIC', 'skip_raise')) ? 'constant' : nil))) {
      $const_set($nesting[0], 'BENCHMARK_CLOCK', $$$($$('Process'), 'CLOCK_MONOTONIC'))
    } else {
      $const_set($nesting[0], 'BENCHMARK_CLOCK', $$$($$('Process'), 'CLOCK_REALTIME'))
    };
    
    $def(self, '$measure', function $$measure(label) {
      var $a, $yield = $$measure.$$p || nil, t0 = nil, r0 = nil, t1 = nil, r1 = nil;

      $$measure.$$p = null;
      
      if (label == null) label = "";
      $a = [$$('Process').$times(), $$('Process').$clock_gettime($$('BENCHMARK_CLOCK'))], (t0 = $a[0]), (r0 = $a[1]), $a;
      Opal.yieldX($yield, []);
      $a = [$$('Process').$times(), $$('Process').$clock_gettime($$('BENCHMARK_CLOCK'))], (t1 = $a[0]), (r1 = $a[1]), $a;
      return $$$($$('Benchmark'), 'Tms').$new($rb_minus(t1.$utime(), t0.$utime()), $rb_minus(t1.$stime(), t0.$stime()), $rb_minus(t1.$cutime(), t0.$cutime()), $rb_minus(t1.$cstime(), t0.$cstime()), $rb_minus(r1, r0), label);
    }, -1);
    
    $def(self, '$realtime', function $$realtime() {
      var $yield = $$realtime.$$p || nil, r0 = nil;

      $$realtime.$$p = null;
      
      r0 = $$('Process').$clock_gettime($$('BENCHMARK_CLOCK'));
      Opal.yieldX($yield, []);
      return $rb_minus($$('Process').$clock_gettime($$('BENCHMARK_CLOCK')), r0);
    });
    self.$module_function("benchmark", "measure", "realtime", "bm", "bmbm");
    (function($base, $super, $parent_nesting) {
      var self = $klass($base, $super, 'Job');

      var $nesting = [self].concat($parent_nesting), $$ = Opal.$r($nesting), $proto = self.$$prototype;

      $proto.width = $proto.list = nil;
      
      
      $def(self, '$initialize', function $$initialize(width) {
        var self = this;

        
        self.width = width;
        return (self.list = []);
      });
      
      $def(self, '$item', function $$item(label) {
        var blk = $$item.$$p || nil, self = this, w = nil;

        $$item.$$p = null;
        
        ;
        if (label == null) label = "";
        if (!(blk !== nil)) {
          self.$raise($$('ArgumentError'), "no block")
        };
        label = label.$to_s();
        w = label.$length();
        if ($truthy($rb_lt(self.width, w))) {
          self.width = w
        };
        self.list['$<<']([label, blk]);
        return self;
      }, -1);
      $alias(self, "report", "item");
      self.$attr_reader("list");
      return self.$attr_reader("width");
    })($nesting[0], null, $nesting);
    (function($base, $super, $parent_nesting) {
      var self = $klass($base, $super, 'Report');

      var $nesting = [self].concat($parent_nesting), $$ = Opal.$r($nesting), $proto = self.$$prototype;

      $proto.width = $proto.list = $proto.format = nil;
      
      
      $def(self, '$initialize', function $$initialize(width, format) {
        var $a, self = this;

        
        if (width == null) width = 0;
        if (format == null) format = nil;
        return $a = [width, format, []], (self.width = $a[0]), (self.format = $a[1]), (self.list = $a[2]), $a;
      }, -1);
      
      $def(self, '$item', function $$item($a, $b) {
        var blk = $$item.$$p || nil, $post_args, label, format, self = this, res = nil;

        $$item.$$p = null;
        
        ;
        $post_args = $slice(arguments);
        
        if ($post_args.length > 0) label = $post_args.shift();if (label == null) label = "";
        format = $post_args;
        self.$print(label.$to_s().$ljust(self.width));
        self.list['$<<']((res = $send($$('Benchmark'), 'measure', [label], blk.$to_proc())));
        self.$print($send(res, 'format', [self.format].concat($to_a(format))));
        return res;
      }, -1);
      $alias(self, "report", "item");
      return self.$attr_reader("list");
    })($nesting[0], null, $nesting);
    (function($base, $super, $parent_nesting) {
      var self = $klass($base, $super, 'Tms');

      var $nesting = [self].concat($parent_nesting), $$ = Opal.$r($nesting), $proto = self.$$prototype;

      $proto.utime = $proto.stime = $proto.cutime = $proto.cstime = $proto.label = $proto.real = nil;
      
      $const_set($nesting[0], 'CAPTION', "      user     system      total        real\n");
      $const_set($nesting[0], 'FORMAT', "%10.6u %10.6y %10.6t %10.6r\n");
      self.$attr_reader("utime");
      self.$attr_reader("stime");
      self.$attr_reader("cutime");
      self.$attr_reader("cstime");
      self.$attr_reader("real");
      self.$attr_reader("total");
      self.$attr_reader("label");
      
      $def(self, '$initialize', function $$initialize(utime, stime, cutime, cstime, real, label) {
        var $a, self = this;

        
        if (utime == null) utime = 0.0;
        if (stime == null) stime = 0.0;
        if (cutime == null) cutime = 0.0;
        if (cstime == null) cstime = 0.0;
        if (real == null) real = 0.0;
        if (label == null) label = nil;
        $a = [utime, stime, cutime, cstime, real, label.$to_s()], (self.utime = $a[0]), (self.stime = $a[1]), (self.cutime = $a[2]), (self.cstime = $a[3]), (self.real = $a[4]), (self.label = $a[5]), $a;
        return (self.total = $rb_plus($rb_plus($rb_plus(self.utime, self.stime), self.cutime), self.cstime));
      }, -1);
      
      $def(self, '$add', function $$add() {
        var blk = $$add.$$p || nil, self = this;

        $$add.$$p = null;
        
        ;
        return $rb_plus(self, $send($$('Benchmark'), 'measure', [], blk.$to_proc()));
      });
      
      $def(self, '$add!', function $Tms_add$excl$5() {
        var blk = $Tms_add$excl$5.$$p || nil, self = this, t = nil;

        $Tms_add$excl$5.$$p = null;
        
        ;
        t = $send($$('Benchmark'), 'measure', [], blk.$to_proc());
        self.utime = $rb_plus(self.$utime(), t.$utime());
        self.stime = $rb_plus(self.$stime(), t.$stime());
        self.cutime = $rb_plus(self.$cutime(), t.$cutime());
        self.cstime = $rb_plus(self.$cstime(), t.$cstime());
        self.real = $rb_plus(self.$real(), t.$real());
        return self;
      });
      
      $def(self, '$+', function $Tms_$plus$6(other) {
        var self = this;

        return self.$memberwise("+", other)
      });
      
      $def(self, '$-', function $Tms_$minus$7(other) {
        var self = this;

        return self.$memberwise("-", other)
      });
      
      $def(self, '$*', function $Tms_$$8(x) {
        var self = this;

        return self.$memberwise("*", x)
      });
      
      $def(self, '$/', function $Tms_$slash$9(x) {
        var self = this;

        return self.$memberwise("/", x)
      });
      
      $def(self, '$format', function $$format($a, $b) {
        var $post_args, format, args, self = this, str = nil, $ret_or_1 = nil;

        
        $post_args = $slice(arguments);
        
        if ($post_args.length > 0) format = $post_args.shift();if (format == null) format = nil;
        args = $post_args;
        str = $send($send($send($send($send($send($send(($truthy(($ret_or_1 = format)) ? ($ret_or_1) : ($$('FORMAT'))).$dup(), 'gsub', [/(%[-+.\d]*)n/], function $$10(){var $c, self = $$10.$$s == null ? this : $$10.$$s;

          return (("" + ((($c = $gvars['~']) === nil ? nil : $c['$[]'](1)))) + "s")['$%'](self.$label())}, {$$s: self}), 'gsub', [/(%[-+.\d]*)u/], function $$11(){var $c, self = $$11.$$s == null ? this : $$11.$$s;

          return (("" + ((($c = $gvars['~']) === nil ? nil : $c['$[]'](1)))) + "f")['$%'](self.$utime())}, {$$s: self}), 'gsub', [/(%[-+.\d]*)y/], function $$12(){var $c, self = $$12.$$s == null ? this : $$12.$$s;

          return (("" + ((($c = $gvars['~']) === nil ? nil : $c['$[]'](1)))) + "f")['$%'](self.$stime())}, {$$s: self}), 'gsub', [/(%[-+.\d]*)U/], function $$13(){var $c, self = $$13.$$s == null ? this : $$13.$$s;

          return (("" + ((($c = $gvars['~']) === nil ? nil : $c['$[]'](1)))) + "f")['$%'](self.$cutime())}, {$$s: self}), 'gsub', [/(%[-+.\d]*)Y/], function $$14(){var $c, self = $$14.$$s == null ? this : $$14.$$s;

          return (("" + ((($c = $gvars['~']) === nil ? nil : $c['$[]'](1)))) + "f")['$%'](self.$cstime())}, {$$s: self}), 'gsub', [/(%[-+.\d]*)t/], function $$15(){var $c, self = $$15.$$s == null ? this : $$15.$$s;

          return (("" + ((($c = $gvars['~']) === nil ? nil : $c['$[]'](1)))) + "f")['$%'](self.$total())}, {$$s: self}), 'gsub', [/(%[-+.\d]*)r/], function $$16(){var $c, self = $$16.$$s == null ? this : $$16.$$s;

          return ((("(") + ((($c = $gvars['~']) === nil ? nil : $c['$[]'](1)))) + "f)")['$%'](self.$real())}, {$$s: self});
        if ($truthy(format)) {
          return str['$%'](args)
        } else {
          return str
        };
      }, -1);
      
      $def(self, '$to_s', function $$to_s() {
        var self = this;

        return self.$format()
      });
      
      $def(self, '$to_a', function $$to_a() {
        var self = this;

        return [self.label, self.utime, self.stime, self.cutime, self.cstime, self.real]
      });
      
      $def(self, '$to_h', function $$to_h() {
        var self = this;

        return $hash2(["label", "utime", "stime", "cutime", "cstime", "real"], {"label": self.label, "utime": self.utime, "stime": self.stime, "cutime": self.cutime, "cstime": self.cstime, "real": self.real})
      });
      self.$protected();
      return $def(self, '$memberwise', function $$memberwise(op, x) {
        var self = this, $ret_or_1 = nil;

        if ($eqeqeq($$$($$('Benchmark'), 'Tms'), ($ret_or_1 = x))) {
          return $$$($$('Benchmark'), 'Tms').$new(self.$utime().$__send__(op, x.$utime()), self.$stime().$__send__(op, x.$stime()), self.$cutime().$__send__(op, x.$cutime()), self.$cstime().$__send__(op, x.$cstime()), self.$real().$__send__(op, x.$real()))
        } else {
          return $$$($$('Benchmark'), 'Tms').$new(self.$utime().$__send__(op, x), self.$stime().$__send__(op, x), self.$cutime().$__send__(op, x), self.$cstime().$__send__(op, x), self.$real().$__send__(op, x))
        }
      });
    })($nesting[0], null, $nesting);
    $const_set($nesting[0], 'CAPTION', $$$($$$($$('Benchmark'), 'Tms'), 'CAPTION'));
    return $const_set($nesting[0], 'FORMAT', $$$($$$($$('Benchmark'), 'Tms'), 'FORMAT'));
  })($nesting[0], $nesting)
});
