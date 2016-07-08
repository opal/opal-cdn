/* Generated by Opal 0.10.1 */
Opal.modules["json"] = function(Opal) {
  var self = Opal.top, $scope = Opal, nil = Opal.nil, $breaker = Opal.breaker, $slice = Opal.slice, $module = Opal.module, $hash2 = Opal.hash2, $klass = Opal.klass;

  Opal.add_stubs(['$new', '$push', '$[]=', '$[]', '$create_id', '$json_create', '$attr_accessor', '$create_id=', '$===', '$parse', '$generate', '$from_object', '$merge', '$to_json', '$responds_to?', '$to_io', '$write', '$to_s', '$to_a', '$strftime']);
  (function($base) {
    var $JSON, self = $JSON = $module($base, 'JSON');

    var def = self.$$proto, $scope = self.$$scope, $a, $b, TMP_1, TMP_2, TMP_3, TMP_4, TMP_5, TMP_6, TMP_7;

    
    var $parse  = JSON.parse,
        $hasOwn = Opal.hasOwnProperty;

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
                (hash)['$[]='](k, to_opal(value[k], options));
              }
            }

            if (!options.parse && (klass = (hash)['$[]']($scope.get('JSON').$create_id())) != nil) {
              klass = Opal.get(klass);
              return (klass).$json_create(hash);
            }
            else {
              return hash;
            }
          }
        }
    };
  

    (function(self) {
      var $scope = self.$$scope, def = self.$$proto;

      return self.$attr_accessor("create_id")
    })(Opal.get_singleton_class(self));

    (($a = ["json_class"]), $b = self, $b['$create_id='].apply($b, $a), $a[$a.length-1]);

    Opal.defs(self, '$[]', TMP_1 = function(value, options) {
      var $a, self = this;

      if (options == null) {
        options = $hash2([], {});
      }
      if ((($a = $scope.get('String')['$==='](value)) !== nil && $a != null && (!$a.$$is_boolean || $a == true))) {
        return self.$parse(value, options)
        } else {
        return self.$generate(value, options)
      };
    }, TMP_1.$$arity = -2);

    Opal.defs(self, '$parse', TMP_2 = function ːparse(source, options) {
      var self = this;

      if (options == null) {
        options = $hash2([], {});
      }
      return self.$from_object($parse(source), options.$merge($hash2(["parse"], {"parse": true})));
    }, TMP_2.$$arity = -2);

    Opal.defs(self, '$parse!', TMP_3 = function(source, options) {
      var self = this;

      if (options == null) {
        options = $hash2([], {});
      }
      return self.$parse(source, options);
    }, TMP_3.$$arity = -2);

    Opal.defs(self, '$load', TMP_4 = function ːload(source, options) {
      var self = this;

      if (options == null) {
        options = $hash2([], {});
      }
      return self.$from_object($parse(source), options);
    }, TMP_4.$$arity = -2);

    Opal.defs(self, '$from_object', TMP_5 = function ːfrom_object(js_object, options) {
      var $a, $b, $c, self = this;

      if (options == null) {
        options = $hash2([], {});
      }
      ($a = "object_class", $b = options, ((($c = $b['$[]']($a)) !== false && $c !== nil && $c != null) ? $c : $b['$[]=']($a, $scope.get('Hash'))));
      ($a = "array_class", $b = options, ((($c = $b['$[]']($a)) !== false && $c !== nil && $c != null) ? $c : $b['$[]=']($a, $scope.get('Array'))));
      return to_opal(js_object, options.$$smap);
    }, TMP_5.$$arity = -2);

    Opal.defs(self, '$generate', TMP_6 = function ːgenerate(obj, options) {
      var self = this;

      if (options == null) {
        options = $hash2([], {});
      }
      return obj.$to_json(options);
    }, TMP_6.$$arity = -2);

    Opal.defs(self, '$dump', TMP_7 = function ːdump(obj, io, limit) {
      var $a, self = this, string = nil;

      if (io == null) {
        io = nil;
      }
      if (limit == null) {
        limit = nil;
      }
      string = self.$generate(obj);
      if (io !== false && io !== nil && io != null) {
        if ((($a = io['$responds_to?']("to_io")) !== nil && $a != null && (!$a.$$is_boolean || $a == true))) {
          io = io.$to_io()};
        io.$write(string);
        return io;
        } else {
        return string
      };
    }, TMP_7.$$arity = -2);
  })($scope.base);
  (function($base, $super) {
    function $Object(){};
    var self = $Object = $klass($base, $super, 'Object', $Object);

    var def = self.$$proto, $scope = self.$$scope, TMP_8;

    return (Opal.defn(self, '$to_json', TMP_8 = function ːto_json() {
      var self = this;

      return self.$to_s().$to_json();
    }, TMP_8.$$arity = 0), nil) && 'to_json'
  })($scope.base, null);
  (function($base) {
    var $Enumerable, self = $Enumerable = $module($base, 'Enumerable');

    var def = self.$$proto, $scope = self.$$scope, TMP_9;

    Opal.defn(self, '$to_json', TMP_9 = function ːto_json() {
      var self = this;

      return self.$to_a().$to_json();
    }, TMP_9.$$arity = 0)
  })($scope.base);
  (function($base, $super) {
    function $Array(){};
    var self = $Array = $klass($base, $super, 'Array', $Array);

    var def = self.$$proto, $scope = self.$$scope, TMP_10;

    return (Opal.defn(self, '$to_json', TMP_10 = function ːto_json() {
      var self = this;

      
      var result = [];

      for (var i = 0, length = self.length; i < length; i++) {
        result.push((self[i]).$to_json());
      }

      return '[' + result.join(', ') + ']';
    
    }, TMP_10.$$arity = 0), nil) && 'to_json'
  })($scope.base, null);
  (function($base, $super) {
    function $Boolean(){};
    var self = $Boolean = $klass($base, $super, 'Boolean', $Boolean);

    var def = self.$$proto, $scope = self.$$scope, TMP_11;

    return (Opal.defn(self, '$to_json', TMP_11 = function ːto_json() {
      var self = this;

      return (self == true) ? 'true' : 'false';
    }, TMP_11.$$arity = 0), nil) && 'to_json'
  })($scope.base, null);
  (function($base, $super) {
    function $Hash(){};
    var self = $Hash = $klass($base, $super, 'Hash', $Hash);

    var def = self.$$proto, $scope = self.$$scope, TMP_12;

    return (Opal.defn(self, '$to_json', TMP_12 = function ːto_json() {
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
    ;
    }, TMP_12.$$arity = 0), nil) && 'to_json'
  })($scope.base, null);
  (function($base, $super) {
    function $NilClass(){};
    var self = $NilClass = $klass($base, $super, 'NilClass', $NilClass);

    var def = self.$$proto, $scope = self.$$scope, TMP_13;

    return (Opal.defn(self, '$to_json', TMP_13 = function ːto_json() {
      var self = this;

      return "null";
    }, TMP_13.$$arity = 0), nil) && 'to_json'
  })($scope.base, null);
  (function($base, $super) {
    function $Numeric(){};
    var self = $Numeric = $klass($base, $super, 'Numeric', $Numeric);

    var def = self.$$proto, $scope = self.$$scope, TMP_14;

    return (Opal.defn(self, '$to_json', TMP_14 = function ːto_json() {
      var self = this;

      return self.toString();
    }, TMP_14.$$arity = 0), nil) && 'to_json'
  })($scope.base, null);
  (function($base, $super) {
    function $String(){};
    var self = $String = $klass($base, $super, 'String', $String);

    var def = self.$$proto, $scope = self.$$scope;

    return Opal.alias(self, 'to_json', 'inspect')
  })($scope.base, null);
  (function($base, $super) {
    function $Time(){};
    var self = $Time = $klass($base, $super, 'Time', $Time);

    var def = self.$$proto, $scope = self.$$scope, TMP_15;

    return (Opal.defn(self, '$to_json', TMP_15 = function ːto_json() {
      var self = this;

      return self.$strftime("%FT%T%z").$to_json();
    }, TMP_15.$$arity = 0), nil) && 'to_json'
  })($scope.base, null);
  return (function($base, $super) {
    function $Date(){};
    var self = $Date = $klass($base, $super, 'Date', $Date);

    var def = self.$$proto, $scope = self.$$scope, TMP_16, TMP_17;

    Opal.defn(self, '$to_json', TMP_16 = function ːto_json() {
      var self = this;

      return self.$to_s().$to_json();
    }, TMP_16.$$arity = 0);

    return (Opal.defn(self, '$as_json', TMP_17 = function ːas_json() {
      var self = this;

      return self.$to_s();
    }, TMP_17.$$arity = 0), nil) && 'as_json';
  })($scope.base, null);
};
