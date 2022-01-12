Opal.modules["gjs/io"] = function(Opal) {/* Generated by Opal 1.4.1 */
  var nil = Opal.nil;

  
  /* global imports */;
  
  var GLib = imports.gi.GLib;
  var ByteArray = imports.byteArray;

  var stdin = GLib.IOChannel.unix_new(0);
  var stdout = GLib.IOChannel.unix_new(1);
  var stderr = GLib.IOChannel.unix_new(2);

  Opal.gvars.stdout.write_proc = function(s) {
    var buf = ByteArray.fromString(s);
    stdout.write_chars(buf, buf.length);
    stdout.flush();
  }

  Opal.gvars.stderr.write_proc = function(s) {
    var buf = ByteArray.fromString(s);
    stderr.write_chars(buf, buf.length);
    stderr.flush();
  }

  Opal.gvars.stdin.read_proc = function(_s) {
    var out = stdin.read_line();
    if (out[0] == GLib.IOStatus.EOF) return nil;
    return out[1].toString();
  }
;
};

Opal.modules["gjs/kernel"] = function(Opal) {/* Generated by Opal 1.4.1 */
  var $nesting = [], nil = Opal.nil, $const_set = Opal.const_set;

  
  /* global ARGV */;
  $const_set($nesting[0], 'ARGV', ARGV);
  return Opal.exit = imports.system.exit;;
};

Opal.modules["gjs"] = function(Opal) {/* Generated by Opal 1.4.1 */
  var self = Opal.top, nil = Opal.nil;

  Opal.add_stubs('require');
  
  self.$require("gjs/io");
  return self.$require("gjs/kernel");
};
