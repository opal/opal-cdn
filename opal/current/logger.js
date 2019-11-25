/* Generated by Opal 1.0.0 */
Opal.modules["logger"] = function(Opal) {
  function $rb_plus(lhs, rhs) {
    return (typeof(lhs) === 'number' && typeof(rhs) === 'number') ? lhs + rhs : lhs['$+'](rhs);
  }
  function $rb_le(lhs, rhs) {
    return (typeof(lhs) === 'number' && typeof(rhs) === 'number') ? lhs <= rhs : lhs['$<='](rhs);
  }
  function $rb_lt(lhs, rhs) {
    return (typeof(lhs) === 'number' && typeof(rhs) === 'number') ? lhs < rhs : lhs['$<'](rhs);
  }
  var self = Opal.top, $nesting = [], nil = Opal.nil, $$$ = Opal.const_get_qualified, $$ = Opal.const_get_relative, $breaker = Opal.breaker, $slice = Opal.slice, $klass = Opal.klass, $module = Opal.module, $send = Opal.send, $truthy = Opal.truthy;

  Opal.add_stubs(['$include', '$to_h', '$map', '$constants', '$const_get', '$to_s', '$format', '$chr', '$strftime', '$message_as_string', '$===', '$+', '$message', '$class', '$join', '$backtrace', '$inspect', '$attr_reader', '$attr_accessor', '$new', '$key', '$upcase', '$raise', '$add', '$to_proc', '$<=', '$<', '$write', '$call', '$[]', '$now']);
  return (function($base, $super, $parent_nesting) {
    var self = $klass($base, $super, 'Logger');

    var $nesting = [self].concat($parent_nesting), $Logger$1, $Logger_initialize$4, $Logger_level$eq$5, $Logger_info$6, $Logger_debug$7, $Logger_warn$8, $Logger_error$9, $Logger_fatal$10, $Logger_unknown$11, $Logger_info$ques$12, $Logger_debug$ques$13, $Logger_warn$ques$14, $Logger_error$ques$15, $Logger_fatal$ques$16, $Logger_add$17;

    self.$$prototype.level = self.$$prototype.progname = self.$$prototype.pipe = self.$$prototype.formatter = nil;
    
    (function($base, $parent_nesting) {
      var self = $module($base, 'Severity');

      var $nesting = [self].concat($parent_nesting);

      
      Opal.const_set($nesting[0], 'DEBUG', 0);
      Opal.const_set($nesting[0], 'INFO', 1);
      Opal.const_set($nesting[0], 'WARN', 2);
      Opal.const_set($nesting[0], 'ERROR', 3);
      Opal.const_set($nesting[0], 'FATAL', 4);
      Opal.const_set($nesting[0], 'UNKNOWN', 5);
    })($nesting[0], $nesting);
    self.$include($$($nesting, 'Severity'));
    Opal.const_set($nesting[0], 'SEVERITY_LABELS', $send($$($nesting, 'Severity').$constants(), 'map', [], ($Logger$1 = function(s){var self = $Logger$1.$$s || this;

    
      
      if (s == null) {
        s = nil;
      };
      return [$$($nesting, 'Severity').$const_get(s), s.$to_s()];}, $Logger$1.$$s = self, $Logger$1.$$arity = 1, $Logger$1)).$to_h());
    (function($base, $super, $parent_nesting) {
      var self = $klass($base, $super, 'Formatter');

      var $nesting = [self].concat($parent_nesting), $Formatter_call$2, $Formatter_message_as_string$3;

      
      Opal.const_set($nesting[0], 'MESSAGE_FORMAT', "%s, [%s] %5s -- %s: %s\n");
      Opal.const_set($nesting[0], 'DATE_TIME_FORMAT', "%Y-%m-%dT%H:%M:%S.%6N");
      
      Opal.def(self, '$call', $Formatter_call$2 = function $$call(severity, time, progname, msg) {
        var self = this;

        return self.$format($$($nesting, 'MESSAGE_FORMAT'), severity.$chr(), time.$strftime($$($nesting, 'DATE_TIME_FORMAT')), severity, progname, self.$message_as_string(msg))
      }, $Formatter_call$2.$$arity = 4);
      return (Opal.def(self, '$message_as_string', $Formatter_message_as_string$3 = function $$message_as_string(msg) {
        var $a, self = this, $case = nil;

        return (function() {$case = msg;
        if ($$$('::', 'String')['$===']($case)) {return msg}
        else if ($$$('::', 'Exception')['$===']($case)) {return $rb_plus("" + (msg.$message()) + " (" + (msg.$class()) + ")\n", ($truthy($a = msg.$backtrace()) ? $a : []).$join("\n"))}
        else {return msg.$inspect()}})()
      }, $Formatter_message_as_string$3.$$arity = 1), nil) && 'message_as_string';
    })($nesting[0], null, $nesting);
    self.$attr_reader("level");
    self.$attr_accessor("progname");
    self.$attr_accessor("formatter");
    
    Opal.def(self, '$initialize', $Logger_initialize$4 = function $$initialize(pipe) {
      var self = this;

      
      self.pipe = pipe;
      self.level = $$($nesting, 'DEBUG');
      return (self.formatter = $$($nesting, 'Formatter').$new());
    }, $Logger_initialize$4.$$arity = 1);
    
    Opal.def(self, '$level=', $Logger_level$eq$5 = function(severity) {
      var self = this, level = nil;

      if ($truthy($$$('::', 'Integer')['$==='](severity))) {
        return (self.level = severity)
      } else if ($truthy((level = $$($nesting, 'SEVERITY_LABELS').$key(severity.$to_s().$upcase())))) {
        return (self.level = level)
      } else {
        return self.$raise($$($nesting, 'ArgumentError'), "" + "invalid log level: " + (severity))
      }
    }, $Logger_level$eq$5.$$arity = 1);
    
    Opal.def(self, '$info', $Logger_info$6 = function $$info(progname) {
      var $iter = $Logger_info$6.$$p, block = $iter || nil, self = this;

      if ($iter) $Logger_info$6.$$p = null;
      
      
      if ($iter) $Logger_info$6.$$p = null;;
      
      if (progname == null) {
        progname = nil;
      };
      return $send(self, 'add', [$$($nesting, 'INFO'), nil, progname], block.$to_proc());
    }, $Logger_info$6.$$arity = -1);
    
    Opal.def(self, '$debug', $Logger_debug$7 = function $$debug(progname) {
      var $iter = $Logger_debug$7.$$p, block = $iter || nil, self = this;

      if ($iter) $Logger_debug$7.$$p = null;
      
      
      if ($iter) $Logger_debug$7.$$p = null;;
      
      if (progname == null) {
        progname = nil;
      };
      return $send(self, 'add', [$$($nesting, 'DEBUG'), nil, progname], block.$to_proc());
    }, $Logger_debug$7.$$arity = -1);
    
    Opal.def(self, '$warn', $Logger_warn$8 = function $$warn(progname) {
      var $iter = $Logger_warn$8.$$p, block = $iter || nil, self = this;

      if ($iter) $Logger_warn$8.$$p = null;
      
      
      if ($iter) $Logger_warn$8.$$p = null;;
      
      if (progname == null) {
        progname = nil;
      };
      return $send(self, 'add', [$$($nesting, 'WARN'), nil, progname], block.$to_proc());
    }, $Logger_warn$8.$$arity = -1);
    
    Opal.def(self, '$error', $Logger_error$9 = function $$error(progname) {
      var $iter = $Logger_error$9.$$p, block = $iter || nil, self = this;

      if ($iter) $Logger_error$9.$$p = null;
      
      
      if ($iter) $Logger_error$9.$$p = null;;
      
      if (progname == null) {
        progname = nil;
      };
      return $send(self, 'add', [$$($nesting, 'ERROR'), nil, progname], block.$to_proc());
    }, $Logger_error$9.$$arity = -1);
    
    Opal.def(self, '$fatal', $Logger_fatal$10 = function $$fatal(progname) {
      var $iter = $Logger_fatal$10.$$p, block = $iter || nil, self = this;

      if ($iter) $Logger_fatal$10.$$p = null;
      
      
      if ($iter) $Logger_fatal$10.$$p = null;;
      
      if (progname == null) {
        progname = nil;
      };
      return $send(self, 'add', [$$($nesting, 'FATAL'), nil, progname], block.$to_proc());
    }, $Logger_fatal$10.$$arity = -1);
    
    Opal.def(self, '$unknown', $Logger_unknown$11 = function $$unknown(progname) {
      var $iter = $Logger_unknown$11.$$p, block = $iter || nil, self = this;

      if ($iter) $Logger_unknown$11.$$p = null;
      
      
      if ($iter) $Logger_unknown$11.$$p = null;;
      
      if (progname == null) {
        progname = nil;
      };
      return $send(self, 'add', [$$($nesting, 'UNKNOWN'), nil, progname], block.$to_proc());
    }, $Logger_unknown$11.$$arity = -1);
    
    Opal.def(self, '$info?', $Logger_info$ques$12 = function() {
      var self = this;

      return $rb_le(self.level, $$($nesting, 'INFO'))
    }, $Logger_info$ques$12.$$arity = 0);
    
    Opal.def(self, '$debug?', $Logger_debug$ques$13 = function() {
      var self = this;

      return $rb_le(self.level, $$($nesting, 'DEBUG'))
    }, $Logger_debug$ques$13.$$arity = 0);
    
    Opal.def(self, '$warn?', $Logger_warn$ques$14 = function() {
      var self = this;

      return $rb_le(self.level, $$($nesting, 'WARN'))
    }, $Logger_warn$ques$14.$$arity = 0);
    
    Opal.def(self, '$error?', $Logger_error$ques$15 = function() {
      var self = this;

      return $rb_le(self.level, $$($nesting, 'ERROR'))
    }, $Logger_error$ques$15.$$arity = 0);
    
    Opal.def(self, '$fatal?', $Logger_fatal$ques$16 = function() {
      var self = this;

      return $rb_le(self.level, $$($nesting, 'FATAL'))
    }, $Logger_fatal$ques$16.$$arity = 0);
    return (Opal.def(self, '$add', $Logger_add$17 = function $$add(severity, message, progname) {
      var $iter = $Logger_add$17.$$p, block = $iter || nil, $a, self = this;

      if ($iter) $Logger_add$17.$$p = null;
      
      
      if ($iter) $Logger_add$17.$$p = null;;
      
      if (message == null) {
        message = nil;
      };
      
      if (progname == null) {
        progname = nil;
      };
      if ($truthy($rb_lt((severity = ($truthy($a = severity) ? $a : $$($nesting, 'UNKNOWN'))), self.level))) {
        return true};
      progname = ($truthy($a = progname) ? $a : self.progname);
      if ($truthy(message)) {
      } else if ((block !== nil)) {
        message = Opal.yieldX(block, [])
      } else {
        
        message = progname;
        progname = self.progname;
      };
      self.pipe.$write(self.formatter.$call(($truthy($a = $$($nesting, 'SEVERITY_LABELS')['$[]'](severity)) ? $a : "ANY"), $$$('::', 'Time').$now(), progname, message));
      return true;
    }, $Logger_add$17.$$arity = -2), nil) && 'add';
  })($nesting[0], null, $nesting)
};
