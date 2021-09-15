/* Generated by Opal 1.1.1 */
Opal.modules["strscan"] = function(Opal) {
  function $rb_minus(lhs, rhs) {
    return (typeof(lhs) === 'number' && typeof(rhs) === 'number') ? lhs - rhs : lhs['$-'](rhs);
  }
  var self = Opal.top, $nesting = [], nil = Opal.nil, $$$ = Opal.$$$, $$ = Opal.$$, $klass = Opal.klass, $truthy = Opal.truthy, $send = Opal.send;

  Opal.add_stubs(['$attr_reader', '$anchor', '$empty?', '$===', '$to_s', '$coerce_to!', '$scan_until', '$length', '$size', '$rest', '$pos=', '$-', '$private']);
  return (function($base, $super, $parent_nesting) {
    var self = $klass($base, $super, 'StringScanner');

    var $nesting = [self].concat($parent_nesting), $StringScanner_initialize$1, $StringScanner_beginning_of_line$ques$2, $StringScanner_scan$3, $StringScanner_scan_until$4, $StringScanner_$$$5, $StringScanner_check$6, $StringScanner_check_until$7, $StringScanner_peek$8, $StringScanner_eos$ques$9, $StringScanner_exist$ques$10, $StringScanner_skip$11, $StringScanner_skip_until$12, $StringScanner_get_byte$13, $StringScanner_match$ques$14, $StringScanner_pos$eq$15, $StringScanner_matched_size$16, $StringScanner_post_match$17, $StringScanner_pre_match$18, $StringScanner_reset$19, $StringScanner_rest$20, $StringScanner_rest$ques$21, $StringScanner_rest_size$22, $StringScanner_terminate$23, $StringScanner_unscan$24, $StringScanner_anchor$25;

    self.$$prototype.pos = self.$$prototype.string = self.$$prototype.working = self.$$prototype.matched = self.$$prototype.prev_pos = self.$$prototype.match = nil;
    
    self.$attr_reader("pos");
    self.$attr_reader("matched");
    
    Opal.def(self, '$initialize', $StringScanner_initialize$1 = function $$initialize(string) {
      var self = this;

      
      self.string = string;
      self.pos = 0;
      self.matched = nil;
      self.working = string;
      return (self.match = []);
    }, $StringScanner_initialize$1.$$arity = 1);
    self.$attr_reader("string");
    
    Opal.def(self, '$beginning_of_line?', $StringScanner_beginning_of_line$ques$2 = function() {
      var self = this;

      return self.pos === 0 || self.string.charAt(self.pos - 1) === "\n"
    }, $StringScanner_beginning_of_line$ques$2.$$arity = 0);
    Opal.alias(self, "bol?", "beginning_of_line?");
    
    Opal.def(self, '$scan', $StringScanner_scan$3 = function $$scan(pattern) {
      var self = this;

      
      pattern = self.$anchor(pattern);
      
      var result = pattern.exec(self.working);

      if (result == null) {
        return self.matched = nil;
      }
      else if (typeof(result) === 'object') {
        self.prev_pos = self.pos;
        self.pos     += result[0].length;
        self.working  = self.working.substring(result[0].length);
        self.matched  = result[0];
        self.match    = result;

        return result[0];
      }
      else if (typeof(result) === 'string') {
        self.pos     += result.length;
        self.working  = self.working.substring(result.length);

        return result;
      }
      else {
        return nil;
      }
    ;
    }, $StringScanner_scan$3.$$arity = 1);
    
    Opal.def(self, '$scan_until', $StringScanner_scan_until$4 = function $$scan_until(pattern) {
      var self = this;

      
      pattern = self.$anchor(pattern);
      
      var pos     = self.pos,
          working = self.working,
          result;

      while (true) {
        result   = pattern.exec(working);
        pos     += 1;
        working  = working.substr(1);

        if (result == null) {
          if (working.length === 0) {
            self.match = [];
            return self.matched = nil;
          }

          continue;
        }

        self.matched  = self.string.substr(self.pos, pos - self.pos - 1 + result[0].length);
        self.match    = result;
        self.prev_pos = pos - 1;
        self.pos      = pos;
        self.working  = working.substr(result[0].length);

        return self.matched;
      }
    ;
    }, $StringScanner_scan_until$4.$$arity = 1);
    
    Opal.def(self, '$[]', $StringScanner_$$$5 = function(idx) {
      var self = this, $case = nil;

      
      if ($truthy(self.match['$empty?']())) {
        return nil};
      $case = idx;
      if ($$($nesting, 'Symbol')['$===']($case)) {idx = idx.$to_s()}
      else if ($$($nesting, 'String')['$===']($case)) {nil}
      else {idx = $$($nesting, 'Opal')['$coerce_to!'](idx, $$($nesting, 'Integer'), "to_int")};
      
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
    }, $StringScanner_$$$5.$$arity = 1);
    
    Opal.def(self, '$check', $StringScanner_check$6 = function $$check(pattern) {
      var self = this;

      
      pattern = self.$anchor(pattern);
      
      var result = pattern.exec(self.working);

      if (result == null) {
        return self.matched = nil;
      }

      return self.matched = result[0];
    ;
    }, $StringScanner_check$6.$$arity = 1);
    
    Opal.def(self, '$check_until', $StringScanner_check_until$7 = function $$check_until(pattern) {
      var self = this;

      
      var prev_pos = self.prev_pos,
          pos      = self.pos;

      var result = self.$scan_until(pattern);

      if (result !== nil) {
        self.matched = result.substr(-1);
        self.working = self.string.substr(pos);
      }

      self.prev_pos = prev_pos;
      self.pos      = pos;

      return result;
    
    }, $StringScanner_check_until$7.$$arity = 1);
    
    Opal.def(self, '$peek', $StringScanner_peek$8 = function $$peek(length) {
      var self = this;

      return self.working.substring(0, length)
    }, $StringScanner_peek$8.$$arity = 1);
    
    Opal.def(self, '$eos?', $StringScanner_eos$ques$9 = function() {
      var self = this;

      return self.working.length === 0
    }, $StringScanner_eos$ques$9.$$arity = 0);
    
    Opal.def(self, '$exist?', $StringScanner_exist$ques$10 = function(pattern) {
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
    
    }, $StringScanner_exist$ques$10.$$arity = 1);
    
    Opal.def(self, '$skip', $StringScanner_skip$11 = function $$skip(pattern) {
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
    }, $StringScanner_skip$11.$$arity = 1);
    
    Opal.def(self, '$skip_until', $StringScanner_skip_until$12 = function $$skip_until(pattern) {
      var self = this;

      
      var result = self.$scan_until(pattern);

      if (result === nil) {
        return nil;
      }
      else {
        self.matched = result.substr(-1);

        return result.length;
      }
    
    }, $StringScanner_skip_until$12.$$arity = 1);
    
    Opal.def(self, '$get_byte', $StringScanner_get_byte$13 = function $$get_byte() {
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
    
    }, $StringScanner_get_byte$13.$$arity = 0);
    Opal.alias(self, "getch", "get_byte");
    
    Opal.def(self, '$match?', $StringScanner_match$ques$14 = function(pattern) {
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
    }, $StringScanner_match$ques$14.$$arity = 1);
    
    Opal.def(self, '$pos=', $StringScanner_pos$eq$15 = function(pos) {
      var self = this;

      
      
      if (pos < 0) {
        pos += self.string.$length();
      }
    ;
      self.pos = pos;
      return (self.working = self.string.slice(pos));
    }, $StringScanner_pos$eq$15.$$arity = 1);
    
    Opal.def(self, '$matched_size', $StringScanner_matched_size$16 = function $$matched_size() {
      var self = this;

      
      if (self.matched === nil) {
        return nil;
      }

      return self.matched.length
    
    }, $StringScanner_matched_size$16.$$arity = 0);
    
    Opal.def(self, '$post_match', $StringScanner_post_match$17 = function $$post_match() {
      var self = this;

      
      if (self.matched === nil) {
        return nil;
      }

      return self.string.substr(self.pos);
    
    }, $StringScanner_post_match$17.$$arity = 0);
    
    Opal.def(self, '$pre_match', $StringScanner_pre_match$18 = function $$pre_match() {
      var self = this;

      
      if (self.matched === nil) {
        return nil;
      }

      return self.string.substr(0, self.prev_pos);
    
    }, $StringScanner_pre_match$18.$$arity = 0);
    
    Opal.def(self, '$reset', $StringScanner_reset$19 = function $$reset() {
      var self = this;

      
      self.working = self.string;
      self.matched = nil;
      return (self.pos = 0);
    }, $StringScanner_reset$19.$$arity = 0);
    
    Opal.def(self, '$rest', $StringScanner_rest$20 = function $$rest() {
      var self = this;

      return self.working
    }, $StringScanner_rest$20.$$arity = 0);
    
    Opal.def(self, '$rest?', $StringScanner_rest$ques$21 = function() {
      var self = this;

      return self.working.length !== 0
    }, $StringScanner_rest$ques$21.$$arity = 0);
    
    Opal.def(self, '$rest_size', $StringScanner_rest_size$22 = function $$rest_size() {
      var self = this;

      return self.$rest().$size()
    }, $StringScanner_rest_size$22.$$arity = 0);
    
    Opal.def(self, '$terminate', $StringScanner_terminate$23 = function $$terminate() {
      var self = this, $writer = nil;

      
      self.match = nil;
      
      $writer = [self.string.$length()];
      $send(self, 'pos=', Opal.to_a($writer));
      return $writer[$rb_minus($writer["length"], 1)];;
    }, $StringScanner_terminate$23.$$arity = 0);
    
    Opal.def(self, '$unscan', $StringScanner_unscan$24 = function $$unscan() {
      var self = this;

      
      self.pos = self.prev_pos;
      self.prev_pos = nil;
      self.match = nil;
      return self;
    }, $StringScanner_unscan$24.$$arity = 0);
    self.$private();
    return (Opal.def(self, '$anchor', $StringScanner_anchor$25 = function $$anchor(pattern) {
      var self = this;

      
      var flags = pattern.toString().match(/\/([^\/]+)$/);
      flags = flags ? flags[1] : undefined;
      return new RegExp('^(?:' + pattern.source + ')', flags);
    
    }, $StringScanner_anchor$25.$$arity = 1), nil) && 'anchor';
  })($nesting[0], null, $nesting)
};
