Opal.modules["logger"] = function(Opal) {/* Generated by Opal 1.4.0 */
  var $nesting = [], nil = Opal.nil, $$$ = Opal.$$$, $klass = Opal.klass, $module = Opal.module, $const_set = Opal.const_set, $send = Opal.send, $def = Opal.def, $eqeqeq = Opal.eqeqeq, $truthy = Opal.truthy, $rb_le = Opal.rb_le, $rb_lt = Opal.rb_lt;

  Opal.add_stubs('include,to_h,map,constants,const_get,to_s,format,chr,strftime,message_as_string,===,full_message,inspect,attr_reader,attr_accessor,new,key,upcase,raise,add,to_proc,<=,<,write,call,[],now');
  return (function($base, $super, $parent_nesting) {
    var self = $klass($base, $super, 'Logger');

    var $nesting = [self].concat($parent_nesting), $$ = Opal.$r($nesting), $proto = self.$$prototype;

    $proto.level = $proto.progname = $proto.pipe = $proto.formatter = nil;
    
    (function($base, $parent_nesting) {
      var self = $module($base, 'Severity');

      var $nesting = [self].concat($parent_nesting);

      
      $const_set($nesting[0], 'DEBUG', 0);
      $const_set($nesting[0], 'INFO', 1);
      $const_set($nesting[0], 'WARN', 2);
      $const_set($nesting[0], 'ERROR', 3);
      $const_set($nesting[0], 'FATAL', 4);
      return $const_set($nesting[0], 'UNKNOWN', 5);
    })($nesting[0], $nesting);
    self.$include($$('Severity'));
    $const_set($nesting[0], 'SEVERITY_LABELS', $send($$('Severity').$constants(), 'map', [], function $Logger$1(s){
      
      
      if (s == null) s = nil;;
      return [$$('Severity').$const_get(s), s.$to_s()];}, 1).$to_h());
    (function($base, $super, $parent_nesting) {
      var self = $klass($base, $super, 'Formatter');

      var $nesting = [self].concat($parent_nesting), $$ = Opal.$r($nesting);

      
      $const_set($nesting[0], 'MESSAGE_FORMAT', "%s, [%s] %5s -- %s: %s\n");
      $const_set($nesting[0], 'DATE_TIME_FORMAT', "%Y-%m-%dT%H:%M:%S.%6N");
      
      $def(self, '$call', function $$call(severity, time, progname, msg) {
        var self = this;

        return self.$format($$('MESSAGE_FORMAT'), severity.$chr(), time.$strftime($$('DATE_TIME_FORMAT')), severity, progname, self.$message_as_string(msg))
      }, 4);
      return $def(self, '$message_as_string', function $$message_as_string(msg) {
        var $ret_or_1 = nil;

        if ($eqeqeq($$$('String'), ($ret_or_1 = msg))) {
          return msg
        } else if ($eqeqeq($$$('Exception'), $ret_or_1)) {
          return msg.$full_message()
        } else {
          return msg.$inspect()
        }
      }, 1);
    })($nesting[0], null, $nesting);
    self.$attr_reader("level");
    self.$attr_accessor("progname");
    self.$attr_accessor("formatter");
    
    $def(self, '$initialize', function $$initialize(pipe) {
      var self = this;

      
      self.pipe = pipe;
      self.level = $$('DEBUG');
      return (self.formatter = $$('Formatter').$new());
    }, 1);
    
    $def(self, '$level=', function $Logger_level$eq$2(severity) {
      var self = this, level = nil;

      if ($eqeqeq($$$('Integer'), severity)) {
        return (self.level = severity)
      } else if ($truthy((level = $$('SEVERITY_LABELS').$key(severity.$to_s().$upcase())))) {
        return (self.level = level)
      } else {
        return self.$raise($$('ArgumentError'), "invalid log level: " + (severity))
      }
    }, 1);
    
    $def(self, '$info', function $$info(progname) {
      var block = $$info.$$p || nil, self = this;

      delete $$info.$$p;
      
      ;
      
      if (progname == null) progname = nil;;
      return $send(self, 'add', [$$('INFO'), nil, progname], block.$to_proc());
    }, -1);
    
    $def(self, '$debug', function $$debug(progname) {
      var block = $$debug.$$p || nil, self = this;

      delete $$debug.$$p;
      
      ;
      
      if (progname == null) progname = nil;;
      return $send(self, 'add', [$$('DEBUG'), nil, progname], block.$to_proc());
    }, -1);
    
    $def(self, '$warn', function $$warn(progname) {
      var block = $$warn.$$p || nil, self = this;

      delete $$warn.$$p;
      
      ;
      
      if (progname == null) progname = nil;;
      return $send(self, 'add', [$$('WARN'), nil, progname], block.$to_proc());
    }, -1);
    
    $def(self, '$error', function $$error(progname) {
      var block = $$error.$$p || nil, self = this;

      delete $$error.$$p;
      
      ;
      
      if (progname == null) progname = nil;;
      return $send(self, 'add', [$$('ERROR'), nil, progname], block.$to_proc());
    }, -1);
    
    $def(self, '$fatal', function $$fatal(progname) {
      var block = $$fatal.$$p || nil, self = this;

      delete $$fatal.$$p;
      
      ;
      
      if (progname == null) progname = nil;;
      return $send(self, 'add', [$$('FATAL'), nil, progname], block.$to_proc());
    }, -1);
    
    $def(self, '$unknown', function $$unknown(progname) {
      var block = $$unknown.$$p || nil, self = this;

      delete $$unknown.$$p;
      
      ;
      
      if (progname == null) progname = nil;;
      return $send(self, 'add', [$$('UNKNOWN'), nil, progname], block.$to_proc());
    }, -1);
    
    $def(self, '$info?', function $Logger_info$ques$3() {
      var self = this;

      return $rb_le(self.level, $$('INFO'))
    }, 0);
    
    $def(self, '$debug?', function $Logger_debug$ques$4() {
      var self = this;

      return $rb_le(self.level, $$('DEBUG'))
    }, 0);
    
    $def(self, '$warn?', function $Logger_warn$ques$5() {
      var self = this;

      return $rb_le(self.level, $$('WARN'))
    }, 0);
    
    $def(self, '$error?', function $Logger_error$ques$6() {
      var self = this;

      return $rb_le(self.level, $$('ERROR'))
    }, 0);
    
    $def(self, '$fatal?', function $Logger_fatal$ques$7() {
      var self = this;

      return $rb_le(self.level, $$('FATAL'))
    }, 0);
    return $def(self, '$add', function $$add(severity, message, progname) {
      var block = $$add.$$p || nil, self = this, $ret_or_1 = nil;

      delete $$add.$$p;
      
      ;
      
      if (message == null) message = nil;;
      
      if (progname == null) progname = nil;;
      if ($truthy($rb_lt((severity = ($truthy(($ret_or_1 = severity)) ? ($ret_or_1) : ($$('UNKNOWN')))), self.level))) {
        return true
      };
      progname = ($truthy(($ret_or_1 = progname)) ? ($ret_or_1) : (self.progname));
      if (!$truthy(message)) {
        if ((block !== nil)) {
          message = Opal.yieldX(block, [])
        } else {
          
          message = progname;
          progname = self.progname;
        }
      };
      self.pipe.$write(self.formatter.$call(($truthy(($ret_or_1 = $$('SEVERITY_LABELS')['$[]'](severity))) ? ($ret_or_1) : ("ANY")), $$$('Time').$now(), progname, message));
      return true;
    }, -2);
  })($nesting[0], null, $nesting)
};
