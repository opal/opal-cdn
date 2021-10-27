Opal.modules["corelib/comparable"] = function(Opal) {/* Generated by Opal 1.3.0 */
  function $rb_gt(lhs, rhs) {
    return (typeof(lhs) === 'number' && typeof(rhs) === 'number') ? lhs > rhs : lhs['$>'](rhs);
  }
  function $rb_lt(lhs, rhs) {
    return (typeof(lhs) === 'number' && typeof(rhs) === 'number') ? lhs < rhs : lhs['$<'](rhs);
  }
  var self = Opal.top, $nesting = [], nil = Opal.nil, $$$ = Opal.$$$, $$ = Opal.$$, $falsy = Opal.falsy, $module = Opal.module, $truthy = Opal.truthy;

  Opal.add_stubs(['$>', '$<', '$===', '$raise', '$class', '$<=>', '$equal?']);
  return (function($base, $parent_nesting) {
    var self = $module($base, 'Comparable');

    var $nesting = [self].concat($parent_nesting), $Comparable_$eq_eq$1, $Comparable_$gt$2, $Comparable_$gt_eq$3, $Comparable_$lt$4, $Comparable_$lt_eq$5, $Comparable_between$ques$6, $Comparable_clamp$7, $case = nil;

    
    
    function normalize(what) {
      if (Opal.is_a(what, Opal.Integer)) { return what; }

      if ($rb_gt(what, 0)) { return 1; }
      if ($rb_lt(what, 0)) { return -1; }
      return 0;
    }

    function fail_comparison(lhs, rhs) {
      var class_name;
      (function() {$case = rhs;
    if (nil['$===']($case) || true['$===']($case) || false['$===']($case) || $$($nesting, 'Integer')['$===']($case) || $$($nesting, 'Float')['$===']($case)) {return class_name = rhs.$inspect();}
    else {return class_name = rhs.$$class;}})()
      self.$raise($$($nesting, 'ArgumentError'), "" + "comparison of " + ((lhs).$class()) + " with " + (class_name) + " failed")
    }

    function cmp_or_fail(lhs, rhs) {
      var cmp = (lhs)['$<=>'](rhs);
      if ($falsy(cmp)) fail_comparison(lhs, rhs);
      return normalize(cmp);
    }
  ;
    
    Opal.def(self, '$==', $Comparable_$eq_eq$1 = function(other) {
      var self = this, cmp = nil;

      
      if ($truthy(self['$equal?'](other))) {
        return true};
      
      if (self["$<=>"] == Opal.Kernel["$<=>"]) {
        return false;
      }

      // check for infinite recursion
      if (self.$$comparable) {
        delete self.$$comparable;
        return false;
      }
    ;
      if ($truthy((cmp = self['$<=>'](other)))) {
      } else {
        return false
      };
      return normalize(cmp) == 0;;
    }, $Comparable_$eq_eq$1.$$arity = 1);
    
    Opal.def(self, '$>', $Comparable_$gt$2 = function(other) {
      var self = this;

      return cmp_or_fail(self, other) > 0;
    }, $Comparable_$gt$2.$$arity = 1);
    
    Opal.def(self, '$>=', $Comparable_$gt_eq$3 = function(other) {
      var self = this;

      return cmp_or_fail(self, other) >= 0;
    }, $Comparable_$gt_eq$3.$$arity = 1);
    
    Opal.def(self, '$<', $Comparable_$lt$4 = function(other) {
      var self = this;

      return cmp_or_fail(self, other) < 0;
    }, $Comparable_$lt$4.$$arity = 1);
    
    Opal.def(self, '$<=', $Comparable_$lt_eq$5 = function(other) {
      var self = this;

      return cmp_or_fail(self, other) <= 0;
    }, $Comparable_$lt_eq$5.$$arity = 1);
    
    Opal.def(self, '$between?', $Comparable_between$ques$6 = function(min, max) {
      var self = this;

      
      if ($rb_lt(self, min)) {
        return false};
      if ($rb_gt(self, max)) {
        return false};
      return true;
    }, $Comparable_between$ques$6.$$arity = 2);
    return (Opal.def(self, '$clamp', $Comparable_clamp$7 = function $$clamp(min, max) {
      var self = this;

      
      
      if (max == null) {
        max = nil;
      };
      
      var c, excl;

      if (max === nil) {
        // We are dealing with a new Ruby 2.7 behaviour that we are able to
        // provide a single Range argument instead of 2 Comparables.

        if (!Opal.is_a(min, Opal.Range)) {
          self.$raise($$($nesting, 'TypeError'), "" + "wrong argument type " + (min.$class()) + " (expected Range)")
        }

        excl = min.excl;
        max = min.end;
        min = min.begin;

        if (max !== nil && excl) {
          self.$raise($$($nesting, 'ArgumentError'), "cannot clamp with an exclusive range")
        }
      }

      if (min !== nil && max !== nil && cmp_or_fail(min, max) > 0) {
        self.$raise($$($nesting, 'ArgumentError'), "min argument must be smaller than max argument")
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
    }, $Comparable_clamp$7.$$arity = -2), nil) && 'clamp';
  })($nesting[0], $nesting)
};

Opal.modules["pathname"] = function(Opal) {/* Generated by Opal 1.3.0 */
  function $rb_plus(lhs, rhs) {
    return (typeof(lhs) === 'number' && typeof(rhs) === 'number') ? lhs + rhs : lhs['$+'](rhs);
  }
  var self = Opal.top, $nesting = [], nil = Opal.nil, $$$ = Opal.$$$, $$ = Opal.$$, $klass = Opal.klass, $truthy = Opal.truthy, $send = Opal.send, $alias = Opal.alias, $module = Opal.module;

  Opal.add_stubs(['$require', '$include', '$quote', '$===', '$to_s', '$path', '$respond_to?', '$to_path', '$is_a?', '$nil?', '$raise', '$class', '$==', '$new', '$pwd', '$attr_reader', '$!', '$relative?', '$chop_basename', '$basename', '$=~', '$source', '$[]', '$rindex', '$sub', '$absolute?', '$expand_path', '$plus', '$unshift', '$length', '$!=', '$empty?', '$first', '$shift', '$+', '$join', '$dirname', '$pop', '$reverse_each', '$directory?', '$extname', '$<=>', '$nonzero?', '$proc', '$casecmp', '$cleanpath', '$inspect', '$include?', '$fill', '$map', '$entries']);
  
  self.$require("corelib/comparable");
  (function($base, $super, $parent_nesting) {
    var self = $klass($base, $super, 'Pathname');

    var $nesting = [self].concat($parent_nesting), $Pathname_initialize$1, $Pathname_pwd$2, $Pathname_$eq_eq$3, $Pathname_absolute$ques$4, $Pathname_relative$ques$5, $Pathname_chop_basename$6, $Pathname_root$ques$7, $Pathname_parent$8, $Pathname_sub$9, $Pathname_cleanpath$10, $Pathname_to_path$11, $Pathname_hash$12, $Pathname_expand_path$13, $Pathname_$plus$14, $Pathname_plus$15, $Pathname_join$16, $Pathname_split$18, $Pathname_dirname$19, $Pathname_basename$20, $Pathname_directory$ques$21, $Pathname_extname$22, $Pathname_$lt_eq_gt$23, $Pathname$24, $Pathname$25, $Pathname_relative_path_from$26, $Pathname_entries$27;

    self.$$prototype.path = nil;
    
    self.$include($$($nesting, 'Comparable'));
    Opal.const_set($nesting[0], 'SEPARATOR_PAT', Opal.regexp([$$($nesting, 'Regexp').$quote($$$($$($nesting, 'File'), 'SEPARATOR'))]));
    
    Opal.def(self, '$initialize', $Pathname_initialize$1 = function $$initialize(path) {
      var self = this;

      
      if ($truthy($$($nesting, 'Pathname')['$==='](path))) {
        self.path = path.$path().$to_s()
      } else if ($truthy(path['$respond_to?']("to_path"))) {
        self.path = path.$to_path()
      } else if ($truthy(path['$is_a?']($$($nesting, 'String')))) {
        self.path = path
      } else if ($truthy(path['$nil?']())) {
        self.$raise($$($nesting, 'TypeError'), "no implicit conversion of nil into String")
      } else {
        self.$raise($$($nesting, 'TypeError'), "" + "no implicit conversion of " + (path.$class()) + " into String")
      };
      if (self.path['$==']("\u0000")) {
        return self.$raise($$($nesting, 'ArgumentError'))
      } else {
        return nil
      };
    }, $Pathname_initialize$1.$$arity = 1);
    Opal.defs(self, '$pwd', $Pathname_pwd$2 = function $$pwd() {
      var self = this;

      return self.$new($$($nesting, 'Dir').$pwd())
    }, $Pathname_pwd$2.$$arity = 0);
    self.$attr_reader("path");
    
    Opal.def(self, '$==', $Pathname_$eq_eq$3 = function(other) {
      var self = this;

      return other.$path()['$=='](self.path)
    }, $Pathname_$eq_eq$3.$$arity = 1);
    
    Opal.def(self, '$absolute?', $Pathname_absolute$ques$4 = function() {
      var self = this;

      return self['$relative?']()['$!']()
    }, $Pathname_absolute$ques$4.$$arity = 0);
    
    Opal.def(self, '$relative?', $Pathname_relative$ques$5 = function() {
      var $a, $b, $c, self = this, path = nil, r = nil;

      
      path = self.path;
      while ($truthy((r = self.$chop_basename(path)))) {
        $c = r, $b = Opal.to_ary($c), (path = ($b[0] == null ? nil : $b[0])), $c
      };
      return path['$==']("");
    }, $Pathname_relative$ques$5.$$arity = 0);
    
    Opal.def(self, '$chop_basename', $Pathname_chop_basename$6 = function $$chop_basename(path) {
      var self = this, base = nil;

      
      base = $$($nesting, 'File').$basename(path);
      if ($truthy($$($nesting, 'Regexp').$new("" + "^" + ($$$($$($nesting, 'Pathname'), 'SEPARATOR_PAT').$source()) + "?$")['$=~'](base))) {
        return nil
      } else {
        return [path['$[]'](0, path.$rindex(base)), base]
      };
    }, $Pathname_chop_basename$6.$$arity = 1);
    
    Opal.def(self, '$root?', $Pathname_root$ques$7 = function() {
      var self = this;

      return self.path['$==']("/")
    }, $Pathname_root$ques$7.$$arity = 0);
    
    Opal.def(self, '$parent', $Pathname_parent$8 = function $$parent() {
      var self = this, new_path = nil;

      
      new_path = self.path.$sub(/\/([^\/]+\/?$)/, "");
      if (new_path['$==']("")) {
        new_path = (function() {if ($truthy(self['$absolute?']())) {
          return "/"
        } else {
          return "."
        }; return nil; })()};
      return $$($nesting, 'Pathname').$new(new_path);
    }, $Pathname_parent$8.$$arity = 0);
    
    Opal.def(self, '$sub', $Pathname_sub$9 = function $$sub($a) {
      var $post_args, args, self = this;

      
      
      $post_args = Opal.slice.call(arguments, 0, arguments.length);
      
      args = $post_args;;
      return $$($nesting, 'Pathname').$new($send(self.path, 'sub', Opal.to_a(args)));
    }, $Pathname_sub$9.$$arity = -1);
    
    Opal.def(self, '$cleanpath', $Pathname_cleanpath$10 = function $$cleanpath() {
      var self = this;

      return Opal.normalize(self.path)
    }, $Pathname_cleanpath$10.$$arity = 0);
    
    Opal.def(self, '$to_path', $Pathname_to_path$11 = function $$to_path() {
      var self = this;

      return self.path
    }, $Pathname_to_path$11.$$arity = 0);
    
    Opal.def(self, '$hash', $Pathname_hash$12 = function $$hash() {
      var self = this;

      return self.path
    }, $Pathname_hash$12.$$arity = 0);
    
    Opal.def(self, '$expand_path', $Pathname_expand_path$13 = function $$expand_path() {
      var self = this;

      return $$($nesting, 'Pathname').$new($$($nesting, 'File').$expand_path(self.path))
    }, $Pathname_expand_path$13.$$arity = 0);
    
    Opal.def(self, '$+', $Pathname_$plus$14 = function(other) {
      var self = this;

      
      if ($truthy($$($nesting, 'Pathname')['$==='](other))) {
      } else {
        other = $$($nesting, 'Pathname').$new(other)
      };
      return $$($nesting, 'Pathname').$new(self.$plus(self.path, other.$to_s()));
    }, $Pathname_$plus$14.$$arity = 1);
    
    Opal.def(self, '$plus', $Pathname_plus$15 = function $$plus(path1, path2) {
      var $a, $b, $c, self = this, prefix2 = nil, index_list2 = nil, basename_list2 = nil, r2 = nil, basename2 = nil, prefix1 = nil, $ret_or_1 = nil, r1 = nil, basename1 = nil, $ret_or_2 = nil, $ret_or_3 = nil, $ret_or_4 = nil, $ret_or_5 = nil, suffix2 = nil;

      
      prefix2 = path2;
      index_list2 = [];
      basename_list2 = [];
      while ($truthy((r2 = self.$chop_basename(prefix2)))) {
        
        $c = r2, $b = Opal.to_ary($c), (prefix2 = ($b[0] == null ? nil : $b[0])), (basename2 = ($b[1] == null ? nil : $b[1])), $c;
        index_list2.$unshift(prefix2.$length());
        basename_list2.$unshift(basename2);
      };
      if ($truthy(prefix2['$!='](""))) {
        return path2};
      prefix1 = path1;
      while ($truthy(true)) {
        
        while ($truthy((function() {if ($truthy(($ret_or_1 = basename_list2['$empty?']()['$!']()))) {
          return basename_list2.$first()['$=='](".")
        } else {
          return $ret_or_1
        }; return nil; })())) {
          
          index_list2.$shift();
          basename_list2.$shift();
        };
        if ($truthy((r1 = self.$chop_basename(prefix1)))) {
        } else {
          break;
        };
        $c = r1, $b = Opal.to_ary($c), (prefix1 = ($b[0] == null ? nil : $b[0])), (basename1 = ($b[1] == null ? nil : $b[1])), $c;
        if (basename1['$=='](".")) {
          continue;};
        if ($truthy((function() {if ($truthy(($ret_or_2 = (function() {if ($truthy(($ret_or_3 = basename1['$==']("..")))) {
          return $ret_or_3
        } else {
          return basename_list2['$empty?']()
        }; return nil; })()))) {
          return $ret_or_2
        } else {
          return basename_list2.$first()['$!=']("..")
        }; return nil; })())) {
          
          prefix1 = $rb_plus(prefix1, basename1);
          break;;};
        index_list2.$shift();
        basename_list2.$shift();
      };
      r1 = self.$chop_basename(prefix1);
      if ($truthy((function() {if ($truthy(($ret_or_4 = r1['$!']()))) {
        return Opal.regexp([$$($nesting, 'SEPARATOR_PAT')])['$=~']($$($nesting, 'File').$basename(prefix1))
      } else {
        return $ret_or_4
      }; return nil; })())) {
        while ($truthy((function() {if ($truthy(($ret_or_5 = basename_list2['$empty?']()['$!']()))) {
          return basename_list2.$first()['$==']("..")
        } else {
          return $ret_or_5
        }; return nil; })())) {
          
          index_list2.$shift();
          basename_list2.$shift();
        }};
      if ($truthy(basename_list2['$empty?']()['$!']())) {
        
        suffix2 = path2['$[]'](Opal.Range.$new(index_list2.$first(), -1, false));
        if ($truthy(r1)) {
          return $$($nesting, 'File').$join(prefix1, suffix2)
        } else {
          return $rb_plus(prefix1, suffix2)
        };
      } else if ($truthy(r1)) {
        return prefix1
      } else {
        return $$($nesting, 'File').$dirname(prefix1)
      };
    }, $Pathname_plus$15.$$arity = 2);
    
    Opal.def(self, '$join', $Pathname_join$16 = function $$join($a) {try {

      var $post_args, args, $$17, self = this, result = nil;

      
      
      $post_args = Opal.slice.call(arguments, 0, arguments.length);
      
      args = $post_args;;
      if ($truthy(args['$empty?']())) {
        return self};
      result = args.$pop();
      if ($truthy($$($nesting, 'Pathname')['$==='](result))) {
      } else {
        result = $$($nesting, 'Pathname').$new(result)
      };
      if ($truthy(result['$absolute?']())) {
        return result};
      $send(args, 'reverse_each', [], ($$17 = function(arg){var self = $$17.$$s == null ? this : $$17.$$s;

        
        
        if (arg == null) {
          arg = nil;
        };
        if ($truthy($$($nesting, 'Pathname')['$==='](arg))) {
        } else {
          arg = $$($nesting, 'Pathname').$new(arg)
        };
        result = $rb_plus(arg, result);
        if ($truthy(result['$absolute?']())) {
          Opal.ret(result)
        } else {
          return nil
        };}, $$17.$$s = self, $$17.$$arity = 1, $$17));
      return $rb_plus(self, result);
      } catch ($returner) { if ($returner === Opal.returner) { return $returner.$v } throw $returner; }
    }, $Pathname_join$16.$$arity = -1);
    
    Opal.def(self, '$split', $Pathname_split$18 = function $$split() {
      var self = this;

      return [self.$dirname(), self.$basename()]
    }, $Pathname_split$18.$$arity = 0);
    
    Opal.def(self, '$dirname', $Pathname_dirname$19 = function $$dirname() {
      var self = this;

      return $$($nesting, 'Pathname').$new($$($nesting, 'File').$dirname(self.path))
    }, $Pathname_dirname$19.$$arity = 0);
    
    Opal.def(self, '$basename', $Pathname_basename$20 = function $$basename() {
      var self = this;

      return $$($nesting, 'Pathname').$new($$($nesting, 'File').$basename(self.path))
    }, $Pathname_basename$20.$$arity = 0);
    
    Opal.def(self, '$directory?', $Pathname_directory$ques$21 = function() {
      var self = this;

      return $$($nesting, 'File')['$directory?'](self.path)
    }, $Pathname_directory$ques$21.$$arity = 0);
    
    Opal.def(self, '$extname', $Pathname_extname$22 = function $$extname() {
      var self = this;

      return $$($nesting, 'File').$extname(self.path)
    }, $Pathname_extname$22.$$arity = 0);
    
    Opal.def(self, '$<=>', $Pathname_$lt_eq_gt$23 = function(other) {
      var self = this;

      return self.$path()['$<=>'](other.$path())
    }, $Pathname_$lt_eq_gt$23.$$arity = 1);
    $alias(self, "eql?", "==");
    $alias(self, "===", "==");
    $alias(self, "to_str", "to_path");
    $alias(self, "to_s", "to_path");
    Opal.const_set($nesting[0], 'SAME_PATHS', (function() {if ($truthy($$$($$($nesting, 'File'), 'FNM_SYSCASE')['$nonzero?']())) {
      return $send(self, 'proc', [], ($Pathname$24 = function(a, b){var self = $Pathname$24.$$s == null ? this : $Pathname$24.$$s;

        
        
        if (a == null) {
          a = nil;
        };
        
        if (b == null) {
          b = nil;
        };
        return a.$casecmp(b)['$=='](0);}, $Pathname$24.$$s = self, $Pathname$24.$$arity = 2, $Pathname$24))
    } else {
      return $send(self, 'proc', [], ($Pathname$25 = function(a, b){var self = $Pathname$25.$$s == null ? this : $Pathname$25.$$s;

        
        
        if (a == null) {
          a = nil;
        };
        
        if (b == null) {
          b = nil;
        };
        return a['$=='](b);}, $Pathname$25.$$s = self, $Pathname$25.$$arity = 2, $Pathname$25))
    }; return nil; })());
    
    Opal.def(self, '$relative_path_from', $Pathname_relative_path_from$26 = function $$relative_path_from(base_directory) {
      var $a, $b, $c, self = this, dest_directory = nil, dest_prefix = nil, dest_names = nil, r = nil, basename = nil, base_prefix = nil, base_names = nil, $ret_or_6 = nil, $ret_or_7 = nil, relpath_names = nil;

      
      dest_directory = self.$cleanpath().$to_s();
      base_directory = base_directory.$cleanpath().$to_s();
      dest_prefix = dest_directory;
      dest_names = [];
      while ($truthy((r = self.$chop_basename(dest_prefix)))) {
        
        $c = r, $b = Opal.to_ary($c), (dest_prefix = ($b[0] == null ? nil : $b[0])), (basename = ($b[1] == null ? nil : $b[1])), $c;
        if ($truthy(basename['$!=']("."))) {
          dest_names.$unshift(basename)};
      };
      base_prefix = base_directory;
      base_names = [];
      while ($truthy((r = self.$chop_basename(base_prefix)))) {
        
        $c = r, $b = Opal.to_ary($c), (base_prefix = ($b[0] == null ? nil : $b[0])), (basename = ($b[1] == null ? nil : $b[1])), $c;
        if ($truthy(basename['$!=']("."))) {
          base_names.$unshift(basename)};
      };
      if ($truthy($$($nesting, 'SAME_PATHS')['$[]'](dest_prefix, base_prefix))) {
      } else {
        self.$raise($$($nesting, 'ArgumentError'), "" + "different prefix: " + (dest_prefix.$inspect()) + " and " + (base_directory.$inspect()))
      };
      while ($truthy((function() {if ($truthy(($ret_or_6 = (function() {if ($truthy(($ret_or_7 = dest_names['$empty?']()['$!']()))) {
        return base_names['$empty?']()['$!']()
      } else {
        return $ret_or_7
      }; return nil; })()))) {
        return $$($nesting, 'SAME_PATHS')['$[]'](dest_names.$first(), base_names.$first())
      } else {
        return $ret_or_6
      }; return nil; })())) {
        
        dest_names.$shift();
        base_names.$shift();
      };
      if ($truthy(base_names['$include?'](".."))) {
        self.$raise($$($nesting, 'ArgumentError'), "" + "base_directory has ..: " + (base_directory.$inspect()))};
      base_names.$fill("..");
      relpath_names = $rb_plus(base_names, dest_names);
      if ($truthy(relpath_names['$empty?']())) {
        return $$($nesting, 'Pathname').$new(".")
      } else {
        return $$($nesting, 'Pathname').$new($send($$($nesting, 'File'), 'join', Opal.to_a(relpath_names)))
      };
    }, $Pathname_relative_path_from$26.$$arity = 1);
    return (Opal.def(self, '$entries', $Pathname_entries$27 = function $$entries() {
      var $$28, self = this;

      return $send($$($nesting, 'Dir').$entries(self.path), 'map', [], ($$28 = function(f){var self = $$28.$$s == null ? this : $$28.$$s;

        
        
        if (f == null) {
          f = nil;
        };
        return self.$class().$new(f);}, $$28.$$s = self, $$28.$$arity = 1, $$28))
    }, $Pathname_entries$27.$$arity = 0), nil) && 'entries';
  })($nesting[0], null, $nesting);
  return (function($base, $parent_nesting) {
    var self = $module($base, 'Kernel');

    var $nesting = [self].concat($parent_nesting), $Kernel_Pathname$29;

    return (Opal.def(self, '$Pathname', $Kernel_Pathname$29 = function $$Pathname(path) {
      var self = this;

      return $$($nesting, 'Pathname').$new(path)
    }, $Kernel_Pathname$29.$$arity = 1), nil) && 'Pathname'
  })($nesting[0], $nesting);
};
