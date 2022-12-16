Opal.queue(function(Opal) {/* Generated by Opal 1.6.1 */
  var $klass = Opal.klass, $def = Opal.def, $truthy = Opal.truthy, $eqeqeq = Opal.eqeqeq, $Opal = Opal.Opal, $return_ivar = Opal.return_ivar, $send = Opal.send, $alias = Opal.alias, $nesting = [], nil = Opal.nil;

  Opal.add_stubs('attr_reader,anchor,empty?,===,to_s,coerce_to!,scan_until,length,size,rest,pos=,beginning_of_line?,get_byte,private');
  return (function($base, $super, $parent_nesting) {
    var self = $klass($base, $super, 'StringScanner');

    var $nesting = [self].concat($parent_nesting), $$ = Opal.$r($nesting), $proto = self.$$prototype;

    $proto.pos = $proto.string = $proto.working = $proto.matched = $proto.prev_pos = $proto.match = nil;
    
    self.$attr_reader("pos", "matched");
    
    $def(self, '$initialize', function $$initialize(string) {
      var self = this;

      
      self.string = string;
      self.pos = 0;
      self.matched = nil;
      self.working = string;
      return (self.match = []);
    });
    self.$attr_reader("string");
    
    $def(self, '$beginning_of_line?', function $StringScanner_beginning_of_line$ques$1() {
      var self = this;

      return self.pos === 0 || self.string.charAt(self.pos - 1) === "\n"
    });
    
    $def(self, '$scan', function $$scan(pattern) {
      var self = this;

      
      pattern = self.$anchor(pattern);
      
      var result = pattern.exec(self.working);

      if (result == null) {
        return self.matched = nil;
      }
      self.prev_pos = self.pos;
      self.pos     += result[0].length;
      self.working  = self.working.substring(result[0].length);
      self.matched  = result[0];
      self.match    = result;

      return result[0];
    ;
    });
    
    $def(self, '$scan_until', function $$scan_until(pattern) {
      var self = this;

      
      pattern = self.$anchor(pattern);
      
      var working = self.working

      for(var i = 0; working.length != i; ++i) {
        var result  = pattern.exec(working.substr(i));
        if (result !== null) {
          var matched_size = i + result[0].length
          var matched = working.substr(0, matched_size)

          self.matched  = result[0]
          self.match  = result
          self.prev_pos = self.pos + i; // Position of first character of matched
          self.pos += matched_size // Position one after last character of matched
          self.working = working.substr(matched_size)

          return matched
        }
      }
      return self.matched = nil;
    ;
    });
    
    $def(self, '$[]', function $StringScanner_$$$2(idx) {
      var self = this, $ret_or_1 = nil;

      
      if ($truthy(self.match['$empty?']())) {
        return nil
      };
      if ($eqeqeq($$('Symbol'), ($ret_or_1 = idx))) {
        idx = idx.$to_s()
      } else if (!$eqeqeq($$('String'), $ret_or_1)) {
        idx = $Opal['$coerce_to!'](idx, $$('Integer'), "to_int")
      };
      
      var match = self.match;

      if (idx < 0) {
        idx += match.length;
      }

      if (idx < 0 || idx >= match.length) {
        return nil;
      }

      if (match[idx] == null) {
        return nil;
      }

      return match[idx];
    ;
    });
    
    $def(self, '$check', function $$check(pattern) {
      var self = this;

      
      pattern = self.$anchor(pattern);
      
      var result = pattern.exec(self.working);

      if (result == null) {
        return self.matched = nil;
      }

      return self.matched = result[0];
    ;
    });
    
    $def(self, '$check_until', function $$check_until(pattern) {
      var self = this;

      
      var old_prev_pos = self.prev_pos;
      var old_pos      = self.pos;
      var old_working  = self.working;

      var result = self.$scan_until(pattern);

      self.prev_pos = old_prev_pos;
      self.pos      = old_pos;
      self.working  = old_working;

      return result;
    
    });
    
    $def(self, '$peek', function $$peek(length) {
      var self = this;

      return self.working.substring(0, length)
    });
    
    $def(self, '$eos?', function $StringScanner_eos$ques$3() {
      var self = this;

      return self.working.length === 0
    });
    
    $def(self, '$exist?', function $StringScanner_exist$ques$4(pattern) {
      var self = this;

      
      var result = pattern.exec(self.working);

      if (result == null) {
        return nil;
      }
      else if (result.index == 0) {
        return 0;
      }
      else {
        return result.index + 1;
      }
    
    });
    
    $def(self, '$skip', function $$skip(pattern) {
      var self = this;

      
      pattern = self.$anchor(pattern);
      
      var result = pattern.exec(self.working);

      if (result == null) {
        self.match = [];
        return self.matched = nil;
      }
      else {
        var match_str = result[0];
        var match_len = match_str.length;

        self.matched   = match_str;
        self.match     = result;
        self.prev_pos  = self.pos;
        self.pos      += match_len;
        self.working   = self.working.substring(match_len);

        return match_len;
      }
    ;
    });
    
    $def(self, '$skip_until', function $$skip_until(pattern) {
      var self = this;

      
      var result = self.$scan_until(pattern);

      if (result === nil) {
        return nil;
      }
      else {
        self.matched = result.substr(-1);

        return result.length;
      }
    
    });
    
    $def(self, '$get_byte', function $$get_byte() {
      var self = this;

      
      var result = nil;

      if (self.pos < self.string.length) {
        self.prev_pos  = self.pos;
        self.pos      += 1;
        result      = self.matched = self.working.substring(0, 1);
        self.working   = self.working.substring(1);
      }
      else {
        self.matched = nil;
      }

      return result;
    
    });
    
    $def(self, '$match?', function $StringScanner_match$ques$5(pattern) {
      var self = this;

      
      pattern = self.$anchor(pattern);
      
      var result = pattern.exec(self.working);

      if (result == null) {
        return nil;
      }
      else {
        self.prev_pos = self.pos;

        return result[0].length;
      }
    ;
    });
    
    $def(self, '$pos=', function $StringScanner_pos$eq$6(pos) {
      var self = this;

      
      
      if (pos < 0) {
        pos += self.string.$length();
      }
    ;
      self.pos = pos;
      return (self.working = self.string.slice(pos));
    });
    
    $def(self, '$matched_size', function $$matched_size() {
      var self = this;

      
      if (self.matched === nil) {
        return nil;
      }

      return self.matched.length
    
    });
    
    $def(self, '$post_match', function $$post_match() {
      var self = this;

      
      if (self.matched === nil) {
        return nil;
      }

      return self.string.substr(self.pos);
    
    });
    
    $def(self, '$pre_match', function $$pre_match() {
      var self = this;

      
      if (self.matched === nil) {
        return nil;
      }

      return self.string.substr(0, self.prev_pos);
    
    });
    
    $def(self, '$reset', function $$reset() {
      var self = this;

      
      self.working = self.string;
      self.matched = nil;
      return (self.pos = 0);
    });
    
    $def(self, '$rest', $return_ivar("working"));
    
    $def(self, '$rest?', function $StringScanner_rest$ques$7() {
      var self = this;

      return self.working.length !== 0
    });
    
    $def(self, '$rest_size', function $$rest_size() {
      var self = this;

      return self.$rest().$size()
    });
    
    $def(self, '$terminate', function $$terminate() {
      var $a, self = this;

      
      self.match = nil;
      return ($a = [self.string.$length()], $send(self, 'pos=', $a), $a[$a.length - 1]);
    });
    
    $def(self, '$unscan', function $$unscan() {
      var self = this;

      
      self.pos = self.prev_pos;
      self.prev_pos = nil;
      self.match = nil;
      return self;
    });
    $alias(self, "bol?", "beginning_of_line?");
    $alias(self, "getch", "get_byte");
    self.$private();
    return $def(self, '$anchor', function $$anchor(pattern) {
      
      
      var flags = pattern.toString().match(/\/([^\/]+)$/);
      flags = flags ? flags[1] : undefined;
      return new RegExp('^(?:' + pattern.source + ')', flags);
    
    });
  })($nesting[0], null, $nesting)
});
