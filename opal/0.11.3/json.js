/* Generated by Opal 0.11.3 */
Opal.modules["json"] = function(Opal) {
  function $rb_minus(lhs, rhs) {
    return (typeof(lhs) === 'number' && typeof(rhs) === 'number') ? lhs - rhs : lhs['$-'](rhs);
  }
  var self = Opal.top, $nesting = [], nil = Opal.nil, $breaker = Opal.breaker, $slice = Opal.slice, $module = Opal.module, $klass = Opal.klass, $send = Opal.send, $truthy = Opal.truthy, $hash2 = Opal.hash2;

  Opal.add_stubs(['$raise', '$new', '$push', '$[]=', '$-', '$[]', '$create_id', '$json_create', '$const_get', '$attr_accessor', '$create_id=', '$===', '$parse', '$generate', '$from_object', '$merge', '$to_json', '$responds_to?', '$to_io', '$write', '$to_s', '$to_a', '$strftime']);
  
  (function($base, $parent_nesting) {
    var $JSON, self = $JSON = $module($base, 'JSON');

    var def = self.$$proto, $nesting = [self].concat($parent_nesting), TMP_JSON_$$_1, TMP_JSON_parse_2, TMP_JSON_parse$B_3, TMP_JSON_load_4, TMP_JSON_from_object_5, TMP_JSON_generate_6, TMP_JSON_dump_7, $writer = nil;

    
    (function($base, $super, $parent_nesting) {
      function $JSONError(){};
      var self = $JSONError = $klass($base, $super, 'JSONError', $JSONError);

      var def = self.$$proto, $nesting = [self].concat($parent_nesting);

      return nil
    })($nesting[0], Opal.const_get_relative($nesting, 'StandardError'), $nesting);
    (function($base, $super, $parent_nesting) {
      function $ParserError(){};
      var self = $ParserError = $klass($base, $super, 'ParserError', $ParserError);

      var def = self.$$proto, $nesting = [self].concat($parent_nesting);

      return nil
    })($nesting[0], Opal.const_get_relative($nesting, 'JSONError'), $nesting);
    
    var $hasOwn = Opal.hasOwnProperty;

    function $parse(source) {
      try {
        return JSON.parse(source);
      } catch (e) {
        self.$raise(Opal.const_get_qualified(Opal.const_get_relative($nesting, 'JSON'), 'ParserError'), e.message);
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

        case 'null':
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

            if (!options.parse && (klass = (hash)['$[]'](Opal.const_get_relative($nesting, 'JSON').$create_id())) != nil) {
              return Opal.const_get_qualified('::', 'Object').$const_get(klass).$json_create(hash);
            }
            else {
              return hash;
            }
          }
        }
    };
  ;
    (function(self, $parent_nesting) {
      var def = self.$$proto, $nesting = [self].concat($parent_nesting);

      return self.$attr_accessor("create_id")
    })(Opal.get_singleton_class(self), $nesting);
    
    $writer = ["json_class"];
    $send(self, 'create_id=', Opal.to_a($writer));
    $writer[$rb_minus($writer["length"], 1)];;
    Opal.defs(self, '$[]', TMP_JSON_$$_1 = function(value, options) {
      var self = this;

      if (options == null) {
        options = $hash2([], {});
      }
      if ($truthy(Opal.const_get_relative($nesting, 'String')['$==='](value))) {
        return self.$parse(value, options)
        } else {
        return self.$generate(value, options)
      }
    }, TMP_JSON_$$_1.$$arity = -2);
    Opal.defs(self, '$parse', TMP_JSON_parse_2 = function $$parse(source, options) {
      var self = this;

      if (options == null) {
        options = $hash2([], {});
      }
      return self.$from_object($parse(source), options.$merge($hash2(["parse"], {"parse": true})))
    }, TMP_JSON_parse_2.$$arity = -2);
    Opal.defs(self, '$parse!', TMP_JSON_parse$B_3 = function(source, options) {
      var self = this;

      if (options == null) {
        options = $hash2([], {});
      }
      return self.$parse(source, options)
    }, TMP_JSON_parse$B_3.$$arity = -2);
    Opal.defs(self, '$load', TMP_JSON_load_4 = function $$load(source, options) {
      var self = this;

      if (options == null) {
        options = $hash2([], {});
      }
      return self.$from_object($parse(source), options)
    }, TMP_JSON_load_4.$$arity = -2);
    Opal.defs(self, '$from_object', TMP_JSON_from_object_5 = function $$from_object(js_object, options) {
      var $a, self = this, $writer = nil;

      if (options == null) {
        options = $hash2([], {});
      }
      
      ($truthy($a = options['$[]']("object_class")) ? $a : (($writer = ["object_class", Opal.const_get_relative($nesting, 'Hash')]), $send(options, '[]=', Opal.to_a($writer)), $writer[$rb_minus($writer["length"], 1)]));
      ($truthy($a = options['$[]']("array_class")) ? $a : (($writer = ["array_class", Opal.const_get_relative($nesting, 'Array')]), $send(options, '[]=', Opal.to_a($writer)), $writer[$rb_minus($writer["length"], 1)]));
      return to_opal(js_object, options.$$smap);
    }, TMP_JSON_from_object_5.$$arity = -2);
    Opal.defs(self, '$generate', TMP_JSON_generate_6 = function $$generate(obj, options) {
      var self = this;

      if (options == null) {
        options = $hash2([], {});
      }
      return obj.$to_json(options)
    }, TMP_JSON_generate_6.$$arity = -2);
    Opal.defs(self, '$dump', TMP_JSON_dump_7 = function $$dump(obj, io, limit) {
      var self = this, string = nil;

      if (io == null) {
        io = nil;
      }
      if (limit == null) {
        limit = nil;
      }
      
      string = self.$generate(obj);
      if ($truthy(io)) {
        
        if ($truthy(io['$responds_to?']("to_io"))) {
          io = io.$to_io()};
        io.$write(string);
        return io;
        } else {
        return string
      };
    }, TMP_JSON_dump_7.$$arity = -2);
  })($nesting[0], $nesting);
  (function($base, $super, $parent_nesting) {
    function $Object(){};
    var self = $Object = $klass($base, $super, 'Object', $Object);

    var def = self.$$proto, $nesting = [self].concat($parent_nesting), TMP_Object_to_json_8;

    return (Opal.defn(self, '$to_json', TMP_Object_to_json_8 = function $$to_json() {
      var self = this;

      return self.$to_s().$to_json()
    }, TMP_Object_to_json_8.$$arity = 0), nil) && 'to_json'
  })($nesting[0], null, $nesting);
  (function($base, $parent_nesting) {
    var $Enumerable, self = $Enumerable = $module($base, 'Enumerable');

    var def = self.$$proto, $nesting = [self].concat($parent_nesting), TMP_Enumerable_to_json_9;

    
    Opal.defn(self, '$to_json', TMP_Enumerable_to_json_9 = function $$to_json() {
      var self = this;

      return self.$to_a().$to_json()
    }, TMP_Enumerable_to_json_9.$$arity = 0)
  })($nesting[0], $nesting);
  (function($base, $super, $parent_nesting) {
    function $Array(){};
    var self = $Array = $klass($base, $super, 'Array', $Array);

    var def = self.$$proto, $nesting = [self].concat($parent_nesting), TMP_Array_to_json_10;

    return (Opal.defn(self, '$to_json', TMP_Array_to_json_10 = function $$to_json() {
      var self = this;

      
      var result = [];

      for (var i = 0, length = self.length; i < length; i++) {
        result.push((self[i]).$to_json());
      }

      return '[' + result.join(', ') + ']';
    
    }, TMP_Array_to_json_10.$$arity = 0), nil) && 'to_json'
  })($nesting[0], null, $nesting);
  (function($base, $super, $parent_nesting) {
    function $Boolean(){};
    var self = $Boolean = $klass($base, $super, 'Boolean', $Boolean);

    var def = self.$$proto, $nesting = [self].concat($parent_nesting), TMP_Boolean_to_json_11;

    return (Opal.defn(self, '$to_json', TMP_Boolean_to_json_11 = function $$to_json() {
      var self = this;

      return (self == true) ? 'true' : 'false'
    }, TMP_Boolean_to_json_11.$$arity = 0), nil) && 'to_json'
  })($nesting[0], null, $nesting);
  (function($base, $super, $parent_nesting) {
    function $Hash(){};
    var self = $Hash = $klass($base, $super, 'Hash', $Hash);

    var def = self.$$proto, $nesting = [self].concat($parent_nesting), TMP_Hash_to_json_12;

    return (Opal.defn(self, '$to_json', TMP_Hash_to_json_12 = function $$to_json() {
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

      return '{' + result.join(', ') + '}';
    
    }, TMP_Hash_to_json_12.$$arity = 0), nil) && 'to_json'
  })($nesting[0], null, $nesting);
  (function($base, $super, $parent_nesting) {
    function $NilClass(){};
    var self = $NilClass = $klass($base, $super, 'NilClass', $NilClass);

    var def = self.$$proto, $nesting = [self].concat($parent_nesting), TMP_NilClass_to_json_13;

    return (Opal.defn(self, '$to_json', TMP_NilClass_to_json_13 = function $$to_json() {
      var self = this;

      return "null"
    }, TMP_NilClass_to_json_13.$$arity = 0), nil) && 'to_json'
  })($nesting[0], null, $nesting);
  (function($base, $super, $parent_nesting) {
    function $Numeric(){};
    var self = $Numeric = $klass($base, $super, 'Numeric', $Numeric);

    var def = self.$$proto, $nesting = [self].concat($parent_nesting), TMP_Numeric_to_json_14;

    return (Opal.defn(self, '$to_json', TMP_Numeric_to_json_14 = function $$to_json() {
      var self = this;

      return self.toString()
    }, TMP_Numeric_to_json_14.$$arity = 0), nil) && 'to_json'
  })($nesting[0], null, $nesting);
  (function($base, $super, $parent_nesting) {
    function $String(){};
    var self = $String = $klass($base, $super, 'String', $String);

    var def = self.$$proto, $nesting = [self].concat($parent_nesting);

    return Opal.alias(self, "to_json", "inspect")
  })($nesting[0], null, $nesting);
  (function($base, $super, $parent_nesting) {
    function $Time(){};
    var self = $Time = $klass($base, $super, 'Time', $Time);

    var def = self.$$proto, $nesting = [self].concat($parent_nesting), TMP_Time_to_json_15;

    return (Opal.defn(self, '$to_json', TMP_Time_to_json_15 = function $$to_json() {
      var self = this;

      return self.$strftime("%FT%T%z").$to_json()
    }, TMP_Time_to_json_15.$$arity = 0), nil) && 'to_json'
  })($nesting[0], null, $nesting);
  return (function($base, $super, $parent_nesting) {
    function $Date(){};
    var self = $Date = $klass($base, $super, 'Date', $Date);

    var def = self.$$proto, $nesting = [self].concat($parent_nesting), TMP_Date_to_json_16, TMP_Date_as_json_17;

    
    
    Opal.defn(self, '$to_json', TMP_Date_to_json_16 = function $$to_json() {
      var self = this;

      return self.$to_s().$to_json()
    }, TMP_Date_to_json_16.$$arity = 0);
    return (Opal.defn(self, '$as_json', TMP_Date_as_json_17 = function $$as_json() {
      var self = this;

      return self.$to_s()
    }, TMP_Date_as_json_17.$$arity = 0), nil) && 'as_json';
  })($nesting[0], null, $nesting);
};
