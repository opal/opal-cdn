(function(global_object) {
  "use strict";

  // @note
  //   A few conventions for the documentation of this file:
  //   1. Always use "//" (in contrast with "/**/")
  //   2. The syntax used is Yardoc (yardoc.org), which is intended for Ruby (se below)
  //   3. `@param` and `@return` types should be preceded by `JS.` when referring to
  //      JavaScript constructors (e.g. `JS.Function`) otherwise Ruby is assumed.
  //   4. `nil` and `null` being unambiguous refer to the respective
  //      objects/values in Ruby and JavaScript
  //   5. This is still WIP :) so please give feedback and suggestions on how
  //      to improve or for alternative solutions
  //
  //   The way the code is digested before going through Yardoc is a secret kept
  //   in the docs repo (https://github.com/opal/docs/tree/master).

  var console;

  // Detect the global object
  if (typeof(globalThis) !== 'undefined') { global_object = globalThis; }
  else if (typeof(global) !== 'undefined') { global_object = global; }
  else if (typeof(window) !== 'undefined') { global_object = window; }

  // Setup a dummy console object if missing
  if (global_object.console == null) {
    global_object.console = {};
  }

  if (typeof(global_object.console) === 'object') {
    console = global_object.console;
  } else {
    console = {};
  }

  if (!('log' in console)) { console.log = function () {}; }
  if (!('warn' in console)) { console.warn = console.log; }

  if (typeof(global_object.Opal) !== 'undefined') {
    console.warn('Opal already loaded. Loading twice can cause troubles, please fix your setup.');
    return global_object.Opal;
  }

  var nil;

  // The actual class for BasicObject
  var BasicObject;

  // The actual Object class.
  // The leading underscore is to avoid confusion with window.Object()
  var _Object;

  // The actual Module class
  var Module;

  // The actual Class class
  var Class;

  // The Opal.Opal class (helpers etc.)
  var _Opal;

  // The Kernel module
  var Kernel;

  // The Opal object that is exposed globally
  var Opal = global_object.Opal = {};

  // This is a useful reference to global object inside ruby files
  Opal.global = global_object;

  // Configure runtime behavior with regards to require and unsupported features
  Opal.config = {
    missing_require_severity: 'error',        // error, warning, ignore
    unsupported_features_severity: 'warning', // error, warning, ignore
    experimental_features_severity: 'warning',// warning, ignore
    enable_stack_trace: true                  // true, false
  };

  // Minify common function calls
  var $has_own   = Object.hasOwnProperty;
  var $bind      = Function.prototype.bind;
  var $set_proto = Object.setPrototypeOf;
  var $slice     = Array.prototype.slice;
  var $splice    = Array.prototype.splice;

  // Nil object id is always 4
  var nil_id = 4;

  // Generates even sequential numbers greater than 4
  // (nil_id) to serve as unique ids for ruby objects
  var unique_id = nil_id;

  // Return next unique id
  function $uid() {
    unique_id += 2;
    return unique_id;
  };
  Opal.uid = $uid;

  // Retrieve or assign the id of an object
  Opal.id = function(obj) {
    if (obj.$$is_number) return (obj * 2)+1;
    if (obj.$$id == null) {
      $prop(obj, '$$id', $uid());
    }
    return obj.$$id;
  };

  // Globals table
  var $gvars = Opal.gvars = {};

  // Exit function, this should be replaced by platform specific implementation
  // (See nodejs and chrome for examples)
  Opal.exit = function(status) { if ($gvars.DEBUG) console.log('Exited with status '+status); };

  // keeps track of exceptions for $!
  Opal.exceptions = [];

  // @private
  // Pops an exception from the stack and updates `$!`.
  Opal.pop_exception = function() {
    var exception = Opal.exceptions.pop();
    if (exception) {
      $gvars["!"] = exception;
      $gvars["@"] = exception.$backtrace();
    }
    else {
      $gvars["!"] = $gvars["@"] = nil;
    }
  };

  function $prop(object, name, initialValue) {
    if (typeof(object) === "string") {
      // Special case for:
      //   s = "string"
      //   def s.m; end
      // String class is the only class that:
      // + compiles to JS primitive
      // + allows method definition directly on instances
      // numbers, true, false and null do not support it.
      object[name] = initialValue;
    } else {
      Object.defineProperty(object, name, {
        value: initialValue,
        enumerable: false,
        configurable: true,
        writable: true
      });
    }
  }

  Opal.prop = $prop;

  // @deprecated
  Opal.defineProperty = Opal.prop;

  Opal.slice = $slice;


  // Helpers
  // -----

  var $truthy = Opal.truthy = function(val) {
    return false !== val && nil !== val && undefined !== val && null !== val && (!(val instanceof Boolean) || true === val.valueOf());
  };

  Opal.falsy = function(val) {
    return !$truthy(val);
  };

  Opal.type_error = function(object, type, method, coerced) {
    object = object.$$class;

    if (coerced && method) {
      coerced = coerced.$$class;
      return Opal.TypeError.$new(
        "can't convert " + object + " into " + type +
        " (" + object + "#" + method + " gives " + coerced + ")"
      )
    } else {
      return Opal.TypeError.$new(
        "no implicit conversion of " + object + " into " + type
      )
    }
  };

  Opal.coerce_to = function(object, type, method, args) {
    var body;

    if (method === 'to_int' && type === Opal.Integer && object.$$is_number)
      return object < 0 ? Math.ceil(object) : Math.floor(object);

    if (method === 'to_str' && type === Opal.String && object.$$is_string)
      return object;

    if (Opal.is_a(object, type)) return object;

    // Fast path for the most common situation
    if (object['$respond_to?'].$$pristine && object.$method_missing.$$pristine) {
      body = object['$' + method];
      if (body == null || body.$$stub) throw Opal.type_error(object, type);
      return body.apply(object, args);
    }

    if (!object['$respond_to?'](method)) {
      throw Opal.type_error(object, type);
    }

    if (args == null) args = [];
    return Opal.send(object, method, args);
  }

  Opal.respond_to = function(obj, jsid, include_all) {
    if (obj == null || !obj.$$class) return false;
    include_all = !!include_all;
    var body = obj[jsid];

    if (obj['$respond_to?'].$$pristine) {
      if (typeof(body) === "function" && !body.$$stub) {
        return true;
      }
      if (!obj['$respond_to_missing?'].$$pristine) {
        return Opal.send(obj, obj['$respond_to_missing?'], [jsid.substr(1), include_all]);
      }
    } else {
      return Opal.send(obj, obj['$respond_to?'], [jsid.substr(1), include_all]);
    }
  }

  // TracePoint support
  // ------------------
  //
  // Support for `TracePoint.trace(:class) do ... end`
  Opal.trace_class = false;
  Opal.tracers_for_class = [];

  function invoke_tracers_for_class(klass_or_module) {
    var i, ii, tracer;

    for(i = 0, ii = Opal.tracers_for_class.length; i < ii; i++) {
      tracer = Opal.tracers_for_class[i];
      tracer.trace_object = klass_or_module;
      tracer.block.$call(tracer);
    }
  }

  function handle_autoload(cref, name) {
    if (!cref.$$autoload[name].loaded) {
      cref.$$autoload[name].loaded = true;
      try {
        Opal.Kernel.$require(cref.$$autoload[name].path);
      } catch (e) {
        cref.$$autoload[name].exception = e;
        throw e;
      }
      cref.$$autoload[name].required = true;
      if (cref.$$const[name] != null) {
        cref.$$autoload[name].success = true;
        return cref.$$const[name];
      }
    } else if (cref.$$autoload[name].loaded && !cref.$$autoload[name].required) {
      if (cref.$$autoload[name].exception) { throw cref.$$autoload[name].exception; }
    }
  }

  // Constants
  // ---------
  //
  // For future reference:
  // - The Rails autoloading guide (http://guides.rubyonrails.org/v5.0/autoloading_and_reloading_constants.html)
  // - @ConradIrwin's 2012 post on “Everything you ever wanted to know about constant lookup in Ruby” (http://cirw.in/blog/constant-lookup.html)
  //
  // Legend of MRI concepts/names:
  // - constant reference (cref): the module/class that acts as a namespace
  // - nesting: the namespaces wrapping the current scope, e.g. nesting inside
  //            `module A; module B::C; end; end` is `[B::C, A]`

  // Get the constant in the scope of the current cref
  function const_get_name(cref, name) {
    if (cref) {
      if (cref.$$const[name] != null) { return cref.$$const[name]; }
      if (cref.$$autoload && cref.$$autoload[name]) {
        return handle_autoload(cref, name);
      }
    }
  }

  // Walk up the nesting array looking for the constant
  function const_lookup_nesting(nesting, name) {
    var i, ii, constant;

    if (nesting.length === 0) return;

    // If the nesting is not empty the constant is looked up in its elements
    // and in order. The ancestors of those elements are ignored.
    for (i = 0, ii = nesting.length; i < ii; i++) {
      constant = nesting[i].$$const[name];
      if (constant != null) {
        return constant;
      } else if (nesting[i].$$autoload && nesting[i].$$autoload[name]) {
        return handle_autoload(nesting[i], name);
      }
    }
  }

  // Walk up the ancestors chain looking for the constant
  function const_lookup_ancestors(cref, name) {
    var i, ii, ancestors;

    if (cref == null) return;

    ancestors = $ancestors(cref);

    for (i = 0, ii = ancestors.length; i < ii; i++) {
      if (ancestors[i].$$const && $has_own.call(ancestors[i].$$const, name)) {
        return ancestors[i].$$const[name];
      } else if (ancestors[i].$$autoload && ancestors[i].$$autoload[name]) {
        return handle_autoload(ancestors[i], name);
      }
    }
  }

  // Walk up Object's ancestors chain looking for the constant,
  // but only if cref is missing or a module.
  function const_lookup_Object(cref, name) {
    if (cref == null || cref.$$is_module) {
      return const_lookup_ancestors(_Object, name);
    }
  }

  // Call const_missing if nothing else worked
  function const_missing(cref, name) {
    return (cref || _Object).$const_missing(name);
  }

  // Look for the constant just in the current cref or call `#const_missing`
  Opal.const_get_local = function(cref, name, skip_missing) {
    var result;

    if (cref == null) return;

    if (cref === '::') cref = _Object;

    if (!cref.$$is_module && !cref.$$is_class) {
      throw new Opal.TypeError(cref.toString() + " is not a class/module");
    }

    result = const_get_name(cref, name);
    return result != null || skip_missing ? result : const_missing(cref, name);
  };

  // Look for the constant relative to a cref or call `#const_missing` (when the
  // constant is prefixed by `::`).
  Opal.const_get_qualified = function(cref, name, skip_missing) {
    var result, cache, cached, current_version = Opal.const_cache_version;

    if (name == null) {
      // A shortpath for calls like ::String => $$$("String")
      result = const_get_name(_Object, cref);

      if (result != null) return result;
      return Opal.const_get_qualified(_Object, cref, skip_missing);
    }

    if (cref == null) return;

    if (cref === '::') cref = _Object;

    if (!cref.$$is_module && !cref.$$is_class) {
      throw new Opal.TypeError(cref.toString() + " is not a class/module");
    }

    if ((cache = cref.$$const_cache) == null) {
      $prop(cref, '$$const_cache', Object.create(null));
      cache = cref.$$const_cache;
    }
    cached = cache[name];

    if (cached == null || cached[0] !== current_version) {
      ((result = const_get_name(cref, name))              != null) ||
      ((result = const_lookup_ancestors(cref, name))      != null);
      cache[name] = [current_version, result];
    } else {
      result = cached[1];
    }

    return result != null || skip_missing ? result : const_missing(cref, name);
  };

  // Initialize the top level constant cache generation counter
  Opal.const_cache_version = 1;

  // Look for the constant in the open using the current nesting and the nearest
  // cref ancestors or call `#const_missing` (when the constant has no :: prefix).
  Opal.const_get_relative = function(nesting, name, skip_missing) {
    var cref = nesting[0], result, current_version = Opal.const_cache_version, cache, cached;

    if ((cache = nesting.$$const_cache) == null) {
      $prop(nesting, '$$const_cache', Object.create(null));
      cache = nesting.$$const_cache;
    }
    cached = cache[name];

    if (cached == null || cached[0] !== current_version) {
      ((result = const_get_name(cref, name))              != null) ||
      ((result = const_lookup_nesting(nesting, name))     != null) ||
      ((result = const_lookup_ancestors(cref, name))      != null) ||
      ((result = const_lookup_Object(cref, name))         != null);

      cache[name] = [current_version, result];
    } else {
      result = cached[1];
    }

    return result != null || skip_missing ? result : const_missing(cref, name);
  };

  // Register the constant on a cref and opportunistically set the name of
  // unnamed classes/modules.
  function $const_set(cref, name, value) {
    if (cref == null || cref === '::') cref = _Object;

    if (value.$$is_a_module) {
      if (value.$$name == null || value.$$name === nil) value.$$name = name;
      if (value.$$base_module == null) value.$$base_module = cref;
    }

    cref.$$const = (cref.$$const || Object.create(null));
    cref.$$const[name] = value;

    // Add a short helper to navigate constants manually.
    // @example
    //   Opal.$$.Regexp.$$.IGNORECASE
    cref.$$ = cref.$$const;

    Opal.const_cache_version++;

    // Expose top level constants onto the Opal object
    if (cref === _Object) Opal[name] = value;

    // Name new class directly onto current scope (Opal.Foo.Baz = klass)
    $prop(cref, name, value);

    return value;
  };

  Opal.const_set = $const_set;

  // Get all the constants reachable from a given cref, by default will include
  // inherited constants.
  Opal.constants = function(cref, inherit) {
    if (inherit == null) inherit = true;

    var module, modules = [cref], i, ii, constants = {}, constant;

    if (inherit) modules = modules.concat($ancestors(cref));
    if (inherit && cref.$$is_module) modules = modules.concat([Opal.Object]).concat($ancestors(Opal.Object));

    for (i = 0, ii = modules.length; i < ii; i++) {
      module = modules[i];

      // Do not show Objects constants unless we're querying Object itself
      if (cref !== _Object && module == _Object) break;

      for (constant in module.$$const) {
        constants[constant] = true;
      }
      if (module.$$autoload) {
        for (constant in module.$$autoload) {
          constants[constant] = true;
        }
      }
    }

    return Object.keys(constants);
  };

  // Remove a constant from a cref.
  Opal.const_remove = function(cref, name) {
    Opal.const_cache_version++;

    if (cref.$$const[name] != null) {
      var old = cref.$$const[name];
      delete cref.$$const[name];
      return old;
    }

    if (cref.$$autoload && cref.$$autoload[name]) {
      delete cref.$$autoload[name];
      return nil;
    }

    throw Opal.NameError.$new("constant "+cref+"::"+cref.$name()+" not defined");
  };

  // Generates a function that is a curried const_get_relative.
  Opal.const_get_relative_factory = function(nesting) {
    return function(name, skip_missing) {
      return Opal.$$(nesting, name, skip_missing);
    }
  }

  // Setup some shortcuts to reduce compiled size
  Opal.$$ = Opal.const_get_relative;
  Opal.$$$ = Opal.const_get_qualified;
  Opal.$r = Opal.const_get_relative_factory;

  // Modules & Classes
  // -----------------

  // A `class Foo; end` expression in ruby is compiled to call this runtime
  // method which either returns an existing class of the given name, or creates
  // a new class in the given `base` scope.
  //
  // If a constant with the given name exists, then we check to make sure that
  // it is a class and also that the superclasses match. If either of these
  // fail, then we raise a `TypeError`. Note, `superclass` may be null if one
  // was not specified in the ruby code.
  //
  // We pass a constructor to this method of the form `function ClassName() {}`
  // simply so that classes show up with nicely formatted names inside debuggers
  // in the web browser (or node/sprockets).
  //
  // The `scope` is the current `self` value where the class is being created
  // from. We use this to get the scope for where the class should be created.
  // If `scope` is an object (not a class/module), we simple get its class and
  // use that as the scope instead.
  //
  // @param scope        [Object] where the class is being created
  // @param superclass   [Class,null] superclass of the new class (may be null)
  // @param singleton    [Boolean,null] a true value denotes we want to allocate
  //                                    a singleton
  //
  // @return new [Class]  or existing ruby class
  //
  function $allocate_class(name, superclass, singleton) {
    var klass;

    if (superclass != null && superclass.$$bridge) {
      // Inheritance from bridged classes requires
      // calling original JS constructors
      klass = function() {
        var args = $slice.call(arguments),
            self = new ($bind.apply(superclass.$$constructor, [null].concat(args)))();

        // and replacing a __proto__ manually
        $set_proto(self, klass.$$prototype);
        return self;
      }
    } else {
      klass = function(){};
    }

    if (name && name !== nil) {
      $prop(klass, 'displayName', '::'+name);
    }

    $prop(klass, '$$name', name);
    $prop(klass, '$$constructor', klass);
    $prop(klass, '$$prototype', klass.prototype);
    $prop(klass, '$$const', {});
    $prop(klass, '$$is_class', true);
    $prop(klass, '$$is_a_module', true);
    $prop(klass, '$$super', superclass);
    $prop(klass, '$$cvars', {});
    $prop(klass, '$$own_included_modules', []);
    $prop(klass, '$$own_prepended_modules', []);
    $prop(klass, '$$ancestors', []);
    $prop(klass, '$$ancestors_cache_version', null);
    $prop(klass, '$$subclasses', []);

    $prop(klass.$$prototype, '$$class', klass);

    // By default if there are no singleton class methods
    // __proto__ is Class.prototype
    // Later singleton methods generate a singleton_class
    // and inject it into ancestors chain
    if (Opal.Class) {
      $set_proto(klass, Opal.Class.prototype);
    }

    if (superclass != null) {
      $set_proto(klass.$$prototype, superclass.$$prototype);

      if (singleton !== true) {
        // Let's not forbid GC from cleaning up our
        // subclasses.
        if (typeof WeakRef !== 'undefined') {
          // First, let's clean up our array from empty objects.
          var i, subclass, rebuilt_subclasses = [];
          for (i = 0; i < superclass.$$subclasses.length; i++) {
            subclass = superclass.$$subclasses[i];
            if (subclass.deref() !== undefined) {
              rebuilt_subclasses.push(subclass);
            }
          }
          // Now, let's add our class.
          rebuilt_subclasses.push(new WeakRef(klass));
          superclass.$$subclasses = rebuilt_subclasses;
        }
        else {
          superclass.$$subclasses.push(klass);
        }
      }

      if (superclass.$$meta) {
        // If superclass has metaclass then we have explicitely inherit it.
        Opal.build_class_singleton_class(klass);
      }
    }

    return klass;
  };
  Opal.allocate_class = $allocate_class;


  function find_existing_class(scope, name) {
    // Try to find the class in the current scope
    var klass = const_get_name(scope, name);

    // If the class exists in the scope, then we must use that
    if (klass) {
      // Make sure the existing constant is a class, or raise error
      if (!klass.$$is_class) {
        throw Opal.TypeError.$new(name + " is not a class");
      }

      return klass;
    }
  }

  function ensureSuperclassMatch(klass, superclass) {
    if (klass.$$super !== superclass) {
      throw Opal.TypeError.$new("superclass mismatch for class " + klass.$$name);
    }
  }

  Opal.klass = function(scope, superclass, name) {
    var bridged;

    if (scope == null || scope == '::') {
      // Global scope
      scope = _Object;
    } else if (!scope.$$is_class && !scope.$$is_module) {
      // Scope is an object, use its class
      scope = scope.$$class;
    }

    // If the superclass is not an Opal-generated class then we're bridging a native JS class
    if (
      superclass != null && (!superclass.hasOwnProperty || (
        superclass.hasOwnProperty && !superclass.hasOwnProperty('$$is_class')
      ))
    ) {
      if (superclass.constructor && superclass.constructor.name == "Function") {
        bridged = superclass;
        superclass = _Object;
      } else {
        throw Opal.TypeError.$new("superclass must be a Class (" + (
          (superclass.constructor && (superclass.constructor.name || superclass.constructor.$$name)) ||
          typeof(superclass)
        ) + " given)");
      }
    }

    var klass = find_existing_class(scope, name);

    if (klass != null) {
      if (superclass) {
        // Make sure existing class has same superclass
        ensureSuperclassMatch(klass, superclass);
      }
    }
    else {
      // Class doesn't exist, create a new one with given superclass...

      // Not specifying a superclass means we can assume it to be Object
      if (superclass == null) {
        superclass = _Object;
      }

      // Create the class object (instance of Class)
      klass = $allocate_class(name, superclass);
      $const_set(scope, name, klass);

      // Call .inherited() hook with new class on the superclass
      if (superclass.$inherited) {
        superclass.$inherited(klass);
      }

      if (bridged) {
        Opal.bridge(bridged, klass);
      }
    }

    if (Opal.trace_class) { invoke_tracers_for_class(klass); }

    return klass;
  };

  // Define new module (or return existing module). The given `scope` is basically
  // the current `self` value the `module` statement was defined in. If this is
  // a ruby module or class, then it is used, otherwise if the scope is a ruby
  // object then that objects real ruby class is used (e.g. if the scope is the
  // main object, then the top level `Object` class is used as the scope).
  //
  // If a module of the given name is already defined in the scope, then that
  // instance is just returned.
  //
  // If there is a class of the given name in the scope, then an error is
  // generated instead (cannot have a class and module of same name in same scope).
  //
  // Otherwise, a new module is created in the scope with the given name, and that
  // new instance is returned back (to be referenced at runtime).
  //
  // @param  scope [Module, Class] class or module this definition is inside
  // @param  id   [String] the name of the new (or existing) module
  //
  // @return [Module]
  function $allocate_module(name) {
    var constructor = function(){};
    var module = constructor;

    if (name)
      $prop(constructor, 'displayName', name+'.constructor');

    $prop(module, '$$name', name);
    $prop(module, '$$prototype', constructor.prototype);
    $prop(module, '$$const', {});
    $prop(module, '$$is_module', true);
    $prop(module, '$$is_a_module', true);
    $prop(module, '$$cvars', {});
    $prop(module, '$$iclasses', []);
    $prop(module, '$$own_included_modules', []);
    $prop(module, '$$own_prepended_modules', []);
    $prop(module, '$$ancestors', [module]);
    $prop(module, '$$ancestors_cache_version', null);

    $set_proto(module, Opal.Module.prototype);

    return module;
  };
  Opal.allocate_module = $allocate_module;

  function find_existing_module(scope, name) {
    var module = const_get_name(scope, name);
    if (module == null && scope === _Object) module = const_lookup_ancestors(_Object, name);

    if (module) {
      if (!module.$$is_module && module !== _Object) {
        throw Opal.TypeError.$new(name + " is not a module");
      }
    }

    return module;
  }

  Opal.module = function(scope, name) {
    var module;

    if (scope == null || scope == '::') {
      // Global scope
      scope = _Object;
    } else if (!scope.$$is_class && !scope.$$is_module) {
      // Scope is an object, use its class
      scope = scope.$$class;
    }

    module = find_existing_module(scope, name);

    if (module == null) {
      // Module doesnt exist, create a new one...
      module = $allocate_module(name);
      $const_set(scope, name, module);
    }

    if (Opal.trace_class) { invoke_tracers_for_class(module); }

    return module;
  };

  // Return the singleton class for the passed object.
  //
  // If the given object alredy has a singleton class, then it will be stored on
  // the object as the `$$meta` property. If this exists, then it is simply
  // returned back.
  //
  // Otherwise, a new singleton object for the class or object is created, set on
  // the object at `$$meta` for future use, and then returned.
  //
  // @param object [Object] the ruby object
  // @return [Class] the singleton class for object
  Opal.get_singleton_class = function(object) {
    if (object.$$meta) {
      return object.$$meta;
    }

    if (object.hasOwnProperty('$$is_class')) {
      return Opal.build_class_singleton_class(object);
    } else if (object.hasOwnProperty('$$is_module')) {
      return Opal.build_module_singleton_class(object);
    } else {
      return Opal.build_object_singleton_class(object);
    }
  };

  // helper to set $$meta on klass, module or instance
  function set_meta(obj, meta) {
    if (obj.hasOwnProperty('$$meta')) {
      obj.$$meta = meta;
    } else {
      $prop(obj, '$$meta', meta);
    }
    if (obj.$$frozen) {
      // If a object is frozen (sealed), freeze $$meta too.
      // No need to inject $$meta.$$prototype in the prototype chain,
      // as $$meta cannot be modified anyway.
      obj.$$meta.$freeze();
    } else {
      $set_proto(obj, meta.$$prototype);
    }
  };

  // Build the singleton class for an existing class. Class object are built
  // with their singleton class already in the prototype chain and inheriting
  // from their superclass object (up to `Class` itself).
  //
  // NOTE: Actually in MRI a class' singleton class inherits from its
  // superclass' singleton class which in turn inherits from Class.
  //
  // @param klass [Class]
  // @return [Class]
  Opal.build_class_singleton_class = function(klass) {
    if (klass.$$meta) {
      return klass.$$meta;
    }

    // The singleton_class superclass is the singleton_class of its superclass;
    // but BasicObject has no superclass (its `$$super` is null), thus we
    // fallback on `Class`.
    var superclass = klass === BasicObject ? Class : Opal.get_singleton_class(klass.$$super);

    var meta = $allocate_class(null, superclass, true);

    $prop(meta, '$$is_singleton', true);
    $prop(meta, '$$singleton_of', klass);
    set_meta(klass, meta);
    // Restoring ClassName.class
    $prop(klass, '$$class', Opal.Class);

    return meta;
  };

  Opal.build_module_singleton_class = function(mod) {
    if (mod.$$meta) {
      return mod.$$meta;
    }

    var meta = $allocate_class(null, Opal.Module, true);

    $prop(meta, '$$is_singleton', true);
    $prop(meta, '$$singleton_of', mod);
    set_meta(mod, meta);
    // Restoring ModuleName.class
    $prop(mod, '$$class', Opal.Module);

    return meta;
  };

  // Build the singleton class for a Ruby (non class) Object.
  //
  // @param object [Object]
  // @return [Class]
  Opal.build_object_singleton_class = function(object) {
    var superclass = object.$$class,
        klass = $allocate_class(nil, superclass, true);

    $prop(klass, '$$is_singleton', true);
    $prop(klass, '$$singleton_of', object);

    delete klass.$$prototype.$$class;

    set_meta(object, klass);

    return klass;
  };

  Opal.is_method = function(prop) {
    return (prop[0] === '$' && prop[1] !== '$');
  };

  Opal.instance_methods = function(mod) {
    var exclude = [], results = [], ancestors = $ancestors(mod);

    for (var i = 0, l = ancestors.length; i < l; i++) {
      var ancestor = ancestors[i],
          proto = ancestor.$$prototype;

      if (proto.hasOwnProperty('$$dummy')) {
        proto = proto.$$define_methods_on;
      }

      var props = Object.getOwnPropertyNames(proto);

      for (var j = 0, ll = props.length; j < ll; j++) {
        var prop = props[j];

        if (Opal.is_method(prop)) {
          var method_name = prop.slice(1),
              method = proto[prop];

          if (method.$$stub && exclude.indexOf(method_name) === -1) {
            exclude.push(method_name);
          }

          if (!method.$$stub && results.indexOf(method_name) === -1 && exclude.indexOf(method_name) === -1) {
            results.push(method_name);
          }
        }
      }
    }

    return results;
  };

  Opal.own_instance_methods = function(mod) {
    var results = [],
        proto = mod.$$prototype;

    if (proto.hasOwnProperty('$$dummy')) {
      proto = proto.$$define_methods_on;
    }

    var props = Object.getOwnPropertyNames(proto);

    for (var i = 0, length = props.length; i < length; i++) {
      var prop = props[i];

      if (Opal.is_method(prop)) {
        var method = proto[prop];

        if (!method.$$stub) {
          var method_name = prop.slice(1);
          results.push(method_name);
        }
      }
    }

    return results;
  };

  Opal.methods = function(obj) {
    return Opal.instance_methods(obj.$$meta || obj.$$class);
  };

  Opal.own_methods = function(obj) {
    return obj.$$meta ? Opal.own_instance_methods(obj.$$meta) : [];
  };

  Opal.receiver_methods = function(obj) {
    var mod = Opal.get_singleton_class(obj);
    var singleton_methods = Opal.own_instance_methods(mod);
    var instance_methods = Opal.own_instance_methods(mod.$$super);
    return singleton_methods.concat(instance_methods);
  };

  // Returns an object containing all pairs of names/values
  // for all class variables defined in provided +module+
  // and its ancestors.
  //
  // @param module [Module]
  // @return [Object]
  Opal.class_variables = function(module) {
    var ancestors = $ancestors(module),
        i, length = ancestors.length,
        result = {};

    for (i = length - 1; i >= 0; i--) {
      var ancestor = ancestors[i];

      for (var cvar in ancestor.$$cvars) {
        result[cvar] = ancestor.$$cvars[cvar];
      }
    }

    return result;
  };

  // Sets class variable with specified +name+ to +value+
  // in provided +module+
  //
  // @param module [Module]
  // @param name [String]
  // @param value [Object]
  Opal.class_variable_set = function(module, name, value) {
    var ancestors = $ancestors(module),
        i, length = ancestors.length;

    for (i = length - 2; i >= 0; i--) {
      var ancestor = ancestors[i];

      if ($has_own.call(ancestor.$$cvars, name)) {
        ancestor.$$cvars[name] = value;
        return value;
      }
    }

    module.$$cvars[name] = value;

    return value;
  };

  // Gets class variable with specified +name+ from provided +module+
  //
  // @param module [Module]
  // @param name [String]
  Opal.class_variable_get = function(module, name, tolerant) {
    if ($has_own.call(module.$$cvars, name))
      return module.$$cvars[name];

    var ancestors = $ancestors(module),
      i, length = ancestors.length;

    for (i = 0; i < length; i++) {
      var ancestor = ancestors[i];

      if ($has_own.call(ancestor.$$cvars, name)) {
        return ancestor.$$cvars[name];
      }
    }

    if (!tolerant)
      throw Opal.NameError.$new('uninitialized class variable '+name+' in '+module.$name());

    return nil;
  }

  function isRoot(proto) {
    return proto.hasOwnProperty('$$iclass') && proto.hasOwnProperty('$$root');
  }

  function own_included_modules(module) {
    var result = [], mod, proto = Object.getPrototypeOf(module.$$prototype);

    while (proto) {
      if (proto.hasOwnProperty('$$class')) {
        // superclass
        break;
      }
      mod = protoToModule(proto);
      if (mod) {
        result.push(mod);
      }
      proto = Object.getPrototypeOf(proto);
    }

    return result;
  }

  function own_prepended_modules(module) {
    var result = [], mod, proto = Object.getPrototypeOf(module.$$prototype);

    if (module.$$prototype.hasOwnProperty('$$dummy')) {
      while (proto) {
        if (proto === module.$$prototype.$$define_methods_on) {
          break;
        }

        mod = protoToModule(proto);
        if (mod) {
          result.push(mod);
        }

        proto = Object.getPrototypeOf(proto);
      }
    }

    return result;
  }


  // The actual inclusion of a module into a class.
  //
  // ## Class `$$parent` and `iclass`
  //
  // To handle `super` calls, every class has a `$$parent`. This parent is
  // used to resolve the next class for a super call. A normal class would
  // have this point to its superclass. However, if a class includes a module
  // then this would need to take into account the module. The module would
  // also have to then point its `$$parent` to the actual superclass. We
  // cannot modify modules like this, because it might be included in more
  // then one class. To fix this, we actually insert an `iclass` as the class'
  // `$$parent` which can then point to the superclass. The `iclass` acts as
  // a proxy to the actual module, so the `super` chain can then search it for
  // the required method.
  //
  // @param module [Module] the module to include
  // @param includer [Module] the target class to include module into
  // @return [null]
  Opal.append_features = function(module, includer) {
    var module_ancestors = $ancestors(module);
    var iclasses = [];

    if (module_ancestors.indexOf(includer) !== -1) {
      throw Opal.ArgumentError.$new('cyclic include detected');
    }

    for (var i = 0, length = module_ancestors.length; i < length; i++) {
      var ancestor = module_ancestors[i], iclass = create_iclass(ancestor);
      $prop(iclass, '$$included', true);
      iclasses.push(iclass);
    }
    var includer_ancestors = $ancestors(includer),
        chain = chain_iclasses(iclasses),
        start_chain_after,
        end_chain_on;

    if (includer_ancestors.indexOf(module) === -1) {
      // first time include

      // includer -> chain.first -> ...chain... -> chain.last -> includer.parent
      start_chain_after = includer.$$prototype;
      end_chain_on = Object.getPrototypeOf(includer.$$prototype);
    } else {
      // The module has been already included,
      // we don't need to put it into the ancestors chain again,
      // but this module may have new included modules.
      // If it's true we need to copy them.
      //
      // The simplest way is to replace ancestors chain from
      //          parent
      //            |
      //   `module` iclass (has a $$root flag)
      //            |
      //   ...previos chain of module.included_modules ...
      //            |
      //  "next ancestor" (has a $$root flag or is a real class)
      //
      // to
      //          parent
      //            |
      //    `module` iclass (has a $$root flag)
      //            |
      //   ...regenerated chain of module.included_modules
      //            |
      //   "next ancestor" (has a $$root flag or is a real class)
      //
      // because there are no intermediate classes between `parent` and `next ancestor`.
      // It doesn't break any prototypes of other objects as we don't change class references.

      var parent = includer.$$prototype, module_iclass = Object.getPrototypeOf(parent);

      while (module_iclass != null) {
        if (module_iclass.$$module === module && isRoot(module_iclass)) {
          break;
        }

        parent = module_iclass;
        module_iclass = Object.getPrototypeOf(module_iclass);
      }

      if (module_iclass) {
        // module has been directly included
        var next_ancestor = Object.getPrototypeOf(module_iclass);

        // skip non-root iclasses (that were recursively included)
        while (next_ancestor.hasOwnProperty('$$iclass') && !isRoot(next_ancestor)) {
          next_ancestor = Object.getPrototypeOf(next_ancestor);
        }

        start_chain_after = parent;
        end_chain_on = next_ancestor;
      } else {
        // module has not been directly included but was in ancestor chain because it was included by another module
        // include it directly
        start_chain_after = includer.$$prototype;
        end_chain_on = Object.getPrototypeOf(includer.$$prototype);
      }
    }

    $set_proto(start_chain_after, chain.first);
    $set_proto(chain.last, end_chain_on);

    // recalculate own_included_modules cache
    includer.$$own_included_modules = own_included_modules(includer);

    Opal.const_cache_version++;
  };

  Opal.prepend_features = function(module, prepender) {
    // Here we change the ancestors chain from
    //
    //   prepender
    //      |
    //    parent
    //
    // to:
    //
    // dummy(prepender)
    //      |
    //  iclass(module)
    //      |
    // iclass(prepender)
    //      |
    //    parent
    var module_ancestors = $ancestors(module);
    var iclasses = [];

    if (module_ancestors.indexOf(prepender) !== -1) {
      throw Opal.ArgumentError.$new('cyclic prepend detected');
    }

    for (var i = 0, length = module_ancestors.length; i < length; i++) {
      var ancestor = module_ancestors[i], iclass = create_iclass(ancestor);
      $prop(iclass, '$$prepended', true);
      iclasses.push(iclass);
    }

    var chain = chain_iclasses(iclasses),
        dummy_prepender = prepender.$$prototype,
        previous_parent = Object.getPrototypeOf(dummy_prepender),
        prepender_iclass,
        start_chain_after,
        end_chain_on;

    if (dummy_prepender.hasOwnProperty('$$dummy')) {
      // The module already has some prepended modules
      // which means that we don't need to make it "dummy"
      prepender_iclass = dummy_prepender.$$define_methods_on;
    } else {
      // Making the module "dummy"
      prepender_iclass = create_dummy_iclass(prepender);
      flush_methods_in(prepender);
      $prop(dummy_prepender, '$$dummy', true);
      $prop(dummy_prepender, '$$define_methods_on', prepender_iclass);

      // Converting
      //   dummy(prepender) -> previous_parent
      // to
      //   dummy(prepender) -> iclass(prepender) -> previous_parent
      $set_proto(dummy_prepender, prepender_iclass);
      $set_proto(prepender_iclass, previous_parent);
    }

    var prepender_ancestors = $ancestors(prepender);

    if (prepender_ancestors.indexOf(module) === -1) {
      // first time prepend

      start_chain_after = dummy_prepender;

      // next $$root or prepender_iclass or non-$$iclass
      end_chain_on = Object.getPrototypeOf(dummy_prepender);
      while (end_chain_on != null) {
        if (
          end_chain_on.hasOwnProperty('$$root') ||
          end_chain_on === prepender_iclass ||
          !end_chain_on.hasOwnProperty('$$iclass')
        ) {
          break;
        }

        end_chain_on = Object.getPrototypeOf(end_chain_on);
      }
    } else {
      throw Opal.RuntimeError.$new("Prepending a module multiple times is not supported");
    }

    $set_proto(start_chain_after, chain.first);
    $set_proto(chain.last, end_chain_on);

    // recalculate own_prepended_modules cache
    prepender.$$own_prepended_modules = own_prepended_modules(prepender);

    Opal.const_cache_version++;
  };

  function flush_methods_in(module) {
    var proto = module.$$prototype,
        props = Object.getOwnPropertyNames(proto);

    for (var i = 0; i < props.length; i++) {
      var prop = props[i];
      if (Opal.is_method(prop)) {
        delete proto[prop];
      }
    }
  }

  function create_iclass(module) {
    var iclass = create_dummy_iclass(module);

    if (module.$$is_module) {
      module.$$iclasses.push(iclass);
    }

    return iclass;
  }

  // Dummy iclass doesn't receive updates when the module gets a new method.
  function create_dummy_iclass(module) {
    var iclass = {},
        proto = module.$$prototype;

    if (proto.hasOwnProperty('$$dummy')) {
      proto = proto.$$define_methods_on;
    }

    var props = Object.getOwnPropertyNames(proto),
        length = props.length, i;

    for (i = 0; i < length; i++) {
      var prop = props[i];
      $prop(iclass, prop, proto[prop]);
    }

    $prop(iclass, '$$iclass', true);
    $prop(iclass, '$$module', module);

    return iclass;
  }

  function chain_iclasses(iclasses) {
    var length = iclasses.length, first = iclasses[0];

    $prop(first, '$$root', true);

    if (length === 1) {
      return { first: first, last: first };
    }

    var previous = first;

    for (var i = 1; i < length; i++) {
      var current = iclasses[i];
      $set_proto(previous, current);
      previous = current;
    }


    return { first: iclasses[0], last: iclasses[length - 1] };
  }

  // For performance, some core Ruby classes are toll-free bridged to their
  // native JavaScript counterparts (e.g. a Ruby Array is a JavaScript Array).
  //
  // This method is used to setup a native constructor (e.g. Array), to have
  // its prototype act like a normal Ruby class. Firstly, a new Ruby class is
  // created using the native constructor so that its prototype is set as the
  // target for the new class. Note: all bridged classes are set to inherit
  // from Object.
  //
  // Example:
  //
  //    Opal.bridge(self, Function);
  //
  // @param klass       [Class] the Ruby class to bridge
  // @param constructor [JS.Function] native JavaScript constructor to use
  // @return [Class] returns the passed Ruby class
  //
  Opal.bridge = function(native_klass, klass) {
    if (native_klass.hasOwnProperty('$$bridge')) {
      throw Opal.ArgumentError.$new("already bridged");
    }

    // constructor is a JS function with a prototype chain like:
    // - constructor
    //   - super
    //
    // What we need to do is to inject our class (with its prototype chain)
    // between constructor and super. For example, after injecting ::Object
    // into JS String we get:
    //
    // - constructor (window.String)
    //   - Opal.Object
    //     - Opal.Kernel
    //       - Opal.BasicObject
    //         - super (window.Object)
    //           - null
    //
    $prop(native_klass, '$$bridge', klass);
    $set_proto(native_klass.prototype, (klass.$$super || Opal.Object).$$prototype);
    $prop(klass, '$$prototype', native_klass.prototype);

    $prop(klass.$$prototype, '$$class', klass);
    $prop(klass, '$$constructor', native_klass);
    $prop(klass, '$$bridge', true);
  };

  function protoToModule(proto) {
    if (proto.hasOwnProperty('$$dummy')) {
      return;
    } else if (proto.hasOwnProperty('$$iclass')) {
      return proto.$$module;
    } else if (proto.hasOwnProperty('$$class')) {
      return proto.$$class;
    }
  }

  function own_ancestors(module) {
    return module.$$own_prepended_modules.concat([module]).concat(module.$$own_included_modules);
  }

  // The Array of ancestors for a given module/class
  function $ancestors(module) {
    if (!module) { return []; }

    if (module.$$ancestors_cache_version === Opal.const_cache_version) {
      return module.$$ancestors;
    }

    var result = [], i, mods, length;

    for (i = 0, mods = own_ancestors(module), length = mods.length; i < length; i++) {
      result.push(mods[i]);
    }

    if (module.$$super) {
      for (i = 0, mods = $ancestors(module.$$super), length = mods.length; i < length; i++) {
        result.push(mods[i]);
      }
    }

    module.$$ancestors_cache_version = Opal.const_cache_version;
    module.$$ancestors = result;

    return result;
  };
  Opal.ancestors = $ancestors;

  Opal.included_modules = function(module) {
    var result = [], mod = null, proto = Object.getPrototypeOf(module.$$prototype);

    for (; proto && Object.getPrototypeOf(proto); proto = Object.getPrototypeOf(proto)) {
      mod = protoToModule(proto);
      if (mod && mod.$$is_module && proto.$$iclass && proto.$$included) {
        result.push(mod);
      }
    }

    return result;
  };


  // Method Missing
  // --------------

  // Methods stubs are used to facilitate method_missing in opal. A stub is a
  // placeholder function which just calls `method_missing` on the receiver.
  // If no method with the given name is actually defined on an object, then it
  // is obvious to say that the stub will be called instead, and then in turn
  // method_missing will be called.
  //
  // When a file in ruby gets compiled to javascript, it includes a call to
  // this function which adds stubs for every method name in the compiled file.
  // It should then be safe to assume that method_missing will work for any
  // method call detected.
  //
  // Method stubs are added to the BasicObject prototype, which every other
  // ruby object inherits, so all objects should handle method missing. A stub
  // is only added if the given property name (method name) is not already
  // defined.
  //
  // Note: all ruby methods have a `$` prefix in javascript, so all stubs will
  // have this prefix as well (to make this method more performant).
  //
  //    Opal.add_stubs("foo,bar,baz=");
  //
  // All stub functions will have a private `$$stub` property set to true so
  // that other internal methods can detect if a method is just a stub or not.
  // `Kernel#respond_to?` uses this property to detect a methods presence.
  //
  // @param stubs [Array] an array of method stubs to add
  // @return [undefined]
  Opal.add_stubs = function(stubs) {
    var proto = Opal.BasicObject.$$prototype;
    var stub, existing_method;
    stubs = stubs.split(',');

    for (var i = 0, length = stubs.length; i < length; i++) {
      stub = '$'+stubs[i], existing_method = proto[stub];

      if (existing_method == null || existing_method.$$stub) {
        Opal.add_stub_for(proto, stub);
      }
    }
  };

  // Add a method_missing stub function to the given prototype for the
  // given name.
  //
  // @param prototype [Prototype] the target prototype
  // @param stub [String] stub name to add (e.g. "$foo")
  // @return [undefined]
  Opal.add_stub_for = function(prototype, stub) {
    // Opal.stub_for(stub) is the method_missing_stub
    $prop(prototype, stub, Opal.stub_for(stub));
  };

  // Generate the method_missing stub for a given method name.
  //
  // @param method_name [String] The js-name of the method to stub (e.g. "$foo")
  // @return [undefined]
  Opal.stub_for = function(method_name) {

    function method_missing_stub() {
      // Copy any given block onto the method_missing dispatcher
      this.$method_missing.$$p = method_missing_stub.$$p;

      // Set block property to null ready for the next call (stop false-positives)
      method_missing_stub.$$p = null;

      // call method missing with correct args (remove '$' prefix on method name)
      var args_ary = new Array(arguments.length);
      for(var i = 0, l = args_ary.length; i < l; i++) { args_ary[i] = arguments[i]; }

      return this.$method_missing.apply(this, [method_name.slice(1)].concat(args_ary));
    }

    method_missing_stub.$$stub = true;

    return method_missing_stub;
  };


  // Methods
  // -------

  // Arity count error dispatcher for methods
  //
  // @param actual [Fixnum] number of arguments given to method
  // @param expected [Fixnum] expected number of arguments
  // @param object [Object] owner of the method +meth+
  // @param meth [String] method name that got wrong number of arguments
  // @raise [ArgumentError]
  Opal.ac = function(actual, expected, object, meth) {
    var inspect = '';
    if (object.$$is_a_module) {
      inspect += object.$$name + '.';
    }
    else {
      inspect += object.$$class.$$name + '#';
    }
    inspect += meth;

    throw Opal.ArgumentError.$new('[' + inspect + '] wrong number of arguments (given ' + actual + ', expected ' + expected + ')');
  };

  // Arity count error dispatcher for blocks
  //
  // @param actual [Fixnum] number of arguments given to block
  // @param expected [Fixnum] expected number of arguments
  // @param context [Object] context of the block definition
  // @raise [ArgumentError]
  Opal.block_ac = function(actual, expected, context) {
    var inspect = "`block in " + context + "'";

    throw Opal.ArgumentError.$new(inspect + ': wrong number of arguments (given ' + actual + ', expected ' + expected + ')');
  };

  function get_ancestors(obj) {
    if (obj.hasOwnProperty('$$meta') && obj.$$meta !== null) {
      return $ancestors(obj.$$meta);
    } else {
      return $ancestors(obj.$$class);
    }
  };

  // Super dispatcher
  Opal.find_super = function(obj, mid, current_func, defcheck, allow_stubs) {
    var jsid = '$' + mid, ancestors, super_method;

    ancestors = get_ancestors(obj);

    var current_index = ancestors.indexOf(current_func.$$owner);

    for (var i = current_index + 1; i < ancestors.length; i++) {
      var ancestor = ancestors[i],
          proto = ancestor.$$prototype;

      if (proto.hasOwnProperty('$$dummy')) {
        proto = proto.$$define_methods_on;
      }

      if (proto.hasOwnProperty(jsid)) {
        super_method = proto[jsid];
        break;
      }
    }

    if (!defcheck && super_method && super_method.$$stub && obj.$method_missing.$$pristine) {
      // method_missing hasn't been explicitly defined
      throw Opal.NoMethodError.$new('super: no superclass method `'+mid+"' for "+obj, mid);
    }

    return (super_method.$$stub && !allow_stubs) ? null : super_method;
  };

  // Iter dispatcher for super in a block
  Opal.find_block_super = function(obj, jsid, current_func, defcheck, implicit) {
    var call_jsid = jsid;

    if (!current_func) {
      throw Opal.RuntimeError.$new("super called outside of method");
    }

    if (implicit && current_func.$$define_meth) {
      throw Opal.RuntimeError.$new(
        "implicit argument passing of super from method defined by define_method() is not supported. " +
        "Specify all arguments explicitly"
      );
    }

    if (current_func.$$def) {
      call_jsid = current_func.$$jsid;
    }

    return Opal.find_super(obj, call_jsid, current_func, defcheck);
  };

  // @deprecated
  Opal.find_super_dispatcher = Opal.find_super;

  // @deprecated
  Opal.find_iter_super_dispatcher = Opal.find_block_super;

  // handles yield calls for 1 yielded arg
  Opal.yield1 = function(block, arg) {
    if (typeof(block) !== "function") {
      throw Opal.LocalJumpError.$new("no block given");
    }

    var has_mlhs = block.$$has_top_level_mlhs_arg,
        has_trailing_comma = block.$$has_trailing_comma_in_args;

    if (block.length > 1 || ((has_mlhs || has_trailing_comma) && block.length === 1)) {
      arg = Opal.to_ary(arg);
    }

    if ((block.length > 1 || (has_trailing_comma && block.length === 1)) && arg.$$is_array) {
      return block.apply(null, arg);
    }
    else {
      return block(arg);
    }
  };

  // handles yield for > 1 yielded arg
  Opal.yieldX = function(block, args) {
    if (typeof(block) !== "function") {
      throw Opal.LocalJumpError.$new("no block given");
    }

    if (block.length > 1 && args.length === 1) {
      if (args[0].$$is_array) {
        return block.apply(null, args[0]);
      }
    }

    if (!args.$$is_array) {
      var args_ary = new Array(args.length);
      for(var i = 0, l = args_ary.length; i < l; i++) { args_ary[i] = args[i]; }

      return block.apply(null, args_ary);
    }

    return block.apply(null, args);
  };

  // Finds the corresponding exception match in candidates.  Each candidate can
  // be a value, or an array of values.  Returns null if not found.
  Opal.rescue = function(exception, candidates) {
    for (var i = 0; i < candidates.length; i++) {
      var candidate = candidates[i];

      if (candidate.$$is_array) {
        var result = Opal.rescue(exception, candidate);

        if (result) {
          return result;
        }
      }
      else if (candidate === Opal.JS.Error || candidate['$==='](exception)) {
        return candidate;
      }
    }

    return null;
  };

  Opal.is_a = function(object, klass) {
    if (klass != null && object.$$meta === klass || object.$$class === klass) {
      return true;
    }

    if (object.$$is_number && klass.$$is_number_class) {
      return (klass.$$is_integer_class) ? (object % 1) === 0 : true;
    }

    var ancestors = $ancestors(object.$$is_class ? Opal.get_singleton_class(object) : (object.$$meta || object.$$class));

    return ancestors.indexOf(klass) !== -1;
  };

  // Helpers for extracting kwsplats
  // Used for: { **h }
  Opal.to_hash = function(value) {
    if (value.$$is_hash) {
      return value;
    }
    else if (value['$respond_to?']('to_hash', true)) {
      var hash = value.$to_hash();
      if (hash.$$is_hash) {
        return hash;
      }
      else {
        throw Opal.TypeError.$new("Can't convert " + value.$$class +
          " to Hash (" + value.$$class + "#to_hash gives " + hash.$$class + ")");
      }
    }
    else {
      throw Opal.TypeError.$new("no implicit conversion of " + value.$$class + " into Hash");
    }
  };

  // Helpers for implementing multiple assignment
  // Our code for extracting the values and assigning them only works if the
  // return value is a JS array.
  // So if we get an Array subclass, extract the wrapped JS array from it

  // Used for: a, b = something (no splat)
  Opal.to_ary = function(value) {
    if (value.$$is_array) {
      return value;
    }
    else if (value['$respond_to?']('to_ary', true)) {
      var ary = value.$to_ary();
      if (ary === nil) {
        return [value];
      }
      else if (ary.$$is_array) {
        return ary;
      }
      else {
        throw Opal.TypeError.$new("Can't convert " + value.$$class +
          " to Array (" + value.$$class + "#to_ary gives " + ary.$$class + ")");
      }
    }
    else {
      return [value];
    }
  };

  // Used for: a, b = *something (with splat)
  Opal.to_a = function(value) {
    if (value.$$is_array) {
      // A splatted array must be copied
      return value.slice();
    }
    else if (value['$respond_to?']('to_a', true)) {
      var ary = value.$to_a();
      if (ary === nil) {
        return [value];
      }
      else if (ary.$$is_array) {
        return ary;
      }
      else {
        throw Opal.TypeError.$new("Can't convert " + value.$$class +
          " to Array (" + value.$$class + "#to_a gives " + ary.$$class + ")");
      }
    }
    else {
      return [value];
    }
  };

  // Used for extracting keyword arguments from arguments passed to
  // JS function. If provided +arguments+ list doesn't have a Hash
  // as a last item, returns a blank Hash.
  //
  // @param parameters [Array]
  // @return [Hash]
  //
  Opal.extract_kwargs = function(parameters) {
    var kwargs = parameters[parameters.length - 1];
    if (kwargs != null && Opal.respond_to(kwargs, '$to_hash', true)) {
      $splice.call(parameters, parameters.length - 1);
      return kwargs;
    }
  };

  // Used to get a list of rest keyword arguments. Method takes the given
  // keyword args, i.e. the hash literal passed to the method containing all
  // keyword arguemnts passed to method, as well as the used args which are
  // the names of required and optional arguments defined. This method then
  // just returns all key/value pairs which have not been used, in a new
  // hash literal.
  //
  // @param given_args [Hash] all kwargs given to method
  // @param used_args [Object<String: true>] all keys used as named kwargs
  // @return [Hash]
  //
  Opal.kwrestargs = function(given_args, used_args) {
    var keys      = [],
        map       = {},
        key           ,
        given_map = given_args.$$smap;

    for (key in given_map) {
      if (!used_args[key]) {
        keys.push(key);
        map[key] = given_map[key];
      }
    }

    return Opal.hash2(keys, map);
  };

  function apply_blockopts(block, blockopts) {
    if (typeof(blockopts) === 'number') {
      block.$$arity = blockopts;
    }
    else if (typeof(blockopts) === 'object') {
      Object.assign(block, blockopts);
    }
  }

  // Calls passed method on a ruby object with arguments and block:
  //
  // Can take a method or a method name.
  //
  // 1. When method name gets passed it invokes it by its name
  //    and calls 'method_missing' when object doesn't have this method.
  //    Used internally by Opal to invoke method that takes a block or a splat.
  // 2. When method (i.e. method body) gets passed, it doesn't trigger 'method_missing'
  //    because it doesn't know the name of the actual method.
  //    Used internally by Opal to invoke 'super'.
  //
  // @example
  //   var my_array = [1, 2, 3, 4]
  //   Opal.send(my_array, 'length')                    # => 4
  //   Opal.send(my_array, my_array.$length)            # => 4
  //
  //   Opal.send(my_array, 'reverse!')                  # => [4, 3, 2, 1]
  //   Opal.send(my_array, my_array['$reverse!']')      # => [4, 3, 2, 1]
  //
  // @param recv [Object] ruby object
  // @param method [Function, String] method body or name of the method
  // @param args [Array] arguments that will be passed to the method call
  // @param block [Function] ruby block
  // @param blockopts [Object, Number] optional properties to set on the block
  // @return [Object] returning value of the method call
  Opal.send = function(recv, method, args, block, blockopts) {
    var body;

    if (typeof(method) === 'function') {
      body = method;
      method = null;
    } else if (typeof(method) === 'string') {
      body = recv['$'+method];
    } else {
      throw Opal.NameError.$new("Passed method should be a string or a function");
    }

    return Opal.send2(recv, body, method, args, block, blockopts);
  };

  Opal.send2 = function(recv, body, method, args, block, blockopts) {
    if (body == null && method != null && recv.$method_missing) {
      body = recv.$method_missing;
      args = [method].concat(args);
    }

    apply_blockopts(block, blockopts);

    if (typeof block === 'function') body.$$p = block;
    return body.apply(recv, args);
  };

  Opal.refined_send = function(refinement_groups, recv, method, args, block, blockopts) {
    var i, j, k, ancestors, ancestor, refinements, refinement, refine_modules, refine_module, body;

    ancestors = get_ancestors(recv);

    // For all ancestors that there are, starting from the closest to the furthest...
    for (i = 0; i < ancestors.length; i++) {
      ancestor = Opal.id(ancestors[i]);

      // For all refinement groups there are, starting from the closest scope to the furthest...
      for (j = 0; j < refinement_groups.length; j++) {
        refinements = refinement_groups[j];

        // For all refinements there are, starting from the last `using` call to the furthest...
        for (k = refinements.length - 1; k >= 0; k--) {
          refinement = refinements[k];
          if (typeof refinement.$$refine_modules === 'undefined') continue;

          // A single module being given as an argument of the `using` call contains multiple
          // refinement modules
          refine_modules = refinement.$$refine_modules;

          // Does this module refine a given call for a given ancestor module?
          if (typeof refine_modules[ancestor] === 'undefined') continue;
          refine_module = refine_modules[ancestor];

          // Does this module define a method we want to call?
          if (typeof refine_module.$$prototype['$'+method] !== 'undefined') {
            body = refine_module.$$prototype['$'+method];
            return Opal.send2(recv, body, method, args, block, blockopts);
          }
        }
      }
    }

    return Opal.send(recv, method, args, block, blockopts);
  };

  Opal.lambda = function(block, blockopts) {
    block.$$is_lambda = true;

    apply_blockopts(block, blockopts);

    return block;
  };

  // Used to define methods on an object. This is a helper method, used by the
  // compiled source to define methods on special case objects when the compiler
  // can not determine the destination object, or the object is a Module
  // instance. This can get called by `Module#define_method` as well.
  //
  // ## Modules
  //
  // Any method defined on a module will come through this runtime helper.
  // The method is added to the module body, and the owner of the method is
  // set to be the module itself. This is used later when choosing which
  // method should show on a class if more than 1 included modules define
  // the same method. Finally, if the module is in `module_function` mode,
  // then the method is also defined onto the module itself.
  //
  // ## Classes
  //
  // This helper will only be called for classes when a method is being
  // defined indirectly; either through `Module#define_method`, or by a
  // literal `def` method inside an `instance_eval` or `class_eval` body. In
  // either case, the method is simply added to the class' prototype. A special
  // exception exists for `BasicObject` and `Object`. These two classes are
  // special because they are used in toll-free bridged classes. In each of
  // these two cases, extra work is required to define the methods on toll-free
  // bridged class' prototypes as well.
  //
  // ## Objects
  //
  // If a simple ruby object is the object, then the method is simply just
  // defined on the object as a singleton method. This would be the case when
  // a method is defined inside an `instance_eval` block.
  //
  // @param obj  [Object, Class] the actual obj to define method for
  // @param jsid [String] the JavaScript friendly method name (e.g. '$foo')
  // @param body [JS.Function] the literal JavaScript function used as method
  // @param blockopts [Object, Number] optional properties to set on the body
  // @return [null]
  //
  Opal.def = function(obj, jsid, body, blockopts) {
    apply_blockopts(body, blockopts);

    // Special case for a method definition in the
    // top-level namespace
    if (obj === Opal.top) {
      return Opal.defn(Opal.Object, jsid, body);
    }
    // if instance_eval is invoked on a module/class, it sets inst_eval_mod
    else if (!obj.$$eval && obj.$$is_a_module) {
      return Opal.defn(obj, jsid, body);
    }
    else {
      return Opal.defs(obj, jsid, body);
    }
  };

  // Define method on a module or class (see Opal.def).
  Opal.defn = function(module, jsid, body) {
    $deny_frozen_access(module);

    body.displayName = jsid;
    body.$$owner = module;

    var name = jsid.substr(1);

    var proto = module.$$prototype;
    if (proto.hasOwnProperty('$$dummy')) {
      proto = proto.$$define_methods_on;
    }
    $prop(proto, jsid, body);

    if (module.$$is_module) {
      if (module.$$module_function) {
        Opal.defs(module, jsid, body)
      }

      for (var i = 0, iclasses = module.$$iclasses, length = iclasses.length; i < length; i++) {
        var iclass = iclasses[i];
        $prop(iclass, jsid, body);
      }
    }

    var singleton_of = module.$$singleton_of;
    if (module.$method_added && !module.$method_added.$$stub && !singleton_of) {
      module.$method_added(name);
    }
    else if (singleton_of && singleton_of.$singleton_method_added && !singleton_of.$singleton_method_added.$$stub) {
      singleton_of.$singleton_method_added(name);
    }

    return name;
  };

  // Define a singleton method on the given object (see Opal.def).
  Opal.defs = function(obj, jsid, body, blockopts) {
    apply_blockopts(body, blockopts);

    if (obj.$$is_string || obj.$$is_number) {
      throw Opal.TypeError.$new("can't define singleton");
    }
    return Opal.defn(Opal.get_singleton_class(obj), jsid, body);
  };

  // Called from #remove_method.
  Opal.rdef = function(obj, jsid) {
    if (!$has_own.call(obj.$$prototype, jsid)) {
      throw Opal.NameError.$new("method '" + jsid.substr(1) + "' not defined in " + obj.$name());
    }

    delete obj.$$prototype[jsid];

    if (obj.$$is_singleton) {
      if (obj.$$prototype.$singleton_method_removed && !obj.$$prototype.$singleton_method_removed.$$stub) {
        obj.$$prototype.$singleton_method_removed(jsid.substr(1));
      }
    }
    else {
      if (obj.$method_removed && !obj.$method_removed.$$stub) {
        obj.$method_removed(jsid.substr(1));
      }
    }
  };

  // Called from #undef_method.
  Opal.udef = function(obj, jsid) {
    if (!obj.$$prototype[jsid] || obj.$$prototype[jsid].$$stub) {
      throw Opal.NameError.$new("method '" + jsid.substr(1) + "' not defined in " + obj.$name());
    }

    Opal.add_stub_for(obj.$$prototype, jsid);

    if (obj.$$is_singleton) {
      if (obj.$$prototype.$singleton_method_undefined && !obj.$$prototype.$singleton_method_undefined.$$stub) {
        obj.$$prototype.$singleton_method_undefined(jsid.substr(1));
      }
    }
    else {
      if (obj.$method_undefined && !obj.$method_undefined.$$stub) {
        obj.$method_undefined(jsid.substr(1));
      }
    }
  };

  function is_method_body(body) {
    return (typeof(body) === "function" && !body.$$stub);
  }

  Opal.alias = function(obj, name, old) {
    var id     = '$' + name,
        old_id = '$' + old,
        body,
        alias;

    // Aliasing on main means aliasing on Object...
    if (typeof obj.$$prototype === 'undefined') {
      obj = Opal.Object;
    }

    body = obj.$$prototype['$' + old];

    // When running inside #instance_eval the alias refers to class methods.
    if (obj.$$eval) {
      return Opal.alias(Opal.get_singleton_class(obj), name, old);
    }

    if (!is_method_body(body)) {
      var ancestor = obj.$$super;

      while (typeof(body) !== "function" && ancestor) {
        body     = ancestor[old_id];
        ancestor = ancestor.$$super;
      }

      if (!is_method_body(body) && obj.$$is_module) {
        // try to look into Object
        body = Opal.Object.$$prototype[old_id]
      }

      if (!is_method_body(body)) {
        throw Opal.NameError.$new("undefined method `" + old + "' for class `" + obj.$name() + "'")
      }
    }

    // If the body is itself an alias use the original body
    // to keep the max depth at 1.
    if (body.$$alias_of) body = body.$$alias_of;

    // We need a wrapper because otherwise properties
    // would be overwritten on the original body.
    alias = function() {
      var block = alias.$$p, args, i, ii;

      args = new Array(arguments.length);
      for(i = 0, ii = arguments.length; i < ii; i++) {
        args[i] = arguments[i];
      }

      alias.$$p = null;

      return Opal.send(this, body, args, block);
    };

    // Assign the 'length' value with defineProperty because
    // in strict mode the property is not writable.
    // It doesn't work in older browsers (like Chrome 38), where
    // an exception is thrown breaking Opal altogether.
    try {
      Object.defineProperty(alias, 'length', { value: body.length });
    } catch (e) {}

    // Try to make the browser pick the right name
    alias.displayName       = name;

    alias.$$arity           = body.$$arity;
    alias.$$parameters      = body.$$parameters;
    alias.$$source_location = body.$$source_location;
    alias.$$alias_of        = body;
    alias.$$alias_name      = name;

    Opal.defn(obj, id, alias);

    return obj;
  };

  Opal.alias_gvar = function(new_name, old_name) {
    Object.defineProperty($gvars, new_name, {
      configurable: true,
      enumerable: true,
      get: function() {
        return $gvars[old_name];
      },
      set: function(new_value) {
        $gvars[old_name] = new_value;
      }
    });
    return nil;
  }

  Opal.alias_native = function(obj, name, native_name) {
    var id   = '$' + name,
        body = obj.$$prototype[native_name];

    if (typeof(body) !== "function" || body.$$stub) {
      throw Opal.NameError.$new("undefined native method `" + native_name + "' for class `" + obj.$name() + "'")
    }

    Opal.defn(obj, id, body);

    return obj;
  };


  // Hashes
  // ------

  Opal.hash_init = function(hash) {
    hash.$$smap = Object.create(null);
    hash.$$map  = Object.create(null);
    hash.$$keys = [];
  };

  Opal.hash_clone = function(from_hash, to_hash) {
    to_hash.$$none = from_hash.$$none;
    to_hash.$$proc = from_hash.$$proc;

    for (var i = 0, keys = from_hash.$$keys, smap = from_hash.$$smap, len = keys.length, key, value; i < len; i++) {
      key = keys[i];

      if (key.$$is_string) {
        value = smap[key];
      } else {
        value = key.value;
        key = key.key;
      }

      Opal.hash_put(to_hash, key, value);
    }
  };

  Opal.hash_put = function(hash, key, value) {
    if (key.$$is_string) {
      if (!$has_own.call(hash.$$smap, key)) {
        hash.$$keys.push(key);
      }
      hash.$$smap[key] = value;
      return;
    }

    var key_hash, bucket, last_bucket;
    key_hash = hash.$$by_identity ? Opal.id(key) : key.$hash();

    if (!$has_own.call(hash.$$map, key_hash)) {
      bucket = {key: key, key_hash: key_hash, value: value};
      hash.$$keys.push(bucket);
      hash.$$map[key_hash] = bucket;
      return;
    }

    bucket = hash.$$map[key_hash];

    while (bucket) {
      if (key === bucket.key || key['$eql?'](bucket.key)) {
        last_bucket = undefined;
        bucket.value = value;
        break;
      }
      last_bucket = bucket;
      bucket = bucket.next;
    }

    if (last_bucket) {
      bucket = {key: key, key_hash: key_hash, value: value};
      hash.$$keys.push(bucket);
      last_bucket.next = bucket;
    }
  };

  Opal.hash_get = function(hash, key) {
    if (key.$$is_string) {
      if ($has_own.call(hash.$$smap, key)) {
        return hash.$$smap[key];
      }
      return;
    }

    var key_hash, bucket;
    key_hash = hash.$$by_identity ? Opal.id(key) : key.$hash();

    if ($has_own.call(hash.$$map, key_hash)) {
      bucket = hash.$$map[key_hash];

      while (bucket) {
        if (key === bucket.key || key['$eql?'](bucket.key)) {
          return bucket.value;
        }
        bucket = bucket.next;
      }
    }
  };

  Opal.hash_delete = function(hash, key) {
    var i, keys = hash.$$keys, length = keys.length, value, key_tmp;

    if (key.$$is_string) {
      if (typeof key !== "string") key = key.valueOf();

      if (!$has_own.call(hash.$$smap, key)) {
        return;
      }

      for (i = 0; i < length; i++) {
        key_tmp = keys[i];

        if (key_tmp.$$is_string && typeof key_tmp !== "string") {
          key_tmp = key_tmp.valueOf();
        }

        if (key_tmp === key) {
          keys.splice(i, 1);
          break;
        }
      }

      value = hash.$$smap[key];
      delete hash.$$smap[key];
      return value;
    }

    var key_hash = key.$hash();

    if (!$has_own.call(hash.$$map, key_hash)) {
      return;
    }

    var bucket = hash.$$map[key_hash], last_bucket;

    while (bucket) {
      if (key === bucket.key || key['$eql?'](bucket.key)) {
        value = bucket.value;

        for (i = 0; i < length; i++) {
          if (keys[i] === bucket) {
            keys.splice(i, 1);
            break;
          }
        }

        if (last_bucket && bucket.next) {
          last_bucket.next = bucket.next;
        }
        else if (last_bucket) {
          delete last_bucket.next;
        }
        else if (bucket.next) {
          hash.$$map[key_hash] = bucket.next;
        }
        else {
          delete hash.$$map[key_hash];
        }

        return value;
      }
      last_bucket = bucket;
      bucket = bucket.next;
    }
  };

  Opal.hash_rehash = function(hash) {
    for (var i = 0, length = hash.$$keys.length, key_hash, bucket, last_bucket; i < length; i++) {

      if (hash.$$keys[i].$$is_string) {
        continue;
      }

      key_hash = hash.$$keys[i].key.$hash();

      if (key_hash === hash.$$keys[i].key_hash) {
        continue;
      }

      bucket = hash.$$map[hash.$$keys[i].key_hash];
      last_bucket = undefined;

      while (bucket) {
        if (bucket === hash.$$keys[i]) {
          if (last_bucket && bucket.next) {
            last_bucket.next = bucket.next;
          }
          else if (last_bucket) {
            delete last_bucket.next;
          }
          else if (bucket.next) {
            hash.$$map[hash.$$keys[i].key_hash] = bucket.next;
          }
          else {
            delete hash.$$map[hash.$$keys[i].key_hash];
          }
          break;
        }
        last_bucket = bucket;
        bucket = bucket.next;
      }

      hash.$$keys[i].key_hash = key_hash;

      if (!$has_own.call(hash.$$map, key_hash)) {
        hash.$$map[key_hash] = hash.$$keys[i];
        continue;
      }

      bucket = hash.$$map[key_hash];
      last_bucket = undefined;

      while (bucket) {
        if (bucket === hash.$$keys[i]) {
          last_bucket = undefined;
          break;
        }
        last_bucket = bucket;
        bucket = bucket.next;
      }

      if (last_bucket) {
        last_bucket.next = hash.$$keys[i];
      }
    }
  };

  Opal.hash = function() {
    var arguments_length = arguments.length, args, hash, i, length, key, value;

    if (arguments_length === 1 && arguments[0].$$is_hash) {
      return arguments[0];
    }

    hash = new Opal.Hash();
    Opal.hash_init(hash);

    if (arguments_length === 1) {
      args = arguments[0];

      if (arguments[0].$$is_array) {
        length = args.length;

        for (i = 0; i < length; i++) {
          if (args[i].length !== 2) {
            throw Opal.ArgumentError.$new("value not of length 2: " + args[i].$inspect());
          }

          key = args[i][0];
          value = args[i][1];

          Opal.hash_put(hash, key, value);
        }

        return hash;
      }
      else {
        args = arguments[0];
        for (key in args) {
          if ($has_own.call(args, key)) {
            value = args[key];

            Opal.hash_put(hash, key, value);
          }
        }

        return hash;
      }
    }

    if (arguments_length % 2 !== 0) {
      throw Opal.ArgumentError.$new("odd number of arguments for Hash");
    }

    for (i = 0; i < arguments_length; i += 2) {
      key = arguments[i];
      value = arguments[i + 1];

      Opal.hash_put(hash, key, value);
    }

    return hash;
  };

  // A faster Hash creator for hashes that just use symbols and
  // strings as keys. The map and keys array can be constructed at
  // compile time, so they are just added here by the constructor
  // function.
  //
  Opal.hash2 = function(keys, smap) {
    var hash = new Opal.Hash();

    hash.$$smap = smap;
    hash.$$map  = Object.create(null);
    hash.$$keys = keys;

    return hash;
  };

  // Create a new range instance with first and last values, and whether the
  // range excludes the last value.
  //
  Opal.range = function(first, last, exc) {
    var range         = new Opal.Range();
        range.begin   = first;
        range.end     = last;
        range.excl    = exc;

    return range;
  };

  var reserved_ivar_names = [
    // properties
    "constructor", "displayName", "__count__", "__noSuchMethod__",
    "__parent__", "__proto__",
    // methods
    "hasOwnProperty", "valueOf"
  ];

  // Get the ivar name for a given name.
  // Mostly adds a trailing $ to reserved names.
  //
  Opal.ivar = function(name) {
    if (reserved_ivar_names.indexOf(name) !== -1) {
      name += "$";
    }

    return name;
  };

  // Support for #freeze
  // -------------------

  // helper that can be used from methods
  function $deny_frozen_access(obj) {
    if (obj.$$frozen) {
      throw Opal.FrozenError.$new("can't modify frozen " + (obj.$class()) + ": " + (obj), Opal.hash2(["receiver"], {"receiver": obj}));
    }
  };
  Opal.deny_frozen_access = $deny_frozen_access;

  // common #freeze runtime support
  Opal.freeze = function(obj) {
    $prop(obj, "$$frozen", true);

    // set $$id
    if (!obj.hasOwnProperty('$$id')) { $prop(obj, '$$id', $uid()); }

    if (obj.hasOwnProperty('$$meta')) {
      // freeze $$meta if it has already been set
      obj.$$meta.$freeze();
    } else {
      // ensure $$meta can be set lazily, $$meta is frozen when set in runtime.js
      $prop(obj, '$$meta', null);
    }

    // $$comparable is used internally and set multiple times
    // defining it before sealing ensures it can be modified later on
    if (!obj.hasOwnProperty('$$comparable')) { $prop(obj, '$$comparable', null); }

    // seal the Object
    Object.seal(obj);

    return obj;
  };

  // freze props, make setters of instance variables throw FrozenError
  Opal.freeze_props = function(obj) {
    var prop, prop_type, desc;

    for(prop in obj) {
      prop_type = typeof(prop);

      // prop_type "object" here is a String(), skip $ props
      if ((prop_type === "string" || prop_type === "object") && prop[0] === '$') {
        continue;
      }

      desc = Object.getOwnPropertyDescriptor(obj, prop);
      if (desc && desc.enumerable && desc.writable) {
        // create closure to retain current value as cv
        // for Opal 2.0 let for cv should do the trick, instead of a function
        (function() {
          // set v to undefined, as if the property is not set
          var cv = obj[prop];
          Object.defineProperty(obj, prop, {
            get: function() { return cv; },
            set: function(_val) { $deny_frozen_access(obj); },
            enumerable: true
          });
        })();
      }
    }
  };

  // Regexps
  // -------

  // Escape Regexp special chars letting the resulting string be used to build
  // a new Regexp.
  //
  Opal.escape_regexp = function(str) {
    return str.replace(/([-[\]\/{}()*+?.^$\\| ])/g, '\\$1')
              .replace(/[\n]/g, '\\n')
              .replace(/[\r]/g, '\\r')
              .replace(/[\f]/g, '\\f')
              .replace(/[\t]/g, '\\t');
  };

  // Create a global Regexp from a RegExp object and cache the result
  // on the object itself ($$g attribute).
  //
  Opal.global_regexp = function(pattern) {
    if (pattern.global) {
      return pattern; // RegExp already has the global flag
    }
    if (pattern.$$g == null) {
      pattern.$$g = new RegExp(pattern.source, (pattern.multiline ? 'gm' : 'g') + (pattern.ignoreCase ? 'i' : ''));
    } else {
      pattern.$$g.lastIndex = null; // reset lastIndex property
    }
    return pattern.$$g;
  };

  // Create a global multiline Regexp from a RegExp object and cache the result
  // on the object itself ($$gm or $$g attribute).
  //
  Opal.global_multiline_regexp = function(pattern) {
    var result, flags;

    // RegExp already has the global and multiline flag
    if (pattern.global && pattern.multiline) return pattern;

    flags = 'gm' + (pattern.ignoreCase ? 'i' : '');
    if (pattern.multiline) {
      // we are using the $$g attribute because the Regexp is already multiline
      if (pattern.$$g == null) {
        pattern.$$g = new RegExp(pattern.source, flags);
      }
      result = pattern.$$g;
    } else {
      if (pattern.$$gm == null) {
        pattern.$$gm = new RegExp(pattern.source, flags);
      }
      result = pattern.$$gm;
    }
    result.lastIndex = null; // reset lastIndex property
    return result;
  };

  // Combine multiple regexp parts together
  Opal.regexp = function(parts, flags) {
    var part;
    var ignoreCase = typeof flags !== 'undefined' && flags && flags.indexOf('i') >= 0;

    for (var i = 0, ii = parts.length; i < ii; i++) {
      part = parts[i];
      if (part instanceof RegExp) {
        if (part.ignoreCase !== ignoreCase)
          Opal.Kernel.$warn(
            "ignore case doesn't match for " + part.source.$inspect(),
            Opal.hash({uplevel: 1})
          )

        part = part.source;
      }
      if (part === '') part = '(?:' + part + ')';
      parts[i] = part;
    }

    if (flags) {
      return new RegExp(parts.join(''), flags);
    } else {
      return new RegExp(parts.join(''));
    }
  };

  // Require system
  // --------------

  Opal.modules         = {};
  Opal.loaded_features = ['corelib/runtime'];
  Opal.current_dir     = '.';
  Opal.require_table   = {'corelib/runtime': true};

  Opal.normalize = function(path) {
    var parts, part, new_parts = [], SEPARATOR = '/';

    if (Opal.current_dir !== '.') {
      path = Opal.current_dir.replace(/\/*$/, '/') + path;
    }

    path = path.replace(/^\.\//, '');
    path = path.replace(/\.(rb|opal|js)$/, '');
    parts = path.split(SEPARATOR);

    for (var i = 0, ii = parts.length; i < ii; i++) {
      part = parts[i];
      if (part === '') continue;
      (part === '..') ? new_parts.pop() : new_parts.push(part)
    }

    return new_parts.join(SEPARATOR);
  };

  Opal.loaded = function(paths) {
    var i, l, path;

    for (i = 0, l = paths.length; i < l; i++) {
      path = Opal.normalize(paths[i]);

      if (Opal.require_table[path]) {
        continue;
      }

      Opal.loaded_features.push(path);
      Opal.require_table[path] = true;
    }
  };

  Opal.load_normalized = function(path) {
    Opal.loaded([path]);

    var module = Opal.modules[path];

    if (module) {
      var retval = module(Opal);
      if (typeof Promise !== 'undefined' && retval instanceof Promise) {
        // A special case of require having an async top:
        // We will need to await it.
        return retval.then($return_val(true));
      }
    }
    else {
      var severity = Opal.config.missing_require_severity;
      var message  = 'cannot load such file -- ' + path;

      if (severity === "error") {
        if (Opal.LoadError) {
          throw Opal.LoadError.$new(message)
        } else {
          throw message
        }
      }
      else if (severity === "warning") {
        console.warn('WARNING: LoadError: ' + message);
      }
    }

    return true;
  };

  Opal.load = function(path) {
    path = Opal.normalize(path);

    return Opal.load_normalized(path);
  };

  Opal.require = function(path) {
    path = Opal.normalize(path);

    if (Opal.require_table[path]) {
      return false;
    }

    return Opal.load_normalized(path);
  };


  // Strings
  // -------

  Opal.encodings = Object.create(null);

  // Sets the encoding on a string, will treat string literals as frozen strings
  // raising a FrozenError.
  //
  // @param str [String] the string on which the encoding should be set
  // @param name [String] the canonical name of the encoding
  // @param type [String] possible values are either `"encoding"`, `"internal_encoding"`, or `undefined
  Opal.set_encoding = function(str, name, type) {
    if (typeof type === "undefined") type = "encoding";
    if (typeof str === 'string' || str.$$frozen === true)
      throw Opal.FrozenError.$new("can't modify frozen String");

    var encoding = Opal.find_encoding(name);

    if (encoding === str[type]) { return str; }

    str[type] = encoding;

    return str;
  };

  // Fetches the encoding for the given name or raises ArgumentError.
  Opal.find_encoding = function(name) {
    var register = Opal.encodings;
    var encoding = register[name] || register[name.toUpperCase()];
    if (!encoding) throw Opal.ArgumentError.$new("unknown encoding name - " + name);
    return encoding;
  }

  // @returns a String object with the encoding set from a string literal
  Opal.enc = function(str, name) {
    var dup = new String(str);
    dup = Opal.set_encoding(dup, name);
    dup.internal_encoding = dup.encoding;
    return dup
  }

  // @returns a String object with the internal encoding set to Binary
  Opal.binary = function(str) {
    var dup = new String(str);
    return Opal.set_encoding(dup, "binary", "internal_encoding");
  }

  Opal.last_promise = null;
  Opal.promise_unhandled_exception = false;

  // Run a block of code, but if it returns a Promise, don't run the next
  // one, but queue it.
  Opal.queue = function(proc) {
    if (Opal.last_promise) {
      // The async path is taken only if anything before returned a
      // Promise(V2).
      Opal.last_promise = Opal.last_promise.then(function() {
        if (!Opal.promise_unhandled_exception) return proc(Opal);
      })['catch'](function(error) {
        if (Opal.respond_to(error, '$full_message')) {
          error = error.$full_message();
        }
        console.error(error);
        // Abort further execution
        Opal.promise_unhandled_exception = true;
        Opal.exit(1);
      });
      return Opal.last_promise;
    }
    else {
      var ret = proc(Opal);
      if (typeof Promise === 'function' && typeof ret === 'object' && ret instanceof Promise) {
        Opal.last_promise = ret;
      }
      return ret;
    }
  }

  // Operator helpers
  // ----------------

  function are_both_numbers(l,r) { return typeof(l) === 'number' && typeof(r) === 'number' }

  Opal.rb_plus   = function(l,r) { return are_both_numbers(l,r) ? l + r : l['$+'](r); }
  Opal.rb_minus  = function(l,r) { return are_both_numbers(l,r) ? l - r : l['$-'](r); }
  Opal.rb_times  = function(l,r) { return are_both_numbers(l,r) ? l * r : l['$*'](r); }
  Opal.rb_divide = function(l,r) { return are_both_numbers(l,r) ? l / r : l['$/'](r); }
  Opal.rb_lt     = function(l,r) { return are_both_numbers(l,r) ? l < r : l['$<'](r); }
  Opal.rb_gt     = function(l,r) { return are_both_numbers(l,r) ? l > r : l['$>'](r); }
  Opal.rb_le     = function(l,r) { return are_both_numbers(l,r) ? l <= r : l['$<='](r); }
  Opal.rb_ge     = function(l,r) { return are_both_numbers(l,r) ? l >= r : l['$>='](r); }

  // Optimized helpers for calls like $truthy((a)['$==='](b)) -> $eqeqeq(a, b)
  function are_both_numbers_or_strings(lhs, rhs) {
    return (typeof lhs === 'number' && typeof rhs === 'number') ||
           (typeof lhs === 'string' && typeof rhs === 'string');
  }

  function $eqeq(lhs, rhs) {
    return are_both_numbers_or_strings(lhs,rhs) ? lhs === rhs : $truthy((lhs)['$=='](rhs));
  };
  Opal.eqeq = $eqeq;
  Opal.eqeqeq = function(lhs, rhs) {
    return are_both_numbers_or_strings(lhs,rhs) ? lhs === rhs : $truthy((lhs)['$==='](rhs));
  };
  Opal.neqeq = function(lhs, rhs) {
    return are_both_numbers_or_strings(lhs,rhs) ? lhs !== rhs : $truthy((lhs)['$!='](rhs));
  };
  Opal.not = function(arg) {
    if (undefined === arg || null === arg || false === arg || nil === arg) return true;
    if (true === arg || arg['$!'].$$pristine) return false;
    return $truthy(arg['$!']());
  }

  // Shortcuts - optimized function generators for simple kinds of functions
  function $return_val(arg) {
    return function() {
      return arg;
    }
  }
  Opal.return_val = $return_val;

  Opal.return_self = function() {
    return this;
  }
  Opal.return_ivar = function(ivar) {
    return function() {
      if (this[ivar] == null) { return nil; }
      return this[ivar];
    }
  }
  Opal.assign_ivar = function(ivar) {
    return function(val) {
      $deny_frozen_access(this);
      return this[ivar] = val;
    }
  }
  Opal.assign_ivar_val = function(ivar, static_val) {
    return function() {
      $deny_frozen_access(this);
      return this[ivar] = static_val;
    }
  }

  // Primitives for handling parameters
  Opal.ensure_kwargs = function(kwargs) {
    if (kwargs == null) {
      return Opal.hash2([], {});
    } else if (kwargs.$$is_hash) {
      return kwargs;
    } else {
      throw Opal.ArgumentError.$new('expected kwargs');
    }
  }

  Opal.get_kwarg = function(kwargs, key) {
    if (!$has_own.call(kwargs.$$smap, key)) {
      throw Opal.ArgumentError.$new('missing keyword: '+key);
    }
    return kwargs.$$smap[key];
  }

  // Initialization
  // --------------
  Opal.BasicObject = BasicObject = $allocate_class('BasicObject', null);
  Opal.Object      = _Object     = $allocate_class('Object', Opal.BasicObject);
  Opal.Module      = Module      = $allocate_class('Module', Opal.Object);
  Opal.Class       = Class       = $allocate_class('Class', Opal.Module);
  Opal.Opal        = _Opal       = $allocate_module('Opal');
  Opal.Kernel      = Kernel      = $allocate_module('Kernel');

  $set_proto(Opal.BasicObject, Opal.Class.$$prototype);
  $set_proto(Opal.Object, Opal.Class.$$prototype);
  $set_proto(Opal.Module, Opal.Class.$$prototype);
  $set_proto(Opal.Class, Opal.Class.$$prototype);

  // BasicObject can reach itself, avoid const_set to skip the $$base_module logic
  BasicObject.$$const.BasicObject = BasicObject;

  // Assign basic constants
  $const_set(_Object, "BasicObject",  BasicObject);
  $const_set(_Object, "Object",       _Object);
  $const_set(_Object, "Module",       Module);
  $const_set(_Object, "Class",        Class);
  $const_set(_Object, "Opal",         _Opal);
  $const_set(_Object, "Kernel",       Kernel);

  // Fix booted classes to have correct .class value
  BasicObject.$$class = Class;
  _Object.$$class     = Class;
  Module.$$class      = Class;
  Class.$$class       = Class;
  _Opal.$$class       = Module;
  Kernel.$$class      = Module;

  // Forward .toString() to #to_s
  $prop(_Object.$$prototype, 'toString', function() {
    var to_s = this.$to_s();
    if (to_s.$$is_string && typeof(to_s) === 'object') {
      // a string created using new String('string')
      return to_s.valueOf();
    } else {
      return to_s;
    }
  });

  // Make Kernel#require immediately available as it's needed to require all the
  // other corelib files.
  $prop(_Object.$$prototype, '$require', Opal.require);

  // Instantiate the main object
  Opal.top = new _Object();
  Opal.top.$to_s = Opal.top.$inspect = $return_val('main');
  Opal.top.$define_method = top_define_method;

  // Foward calls to define_method on the top object to Object
  function top_define_method() {
    var args = Opal.slice.call(arguments);
    var block = top_define_method.$$p;
    top_define_method.$$p = null;
    return Opal.send(_Object, 'define_method', args, block)
  };

  // Nil
  Opal.NilClass = $allocate_class('NilClass', Opal.Object);
  $const_set(_Object, 'NilClass', Opal.NilClass);
  nil = Opal.nil = new Opal.NilClass();
  nil.$$id = nil_id;
  nil.call = nil.apply = function() { throw Opal.LocalJumpError.$new('no block given'); };
  nil.$$frozen = true;
  nil.$$comparable = false;
  Object.seal(nil);

  Opal.thrower = function(type) {
    var thrower = new Error('unexpected '+type);
    thrower.$thrower_type = type;
    thrower.$throw = function(value) {
      if (value == null) value = nil;
      thrower.$v = value;
      throw thrower;
    };
    return thrower;
  };

  Opal.t_eval_return = Opal.thrower("return");

  TypeError.$$super = Error;

  // If enable-file-source-embed compiler option is enabled, each module loaded will add its
  // sources to this object
  Opal.file_sources = {};
}).call(this);
Opal.loaded(["corelib/runtime.js"]);
Opal.modules["corelib/constants"] = function(Opal) {/* Generated by Opal 1.6.0 */
  var $const_set = Opal.const_set, nil = Opal.nil, $$$ = Opal.$$$;

  
  $const_set('::', 'RUBY_PLATFORM', "opal");
  $const_set('::', 'RUBY_ENGINE', "opal");
  $const_set('::', 'RUBY_VERSION', "3.1.0");
  $const_set('::', 'RUBY_ENGINE_VERSION', "1.6.0");
  $const_set('::', 'RUBY_RELEASE_DATE', "2022-11-24");
  $const_set('::', 'RUBY_PATCHLEVEL', 0);
  $const_set('::', 'RUBY_REVISION', "0");
  $const_set('::', 'RUBY_COPYRIGHT', "opal - Copyright (C) 2013-2022 Adam Beynon and the Opal contributors");
  return $const_set('::', 'RUBY_DESCRIPTION', "opal " + ($$$('RUBY_ENGINE_VERSION')) + " (" + ($$$('RUBY_RELEASE_DATE')) + " revision " + ($$$('RUBY_REVISION')) + ")");
};

Opal.modules["corelib/main"] = function(Opal) {/* Generated by Opal 1.6.0 */
  var $return_val = Opal.return_val, $def = Opal.def, $Object = Opal.Object, $slice = Opal.slice, $Kernel = Opal.Kernel, self = Opal.top, $nesting = [], nil = Opal.nil;

  Opal.add_stubs('include,raise');
  return (function(self, $parent_nesting) {
    
    
    
    $def(self, '$to_s', $return_val("main"), 0);
    
    $def(self, '$include', function $$include(mod) {
      
      return $Object.$include(mod)
    }, 1);
    
    $def(self, '$autoload', function $$autoload($a) {
      var $post_args, args;

      
      $post_args = $slice.call(arguments);
      args = $post_args;
      return Opal.Object.$autoload.apply(Opal.Object, args);;
    }, -1);
    return $def(self, '$using', function $$using(mod) {
      
      return $Kernel.$raise("main.using is permitted only at toplevel")
    }, 1);
  })(Opal.get_singleton_class(self), $nesting)
};

Opal.modules["corelib/basic_object"] = function(Opal) {/* Generated by Opal 1.6.0 */
  "use strict";
  var $klass = Opal.klass, $slice = Opal.slice, $def = Opal.def, $alias = Opal.alias, $return_val = Opal.return_val, $Opal = Opal.Opal, $truthy = Opal.truthy, $range = Opal.range, $Kernel = Opal.Kernel, $to_a = Opal.to_a, $hash2 = Opal.hash2, $send = Opal.send, $eqeq = Opal.eqeq, $rb_ge = Opal.rb_ge, nil = Opal.nil, $$$ = Opal.$$$;

  Opal.add_stubs('==,raise,inspect,pristine,!,nil?,cover?,size,merge,compile,proc,[],first,>=,length,instance_variable_get,any?,new,caller');
  return (function($base, $super) {
    var self = $klass($base, $super, 'BasicObject');

    
    
    
    $def(self, '$initialize', function $$initialize($a) {
      var $post_args, $rest_arg;

      
      $post_args = $slice.call(arguments);
      $rest_arg = $post_args;
      return nil;
    }, -1);
    
    $def(self, '$==', function $BasicObject_$eq_eq$1(other) {
      var self = this;

      return self === other;
    }, 1);
    
    $def(self, '$eql?', function $BasicObject_eql$ques$2(other) {
      var self = this;

      return self['$=='](other)
    }, 1);
    $alias(self, "equal?", "==");
    
    $def(self, '$__id__', function $$__id__() {
      var self = this;

      
      if (self.$$id != null) {
        return self.$$id;
      }
      Opal.prop(self, '$$id', Opal.uid());
      return self.$$id;
    
    }, 0);
    
    $def(self, '$__send__', function $$__send__(symbol, $a) {
      var block = $$__send__.$$p || nil, $post_args, args, self = this;

      $$__send__.$$p = null;
      
      ;
      $post_args = $slice.call(arguments, 1);
      args = $post_args;
      
      if (!symbol.$$is_string) {
        self.$raise($$$('TypeError'), "" + (self.$inspect()) + " is not a symbol nor a string")
      }

      var func = self['$' + symbol];

      if (func) {
        if (block !== nil) {
          func.$$p = block;
        }

        return func.apply(self, args);
      }

      if (block !== nil) {
        self.$method_missing.$$p = block;
      }

      return self.$method_missing.apply(self, [symbol].concat(args));
    ;
    }, -2);
    
    $def(self, '$!', $return_val(false), 0);
    $Opal.$pristine("!");
    
    $def(self, '$!=', function $BasicObject_$not_eq$3(other) {
      var self = this;

      return self['$=='](other)['$!']()
    }, 1);
    
    $def(self, '$instance_eval', function $$instance_eval($a) {
      var block = $$instance_eval.$$p || nil, $post_args, args, $b, self = this, string = nil, file = nil, _lineno = nil, default_eval_options = nil, $ret_or_1 = nil, compiling_options = nil, compiled = nil;

      $$instance_eval.$$p = null;
      
      ;
      $post_args = $slice.call(arguments);
      args = $post_args;
      if (($truthy(block['$nil?']()) && ($truthy(!!Opal.compile)))) {
        
        if (!$truthy($range(1, 3, false)['$cover?'](args.$size()))) {
          $Kernel.$raise($$$('ArgumentError'), "wrong number of arguments (0 for 1..3)")
        };
        $b = [].concat($to_a(args)), (string = ($b[0] == null ? nil : $b[0])), (file = ($b[1] == null ? nil : $b[1])), (_lineno = ($b[2] == null ? nil : $b[2])), $b;
        default_eval_options = $hash2(["file", "eval"], {"file": ($truthy(($ret_or_1 = file)) ? ($ret_or_1) : ("(eval)")), "eval": true});
        compiling_options = Opal.hash({ arity_check: false }).$merge(default_eval_options);
        compiled = $Opal.$compile(string, compiling_options);
        block = $send($Kernel, 'proc', [], function $$4(){var self = $$4.$$s == null ? this : $$4.$$s;

          return new Function("Opal,self", "return " + compiled)(Opal, self);}, {$$arity: 0, $$s: self});
      } else if ((($truthy(block['$nil?']()) && ($truthy($rb_ge(args.$length(), 1)))) && ($eqeq(args.$first()['$[]'](0), "@")))) {
        return self.$instance_variable_get(args.$first())
      } else if ($truthy(args['$any?']())) {
        $Kernel.$raise($$$('ArgumentError'), "wrong number of arguments (" + (args.$size()) + " for 0)")
      };
      
      var old = block.$$s,
          result;

      block.$$s = null;

      // Need to pass $$eval so that method definitions know if this is
      // being done on a class/module. Cannot be compiler driven since
      // send(:instance_eval) needs to work.
      if (self.$$is_a_module) {
        self.$$eval = true;
        try {
          result = block.call(self, self);
        }
        finally {
          self.$$eval = false;
        }
      }
      else {
        result = block.call(self, self);
      }

      block.$$s = old;

      return result;
    ;
    }, -1);
    
    $def(self, '$instance_exec', function $$instance_exec($a) {
      var block = $$instance_exec.$$p || nil, $post_args, args, self = this;

      $$instance_exec.$$p = null;
      
      ;
      $post_args = $slice.call(arguments);
      args = $post_args;
      if (!$truthy(block)) {
        $Kernel.$raise($$$('ArgumentError'), "no block given")
      };
      
      var block_self = block.$$s,
          result;

      block.$$s = null;

      if (self.$$is_a_module) {
        self.$$eval = true;
        try {
          result = block.apply(self, args);
        }
        finally {
          self.$$eval = false;
        }
      }
      else {
        result = block.apply(self, args);
      }

      block.$$s = block_self;

      return result;
    ;
    }, -1);
    
    $def(self, '$singleton_method_added', function $$singleton_method_added($a) {
      var $post_args, $rest_arg;

      
      $post_args = $slice.call(arguments);
      $rest_arg = $post_args;
      return nil;
    }, -1);
    
    $def(self, '$singleton_method_removed', function $$singleton_method_removed($a) {
      var $post_args, $rest_arg;

      
      $post_args = $slice.call(arguments);
      $rest_arg = $post_args;
      return nil;
    }, -1);
    
    $def(self, '$singleton_method_undefined', function $$singleton_method_undefined($a) {
      var $post_args, $rest_arg;

      
      $post_args = $slice.call(arguments);
      $rest_arg = $post_args;
      return nil;
    }, -1);
    
    $def(self, '$method_missing', function $$method_missing(symbol, $a) {
      var block = $$method_missing.$$p || nil, $post_args, args, self = this, inspect_result = nil;

      $$method_missing.$$p = null;
      
      ;
      $post_args = $slice.call(arguments, 1);
      args = $post_args;
      inspect_result = $Opal.$inspect(self);
      return $Kernel.$raise($$$('NoMethodError').$new("undefined method `" + (symbol) + "' for " + (inspect_result), symbol, args), nil, $Kernel.$caller(1));
    }, -2);
    $Opal.$pristine(self, "method_missing");
    return $def(self, '$respond_to_missing?', function $BasicObject_respond_to_missing$ques$5(method_name, include_all) {
      
      
      if (include_all == null) include_all = false;
      return false;
    }, -2);
  })('::', null)
};

Opal.modules["corelib/error"] = function(Opal) {/* Generated by Opal 1.6.0 */
  var $klass = Opal.klass, $slice = Opal.slice, $gvars = Opal.gvars, $defs = Opal.defs, $send = Opal.send, $to_a = Opal.to_a, $def = Opal.def, $truthy = Opal.truthy, $hash2 = Opal.hash2, $Kernel = Opal.Kernel, $not = Opal.not, $rb_plus = Opal.rb_plus, $eqeq = Opal.eqeq, $Object = Opal.Object, $ensure_kwargs = Opal.ensure_kwargs, $send2 = Opal.send2, $find_super = Opal.find_super, $module = Opal.module, $nesting = [], nil = Opal.nil, $$$ = Opal.$$$;

  Opal.add_stubs('new,map,backtrace,clone,to_s,merge,tty?,[],include?,raise,dup,empty?,!,caller,shift,+,class,join,cause,full_message,==,reverse,split,autoload,attr_reader,inspect');
  
  (function($base, $super, $parent_nesting) {
    var self = $klass($base, $super, 'Exception');

    var $nesting = [self].concat($parent_nesting), $$ = Opal.$r($nesting), $proto = self.$$prototype;

    $proto.message = nil;
    
    Opal.prop(self.$$prototype, '$$is_exception', true);
    var stack_trace_limit;
    Error.stackTraceLimit = 100;
    $defs(self, '$new', function $Exception_new$1($a) {
      var $post_args, args, self = this;
      if ($gvars["!"] == null) $gvars["!"] = nil;

      
      $post_args = $slice.call(arguments);
      args = $post_args;
      
      var message   = (args.length > 0) ? args[0] : nil;
      var error     = new self.$$constructor(message);
      error.name    = self.$$name;
      error.message = message;
      error.cause   = $gvars["!"];
      Opal.send(error, error.$initialize, args);

      // Error.captureStackTrace() will use .name and .toString to build the
      // first line of the stack trace so it must be called after the error
      // has been initialized.
      // https://nodejs.org/dist/latest-v6.x/docs/api/errors.html
      if (Opal.config.enable_stack_trace && Error.captureStackTrace) {
        // Passing Kernel.raise will cut the stack trace from that point above
        Error.captureStackTrace(error, stack_trace_limit);
      }

      return error;
    ;
    }, -1);
    stack_trace_limit = self.$new;
    $defs(self, '$exception', function $$exception($a) {
      var $post_args, args, self = this;

      
      $post_args = $slice.call(arguments);
      args = $post_args;
      return $send(self, 'new', $to_a(args));
    }, -1);
    
    $def(self, '$initialize', function $$initialize($a) {
      var $post_args, args, self = this;

      
      $post_args = $slice.call(arguments);
      args = $post_args;
      return self.message = (args.length > 0) ? args[0] : nil;;
    }, -1);
    
    // Convert backtrace from any format to Ruby format
    function correct_backtrace(backtrace) {
      var new_bt = [], m;

      for (var i = 0; i < backtrace.length; i++) {
        var loc = backtrace[i];
        if (!loc || !loc.$$is_string) {
          /* Do nothing */
        }
        /* Chromium format */
        else if ((m = loc.match(/^    at (.*?) \((.*?)\)$/))) {
          new_bt.push(m[2] + ":in `" + m[1] + "'");
        }
        else if ((m = loc.match(/^    at (.*?)$/))) {
          new_bt.push(m[1] + ":in `undefined'");
        }
        /* Node format */
        else if ((m = loc.match(/^  from (.*?)$/))) {
          new_bt.push(m[1]);
        }
        /* Mozilla/Apple format */
        else if ((m = loc.match(/^(.*?)@(.*?)$/))) {
          new_bt.push(m[2] + ':in `' + m[1] + "'");
        }
      }

      return new_bt;
    }
  ;
    
    $def(self, '$backtrace', function $$backtrace() {
      var self = this;

      
      if (self.backtrace) {
        // nil is a valid backtrace
        return self.backtrace;
      }

      var backtrace = self.stack;

      if (typeof(backtrace) !== 'undefined' && backtrace.$$is_string) {
        return self.backtrace = correct_backtrace(backtrace.split("\n"));
      }
      else if (backtrace) {
        return self.backtrace = correct_backtrace(backtrace);
      }

      return [];
    
    }, 0);
    
    $def(self, '$backtrace_locations', function $$backtrace_locations() {
      var $a, self = this;

      
      if (self.backtrace_locations) return self.backtrace_locations;
      self.backtrace_locations = ($a = self.$backtrace(), ($a === nil || $a == null) ? nil : $send($a, 'map', [], function $$2(loc){
        
        if (loc == null) loc = nil;
        return $$$($$$($$$('Thread'), 'Backtrace'), 'Location').$new(loc);}, 1))
      return self.backtrace_locations;
    
    }, 0);
    
    $def(self, '$cause', function $$cause() {
      var self = this;

      return self.cause || nil;
    }, 0);
    
    $def(self, '$exception', function $$exception(str) {
      var self = this;

      
      if (str == null) str = nil;
      
      if (str === nil || self === str) {
        return self;
      }

      var cloned = self.$clone();
      cloned.message = str;
      if (self.backtrace) cloned.backtrace = self.backtrace.$dup();
      cloned.stack = self.stack;
      cloned.cause = self.cause;
      return cloned;
    ;
    }, -1);
    
    $def(self, '$message', function $$message() {
      var self = this;

      return self.$to_s()
    }, 0);
    
    $def(self, '$full_message', function $$full_message(kwargs) {
      var $a, $b, self = this, $ret_or_1 = nil, highlight = nil, order = nil, bold_underline = nil, bold = nil, reset = nil, bt = nil, first = nil, msg = nil;
      if ($gvars.stderr == null) $gvars.stderr = nil;

      
      if (kwargs == null) kwargs = nil;
      if (!$truthy((($a = $$('Hash', 'skip_raise')) ? 'constant' : nil))) {
        return "" + (self.message) + "\n" + (self.stack)
      };
      kwargs = $hash2(["highlight", "order"], {"highlight": $gvars.stderr['$tty?'](), "order": "top"}).$merge(($truthy(($ret_or_1 = kwargs)) ? ($ret_or_1) : ($hash2([], {}))));
      $b = [kwargs['$[]']("highlight"), kwargs['$[]']("order")], (highlight = $b[0]), (order = $b[1]), $b;
      if (!$truthy([true, false]['$include?'](highlight))) {
        $Kernel.$raise($$$('ArgumentError'), "expected true or false as highlight: " + (highlight))
      };
      if (!$truthy(["top", "bottom"]['$include?'](order))) {
        $Kernel.$raise($$$('ArgumentError'), "expected :top or :bottom as order: " + (order))
      };
      if ($truthy(highlight)) {
        
        bold_underline = "\u001b[1;4m";
        bold = "\u001b[1m";
        reset = "\u001b[m";
      } else {
        bold_underline = (bold = (reset = ""))
      };
      bt = self.$backtrace().$dup();
      if (($not(bt) || ($truthy(bt['$empty?']())))) {
        bt = self.$caller()
      };
      first = bt.$shift();
      msg = "" + (first) + ": ";
      msg = $rb_plus(msg, "" + (bold) + (self.$to_s()) + " (" + (bold_underline) + (self.$class()) + (reset) + (bold) + ")" + (reset) + "\n");
      msg = $rb_plus(msg, $send(bt, 'map', [], function $$3(loc){
        
        if (loc == null) loc = nil;
        return "\tfrom " + (loc) + "\n";}, 1).$join());
      if ($truthy(self.$cause())) {
        msg = $rb_plus(msg, self.$cause().$full_message($hash2(["highlight"], {"highlight": highlight})))
      };
      if ($eqeq(order, "bottom")) {
        
        msg = msg.$split("\n").$reverse().$join("\n");
        msg = $rb_plus("" + (bold) + "Traceback" + (reset) + " (most recent call last):\n", msg);
      };
      return msg;
    }, -1);
    
    $def(self, '$inspect', function $$inspect() {
      var self = this, as_str = nil;

      
      as_str = self.$to_s();
      if ($truthy(as_str['$empty?']())) {
        return self.$class().$to_s()
      } else {
        return "#<" + (self.$class().$to_s()) + ": " + (self.$to_s()) + ">"
      };
    }, 0);
    
    $def(self, '$set_backtrace', function $$set_backtrace(backtrace) {
      var self = this;

      
      var valid = true, i, ii;

      if (backtrace === nil) {
        self.backtrace = nil;
        self.stack = '';
      } else if (backtrace.$$is_string) {
        self.backtrace = [backtrace];
        self.stack = '  from ' + backtrace;
      } else {
        if (backtrace.$$is_array) {
          for (i = 0, ii = backtrace.length; i < ii; i++) {
            if (!backtrace[i].$$is_string) {
              valid = false;
              break;
            }
          }
        } else {
          valid = false;
        }

        if (valid === false) {
          $Kernel.$raise($$$('TypeError'), "backtrace must be Array of String")
        }

        self.backtrace = backtrace;
        self.stack = $send((backtrace), 'map', [], function $$4(i){
        
        if (i == null) i = nil;
        return $rb_plus("  from ", i);}, 1).join("\n");
      }

      return backtrace;
    
    }, 1);
    return $def(self, '$to_s', function $$to_s() {
      var self = this, $ret_or_1 = nil, $ret_or_2 = nil;

      if ($truthy(($ret_or_1 = ($truthy(($ret_or_2 = self.message)) ? (self.message.$to_s()) : ($ret_or_2))))) {
        return $ret_or_1
      } else {
        return self.$class().$to_s()
      }
    }, 0);
  })('::', Error, $nesting);
  $klass('::', $$$('Exception'), 'ScriptError');
  $klass('::', $$$('ScriptError'), 'SyntaxError');
  $klass('::', $$$('ScriptError'), 'LoadError');
  $klass('::', $$$('ScriptError'), 'NotImplementedError');
  $klass('::', $$$('Exception'), 'SystemExit');
  $klass('::', $$$('Exception'), 'NoMemoryError');
  $klass('::', $$$('Exception'), 'SignalException');
  $klass('::', $$$('SignalException'), 'Interrupt');
  $klass('::', $$$('Exception'), 'SecurityError');
  $klass('::', $$$('Exception'), 'SystemStackError');
  $klass('::', $$$('Exception'), 'StandardError');
  $klass('::', $$$('StandardError'), 'EncodingError');
  $klass('::', $$$('StandardError'), 'ZeroDivisionError');
  $klass('::', $$$('StandardError'), 'NameError');
  $klass('::', $$$('NameError'), 'NoMethodError');
  $klass('::', $$$('StandardError'), 'RuntimeError');
  $klass('::', $$$('RuntimeError'), 'FrozenError');
  $klass('::', $$$('StandardError'), 'LocalJumpError');
  $klass('::', $$$('StandardError'), 'TypeError');
  $klass('::', $$$('StandardError'), 'ArgumentError');
  $klass('::', $$$('ArgumentError'), 'UncaughtThrowError');
  $klass('::', $$$('StandardError'), 'IndexError');
  $klass('::', $$$('IndexError'), 'StopIteration');
  $klass('::', $$$('StopIteration'), 'ClosedQueueError');
  $klass('::', $$$('IndexError'), 'KeyError');
  $klass('::', $$$('StandardError'), 'RangeError');
  $klass('::', $$$('RangeError'), 'FloatDomainError');
  $klass('::', $$$('StandardError'), 'IOError');
  $klass('::', $$$('IOError'), 'EOFError');
  $klass('::', $$$('StandardError'), 'SystemCallError');
  $klass('::', $$$('StandardError'), 'RegexpError');
  $klass('::', $$$('StandardError'), 'ThreadError');
  $klass('::', $$$('StandardError'), 'FiberError');
  $Object.$autoload("Errno", "corelib/error/errno");
  (function($base, $super) {
    var self = $klass($base, $super, 'FrozenError');

    
    
    self.$attr_reader("receiver");
    return $def(self, '$initialize', function $$initialize(message, $kwargs) {
      var receiver, $yield = $$initialize.$$p || nil, self = this;

      $$initialize.$$p = null;
      
      $kwargs = $ensure_kwargs($kwargs);
      
      receiver = $kwargs.$$smap["receiver"];if (receiver == null) receiver = nil;
      $send2(self, $find_super(self, 'initialize', $$initialize, false, true), 'initialize', [message], null);
      return (self.receiver = receiver);
    }, -2);
  })('::', $$$('RuntimeError'));
  (function($base, $super) {
    var self = $klass($base, $super, 'UncaughtThrowError');

    var $proto = self.$$prototype;

    $proto.tag = nil;
    
    self.$attr_reader("tag", "value");
    return $def(self, '$initialize', function $$initialize(tag, value) {
      var $yield = $$initialize.$$p || nil, self = this;

      $$initialize.$$p = null;
      
      if (value == null) value = nil;
      self.tag = tag;
      self.value = value;
      return $send2(self, $find_super(self, 'initialize', $$initialize, false, true), 'initialize', ["uncaught throw " + (self.tag.$inspect())], null);
    }, -2);
  })('::', $$$('ArgumentError'));
  (function($base, $super) {
    var self = $klass($base, $super, 'NameError');

    
    
    self.$attr_reader("name");
    return $def(self, '$initialize', function $$initialize(message, name) {
      var $yield = $$initialize.$$p || nil, self = this;

      $$initialize.$$p = null;
      
      if (name == null) name = nil;
      $send2(self, $find_super(self, 'initialize', $$initialize, false, true), 'initialize', [message], null);
      return (self.name = name);
    }, -2);
  })('::', null);
  (function($base, $super) {
    var self = $klass($base, $super, 'NoMethodError');

    
    
    self.$attr_reader("args");
    return $def(self, '$initialize', function $$initialize(message, name, args) {
      var $yield = $$initialize.$$p || nil, self = this;

      $$initialize.$$p = null;
      
      if (name == null) name = nil;
      if (args == null) args = [];
      $send2(self, $find_super(self, 'initialize', $$initialize, false, true), 'initialize', [message, name], null);
      return (self.args = args);
    }, -2);
  })('::', null);
  (function($base, $super) {
    var self = $klass($base, $super, 'StopIteration');

    
    return self.$attr_reader("result")
  })('::', null);
  (function($base, $super) {
    var self = $klass($base, $super, 'KeyError');

    var $proto = self.$$prototype;

    $proto.receiver = $proto.key = nil;
    
    
    $def(self, '$initialize', function $$initialize(message, $kwargs) {
      var receiver, key, $yield = $$initialize.$$p || nil, self = this;

      $$initialize.$$p = null;
      
      $kwargs = $ensure_kwargs($kwargs);
      
      receiver = $kwargs.$$smap["receiver"];if (receiver == null) receiver = nil;
      
      key = $kwargs.$$smap["key"];if (key == null) key = nil;
      $send2(self, $find_super(self, 'initialize', $$initialize, false, true), 'initialize', [message], null);
      self.receiver = receiver;
      return (self.key = key);
    }, -2);
    
    $def(self, '$receiver', function $$receiver() {
      var self = this, $ret_or_1 = nil;

      if ($truthy(($ret_or_1 = self.receiver))) {
        return $ret_or_1
      } else {
        return $Kernel.$raise($$$('ArgumentError'), "no receiver is available")
      }
    }, 0);
    return $def(self, '$key', function $$key() {
      var self = this, $ret_or_1 = nil;

      if ($truthy(($ret_or_1 = self.key))) {
        return $ret_or_1
      } else {
        return $Kernel.$raise($$$('ArgumentError'), "no key is available")
      }
    }, 0);
  })('::', null);
  return (function($base, $parent_nesting) {
    var self = $module($base, 'JS');

    var $nesting = [self].concat($parent_nesting);

    return ($klass($nesting[0], null, 'Error'), nil)
  })('::', $nesting);
};

Opal.modules["corelib/module"] = function(Opal) {/* Generated by Opal 1.6.0 */
  var $truthy = Opal.truthy, $coerce_to = Opal.coerce_to, $const_set = Opal.const_set, $Object = Opal.Object, $return_ivar = Opal.return_ivar, $assign_ivar = Opal.assign_ivar, $ivar = Opal.ivar, $deny_frozen_access = Opal.deny_frozen_access, $freeze = Opal.freeze, $prop = Opal.prop, $klass = Opal.klass, $defs = Opal.defs, $send = Opal.send, $def = Opal.def, $eqeqeq = Opal.eqeqeq, $Module = Opal.Module, $Kernel = Opal.Kernel, $rb_lt = Opal.rb_lt, $rb_gt = Opal.rb_gt, $slice = Opal.slice, $to_a = Opal.to_a, $hash2 = Opal.hash2, $Opal = Opal.Opal, $eqeq = Opal.eqeq, $return_val = Opal.return_val, $lambda = Opal.lambda, $range = Opal.range, $send2 = Opal.send2, $find_super = Opal.find_super, $alias = Opal.alias, $nesting = [], nil = Opal.nil, $$$ = Opal.$$$;

  Opal.add_stubs('module_eval,to_proc,===,raise,equal?,<,>,nil?,attr_reader,attr_writer,warn,attr_accessor,const_name?,class_variable_name!,const_name!,=~,new,inject,split,const_get,==,start_with?,!~,bind,call,class,frozen?,name,append_features,included,cover?,size,merge,compile,proc,any?,prepend_features,prepended,to_s,__id__,constants,include?,copy_class_variables,copy_constants,class_exec,module_exec,inspect');
  
  (function($base, $super, $parent_nesting) {
    var self = $klass($base, $super, 'Module');

    var $nesting = [self].concat($parent_nesting), $$ = Opal.$r($nesting);

    
    $defs(self, '$allocate', function $$allocate() {
      var self = this;

      
      var module = Opal.allocate_module(nil, function(){});
      // Link the prototype of Module subclasses
      if (self !== Opal.Module) Object.setPrototypeOf(module, self.$$prototype);
      return module;
    
    }, 0);
    
    $def(self, '$initialize', function $$initialize() {
      var block = $$initialize.$$p || nil, self = this;

      $$initialize.$$p = null;
      
      ;
      if ((block !== nil)) {
        return $send(self, 'module_eval', [], block.$to_proc())
      } else {
        return nil
      };
    }, 0);
    
    $def(self, '$===', function $Module_$eq_eq_eq$1(object) {
      var self = this;

      
      if ($truthy(object == null)) {
        return false
      };
      return Opal.is_a(object, self);;
    }, 1);
    
    $def(self, '$<', function $Module_$lt$2(other) {
      var self = this;

      
      if (!$eqeqeq($Module, other)) {
        $Kernel.$raise($$$('TypeError'), "compared with non class/module")
      };
      
      var working = self,
          ancestors,
          i, length;

      if (working === other) {
        return false;
      }

      for (i = 0, ancestors = Opal.ancestors(self), length = ancestors.length; i < length; i++) {
        if (ancestors[i] === other) {
          return true;
        }
      }

      for (i = 0, ancestors = Opal.ancestors(other), length = ancestors.length; i < length; i++) {
        if (ancestors[i] === self) {
          return false;
        }
      }

      return nil;
    ;
    }, 1);
    
    $def(self, '$<=', function $Module_$lt_eq$3(other) {
      var self = this, $ret_or_1 = nil;

      if ($truthy(($ret_or_1 = self['$equal?'](other)))) {
        return $ret_or_1
      } else {
        return $rb_lt(self, other)
      }
    }, 1);
    
    $def(self, '$>', function $Module_$gt$4(other) {
      var self = this;

      
      if (!$eqeqeq($Module, other)) {
        $Kernel.$raise($$$('TypeError'), "compared with non class/module")
      };
      return $rb_lt(other, self);
    }, 1);
    
    $def(self, '$>=', function $Module_$gt_eq$5(other) {
      var self = this, $ret_or_1 = nil;

      if ($truthy(($ret_or_1 = self['$equal?'](other)))) {
        return $ret_or_1
      } else {
        return $rb_gt(self, other)
      }
    }, 1);
    
    $def(self, '$<=>', function $Module_$lt_eq_gt$6(other) {
      var self = this, lt = nil;

      
      
      if (self === other) {
        return 0;
      }
    ;
      if (!$eqeqeq($Module, other)) {
        return nil
      };
      lt = $rb_lt(self, other);
      if ($truthy(lt['$nil?']())) {
        return nil
      };
      if ($truthy(lt)) {
        return -1
      } else {
        return 1
      };
    }, 1);
    
    $def(self, '$alias_method', function $$alias_method(newname, oldname) {
      var self = this;

      
      $deny_frozen_access(self);
      newname = $coerce_to(newname, $$$('String'), 'to_str');
      oldname = $coerce_to(oldname, $$$('String'), 'to_str');
      Opal.alias(self, newname, oldname);
      return self;
    }, 2);
    
    $def(self, '$alias_native', function $$alias_native(mid, jsid) {
      var self = this;

      
      if (jsid == null) jsid = mid;
      $deny_frozen_access(self);
      Opal.alias_native(self, mid, jsid);
      return self;
    }, -2);
    
    $def(self, '$ancestors', function $$ancestors() {
      var self = this;

      return Opal.ancestors(self);
    }, 0);
    
    $def(self, '$append_features', function $$append_features(includer) {
      var self = this;

      
      $deny_frozen_access(includer);
      Opal.append_features(self, includer);
      return self;
    }, 1);
    
    $def(self, '$attr_accessor', function $$attr_accessor($a) {
      var $post_args, names, self = this;

      
      $post_args = $slice.call(arguments);
      names = $post_args;
      $send(self, 'attr_reader', $to_a(names));
      return $send(self, 'attr_writer', $to_a(names));
    }, -1);
    
    $def(self, '$attr', function $$attr($a) {
      var $post_args, args, self = this;

      
      $post_args = $slice.call(arguments);
      args = $post_args;
      
      if (args.length == 2 && (args[1] === true || args[1] === false)) {
        self.$warn("optional boolean argument is obsoleted", $hash2(["uplevel"], {"uplevel": 1}))

        args[1] ? self.$attr_accessor(args[0]) : self.$attr_reader(args[0]);
        return nil;
      }
    ;
      return $send(self, 'attr_reader', $to_a(args));
    }, -1);
    
    $def(self, '$attr_reader', function $$attr_reader($a) {
      var $post_args, names, self = this;

      
      $post_args = $slice.call(arguments);
      names = $post_args;
      
      $deny_frozen_access(self);

      var proto = self.$$prototype;

      for (var i = names.length - 1; i >= 0; i--) {
        var name = names[i],
            id   = '$' + name,
            ivar = $ivar(name);

        var body = $return_ivar(ivar);

        // initialize the instance variable as nil
        Opal.prop(proto, ivar, nil);

        body.$$parameters = [];
        body.$$arity = 0;

        Opal.defn(self, id, body);
      }
    ;
      return nil;
    }, -1);
    
    $def(self, '$attr_writer', function $$attr_writer($a) {
      var $post_args, names, self = this;

      
      $post_args = $slice.call(arguments);
      names = $post_args;
      
      $deny_frozen_access(self);

      var proto = self.$$prototype;

      for (var i = names.length - 1; i >= 0; i--) {
        var name = names[i],
            id   = '$' + name + '=',
            ivar = $ivar(name);

        var body = $assign_ivar(ivar)

        body.$$parameters = [['req']];
        body.$$arity = 1;

        // initialize the instance variable as nil
        Opal.prop(proto, ivar, nil);

        Opal.defn(self, id, body);
      }
    ;
      return nil;
    }, -1);
    
    $def(self, '$autoload', function $$autoload(const$, path) {
      var self = this;

      
      $deny_frozen_access(self);

      if (!$$('Opal')['$const_name?'](const$)) {
        $Kernel.$raise($$$('NameError'), "autoload must be constant name: " + (const$))
      }

      if (path == "") {
        $Kernel.$raise($$$('ArgumentError'), "empty file name")
      }

      if (!self.$$const.hasOwnProperty(const$)) {
        if (!self.$$autoload) {
          self.$$autoload = {};
        }
        Opal.const_cache_version++;
        self.$$autoload[const$] = { path: path, loaded: false, required: false, success: false, exception: false };
      }
      return nil;
    
    }, 2);
    
    $def(self, '$autoload?', function $Module_autoload$ques$7(const$) {
      var self = this;

      
      if (self.$$autoload && self.$$autoload[const$] && !self.$$autoload[const$].required && !self.$$autoload[const$].success) {
        return self.$$autoload[const$].path;
      }

      var ancestors = self.$ancestors();

      for (var i = 0, length = ancestors.length; i < length; i++) {
        if (ancestors[i].$$autoload && ancestors[i].$$autoload[const$] && !ancestors[i].$$autoload[const$].required && !ancestors[i].$$autoload[const$].success) {
          return ancestors[i].$$autoload[const$].path;
        }
      }
      return nil;
    
    }, 1);
    
    $def(self, '$class_variables', function $$class_variables() {
      var self = this;

      return Object.keys(Opal.class_variables(self));
    }, 0);
    
    $def(self, '$class_variable_get', function $$class_variable_get(name) {
      var self = this;

      
      name = $Opal['$class_variable_name!'](name);
      return Opal.class_variable_get(self, name, false);;
    }, 1);
    
    $def(self, '$class_variable_set', function $$class_variable_set(name, value) {
      var self = this;

      
      $deny_frozen_access(self);
      name = $Opal['$class_variable_name!'](name);
      return Opal.class_variable_set(self, name, value);;
    }, 2);
    
    $def(self, '$class_variable_defined?', function $Module_class_variable_defined$ques$8(name) {
      var self = this;

      
      name = $Opal['$class_variable_name!'](name);
      return Opal.class_variables(self).hasOwnProperty(name);;
    }, 1);
    
    $def(self, '$remove_class_variable', function $$remove_class_variable(name) {
      var self = this;

      
      $deny_frozen_access(self);
      name = $Opal['$class_variable_name!'](name);
      
      if (Opal.hasOwnProperty.call(self.$$cvars, name)) {
        var value = self.$$cvars[name];
        delete self.$$cvars[name];
        return value;
      } else {
        $Kernel.$raise($$$('NameError'), "cannot remove " + (name) + " for " + (self))
      }
    ;
    }, 1);
    
    $def(self, '$constants', function $$constants(inherit) {
      var self = this;

      
      if (inherit == null) inherit = true;
      return Opal.constants(self, inherit);;
    }, -1);
    $defs(self, '$constants', function $$constants(inherit) {
      var self = this;

      
      ;
      
      if (inherit == null) {
        var nesting = (self.$$nesting || []).concat($Object),
            constant, constants = {},
            i, ii;

        for(i = 0, ii = nesting.length; i < ii; i++) {
          for (constant in nesting[i].$$const) {
            constants[constant] = true;
          }
        }
        return Object.keys(constants);
      } else {
        return Opal.constants(self, inherit)
      }
    ;
    }, -1);
    $defs(self, '$nesting', function $$nesting() {
      var self = this;

      return self.$$nesting || [];
    }, 0);
    
    $def(self, '$const_defined?', function $Module_const_defined$ques$9(name, inherit) {
      var self = this;

      
      if (inherit == null) inherit = true;
      name = $$('Opal')['$const_name!'](name);
      if (!$truthy(name['$=~']($$$($Opal, 'CONST_NAME_REGEXP')))) {
        $Kernel.$raise($$$('NameError').$new("wrong constant name " + (name), name))
      };
      
      var module, modules = [self], module_constants, i, ii;

      // Add up ancestors if inherit is true
      if (inherit) {
        modules = modules.concat(Opal.ancestors(self));

        // Add Object's ancestors if it's a module – modules have no ancestors otherwise
        if (self.$$is_module) {
          modules = modules.concat([$Object]).concat(Opal.ancestors($Object));
        }
      }

      for (i = 0, ii = modules.length; i < ii; i++) {
        module = modules[i];
        if (module.$$const[name] != null) { return true; }
        if (
          module.$$autoload &&
          module.$$autoload[name] &&
          !module.$$autoload[name].required &&
          !module.$$autoload[name].success
        ) {
          return true;
        }
      }

      return false;
    ;
    }, -2);
    
    $def(self, '$const_get', function $$const_get(name, inherit) {
      var self = this;

      
      if (inherit == null) inherit = true;
      name = $$('Opal')['$const_name!'](name);
      
      if (name.indexOf('::') === 0 && name !== '::'){
        name = name.slice(2);
      }
    ;
      if ($truthy(name.indexOf('::') != -1 && name != '::')) {
        return $send(name.$split("::"), 'inject', [self], function $$10(o, c){
          
          if (o == null) o = nil;
          if (c == null) c = nil;
          return o.$const_get(c);}, 2)
      };
      if (!$truthy(name['$=~']($$$($Opal, 'CONST_NAME_REGEXP')))) {
        $Kernel.$raise($$$('NameError').$new("wrong constant name " + (name), name))
      };
      
      if (inherit) {
        return Opal.$$([self], name);
      } else {
        return Opal.const_get_local(self, name);
      }
    ;
    }, -2);
    
    $def(self, '$const_missing', function $$const_missing(name) {
      var self = this, full_const_name = nil;

      
      full_const_name = ($eqeq(self, $Object) ? (name) : ("" + (self) + "::" + (name)));
      return $Kernel.$raise($$$('NameError').$new("uninitialized constant " + (full_const_name), name));
    }, 1);
    
    $def(self, '$const_set', function $$const_set(name, value) {
      var self = this;

      
      $deny_frozen_access(self);
      name = $Opal['$const_name!'](name);
      if (($truthy(name['$!~']($$$($Opal, 'CONST_NAME_REGEXP'))) || ($truthy(name['$start_with?']("::"))))) {
        $Kernel.$raise($$$('NameError').$new("wrong constant name " + (name), name))
      };
      $const_set(self, name, value);
      return value;
    }, 2);
    
    $def(self, '$public_constant', $return_val(nil), 0);
    
    $def(self, '$define_method', function $$define_method(name, method) {
      var block = $$define_method.$$p || nil, self = this, $ret_or_1 = nil, $ret_or_2 = nil;

      $$define_method.$$p = null;
      
      ;
      ;
      
      $deny_frozen_access(self);

      if (method === undefined && block === nil)
        $Kernel.$raise($$$('ArgumentError'), "tried to create a Proc object without a block")
    ;
      block = ($truthy(($ret_or_1 = block)) ? ($ret_or_1) : ($eqeqeq($$$('Proc'), ($ret_or_2 = method)) ? (method) : ($eqeqeq($$$('Method'), $ret_or_2) ? (method.$to_proc().$$unbound) : ($eqeqeq($$$('UnboundMethod'), $ret_or_2) ? ($lambda(function $$11($a){var $post_args, args, self = $$11.$$s == null ? this : $$11.$$s, bound = nil;

        
        $post_args = $slice.call(arguments);
        args = $post_args;
        bound = method.$bind(self);
        return $send(bound, 'call', $to_a(args));}, {$$arity: -1, $$s: self})) : ($Kernel.$raise($$$('TypeError'), "wrong argument type " + (block.$class()) + " (expected Proc/Method)"))))));
      
      if (typeof(Proxy) !== 'undefined') {
        var meta = Object.create(null)

        block.$$proxy_target = block
        block = new Proxy(block, {
          apply: function(target, self, args) {
            var old_name = target.$$jsid
            target.$$jsid = name;
            try {
              return target.apply(self, args);
            } catch(e) {
              if (e === target.$$brk || e === target.$$ret) return e.$v;
              throw e;
            } finally {
              target.$$jsid = old_name
            }
          }
        })
      }

      block.$$jsid        = name;
      block.$$s           = null;
      block.$$def         = block;
      block.$$define_meth = true;

      return Opal.defn(self, '$' + name, block);
    ;
    }, -2);
    
    $def(self, '$freeze', function $$freeze() {
      var self = this;

      
      if ($truthy(self['$frozen?']())) {
        return self
      };
      
      if (!self.hasOwnProperty('$$base_module')) { $prop(self, '$$base_module', null); }

      return $freeze(self);
    ;
    }, 0);
    
    $def(self, '$remove_method', function $$remove_method($a) {
      var $post_args, names, self = this;

      
      $post_args = $slice.call(arguments);
      names = $post_args;
      
      for (var i = 0; i < names.length; i++) {
        var name = names[i];
        if (!(typeof name === "string" || name.$$is_string)) {
          self.$raise($$$('TypeError'), "" + (self.$name()) + " is not a symbol nor a string")
        }
        $deny_frozen_access(self);

        Opal.rdef(self, "$" + name);
      }
    ;
      return self;
    }, -1);
    
    $def(self, '$singleton_class?', function $Module_singleton_class$ques$12() {
      var self = this;

      return !!self.$$is_singleton;
    }, 0);
    
    $def(self, '$include', function $$include($a) {
      var $post_args, mods, self = this;

      
      $post_args = $slice.call(arguments);
      mods = $post_args;
      
      for (var i = mods.length - 1; i >= 0; i--) {
        var mod = mods[i];

        if (!mod.$$is_module) {
          $Kernel.$raise($$$('TypeError'), "wrong argument type " + ((mod).$class()) + " (expected Module)");
        }

        (mod).$append_features(self);
        (mod).$included(self);
      }
    ;
      return self;
    }, -1);
    
    $def(self, '$included_modules', function $$included_modules() {
      var self = this;

      return Opal.included_modules(self);
    }, 0);
    
    $def(self, '$include?', function $Module_include$ques$13(mod) {
      var self = this;

      
      if (!mod.$$is_module) {
        $Kernel.$raise($$$('TypeError'), "wrong argument type " + ((mod).$class()) + " (expected Module)");
      }

      var i, ii, mod2, ancestors = Opal.ancestors(self);

      for (i = 0, ii = ancestors.length; i < ii; i++) {
        mod2 = ancestors[i];
        if (mod2 === mod && mod2 !== self) {
          return true;
        }
      }

      return false;
    
    }, 1);
    
    $def(self, '$instance_method', function $$instance_method(name) {
      var self = this;

      
      var meth = self.$$prototype['$' + name];

      if (!meth || meth.$$stub) {
        $Kernel.$raise($$$('NameError').$new("undefined method `" + (name) + "' for class `" + (self.$name()) + "'", name));
      }

      return $$$('UnboundMethod').$new(self, meth.$$owner || self, meth, name);
    
    }, 1);
    
    $def(self, '$instance_methods', function $$instance_methods(include_super) {
      var self = this;

      
      if (include_super == null) include_super = true;
      
      if ($truthy(include_super)) {
        return Opal.instance_methods(self);
      } else {
        return Opal.own_instance_methods(self);
      }
    ;
    }, -1);
    
    $def(self, '$included', $return_val(nil), 0);
    
    $def(self, '$extended', $return_val(nil), 0);
    
    $def(self, '$extend_object', function $$extend_object(object) {
      
      
      $deny_frozen_access(object);
      return nil;
    }, 1);
    
    $def(self, '$method_added', function $$method_added($a) {
      var $post_args, $rest_arg;

      
      $post_args = $slice.call(arguments);
      $rest_arg = $post_args;
      return nil;
    }, -1);
    
    $def(self, '$method_removed', function $$method_removed($a) {
      var $post_args, $rest_arg;

      
      $post_args = $slice.call(arguments);
      $rest_arg = $post_args;
      return nil;
    }, -1);
    
    $def(self, '$method_undefined', function $$method_undefined($a) {
      var $post_args, $rest_arg;

      
      $post_args = $slice.call(arguments);
      $rest_arg = $post_args;
      return nil;
    }, -1);
    
    $def(self, '$module_eval', function $$module_eval($a) {
      var block = $$module_eval.$$p || nil, $post_args, args, $b, self = this, string = nil, file = nil, _lineno = nil, default_eval_options = nil, $ret_or_1 = nil, compiling_options = nil, compiled = nil;

      $$module_eval.$$p = null;
      
      ;
      $post_args = $slice.call(arguments);
      args = $post_args;
      if (($truthy(block['$nil?']()) && ($truthy(!!Opal.compile)))) {
        
        if (!$truthy($range(1, 3, false)['$cover?'](args.$size()))) {
          $Kernel.$raise($$$('ArgumentError'), "wrong number of arguments (0 for 1..3)")
        };
        $b = [].concat($to_a(args)), (string = ($b[0] == null ? nil : $b[0])), (file = ($b[1] == null ? nil : $b[1])), (_lineno = ($b[2] == null ? nil : $b[2])), $b;
        default_eval_options = $hash2(["file", "eval"], {"file": ($truthy(($ret_or_1 = file)) ? ($ret_or_1) : ("(eval)")), "eval": true});
        compiling_options = Opal.hash({ arity_check: false }).$merge(default_eval_options);
        compiled = $Opal.$compile(string, compiling_options);
        block = $send($Kernel, 'proc', [], function $$14(){var self = $$14.$$s == null ? this : $$14.$$s;

          return new Function("Opal,self", "return " + compiled)(Opal, self);}, {$$arity: 0, $$s: self});
      } else if ($truthy(args['$any?']())) {
        $Kernel.$raise($$$('ArgumentError'), "" + ("wrong number of arguments (" + (args.$size()) + " for 0)") + "\n\n  NOTE:If you want to enable passing a String argument please add \"require 'opal-parser'\" to your script\n")
      };
      
      var old = block.$$s,
          result;

      block.$$s = null;
      result = block.apply(self, [self]);
      block.$$s = old;

      return result;
    ;
    }, -1);
    
    $def(self, '$module_exec', function $$module_exec($a) {
      var block = $$module_exec.$$p || nil, $post_args, args, self = this;

      $$module_exec.$$p = null;
      
      ;
      $post_args = $slice.call(arguments);
      args = $post_args;
      
      if (block === nil) {
        $Kernel.$raise($$$('LocalJumpError'), "no block given")
      }

      var block_self = block.$$s, result;

      block.$$s = null;
      result = block.apply(self, args);
      block.$$s = block_self;

      return result;
    ;
    }, -1);
    
    $def(self, '$method_defined?', function $Module_method_defined$ques$15(method) {
      var self = this;

      
      var body = self.$$prototype['$' + method];
      return (!!body) && !body.$$stub;
    
    }, 1);
    
    $def(self, '$module_function', function $$module_function($a) {
      var $post_args, methods, self = this;

      
      $post_args = $slice.call(arguments);
      methods = $post_args;
      
      $deny_frozen_access(self);

      if (methods.length === 0) {
        self.$$module_function = true;
        return nil;
      }
      else {
        for (var i = 0, length = methods.length; i < length; i++) {
          var meth = methods[i],
              id   = '$' + meth,
              func = self.$$prototype[id];

          Opal.defs(self, id, func);
        }
        return methods.length === 1 ? methods[0] : methods;
      }

      return self;
    ;
    }, -1);
    
    $def(self, '$name', function $$name() {
      var self = this;

      
      if (self.$$full_name) {
        return self.$$full_name;
      }

      var result = [], base = self;

      while (base) {
        // Give up if any of the ancestors is unnamed
        if (base.$$name === nil || base.$$name == null) return nil;

        result.unshift(base.$$name);

        base = base.$$base_module;

        if (base === $Object) {
          break;
        }
      }

      if (result.length === 0) {
        return nil;
      }

      return self.$$full_name = result.join('::');
    
    }, 0);
    
    $def(self, '$prepend', function $$prepend($a) {
      var $post_args, mods, self = this;

      
      $post_args = $slice.call(arguments);
      mods = $post_args;
      
      if (mods.length === 0) {
        $Kernel.$raise($$$('ArgumentError'), "wrong number of arguments (given 0, expected 1+)")
      }

      for (var i = mods.length - 1; i >= 0; i--) {
        var mod = mods[i];

        if (!mod.$$is_module) {
          $Kernel.$raise($$$('TypeError'), "wrong argument type " + ((mod).$class()) + " (expected Module)");
        }

        (mod).$prepend_features(self);
        (mod).$prepended(self);
      }
    ;
      return self;
    }, -1);
    
    $def(self, '$prepend_features', function $$prepend_features(prepender) {
      var self = this;

      
      
      $deny_frozen_access(prepender);

      if (!self.$$is_module) {
        $Kernel.$raise($$$('TypeError'), "wrong argument type " + (self.$class()) + " (expected Module)");
      }

      Opal.prepend_features(self, prepender)
    ;
      return self;
    }, 1);
    
    $def(self, '$prepended', $return_val(nil), 0);
    
    $def(self, '$remove_const', function $$remove_const(name) {
      var self = this;

      
      $deny_frozen_access(self);
      return Opal.const_remove(self, name);;
    }, 1);
    
    $def(self, '$to_s', function $$to_s() {
      var self = this, $ret_or_1 = nil;

      if ($truthy(($ret_or_1 = Opal.Module.$name.call(self)))) {
        return $ret_or_1
      } else {
        return "#<" + (self.$$is_module ? 'Module' : 'Class') + ":0x" + (self.$__id__().$to_s(16)) + ">"
      }
    }, 0);
    
    $def(self, '$undef_method', function $$undef_method($a) {
      var $post_args, names, self = this;

      
      $post_args = $slice.call(arguments);
      names = $post_args;
      
      for (var i = 0; i < names.length; i++) {
        var name = names[i];
        if (!(typeof name === "string" || name.$$is_string)) {
          self.$raise($$$('TypeError'), "" + (self.$name()) + " is not a symbol nor a string")
        }
        $deny_frozen_access(self);

        Opal.udef(self, "$" + names[i]);
      }
    ;
      return self;
    }, -1);
    
    $def(self, '$instance_variables', function $$instance_variables() {
      var self = this, consts = nil;

      
      consts = (Opal.Module.$$nesting = $nesting, self.$constants());
      
      var result = [];

      for (var name in self) {
        if (self.hasOwnProperty(name) && name.charAt(0) !== '$' && name !== 'constructor' && !consts['$include?'](name)) {
          result.push('@' + name);
        }
      }

      return result;
    ;
    }, 0);
    
    $def(self, '$dup', function $$dup() {
      var $yield = $$dup.$$p || nil, self = this, copy = nil;

      $$dup.$$p = null;
      
      copy = $send2(self, $find_super(self, 'dup', $$dup, false, true), 'dup', [], $yield);
      copy.$copy_class_variables(self);
      copy.$copy_constants(self);
      return copy;
    }, 0);
    
    $def(self, '$copy_class_variables', function $$copy_class_variables(other) {
      var self = this;

      
      for (var name in other.$$cvars) {
        self.$$cvars[name] = other.$$cvars[name];
      }
    
    }, 1);
    
    $def(self, '$copy_constants', function $$copy_constants(other) {
      var self = this;

      
      var name, other_constants = other.$$const;

      for (name in other_constants) {
        $const_set(self, name, other_constants[name]);
      }
    
    }, 1);
    
    $def(self, '$refine', function $$refine(klass) {
      var block = $$refine.$$p || nil, $a, self = this, refinement_module = nil, m = nil, klass_id = nil;

      $$refine.$$p = null;
      
      ;
      $a = [self, nil, nil], (refinement_module = $a[0]), (m = $a[1]), (klass_id = $a[2]), $a;
      
      klass_id = Opal.id(klass);
      if (typeof self.$$refine_modules === "undefined") {
        self.$$refine_modules = {};
      }
      if (typeof self.$$refine_modules[klass_id] === "undefined") {
        m = self.$$refine_modules[klass_id] = $$$('Refinement').$new();
      }
      else {
        m = self.$$refine_modules[klass_id];
      }
      m.refinement_module = refinement_module
      m.refined_class = klass
    ;
      $send(m, 'class_exec', [], block.$to_proc());
      return m;
    }, 1);
    
    $def(self, '$using', function $$using(mod) {
      
      return $Kernel.$raise("Module#using is not permitted in methods")
    }, 1);
    $alias(self, "class_eval", "module_eval");
    $alias(self, "class_exec", "module_exec");
    return $alias(self, "inspect", "to_s");
  })('::', null, $nesting);
  return (function($base, $super) {
    var self = $klass($base, $super, 'Refinement');

    var $proto = self.$$prototype;

    $proto.refinement_module = $proto.refined_class = nil;
    return $def(self, '$inspect', function $$inspect() {
      var $yield = $$inspect.$$p || nil, self = this;

      $$inspect.$$p = null;
      if ($truthy(self.refinement_module)) {
        return "#<refinement:" + (self.refined_class.$inspect()) + "@" + (self.refinement_module.$inspect()) + ">"
      } else {
        return $send2(self, $find_super(self, 'inspect', $$inspect, false, true), 'inspect', [], $yield)
      }
    }, 0)
  })('::', $Module);
};

Opal.modules["corelib/kernel"] = function(Opal) {/* Generated by Opal 1.6.0 */
  "use strict";
  var $truthy = Opal.truthy, $coerce_to = Opal.coerce_to, $respond_to = Opal.respond_to, $Opal = Opal.Opal, $deny_frozen_access = Opal.deny_frozen_access, $freeze = Opal.freeze, $freeze_props = Opal.freeze_props, $module = Opal.module, $return_val = Opal.return_val, $def = Opal.def, $Kernel = Opal.Kernel, $gvars = Opal.gvars, $slice = Opal.slice, $send = Opal.send, $to_a = Opal.to_a, $ensure_kwargs = Opal.ensure_kwargs, $eqeq = Opal.eqeq, $hash2 = Opal.hash2, $rb_plus = Opal.rb_plus, $eqeqeq = Opal.eqeqeq, $return_self = Opal.return_self, $rb_le = Opal.rb_le, $extract_kwargs = Opal.extract_kwargs, $rb_lt = Opal.rb_lt, $Object = Opal.Object, $alias = Opal.alias, $klass = Opal.klass, $nesting = [], nil = Opal.nil, $$$ = Opal.$$$;

  Opal.add_stubs('!,=~,==,object_id,raise,new,class,coerce_to?,<<,map,caller,nil?,allocate,copy_instance_variables,copy_singleton_methods,initialize_clone,frozen?,freeze,initialize_copy,define_method,singleton_class,to_proc,initialize_dup,for,empty?,pop,call,append_features,extend_object,extended,gets,__id__,include?,each,instance_variables,instance_variable_get,inspect,+,to_s,instance_variable_name!,respond_to?,to_int,coerce_to!,Integer,===,enum_for,result,any?,print,format,puts,<=,length,[],readline,<,first,split,to_str,exception,backtrace,rand,respond_to_missing?,pristine,try_convert!,expand_path,join,start_with?,new_seed,srand,tag,value,open,is_a?,__send__,yield_self,include');
  
  (function($base, $parent_nesting) {
    var self = $module($base, 'Kernel');

    var $nesting = [self].concat($parent_nesting), $$ = Opal.$r($nesting);

    
    
    $def(self, '$=~', $return_val(false), 0);
    
    $def(self, '$!~', function $Kernel_$excl_tilde$1(obj) {
      var self = this;

      return self['$=~'](obj)['$!']()
    }, 1);
    
    $def(self, '$===', function $Kernel_$eq_eq_eq$2(other) {
      var self = this, $ret_or_1 = nil;

      if ($truthy(($ret_or_1 = self.$object_id()['$=='](other.$object_id())))) {
        return $ret_or_1
      } else {
        return self['$=='](other)
      }
    }, 1);
    
    $def(self, '$<=>', function $Kernel_$lt_eq_gt$3(other) {
      var self = this;

      
      // set guard for infinite recursion
      self.$$comparable = true;

      var x = self['$=='](other);

      if (x && x !== nil) {
        return 0;
      }

      return nil;
    
    }, 1);
    
    $def(self, '$method', function $$method(name) {
      var self = this;

      
      var meth = self['$' + name];

      if (!meth || meth.$$stub) {
        $Kernel.$raise($$$('NameError').$new("undefined method `" + (name) + "' for class `" + (self.$class()) + "'", name));
      }

      return $$$('Method').$new(self, meth.$$owner || self.$class(), meth, name);
    
    }, 1);
    
    $def(self, '$methods', function $$methods(all) {
      var self = this;

      
      if (all == null) all = true;
      
      if ($truthy(all)) {
        return Opal.methods(self);
      } else {
        return Opal.own_methods(self);
      }
    ;
    }, -1);
    
    $def(self, '$public_methods', function $$public_methods(all) {
      var self = this;

      
      if (all == null) all = true;
      
      if ($truthy(all)) {
        return Opal.methods(self);
      } else {
        return Opal.receiver_methods(self);
      }
    ;
    }, -1);
    
    $def(self, '$Array', function $$Array(object) {
      
      
      var coerced;

      if (object === nil) {
        return [];
      }

      if (object.$$is_array) {
        return object;
      }

      coerced = $Opal['$coerce_to?'](object, $$$('Array'), "to_ary");
      if (coerced !== nil) { return coerced; }

      coerced = $Opal['$coerce_to?'](object, $$$('Array'), "to_a");
      if (coerced !== nil) { return coerced; }

      return [object];
    
    }, 1);
    
    $def(self, '$at_exit', function $$at_exit() {
      var block = $$at_exit.$$p || nil, $ret_or_1 = nil;
      if ($gvars.__at_exit__ == null) $gvars.__at_exit__ = nil;

      $$at_exit.$$p = null;
      
      ;
      $gvars.__at_exit__ = ($truthy(($ret_or_1 = $gvars.__at_exit__)) ? ($ret_or_1) : ([]));
      $gvars.__at_exit__['$<<'](block);
      return block;
    }, 0);
    
    $def(self, '$caller', function $$caller(start, length) {
      
      
      if (start == null) start = 1;
      if (length == null) length = nil;
      
      var stack, result;

      stack = new Error().$backtrace();
      result = [];

      for (var i = start + 1, ii = stack.length; i < ii; i++) {
        if (!stack[i].match(/runtime\.js/)) {
          result.push(stack[i]);
        }
      }
      if (length != nil) result = result.slice(0, length);
      return result;
    ;
    }, -1);
    
    $def(self, '$caller_locations', function $$caller_locations($a) {
      var $post_args, args, self = this;

      
      $post_args = $slice.call(arguments);
      args = $post_args;
      return $send($send(self, 'caller', $to_a(args)), 'map', [], function $$4(loc){
        
        if (loc == null) loc = nil;
        return $$$($$$($$$('Thread'), 'Backtrace'), 'Location').$new(loc);}, 1);
    }, -1);
    
    $def(self, '$class', function $Kernel_class$5() {
      var self = this;

      return self.$$class;
    }, 0);
    
    $def(self, '$copy_instance_variables', function $$copy_instance_variables(other) {
      var self = this;

      
      var keys = Object.keys(other), i, ii, name;
      for (i = 0, ii = keys.length; i < ii; i++) {
        name = keys[i];
        if (name.charAt(0) !== '$' && other.hasOwnProperty(name)) {
          self[name] = other[name];
        }
      }
    
    }, 1);
    
    $def(self, '$copy_singleton_methods', function $$copy_singleton_methods(other) {
      var self = this;

      
      var i, name, names, length;

      if (other.hasOwnProperty('$$meta') && other.$$meta !== null) {
        var other_singleton_class = Opal.get_singleton_class(other);
        var self_singleton_class = Opal.get_singleton_class(self);
        names = Object.getOwnPropertyNames(other_singleton_class.$$prototype);

        for (i = 0, length = names.length; i < length; i++) {
          name = names[i];
          if (Opal.is_method(name)) {
            self_singleton_class.$$prototype[name] = other_singleton_class.$$prototype[name];
          }
        }

        self_singleton_class.$$const = Object.assign({}, other_singleton_class.$$const);
        Object.setPrototypeOf(
          self_singleton_class.$$prototype,
          Object.getPrototypeOf(other_singleton_class.$$prototype)
        );
      }

      for (i = 0, names = Object.getOwnPropertyNames(other), length = names.length; i < length; i++) {
        name = names[i];
        if (name.charAt(0) === '$' && name.charAt(1) !== '$' && other.hasOwnProperty(name)) {
          self[name] = other[name];
        }
      }
    
    }, 1);
    
    $def(self, '$clone', function $$clone($kwargs) {
      var freeze, self = this, copy = nil;

      
      $kwargs = $ensure_kwargs($kwargs);
      
      freeze = $kwargs.$$smap["freeze"];if (freeze == null) freeze = nil;
      if (!(($truthy(freeze['$nil?']()) || ($eqeq(freeze, true))) || ($eqeq(freeze, false)))) {
        self.$raise($$('ArgumentError'), "unexpected value for freeze: " + (freeze.$class()))
      };
      copy = self.$class().$allocate();
      copy.$copy_instance_variables(self);
      copy.$copy_singleton_methods(self);
      copy.$initialize_clone(self, $hash2(["freeze"], {"freeze": freeze}));
      if (($eqeq(freeze, true) || (($truthy(freeze['$nil?']()) && ($truthy(self['$frozen?']())))))) {
        copy.$freeze()
      };
      return copy;
    }, -1);
    
    $def(self, '$initialize_clone', function $$initialize_clone(other, $kwargs) {
      var freeze, self = this;

      
      $kwargs = $ensure_kwargs($kwargs);
      
      freeze = $kwargs.$$smap["freeze"];if (freeze == null) freeze = nil;
      self.$initialize_copy(other);
      return self;
    }, -2);
    
    $def(self, '$define_singleton_method', function $$define_singleton_method(name, method) {
      var block = $$define_singleton_method.$$p || nil, self = this;

      $$define_singleton_method.$$p = null;
      
      ;
      ;
      return $send(self.$singleton_class(), 'define_method', [name, method], block.$to_proc());
    }, -2);
    
    $def(self, '$dup', function $$dup() {
      var self = this, copy = nil;

      
      copy = self.$class().$allocate();
      copy.$copy_instance_variables(self);
      copy.$initialize_dup(self);
      return copy;
    }, 0);
    
    $def(self, '$initialize_dup', function $$initialize_dup(other) {
      var self = this;

      return self.$initialize_copy(other)
    }, 1);
    
    $def(self, '$enum_for', function $$enum_for($a, $b) {
      var block = $$enum_for.$$p || nil, $post_args, method, args, self = this;

      $$enum_for.$$p = null;
      
      ;
      $post_args = $slice.call(arguments);
      
      if ($post_args.length > 0) method = $post_args.shift();if (method == null) method = "each";
      args = $post_args;
      return $send($$$('Enumerator'), 'for', [self, method].concat($to_a(args)), block.$to_proc());
    }, -1);
    
    $def(self, '$equal?', function $Kernel_equal$ques$6(other) {
      var self = this;

      return self === other;
    }, 1);
    
    $def(self, '$exit', function $$exit(status) {
      var $ret_or_1 = nil, block = nil;
      if ($gvars.__at_exit__ == null) $gvars.__at_exit__ = nil;

      
      if (status == null) status = true;
      $gvars.__at_exit__ = ($truthy(($ret_or_1 = $gvars.__at_exit__)) ? ($ret_or_1) : ([]));
      while (!($truthy($gvars.__at_exit__['$empty?']()))) {
      
        block = $gvars.__at_exit__.$pop();
        block.$call();
      };
      
      if (status.$$is_boolean) {
        status = status ? 0 : 1;
      } else {
        status = $coerce_to(status, $$$('Integer'), 'to_int')
      }

      Opal.exit(status);
    ;
      return nil;
    }, -1);
    
    $def(self, '$extend', function $$extend($a) {
      var $post_args, mods, self = this;

      
      $post_args = $slice.call(arguments);
      mods = $post_args;
      
      if (mods.length == 0) {
        self.$raise($$$('ArgumentError'), "wrong number of arguments (given 0, expected 1+)")
      }

      $deny_frozen_access(self);

      var singleton = self.$singleton_class();

      for (var i = mods.length - 1; i >= 0; i--) {
        var mod = mods[i];

        if (!mod.$$is_module) {
          $Kernel.$raise($$$('TypeError'), "wrong argument type " + ((mod).$class()) + " (expected Module)");
        }

        (mod).$append_features(singleton);
        (mod).$extend_object(self);
        (mod).$extended(self);
      }
    ;
      return self;
    }, -1);
    
    $def(self, '$freeze', function $$freeze() {
      var self = this;

      
      if ($truthy(self['$frozen?']())) {
        return self
      };
      
      if (typeof(self) === "object") {
        $freeze_props(self);
        return $freeze(self);
      }
      return self;
    ;
    }, 0);
    
    $def(self, '$frozen?', function $Kernel_frozen$ques$7() {
      var self = this;

      
      switch (typeof(self)) {
      case "string":
      case "symbol":
      case "number":
      case "boolean":
        return true;
      case "object":
        return (self.$$frozen || false);
      default:
        return false;
      }
    
    }, 0);
    
    $def(self, '$gets', function $$gets($a) {
      var $post_args, args;
      if ($gvars.stdin == null) $gvars.stdin = nil;

      
      $post_args = $slice.call(arguments);
      args = $post_args;
      return $send($gvars.stdin, 'gets', $to_a(args));
    }, -1);
    
    $def(self, '$hash', function $$hash() {
      var self = this;

      return self.$__id__()
    }, 0);
    
    $def(self, '$initialize_copy', $return_val(nil), 0);
    var inspect_stack = [];
    
    $def(self, '$inspect', function $$inspect() {
      var self = this, ivs = nil, id = nil, pushed = nil, e = nil;

      return (function() { try {
      try {
        
        ivs = "";
        id = self.$__id__();
        if ($truthy((inspect_stack)['$include?'](id))) {
          ivs = " ..."
        } else {
          
          (inspect_stack)['$<<'](id);
          pushed = true;
          $send(self.$instance_variables(), 'each', [], function $$8(i){var self = $$8.$$s == null ? this : $$8.$$s, ivar = nil, inspect = nil;

            
            if (i == null) i = nil;
            ivar = self.$instance_variable_get(i);
            inspect = $$('Opal').$inspect(ivar);
            return (ivs = $rb_plus(ivs, " " + (i) + "=" + (inspect)));}, {$$arity: 1, $$s: self});
        };
        return "#<" + (self.$class()) + ":0x" + (id.$to_s(16)) + (ivs) + ">";
      } catch ($err) {
        if (Opal.rescue($err, [$$('StandardError')])) {(e = $err)
          try {
            return "#<" + (self.$class()) + ":0x" + (id.$to_s(16)) + ">"
          } finally { Opal.pop_exception(); }
        } else { throw $err; }
      }
      } finally {
        ($truthy(pushed) ? ((inspect_stack).$pop()) : nil)
      }; })()
    }, 0);
    
    $def(self, '$instance_of?', function $Kernel_instance_of$ques$9(klass) {
      var self = this;

      
      if (!klass.$$is_class && !klass.$$is_module) {
        $Kernel.$raise($$$('TypeError'), "class or module required");
      }

      return self.$$class === klass;
    
    }, 1);
    
    $def(self, '$instance_variable_defined?', function $Kernel_instance_variable_defined$ques$10(name) {
      var self = this;

      
      name = $Opal['$instance_variable_name!'](name);
      return Opal.hasOwnProperty.call(self, name.substr(1));;
    }, 1);
    
    $def(self, '$instance_variable_get', function $$instance_variable_get(name) {
      var self = this;

      
      name = $Opal['$instance_variable_name!'](name);
      
      var ivar = self[Opal.ivar(name.substr(1))];

      return ivar == null ? nil : ivar;
    ;
    }, 1);
    
    $def(self, '$instance_variable_set', function $$instance_variable_set(name, value) {
      var self = this;

      
      $deny_frozen_access(self);
      name = $Opal['$instance_variable_name!'](name);
      return self[Opal.ivar(name.substr(1))] = value;;
    }, 2);
    
    $def(self, '$remove_instance_variable', function $$remove_instance_variable(name) {
      var self = this;

      
      name = $Opal['$instance_variable_name!'](name);
      
      var key = Opal.ivar(name.substr(1)),
          val;
      if (self.hasOwnProperty(key)) {
        val = self[key];
        delete self[key];
        return val;
      }
    ;
      return $Kernel.$raise($$$('NameError'), "instance variable " + (name) + " not defined");
    }, 1);
    
    $def(self, '$instance_variables', function $$instance_variables() {
      var self = this;

      
      var result = [], ivar;

      for (var name in self) {
        if (self.hasOwnProperty(name) && name.charAt(0) !== '$') {
          if (name.substr(-1) === '$') {
            ivar = name.slice(0, name.length - 1);
          } else {
            ivar = name;
          }
          result.push('@' + ivar);
        }
      }

      return result;
    
    }, 0);
    
    $def(self, '$Integer', function $$Integer(value, base) {
      
      
      ;
      
      var i, str, base_digits;

      if (!value.$$is_string) {
        if (base !== undefined) {
          $Kernel.$raise($$$('ArgumentError'), "base specified for non string value")
        }
        if (value === nil) {
          $Kernel.$raise($$$('TypeError'), "can't convert nil into Integer")
        }
        if (value.$$is_number) {
          if (value === Infinity || value === -Infinity || isNaN(value)) {
            $Kernel.$raise($$$('FloatDomainError'), value)
          }
          return Math.floor(value);
        }
        if (value['$respond_to?']("to_int")) {
          i = value.$to_int();
          if (i !== nil) {
            return i;
          }
        }
        return $Opal['$coerce_to!'](value, $$$('Integer'), "to_i");
      }

      if (value === "0") {
        return 0;
      }

      if (base === undefined) {
        base = 0;
      } else {
        base = $coerce_to(base, $$$('Integer'), 'to_int');
        if (base === 1 || base < 0 || base > 36) {
          $Kernel.$raise($$$('ArgumentError'), "invalid radix " + (base))
        }
      }

      str = value.toLowerCase();

      str = str.replace(/(\d)_(?=\d)/g, '$1');

      str = str.replace(/^(\s*[+-]?)(0[bodx]?)/, function (_, head, flag) {
        switch (flag) {
        case '0b':
          if (base === 0 || base === 2) {
            base = 2;
            return head;
          }
          // no-break
        case '0':
        case '0o':
          if (base === 0 || base === 8) {
            base = 8;
            return head;
          }
          // no-break
        case '0d':
          if (base === 0 || base === 10) {
            base = 10;
            return head;
          }
          // no-break
        case '0x':
          if (base === 0 || base === 16) {
            base = 16;
            return head;
          }
          // no-break
        }
        $Kernel.$raise($$$('ArgumentError'), "invalid value for Integer(): \"" + (value) + "\"")
      });

      base = (base === 0 ? 10 : base);

      base_digits = '0-' + (base <= 10 ? base - 1 : '9a-' + String.fromCharCode(97 + (base - 11)));

      if (!(new RegExp('^\\s*[+-]?[' + base_digits + ']+\\s*$')).test(str)) {
        $Kernel.$raise($$$('ArgumentError'), "invalid value for Integer(): \"" + (value) + "\"")
      }

      i = parseInt(str, base);

      if (isNaN(i)) {
        $Kernel.$raise($$$('ArgumentError'), "invalid value for Integer(): \"" + (value) + "\"")
      }

      return i;
    ;
    }, -2);
    
    $def(self, '$Float', function $$Float(value) {
      
      
      var str;

      if (value === nil) {
        $Kernel.$raise($$$('TypeError'), "can't convert nil into Float")
      }

      if (value.$$is_string) {
        str = value.toString();

        str = str.replace(/(\d)_(?=\d)/g, '$1');

        //Special case for hex strings only:
        if (/^\s*[-+]?0[xX][0-9a-fA-F]+\s*$/.test(str)) {
          return $Kernel.$Integer(str);
        }

        if (!/^\s*[-+]?[0-9]*\.?[0-9]+([eE][-+]?[0-9]+)?\s*$/.test(str)) {
          $Kernel.$raise($$$('ArgumentError'), "invalid value for Float(): \"" + (value) + "\"")
        }

        return parseFloat(str);
      }

      return $Opal['$coerce_to!'](value, $$$('Float'), "to_f");
    
    }, 1);
    
    $def(self, '$Hash', function $$Hash(arg) {
      
      
      if (($truthy(arg['$nil?']()) || ($eqeq(arg, [])))) {
        return $hash2([], {})
      };
      if ($eqeqeq($$$('Hash'), arg)) {
        return arg
      };
      return $Opal['$coerce_to!'](arg, $$$('Hash'), "to_hash");
    }, 1);
    
    $def(self, '$is_a?', function $Kernel_is_a$ques$11(klass) {
      var self = this;

      
      if (!klass.$$is_class && !klass.$$is_module) {
        $Kernel.$raise($$$('TypeError'), "class or module required");
      }

      return Opal.is_a(self, klass);
    
    }, 1);
    
    $def(self, '$itself', $return_self, 0);
    
    $def(self, '$lambda', function $$lambda() {
      var block = $$lambda.$$p || nil;

      $$lambda.$$p = null;
      
      ;
      return Opal.lambda(block);;
    }, 0);
    
    $def(self, '$load', function $$load(file) {
      
      
      file = $Opal['$coerce_to!'](file, $$$('String'), "to_str");
      return Opal.load(file);
    }, 1);
    
    $def(self, '$loop', function $$loop() {
      var $yield = $$loop.$$p || nil, self = this, e = nil;

      $$loop.$$p = null;
      
      if (!($yield !== nil)) {
        return $send(self, 'enum_for', ["loop"], function $$12(){
          return $$$($$$('Float'), 'INFINITY')}, 0)
      };
      while ($truthy(true)) {
      
        try {
          Opal.yieldX($yield, [])
        } catch ($err) {
          if (Opal.rescue($err, [$$$('StopIteration')])) {(e = $err)
            try {
              return e.$result()
            } finally { Opal.pop_exception(); }
          } else { throw $err; }
        };
      };
      return self;
    }, 0);
    
    $def(self, '$nil?', $return_val(false), 0);
    
    $def(self, '$printf', function $$printf($a) {
      var $post_args, args, self = this;

      
      $post_args = $slice.call(arguments);
      args = $post_args;
      if ($truthy(args['$any?']())) {
        self.$print($send(self, 'format', $to_a(args)))
      };
      return nil;
    }, -1);
    
    $def(self, '$proc', function $$proc() {
      var block = $$proc.$$p || nil;

      $$proc.$$p = null;
      
      ;
      if (!$truthy(block)) {
        $Kernel.$raise($$$('ArgumentError'), "tried to create Proc object without a block")
      };
      block.$$is_lambda = false;
      return block;
    }, 0);
    
    $def(self, '$puts', function $$puts($a) {
      var $post_args, strs;
      if ($gvars.stdout == null) $gvars.stdout = nil;

      
      $post_args = $slice.call(arguments);
      strs = $post_args;
      return $send($gvars.stdout, 'puts', $to_a(strs));
    }, -1);
    
    $def(self, '$p', function $$p($a) {
      var $post_args, args;

      
      $post_args = $slice.call(arguments);
      args = $post_args;
      $send(args, 'each', [], function $$13(obj){        if ($gvars.stdout == null) $gvars.stdout = nil;

        
        if (obj == null) obj = nil;
        return $gvars.stdout.$puts(obj.$inspect());}, 1);
      if ($truthy($rb_le(args.$length(), 1))) {
        return args['$[]'](0)
      } else {
        return args
      };
    }, -1);
    
    $def(self, '$print', function $$print($a) {
      var $post_args, strs;
      if ($gvars.stdout == null) $gvars.stdout = nil;

      
      $post_args = $slice.call(arguments);
      strs = $post_args;
      return $send($gvars.stdout, 'print', $to_a(strs));
    }, -1);
    
    $def(self, '$readline', function $$readline($a) {
      var $post_args, args;
      if ($gvars.stdin == null) $gvars.stdin = nil;

      
      $post_args = $slice.call(arguments);
      args = $post_args;
      return $send($gvars.stdin, 'readline', $to_a(args));
    }, -1);
    
    $def(self, '$warn', function $$warn($a, $b) {
      var $post_args, $kwargs, strs, uplevel, $c, $d, self = this, location = nil;
      if ($gvars.VERBOSE == null) $gvars.VERBOSE = nil;
      if ($gvars.stderr == null) $gvars.stderr = nil;

      
      $post_args = $slice.call(arguments);
      $kwargs = $extract_kwargs($post_args);
      $kwargs = $ensure_kwargs($kwargs);
      strs = $post_args;
      
      uplevel = $kwargs.$$smap["uplevel"];if (uplevel == null) uplevel = nil;
      if ($truthy(uplevel)) {
        
        uplevel = $Opal['$coerce_to!'](uplevel, $$$('Integer'), "to_str");
        if ($truthy($rb_lt(uplevel, 0))) {
          $Kernel.$raise($$$('ArgumentError'), "negative level (" + (uplevel) + ")")
        };
        location = ($c = ($d = self.$caller($rb_plus(uplevel, 1), 1).$first(), ($d === nil || $d == null) ? nil : $d.$split(":in `")), ($c === nil || $c == null) ? nil : $c.$first());
        if ($truthy(location)) {
          location = "" + (location) + ": "
        };
        strs = $send(strs, 'map', [], function $$14(s){
          
          if (s == null) s = nil;
          return "" + (location) + "warning: " + (s);}, 1);
      };
      if (($truthy($gvars.VERBOSE['$nil?']()) || ($truthy(strs['$empty?']())))) {
        return nil
      } else {
        return $send($gvars.stderr, 'puts', $to_a(strs))
      };
    }, -1);
    
    $def(self, '$raise', function $$raise(exception, string, backtrace) {
            if ($gvars["!"] == null) $gvars["!"] = nil;
      if ($gvars["@"] == null) $gvars["@"] = nil;

      
      ;
      if (string == null) string = nil;
      if (backtrace == null) backtrace = nil;
      
      if (exception == null && $gvars["!"] !== nil) {
        throw $gvars["!"];
      }
      if (exception == null) {
        exception = $$$('RuntimeError').$new("");
      }
      else if ($respond_to(exception, '$to_str')) {
        exception = $$$('RuntimeError').$new(exception.$to_str());
      }
      // using respond_to? and not an undefined check to avoid method_missing matching as true
      else if (exception.$$is_class && $respond_to(exception, '$exception')) {
        exception = exception.$exception(string);
      }
      else if (exception.$$is_exception) {
        // exception is fine
      }
      else {
        exception = $$$('TypeError').$new("exception class/object expected");
      }

      if (backtrace !== nil) {
        exception.$set_backtrace(backtrace);
      }

      if ($gvars["!"] !== nil) {
        Opal.exceptions.push($gvars["!"]);
      }

      $gvars["!"] = exception;
      $gvars["@"] = (exception).$backtrace();

      throw exception;
    ;
    }, -1);
    
    $def(self, '$rand', function $$rand(max) {
      
      
      ;
      
      if (max === undefined) {
        return $$$($$$('Random'), 'DEFAULT').$rand();
      }

      if (max.$$is_number) {
        if (max < 0) {
          max = Math.abs(max);
        }

        if (max % 1 !== 0) {
          max = max.$to_i();
        }

        if (max === 0) {
          max = undefined;
        }
      }
    ;
      return $$$($$$('Random'), 'DEFAULT').$rand(max);
    }, -1);
    
    $def(self, '$respond_to?', function $Kernel_respond_to$ques$15(name, include_all) {
      var self = this;

      
      if (include_all == null) include_all = false;
      
      var body = self['$' + name];

      if (typeof(body) === "function" && !body.$$stub) {
        return true;
      }

      if (self['$respond_to_missing?'].$$pristine === true) {
        return false;
      } else {
        return self['$respond_to_missing?'](name, include_all);
      }
    ;
    }, -2);
    
    $def(self, '$respond_to_missing?', function $Kernel_respond_to_missing$ques$16(method_name, include_all) {
      
      
      if (include_all == null) include_all = false;
      return false;
    }, -2);
    $Opal.$pristine(self, "respond_to?", "respond_to_missing?");
    
    $def(self, '$require', function $$require(file) {
      
      
      // As Object.require refers to Kernel.require once Kernel has been loaded the String
      // class may not be available yet, the coercion requires both  String and Array to be loaded.
      if (typeof file !== 'string' && Opal.String && Opal.Array) {
        (file = $Opal['$coerce_to!'](file, $$$('String'), "to_str"))
      }
      return Opal.require(file)
    
    }, 1);
    
    $def(self, '$require_relative', function $$require_relative(file) {
      
      
      $Opal['$try_convert!'](file, $$$('String'), "to_str");
      file = $$$('File').$expand_path($$$('File').$join(Opal.current_file, "..", file));
      return Opal.require(file);
    }, 1);
    
    $def(self, '$require_tree', function $$require_tree(path, $kwargs) {
      var autoload;

      
      $kwargs = $ensure_kwargs($kwargs);
      
      autoload = $kwargs.$$smap["autoload"];if (autoload == null) autoload = false;
      
      var result = [];

      path = $$$('File').$expand_path(path)
      path = Opal.normalize(path);
      if (path === '.') path = '';
      for (var name in Opal.modules) {
        if ((name)['$start_with?'](path)) {
          if(!autoload) {
            result.push([name, Opal.require(name)]);
          } else {
            result.push([name, true]); // do nothing, delegated to a autoloading
          }
        }
      }

      return result;
    ;
    }, -2);
    
    $def(self, '$singleton_class', function $$singleton_class() {
      var self = this;

      return Opal.get_singleton_class(self);
    }, 0);
    
    $def(self, '$sleep', function $$sleep(seconds) {
      
      
      if (seconds == null) seconds = nil;
      
      if (seconds === nil) {
        $Kernel.$raise($$$('TypeError'), "can't convert NilClass into time interval")
      }
      if (!seconds.$$is_number) {
        $Kernel.$raise($$$('TypeError'), "can't convert " + (seconds.$class()) + " into time interval")
      }
      if (seconds < 0) {
        $Kernel.$raise($$$('ArgumentError'), "time interval must be positive")
      }
      var get_time = Opal.global.performance ?
        function() {return performance.now()} :
        function() {return new Date()}

      var t = get_time();
      while (get_time() - t <= seconds * 1000);
      return Math.round(seconds);
    ;
    }, -1);
    
    $def(self, '$srand', function $$srand(seed) {
      
      
      if (seed == null) seed = $$('Random').$new_seed();
      return $$$('Random').$srand(seed);
    }, -1);
    
    $def(self, '$String', function $$String(str) {
      var $ret_or_1 = nil;

      if ($truthy(($ret_or_1 = $Opal['$coerce_to?'](str, $$$('String'), "to_str")))) {
        return $ret_or_1
      } else {
        return $Opal['$coerce_to!'](str, $$$('String'), "to_s")
      }
    }, 1);
    
    $def(self, '$tap', function $$tap() {
      var block = $$tap.$$p || nil, self = this;

      $$tap.$$p = null;
      
      ;
      Opal.yield1(block, self);
      return self;
    }, 0);
    
    $def(self, '$to_proc', $return_self, 0);
    
    $def(self, '$to_s', function $$to_s() {
      var self = this;

      return "#<" + (self.$class()) + ":0x" + (self.$__id__().$to_s(16)) + ">"
    }, 0);
    
    $def(self, '$catch', function $Kernel_catch$17(tag) {
      var $yield = $Kernel_catch$17.$$p || nil, $ret_or_1 = nil, e = nil;

      $Kernel_catch$17.$$p = null;
      
      if (tag == null) tag = nil;
      try {
        
        tag = ($truthy(($ret_or_1 = tag)) ? ($ret_or_1) : ($Object.$new()));
        return Opal.yield1($yield, tag);;
      } catch ($err) {
        if (Opal.rescue($err, [$$$('UncaughtThrowError')])) {(e = $err)
          try {
            
            if ($eqeq(e.$tag(), tag)) {
              return e.$value()
            };
            return $Kernel.$raise();
          } finally { Opal.pop_exception(); }
        } else { throw $err; }
      };
    }, -1);
    
    $def(self, '$throw', function $Kernel_throw$18(tag, obj) {
      
      
      if (obj == null) obj = nil;
      return $Kernel.$raise($$$('UncaughtThrowError').$new(tag, obj));
    }, -2);
    
    $def(self, '$open', function $$open($a) {
      var block = $$open.$$p || nil, $post_args, args;

      $$open.$$p = null;
      
      ;
      $post_args = $slice.call(arguments);
      args = $post_args;
      return $send($$$('File'), 'open', $to_a(args), block.$to_proc());
    }, -1);
    
    $def(self, '$yield_self', function $$yield_self() {
      var $yield = $$yield_self.$$p || nil, self = this;

      $$yield_self.$$p = null;
      
      if (!($yield !== nil)) {
        return $send(self, 'enum_for', ["yield_self"], $return_val(1), 0)
      };
      return Opal.yield1($yield, self);;
    }, 0);
    $alias(self, "fail", "raise");
    $alias(self, "kind_of?", "is_a?");
    $alias(self, "object_id", "__id__");
    $alias(self, "public_send", "__send__");
    $alias(self, "send", "__send__");
    $alias(self, "then", "yield_self");
    return $alias(self, "to_enum", "enum_for");
  })('::', $nesting);
  return (function($base, $super) {
    var self = $klass($base, $super, 'Object');

    
    
    delete $Object.$$prototype.$require;
    return self.$include($Kernel);
  })('::', null);
};

Opal.modules["corelib/class"] = function(Opal) {/* Generated by Opal 1.6.0 */
  var $klass = Opal.klass, $send = Opal.send, $defs = Opal.defs, $def = Opal.def, $rb_plus = Opal.rb_plus, $return_val = Opal.return_val, $slice = Opal.slice, $send2 = Opal.send2, $find_super = Opal.find_super, $alias = Opal.alias, self = Opal.top, $nesting = [], nil = Opal.nil;

  Opal.add_stubs('require,class_eval,to_proc,+,subclasses,flatten,map,initialize_copy,allocate,name,to_s');
  
  self.$require("corelib/module");
  return (function($base, $super, $parent_nesting) {
    var self = $klass($base, $super, 'Class');

    var $nesting = [self].concat($parent_nesting), $$ = Opal.$r($nesting);

    
    $defs(self, '$new', function $Class_new$1(superclass) {
      var block = $Class_new$1.$$p || nil;

      $Class_new$1.$$p = null;
      
      ;
      if (superclass == null) superclass = $$('Object');
      
      if (!superclass.$$is_class) {
        throw Opal.TypeError.$new("superclass must be a Class");
      }

      var klass = Opal.allocate_class(nil, superclass);
      superclass.$inherited(klass);
      ((block !== nil) ? ($send((klass), 'class_eval', [], block.$to_proc())) : nil)
      return klass;
    ;
    }, -1);
    
    $def(self, '$allocate', function $$allocate() {
      var self = this;

      
      var obj = new self.$$constructor();
      obj.$$id = Opal.uid();
      return obj;
    
    }, 0);
    
    $def(self, '$descendants', function $$descendants() {
      var self = this;

      return $rb_plus(self.$subclasses(), $send(self.$subclasses(), 'map', [], "descendants".$to_proc()).$flatten())
    }, 0);
    
    $def(self, '$inherited', $return_val(nil), 0);
    
    $def(self, '$initialize_dup', function $$initialize_dup(original) {
      var self = this;

      
      self.$initialize_copy(original);
      
      self.$$name = null;
      self.$$full_name = null;
    ;
    }, 1);
    
    $def(self, '$new', function $Class_new$2($a) {
      var block = $Class_new$2.$$p || nil, $post_args, args, self = this;

      $Class_new$2.$$p = null;
      
      ;
      $post_args = $slice.call(arguments);
      args = $post_args;
      
      var object = self.$allocate();
      Opal.send(object, object.$initialize, args, block);
      return object;
    ;
    }, -1);
    
    $def(self, '$subclasses', function $$subclasses() {
      var self = this;

      
      if (typeof WeakRef !== 'undefined') {
        var i, subclass, out = [];
        for (i = 0; i < self.$$subclasses.length; i++) {
          subclass = self.$$subclasses[i].deref();
          if (subclass !== undefined) {
            out.push(subclass);
          }
        }
        return out;
      }
      else {
        return self.$$subclasses;
      }
    
    }, 0);
    
    $def(self, '$superclass', function $$superclass() {
      var self = this;

      return self.$$super || nil;
    }, 0);
    
    $def(self, '$to_s', function $$to_s() {
      var $yield = $$to_s.$$p || nil, self = this;

      $$to_s.$$p = null;
      
      var singleton_of = self.$$singleton_of;

      if (singleton_of && singleton_of.$$is_a_module) {
        return "#<Class:" + ((singleton_of).$name()) + ">";
      }
      else if (singleton_of) {
        // a singleton class created from an object
        return "#<Class:#<" + ((singleton_of.$$class).$name()) + ":0x" + ((Opal.id(singleton_of)).$to_s(16)) + ">>";
      }

      return $send2(self, $find_super(self, 'to_s', $$to_s, false, true), 'to_s', [], null);
    
    }, 0);
    return $alias(self, "inspect", "to_s");
  })('::', null, $nesting);
};

Opal.modules["corelib/helpers"] = function(Opal) {/* Generated by Opal 1.6.0 */
  var $type_error = Opal.type_error, $coerce_to = Opal.coerce_to, $module = Opal.module, $defs = Opal.defs, $slice = Opal.slice, $eqeqeq = Opal.eqeqeq, $Kernel = Opal.Kernel, $truthy = Opal.truthy, $Opal = Opal.Opal, nil = Opal.nil, $$$ = Opal.$$$;

  Opal.add_stubs('===,raise,respond_to?,nil?,__send__,<=>,class,coerce_to!,new,to_s,__id__');
  return (function($base) {
    var self = $module($base, 'Opal');

    
    
    $defs(self, '$bridge', function $$bridge(constructor, klass) {
      
      return Opal.bridge(constructor, klass);
    }, 2);
    $defs(self, '$coerce_to!', function $Opal_coerce_to$excl$1(object, type, method, $a) {
      var $post_args, args, coerced = nil;

      
      $post_args = $slice.call(arguments, 3);
      args = $post_args;
      coerced = $coerce_to(object, type, method, args);
      if (!$eqeqeq(type, coerced)) {
        $Kernel.$raise($type_error(object, type, method, coerced))
      };
      return coerced;
    }, -4);
    $defs(self, '$coerce_to?', function $Opal_coerce_to$ques$2(object, type, method, $a) {
      var $post_args, args, coerced = nil;

      
      $post_args = $slice.call(arguments, 3);
      args = $post_args;
      if (!$truthy(object['$respond_to?'](method))) {
        return nil
      };
      coerced = $coerce_to(object, type, method, args);
      if ($truthy(coerced['$nil?']())) {
        return nil
      };
      if (!$eqeqeq(type, coerced)) {
        $Kernel.$raise($type_error(object, type, method, coerced))
      };
      return coerced;
    }, -4);
    $defs(self, '$try_convert', function $$try_convert(object, type, method) {
      
      
      if ($eqeqeq(type, object)) {
        return object
      };
      if ($truthy(object['$respond_to?'](method))) {
        return object.$__send__(method)
      } else {
        return nil
      };
    }, 3);
    $defs(self, '$compare', function $$compare(a, b) {
      var compare = nil;

      
      compare = a['$<=>'](b);
      if ($truthy(compare === nil)) {
        $Kernel.$raise($$$('ArgumentError'), "comparison of " + (a.$class()) + " with " + (b.$class()) + " failed")
      };
      return compare;
    }, 2);
    $defs(self, '$destructure', function $$destructure(args) {
      
      
      if (args.length == 1) {
        return args[0];
      }
      else if (args.$$is_array) {
        return args;
      }
      else {
        var args_ary = new Array(args.length);
        for(var i = 0, l = args_ary.length; i < l; i++) { args_ary[i] = args[i]; }

        return args_ary;
      }
    
    }, 1);
    $defs(self, '$respond_to?', function $Opal_respond_to$ques$3(obj, method, include_all) {
      
      
      if (include_all == null) include_all = false;
      
      if (obj == null || !obj.$$class) {
        return false;
      }
    ;
      return obj['$respond_to?'](method, include_all);
    }, -3);
    $defs(self, '$instance_variable_name!', function $Opal_instance_variable_name$excl$4(name) {
      
      
      name = $Opal['$coerce_to!'](name, $$$('String'), "to_str");
      if (!$truthy(/^@[a-zA-Z_][a-zA-Z0-9_]*?$/.test(name))) {
        $Kernel.$raise($$$('NameError').$new("'" + (name) + "' is not allowed as an instance variable name", name))
      };
      return name;
    }, 1);
    $defs(self, '$class_variable_name!', function $Opal_class_variable_name$excl$5(name) {
      
      
      name = $Opal['$coerce_to!'](name, $$$('String'), "to_str");
      if ($truthy(name.length < 3 || name.slice(0,2) !== '@@')) {
        $Kernel.$raise($$$('NameError').$new("`" + (name) + "' is not allowed as a class variable name", name))
      };
      return name;
    }, 1);
    $defs(self, '$const_name?', function $Opal_const_name$ques$6(const_name) {
      
      
      if (typeof const_name !== 'string') {
        (const_name = $Opal['$coerce_to!'](const_name, $$$('String'), "to_str"))
      }

      return const_name[0] === const_name[0].toUpperCase()
    
    }, 1);
    $defs(self, '$const_name!', function $Opal_const_name$excl$7(const_name) {
      var $a, self = this;

      
      if ($truthy((($a = $$$('::', 'String', 'skip_raise')) ? 'constant' : nil))) {
        const_name = $Opal['$coerce_to!'](const_name, $$$('String'), "to_str")
      };
      
      if (!const_name || const_name[0] != const_name[0].toUpperCase()) {
        self.$raise($$$('NameError'), "wrong constant name " + (const_name))
      }
    ;
      return const_name;
    }, 1);
    $defs(self, '$pristine', function $$pristine(owner_class, $a) {
      var $post_args, method_names;

      
      $post_args = $slice.call(arguments, 1);
      method_names = $post_args;
      
      var method_name, method;
      for (var i = method_names.length - 1; i >= 0; i--) {
        method_name = method_names[i];
        method = owner_class.$$prototype['$'+method_name];

        if (method && !method.$$stub) {
          method.$$pristine = true;
        }
      }
    ;
      return nil;
    }, -2);
    var inspect_stack = [];
    return $defs(self, '$inspect', function $$inspect(value) {
      var e = nil;

      
      ;
      var pushed = false;
      
      return (function() { try {
      try {
        
        
        if (value === null) {
          // JS null value
          return 'null';
        }
        else if (value === undefined) {
          // JS undefined value
          return 'undefined';
        }
        else if (typeof value.$$class === 'undefined') {
          // JS object / other value that is not bridged
          return Object.prototype.toString.apply(value);
        }
        else if (typeof value.$inspect !== 'function' || value.$inspect.$$stub) {
          // BasicObject and friends
          return "#<" + (value.$$class) + ":0x" + (value.$__id__().$to_s(16)) + ">"
        }
        else if (inspect_stack.indexOf(value.$__id__()) !== -1) {
          // inspect recursing inside inspect to find out about the
          // same object
          return "#<" + (value.$$class) + ":0x" + (value.$__id__().$to_s(16)) + ">"
        }
        else {
          // anything supporting Opal
          inspect_stack.push(value.$__id__());
          pushed = true;
          return value.$inspect();
        }
      ;
        return nil;
      } catch ($err) {
        if (Opal.rescue($err, [$$$('Exception')])) {(e = $err)
          try {
            return "#<" + (value.$$class) + ":0x" + (value.$__id__().$to_s(16)) + ">"
          } finally { Opal.pop_exception(); }
        } else { throw $err; }
      }
      } finally {
        if (pushed) inspect_stack.pop()
      }; })();;
    }, -1);
  })('::')
};

Opal.modules["corelib/error/errno"] = function(Opal) {/* Generated by Opal 1.6.0 */
  var $module = Opal.module, $truthy = Opal.truthy, $rb_plus = Opal.rb_plus, $send2 = Opal.send2, $find_super = Opal.find_super, $def = Opal.def, $klass = Opal.klass, $nesting = [], nil = Opal.nil, $$$ = Opal.$$$;

  Opal.add_stubs('+,errno,class,attr_reader');
  
  (function($base, $parent_nesting) {
    var self = $module($base, 'Errno');

    var $nesting = [self].concat($parent_nesting), errors = nil, klass = nil;

    
    errors = [["EINVAL", "Invalid argument", 22], ["EEXIST", "File exists", 17], ["EISDIR", "Is a directory", 21], ["EMFILE", "Too many open files", 24], ["ESPIPE", "Illegal seek", 29], ["EACCES", "Permission denied", 13], ["EPERM", "Operation not permitted", 1], ["ENOENT", "No such file or directory", 2], ["ENAMETOOLONG", "File name too long", 36]];
    klass = nil;
    
    var i;
    for (i = 0; i < errors.length; i++) {
      (function() { // Create a closure
        var class_name = errors[i][0];
        var default_message = errors[i][1];
        var errno = errors[i][2];

        klass = Opal.klass(self, Opal.SystemCallError, class_name);
        klass.errno = errno;

        (function(self, $parent_nesting) {
      
      return $def(self, '$new', function $new$1(name) {
        var $yield = $new$1.$$p || nil, self = this, message = nil;

        $new$1.$$p = null;
        
        if (name == null) name = nil;
        message = default_message;
        if ($truthy(name)) {
          message = $rb_plus(message, " - " + (name))
        };
        return $send2(self, $find_super(self, 'new', $new$1, false, true), 'new', [message], null);
      }, -1)
    })(Opal.get_singleton_class(klass), $nesting)
      })();
    }
  ;
  })('::', $nesting);
  return (function($base, $super, $parent_nesting) {
    var self = $klass($base, $super, 'SystemCallError');

    var $nesting = [self].concat($parent_nesting);

    
    
    $def(self, '$errno', function $$errno() {
      var self = this;

      return self.$class().$errno()
    }, 0);
    return (function(self, $parent_nesting) {
      
      return self.$attr_reader("errno")
    })(Opal.get_singleton_class(self), $nesting);
  })('::', $$$('StandardError'), $nesting);
};

Opal.modules["opal/base"] = function(Opal) {/* Generated by Opal 1.6.0 */
  var $Object = Opal.Object, nil = Opal.nil;

  Opal.add_stubs('require');
  
  $Object.$require("corelib/runtime");
  $Object.$require("corelib/helpers");
  $Object.$require("corelib/module");
  $Object.$require("corelib/class");
  $Object.$require("corelib/basic_object");
  $Object.$require("corelib/kernel");
  $Object.$require("corelib/main");
  $Object.$require("corelib/error");
  return $Object.$require("corelib/constants");
};
