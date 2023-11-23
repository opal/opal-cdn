Opal.modules["nashorn/io"] = function(Opal) {/* Generated by Opal 1.8.2 */
  var $gvars = Opal.gvars, $send = Opal.send, $a, nil = Opal.nil;
  if ($gvars.stdout == null) $gvars.stdout = nil;
  if ($gvars.stderr == null) $gvars.stderr = nil;

  Opal.add_stubs('write_proc=');
  
  $gvars.stdout['$write_proc='](function(s){print(s)});
  return ($a = [function(s){print(s)}], $send($gvars.stderr, 'write_proc=', $a), $a[$a.length - 1]);
};

Opal.modules["corelib/file"] = function(Opal) {/* Generated by Opal 1.8.2 */
  var $truthy = Opal.truthy, $klass = Opal.klass, $const_set = Opal.const_set, $Opal = Opal.Opal, $regexp = Opal.regexp, $rb_plus = Opal.rb_plus, $def = Opal.def, $Kernel = Opal.Kernel, $eqeq = Opal.eqeq, $rb_lt = Opal.rb_lt, $rb_minus = Opal.rb_minus, $range = Opal.range, $send = Opal.send, $slice = Opal.slice, $alias = Opal.alias, $nesting = [], nil = Opal.nil, $$$ = Opal.$$$;

  Opal.add_stubs('respond_to?,to_path,coerce_to!,pwd,split,sub,+,unshift,join,home,raise,start_with?,absolute_path,==,<,dirname,-,basename,empty?,rindex,[],length,nil?,gsub,find,=~,map,each_with_index,flatten,reject,to_proc,end_with?,expand_path,exist?');
  return (function($base, $super, $parent_nesting) {
    var self = $klass($base, $super, 'File');

    var $nesting = [self].concat($parent_nesting), windows_root_rx = nil;

    
    $const_set($nesting[0], 'Separator', $const_set($nesting[0], 'SEPARATOR', "/"));
    $const_set($nesting[0], 'ALT_SEPARATOR', nil);
    $const_set($nesting[0], 'PATH_SEPARATOR', ":");
    $const_set($nesting[0], 'FNM_SYSCASE', 0);
    windows_root_rx = /^[a-zA-Z]:(?:\\|\/)/;
    return (function(self, $parent_nesting) {
      var $nesting = [self].concat($parent_nesting), $$ = Opal.$r($nesting);

      
      
      $def(self, '$absolute_path', function $$absolute_path(path, basedir) {
        var sep = nil, sep_chars = nil, new_parts = nil, $ret_or_1 = nil, path_abs = nil, basedir_abs = nil, parts = nil, leading_sep = nil, abs = nil, new_path = nil;

        
        if (basedir == null) basedir = nil;
        sep = $$('SEPARATOR');
        sep_chars = $sep_chars();
        new_parts = [];
        path = ($truthy(path['$respond_to?']("to_path")) ? (path.$to_path()) : (path));
        path = $Opal['$coerce_to!'](path, $$$('String'), "to_str");
        basedir = ($truthy(($ret_or_1 = basedir)) ? ($ret_or_1) : ($$$('Dir').$pwd()));
        path_abs = path.substr(0, sep.length) === sep || windows_root_rx.test(path);
        basedir_abs = basedir.substr(0, sep.length) === sep || windows_root_rx.test(basedir);
        if ($truthy(path_abs)) {
          
          parts = path.$split($regexp(["[", sep_chars, "]"]));
          leading_sep = windows_root_rx.test(path) ? '' : path.$sub($regexp(["^([", sep_chars, "]+).*$"]), "\\1");
          abs = true;
        } else {
          
          parts = $rb_plus(basedir.$split($regexp(["[", sep_chars, "]"])), path.$split($regexp(["[", sep_chars, "]"])));
          leading_sep = windows_root_rx.test(basedir) ? '' : basedir.$sub($regexp(["^([", sep_chars, "]+).*$"]), "\\1");
          abs = basedir_abs;
        };
        
        var part;
        for (var i = 0, ii = parts.length; i < ii; i++) {
          part = parts[i];

          if (
            (part === nil) ||
            (part === ''  && ((new_parts.length === 0) || abs)) ||
            (part === '.' && ((new_parts.length === 0) || abs))
          ) {
            continue;
          }
          if (part === '..') {
            new_parts.pop();
          } else {
            new_parts.push(part);
          }
        }

        if (!abs && parts[0] !== '.') {
          new_parts.$unshift(".")
        }
      ;
        new_path = new_parts.$join(sep);
        if ($truthy(abs)) {
          new_path = $rb_plus(leading_sep, new_path)
        };
        return new_path;
      }, -2);
      
      $def(self, '$expand_path', function $$expand_path(path, basedir) {
        var self = this, sep = nil, sep_chars = nil, home = nil, leading_sep = nil, home_path_regexp = nil;

        
        if (basedir == null) basedir = nil;
        sep = $$('SEPARATOR');
        sep_chars = $sep_chars();
        if ($truthy(path[0] === '~' || (basedir && basedir[0] === '~'))) {
          
          home = $$('Dir').$home();
          if (!$truthy(home)) {
            $Kernel.$raise($$$('ArgumentError'), "couldn't find HOME environment -- expanding `~'")
          };
          leading_sep = windows_root_rx.test(home) ? '' : home.$sub($regexp(["^([", sep_chars, "]+).*$"]), "\\1");
          if (!$truthy(home['$start_with?'](leading_sep))) {
            $Kernel.$raise($$$('ArgumentError'), "non-absolute home")
          };
          home = $rb_plus(home, sep);
          home_path_regexp = $regexp(["^\\~(?:", sep, "|$)"]);
          path = path.$sub(home_path_regexp, home);
          if ($truthy(basedir)) {
            basedir = basedir.$sub(home_path_regexp, home)
          };
        };
        return self.$absolute_path(path, basedir);
      }, -2);
      
      // Coerce a given path to a path string using #to_path and #to_str
      function $coerce_to_path(path) {
        if ($truthy((path)['$respond_to?']("to_path"))) {
          path = path.$to_path();
        }

        path = $Opal['$coerce_to!'](path, $$$('String'), "to_str");

        return path;
      }

      // Return a RegExp compatible char class
      function $sep_chars() {
        if ($$('ALT_SEPARATOR') === nil) {
          return Opal.escape_regexp($$('SEPARATOR'));
        } else {
          return Opal.escape_regexp($rb_plus($$('SEPARATOR'), $$('ALT_SEPARATOR')));
        }
      }
    ;
      
      $def(self, '$dirname', function $$dirname(path, level) {
        var self = this, sep_chars = nil;

        
        if (level == null) level = 1;
        if ($eqeq(level, 0)) {
          return path
        };
        if ($truthy($rb_lt(level, 0))) {
          $Kernel.$raise($$$('ArgumentError'), "level can't be negative")
        };
        sep_chars = $sep_chars();
        path = $coerce_to_path(path);
        
        var absolute = path.match(new RegExp("^[" + (sep_chars) + "]")), out;

        path = path.replace(new RegExp("[" + (sep_chars) + "]+$"), ''); // remove trailing separators
        path = path.replace(new RegExp("[^" + (sep_chars) + "]+$"), ''); // remove trailing basename
        path = path.replace(new RegExp("[" + (sep_chars) + "]+$"), ''); // remove final trailing separators

        if (path === '') {
          out = absolute ? '/' : '.';
        }
        else {
          out = path;
        }

        if (level == 1) {
          return out;
        }
        else {
          return self.$dirname(out, $rb_minus(level, 1))
        }
      ;
      }, -2);
      
      $def(self, '$basename', function $$basename(name, suffix) {
        var sep_chars = nil;

        
        if (suffix == null) suffix = nil;
        sep_chars = $sep_chars();
        name = $coerce_to_path(name);
        
        if (name.length == 0) {
          return name;
        }

        if (suffix !== nil) {
          suffix = $Opal['$coerce_to!'](suffix, $$$('String'), "to_str")
        } else {
          suffix = null;
        }

        name = name.replace(new RegExp("(.)[" + (sep_chars) + "]*$"), '$1');
        name = name.replace(new RegExp("^(?:.*[" + (sep_chars) + "])?([^" + (sep_chars) + "]+)$"), '$1');

        if (suffix === ".*") {
          name = name.replace(/\.[^\.]+$/, '');
        } else if(suffix !== null) {
          suffix = Opal.escape_regexp(suffix);
          name = name.replace(new RegExp("" + (suffix) + "$"), '');
        }

        return name;
      ;
      }, -2);
      
      $def(self, '$extname', function $$extname(path) {
        var self = this, filename = nil, last_dot_idx = nil;

        
        path = $coerce_to_path(path);
        filename = self.$basename(path);
        if ($truthy(filename['$empty?']())) {
          return ""
        };
        last_dot_idx = filename['$[]']($range(1, -1, false)).$rindex(".");
        if (($truthy(last_dot_idx['$nil?']()) || ($eqeq($rb_plus(last_dot_idx, 1), $rb_minus(filename.$length(), 1))))) {
          return ""
        } else {
          return filename['$[]'](Opal.Range.$new($rb_plus(last_dot_idx, 1), -1, false))
        };
      });
      
      $def(self, '$exist?', function $exist$ques$1(path) {
        
        return Opal.modules[path] != null
      });
      
      $def(self, '$directory?', function $directory$ques$2(path) {
        var files = nil;

        
        files = [];
        
        for (var key in Opal.modules) {
          files.push(key)
        }
      ;
        path = path.$gsub($regexp(["(^.", $$('SEPARATOR'), "+|", $$('SEPARATOR'), "+$)"]));
        return $send(files, 'find', [], function $$3(f){
          
          if (f == null) f = nil;
          return f['$=~']($regexp(["^", path]));});
      });
      
      $def(self, '$join', function $$join($a) {
        var $post_args, paths, result = nil;

        
        $post_args = $slice(arguments);
        paths = $post_args;
        if ($truthy(paths['$empty?']())) {
          return ""
        };
        result = "";
        paths = $send(paths.$flatten().$each_with_index(), 'map', [], function $$4(item, index){
          
          if (item == null) item = nil;
          if (index == null) index = nil;
          if (($eqeq(index, 0) && ($truthy(item['$empty?']())))) {
            return $$('SEPARATOR')
          } else if (($eqeq(paths.$length(), $rb_plus(index, 1)) && ($truthy(item['$empty?']())))) {
            return $$('SEPARATOR')
          } else {
            return item
          };});
        paths = $send(paths, 'reject', [], "empty?".$to_proc());
        $send(paths, 'each_with_index', [], function $$5(item, index){var next_item = nil;

          
          if (item == null) item = nil;
          if (index == null) index = nil;
          next_item = paths['$[]']($rb_plus(index, 1));
          if ($truthy(next_item['$nil?']())) {
            return (result = "" + (result) + (item))
          } else {
            
            if (($truthy(item['$end_with?']($$('SEPARATOR'))) && ($truthy(next_item['$start_with?']($$('SEPARATOR')))))) {
              item = item.$sub($regexp([$$('SEPARATOR'), "+$"]), "")
            };
            return (result = (($truthy(item['$end_with?']($$('SEPARATOR'))) || ($truthy(next_item['$start_with?']($$('SEPARATOR'))))) ? ("" + (result) + (item)) : ("" + (result) + (item) + ($$('SEPARATOR')))));
          };});
        return result;
      }, -1);
      
      $def(self, '$split', function $$split(path) {
        
        return path.$split($$('SEPARATOR'))
      });
      $alias(self, "realpath", "expand_path");
      return $alias(self, "exists?", "exist?");
    })(Opal.get_singleton_class(self), $nesting);
  })('::', $$$('IO'), $nesting)
};

Opal.modules["nashorn/file"] = function(Opal) {/* Generated by Opal 1.8.2 */
  var $klass = Opal.klass, $defs = Opal.defs, self = Opal.top, $nesting = [], nil = Opal.nil;

  Opal.add_stubs('require');
  
  /* global Java */;
  self.$require("corelib/file");
  return (function($base, $super) {
    var self = $klass($base, $super, 'File');

    
    
    $defs(self, '$read', function $$read(path) {
      
      
        var Paths = Java.type('java.nio.file.Paths');
        var Files = Java.type('java.nio.file.Files');
        var lines = Files.readAllLines(Paths.get(path), Java.type('java.nio.charset.StandardCharsets').UTF_8);
        var data = [];
        lines.forEach(function(line) { data.push(line); });
        return data.join("\n");
      
    });
    $defs(self, '$file?', function $File_file$ques$1(path) {
      
      
      var Files = Java.type('java.nio.file.Files');
      return Files.exists(path) && Files.isRegularFile(path);
    
    });
    return $defs(self, '$readable?', function $File_readable$ques$2(path) {
      
      
      var Files = Java.type('java.nio.file.Files');
      return Files.exists(path) && Files.isReadable(path);
    
    });
  })($nesting[0], null);
};

Opal.modules["nashorn"] = function(Opal) {/* Generated by Opal 1.8.2 */
  var $module = Opal.module, self = Opal.top, $nesting = [], nil = Opal.nil;

  Opal.add_stubs('require');
  
  $module($nesting[0], 'Nashorn');
  self.$require("nashorn/io");
  return self.$require("nashorn/file");
};
