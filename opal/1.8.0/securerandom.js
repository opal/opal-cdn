Opal.modules["corelib/random/formatter"] = function(Opal) {/* Generated by Opal 1.8.0 */
  var $klass = Opal.klass, $module = Opal.module, $def = Opal.def, $range = Opal.range, $send = Opal.send, $rb_divide = Opal.rb_divide, $Kernel = Opal.Kernel, $Opal = Opal.Opal, $nesting = [], nil = Opal.nil, $$$ = Opal.$$$;

  Opal.add_stubs('_verify_count,bytes,encode,strict_encode64,random_bytes,urlsafe_encode64,split,hex,[]=,[],map,to_proc,join,times,<<,|,ord,/,abs,random_float,raise,coerce_to!,flatten,new,random_number,length,include,extend');
  return (function($base, $super, $parent_nesting) {
    var self = $klass($base, $super, 'Random');

    var $nesting = [self].concat($parent_nesting);

    
    (function($base, $parent_nesting) {
      var self = $module($base, 'Formatter');

      var $nesting = [self].concat($parent_nesting), $$ = Opal.$r($nesting);

      
      
      $def(self, '$hex', function $$hex(count) {
        var self = this;

        
        if (count == null) count = nil;
        count = $$$('Random').$_verify_count(count);
        
        var bytes = self.$bytes(count);
        var out = "";
        for (var i = 0; i < count; i++) {
          out += bytes.charCodeAt(i).toString(16).padStart(2, '0');
        }
        return (out).$encode("US-ASCII");
      ;
      }, -1);
      
      $def(self, '$random_bytes', function $$random_bytes(count) {
        var self = this;

        
        if (count == null) count = nil;
        return self.$bytes(count);
      }, -1);
      
      $def(self, '$base64', function $$base64(count) {
        var self = this;

        
        if (count == null) count = nil;
        return $$$('Base64').$strict_encode64(self.$random_bytes(count)).$encode("US-ASCII");
      }, -1);
      
      $def(self, '$urlsafe_base64', function $$urlsafe_base64(count, padding) {
        var self = this;

        
        if (count == null) count = nil;
        if (padding == null) padding = false;
        return $$$('Base64').$urlsafe_encode64(self.$random_bytes(count), padding).$encode("US-ASCII");
      }, -1);
      
      $def(self, '$uuid', function $$uuid() {
        var self = this, str = nil;

        
        str = self.$hex(16).$split("");
        str['$[]='](12, "4");
        str['$[]='](16, (parseInt(str['$[]'](16), 16) & 3 | 8).toString(16));
        str = [str['$[]']($range(0, 8, true)), str['$[]']($range(8, 12, true)), str['$[]']($range(12, 16, true)), str['$[]']($range(16, 20, true)), str['$[]']($range(20, 32, true))];
        str = $send(str, 'map', [], "join".$to_proc());
        return str.$join("-");
      });
      
      $def(self, '$random_float', function $$random_float() {
        var self = this, bs = nil, num = nil;

        
        bs = self.$bytes(4);
        num = 0;
        $send((4), 'times', [], function $$1(i){
          
          if (i == null) i = nil;
          num = num['$<<'](8);
          return (num = num['$|'](bs['$[]'](i).$ord()));});
        return $rb_divide(num.$abs(), 2147483647);
      });
      
      $def(self, '$random_number', function $$random_number(limit) {
        var self = this;

        
        ;
        
        function randomFloat() {
          return self.$random_float();
        }

        function randomInt(max) {
          return Math.floor(randomFloat() * max);
        }

        function randomRange() {
          var min = limit.begin,
              max = limit.end;

          if (min === nil || max === nil) {
            return nil;
          }

          var length = max - min;

          if (length < 0) {
            return nil;
          }

          if (length === 0) {
            return min;
          }

          if (max % 1 === 0 && min % 1 === 0 && !limit.excl) {
            length++;
          }

          return randomInt(length) + min;
        }

        if (limit == null) {
          return randomFloat();
        } else if (limit.$$is_range) {
          return randomRange();
        } else if (limit.$$is_number) {
          if (limit <= 0) {
            $Kernel.$raise($$$('ArgumentError'), "invalid argument - " + (limit))
          }

          if (limit % 1 === 0) {
            // integer
            return randomInt(limit);
          } else {
            return randomFloat() * limit;
          }
        } else {
          limit = $Opal['$coerce_to!'](limit, $$$('Integer'), "to_int");

          if (limit <= 0) {
            $Kernel.$raise($$$('ArgumentError'), "invalid argument - " + (limit))
          }

          return randomInt(limit);
        }
      ;
      }, -1);
      return $def(self, '$alphanumeric', function $$alphanumeric(count) {
        var self = this, map = nil;

        
        if (count == null) count = nil;
        count = $$('Random').$_verify_count(count);
        map = $send([$range("0", "9", false), $range("a", "z", false), $range("A", "Z", false)], 'map', [], "to_a".$to_proc()).$flatten();
        return $send($$$('Array'), 'new', [count], function $$2(i){var self = $$2.$$s == null ? this : $$2.$$s;

          
          if (i == null) i = nil;
          return map['$[]'](self.$random_number(map.$length()));}, {$$s: self}).$join();
      }, -1);
    })(self, $nesting);
    self.$include($$$($$$('Random'), 'Formatter'));
    return self.$extend($$$($$$('Random'), 'Formatter'));
  })('::', null, $nesting)
};

Opal.modules["securerandom"] = function(Opal) {/* Generated by Opal 1.8.0 */
  var $module = Opal.module, $defs = Opal.defs, self = Opal.top, $nesting = [], nil = Opal.nil, $$$ = Opal.$$$;

  Opal.add_stubs('require,extend,warn,rand,gen_random,_verify_count,encode');
  
  self.$require("corelib/random/formatter");
  return (function($base, $parent_nesting) {
    var self = $module($base, 'SecureRandom');

    var $nesting = [self].concat($parent_nesting), $$ = Opal.$r($nesting);

    
    self.$extend($$$($$('Random'), 'Formatter'));
    
    var gen_random_bytes;

    if ((Opal.global.crypto   && Opal.global.crypto.getRandomValues) ||
        (Opal.global.msCrypto && Opal.global.msCrypto.getRandomValues)) {
      // This method is available in all non-ancient web browsers.

      var crypto = Opal.global.crypto || Opal.global.msCrypto;
      gen_random_bytes = function(count) {
        var storage = new Uint8Array(count);
        crypto.getRandomValues(storage);
        return storage;
      };
    }
    else if (Opal.global.crypto && Opal.global.crypto.randomBytes) {
      // This method is available in Node.js

      gen_random_bytes = function(count) {
        return Opal.global.crypto.randomBytes(count);
      };
    }
    else {
      // Let's dangerously polyfill this interface with our MersenneTwister
      // xor native JS Math.random xor something about current time...
      // That's hardly secure, but the following warning should provide a person
      // deploying the code a good idea on what he should do to make his deployment
      // actually secure.
      // It's possible to interface other libraries by adding an else if above if
      // that's really desired.

      self.$warn("Can't get a Crypto.getRandomValues interface or Crypto.randomBytes." + "The random values generated with SecureRandom won't be " + "cryptographically secure")

      gen_random_bytes = function(count) {
        var storage = new Uint8Array(count);
        for (var i = 0; i < count; i++) {
          storage[i] = self.$rand(255) ^ Math.floor(Math.random() * 256);
          storage[i] ^= +(new Date())>>self.$rand(255)&0xff;
        }
        return storage;
      }
    }
  ;
    $defs(self, '$bytes', function $$bytes(bytes) {
      var self = this;

      
      if (bytes == null) bytes = nil;
      return self.$gen_random(bytes);
    }, -1);
    return $defs(self, '$gen_random', function $$gen_random(count) {
      var out = nil;

      
      if (count == null) count = nil;
      count = $$('Random').$_verify_count(count);
      out = "";
      
      var bytes = gen_random_bytes(count);
      for (var i = 0; i < count; i++) {
        out += String.fromCharCode(bytes[i]);
      }
    ;
      return out.$encode("ASCII-8BIT");
    }, -1);
  })($nesting[0], $nesting);
};
