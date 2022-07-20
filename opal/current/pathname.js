Opal.modules["corelib/comparable"] = function(Opal) {/* Generated by Opal 1.5.1 */
  var nil = Opal.nil, $$$ = Opal.$$$, $truthy = Opal.truthy, $module = Opal.module, $rb_gt = Opal.rb_gt, $rb_lt = Opal.rb_lt, $eqeqeq = Opal.eqeqeq, $Kernel = Opal.Kernel, $def = Opal.def;

  Opal.add_stubs('>,<,===,raise,class,<=>,equal?');
  return (function($base) {
    var self = $module($base, 'Comparable');

    var $ret_or_1 = nil;

    
    
    function normalize(what) {
      if (Opal.is_a(what, Opal.Integer)) { return what; }

      if ($rb_gt(what, 0)) { return 1; }
      if ($rb_lt(what, 0)) { return -1; }
      return 0;
    }

    function fail_comparison(lhs, rhs) {
      var class_name;
      (($eqeqeq(nil, ($ret_or_1 = rhs)) || (($eqeqeq(true, $ret_or_1) || (($eqeqeq(false, $ret_or_1) || (($eqeqeq($$$('Integer'), $ret_or_1) || ($eqeqeq($$$('Float'), $ret_or_1))))))))) ? (class_name = rhs.$inspect()) : (class_name = rhs.$$class))
      $Kernel.$raise($$$('ArgumentError'), "comparison of " + ((lhs).$class()) + " with " + (class_name) + " failed")
    }

    function cmp_or_fail(lhs, rhs) {
      var cmp = (lhs)['$<=>'](rhs);
      if (!$truthy(cmp)) fail_comparison(lhs, rhs);
      return normalize(cmp);
    }
  ;
    
    $def(self, '$==', function $Comparable_$eq_eq$1(other) {
      var self = this, cmp = nil;

      
      if ($truthy(self['$equal?'](other))) {
        return true
      };
      
      if (self["$<=>"] == Opal.Kernel["$<=>"]) {
        return false;
      }

      // check for infinite recursion
      if (self.$$comparable) {
        delete self.$$comparable;
        return false;
      }
    ;
      if (!$truthy((cmp = self['$<=>'](other)))) {
        return false
      };
      return normalize(cmp) == 0;;
    }, 1);
    
    $def(self, '$>', function $Comparable_$gt$2(other) {
      var self = this;

      return cmp_or_fail(self, other) > 0;
    }, 1);
    
    $def(self, '$>=', function $Comparable_$gt_eq$3(other) {
      var self = this;

      return cmp_or_fail(self, other) >= 0;
    }, 1);
    
    $def(self, '$<', function $Comparable_$lt$4(other) {
      var self = this;

      return cmp_or_fail(self, other) < 0;
    }, 1);
    
    $def(self, '$<=', function $Comparable_$lt_eq$5(other) {
      var self = this;

      return cmp_or_fail(self, other) <= 0;
    }, 1);
    
    $def(self, '$between?', function $Comparable_between$ques$6(min, max) {
      var self = this;

      
      if ($rb_lt(self, min)) {
        return false
      };
      if ($rb_gt(self, max)) {
        return false
      };
      return true;
    }, 2);
    return $def(self, '$clamp', function $$clamp(min, max) {
      var self = this;

      
      
      if (max == null) max = nil;;
      
      var c, excl;

      if (max === nil) {
        // We are dealing with a new Ruby 2.7 behaviour that we are able to
        // provide a single Range argument instead of 2 Comparables.

        if (!Opal.is_a(min, Opal.Range)) {
          $Kernel.$raise($$$('TypeError'), "wrong argument type " + (min.$class()) + " (expected Range)")
        }

        excl = min.excl;
        max = min.end;
        min = min.begin;

        if (max !== nil && excl) {
          $Kernel.$raise($$$('ArgumentError'), "cannot clamp with an exclusive range")
        }
      }

      if (min !== nil && max !== nil && cmp_or_fail(min, max) > 0) {
        $Kernel.$raise($$$('ArgumentError'), "min argument must be smaller than max argument")
      }

      if (min !== nil) {
        c = cmp_or_fail(self, min);

        if (c == 0) return self;
        if (c < 0) return min;
      }

      if (max !== nil) {
        c = cmp_or_fail(self, max);

        if (c > 0) return max;
      }

      return self;
    ;
    }, -2);
  })('::')
};

Opal.modules["pathname"] = function(Opal) {/* Generated by Opal 1.5.1 */
  var self = Opal.top, $nesting = [], nil = Opal.nil, $$$ = Opal.$$$, $klass = Opal.klass, $const_set = Opal.const_set, $regexp = Opal.regexp, $eqeqeq = Opal.eqeqeq, $truthy = Opal.truthy, $eqeq = Opal.eqeq, $def = Opal.def, $defs = Opal.defs, $to_ary = Opal.to_ary, $send = Opal.send, $to_a = Opal.to_a, $return_ivar = Opal.return_ivar, $neqeq = Opal.neqeq, $rb_plus = Opal.rb_plus, $not = Opal.not, $alias = Opal.alias, $module = Opal.module;

  Opal.add_stubs('require,include,quote,===,to_s,path,respond_to?,to_path,is_a?,nil?,raise,class,==,new,pwd,attr_reader,!,relative?,chop_basename,basename,=~,source,[],rindex,sub,absolute?,expand_path,plus,unshift,length,!=,empty?,first,shift,+,join,dirname,pop,reverse_each,directory?,extname,<=>,nonzero?,proc,casecmp,cleanpath,inspect,include?,fill,map,entries');
  
  self.$require("corelib/comparable");
  (function($base, $super, $parent_nesting) {
    var self = $klass($base, $super, 'Pathname');

    var $nesting = [self].concat($parent_nesting), $$ = Opal.$r($nesting), $proto = self.$$prototype;

    $proto.path = nil;
    
    self.$include($$('Comparable'));
    $const_set($nesting[0], 'SEPARATOR_PAT', $regexp([$$('Regexp').$quote($$$($$('File'), 'SEPARATOR'))]));
    
    $def(self, '$initialize', function $$initialize(path) {
      var self = this;

      
      if ($eqeqeq($$('Pathname'), path)) {
        self.path = path.$path().$to_s()
      } else if ($truthy(path['$respond_to?']("to_path"))) {
        self.path = path.$to_path()
      } else if ($truthy(path['$is_a?']($$('String')))) {
        self.path = path
      } else if ($truthy(path['$nil?']())) {
        self.$raise($$('TypeError'), "no implicit conversion of nil into String")
      } else {
        self.$raise($$('TypeError'), "no implicit conversion of " + (path.$class()) + " into String")
      };
      if ($eqeq(self.path, "\u0000")) {
        return self.$raise($$('ArgumentError'))
      } else {
        return nil
      };
    }, 1);
    $defs(self, '$pwd', function $$pwd() {
      var self = this;

      return self.$new($$('Dir').$pwd())
    }, 0);
    self.$attr_reader("path");
    
    $def(self, '$==', function $Pathname_$eq_eq$1(other) {
      var self = this;

      return other.$path()['$=='](self.path)
    }, 1);
    
    $def(self, '$absolute?', function $Pathname_absolute$ques$2() {
      var self = this;

      return self['$relative?']()['$!']()
    }, 0);
    
    $def(self, '$relative?', function $Pathname_relative$ques$3() {
      var $a, $b, $c, self = this, path = nil, r = nil;

      
      path = self.path;
      while ($truthy((r = self.$chop_basename(path)))) {
        $c = r, $b = $to_ary($c), (path = ($b[0] == null ? nil : $b[0])), $c
      };
      return path['$==']("");
    }, 0);
    
    $def(self, '$chop_basename', function $$chop_basename(path) {
      var base = nil;

      
      base = $$('File').$basename(path);
      if ($truthy($$('Regexp').$new("^" + ($$$($$('Pathname'), 'SEPARATOR_PAT').$source()) + "?$")['$=~'](base))) {
        return nil
      } else {
        return [path['$[]'](0, path.$rindex(base)), base]
      };
    }, 1);
    
    $def(self, '$root?', function $Pathname_root$ques$4() {
      var self = this;

      return self.path['$==']("/")
    }, 0);
    
    $def(self, '$parent', function $$parent() {
      var self = this, new_path = nil;

      
      new_path = self.path.$sub(/\/([^\/]+\/?$)/, "");
      if ($eqeq(new_path, "")) {
        new_path = ($truthy(self['$absolute?']()) ? ("/") : ("."))
      };
      return $$('Pathname').$new(new_path);
    }, 0);
    
    $def(self, '$sub', function $$sub($a) {
      var $post_args, args, self = this;

      
      
      $post_args = Opal.slice.call(arguments);
      
      args = $post_args;;
      return $$('Pathname').$new($send(self.path, 'sub', $to_a(args)));
    }, -1);
    
    $def(self, '$cleanpath', function $$cleanpath() {
      var self = this;

      return Opal.normalize(self.path)
    }, 0);
    
    $def(self, '$to_path', $return_ivar("path"), 0);
    
    $def(self, '$hash', $return_ivar("path"), 0);
    
    $def(self, '$expand_path', function $$expand_path() {
      var self = this;

      return $$('Pathname').$new($$('File').$expand_path(self.path))
    }, 0);
    
    $def(self, '$+', function $Pathname_$plus$5(other) {
      var self = this;

      
      if (!$eqeqeq($$('Pathname'), other)) {
        other = $$('Pathname').$new(other)
      };
      return $$('Pathname').$new(self.$plus(self.path, other.$to_s()));
    }, 1);
    
    $def(self, '$plus', function $$plus(path1, path2) {
      var $a, $b, $c, self = this, prefix2 = nil, index_list2 = nil, basename_list2 = nil, r2 = nil, basename2 = nil, prefix1 = nil, $ret_or_1 = nil, r1 = nil, basename1 = nil, suffix2 = nil;

      
      prefix2 = path2;
      index_list2 = [];
      basename_list2 = [];
      while ($truthy((r2 = self.$chop_basename(prefix2)))) {
        
        $c = r2, $b = $to_ary($c), (prefix2 = ($b[0] == null ? nil : $b[0])), (basename2 = ($b[1] == null ? nil : $b[1])), $c;
        index_list2.$unshift(prefix2.$length());
        basename_list2.$unshift(basename2);
      };
      if ($neqeq(prefix2, "")) {
        return path2
      };
      prefix1 = path1;
      while ($truthy(true)) {
        
        while ($truthy(($truthy(($ret_or_1 = basename_list2['$empty?']()['$!']())) ? (basename_list2.$first()['$=='](".")) : ($ret_or_1)))) {
          
          index_list2.$shift();
          basename_list2.$shift();
        };
        if (!$truthy((r1 = self.$chop_basename(prefix1)))) {
          break;
        };
        $c = r1, $b = $to_ary($c), (prefix1 = ($b[0] == null ? nil : $b[0])), (basename1 = ($b[1] == null ? nil : $b[1])), $c;
        if ($eqeq(basename1, ".")) {
          continue;
        };
        if ((($eqeq(basename1, "..") || ($truthy(basename_list2['$empty?']()))) || ($neqeq(basename_list2.$first(), "..")))) {
          
          prefix1 = $rb_plus(prefix1, basename1);
          break;;
        };
        index_list2.$shift();
        basename_list2.$shift();
      };
      r1 = self.$chop_basename(prefix1);
      if (($not(r1) && ($truthy($regexp([$$('SEPARATOR_PAT')])['$=~']($$('File').$basename(prefix1)))))) {
        while ($truthy(($truthy(($ret_or_1 = basename_list2['$empty?']()['$!']())) ? (basename_list2.$first()['$==']("..")) : ($ret_or_1)))) {
          
          index_list2.$shift();
          basename_list2.$shift();
        }
      };
      if ($not(basename_list2['$empty?']())) {
        
        suffix2 = path2['$[]'](Opal.Range.$new(index_list2.$first(), -1, false));
        if ($truthy(r1)) {
          return $$('File').$join(prefix1, suffix2)
        } else {
          return $rb_plus(prefix1, suffix2)
        };
      } else if ($truthy(r1)) {
        return prefix1
      } else {
        return $$('File').$dirname(prefix1)
      };
    }, 2);
    
    $def(self, '$join', function $$join($a) {try {

      var $post_args, args, self = this, result = nil;

      
      
      $post_args = Opal.slice.call(arguments);
      
      args = $post_args;;
      if ($truthy(args['$empty?']())) {
        return self
      };
      result = args.$pop();
      if (!$eqeqeq($$('Pathname'), result)) {
        result = $$('Pathname').$new(result)
      };
      if ($truthy(result['$absolute?']())) {
        return result
      };
      $send(args, 'reverse_each', [], function $$6(arg){
        
        
        if (arg == null) arg = nil;;
        if (!$eqeqeq($$('Pathname'), arg)) {
          arg = $$('Pathname').$new(arg)
        };
        result = $rb_plus(arg, result);
        if ($truthy(result['$absolute?']())) {
          Opal.ret(result)
        } else {
          return nil
        };}, 1);
      return $rb_plus(self, result);
      } catch ($returner) { if ($returner === Opal.returner) { return $returner.$v } throw $returner; }
    }, -1);
    
    $def(self, '$split', function $$split() {
      var self = this;

      return [self.$dirname(), self.$basename()]
    }, 0);
    
    $def(self, '$dirname', function $$dirname() {
      var self = this;

      return $$('Pathname').$new($$('File').$dirname(self.path))
    }, 0);
    
    $def(self, '$basename', function $$basename() {
      var self = this;

      return $$('Pathname').$new($$('File').$basename(self.path))
    }, 0);
    
    $def(self, '$directory?', function $Pathname_directory$ques$7() {
      var self = this;

      return $$('File')['$directory?'](self.path)
    }, 0);
    
    $def(self, '$extname', function $$extname() {
      var self = this;

      return $$('File').$extname(self.path)
    }, 0);
    
    $def(self, '$<=>', function $Pathname_$lt_eq_gt$8(other) {
      var self = this;

      return self.$path()['$<=>'](other.$path())
    }, 1);
    $const_set($nesting[0], 'SAME_PATHS', ($truthy($$$($$('File'), 'FNM_SYSCASE')['$nonzero?']()) ? ($send(self, 'proc', [], function $Pathname$9(a, b){
      
      
      if (a == null) a = nil;;
      
      if (b == null) b = nil;;
      return a.$casecmp(b)['$=='](0);}, 2)) : ($send(self, 'proc', [], function $Pathname$10(a, b){
      
      
      if (a == null) a = nil;;
      
      if (b == null) b = nil;;
      return a['$=='](b);}, 2))));
    
    $def(self, '$relative_path_from', function $$relative_path_from(base_directory) {
      var $a, $b, $c, self = this, dest_directory = nil, dest_prefix = nil, dest_names = nil, r = nil, basename = nil, base_prefix = nil, base_names = nil, $ret_or_1 = nil, $ret_or_2 = nil, relpath_names = nil;

      
      dest_directory = self.$cleanpath().$to_s();
      base_directory = base_directory.$cleanpath().$to_s();
      dest_prefix = dest_directory;
      dest_names = [];
      while ($truthy((r = self.$chop_basename(dest_prefix)))) {
        
        $c = r, $b = $to_ary($c), (dest_prefix = ($b[0] == null ? nil : $b[0])), (basename = ($b[1] == null ? nil : $b[1])), $c;
        if ($neqeq(basename, ".")) {
          dest_names.$unshift(basename)
        };
      };
      base_prefix = base_directory;
      base_names = [];
      while ($truthy((r = self.$chop_basename(base_prefix)))) {
        
        $c = r, $b = $to_ary($c), (base_prefix = ($b[0] == null ? nil : $b[0])), (basename = ($b[1] == null ? nil : $b[1])), $c;
        if ($neqeq(basename, ".")) {
          base_names.$unshift(basename)
        };
      };
      if (!$truthy($$('SAME_PATHS')['$[]'](dest_prefix, base_prefix))) {
        self.$raise($$('ArgumentError'), "different prefix: " + (dest_prefix.$inspect()) + " and " + (base_directory.$inspect()))
      };
      while ($truthy(($truthy(($ret_or_1 = ($truthy(($ret_or_2 = dest_names['$empty?']()['$!']())) ? (base_names['$empty?']()['$!']()) : ($ret_or_2)))) ? ($$('SAME_PATHS')['$[]'](dest_names.$first(), base_names.$first())) : ($ret_or_1)))) {
        
        dest_names.$shift();
        base_names.$shift();
      };
      if ($truthy(base_names['$include?'](".."))) {
        self.$raise($$('ArgumentError'), "base_directory has ..: " + (base_directory.$inspect()))
      };
      base_names.$fill("..");
      relpath_names = $rb_plus(base_names, dest_names);
      if ($truthy(relpath_names['$empty?']())) {
        return $$('Pathname').$new(".")
      } else {
        return $$('Pathname').$new($send($$('File'), 'join', $to_a(relpath_names)))
      };
    }, 1);
    
    $def(self, '$entries', function $$entries() {
      var self = this;

      return $send($$('Dir').$entries(self.path), 'map', [], function $$11(f){var self = $$11.$$s == null ? this : $$11.$$s;

        
        
        if (f == null) f = nil;;
        return self.$class().$new(f);}, {$$arity: 1, $$s: self})
    }, 0);
    $alias(self, "===", "==");
    $alias(self, "eql?", "==");
    $alias(self, "to_s", "to_path");
    return $alias(self, "to_str", "to_path");
  })($nesting[0], null, $nesting);
  return (function($base, $parent_nesting) {
    var self = $module($base, 'Kernel');

    var $nesting = [self].concat($parent_nesting), $$ = Opal.$r($nesting);

    return $def(self, '$Pathname', function $$Pathname(path) {
      
      return $$('Pathname').$new(path)
    }, 1)
  })($nesting[0], $nesting);
};
