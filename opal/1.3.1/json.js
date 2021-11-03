Opal.modules["json"] = function(Opal) {/* Generated by Opal 1.3.1 */
  function $rb_minus(lhs, rhs) {
    return (typeof(lhs) === 'number' && typeof(rhs) === 'number') ? lhs - rhs : lhs['$-'](rhs);
  }
  var self = Opal.top, $nesting = [], nil = Opal.nil, $$$ = Opal.$$$, $$ = Opal.$$, $module = Opal.module, $klass = Opal.klass, $send = Opal.send, $hash2 = Opal.hash2, $truthy = Opal.truthy;

  Opal.add_stubs(['$raise', '$new', '$push', '$[]=', '$-', '$[]', '$create_id', '$json_create', '$const_get', '$attr_accessor', '$create_id=', '$===', '$parse', '$generate', '$from_object', '$merge', '$to_json', '$responds_to?', '$to_io', '$write', '$to_s', '$to_a', '$strftime']);
  
  (function($base, $parent_nesting) {
    var self = $module($base, 'JSON');

    var $nesting = [self].concat($parent_nesting), $JSON_$$$1, $JSON_parse$2, $JSON_parse$excl$3, $JSON_load$4, $JSON_from_object$5, $JSON_generate$6, $JSON_dump$7, $writer = nil;

    
    (function($base, $super, $parent_nesting) {
      var self = $klass($base, $super, 'JSONError');

      var $nesting = [self].concat($parent_nesting);

      return nil
    })($nesting[0], $$($nesting, 'StandardError'), $nesting);
    (function($base, $super, $parent_nesting) {
      var self = $klass($base, $super, 'ParserError');

      var $nesting = [self].concat($parent_nesting);

      return nil
    })($nesting[0], $$($nesting, 'JSONError'), $nesting);
    
    var $hasOwn = Opal.hasOwnProperty;

    function $parse(source) {
      try {
        return JSON.parse(source);
      } catch (e) {
        self.$raise($$$($$($nesting, 'JSON'), 'ParserError'), e.message);
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
                (($writer = [k, to_opal(value[k], options)]), $send((hash), '[]=', Opal.to_a($writer)), $writer[$rb_minus($writer["length"], 1)]);
              }
            }

            if (!options.parse && (klass = (hash)['$[]']($$($nesting, 'JSON').$create_id())) != nil) {
              return $$$('::', 'Object').$const_get(klass).$json_create(hash);
            }
            else {
              return hash;
            }
          }
        }
    };
  ;
    (function(self, $parent_nesting) {
      var $nesting = [self].concat($parent_nesting);

      return self.$attr_accessor("create_id")
    })(Opal.get_singleton_class(self), $nesting);
    
    $writer = ["json_class"];
    $send(self, 'create_id=', Opal.to_a($writer));
    $writer[$rb_minus($writer["length"], 1)];;
    Opal.defs(self, '$[]', $JSON_$$$1 = function(value, options) {
      var self = this;

      
      
      if (options == null) {
        options = $hash2([], {});
      };
      if ($truthy($$($nesting, 'String')['$==='](value))) {
        return self.$parse(value, options)
      } else {
        return self.$generate(value, options)
      };
    }, $JSON_$$$1.$$arity = -2);
    Opal.defs(self, '$parse', $JSON_parse$2 = function $$parse(source, options) {
      var self = this;

      
      
      if (options == null) {
        options = $hash2([], {});
      };
      return self.$from_object($parse(source), options.$merge($hash2(["parse"], {"parse": true})));
    }, $JSON_parse$2.$$arity = -2);
    Opal.defs(self, '$parse!', $JSON_parse$excl$3 = function(source, options) {
      var self = this;

      
      
      if (options == null) {
        options = $hash2([], {});
      };
      return self.$parse(source, options);
    }, $JSON_parse$excl$3.$$arity = -2);
    Opal.defs(self, '$load', $JSON_load$4 = function $$load(source, options) {
      var self = this;

      
      
      if (options == null) {
        options = $hash2([], {});
      };
      return self.$from_object($parse(source), options);
    }, $JSON_load$4.$$arity = -2);
    Opal.defs(self, '$from_object', $JSON_from_object$5 = function $$from_object(js_object, options) {
      var self = this, $ret_or_1 = nil, $writer = nil, $ret_or_2 = nil;

      
      
      if (options == null) {
        options = $hash2([], {});
      };
      if ($truthy(($ret_or_1 = options['$[]']("object_class")))) {
        $ret_or_1
      } else {
        
        $writer = ["object_class", $$($nesting, 'Hash')];
        $send(options, '[]=', Opal.to_a($writer));
        $writer[$rb_minus($writer["length"], 1)];
      };
      if ($truthy(($ret_or_2 = options['$[]']("array_class")))) {
        $ret_or_2
      } else {
        
        $writer = ["array_class", $$($nesting, 'Array')];
        $send(options, '[]=', Opal.to_a($writer));
        $writer[$rb_minus($writer["length"], 1)];
      };
      return to_opal(js_object, options.$$smap);;
    }, $JSON_from_object$5.$$arity = -2);
    Opal.defs(self, '$generate', $JSON_generate$6 = function $$generate(obj, options) {
      var self = this;

      
      
      if (options == null) {
        options = $hash2([], {});
      };
      return obj.$to_json(options);
    }, $JSON_generate$6.$$arity = -2);
    return (Opal.defs(self, '$dump', $JSON_dump$7 = function $$dump(obj, io, limit) {
      var self = this, string = nil;

      
      
      if (io == null) {
        io = nil;
      };
      
      if (limit == null) {
        limit = nil;
      };
      string = self.$generate(obj);
      if ($truthy(io)) {
        
        if ($truthy(io['$responds_to?']("to_io"))) {
          io = io.$to_io()};
        io.$write(string);
        return io;
      } else {
        return string
      };
    }, $JSON_dump$7.$$arity = -2), nil) && 'dump';
  })($nesting[0], $nesting);
  (function($base, $super, $parent_nesting) {
    var self = $klass($base, $super, 'Object');

    var $nesting = [self].concat($parent_nesting), $Object_to_json$8;

    return (Opal.def(self, '$to_json', $Object_to_json$8 = function $$to_json() {
      var self = this;

      return self.$to_s().$to_json()
    }, $Object_to_json$8.$$arity = 0), nil) && 'to_json'
  })($nesting[0], null, $nesting);
  (function($base, $parent_nesting) {
    var self = $module($base, 'Enumerable');

    var $nesting = [self].concat($parent_nesting), $Enumerable_to_json$9;

    return (Opal.def(self, '$to_json', $Enumerable_to_json$9 = function $$to_json() {
      var self = this;

      return self.$to_a().$to_json()
    }, $Enumerable_to_json$9.$$arity = 0), nil) && 'to_json'
  })($nesting[0], $nesting);
  (function($base, $super, $parent_nesting) {
    var self = $klass($base, $super, 'Array');

    var $nesting = [self].concat($parent_nesting), $Array_to_json$10;

    return (Opal.def(self, '$to_json', $Array_to_json$10 = function $$to_json() {
      var self = this;

      
      var result = [];

      for (var i = 0, length = self.length; i < length; i++) {
        result.push((self[i]).$to_json());
      }

      return '[' + result.join(',') + ']';
    
    }, $Array_to_json$10.$$arity = 0), nil) && 'to_json'
  })($nesting[0], null, $nesting);
  (function($base, $super, $parent_nesting) {
    var self = $klass($base, $super, 'Boolean');

    var $nesting = [self].concat($parent_nesting), $Boolean_to_json$11;

    return (Opal.def(self, '$to_json', $Boolean_to_json$11 = function $$to_json() {
      var self = this;

      return (self == true) ? 'true' : 'false';
    }, $Boolean_to_json$11.$$arity = 0), nil) && 'to_json'
  })($nesting[0], null, $nesting);
  (function($base, $super, $parent_nesting) {
    var self = $klass($base, $super, 'Hash');

    var $nesting = [self].concat($parent_nesting), $Hash_to_json$12;

    return (Opal.def(self, '$to_json', $Hash_to_json$12 = function $$to_json() {
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
    
    }, $Hash_to_json$12.$$arity = 0), nil) && 'to_json'
  })($nesting[0], null, $nesting);
  (function($base, $super, $parent_nesting) {
    var self = $klass($base, $super, 'NilClass');

    var $nesting = [self].concat($parent_nesting), $NilClass_to_json$13;

    return (Opal.def(self, '$to_json', $NilClass_to_json$13 = function $$to_json() {
      var self = this;

      return "null"
    }, $NilClass_to_json$13.$$arity = 0), nil) && 'to_json'
  })($nesting[0], null, $nesting);
  (function($base, $super, $parent_nesting) {
    var self = $klass($base, $super, 'Numeric');

    var $nesting = [self].concat($parent_nesting), $Numeric_to_json$14;

    return (Opal.def(self, '$to_json', $Numeric_to_json$14 = function $$to_json() {
      var self = this;

      return self.toString();
    }, $Numeric_to_json$14.$$arity = 0), nil) && 'to_json'
  })($nesting[0], null, $nesting);
  (function($base, $super, $parent_nesting) {
    var self = $klass($base, $super, 'String');

    var $nesting = [self].concat($parent_nesting), $String_to_json$15;

    return (Opal.def(self, '$to_json', $String_to_json$15 = function $$to_json() {
      var self = this;

      return JSON.stringify(self);
    }, $String_to_json$15.$$arity = 0), nil) && 'to_json'
  })($nesting[0], null, $nesting);
  (function($base, $super, $parent_nesting) {
    var self = $klass($base, $super, 'Time');

    var $nesting = [self].concat($parent_nesting), $Time_to_json$16;

    return (Opal.def(self, '$to_json', $Time_to_json$16 = function $$to_json() {
      var self = this;

      return self.$strftime("%FT%T%z").$to_json()
    }, $Time_to_json$16.$$arity = 0), nil) && 'to_json'
  })($nesting[0], null, $nesting);
  return (function($base, $super, $parent_nesting) {
    var self = $klass($base, $super, 'Date');

    var $nesting = [self].concat($parent_nesting), $Date_to_json$17, $Date_as_json$18;

    
    
    Opal.def(self, '$to_json', $Date_to_json$17 = function $$to_json() {
      var self = this;

      return self.$to_s().$to_json()
    }, $Date_to_json$17.$$arity = 0);
    return (Opal.def(self, '$as_json', $Date_as_json$18 = function $$as_json() {
      var self = this;

      return self.$to_s()
    }, $Date_as_json$18.$$arity = 0), nil) && 'as_json';
  })($nesting[0], null, $nesting);
};
