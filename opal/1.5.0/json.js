Opal.modules["json"] = function(Opal) {/* Generated by Opal 1.5.0 */
  var $nesting = [], nil = Opal.nil, $$$ = Opal.$$$, $module = Opal.module, $klass = Opal.klass, $send = Opal.send, $Object = Opal.Object, $hash2 = Opal.hash2, $eqeqeq = Opal.eqeqeq, $defs = Opal.defs, $truthy = Opal.truthy, $def = Opal.def, $return_val = Opal.return_val;

  Opal.add_stubs('raise,new,push,[]=,[],create_id,json_create,const_get,attr_accessor,create_id=,===,parse,generate,from_object,merge,to_json,responds_to?,to_io,write,to_s,to_a,strftime');
  
  (function($base, $parent_nesting) {
    var self = $module($base, 'JSON');

    var $a, $nesting = [self].concat($parent_nesting), $$ = Opal.$r($nesting);

    
    $klass($nesting[0], $$('StandardError'), 'JSONError');
    $klass($nesting[0], $$('JSONError'), 'ParserError');
    
    var $hasOwn = Opal.hasOwnProperty;

    function $parse(source) {
      try {
        return JSON.parse(source);
      } catch (e) {
        self.$raise($$$($$('JSON'), 'ParserError'), e.message);
      }
    };

    function to_opal(value, options) {
      var klass, arr, hash, i, ii, k;

      switch (typeof value) {
        case 'string':
          return value;

        case 'number':
          return value;

        case 'boolean':
          return !!value;

        case 'undefined':
          return nil;

        case 'object':
          if (!value) return nil;

          if (value.$$is_array) {
            arr = (options.array_class).$new();

            for (i = 0, ii = value.length; i < ii; i++) {
              (arr).$push(to_opal(value[i], options));
            }

            return arr;
          }
          else {
            hash = (options.object_class).$new();

            for (k in value) {
              if ($hasOwn.call(value, k)) {
                ($a = [k, to_opal(value[k], options)], $send((hash), '[]=', $a), $a[$a.length - 1]);
              }
            }

            if (!options.parse && (klass = (hash)['$[]']($$('JSON').$create_id())) != nil) {
              return $Object.$const_get(klass).$json_create(hash);
            }
            else {
              return hash;
            }
          }
        }
    };
  ;
    (function(self, $parent_nesting) {
      
      return self.$attr_accessor("create_id")
    })(Opal.get_singleton_class(self), $nesting);
    self['$create_id=']("json_class");
    $defs(self, '$[]', function $JSON_$$$1(value, options) {
      var self = this;

      
      
      if (options == null) options = $hash2([], {});;
      if ($eqeqeq($$('String'), value)) {
        return self.$parse(value, options)
      } else {
        return self.$generate(value, options)
      };
    }, -2);
    $defs(self, '$parse', function $$parse(source, options) {
      var self = this;

      
      
      if (options == null) options = $hash2([], {});;
      return self.$from_object($parse(source), options.$merge($hash2(["parse"], {"parse": true})));
    }, -2);
    $defs(self, '$parse!', function $JSON_parse$excl$2(source, options) {
      var self = this;

      
      
      if (options == null) options = $hash2([], {});;
      return self.$parse(source, options);
    }, -2);
    $defs(self, '$load', function $$load(source, options) {
      var self = this;

      
      
      if (options == null) options = $hash2([], {});;
      return self.$from_object($parse(source), options);
    }, -2);
    $defs(self, '$from_object', function $$from_object(js_object, options) {
      var $ret_or_1 = nil;

      
      
      if (options == null) options = $hash2([], {});;
      if ($truthy(($ret_or_1 = options['$[]']("object_class")))) {
        $ret_or_1
      } else {
        options['$[]=']("object_class", $$('Hash'))
      };
      if ($truthy(($ret_or_1 = options['$[]']("array_class")))) {
        $ret_or_1
      } else {
        options['$[]=']("array_class", $$('Array'))
      };
      return to_opal(js_object, options.$$smap);;
    }, -2);
    $defs(self, '$generate', function $$generate(obj, options) {
      
      
      
      if (options == null) options = $hash2([], {});;
      return obj.$to_json(options);
    }, -2);
    return $defs(self, '$dump', function $$dump(obj, io, limit) {
      var self = this, string = nil;

      
      
      if (io == null) io = nil;;
      
      if (limit == null) limit = nil;;
      string = self.$generate(obj);
      if ($truthy(io)) {
        
        if ($truthy(io['$responds_to?']("to_io"))) {
          io = io.$to_io()
        };
        io.$write(string);
        return io;
      } else {
        return string
      };
    }, -2);
  })($nesting[0], $nesting);
  (function($base, $super) {
    var self = $klass($base, $super, 'Object');

    
    return $def(self, '$to_json', function $$to_json() {
      var self = this;

      return self.$to_s().$to_json()
    }, 0)
  })($nesting[0], null);
  (function($base) {
    var self = $module($base, 'Enumerable');

    
    return $def(self, '$to_json', function $$to_json() {
      var self = this;

      return self.$to_a().$to_json()
    }, 0)
  })($nesting[0]);
  (function($base, $super) {
    var self = $klass($base, $super, 'Array');

    
    return $def(self, '$to_json', function $$to_json() {
      var self = this;

      
      var result = [];

      for (var i = 0, length = self.length; i < length; i++) {
        result.push((self[i]).$to_json());
      }

      return '[' + result.join(',') + ']';
    
    }, 0)
  })($nesting[0], null);
  (function($base, $super) {
    var self = $klass($base, $super, 'Boolean');

    
    return $def(self, '$to_json', function $$to_json() {
      var self = this;

      return (self == true) ? 'true' : 'false';
    }, 0)
  })($nesting[0], null);
  (function($base, $super) {
    var self = $klass($base, $super, 'Hash');

    
    return $def(self, '$to_json', function $$to_json() {
      var self = this;

      
      var result = [];

      for (var i = 0, keys = self.$$keys, length = keys.length, key, value; i < length; i++) {
        key = keys[i];

        if (key.$$is_string) {
          value = self.$$smap[key];
        } else {
          value = key.value;
          key = key.key;
        }

        result.push((key).$to_s().$to_json() + ':' + (value).$to_json());
      }

      return '{' + result.join(',') + '}';
    
    }, 0)
  })($nesting[0], null);
  (function($base, $super) {
    var self = $klass($base, $super, 'NilClass');

    
    return $def(self, '$to_json', $return_val("null"), 0)
  })($nesting[0], null);
  (function($base, $super) {
    var self = $klass($base, $super, 'Numeric');

    
    return $def(self, '$to_json', function $$to_json() {
      var self = this;

      return self.toString();
    }, 0)
  })($nesting[0], null);
  (function($base, $super) {
    var self = $klass($base, $super, 'String');

    
    return $def(self, '$to_json', function $$to_json() {
      var self = this;

      return JSON.stringify(self);
    }, 0)
  })($nesting[0], null);
  (function($base, $super) {
    var self = $klass($base, $super, 'Time');

    
    return $def(self, '$to_json', function $$to_json() {
      var self = this;

      return self.$strftime("%FT%T%z").$to_json()
    }, 0)
  })($nesting[0], null);
  return (function($base, $super) {
    var self = $klass($base, $super, 'Date');

    
    
    
    $def(self, '$to_json', function $$to_json() {
      var self = this;

      return self.$to_s().$to_json()
    }, 0);
    return $def(self, '$as_json', function $$as_json() {
      var self = this;

      return self.$to_s()
    }, 0);
  })($nesting[0], null);
};
