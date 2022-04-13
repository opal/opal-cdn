Opal.modules["quickjs/io"] = function(Opal) {/* Generated by Opal 1.5.0 */
  var nil = Opal.nil;

  
  Opal.gvars.stdout.write_proc = function(s) {
    std.out.printf("%s", s);
    std.out.flush();
  }

  Opal.gvars.stderr.write_proc = function(s) {
    std.err.printf("%s", s);
    std.err.flush();
  }

  Opal.gvars.stdin.read_proc = function(s) {
    if (std.in.eof()) {
      return nil;
    }
    else {
      return std.in.readAsString(s);
    }
  }

};

Opal.modules["quickjs/kernel"] = function(Opal) {/* Generated by Opal 1.5.0 */
  var $nesting = [], nil = Opal.nil, $const_set = Opal.const_set;

  
  $const_set($nesting[0], 'ARGV', scriptArgs);
  return Opal.exit = std.exit;;
};

Opal.modules["quickjs"] = function(Opal) {/* Generated by Opal 1.5.0 */
  var self = Opal.top, nil = Opal.nil;

  Opal.add_stubs('require');
  
  /* global std, scriptArgs */;
  self.$require("quickjs/io");
  return self.$require("quickjs/kernel");
};
