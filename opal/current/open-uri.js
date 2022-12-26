Opal.modules["corelib/array/pack"] = function(Opal) {/* Generated by Opal 1.7.0 */
  var $coerce_to = Opal.coerce_to, $klass = Opal.klass, $Kernel = Opal.Kernel, $Opal = Opal.Opal, $def = Opal.def, self = Opal.top, nil = Opal.nil, $$$ = Opal.$$$;

  Opal.add_stubs('require,raise,delete,gsub,coerce_to!,inspect');
  
  self.$require("corelib/pack_unpack/format_string_parser");
  return (function($base, $super) {
    var self = $klass($base, $super, 'Array');

    
    
    
    // Format Parser
    var eachDirectiveAndCount = Opal.PackUnpack.eachDirectiveAndCount;

    function identityFunction(value) { return value; }

    function utf8BytesToUtf16LEString(bytes) {
      var str = String.fromCharCode.apply(null, bytes), out = "", i = 0, len = str.length, c, char2, char3;
      while (i < len) {
        c = str.charCodeAt(i++);
        switch (c >> 4) {
          case 0:
          case 1:
          case 2:
          case 3:
          case 4:
          case 5:
          case 6:
          case 7:
            // 0xxxxxxx
            out += str.charAt(i - 1);
            break;
          case 12:
          case 13:
            // 110x xxxx 10xx xxxx
            char2 = str.charCodeAt(i++);
            out += String.fromCharCode(((c & 0x1F) << 6) | (char2 & 0x3F));
            break;
          case 14:
            // 1110 xxxx10xx xxxx10xx xxxx
            char2 = str.charCodeAt(i++);
            char3 = str.charCodeAt(i++);
            out += String.fromCharCode(((c & 0x0F) << 12) | ((char2 & 0x3F) << 6) | ((char3 & 0x3F) << 0));
            break;
        }
      }
      return out;
    }

    function asciiBytesToUtf16LEString(bytes) {
      return String.fromCharCode.apply(null, bytes);
    }

    function asciiStringFromUnsignedInt(bytes, callback) {
      return function(data) {
        var buffer = callback(data);

        return buffer.map(function(item) {
          var result = [];

          for (var i = 0; i < bytes; i++) {
            var bit = item & 255;
            result.push(bit);
            item = item >> 8;
          };

          return asciiBytesToUtf16LEString(result);
        });
      }
    }

    function asciiStringFromSignedInt(bytes, callback) {
      return function(data) {
        var buffer = callback(data),
            bits = bytes * 8,
            limit = Math.pow(2, bits);

        return buffer.map(function(item) {
          if (item < 0) {
            item += limit;
          }

          var result = [];

          for (var i = 0; i < bytes; i++) {
            var bit = item & 255;
            result.push(bit);
            item = item >> 8;
          };

          return asciiBytesToUtf16LEString(result);
        });
      }
    }

    function toInt(callback) {
      return function(data) {
        var buffer = callback(data);

        return buffer.map(function(item) {
          return $coerce_to(item, $$$('Integer'), 'to_int')
        });
      }
    }

    function ToStr(callback) {
      return function(data) {
        var buffer = callback(data);

        return buffer.map(function(item) {
          return $coerce_to(item, $$$('String'), 'to_str')
        });
      }
    }

    function fromCodePoint(callback) {
      return function(data) {
        var buffer = callback(data);
        return buffer.map(function(item) {
          try {
            return String.fromCodePoint(item);
          } catch (error) {
            if (error instanceof RangeError) {
              $Kernel.$raise($$$('RangeError'), "value out of range");
            }
            throw error;
          }
        });
      }
    }

    function joinChars(callback) {
      return function(data) {
        var buffer = callback(data);
        return buffer.join('');
      }
    }

    var handlers = {
      // Integer
      'C': joinChars(asciiStringFromUnsignedInt(1, toInt(identityFunction))),
      'S': joinChars(asciiStringFromUnsignedInt(2, toInt(identityFunction))),
      'L': joinChars(asciiStringFromUnsignedInt(4, toInt(identityFunction))),
      'Q': joinChars(asciiStringFromUnsignedInt(8, toInt(identityFunction))),
      'J': null,

      'S>': null,
      'L>': null,
      'Q>': null,

      'c': joinChars(asciiStringFromSignedInt(1, toInt(identityFunction))),
      's': joinChars(asciiStringFromSignedInt(2, toInt(identityFunction))),
      'l': joinChars(asciiStringFromSignedInt(4, toInt(identityFunction))),
      'q': joinChars(asciiStringFromSignedInt(8, toInt(identityFunction))),
      'j': null,

      's>': null,
      'l>': null,
      'q>': null,

      'n': null,
      'N': null,
      'v': null,
      'V': null,

      'U': joinChars(fromCodePoint(toInt(identityFunction))),
      'w': null,

      // Float
      'D': null,
      'd': null,
      'F': null,
      'f': null,
      'E': null,
      'e': null,
      'G': null,
      'g': null,

      // String
      'A': joinChars(identityFunction),
      'a': joinChars(identityFunction),
      'Z': null,
      'B': null,
      'b': null,
      'H': null,
      'h': null,
      'u': null,
      'M': null,
      'm': null,

      'P': null,
      'p': null
    };

    function readNTimesFromBufferAndMerge(callback) {
      return function(buffer, count) {
        var chunk = [], chunkData;

        if (count === Infinity) {
          while (buffer.length > 0) {
            chunkData = callback(buffer);
            buffer = chunkData.rest;
            chunk = chunk.concat(chunkData.chunk);
          }
        } else {
          if (buffer.length < count) {
            $Kernel.$raise($$$('ArgumentError'), "too few arguments");
          }
          for (var i = 0; i < count; i++) {
            chunkData = callback(buffer);
            buffer = chunkData.rest;
            chunk = chunk.concat(chunkData.chunk);
          }
        }

        return { chunk: chunk, rest: buffer };
      }
    }

    function readItem(buffer) {
      var chunk = buffer.slice(0, 1);
      buffer = buffer.slice(1, buffer.length);
      return { chunk: chunk, rest: buffer };
    }

    function readNCharsFromTheFirstItemAndMergeWithFallback(fallback, callback) {
      return function(buffer, count) {
        var chunk = [], source = buffer[0];

        if (source === nil) {
          source = '';
        } else if (source === undefined) {
          $Kernel.$raise($$$('ArgumentError'), "too few arguments");
        } else {
          source = $coerce_to(source, $$$('String'), 'to_str');
        }

        buffer = buffer.slice(1, buffer.length);

        function infiniteReeder() {
          var chunkData = callback(source);
          source = chunkData.rest;
          var subChunk = chunkData.chunk;

          if (subChunk.length === 1 && subChunk[0] === nil) {
            subChunk = []
          }

          chunk = chunk.concat(subChunk);
        }

        function finiteReeder() {
          var chunkData = callback(source);
          source = chunkData.rest;
          var subChunk = chunkData.chunk;

          if (subChunk.length === 0) {
            subChunk = [fallback];
          }

          if (subChunk.length === 1 && subChunk[0] === nil) {
            subChunk = [fallback];
          }

          chunk = chunk.concat(subChunk);
        }

        if (count === Infinity) {
          while (source.length > 0) {
            infiniteReeder();
          }
        } else {
          for (var i = 0; i < count; i++) {
            finiteReeder();
          }
        }

        return { chunk: chunk, rest: buffer };
      }
    }

    var readChunk = {
      // Integer
      'C': readNTimesFromBufferAndMerge(readItem),
      'S': readNTimesFromBufferAndMerge(readItem),
      'L': readNTimesFromBufferAndMerge(readItem),
      'Q': readNTimesFromBufferAndMerge(readItem),
      'J': null,

      'S>': null,
      'L>': null,
      'Q>': null,

      'c': readNTimesFromBufferAndMerge(readItem),
      's': readNTimesFromBufferAndMerge(readItem),
      'l': readNTimesFromBufferAndMerge(readItem),
      'q': readNTimesFromBufferAndMerge(readItem),
      'j': null,

      's>': null,
      'l>': null,
      'q>': null,

      'n': null,
      'N': null,
      'v': null,
      'V': null,

      'U': readNTimesFromBufferAndMerge(readItem),
      'w': null,

      // Float
      'D': null,
      'd': null,
      'F': null,
      'f': null,
      'E': null,
      'e': null,
      'G': null,
      'g': null,

      // String
      'A': readNCharsFromTheFirstItemAndMergeWithFallback(" ", readItem),
      'a': readNCharsFromTheFirstItemAndMergeWithFallback("\x00", readItem),
      'Z': null,
      'B': null,
      'b': null,
      'H': null,
      'h': null,
      'u': null,
      'M': null,
      'm': null,

      'P': null,
      'p': null
    };

    var autocompletion = {
      // Integer
      'C': false,
      'S': false,
      'L': false,
      'Q': false,
      'J': null,

      'S>': null,
      'L>': null,
      'Q>': null,

      'c': false,
      's': false,
      'l': false,
      'q': false,
      'j': null,

      's>': null,
      'l>': null,
      'q>': null,

      'n': null,
      'N': null,
      'v': null,
      'V': null,

      'U': false,
      'w': null,

      // Float
      'D': null,
      'd': null,
      'F': null,
      'f': null,
      'E': null,
      'e': null,
      'G': null,
      'g': null,

      // String
      'A': false,
      'a': false,
      'Z': null,
      'B': null,
      'b': null,
      'H': null,
      'h': null,
      'u': false,
      'M': null,
      'm': null,

      'P': null,
      'p': null
    };
  ;
    return $def(self, '$pack', function $$pack(format) {
      var self = this;

      
      format = $Opal['$coerce_to!'](format, $$$('String'), "to_str").$gsub(/\s/, "").$delete("\u0000");
      
      var output = '';

      var buffer = self.slice();

      function autocomplete(array, size) {
        while (array.length < size) {
          array.push(nil);
        }

        return array;
      }

      function processChunk(directive, count) {
        var chunk,
            chunkReader = readChunk[directive];

        if (chunkReader == null) {
          $Kernel.$raise("Unsupported pack directive " + ((directive).$inspect()) + " (no chunk reader defined)")
        }

        var chunkData = chunkReader(buffer, count);
        chunk = chunkData.chunk;
        buffer = chunkData.rest;

        var handler = handlers[directive];

        if (handler == null) {
          $Kernel.$raise("Unsupported pack directive " + ((directive).$inspect()) + " (no handler defined)")
        }

        return handler(chunk);
      }

      eachDirectiveAndCount(format, function(directive, count) {
        var part = processChunk(directive, count);

        if (count !== Infinity) {
          var shouldAutocomplete = autocompletion[directive]

          if (shouldAutocomplete == null) {
            $Kernel.$raise("Unsupported pack directive " + ((directive).$inspect()) + " (no autocompletion rule defined)")
          }

          if (shouldAutocomplete) {
            autocomplete(part, count);
          }
        }

        output = output.concat(part);
      });

      if (format.match(/^(U\*?)+$/)) {
        return output;
      }
      else {
        return Opal.enc(output, "binary");
      }
    ;
    });
  })('::', null);
};

Opal.modules["stringio"] = function(Opal) {/* Generated by Opal 1.7.0 */
  var $klass = Opal.klass, $defs = Opal.defs, $send2 = Opal.send2, $find_super = Opal.find_super, $def = Opal.def, $eqeqeq = Opal.eqeqeq, $truthy = Opal.truthy, $rb_ge = Opal.rb_ge, $rb_gt = Opal.rb_gt, $rb_plus = Opal.rb_plus, $rb_minus = Opal.rb_minus, $return_ivar = Opal.return_ivar, $eqeq = Opal.eqeq, $alias = Opal.alias, $nesting = [], $$ = Opal.$r($nesting), nil = Opal.nil, $$$ = Opal.$$$;

  Opal.add_stubs('new,call,close,attr_accessor,check_readable,==,length,===,>=,raise,>,+,-,seek,check_writable,String,[],eof?,write,read,tell');
  return (function($base, $super, $parent_nesting) {
    var self = $klass($base, $super, 'StringIO');

    var $nesting = [self].concat($parent_nesting), $$ = Opal.$r($nesting), $proto = self.$$prototype;

    $proto.position = $proto.string = nil;
    
    $defs(self, '$open', function $$open(string, mode) {
      var block = $$open.$$p || nil, self = this, io = nil, res = nil;

      $$open.$$p = null;
      
      ;
      if (string == null) string = "";
      if (mode == null) mode = nil;
      io = self.$new(string, mode);
      res = block.$call(io);
      io.$close();
      return res;
    }, -1);
    self.$attr_accessor("string");
    
    $def(self, '$initialize', function $$initialize(string, mode) {
      var $yield = $$initialize.$$p || nil, self = this;

      $$initialize.$$p = null;
      
      if (string == null) string = "";
      if (mode == null) mode = "rw";
      self.string = string;
      self.position = 0;
      return $send2(self, $find_super(self, 'initialize', $$initialize, false, true), 'initialize', [nil, mode], null);
    }, -1);
    
    $def(self, '$eof?', function $StringIO_eof$ques$1() {
      var self = this;

      
      self.$check_readable();
      return self.position['$=='](self.string.$length());
    });
    
    $def(self, '$seek', function $$seek(pos, whence) {
      var self = this, $ret_or_1 = nil;

      
      if (whence == null) whence = $$$($$('IO'), 'SEEK_SET');
      self.read_buffer = "";
      if ($eqeqeq($$$($$('IO'), 'SEEK_SET'), ($ret_or_1 = whence))) {
        
        if (!$truthy($rb_ge(pos, 0))) {
          self.$raise($$$($$('Errno'), 'EINVAL'))
        };
        self.position = pos;
      } else if ($eqeqeq($$$($$('IO'), 'SEEK_CUR'), $ret_or_1)) {
        if ($truthy($rb_gt($rb_plus(self.position, pos), self.string.$length()))) {
          self.position = self.string.$length()
        } else {
          self.position = $rb_plus(self.position, pos)
        }
      } else if ($eqeqeq($$$($$('IO'), 'SEEK_END'), $ret_or_1)) {
        if ($truthy($rb_gt(pos, self.string.$length()))) {
          self.position = 0
        } else {
          self.position = $rb_minus(self.position, pos)
        }
      } else {
        nil
      };
      return 0;
    }, -2);
    
    $def(self, '$tell', $return_ivar("position"));
    
    $def(self, '$rewind', function $$rewind() {
      var self = this;

      return self.$seek(0)
    });
    
    $def(self, '$write', function $$write(string) {
      var self = this, before = nil, after = nil;

      
      self.$check_writable();
      self.read_buffer = "";
      string = self.$String(string);
      if ($eqeq(self.string.$length(), self.position)) {
        
        self.string = $rb_plus(self.string, string);
        return (self.position = $rb_plus(self.position, string.$length()));
      } else {
        
        before = self.string['$[]'](Opal.Range.$new(0, $rb_minus(self.position, 1), false));
        after = self.string['$[]'](Opal.Range.$new($rb_plus(self.position, string.$length()), -1, false));
        self.string = $rb_plus($rb_plus(before, string), after);
        return (self.position = $rb_plus(self.position, string.$length()));
      };
    });
    
    $def(self, '$read', function $$read(length, outbuf) {
      var self = this, string = nil, str = nil;

      
      if (length == null) length = nil;
      if (outbuf == null) outbuf = nil;
      self.$check_readable();
      if ($truthy(self['$eof?']())) {
        return nil
      };
      string = ($truthy(length) ? (((str = self.string['$[]'](self.position, length)), (self.position = $rb_plus(self.position, length)), ($truthy($rb_gt(self.position, self.string.$length())) ? ((self.position = self.string.$length())) : nil), str)) : (((str = self.string['$[]'](Opal.Range.$new(self.position, -1, false))), (self.position = self.string.$length()), str)));
      if ($truthy(outbuf)) {
        return outbuf.$write(string)
      } else {
        return string
      };
    }, -1);
    
    $def(self, '$sysread', function $$sysread(length) {
      var self = this;

      
      self.$check_readable();
      return self.$read(length);
    });
    $alias(self, "eof", "eof?");
    $alias(self, "pos", "tell");
    $alias(self, "pos=", "seek");
    return $alias(self, "readpartial", "read");
  })($nesting[0], $$('IO'), $nesting)
};

Opal.modules["corelib/pack_unpack/format_string_parser"] = function(Opal) {/* Generated by Opal 1.7.0 */
  var $module = Opal.module, $Kernel = Opal.Kernel, nil = Opal.nil, $$$ = Opal.$$$;

  Opal.add_stubs('raise');
  return (function($base) {
    var self = $module($base, 'PackUnpack');

    
    
    var directives = [
      // Integer
      'C',
      'S',
      'L',
      'Q',
      'J',

      'c',
      's',
      'l',
      'q',
      'j',

      'n',
      'N',
      'v',
      'V',

      'U',
      'w',

      // Float
      'D',
      'd',
      'F',
      'f',
      'E',
      'e',
      'G',
      'g',

      // String
      'A',
      'a',
      'Z',
      'B',
      'b',
      'H',
      'h',
      'u',
      'M',
      'm',

      'P',
      'p',

      // Misc
      '@',
      'X',
      'x'
    ];

    var modifiers = [
      '!', // ignored
      '_', // ignored
      '>', // big endian
      '<'  // little endian
    ];

    self.eachDirectiveAndCount = function(format, callback) {
      var currentDirective,
          currentCount,
          currentModifiers,
          countSpecified;

      function reset() {
        currentDirective = null;
        currentCount = 0;
        currentModifiers = [];
        countSpecified = false;
      }

      reset();

      function yieldAndReset() {
        if (currentDirective == null) {
          reset();
          return;
        }

        var directiveSupportsModifiers = /[sSiIlLqQjJ]/.test(currentDirective);

        if (!directiveSupportsModifiers && currentModifiers.length > 0) {
          $Kernel.$raise($$$('ArgumentError'), "'" + (currentModifiers[0]) + "' allowed only after types sSiIlLqQjJ")
        }

        if (currentModifiers.indexOf('<') !== -1 && currentModifiers.indexOf('>') !== -1) {
          $Kernel.$raise($$$('RangeError'), "Can't use both '<' and '>'")
        }

        if (!countSpecified) {
          currentCount = 1;
        }

        if (currentModifiers.indexOf('>') !== -1) {
          currentDirective = currentDirective + '>';
        }

        callback(currentDirective, currentCount);

        reset();
      }

      for (var i = 0; i < format.length; i++) {
        var currentChar = format[i];

        if (directives.indexOf(currentChar) !== -1) {
          // Directive char always resets current state
          yieldAndReset();
          currentDirective = currentChar;
        } else if (currentDirective) {
          if (/\d/.test(currentChar)) {
            // Count can be represented as a sequence of digits
            currentCount = currentCount * 10 + parseInt(currentChar, 10);
            countSpecified = true;
          } else if (currentChar === '*' && countSpecified === false) {
            // Count can be represented by a star character
            currentCount = Infinity;
            countSpecified = true;
          } else if (modifiers.indexOf(currentChar) !== -1 && countSpecified === false) {
            // Directives can be specified only after directive and before count
            currentModifiers.push(currentChar);
          } else {
            yieldAndReset();
          }
        }
      }

      yieldAndReset();
    }
  
  })('::')
};

Opal.queue(function(Opal) {/* Generated by Opal 1.7.0 */
  var $module = Opal.module, $alias = Opal.alias, $slice = Opal.slice, $truthy = Opal.truthy, $send = Opal.send, $to_a = Opal.to_a, $def = Opal.def, $hash2 = Opal.hash2, $defs = Opal.defs, $eqeq = Opal.eqeq, $klass = Opal.klass, $send2 = Opal.send2, $find_super = Opal.find_super, $rb_plus = Opal.rb_plus, $eqeqeq = Opal.eqeqeq, self = Opal.top, $nesting = [], nil = Opal.nil, $$$ = Opal.$$$;

  Opal.add_stubs('require,private,open,=~,respond_to?,open_uri,to_proc,open_uri_original_open,module_function,open_loop,rewind,close_io,close!,closed?,close,request,==,build_response,raise,new,<<,pack,data,io,status=,meta_add_field,attr_reader,+,length,===,init,extend,instance_eval,status,base_uri=,base_uri,each,metas,meta_add_field2,attr_accessor,charset,find_encoding,set_encoding,force_encoding,string,find,downcase,[]=,join,meta_setup_encoding,[],utc,at,content_type_parse,scheme,read');
  
  self.$require("stringio");
  self.$require("corelib/array/pack");
  (function($base, $parent_nesting) {
    var self = $module($base, 'Kernel');

    var $nesting = [self].concat($parent_nesting), $$ = Opal.$r($nesting);

    
    self.$private();
    $alias(self, "open_uri_original_open", "open");
    (function(self, $parent_nesting) {
      
      return $alias(self, "open_uri_original_open", "open")
    })(Opal.get_singleton_class(self), $nesting);
    
    $def(self, '$open', function $$open(name, $a) {
      var block = $$open.$$p || nil, $post_args, rest, self = this;

      $$open.$$p = null;
      
      ;
      $post_args = $slice(arguments, 1);
      rest = $post_args;
      if (($truthy(name['$respond_to?']("to_str")) && ($truthy(/^[A-Za-z][A-Za-z0-9+\-\.]*:\/\//['$=~'](name))))) {
        return $send($$('OpenURI'), 'open_uri', [name].concat($to_a(rest)), block.$to_proc())
      } else {
        return $send(self, 'open_uri_original_open', [name].concat($to_a(rest)), block.$to_proc())
      };
    }, -2);
    return self.$module_function("open");
  })($nesting[0], $nesting);
  return (function($base, $parent_nesting) {
    var self = $module($base, 'OpenURI');

    var $nesting = [self].concat($parent_nesting), $$ = Opal.$r($nesting);

    
    $defs(self, '$open_uri', function $$open_uri(name, $a) {
      var $post_args, rest, $yield = $$open_uri.$$p || nil, self = this, io = nil;

      $$open_uri.$$p = null;
      
      $post_args = $slice(arguments, 1);
      rest = $post_args;
      io = self.$open_loop(name, $hash2([], {}));
      io.$rewind();
      if (($yield !== nil)) {
        
        return (function() { try {
        return Opal.yield1($yield, io);
        } finally {
          self.$close_io(io)
        }; })();
      } else {
        return io
      };
    }, -2);
    $defs(self, '$close_io', function $$close_io(io) {
      
      if ($truthy(io['$respond_to?']("close!"))) {
        return io['$close!']()
      } else if ($truthy(io['$closed?']())) {
        return nil
      } else {
        return io.$close()
      }
    });
    $defs(self, '$open_loop', function $$open_loop(uri, options) {
      var self = this, req = nil, data = nil, status = nil, status_text = nil;

      
      req = self.$request(uri);
      data = req.responseText;
      status = req.status;
      status_text = req.statusText && req.statusText.errno ? req.statusText.errno : req.statusText;
      if (($eqeq(status, 200) || (($eqeq(status, 0) && ($truthy(data)))))) {
        return self.$build_response(req, status, status_text)
      } else {
        return self.$raise($$$($$('OpenURI'), 'HTTPError').$new("" + (status) + " " + (status_text), ""))
      };
    });
    $defs(self, '$build_response', function $$build_response(req, status, status_text) {
      var self = this, buf = nil, io = nil, last_modified = nil;

      
      buf = $$('Buffer').$new();
      buf['$<<'](self.$data(req).$pack("c*"));
      io = buf.$io();
      io['$status=']("" + (status) + " " + (status_text));
      io.$meta_add_field("content-type", req.getResponseHeader("Content-Type") || '');
      last_modified = req.getResponseHeader("Last-Modified");
      if ($truthy(last_modified)) {
        io.$meta_add_field("last-modified", last_modified)
      };
      return io;
    });
    $defs(self, '$data', function $$data(req) {
      
      
      var binStr = req.responseText;
      var byteArray = [];
      for (var i = 0, len = binStr.length; i < len; ++i) {
        var c = binStr.charCodeAt(i);
        var byteCode = c & 0xff; // byte at offset i
        byteArray.push(byteCode);
      }
      return byteArray;
    
    });
    $defs(self, '$request', function $$request(uri) {
      var self = this;

      
      try {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', uri, false);
        // We cannot use xhr.responseType = "arraybuffer" because XMLHttpRequest is used in synchronous mode.
        // https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest/responseType#Synchronous_XHR_restrictions
        xhr.overrideMimeType('text/plain; charset=x-user-defined');
        xhr.send();
        return xhr;
      } catch (error) {
        self.$raise($$$($$('OpenURI'), 'HTTPError').$new(error.message, ""))
      }
    
    });
    (function($base, $super) {
      var self = $klass($base, $super, 'HTTPError');

      
      
      
      $def(self, '$initialize', function $$initialize(message, io) {
        var $yield = $$initialize.$$p || nil, self = this;

        $$initialize.$$p = null;
        
        $send2(self, $find_super(self, 'initialize', $$initialize, false, true), 'initialize', [message, io], null);
        return (self.io = io);
      });
      return self.$attr_reader("io");
    })($nesting[0], $$('StandardError'));
    (function($base, $super, $parent_nesting) {
      var self = $klass($base, $super, 'Buffer');

      var $nesting = [self].concat($parent_nesting), $$ = Opal.$r($nesting), $proto = self.$$prototype;

      $proto.io = $proto.size = nil;
      
      
      $def(self, '$initialize', function $$initialize() {
        var self = this;

        
        self.io = $$('StringIO').$new();
        return (self.size = 0);
      });
      self.$attr_reader("size");
      
      $def(self, '$<<', function $Buffer_$lt$lt$1(str) {
        var self = this;

        
        self.io['$<<'](str);
        return (self.size = $rb_plus(self.size, str.$length()));
      });
      return $def(self, '$io', function $$io() {
        var self = this;

        
        if (!$eqeqeq($$('Meta'), self.io)) {
          $$('Meta').$init(self.io)
        };
        return self.io;
      });
    })($nesting[0], null, $nesting);
    (function($base, $parent_nesting) {
      var self = $module($base, 'Meta');

      var $nesting = [self].concat($parent_nesting), $$ = Opal.$r($nesting);

      
      $defs($$('Meta'), '$init', function $$init(obj, src) {
        var self = this;

        
        if (src == null) src = nil;
        obj.$extend($$('Meta'));
        $send(obj, 'instance_eval', [], function $$2(){var self = $$2.$$s == null ? this : $$2.$$s;

          
          self.base_uri = nil;
          self.meta = $hash2([], {});
          return (self.metas = $hash2([], {}));}, {$$s: self});
        if ($truthy(src)) {
          
          obj['$status='](src.$status());
          obj['$base_uri='](src.$base_uri());
          return $send(src.$metas(), 'each', [], function $$3(name, values){
            
            if (name == null) name = nil;
            if (values == null) values = nil;
            return obj.$meta_add_field2(name, values);});
        } else {
          return nil
        };
      }, -2);
      self.$attr_accessor("status");
      self.$attr_accessor("base_uri");
      self.$attr_reader("meta");
      self.$attr_reader("metas");
      
      $def(self, '$meta_setup_encoding', function $$meta_setup_encoding() {
        var self = this, charset = nil, enc = nil;

        
        charset = self.$charset();
        enc = self.$find_encoding(charset);
        return self.$set_encoding(enc);
      });
      
      $def(self, '$set_encoding', function $$set_encoding(enc) {
        var self = this;

        if ($truthy(self['$respond_to?']("force_encoding"))) {
          return self.$force_encoding(enc)
        } else if ($truthy(self['$respond_to?']("string"))) {
          return self.$string().$force_encoding(enc)
        } else {
          return self.$set_encoding(enc)
        }
      });
      
      $def(self, '$find_encoding', function $$find_encoding(charset) {
        var enc = nil;

        
        enc = nil;
        if ($truthy(charset)) {
          
          try {
            enc = $$('Encoding').$find(charset)
          } catch ($err) {
            if (Opal.rescue($err, [$$('ArgumentError')])) {
              try {
                nil
              } finally { Opal.pop_exception(); }
            } else { throw $err; }
          };
        };
        if (!$truthy(enc)) {
          enc = $$$($$('Encoding'), 'ASCII_8BIT')
        };
        return enc;
      });
      
      $def(self, '$meta_add_field2', function $$meta_add_field2(name, values) {
        var self = this;
        if (self.metas == null) self.metas = nil;
        if (self.meta == null) self.meta = nil;

        
        name = name.$downcase();
        self.metas['$[]='](name, values);
        self.meta['$[]='](name, values.$join(", "));
        if ($eqeq(name, "content-type")) {
          return self.$meta_setup_encoding()
        } else {
          return nil
        };
      });
      
      $def(self, '$meta_add_field', function $$meta_add_field(name, value) {
        var self = this;

        return self.$meta_add_field2(name, [value])
      });
      
      $def(self, '$last_modified', function $$last_modified() {
        var self = this, vs = nil;
        if (self.metas == null) self.metas = nil;

        if ($truthy((vs = self.metas['$[]']("last-modified")))) {
          return $$('Time').$at(Date.parse(vs.$join(", ")) / 1000).$utc()
        } else {
          return nil
        }
      });
      
      $def(self, '$content_type_parse', function $$content_type_parse() {
        var self = this, content_type = nil;
        if (self.metas == null) self.metas = nil;

        
        content_type = self.metas['$[]']("content-type");
        return content_type.$join(", ");
      });
      
      $def(self, '$charset', function $$charset() {
        var self = this, type = nil;
        if (self.base_uri == null) self.base_uri = nil;

        
        type = self.$content_type_parse();
        if (((($truthy(type) && ($truthy(/^text\//['$=~'](type)))) && ($truthy(self.base_uri))) && ($truthy(/^http$/i['$=~'](self.base_uri.$scheme()))))) {
          return "iso-8859-1"
        } else {
          return nil
        };
      });
      return $def(self, '$content_type', function $$content_type() {
        var self = this, type = nil, $ret_or_1 = nil;

        
        type = self.$content_type_parse();
        if ($truthy(($ret_or_1 = type))) {
          return $ret_or_1
        } else {
          return "application/octet-stream"
        };
      });
    })($nesting[0], $nesting);
    return (function($base, $parent_nesting) {
      var self = $module($base, 'OpenRead');

      var $nesting = [self].concat($parent_nesting), $$ = Opal.$r($nesting);

      
      
      $def(self, '$open', function $$open($a) {
        var block = $$open.$$p || nil, $post_args, rest, self = this;

        $$open.$$p = null;
        
        ;
        $post_args = $slice(arguments);
        rest = $post_args;
        return $send($$('OpenURI'), 'open_uri', [self].concat($to_a(rest)), block.$to_proc());
      }, -1);
      return $def(self, '$read', function $$read(options) {
        var self = this;

        
        if (options == null) options = $hash2([], {});
        return $send(self, 'open', [options], function $$4(f){var str = nil;

          
          if (f == null) f = nil;
          str = f.$read();
          $$('Meta').$init(str, f);
          return str;});
      }, -1);
    })($nesting[0], $nesting);
  })($nesting[0], $nesting);
});
