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
  if (typeof(global_object.console) === 'object') {
    console = global_object.console;
  } else if (global_object.console == null) {
    console = global_object.console = {};
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

  // The Opal object that is exposed globally
  var Opal = global_object.Opal = {};

  // This is a useful reference to global object inside ruby files
  Opal.global = global_object;
  global_object.Opal = Opal;

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
  Opal.uid = function() {
    unique_id += 2;
    return unique_id;
  };

  // Retrieve or assign the id of an object
  Opal.id = function(obj) {
    if (obj.$$is_number) return (obj * 2)+1;
    if (obj.$$id != null) {
      return obj.$$id;
    }
    $defineProperty(obj, '$$id', Opal.uid());
    return obj.$$id;
  };

  // Globals table
  Opal.gvars = {};

  // Exit function, this should be replaced by platform specific implementation
  // (See nodejs and chrome for examples)
  Opal.exit = function(status) { if (Opal.gvars.DEBUG) console.log('Exited with status '+status); };

  // keeps track of exceptions for $!
  Opal.exceptions = [];

  // @private
  // Pops an exception from the stack and updates `$!`.
  Opal.pop_exception = function() {
    var exception = Opal.exceptions.pop();
    if (exception) {
      Opal.gvars["!"] = exception;
      Opal.gvars["@"] = exception.$backtrace();
    }
    else {
      Opal.gvars["!"] = Opal.gvars["@"] = nil;
    }
  };

  // Inspect any kind of object, including non Ruby ones
  Opal.inspect = function(obj) {
    if (obj === undefined) {
      return "undefined";
    }
    else if (obj === null) {
      return "null";
    }
    else if (!obj.$$class) {
      return obj.toString();
    }
    else {
      return obj.$inspect();
    }
  };

  function $defineProperty(object, name, initialValue) {
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

  Opal.defineProperty = $defineProperty;

  Opal.slice = $slice;


  // Helpers
  // -----

  Opal.truthy = function(val) {
    return (val !== nil && val != null && (!val.$$is_boolean || val == true));
  };

  Opal.falsy = function(val) {
    return (val === nil || val == null || (val.$$is_boolean && val == false))
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
    if (type['$==='](object)) return object;

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
      if (obj['$respond_to_missing?'].$$pristine) {
        return typeof(body) === "function" && !body.$$stub;
      } else {
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
      if (cref.$$const[name]) {
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
      if (cref.$$const[name]) { return cref.$$const[name]; }
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

    ancestors = Opal.ancestors(cref);

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
  function const_missing(cref, name, skip_missing) {
    if (!skip_missing) {
      return (cref || _Object).$const_missing(name);
    }
  }

  // Look for the constant just in the current cref or call `#const_missing`
  Opal.const_get_local = function(cref, name, skip_missing) {
    var result;

    if (cref == null) return;

    if (cref === '::') cref = _Object;

    if (!cref.$$is_module && !cref.$$is_class) {
      throw new Opal.TypeError(cref.toString() + " is not a class/module");
    }

    result = const_get_name(cref, name);              if (result != null) return result;
    result = const_missing(cref, name, skip_missing); if (result != null) return result;
  };

  // Look for the constant relative to a cref or call `#const_missing` (when the
  // constant is prefixed by `::`).
  Opal.const_get_qualified = function(cref, name, skip_missing) {
    var result, cache, cached, current_version = Opal.const_cache_version;

    if (cref == null) return;

    if (cref === '::') cref = _Object;

    if (!cref.$$is_module && !cref.$$is_class) {
      throw new Opal.TypeError(cref.toString() + " is not a class/module");
    }

    if ((cache = cref.$$const_cache) == null) {
      $defineProperty(cref, '$$const_cache', Object.create(null));
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

    return result != null ? result : const_missing(cref, name, skip_missing);
  };

  // Initialize the top level constant cache generation counter
  Opal.const_cache_version = 1;

  // Look for the constant in the open using the current nesting and the nearest
  // cref ancestors or call `#const_missing` (when the constant has no :: prefix).
  Opal.const_get_relative = function(nesting, name, skip_missing) {
    var cref = nesting[0], result, current_version = Opal.const_cache_version, cache, cached;

    if ((cache = nesting.$$const_cache) == null) {
      $defineProperty(nesting, '$$const_cache', Object.create(null));
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

    return result != null ? result : const_missing(cref, name, skip_missing);
  };

  // Register the constant on a cref and opportunistically set the name of
  // unnamed classes/modules.
  Opal.const_set = function(cref, name, value) {
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
    $defineProperty(cref, name, value);

    return value;
  };

  // Get all the constants reachable from a given cref, by default will include
  // inherited constants.
  Opal.constants = function(cref, inherit) {
    if (inherit == null) inherit = true;

    var module, modules = [cref], i, ii, constants = {}, constant;

    if (inherit) modules = modules.concat(Opal.ancestors(cref));
    if (inherit && cref.$$is_module) modules = modules.concat([Opal.Object]).concat(Opal.ancestors(Opal.Object));

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

  // Setup some shortcuts to reduce compiled size
  Opal.$$ = Opal.const_get_relative;
  Opal.$$$ = Opal.const_get_qualified;


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
  // @param superclass  [Class,null] superclass of the new class (may be null)
  // @param id          [String] the name of the class to be created
  // @param constructor [JS.Function] function to use as constructor
  //
  // @return new [Class]  or existing ruby class
  //
  Opal.allocate_class = function(name, superclass) {
    var klass, constructor;

    if (superclass != null && superclass.$$bridge) {
      // Inheritance from bridged classes requires
      // calling original JS constructors
      constructor = function() {
        var args = $slice.call(arguments),
            self = new ($bind.apply(superclass.$$constructor, [null].concat(args)))();

        // and replacing a __proto__ manually
        $set_proto(self, klass.$$prototype);
        return self;
      }
    } else {
      constructor = function(){};
    }

    if (name) {
      $defineProperty(constructor, 'displayName', '::'+name);
    }

    klass = constructor;

    $defineProperty(klass, '$$name', name);
    $defineProperty(klass, '$$constructor', constructor);
    $defineProperty(klass, '$$prototype', constructor.prototype);
    $defineProperty(klass, '$$const', {});
    $defineProperty(klass, '$$is_class', true);
    $defineProperty(klass, '$$is_a_module', true);
    $defineProperty(klass, '$$super', superclass);
    $defineProperty(klass, '$$cvars', {});
    $defineProperty(klass, '$$own_included_modules', []);
    $defineProperty(klass, '$$own_prepended_modules', []);
    $defineProperty(klass, '$$ancestors', []);
    $defineProperty(klass, '$$ancestors_cache_version', null);

    $defineProperty(klass.$$prototype, '$$class', klass);

    // By default if there are no singleton class methods
    // __proto__ is Class.prototype
    // Later singleton methods generate a singleton_class
    // and inject it into ancestors chain
    if (Opal.Class) {
      $set_proto(klass, Opal.Class.prototype);
    }

    if (superclass != null) {
      $set_proto(klass.$$prototype, superclass.$$prototype);

      if (superclass.$$meta) {
        // If superclass has metaclass then we have explicitely inherit it.
        Opal.build_class_singleton_class(klass);
      }
    }

    return klass;
  };


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

    if (klass) {
      if (superclass) {
        // Make sure existing class has same superclass
        ensureSuperclassMatch(klass, superclass);
      }

      if (Opal.trace_class) { invoke_tracers_for_class(klass); }

      return klass;
    }

    // Class doesn't exist, create a new one with given superclass...

    // Not specifying a superclass means we can assume it to be Object
    if (superclass == null) {
      superclass = _Object;
    }

    // Create the class object (instance of Class)
    klass = Opal.allocate_class(name, superclass);
    Opal.const_set(scope, name, klass);

    // Call .inherited() hook with new class on the superclass
    if (superclass.$inherited) {
      superclass.$inherited(klass);
    }

    if (bridged) {
      Opal.bridge(bridged, klass);
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
  Opal.allocate_module = function(name) {
    var constructor = function(){};
    if (name) {
      $defineProperty(constructor, 'displayName', name+'.$$constructor');
    }

    var module = constructor;

    if (name)
      $defineProperty(constructor, 'displayName', name+'.constructor');

    $defineProperty(module, '$$name', name);
    $defineProperty(module, '$$prototype', constructor.prototype);
    $defineProperty(module, '$$const', {});
    $defineProperty(module, '$$is_module', true);
    $defineProperty(module, '$$is_a_module', true);
    $defineProperty(module, '$$cvars', {});
    $defineProperty(module, '$$iclasses', []);
    $defineProperty(module, '$$own_included_modules', []);
    $defineProperty(module, '$$own_prepended_modules', []);
    $defineProperty(module, '$$ancestors', [module]);
    $defineProperty(module, '$$ancestors_cache_version', null);

    $set_proto(module, Opal.Module.prototype);

    return module;
  };

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

    if (module) {

      if (Opal.trace_class) { invoke_tracers_for_class(module); }

      return module;
    }

    // Module doesnt exist, create a new one...
    module = Opal.allocate_module(name);
    Opal.const_set(scope, name, module);

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
    var superclass, meta;

    if (klass.$$meta) {
      return klass.$$meta;
    }

    // The singleton_class superclass is the singleton_class of its superclass;
    // but BasicObject has no superclass (its `$$super` is null), thus we
    // fallback on `Class`.
    superclass = klass === BasicObject ? Class : Opal.get_singleton_class(klass.$$super);

    meta = Opal.allocate_class(null, superclass, function(){});

    $defineProperty(meta, '$$is_singleton', true);
    $defineProperty(meta, '$$singleton_of', klass);
    $defineProperty(klass, '$$meta', meta);
    $set_proto(klass, meta.$$prototype);
    // Restoring ClassName.class
    $defineProperty(klass, '$$class', Opal.Class);

    return meta;
  };

  Opal.build_module_singleton_class = function(mod) {
    if (mod.$$meta) {
      return mod.$$meta;
    }

    var meta = Opal.allocate_class(null, Opal.Module, function(){});

    $defineProperty(meta, '$$is_singleton', true);
    $defineProperty(meta, '$$singleton_of', mod);
    $defineProperty(mod, '$$meta', meta);
    $set_proto(mod, meta.$$prototype);
    // Restoring ModuleName.class
    $defineProperty(mod, '$$class', Opal.Module);

    return meta;
  };

  // Build the singleton class for a Ruby (non class) Object.
  //
  // @param object [Object]
  // @return [Class]
  Opal.build_object_singleton_class = function(object) {
    var superclass = object.$$class,
        klass = Opal.allocate_class(nil, superclass, function(){});

    $defineProperty(klass, '$$is_singleton', true);
    $defineProperty(klass, '$$singleton_of', object);

    delete klass.$$prototype.$$class;

    $defineProperty(object, '$$meta', klass);

    $set_proto(object, object.$$meta.$$prototype);

    return klass;
  };

  Opal.is_method = function(prop) {
    return (prop[0] === '$' && prop[1] !== '$');
  };

  Opal.instance_methods = function(mod) {
    var exclude = [], results = [], ancestors = Opal.ancestors(mod);

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
    return Opal.instance_methods(Opal.get_singleton_class(obj));
  };

  Opal.own_methods = function(obj) {
    return Opal.own_instance_methods(Opal.get_singleton_class(obj));
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
    var ancestors = Opal.ancestors(module),
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
    var ancestors = Opal.ancestors(module),
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

    var ancestors = Opal.ancestors(module),
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
    var module_ancestors = Opal.ancestors(module);
    var iclasses = [];

    if (module_ancestors.indexOf(includer) !== -1) {
      throw Opal.ArgumentError.$new('cyclic include detected');
    }

    for (var i = 0, length = module_ancestors.length; i < length; i++) {
      var ancestor = module_ancestors[i], iclass = create_iclass(ancestor);
      $defineProperty(iclass, '$$included', true);
      iclasses.push(iclass);
    }
    var includer_ancestors = Opal.ancestors(includer),
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
    var module_ancestors = Opal.ancestors(module);
    var iclasses = [];

    if (module_ancestors.indexOf(prepender) !== -1) {
      throw Opal.ArgumentError.$new('cyclic prepend detected');
    }

    for (var i = 0, length = module_ancestors.length; i < length; i++) {
      var ancestor = module_ancestors[i], iclass = create_iclass(ancestor);
      $defineProperty(iclass, '$$prepended', true);
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
      $defineProperty(dummy_prepender, '$$dummy', true);
      $defineProperty(dummy_prepender, '$$define_methods_on', prepender_iclass);

      // Converting
      //   dummy(prepender) -> previous_parent
      // to
      //   dummy(prepender) -> iclass(prepender) -> previous_parent
      $set_proto(dummy_prepender, prepender_iclass);
      $set_proto(prepender_iclass, previous_parent);
    }

    var prepender_ancestors = Opal.ancestors(prepender);

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
      $defineProperty(iclass, prop, proto[prop]);
    }

    $defineProperty(iclass, '$$iclass', true);
    $defineProperty(iclass, '$$module', module);

    return iclass;
  }

  function chain_iclasses(iclasses) {
    var length = iclasses.length, first = iclasses[0];

    $defineProperty(first, '$$root', true);

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
    $defineProperty(native_klass, '$$bridge', klass);
    $set_proto(native_klass.prototype, (klass.$$super || Opal.Object).$$prototype);
    $defineProperty(klass, '$$prototype', native_klass.prototype);

    $defineProperty(klass.$$prototype, '$$class', klass);
    $defineProperty(klass, '$$constructor', native_klass);
    $defineProperty(klass, '$$bridge', true);
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
  Opal.ancestors = function(module) {
    if (!module) { return []; }

    if (module.$$ancestors_cache_version === Opal.const_cache_version) {
      return module.$$ancestors;
    }

    var result = [], i, mods, length;

    for (i = 0, mods = own_ancestors(module), length = mods.length; i < length; i++) {
      result.push(mods[i]);
    }

    if (module.$$super) {
      for (i = 0, mods = Opal.ancestors(module.$$super), length = mods.length; i < length; i++) {
        result.push(mods[i]);
      }
    }

    module.$$ancestors_cache_version = Opal.const_cache_version;
    module.$$ancestors = result;

    return result;
  };

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
  //    Opal.add_stubs(["$foo", "$bar", "$baz="]);
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

    for (var i = 0, length = stubs.length; i < length; i++) {
      stub = stubs[i], existing_method = proto[stub];

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
    $defineProperty(prototype, stub, Opal.stub_for(stub));
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

    throw Opal.ArgumentError.$new('[' + inspect + '] wrong number of arguments(' + actual + ' for ' + expected + ')');
  };

  // Arity count error dispatcher for blocks
  //
  // @param actual [Fixnum] number of arguments given to block
  // @param expected [Fixnum] expected number of arguments
  // @param context [Object] context of the block definition
  // @raise [ArgumentError]
  Opal.block_ac = function(actual, expected, context) {
    var inspect = "`block in " + context + "'";

    throw Opal.ArgumentError.$new(inspect + ': wrong number of arguments (' + actual + ' for ' + expected + ')');
  };

  // Super dispatcher
  Opal.find_super = function(obj, mid, current_func, defcheck, allow_stubs) {
    var jsid = '$' + mid, ancestors, super_method;

    if (obj.hasOwnProperty('$$meta')) {
      ancestors = Opal.ancestors(obj.$$meta);
    } else {
      ancestors = Opal.ancestors(obj.$$class);
    }

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
      throw Opal.RuntimeError.$new("implicit argument passing of super from method defined by define_method() is not supported. Specify all arguments explicitly");
    }

    if (current_func.$$def) {
      call_jsid = current_func.$$jsid;
    }

    return Opal.find_super_dispatcher(obj, call_jsid, current_func, defcheck);
  };

  // @deprecated
  Opal.find_super_dispatcher = Opal.find_super;

  // @deprecated
  Opal.find_iter_super_dispatcher = Opal.find_block_super;

  // Used to return as an expression. Sometimes, we can't simply return from
  // a javascript function as if we were a method, as the return is used as
  // an expression, or even inside a block which must "return" to the outer
  // method. This helper simply throws an error which is then caught by the
  // method. This approach is expensive, so it is only used when absolutely
  // needed.
  //
  Opal.ret = function(val) {
    Opal.returner.$v = val;
    throw Opal.returner;
  };

  // Used to break out of a block.
  Opal.brk = function(val, breaker) {
    breaker.$v = val;
    throw breaker;
  };

  // Builds a new unique breaker, this is to avoid multiple nested breaks to get
  // in the way of each other.
  Opal.new_brk = function() {
    return new Error('unexpected break');
  };

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
      else if (candidate === Opal.JS.Error) {
        return candidate;
      }
      else if (candidate['$==='](exception)) {
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

    var i, length, ancestors = Opal.ancestors(object.$$is_class ? Opal.get_singleton_class(object) : (object.$$meta || object.$$class));

    for (i = 0, length = ancestors.length; i < length; i++) {
      if (ancestors[i] === klass) {
        return true;
      }
    }

    return false;
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
      $splice.call(parameters, parameters.length - 1, 1);
      return kwargs.$to_hash();
    }
    else {
      return Opal.hash2([], {});
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
  // @return [Object] returning value of the method call
  Opal.send = function(recv, method, args, block) {
    var body;

    if (typeof(method) === 'function') {
      body = method;
      method = null;
    } else if (typeof(method) === 'string') {
      body = recv['$'+method];
    } else {
      throw Opal.NameError.$new("Passed method should be a string or a function");
    }

    return Opal.send2(recv, body, method, args, block);
  };

  Opal.send2 = function(recv, body, method, args, block) {
    if (body == null && method != null && recv.$method_missing) {
      body = recv.$method_missing;
      args = [method].concat(args);
    }

    if (typeof block === 'function') body.$$p = block;
    return body.apply(recv, args);
  };

  Opal.refined_send = function(refinement_groups, recv, method, args, block) {
    var i, j, k, ancestors, ancestor, refinements, refinement, refine_modules, refine_module, body;

    if (recv.hasOwnProperty('$$meta')) {
      ancestors = Opal.ancestors(recv.$$meta);
    } else {
      ancestors = Opal.ancestors(recv.$$class);
    }

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
          if (typeof refine_modules[ancestor] !== 'undefined') {
            refine_module = refine_modules[ancestor];
            // Does this module define a method we want to call?
            if (typeof refine_module.$$prototype['$'+method] !== 'undefined') {
              body = refine_module.$$prototype['$'+method];
              return Opal.send2(recv, body, method, args, block);
            }
          }
        }
      }
    }

    return Opal.send(recv, method, args, block);
  };

  Opal.lambda = function(block) {
    block.$$is_lambda = true;
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
  // @return [null]
  //
  Opal.def = function(obj, jsid, body) {
    // Special case for a method definition in the
    // top-level namespace
    if (obj === Opal.top) {
      Opal.defn(Opal.Object, jsid, body)
    }
    // if instance_eval is invoked on a module/class, it sets inst_eval_mod
    else if (!obj.$$eval && obj.$$is_a_module) {
      Opal.defn(obj, jsid, body);
    }
    else {
      Opal.defs(obj, jsid, body);
    }
  };

  // Define method on a module or class (see Opal.def).
  Opal.defn = function(module, jsid, body) {
    body.displayName = jsid;
    body.$$owner = module;

    var proto = module.$$prototype;
    if (proto.hasOwnProperty('$$dummy')) {
      proto = proto.$$define_methods_on;
    }
    $defineProperty(proto, jsid, body);

    if (module.$$is_module) {
      if (module.$$module_function) {
        Opal.defs(module, jsid, body)
      }

      for (var i = 0, iclasses = module.$$iclasses, length = iclasses.length; i < length; i++) {
        var iclass = iclasses[i];
        $defineProperty(iclass, jsid, body);
      }
    }

    var singleton_of = module.$$singleton_of;
    if (module.$method_added && !module.$method_added.$$stub && !singleton_of) {
      module.$method_added(jsid.substr(1));
    }
    else if (singleton_of && singleton_of.$singleton_method_added && !singleton_of.$singleton_method_added.$$stub) {
      singleton_of.$singleton_method_added(jsid.substr(1));
    }
  };

  // Define a singleton method on the given object (see Opal.def).
  Opal.defs = function(obj, jsid, body) {
    if (obj.$$is_string || obj.$$is_number) {
      throw Opal.TypeError.$new("can't define singleton");
    }
    Opal.defn(Opal.get_singleton_class(obj), jsid, body)
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

      if (block != null) { alias.$$p = null }

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
    Object.defineProperty(Opal.gvars, new_name, {
      configurable: true,
      enumerable: true,
      get: function() {
        return Opal.gvars[old_name];
      },
      set: function(new_value) {
        Opal.gvars[old_name] = new_value;
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

    if (arguments_length === 1 && arguments[0].$$is_array) {
      args = arguments[0];
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

    if (arguments_length === 1) {
      args = arguments[0];
      for (key in args) {
        if ($has_own.call(args, key)) {
          value = args[key];

          Opal.hash_put(hash, key, value);
        }
      }

      return hash;
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

  // Get the ivar name for a given name.
  // Mostly adds a trailing $ to reserved names.
  //
  Opal.ivar = function(name) {
    if (
        // properties
        name === "constructor" ||
        name === "displayName" ||
        name === "__count__" ||
        name === "__noSuchMethod__" ||
        name === "__parent__" ||
        name === "__proto__" ||

        // methods
        name === "hasOwnProperty" ||
        name === "valueOf"
       )
    {
      return name + "$";
    }

    return name;
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
    var result;
    if (pattern.multiline) {
      if (pattern.global) {
        return pattern; // RegExp already has the global and multiline flag
      }
      // we are using the $$g attribute because the Regexp is already multiline
      if (pattern.$$g != null) {
        result = pattern.$$g;
      } else {
        result = pattern.$$g = new RegExp(pattern.source, 'gm' + (pattern.ignoreCase ? 'i' : ''));
      }
    } else if (pattern.$$gm != null) {
      result = pattern.$$gm;
    } else {
      result = pattern.$$gm = new RegExp(pattern.source, 'gm' + (pattern.ignoreCase ? 'i' : ''));
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

  Opal.load = function(path) {
    path = Opal.normalize(path);

    Opal.loaded([path]);

    var module = Opal.modules[path];

    if (module) {
      var retval = module(Opal);
      if (typeof Promise !== 'undefined' && retval instanceof Promise) {
        // A special case of require having an async top:
        // We will need to await it.
        return retval.then(function() { return true; });
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

  Opal.require = function(path) {
    path = Opal.normalize(path);

    if (Opal.require_table[path]) {
      return false;
    }

    return Opal.load(path);
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


  // Initialization
  // --------------
  function $BasicObject() {}
  function $Object() {}
  function $Module() {}
  function $Class() {}

  Opal.BasicObject = BasicObject = Opal.allocate_class('BasicObject', null, $BasicObject);
  Opal.Object      = _Object     = Opal.allocate_class('Object', Opal.BasicObject, $Object);
  Opal.Module      = Module      = Opal.allocate_class('Module', Opal.Object, $Module);
  Opal.Class       = Class       = Opal.allocate_class('Class', Opal.Module, $Class);

  $set_proto(Opal.BasicObject, Opal.Class.$$prototype);
  $set_proto(Opal.Object, Opal.Class.$$prototype);
  $set_proto(Opal.Module, Opal.Class.$$prototype);
  $set_proto(Opal.Class, Opal.Class.$$prototype);

  // BasicObject can reach itself, avoid const_set to skip the $$base_module logic
  BasicObject.$$const["BasicObject"] = BasicObject;

  // Assign basic constants
  Opal.const_set(_Object, "BasicObject",  BasicObject);
  Opal.const_set(_Object, "Object",       _Object);
  Opal.const_set(_Object, "Module",       Module);
  Opal.const_set(_Object, "Class",        Class);

  // Fix booted classes to have correct .class value
  BasicObject.$$class = Class;
  _Object.$$class     = Class;
  Module.$$class      = Class;
  Class.$$class       = Class;

  // Forward .toString() to #to_s
  $defineProperty(_Object.$$prototype, 'toString', function() {
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
  $defineProperty(_Object.$$prototype, '$require', Opal.require);

  // Instantiate the main object
  Opal.top = new _Object();
  Opal.top.$to_s = Opal.top.$inspect = function() { return 'main' };
  Opal.top.$define_method = top_define_method;

  // Foward calls to define_method on the top object to Object
  function top_define_method() {
    var args = Opal.slice.call(arguments, 0, arguments.length);
    var block = top_define_method.$$p;
    top_define_method.$$p = null;
    return Opal.send(_Object, 'define_method', args, block)
  };


  // Nil
  function $NilClass() {}
  Opal.NilClass = Opal.allocate_class('NilClass', Opal.Object, $NilClass);
  Opal.const_set(_Object, 'NilClass', Opal.NilClass);
  nil = Opal.nil = new Opal.NilClass();
  nil.$$id = nil_id;
  nil.call = nil.apply = function() { throw Opal.LocalJumpError.$new('no block given'); };

  // Errors
  Opal.breaker  = new Error('unexpected break (old)');
  Opal.returner = new Error('unexpected return');
  TypeError.$$super = Error;
}).call(this);
Opal.loaded(["corelib/runtime.js"]);
Opal.modules["corelib/helpers"] = function(Opal) {/* Generated by Opal 1.3.0 */
  var self = Opal.top, $nesting = [], nil = Opal.nil, $$$ = Opal.$$$, $$ = Opal.$$, $type_error = Opal.type_error, $coerce_to = Opal.coerce_to, $module = Opal.module, $truthy = Opal.truthy;

  Opal.add_stubs(['$===', '$raise', '$respond_to?', '$nil?', '$__send__', '$<=>', '$class', '$coerce_to!', '$new', '$!=', '$[]', '$upcase']);
  return (function($base, $parent_nesting) {
    var self = $module($base, 'Opal');

    var $nesting = [self].concat($parent_nesting), $Opal_bridge$1, $Opal_coerce_to$excl$2, $Opal_coerce_to$ques$3, $Opal_try_convert$4, $Opal_compare$5, $Opal_destructure$6, $Opal_respond_to$ques$7, $Opal_instance_variable_name$excl$8, $Opal_class_variable_name$excl$9, $Opal_const_name$ques$10, $Opal_const_name$excl$11, $Opal_pristine$12;

    
    Opal.defs(self, '$bridge', $Opal_bridge$1 = function $$bridge(constructor, klass) {
      var self = this;

      return Opal.bridge(constructor, klass);
    }, $Opal_bridge$1.$$arity = 2);
    Opal.defs(self, '$coerce_to!', $Opal_coerce_to$excl$2 = function(object, type, method, $a) {
      var $post_args, args, self = this, coerced = nil;

      
      
      $post_args = Opal.slice.call(arguments, 3, arguments.length);
      
      args = $post_args;;
      coerced = $coerce_to(object, type, method, args);
      if ($truthy(type['$==='](coerced))) {
      } else {
        self.$raise($type_error(object, type, method, coerced))
      };
      return coerced;
    }, $Opal_coerce_to$excl$2.$$arity = -4);
    Opal.defs(self, '$coerce_to?', $Opal_coerce_to$ques$3 = function(object, type, method, $a) {
      var $post_args, args, self = this, coerced = nil;

      
      
      $post_args = Opal.slice.call(arguments, 3, arguments.length);
      
      args = $post_args;;
      if ($truthy(object['$respond_to?'](method))) {
      } else {
        return nil
      };
      coerced = $coerce_to(object, type, method, args);
      if ($truthy(coerced['$nil?']())) {
        return nil};
      if ($truthy(type['$==='](coerced))) {
      } else {
        self.$raise($type_error(object, type, method, coerced))
      };
      return coerced;
    }, $Opal_coerce_to$ques$3.$$arity = -4);
    Opal.defs(self, '$try_convert', $Opal_try_convert$4 = function $$try_convert(object, type, method) {
      var self = this;

      
      if ($truthy(type['$==='](object))) {
        return object};
      if ($truthy(object['$respond_to?'](method))) {
        return object.$__send__(method)
      } else {
        return nil
      };
    }, $Opal_try_convert$4.$$arity = 3);
    Opal.defs(self, '$compare', $Opal_compare$5 = function $$compare(a, b) {
      var self = this, compare = nil;

      
      compare = a['$<=>'](b);
      if ($truthy(compare === nil)) {
        self.$raise($$($nesting, 'ArgumentError'), "" + "comparison of " + (a.$class()) + " with " + (b.$class()) + " failed")};
      return compare;
    }, $Opal_compare$5.$$arity = 2);
    Opal.defs(self, '$destructure', $Opal_destructure$6 = function $$destructure(args) {
      var self = this;

      
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
    
    }, $Opal_destructure$6.$$arity = 1);
    Opal.defs(self, '$respond_to?', $Opal_respond_to$ques$7 = function(obj, method, include_all) {
      var self = this;

      
      
      if (include_all == null) {
        include_all = false;
      };
      
      if (obj == null || !obj.$$class) {
        return false;
      }
    ;
      return obj['$respond_to?'](method, include_all);
    }, $Opal_respond_to$ques$7.$$arity = -3);
    Opal.defs(self, '$instance_variable_name!', $Opal_instance_variable_name$excl$8 = function(name) {
      var self = this;

      
      name = $$($nesting, 'Opal')['$coerce_to!'](name, $$($nesting, 'String'), "to_str");
      if ($truthy(/^@[a-zA-Z_][a-zA-Z0-9_]*?$/.test(name))) {
      } else {
        self.$raise($$($nesting, 'NameError').$new("" + "'" + (name) + "' is not allowed as an instance variable name", name))
      };
      return name;
    }, $Opal_instance_variable_name$excl$8.$$arity = 1);
    Opal.defs(self, '$class_variable_name!', $Opal_class_variable_name$excl$9 = function(name) {
      var self = this;

      
      name = $$($nesting, 'Opal')['$coerce_to!'](name, $$($nesting, 'String'), "to_str");
      if ($truthy(name.length < 3 || name.slice(0,2) !== '@@')) {
        self.$raise($$($nesting, 'NameError').$new("" + "`" + (name) + "' is not allowed as a class variable name", name))};
      return name;
    }, $Opal_class_variable_name$excl$9.$$arity = 1);
    Opal.defs(self, '$const_name?', $Opal_const_name$ques$10 = function(const_name) {
      var self = this;

      
      if (typeof const_name !== 'string') {
        (const_name = $$($nesting, 'Opal')['$coerce_to!'](const_name, $$($nesting, 'String'), "to_str"))
      }

      return const_name[0] === const_name[0].toUpperCase()
    
    }, $Opal_const_name$ques$10.$$arity = 1);
    Opal.defs(self, '$const_name!', $Opal_const_name$excl$11 = function(const_name) {
      var self = this;

      
      const_name = $$($nesting, 'Opal')['$coerce_to!'](const_name, $$($nesting, 'String'), "to_str");
      if ($truthy(const_name['$[]'](0)['$!='](const_name['$[]'](0).$upcase()))) {
        self.$raise($$($nesting, 'NameError'), "" + "wrong constant name " + (const_name))};
      return const_name;
    }, $Opal_const_name$excl$11.$$arity = 1);
    return (Opal.defs(self, '$pristine', $Opal_pristine$12 = function $$pristine(owner_class, $a) {
      var $post_args, method_names, self = this;

      
      
      $post_args = Opal.slice.call(arguments, 1, arguments.length);
      
      method_names = $post_args;;
      
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
    }, $Opal_pristine$12.$$arity = -2), nil) && 'pristine';
  })($nesting[0], $nesting)
};

Opal.modules["corelib/module"] = function(Opal) {/* Generated by Opal 1.3.0 */
  function $rb_lt(lhs, rhs) {
    return (typeof(lhs) === 'number' && typeof(rhs) === 'number') ? lhs < rhs : lhs['$<'](rhs);
  }
  function $rb_gt(lhs, rhs) {
    return (typeof(lhs) === 'number' && typeof(rhs) === 'number') ? lhs > rhs : lhs['$>'](rhs);
  }
  var self = Opal.top, $nesting = [], nil = Opal.nil, $$$ = Opal.$$$, $$ = Opal.$$, $truthy = Opal.truthy, $coerce_to = Opal.coerce_to, $klass = Opal.klass, $send = Opal.send, $hash2 = Opal.hash2, $lambda = Opal.lambda, $range = Opal.range, $alias = Opal.alias, $send2 = Opal.send2, $find_super = Opal.find_super;

  Opal.add_stubs(['$module_eval', '$to_proc', '$===', '$raise', '$equal?', '$<', '$>', '$nil?', '$attr_reader', '$attr_writer', '$warn', '$attr_accessor', '$const_name?', '$class_variable_name!', '$const_name!', '$=~', '$new', '$inject', '$split', '$const_get', '$==', '$!~', '$start_with?', '$bind', '$call', '$class', '$append_features', '$included', '$name', '$cover?', '$size', '$merge', '$compile', '$proc', '$any?', '$prepend_features', '$prepended', '$to_s', '$__id__', '$constants', '$include?', '$copy_class_variables', '$copy_constants', '$define_singleton_method', '$inspect', '$class_exec']);
  return (function($base, $super, $parent_nesting) {
    var self = $klass($base, $super, 'Module');

    var $nesting = [self].concat($parent_nesting), $Module_allocate$1, $Module_initialize$2, $Module_$eq_eq_eq$3, $Module_$lt$4, $Module_$lt_eq$5, $Module_$gt$6, $Module_$gt_eq$7, $Module_$lt_eq_gt$8, $Module_alias_method$9, $Module_alias_native$10, $Module_ancestors$11, $Module_append_features$12, $Module_attr_accessor$13, $Module_attr$14, $Module_attr_reader$15, $Module_attr_writer$16, $Module_autoload$17, $Module_autoload$ques$18, $Module_class_variables$19, $Module_class_variable_get$20, $Module_class_variable_set$21, $Module_class_variable_defined$ques$22, $Module_remove_class_variable$23, $Module_constants$24, $Module_constants$25, $Module_nesting$26, $Module_const_defined$ques$27, $Module_const_get$28, $Module_const_missing$30, $Module_const_set$31, $Module_public_constant$32, $Module_define_method$33, $Module_remove_method$35, $Module_singleton_class$ques$36, $Module_include$37, $Module_included_modules$38, $Module_include$ques$39, $Module_instance_method$40, $Module_instance_methods$41, $Module_included$42, $Module_extended$43, $Module_extend_object$44, $Module_method_added$45, $Module_method_removed$46, $Module_method_undefined$47, $Module_module_eval$48, $Module_module_exec$50, $Module_method_defined$ques$51, $Module_module_function$52, $Module_name$53, $Module_prepend$54, $Module_prepend_features$55, $Module_prepended$56, $Module_remove_const$57, $Module_to_s$58, $Module_undef_method$59, $Module_instance_variables$60, $Module_dup$61, $Module_copy_class_variables$62, $Module_copy_constants$63, $Module_refine$64, $Module_using$66;

    
    Opal.defs(self, '$allocate', $Module_allocate$1 = function $$allocate() {
      var self = this;

      
      var module = Opal.allocate_module(nil, function(){});
      // Link the prototype of Module subclasses
      if (self !== Opal.Module) Object.setPrototypeOf(module, self.$$prototype);
      return module;
    
    }, $Module_allocate$1.$$arity = 0);
    
    Opal.def(self, '$initialize', $Module_initialize$2 = function $$initialize() {
      var $iter = $Module_initialize$2.$$p, block = $iter || nil, self = this;

      if ($iter) $Module_initialize$2.$$p = null;
      
      
      if ($iter) $Module_initialize$2.$$p = null;;
      if ((block !== nil)) {
        return $send(self, 'module_eval', [], block.$to_proc())
      } else {
        return nil
      };
    }, $Module_initialize$2.$$arity = 0);
    
    Opal.def(self, '$===', $Module_$eq_eq_eq$3 = function(object) {
      var self = this;

      
      if ($truthy(object == null)) {
        return false};
      return Opal.is_a(object, self);;
    }, $Module_$eq_eq_eq$3.$$arity = 1);
    
    Opal.def(self, '$<', $Module_$lt$4 = function(other) {
      var self = this;

      
      if ($truthy($$($nesting, 'Module')['$==='](other))) {
      } else {
        self.$raise($$($nesting, 'TypeError'), "compared with non class/module")
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
    }, $Module_$lt$4.$$arity = 1);
    
    Opal.def(self, '$<=', $Module_$lt_eq$5 = function(other) {
      var self = this, $ret_or_1 = nil;

      if ($truthy(($ret_or_1 = self['$equal?'](other)))) {
        return $ret_or_1
      } else {
        return $rb_lt(self, other)
      }
    }, $Module_$lt_eq$5.$$arity = 1);
    
    Opal.def(self, '$>', $Module_$gt$6 = function(other) {
      var self = this;

      
      if ($truthy($$($nesting, 'Module')['$==='](other))) {
      } else {
        self.$raise($$($nesting, 'TypeError'), "compared with non class/module")
      };
      return $rb_lt(other, self);
    }, $Module_$gt$6.$$arity = 1);
    
    Opal.def(self, '$>=', $Module_$gt_eq$7 = function(other) {
      var self = this, $ret_or_2 = nil;

      if ($truthy(($ret_or_2 = self['$equal?'](other)))) {
        return $ret_or_2
      } else {
        return $rb_gt(self, other)
      }
    }, $Module_$gt_eq$7.$$arity = 1);
    
    Opal.def(self, '$<=>', $Module_$lt_eq_gt$8 = function(other) {
      var self = this, lt = nil;

      
      
      if (self === other) {
        return 0;
      }
    ;
      if ($truthy($$($nesting, 'Module')['$==='](other))) {
      } else {
        return nil
      };
      lt = $rb_lt(self, other);
      if ($truthy(lt['$nil?']())) {
        return nil};
      if ($truthy(lt)) {
        return -1
      } else {
        return 1
      };
    }, $Module_$lt_eq_gt$8.$$arity = 1);
    
    Opal.def(self, '$alias_method', $Module_alias_method$9 = function $$alias_method(newname, oldname) {
      var self = this;

      
      newname = $coerce_to(newname, $$($nesting, 'String'), 'to_str');
      oldname = $coerce_to(oldname, $$($nesting, 'String'), 'to_str');
      Opal.alias(self, newname, oldname);
      return self;
    }, $Module_alias_method$9.$$arity = 2);
    
    Opal.def(self, '$alias_native', $Module_alias_native$10 = function $$alias_native(mid, jsid) {
      var self = this;

      
      
      if (jsid == null) {
        jsid = mid;
      };
      Opal.alias_native(self, mid, jsid);
      return self;
    }, $Module_alias_native$10.$$arity = -2);
    
    Opal.def(self, '$ancestors', $Module_ancestors$11 = function $$ancestors() {
      var self = this;

      return Opal.ancestors(self);
    }, $Module_ancestors$11.$$arity = 0);
    
    Opal.def(self, '$append_features', $Module_append_features$12 = function $$append_features(includer) {
      var self = this;

      
      Opal.append_features(self, includer);
      return self;
    }, $Module_append_features$12.$$arity = 1);
    
    Opal.def(self, '$attr_accessor', $Module_attr_accessor$13 = function $$attr_accessor($a) {
      var $post_args, names, self = this;

      
      
      $post_args = Opal.slice.call(arguments, 0, arguments.length);
      
      names = $post_args;;
      $send(self, 'attr_reader', Opal.to_a(names));
      return $send(self, 'attr_writer', Opal.to_a(names));
    }, $Module_attr_accessor$13.$$arity = -1);
    
    Opal.def(self, '$attr', $Module_attr$14 = function $$attr($a) {
      var $post_args, args, self = this;

      
      
      $post_args = Opal.slice.call(arguments, 0, arguments.length);
      
      args = $post_args;;
      
      if (args.length == 2 && (args[1] === true || args[1] === false)) {
        self.$warn("optional boolean argument is obsoleted", $hash2(["uplevel"], {"uplevel": 1}))

        args[1] ? self.$attr_accessor(args[0]) : self.$attr_reader(args[0]);
        return nil;
      }
    ;
      return $send(self, 'attr_reader', Opal.to_a(args));
    }, $Module_attr$14.$$arity = -1);
    
    Opal.def(self, '$attr_reader', $Module_attr_reader$15 = function $$attr_reader($a) {
      var $post_args, names, self = this;

      
      
      $post_args = Opal.slice.call(arguments, 0, arguments.length);
      
      names = $post_args;;
      
      var proto = self.$$prototype;

      for (var i = names.length - 1; i >= 0; i--) {
        var name = names[i],
            id   = '$' + name,
            ivar = Opal.ivar(name);

        // the closure here is needed because name will change at the next
        // cycle, I wish we could use let.
        var body = (function(ivar) {
          return function() {
            if (this[ivar] == null) {
              return nil;
            }
            else {
              return this[ivar];
            }
          };
        })(ivar);

        // initialize the instance variable as nil
        Opal.defineProperty(proto, ivar, nil);

        body.$$parameters = [];
        body.$$arity = 0;

        Opal.defn(self, id, body);
      }
    ;
      return nil;
    }, $Module_attr_reader$15.$$arity = -1);
    
    Opal.def(self, '$attr_writer', $Module_attr_writer$16 = function $$attr_writer($a) {
      var $post_args, names, self = this;

      
      
      $post_args = Opal.slice.call(arguments, 0, arguments.length);
      
      names = $post_args;;
      
      var proto = self.$$prototype;

      for (var i = names.length - 1; i >= 0; i--) {
        var name = names[i],
            id   = '$' + name + '=',
            ivar = Opal.ivar(name);

        // the closure here is needed because name will change at the next
        // cycle, I wish we could use let.
        var body = (function(ivar){
          return function(value) {
            return this[ivar] = value;
          }
        })(ivar);

        body.$$parameters = [['req']];
        body.$$arity = 1;

        // initialize the instance variable as nil
        Opal.defineProperty(proto, ivar, nil);

        Opal.defn(self, id, body);
      }
    ;
      return nil;
    }, $Module_attr_writer$16.$$arity = -1);
    
    Opal.def(self, '$autoload', $Module_autoload$17 = function $$autoload(const$, path) {
      var self = this;

      
      if (!$$($nesting, 'Opal')['$const_name?'](const$)) {
        self.$raise($$($nesting, 'NameError'), "" + "autoload must be constant name: " + (const$))
      }

      if (path == "") {
        self.$raise($$($nesting, 'ArgumentError'), "empty file name")
      }

      if (!self.$$const.hasOwnProperty(const$)) {
        if (!self.$$autoload) {
          self.$$autoload = {};
        }
        Opal.const_cache_version++;
        self.$$autoload[const$] = { path: path, loaded: false, required: false, success: false, exception: false };
      }
      return nil;
    
    }, $Module_autoload$17.$$arity = 2);
    
    Opal.def(self, '$autoload?', $Module_autoload$ques$18 = function(const$) {
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
    
    }, $Module_autoload$ques$18.$$arity = 1);
    
    Opal.def(self, '$class_variables', $Module_class_variables$19 = function $$class_variables() {
      var self = this;

      return Object.keys(Opal.class_variables(self));
    }, $Module_class_variables$19.$$arity = 0);
    
    Opal.def(self, '$class_variable_get', $Module_class_variable_get$20 = function $$class_variable_get(name) {
      var self = this;

      
      name = $$($nesting, 'Opal')['$class_variable_name!'](name);
      return Opal.class_variable_get(self, name, false);;
    }, $Module_class_variable_get$20.$$arity = 1);
    
    Opal.def(self, '$class_variable_set', $Module_class_variable_set$21 = function $$class_variable_set(name, value) {
      var self = this;

      
      name = $$($nesting, 'Opal')['$class_variable_name!'](name);
      return Opal.class_variable_set(self, name, value);;
    }, $Module_class_variable_set$21.$$arity = 2);
    
    Opal.def(self, '$class_variable_defined?', $Module_class_variable_defined$ques$22 = function(name) {
      var self = this;

      
      name = $$($nesting, 'Opal')['$class_variable_name!'](name);
      return Opal.class_variables(self).hasOwnProperty(name);;
    }, $Module_class_variable_defined$ques$22.$$arity = 1);
    
    Opal.def(self, '$remove_class_variable', $Module_remove_class_variable$23 = function $$remove_class_variable(name) {
      var self = this;

      
      name = $$($nesting, 'Opal')['$class_variable_name!'](name);
      
      if (Opal.hasOwnProperty.call(self.$$cvars, name)) {
        var value = self.$$cvars[name];
        delete self.$$cvars[name];
        return value;
      } else {
        self.$raise($$($nesting, 'NameError'), "" + "cannot remove " + (name) + " for " + (self))
      }
    ;
    }, $Module_remove_class_variable$23.$$arity = 1);
    
    Opal.def(self, '$constants', $Module_constants$24 = function $$constants(inherit) {
      var self = this;

      
      
      if (inherit == null) {
        inherit = true;
      };
      return Opal.constants(self, inherit);;
    }, $Module_constants$24.$$arity = -1);
    Opal.defs(self, '$constants', $Module_constants$25 = function $$constants(inherit) {
      var self = this;

      
      ;
      
      if (inherit == null) {
        var nesting = (self.$$nesting || []).concat(Opal.Object),
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
    }, $Module_constants$25.$$arity = -1);
    Opal.defs(self, '$nesting', $Module_nesting$26 = function $$nesting() {
      var self = this;

      return self.$$nesting || [];
    }, $Module_nesting$26.$$arity = 0);
    
    Opal.def(self, '$const_defined?', $Module_const_defined$ques$27 = function(name, inherit) {
      var self = this;

      
      
      if (inherit == null) {
        inherit = true;
      };
      name = $$($nesting, 'Opal')['$const_name!'](name);
      if ($truthy(name['$=~']($$$($$($nesting, 'Opal'), 'CONST_NAME_REGEXP')))) {
      } else {
        self.$raise($$($nesting, 'NameError').$new("" + "wrong constant name " + (name), name))
      };
      
      var module, modules = [self], module_constants, i, ii;

      // Add up ancestors if inherit is true
      if (inherit) {
        modules = modules.concat(Opal.ancestors(self));

        // Add Object's ancestors if it's a module – modules have no ancestors otherwise
        if (self.$$is_module) {
          modules = modules.concat([Opal.Object]).concat(Opal.ancestors(Opal.Object));
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
    }, $Module_const_defined$ques$27.$$arity = -2);
    
    Opal.def(self, '$const_get', $Module_const_get$28 = function $$const_get(name, inherit) {
      var $$29, self = this;

      
      
      if (inherit == null) {
        inherit = true;
      };
      name = $$($nesting, 'Opal')['$const_name!'](name);
      
      if (name.indexOf('::') === 0 && name !== '::'){
        name = name.slice(2);
      }
    ;
      if ($truthy(name.indexOf('::') != -1 && name != '::')) {
        return $send(name.$split("::"), 'inject', [self], ($$29 = function(o, c){var self = $$29.$$s == null ? this : $$29.$$s;

          
          
          if (o == null) {
            o = nil;
          };
          
          if (c == null) {
            c = nil;
          };
          return o.$const_get(c);}, $$29.$$s = self, $$29.$$arity = 2, $$29))};
      if ($truthy(name['$=~']($$$($$($nesting, 'Opal'), 'CONST_NAME_REGEXP')))) {
      } else {
        self.$raise($$($nesting, 'NameError').$new("" + "wrong constant name " + (name), name))
      };
      
      if (inherit) {
        return $$([self], name);
      } else {
        return Opal.const_get_local(self, name);
      }
    ;
    }, $Module_const_get$28.$$arity = -2);
    
    Opal.def(self, '$const_missing', $Module_const_missing$30 = function $$const_missing(name) {
      var self = this, full_const_name = nil;

      
      full_const_name = (function() {if (self['$==']($$($nesting, 'Object'))) {
        return name
      } else {
        return "" + (self) + "::" + (name)
      }; return nil; })();
      return self.$raise($$($nesting, 'NameError').$new("" + "uninitialized constant " + (full_const_name), name));
    }, $Module_const_missing$30.$$arity = 1);
    
    Opal.def(self, '$const_set', $Module_const_set$31 = function $$const_set(name, value) {
      var self = this, $ret_or_3 = nil;

      
      name = $$($nesting, 'Opal')['$const_name!'](name);
      if ($truthy((function() {if ($truthy(($ret_or_3 = name['$!~']($$$($$($nesting, 'Opal'), 'CONST_NAME_REGEXP'))))) {
        return $ret_or_3
      } else {
        return name['$start_with?']("::")
      }; return nil; })())) {
        self.$raise($$($nesting, 'NameError').$new("" + "wrong constant name " + (name), name))};
      Opal.const_set(self, name, value);
      return value;
    }, $Module_const_set$31.$$arity = 2);
    
    Opal.def(self, '$public_constant', $Module_public_constant$32 = function $$public_constant(const_name) {
      var self = this;

      return nil
    }, $Module_public_constant$32.$$arity = 1);
    
    Opal.def(self, '$define_method', $Module_define_method$33 = function $$define_method(name, method) {
      var $iter = $Module_define_method$33.$$p, block = $iter || nil, $$34, self = this, $ret_or_4 = nil, $case = nil;

      if ($iter) $Module_define_method$33.$$p = null;
      
      
      if ($iter) $Module_define_method$33.$$p = null;;
      ;
      if ($truthy(method === undefined && block === nil)) {
        self.$raise($$($nesting, 'ArgumentError'), "tried to create a Proc object without a block")};
      block = (function() {if ($truthy(($ret_or_4 = block))) {
        return $ret_or_4
      } else {
        return (function() {$case = method;
        if ($$($nesting, 'Proc')['$===']($case)) {return method}
        else if ($$($nesting, 'Method')['$===']($case)) {return method.$to_proc().$$unbound}
        else if ($$($nesting, 'UnboundMethod')['$===']($case)) {return $lambda(($$34 = function($a){var self = $$34.$$s == null ? this : $$34.$$s, $post_args, args, bound = nil;

          
          
          $post_args = Opal.slice.call(arguments, 0, arguments.length);
          
          args = $post_args;;
          bound = method.$bind(self);
          return $send(bound, 'call', Opal.to_a(args));}, $$34.$$s = self, $$34.$$arity = -1, $$34))}
        else {return self.$raise($$($nesting, 'TypeError'), "" + "wrong argument type " + (block.$class()) + " (expected Proc/Method)")}})()
      }; return nil; })();
      
      var id = '$' + name;

      block.$$jsid        = name;
      block.$$s           = null;
      block.$$def         = block;
      block.$$define_meth = true;

      Opal.defn(self, id, block);

      return name;
    ;
    }, $Module_define_method$33.$$arity = -2);
    
    Opal.def(self, '$remove_method', $Module_remove_method$35 = function $$remove_method($a) {
      var $post_args, names, self = this;

      
      
      $post_args = Opal.slice.call(arguments, 0, arguments.length);
      
      names = $post_args;;
      
      for (var i = 0, length = names.length; i < length; i++) {
        Opal.rdef(self, "$" + names[i]);
      }
    ;
      return self;
    }, $Module_remove_method$35.$$arity = -1);
    
    Opal.def(self, '$singleton_class?', $Module_singleton_class$ques$36 = function() {
      var self = this;

      return !!self.$$is_singleton;
    }, $Module_singleton_class$ques$36.$$arity = 0);
    
    Opal.def(self, '$include', $Module_include$37 = function $$include($a) {
      var $post_args, mods, self = this;

      
      
      $post_args = Opal.slice.call(arguments, 0, arguments.length);
      
      mods = $post_args;;
      
      for (var i = mods.length - 1; i >= 0; i--) {
        var mod = mods[i];

        if (!mod.$$is_module) {
          self.$raise($$($nesting, 'TypeError'), "" + "wrong argument type " + ((mod).$class()) + " (expected Module)");
        }

        (mod).$append_features(self);
        (mod).$included(self);
      }
    ;
      return self;
    }, $Module_include$37.$$arity = -1);
    
    Opal.def(self, '$included_modules', $Module_included_modules$38 = function $$included_modules() {
      var self = this;

      return Opal.included_modules(self);
    }, $Module_included_modules$38.$$arity = 0);
    
    Opal.def(self, '$include?', $Module_include$ques$39 = function(mod) {
      var self = this;

      
      if (!mod.$$is_module) {
        self.$raise($$($nesting, 'TypeError'), "" + "wrong argument type " + ((mod).$class()) + " (expected Module)");
      }

      var i, ii, mod2, ancestors = Opal.ancestors(self);

      for (i = 0, ii = ancestors.length; i < ii; i++) {
        mod2 = ancestors[i];
        if (mod2 === mod && mod2 !== self) {
          return true;
        }
      }

      return false;
    
    }, $Module_include$ques$39.$$arity = 1);
    
    Opal.def(self, '$instance_method', $Module_instance_method$40 = function $$instance_method(name) {
      var self = this;

      
      var meth = self.$$prototype['$' + name];

      if (!meth || meth.$$stub) {
        self.$raise($$($nesting, 'NameError').$new("" + "undefined method `" + (name) + "' for class `" + (self.$name()) + "'", name));
      }

      return $$($nesting, 'UnboundMethod').$new(self, meth.$$owner || self, meth, name);
    
    }, $Module_instance_method$40.$$arity = 1);
    
    Opal.def(self, '$instance_methods', $Module_instance_methods$41 = function $$instance_methods(include_super) {
      var self = this;

      
      
      if (include_super == null) {
        include_super = true;
      };
      
      if ($truthy(include_super)) {
        return Opal.instance_methods(self);
      } else {
        return Opal.own_instance_methods(self);
      }
    ;
    }, $Module_instance_methods$41.$$arity = -1);
    
    Opal.def(self, '$included', $Module_included$42 = function $$included(mod) {
      var self = this;

      return nil
    }, $Module_included$42.$$arity = 1);
    
    Opal.def(self, '$extended', $Module_extended$43 = function $$extended(mod) {
      var self = this;

      return nil
    }, $Module_extended$43.$$arity = 1);
    
    Opal.def(self, '$extend_object', $Module_extend_object$44 = function $$extend_object(object) {
      var self = this;

      return nil
    }, $Module_extend_object$44.$$arity = 1);
    
    Opal.def(self, '$method_added', $Module_method_added$45 = function $$method_added($a) {
      var $post_args, $rest_arg, self = this;

      
      
      $post_args = Opal.slice.call(arguments, 0, arguments.length);
      
      $rest_arg = $post_args;;
      return nil;
    }, $Module_method_added$45.$$arity = -1);
    
    Opal.def(self, '$method_removed', $Module_method_removed$46 = function $$method_removed($a) {
      var $post_args, $rest_arg, self = this;

      
      
      $post_args = Opal.slice.call(arguments, 0, arguments.length);
      
      $rest_arg = $post_args;;
      return nil;
    }, $Module_method_removed$46.$$arity = -1);
    
    Opal.def(self, '$method_undefined', $Module_method_undefined$47 = function $$method_undefined($a) {
      var $post_args, $rest_arg, self = this;

      
      
      $post_args = Opal.slice.call(arguments, 0, arguments.length);
      
      $rest_arg = $post_args;;
      return nil;
    }, $Module_method_undefined$47.$$arity = -1);
    
    Opal.def(self, '$module_eval', $Module_module_eval$48 = function $$module_eval($a) {
      var $iter = $Module_module_eval$48.$$p, block = $iter || nil, $post_args, args, $b, $$49, self = this, $ret_or_5 = nil, string = nil, file = nil, _lineno = nil, default_eval_options = nil, $ret_or_6 = nil, compiling_options = nil, compiled = nil;

      if ($iter) $Module_module_eval$48.$$p = null;
      
      
      if ($iter) $Module_module_eval$48.$$p = null;;
      
      $post_args = Opal.slice.call(arguments, 0, arguments.length);
      
      args = $post_args;;
      if ($truthy((function() {if ($truthy(($ret_or_5 = block['$nil?']()))) {
        return !!Opal.compile;
      } else {
        return $ret_or_5
      }; return nil; })())) {
        
        if ($truthy($range(1, 3, false)['$cover?'](args.$size()))) {
        } else {
          $$($nesting, 'Kernel').$raise($$($nesting, 'ArgumentError'), "wrong number of arguments (0 for 1..3)")
        };
        $b = [].concat(Opal.to_a(args)), (string = ($b[0] == null ? nil : $b[0])), (file = ($b[1] == null ? nil : $b[1])), (_lineno = ($b[2] == null ? nil : $b[2])), $b;
        default_eval_options = $hash2(["file", "eval"], {"file": (function() {if ($truthy(($ret_or_6 = file))) {
          return $ret_or_6
        } else {
          return "(eval)"
        }; return nil; })(), "eval": true});
        compiling_options = Opal.hash({ arity_check: false }).$merge(default_eval_options);
        compiled = $$($nesting, 'Opal').$compile(string, compiling_options);
        block = $send($$($nesting, 'Kernel'), 'proc', [], ($$49 = function(){var self = $$49.$$s == null ? this : $$49.$$s;

          
          return (function(self) {
            return eval(compiled);
          })(self)
        }, $$49.$$s = self, $$49.$$arity = 0, $$49));
      } else if ($truthy(args['$any?']())) {
        $$($nesting, 'Kernel').$raise($$($nesting, 'ArgumentError'), "" + ("" + "wrong number of arguments (" + (args.$size()) + " for 0)") + "\n\n  NOTE:If you want to enable passing a String argument please add \"require 'opal-parser'\" to your script\n")};
      
      var old = block.$$s,
          result;

      block.$$s = null;
      result = block.apply(self, [self]);
      block.$$s = old;

      return result;
    ;
    }, $Module_module_eval$48.$$arity = -1);
    $alias(self, "class_eval", "module_eval");
    
    Opal.def(self, '$module_exec', $Module_module_exec$50 = function $$module_exec($a) {
      var $iter = $Module_module_exec$50.$$p, block = $iter || nil, $post_args, args, self = this;

      if ($iter) $Module_module_exec$50.$$p = null;
      
      
      if ($iter) $Module_module_exec$50.$$p = null;;
      
      $post_args = Opal.slice.call(arguments, 0, arguments.length);
      
      args = $post_args;;
      
      if (block === nil) {
        self.$raise($$($nesting, 'LocalJumpError'), "no block given")
      }

      var block_self = block.$$s, result;

      block.$$s = null;
      result = block.apply(self, args);
      block.$$s = block_self;

      return result;
    ;
    }, $Module_module_exec$50.$$arity = -1);
    $alias(self, "class_exec", "module_exec");
    
    Opal.def(self, '$method_defined?', $Module_method_defined$ques$51 = function(method) {
      var self = this;

      
      var body = self.$$prototype['$' + method];
      return (!!body) && !body.$$stub;
    
    }, $Module_method_defined$ques$51.$$arity = 1);
    
    Opal.def(self, '$module_function', $Module_module_function$52 = function $$module_function($a) {
      var $post_args, methods, self = this;

      
      
      $post_args = Opal.slice.call(arguments, 0, arguments.length);
      
      methods = $post_args;;
      
      if (methods.length === 0) {
        self.$$module_function = true;
      }
      else {
        for (var i = 0, length = methods.length; i < length; i++) {
          var meth = methods[i],
              id   = '$' + meth,
              func = self.$$prototype[id];

          Opal.defs(self, id, func);
        }
      }

      return self;
    ;
    }, $Module_module_function$52.$$arity = -1);
    
    Opal.def(self, '$name', $Module_name$53 = function $$name() {
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

        if (base === Opal.Object) {
          break;
        }
      }

      if (result.length === 0) {
        return nil;
      }

      return self.$$full_name = result.join('::');
    
    }, $Module_name$53.$$arity = 0);
    
    Opal.def(self, '$prepend', $Module_prepend$54 = function $$prepend($a) {
      var $post_args, mods, self = this;

      
      
      $post_args = Opal.slice.call(arguments, 0, arguments.length);
      
      mods = $post_args;;
      
      if (mods.length === 0) {
        self.$raise($$($nesting, 'ArgumentError'), "wrong number of arguments (given 0, expected 1+)")
      }

      for (var i = mods.length - 1; i >= 0; i--) {
        var mod = mods[i];

        if (!mod.$$is_module) {
          self.$raise($$($nesting, 'TypeError'), "" + "wrong argument type " + ((mod).$class()) + " (expected Module)");
        }

        (mod).$prepend_features(self);
        (mod).$prepended(self);
      }
    ;
      return self;
    }, $Module_prepend$54.$$arity = -1);
    
    Opal.def(self, '$prepend_features', $Module_prepend_features$55 = function $$prepend_features(prepender) {
      var self = this;

      
      
      if (!self.$$is_module) {
        self.$raise($$($nesting, 'TypeError'), "" + "wrong argument type " + (self.$class()) + " (expected Module)");
      }

      Opal.prepend_features(self, prepender)
    ;
      return self;
    }, $Module_prepend_features$55.$$arity = 1);
    
    Opal.def(self, '$prepended', $Module_prepended$56 = function $$prepended(mod) {
      var self = this;

      return nil
    }, $Module_prepended$56.$$arity = 1);
    
    Opal.def(self, '$remove_const', $Module_remove_const$57 = function $$remove_const(name) {
      var self = this;

      return Opal.const_remove(self, name);
    }, $Module_remove_const$57.$$arity = 1);
    
    Opal.def(self, '$to_s', $Module_to_s$58 = function $$to_s() {
      var self = this, $ret_or_7 = nil;

      if ($truthy(($ret_or_7 = Opal.Module.$name.call(self)))) {
        return $ret_or_7
      } else {
        return "" + "#<" + (self.$$is_module ? 'Module' : 'Class') + ":0x" + (self.$__id__().$to_s(16)) + ">"
      }
    }, $Module_to_s$58.$$arity = 0);
    $alias(self, "inspect", "to_s");
    
    Opal.def(self, '$undef_method', $Module_undef_method$59 = function $$undef_method($a) {
      var $post_args, names, self = this;

      
      
      $post_args = Opal.slice.call(arguments, 0, arguments.length);
      
      names = $post_args;;
      
      for (var i = 0, length = names.length; i < length; i++) {
        Opal.udef(self, "$" + names[i]);
      }
    ;
      return self;
    }, $Module_undef_method$59.$$arity = -1);
    
    Opal.def(self, '$instance_variables', $Module_instance_variables$60 = function $$instance_variables() {
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
    }, $Module_instance_variables$60.$$arity = 0);
    
    Opal.def(self, '$dup', $Module_dup$61 = function $$dup() {
      var $iter = $Module_dup$61.$$p, $yield = $iter || nil, self = this, copy = nil;

      if ($iter) $Module_dup$61.$$p = null;
      
      copy = $send2(self, $find_super(self, 'dup', $Module_dup$61, false, true), 'dup', [], $iter);
      copy.$copy_class_variables(self);
      copy.$copy_constants(self);
      return copy;
    }, $Module_dup$61.$$arity = 0);
    
    Opal.def(self, '$copy_class_variables', $Module_copy_class_variables$62 = function $$copy_class_variables(other) {
      var self = this;

      
      for (var name in other.$$cvars) {
        self.$$cvars[name] = other.$$cvars[name];
      }
    
    }, $Module_copy_class_variables$62.$$arity = 1);
    
    Opal.def(self, '$copy_constants', $Module_copy_constants$63 = function $$copy_constants(other) {
      var self = this;

      
      var name, other_constants = other.$$const;

      for (name in other_constants) {
        Opal.const_set(self, name, other_constants[name]);
      }
    
    }, $Module_copy_constants$63.$$arity = 1);
    
    Opal.def(self, '$refine', $Module_refine$64 = function $$refine(mod) {
      var $iter = $Module_refine$64.$$p, block = $iter || nil, $a, $$65, self = this, s = nil, m = nil, mod_id = nil;

      if ($iter) $Module_refine$64.$$p = null;
      
      
      if ($iter) $Module_refine$64.$$p = null;;
      $a = [self, nil, nil], (s = $a[0]), (m = $a[1]), (mod_id = $a[2]), $a;
      
      mod_id = Opal.id(mod);
      if (typeof self.$$refine_modules === "undefined") {
        self.$$refine_modules = {};
      }
      if (typeof self.$$refine_modules[mod_id] === "undefined") {
        m = self.$$refine_modules[mod_id] = $$$('::', 'Module').$new();
      }
      else {
        m = self.$$refine_modules[mod_id];
      }
    ;
      $send(m, 'define_singleton_method', ["inspect"], ($$65 = function(){var self = $$65.$$s == null ? this : $$65.$$s;

        return "" + "#<refinement:" + (mod.$inspect()) + "@" + (s.$inspect()) + ">"}, $$65.$$s = self, $$65.$$arity = 0, $$65));
      $send(m, 'class_exec', [], block.$to_proc());
      return m;
    }, $Module_refine$64.$$arity = 1);
    return (Opal.def(self, '$using', $Module_using$66 = function $$using(mod) {
      var self = this;

      return self.$raise("Module#using is not permitted in methods")
    }, $Module_using$66.$$arity = 1), nil) && 'using';
  })($nesting[0], null, $nesting)
};

Opal.modules["corelib/class"] = function(Opal) {/* Generated by Opal 1.3.0 */
  var self = Opal.top, $nesting = [], nil = Opal.nil, $$$ = Opal.$$$, $$ = Opal.$$, $klass = Opal.klass, $send = Opal.send, $send2 = Opal.send2, $find_super = Opal.find_super, $alias = Opal.alias;

  Opal.add_stubs(['$require', '$class_eval', '$to_proc', '$initialize_copy', '$allocate', '$name', '$to_s']);
  
  self.$require("corelib/module");
  return (function($base, $super, $parent_nesting) {
    var self = $klass($base, $super, 'Class');

    var $nesting = [self].concat($parent_nesting), $Class_new$1, $Class_allocate$2, $Class_inherited$3, $Class_initialize_dup$4, $Class_new$5, $Class_superclass$6, $Class_to_s$7;

    
    Opal.defs(self, '$new', $Class_new$1 = function(superclass) {
      var $iter = $Class_new$1.$$p, block = $iter || nil, self = this;

      if ($iter) $Class_new$1.$$p = null;
      
      
      if ($iter) $Class_new$1.$$p = null;;
      
      if (superclass == null) {
        superclass = $$($nesting, 'Object');
      };
      
      if (!superclass.$$is_class) {
        throw Opal.TypeError.$new("superclass must be a Class");
      }

      var klass = Opal.allocate_class(nil, superclass);
      superclass.$inherited(klass);
      (function() {if ((block !== nil)) {
        return $send((klass), 'class_eval', [], block.$to_proc())
      } else {
        return nil
      }; return nil; })()
      return klass;
    ;
    }, $Class_new$1.$$arity = -1);
    
    Opal.def(self, '$allocate', $Class_allocate$2 = function $$allocate() {
      var self = this;

      
      var obj = new self.$$constructor();
      obj.$$id = Opal.uid();
      return obj;
    
    }, $Class_allocate$2.$$arity = 0);
    
    Opal.def(self, '$inherited', $Class_inherited$3 = function $$inherited(cls) {
      var self = this;

      return nil
    }, $Class_inherited$3.$$arity = 1);
    
    Opal.def(self, '$initialize_dup', $Class_initialize_dup$4 = function $$initialize_dup(original) {
      var self = this;

      
      self.$initialize_copy(original);
      
      self.$$name = null;
      self.$$full_name = null;
    ;
    }, $Class_initialize_dup$4.$$arity = 1);
    
    Opal.def(self, '$new', $Class_new$5 = function($a) {
      var $iter = $Class_new$5.$$p, block = $iter || nil, $post_args, args, self = this;

      if ($iter) $Class_new$5.$$p = null;
      
      
      if ($iter) $Class_new$5.$$p = null;;
      
      $post_args = Opal.slice.call(arguments, 0, arguments.length);
      
      args = $post_args;;
      
      var object = self.$allocate();
      Opal.send(object, object.$initialize, args, block);
      return object;
    ;
    }, $Class_new$5.$$arity = -1);
    
    Opal.def(self, '$superclass', $Class_superclass$6 = function $$superclass() {
      var self = this;

      return self.$$super || nil;
    }, $Class_superclass$6.$$arity = 0);
    
    Opal.def(self, '$to_s', $Class_to_s$7 = function $$to_s() {
      var $iter = $Class_to_s$7.$$p, $yield = $iter || nil, self = this;

      if ($iter) $Class_to_s$7.$$p = null;
      
      var singleton_of = self.$$singleton_of;

      if (singleton_of && singleton_of.$$is_a_module) {
        return "" + "#<Class:" + ((singleton_of).$name()) + ">";
      }
      else if (singleton_of) {
        // a singleton class created from an object
        return "" + "#<Class:#<" + ((singleton_of.$$class).$name()) + ":0x" + ((Opal.id(singleton_of)).$to_s(16)) + ">>";
      }

      return $send2(self, $find_super(self, 'to_s', $Class_to_s$7, false, true), 'to_s', [], null);
    
    }, $Class_to_s$7.$$arity = 0);
    return $alias(self, "inspect", "to_s");
  })($nesting[0], null, $nesting);
};

Opal.modules["corelib/basic_object"] = function(Opal) {/* Generated by Opal 1.3.0 */
  var self = Opal.top, $nesting = [], nil = Opal.nil, $$$ = Opal.$$$, $$ = Opal.$$, $klass = Opal.klass, $alias = Opal.alias, $truthy = Opal.truthy, $range = Opal.range, $hash2 = Opal.hash2, $send = Opal.send;

  Opal.add_stubs(['$==', '$!', '$nil?', '$cover?', '$size', '$raise', '$merge', '$compile', '$proc', '$any?', '$inspect', '$new']);
  return (function($base, $super, $parent_nesting) {
    var self = $klass($base, $super, 'BasicObject');

    var $nesting = [self].concat($parent_nesting), $BasicObject_initialize$1, $BasicObject_$eq_eq$2, $BasicObject_eql$ques$3, $BasicObject___id__$4, $BasicObject___send__$5, $BasicObject_$excl$6, $BasicObject_$not_eq$7, $BasicObject_instance_eval$8, $BasicObject_instance_exec$10, $BasicObject_singleton_method_added$11, $BasicObject_singleton_method_removed$12, $BasicObject_singleton_method_undefined$13, $BasicObject_method_missing$14, $BasicObject_respond_to_missing$ques$15;

    
    
    Opal.def(self, '$initialize', $BasicObject_initialize$1 = function $$initialize($a) {
      var $post_args, $rest_arg, self = this;

      
      
      $post_args = Opal.slice.call(arguments, 0, arguments.length);
      
      $rest_arg = $post_args;;
      return nil;
    }, $BasicObject_initialize$1.$$arity = -1);
    
    Opal.def(self, '$==', $BasicObject_$eq_eq$2 = function(other) {
      var self = this;

      return self === other;
    }, $BasicObject_$eq_eq$2.$$arity = 1);
    
    Opal.def(self, '$eql?', $BasicObject_eql$ques$3 = function(other) {
      var self = this;

      return self['$=='](other)
    }, $BasicObject_eql$ques$3.$$arity = 1);
    $alias(self, "equal?", "==");
    
    Opal.def(self, '$__id__', $BasicObject___id__$4 = function $$__id__() {
      var self = this;

      
      if (self.$$id != null) {
        return self.$$id;
      }
      Opal.defineProperty(self, '$$id', Opal.uid());
      return self.$$id;
    
    }, $BasicObject___id__$4.$$arity = 0);
    
    Opal.def(self, '$__send__', $BasicObject___send__$5 = function $$__send__(symbol, $a) {
      var $iter = $BasicObject___send__$5.$$p, block = $iter || nil, $post_args, args, self = this;

      if ($iter) $BasicObject___send__$5.$$p = null;
      
      
      if ($iter) $BasicObject___send__$5.$$p = null;;
      
      $post_args = Opal.slice.call(arguments, 1, arguments.length);
      
      args = $post_args;;
      
      var func = self['$' + symbol]

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
    }, $BasicObject___send__$5.$$arity = -2);
    
    Opal.def(self, '$!', $BasicObject_$excl$6 = function() {
      var self = this;

      return false
    }, $BasicObject_$excl$6.$$arity = 0);
    
    Opal.def(self, '$!=', $BasicObject_$not_eq$7 = function(other) {
      var self = this;

      return self['$=='](other)['$!']()
    }, $BasicObject_$not_eq$7.$$arity = 1);
    
    Opal.def(self, '$instance_eval', $BasicObject_instance_eval$8 = function $$instance_eval($a) {
      var $iter = $BasicObject_instance_eval$8.$$p, block = $iter || nil, $post_args, args, $b, $$9, self = this, $ret_or_1 = nil, string = nil, file = nil, _lineno = nil, default_eval_options = nil, $ret_or_2 = nil, compiling_options = nil, compiled = nil;

      if ($iter) $BasicObject_instance_eval$8.$$p = null;
      
      
      if ($iter) $BasicObject_instance_eval$8.$$p = null;;
      
      $post_args = Opal.slice.call(arguments, 0, arguments.length);
      
      args = $post_args;;
      if ($truthy((function() {if ($truthy(($ret_or_1 = block['$nil?']()))) {
        return !!Opal.compile;
      } else {
        return $ret_or_1
      }; return nil; })())) {
        
        if ($truthy($range(1, 3, false)['$cover?'](args.$size()))) {
        } else {
          $$$('::', 'Kernel').$raise($$$('::', 'ArgumentError'), "wrong number of arguments (0 for 1..3)")
        };
        $b = [].concat(Opal.to_a(args)), (string = ($b[0] == null ? nil : $b[0])), (file = ($b[1] == null ? nil : $b[1])), (_lineno = ($b[2] == null ? nil : $b[2])), $b;
        default_eval_options = $hash2(["file", "eval"], {"file": (function() {if ($truthy(($ret_or_2 = file))) {
          return $ret_or_2
        } else {
          return "(eval)"
        }; return nil; })(), "eval": true});
        compiling_options = Opal.hash({ arity_check: false }).$merge(default_eval_options);
        compiled = $$$('::', 'Opal').$compile(string, compiling_options);
        block = $send($$$('::', 'Kernel'), 'proc', [], ($$9 = function(){var self = $$9.$$s == null ? this : $$9.$$s;

          
          return (function(self) {
            return eval(compiled);
          })(self)
        }, $$9.$$s = self, $$9.$$arity = 0, $$9));
      } else if ($truthy(args['$any?']())) {
        $$$('::', 'Kernel').$raise($$$('::', 'ArgumentError'), "" + "wrong number of arguments (" + (args.$size()) + " for 0)")};
      
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
    }, $BasicObject_instance_eval$8.$$arity = -1);
    
    Opal.def(self, '$instance_exec', $BasicObject_instance_exec$10 = function $$instance_exec($a) {
      var $iter = $BasicObject_instance_exec$10.$$p, block = $iter || nil, $post_args, args, self = this;

      if ($iter) $BasicObject_instance_exec$10.$$p = null;
      
      
      if ($iter) $BasicObject_instance_exec$10.$$p = null;;
      
      $post_args = Opal.slice.call(arguments, 0, arguments.length);
      
      args = $post_args;;
      if ($truthy(block)) {
      } else {
        $$$('::', 'Kernel').$raise($$$('::', 'ArgumentError'), "no block given")
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
    }, $BasicObject_instance_exec$10.$$arity = -1);
    
    Opal.def(self, '$singleton_method_added', $BasicObject_singleton_method_added$11 = function $$singleton_method_added($a) {
      var $post_args, $rest_arg, self = this;

      
      
      $post_args = Opal.slice.call(arguments, 0, arguments.length);
      
      $rest_arg = $post_args;;
      return nil;
    }, $BasicObject_singleton_method_added$11.$$arity = -1);
    
    Opal.def(self, '$singleton_method_removed', $BasicObject_singleton_method_removed$12 = function $$singleton_method_removed($a) {
      var $post_args, $rest_arg, self = this;

      
      
      $post_args = Opal.slice.call(arguments, 0, arguments.length);
      
      $rest_arg = $post_args;;
      return nil;
    }, $BasicObject_singleton_method_removed$12.$$arity = -1);
    
    Opal.def(self, '$singleton_method_undefined', $BasicObject_singleton_method_undefined$13 = function $$singleton_method_undefined($a) {
      var $post_args, $rest_arg, self = this;

      
      
      $post_args = Opal.slice.call(arguments, 0, arguments.length);
      
      $rest_arg = $post_args;;
      return nil;
    }, $BasicObject_singleton_method_undefined$13.$$arity = -1);
    
    Opal.def(self, '$method_missing', $BasicObject_method_missing$14 = function $$method_missing(symbol, $a) {
      var $iter = $BasicObject_method_missing$14.$$p, block = $iter || nil, $post_args, args, self = this, message = nil;

      if ($iter) $BasicObject_method_missing$14.$$p = null;
      
      
      if ($iter) $BasicObject_method_missing$14.$$p = null;;
      
      $post_args = Opal.slice.call(arguments, 1, arguments.length);
      
      args = $post_args;;
      message = (function() {if ($truthy(self.$inspect && !self.$inspect.$$stub)) {
        return "" + "undefined method `" + (symbol) + "' for " + (self.$inspect()) + ":" + (self.$$class)
      } else {
        return "" + "undefined method `" + (symbol) + "' for " + (self.$$class)
      }; return nil; })();
      return $$$('::', 'Kernel').$raise($$$('::', 'NoMethodError').$new(message, symbol));
    }, $BasicObject_method_missing$14.$$arity = -2);
    return (Opal.def(self, '$respond_to_missing?', $BasicObject_respond_to_missing$ques$15 = function(method_name, include_all) {
      var self = this;

      
      
      if (include_all == null) {
        include_all = false;
      };
      return false;
    }, $BasicObject_respond_to_missing$ques$15.$$arity = -2), nil) && 'respond_to_missing?';
  })($nesting[0], null, $nesting)
};

Opal.modules["corelib/kernel"] = function(Opal) {/* Generated by Opal 1.3.0 */
  function $rb_plus(lhs, rhs) {
    return (typeof(lhs) === 'number' && typeof(rhs) === 'number') ? lhs + rhs : lhs['$+'](rhs);
  }
  function $rb_le(lhs, rhs) {
    return (typeof(lhs) === 'number' && typeof(rhs) === 'number') ? lhs <= rhs : lhs['$<='](rhs);
  }
  function $rb_lt(lhs, rhs) {
    return (typeof(lhs) === 'number' && typeof(rhs) === 'number') ? lhs < rhs : lhs['$<'](rhs);
  }
  var self = Opal.top, $nesting = [], nil = Opal.nil, $$$ = Opal.$$$, $$ = Opal.$$, $truthy = Opal.truthy, $coerce_to = Opal.coerce_to, $respond_to = Opal.respond_to, $module = Opal.module, $gvars = Opal.gvars, $hash2 = Opal.hash2, $send = Opal.send, $alias = Opal.alias, $klass = Opal.klass;

  Opal.add_stubs(['$raise', '$new', '$inspect', '$caller', '$!', '$=~', '$==', '$object_id', '$class', '$coerce_to?', '$<<', '$allocate', '$copy_instance_variables', '$copy_singleton_methods', '$initialize_clone', '$initialize_copy', '$define_method', '$singleton_class', '$to_proc', '$initialize_dup', '$for', '$empty?', '$pop', '$call', '$append_features', '$extend_object', '$extended', '$gets', '$__id__', '$each', '$instance_variables', '$+', '$instance_variable_get', '$to_s', '$instance_variable_name!', '$respond_to?', '$to_int', '$coerce_to!', '$Integer', '$nil?', '$===', '$enum_for', '$result', '$any?', '$print', '$format', '$puts', '$<=', '$length', '$[]', '$readline', '$<', '$first', '$split', '$map', '$to_str', '$exception', '$backtrace', '$rand', '$respond_to_missing?', '$pristine', '$try_convert!', '$expand_path', '$join', '$start_with?', '$new_seed', '$srand', '$tag', '$value', '$open', '$include']);
  
  (function($base, $parent_nesting) {
    var self = $module($base, 'Kernel');

    var $nesting = [self].concat($parent_nesting), $Kernel_method_missing$1, $Kernel_$eq_tilde$2, $Kernel_$excl_tilde$3, $Kernel_$eq_eq_eq$4, $Kernel_$lt_eq_gt$5, $Kernel_method$6, $Kernel_methods$7, $Kernel_public_methods$8, $Kernel_Array$9, $Kernel_at_exit$10, $Kernel_caller$11, $Kernel_class$12, $Kernel_copy_instance_variables$13, $Kernel_copy_singleton_methods$14, $Kernel_clone$15, $Kernel_initialize_clone$16, $Kernel_define_singleton_method$17, $Kernel_dup$18, $Kernel_initialize_dup$19, $Kernel_enum_for$20, $Kernel_equal$ques$21, $Kernel_exit$22, $Kernel_extend$23, $Kernel_gets$24, $Kernel_hash$25, $Kernel_initialize_copy$26, $Kernel_inspect$27, $Kernel_instance_of$ques$29, $Kernel_instance_variable_defined$ques$30, $Kernel_instance_variable_get$31, $Kernel_instance_variable_set$32, $Kernel_remove_instance_variable$33, $Kernel_instance_variables$34, $Kernel_Integer$35, $Kernel_Float$36, $Kernel_Hash$37, $Kernel_is_a$ques$38, $Kernel_itself$39, $Kernel_lambda$40, $Kernel_load$41, $Kernel_loop$42, $Kernel_nil$ques$44, $Kernel_printf$45, $Kernel_proc$46, $Kernel_puts$47, $Kernel_p$48, $Kernel_print$50, $Kernel_readline$51, $Kernel_warn$52, $Kernel_raise$54, $Kernel_rand$55, $Kernel_respond_to$ques$56, $Kernel_respond_to_missing$ques$57, $Kernel_require$58, $Kernel_require_relative$59, $Kernel_require_tree$60, $Kernel_singleton_class$61, $Kernel_sleep$62, $Kernel_srand$63, $Kernel_String$64, $Kernel_tap$65, $Kernel_to_proc$66, $Kernel_to_s$67, $Kernel_catch$68, $Kernel_throw$69, $Kernel_open$70, $Kernel_yield_self$71;

    
    
    Opal.def(self, '$method_missing', $Kernel_method_missing$1 = function $$method_missing(symbol, $a) {
      var $iter = $Kernel_method_missing$1.$$p, block = $iter || nil, $post_args, args, self = this;

      if ($iter) $Kernel_method_missing$1.$$p = null;
      
      
      if ($iter) $Kernel_method_missing$1.$$p = null;;
      
      $post_args = Opal.slice.call(arguments, 1, arguments.length);
      
      args = $post_args;;
      return self.$raise($$($nesting, 'NoMethodError').$new("" + "undefined method `" + (symbol) + "' for " + (self.$inspect()), symbol, args), nil, self.$caller(1));
    }, $Kernel_method_missing$1.$$arity = -2);
    
    Opal.def(self, '$=~', $Kernel_$eq_tilde$2 = function(obj) {
      var self = this;

      return false
    }, $Kernel_$eq_tilde$2.$$arity = 1);
    
    Opal.def(self, '$!~', $Kernel_$excl_tilde$3 = function(obj) {
      var self = this;

      return self['$=~'](obj)['$!']()
    }, $Kernel_$excl_tilde$3.$$arity = 1);
    
    Opal.def(self, '$===', $Kernel_$eq_eq_eq$4 = function(other) {
      var self = this, $ret_or_1 = nil;

      if ($truthy(($ret_or_1 = self.$object_id()['$=='](other.$object_id())))) {
        return $ret_or_1
      } else {
        return self['$=='](other)
      }
    }, $Kernel_$eq_eq_eq$4.$$arity = 1);
    
    Opal.def(self, '$<=>', $Kernel_$lt_eq_gt$5 = function(other) {
      var self = this;

      
      // set guard for infinite recursion
      self.$$comparable = true;

      var x = self['$=='](other);

      if (x && x !== nil) {
        return 0;
      }

      return nil;
    
    }, $Kernel_$lt_eq_gt$5.$$arity = 1);
    
    Opal.def(self, '$method', $Kernel_method$6 = function $$method(name) {
      var self = this;

      
      var meth = self['$' + name];

      if (!meth || meth.$$stub) {
        self.$raise($$($nesting, 'NameError').$new("" + "undefined method `" + (name) + "' for class `" + (self.$class()) + "'", name));
      }

      return $$($nesting, 'Method').$new(self, meth.$$owner || self.$class(), meth, name);
    
    }, $Kernel_method$6.$$arity = 1);
    
    Opal.def(self, '$methods', $Kernel_methods$7 = function $$methods(all) {
      var self = this;

      
      
      if (all == null) {
        all = true;
      };
      
      if ($truthy(all)) {
        return Opal.methods(self);
      } else {
        return Opal.own_methods(self);
      }
    ;
    }, $Kernel_methods$7.$$arity = -1);
    
    Opal.def(self, '$public_methods', $Kernel_public_methods$8 = function $$public_methods(all) {
      var self = this;

      
      
      if (all == null) {
        all = true;
      };
      
      if ($truthy(all)) {
        return Opal.methods(self);
      } else {
        return Opal.receiver_methods(self);
      }
    ;
    }, $Kernel_public_methods$8.$$arity = -1);
    
    Opal.def(self, '$Array', $Kernel_Array$9 = function $$Array(object) {
      var self = this;

      
      var coerced;

      if (object === nil) {
        return [];
      }

      if (object.$$is_array) {
        return object;
      }

      coerced = $$($nesting, 'Opal')['$coerce_to?'](object, $$($nesting, 'Array'), "to_ary");
      if (coerced !== nil) { return coerced; }

      coerced = $$($nesting, 'Opal')['$coerce_to?'](object, $$($nesting, 'Array'), "to_a");
      if (coerced !== nil) { return coerced; }

      return [object];
    
    }, $Kernel_Array$9.$$arity = 1);
    
    Opal.def(self, '$at_exit', $Kernel_at_exit$10 = function $$at_exit() {
      var $iter = $Kernel_at_exit$10.$$p, block = $iter || nil, self = this, $ret_or_2 = nil;
      if ($gvars.__at_exit__ == null) $gvars.__at_exit__ = nil;

      if ($iter) $Kernel_at_exit$10.$$p = null;
      
      
      if ($iter) $Kernel_at_exit$10.$$p = null;;
      $gvars.__at_exit__ = (function() {if ($truthy(($ret_or_2 = $gvars.__at_exit__))) {
        return $ret_or_2
      } else {
        return []
      }; return nil; })();
      $gvars.__at_exit__['$<<'](block);
      return block;
    }, $Kernel_at_exit$10.$$arity = 0);
    
    Opal.def(self, '$caller', $Kernel_caller$11 = function $$caller(start, length) {
      var self = this;

      
      
      if (start == null) {
        start = 1;
      };
      
      if (length == null) {
        length = nil;
      };
      
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
    }, $Kernel_caller$11.$$arity = -1);
    
    Opal.def(self, '$class', $Kernel_class$12 = function() {
      var self = this;

      return self.$$class;
    }, $Kernel_class$12.$$arity = 0);
    
    Opal.def(self, '$copy_instance_variables', $Kernel_copy_instance_variables$13 = function $$copy_instance_variables(other) {
      var self = this;

      
      var keys = Object.keys(other), i, ii, name;
      for (i = 0, ii = keys.length; i < ii; i++) {
        name = keys[i];
        if (name.charAt(0) !== '$' && other.hasOwnProperty(name)) {
          self[name] = other[name];
        }
      }
    
    }, $Kernel_copy_instance_variables$13.$$arity = 1);
    
    Opal.def(self, '$copy_singleton_methods', $Kernel_copy_singleton_methods$14 = function $$copy_singleton_methods(other) {
      var self = this;

      
      var i, name, names, length;

      if (other.hasOwnProperty('$$meta')) {
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
    
    }, $Kernel_copy_singleton_methods$14.$$arity = 1);
    
    Opal.def(self, '$clone', $Kernel_clone$15 = function $$clone($kwargs) {
      var freeze, self = this, copy = nil;

      
      
      if ($kwargs == null) {
        $kwargs = $hash2([], {});
      } else if (!$kwargs.$$is_hash) {
        throw Opal.ArgumentError.$new('expected kwargs');
      };
      
      freeze = $kwargs.$$smap["freeze"];
      if (freeze == null) {
        freeze = true
      };
      copy = self.$class().$allocate();
      copy.$copy_instance_variables(self);
      copy.$copy_singleton_methods(self);
      copy.$initialize_clone(self);
      return copy;
    }, $Kernel_clone$15.$$arity = -1);
    
    Opal.def(self, '$initialize_clone', $Kernel_initialize_clone$16 = function $$initialize_clone(other) {
      var self = this;

      return self.$initialize_copy(other)
    }, $Kernel_initialize_clone$16.$$arity = 1);
    
    Opal.def(self, '$define_singleton_method', $Kernel_define_singleton_method$17 = function $$define_singleton_method(name, method) {
      var $iter = $Kernel_define_singleton_method$17.$$p, block = $iter || nil, self = this;

      if ($iter) $Kernel_define_singleton_method$17.$$p = null;
      
      
      if ($iter) $Kernel_define_singleton_method$17.$$p = null;;
      ;
      return $send(self.$singleton_class(), 'define_method', [name, method], block.$to_proc());
    }, $Kernel_define_singleton_method$17.$$arity = -2);
    
    Opal.def(self, '$dup', $Kernel_dup$18 = function $$dup() {
      var self = this, copy = nil;

      
      copy = self.$class().$allocate();
      copy.$copy_instance_variables(self);
      copy.$initialize_dup(self);
      return copy;
    }, $Kernel_dup$18.$$arity = 0);
    
    Opal.def(self, '$initialize_dup', $Kernel_initialize_dup$19 = function $$initialize_dup(other) {
      var self = this;

      return self.$initialize_copy(other)
    }, $Kernel_initialize_dup$19.$$arity = 1);
    
    Opal.def(self, '$enum_for', $Kernel_enum_for$20 = function $$enum_for($a, $b) {
      var $iter = $Kernel_enum_for$20.$$p, block = $iter || nil, $post_args, method, args, self = this;

      if ($iter) $Kernel_enum_for$20.$$p = null;
      
      
      if ($iter) $Kernel_enum_for$20.$$p = null;;
      
      $post_args = Opal.slice.call(arguments, 0, arguments.length);
      
      if ($post_args.length > 0) {
        method = $post_args[0];
        $post_args.splice(0, 1);
      }
      if (method == null) {
        method = "each";
      };
      
      args = $post_args;;
      return $send($$($nesting, 'Enumerator'), 'for', [self, method].concat(Opal.to_a(args)), block.$to_proc());
    }, $Kernel_enum_for$20.$$arity = -1);
    $alias(self, "to_enum", "enum_for");
    
    Opal.def(self, '$equal?', $Kernel_equal$ques$21 = function(other) {
      var self = this;

      return self === other;
    }, $Kernel_equal$ques$21.$$arity = 1);
    
    Opal.def(self, '$exit', $Kernel_exit$22 = function $$exit(status) {
      var $a, self = this, $ret_or_3 = nil, block = nil;
      if ($gvars.__at_exit__ == null) $gvars.__at_exit__ = nil;

      
      
      if (status == null) {
        status = true;
      };
      $gvars.__at_exit__ = (function() {if ($truthy(($ret_or_3 = $gvars.__at_exit__))) {
        return $ret_or_3
      } else {
        return []
      }; return nil; })();
      while (!($truthy($gvars.__at_exit__['$empty?']()))) {
        
        block = $gvars.__at_exit__.$pop();
        block.$call();
      };
      
      if (status.$$is_boolean) {
        status = status ? 0 : 1;
      } else {
        status = $coerce_to(status, $$($nesting, 'Integer'), 'to_int')
      }

      Opal.exit(status);
    ;
      return nil;
    }, $Kernel_exit$22.$$arity = -1);
    
    Opal.def(self, '$extend', $Kernel_extend$23 = function $$extend($a) {
      var $post_args, mods, self = this;

      
      
      $post_args = Opal.slice.call(arguments, 0, arguments.length);
      
      mods = $post_args;;
      
      var singleton = self.$singleton_class();

      for (var i = mods.length - 1; i >= 0; i--) {
        var mod = mods[i];

        if (!mod.$$is_module) {
          self.$raise($$($nesting, 'TypeError'), "" + "wrong argument type " + ((mod).$class()) + " (expected Module)");
        }

        (mod).$append_features(singleton);
        (mod).$extend_object(self);
        (mod).$extended(self);
      }
    ;
      return self;
    }, $Kernel_extend$23.$$arity = -1);
    
    Opal.def(self, '$gets', $Kernel_gets$24 = function $$gets($a) {
      var $post_args, args, self = this;
      if ($gvars.stdin == null) $gvars.stdin = nil;

      
      
      $post_args = Opal.slice.call(arguments, 0, arguments.length);
      
      args = $post_args;;
      return $send($gvars.stdin, 'gets', Opal.to_a(args));
    }, $Kernel_gets$24.$$arity = -1);
    
    Opal.def(self, '$hash', $Kernel_hash$25 = function $$hash() {
      var self = this;

      return self.$__id__()
    }, $Kernel_hash$25.$$arity = 0);
    
    Opal.def(self, '$initialize_copy', $Kernel_initialize_copy$26 = function $$initialize_copy(other) {
      var self = this;

      return nil
    }, $Kernel_initialize_copy$26.$$arity = 1);
    
    Opal.def(self, '$inspect', $Kernel_inspect$27 = function $$inspect() {
      var $$28, self = this, ivs = nil;

      try {
        
        ivs = "";
        $send(self.$instance_variables(), 'each', [], ($$28 = function(i){var self = $$28.$$s == null ? this : $$28.$$s;

          
          
          if (i == null) {
            i = nil;
          };
          return (ivs = $rb_plus(ivs, "" + " " + (i) + "=" + (self.$instance_variable_get(i).$inspect())));}, $$28.$$s = self, $$28.$$arity = 1, $$28));
        return "" + "#<" + (self.$class()) + ":0x" + (self.$__id__().$to_s(16)) + (ivs) + ">";
      } catch ($err) {
        if (Opal.rescue($err, [$$($nesting, 'StandardError')])) {
          try {
            return "" + "#<" + (self.$class()) + ":0x" + (self.$__id__().$to_s(16)) + ">"
          } finally { Opal.pop_exception(); }
        } else { throw $err; }
      }
    }, $Kernel_inspect$27.$$arity = 0);
    
    Opal.def(self, '$instance_of?', $Kernel_instance_of$ques$29 = function(klass) {
      var self = this;

      
      if (!klass.$$is_class && !klass.$$is_module) {
        self.$raise($$($nesting, 'TypeError'), "class or module required");
      }

      return self.$$class === klass;
    
    }, $Kernel_instance_of$ques$29.$$arity = 1);
    
    Opal.def(self, '$instance_variable_defined?', $Kernel_instance_variable_defined$ques$30 = function(name) {
      var self = this;

      
      name = $$($nesting, 'Opal')['$instance_variable_name!'](name);
      return Opal.hasOwnProperty.call(self, name.substr(1));;
    }, $Kernel_instance_variable_defined$ques$30.$$arity = 1);
    
    Opal.def(self, '$instance_variable_get', $Kernel_instance_variable_get$31 = function $$instance_variable_get(name) {
      var self = this;

      
      name = $$($nesting, 'Opal')['$instance_variable_name!'](name);
      
      var ivar = self[Opal.ivar(name.substr(1))];

      return ivar == null ? nil : ivar;
    ;
    }, $Kernel_instance_variable_get$31.$$arity = 1);
    
    Opal.def(self, '$instance_variable_set', $Kernel_instance_variable_set$32 = function $$instance_variable_set(name, value) {
      var self = this;

      
      name = $$($nesting, 'Opal')['$instance_variable_name!'](name);
      return self[Opal.ivar(name.substr(1))] = value;;
    }, $Kernel_instance_variable_set$32.$$arity = 2);
    
    Opal.def(self, '$remove_instance_variable', $Kernel_remove_instance_variable$33 = function $$remove_instance_variable(name) {
      var self = this;

      
      name = $$($nesting, 'Opal')['$instance_variable_name!'](name);
      
      var key = Opal.ivar(name.substr(1)),
          val;
      if (self.hasOwnProperty(key)) {
        val = self[key];
        delete self[key];
        return val;
      }
    ;
      return self.$raise($$($nesting, 'NameError'), "" + "instance variable " + (name) + " not defined");
    }, $Kernel_remove_instance_variable$33.$$arity = 1);
    
    Opal.def(self, '$instance_variables', $Kernel_instance_variables$34 = function $$instance_variables() {
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
    
    }, $Kernel_instance_variables$34.$$arity = 0);
    
    Opal.def(self, '$Integer', $Kernel_Integer$35 = function $$Integer(value, base) {
      var self = this;

      
      ;
      
      var i, str, base_digits;

      if (!value.$$is_string) {
        if (base !== undefined) {
          self.$raise($$($nesting, 'ArgumentError'), "base specified for non string value")
        }
        if (value === nil) {
          self.$raise($$($nesting, 'TypeError'), "can't convert nil into Integer")
        }
        if (value.$$is_number) {
          if (value === Infinity || value === -Infinity || isNaN(value)) {
            self.$raise($$($nesting, 'FloatDomainError'), value)
          }
          return Math.floor(value);
        }
        if (value['$respond_to?']("to_int")) {
          i = value.$to_int();
          if (i !== nil) {
            return i;
          }
        }
        return $$($nesting, 'Opal')['$coerce_to!'](value, $$($nesting, 'Integer'), "to_i");
      }

      if (value === "0") {
        return 0;
      }

      if (base === undefined) {
        base = 0;
      } else {
        base = $coerce_to(base, $$($nesting, 'Integer'), 'to_int');
        if (base === 1 || base < 0 || base > 36) {
          self.$raise($$($nesting, 'ArgumentError'), "" + "invalid radix " + (base))
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
        self.$raise($$($nesting, 'ArgumentError'), "" + "invalid value for Integer(): \"" + (value) + "\"")
      });

      base = (base === 0 ? 10 : base);

      base_digits = '0-' + (base <= 10 ? base - 1 : '9a-' + String.fromCharCode(97 + (base - 11)));

      if (!(new RegExp('^\\s*[+-]?[' + base_digits + ']+\\s*$')).test(str)) {
        self.$raise($$($nesting, 'ArgumentError'), "" + "invalid value for Integer(): \"" + (value) + "\"")
      }

      i = parseInt(str, base);

      if (isNaN(i)) {
        self.$raise($$($nesting, 'ArgumentError'), "" + "invalid value for Integer(): \"" + (value) + "\"")
      }

      return i;
    ;
    }, $Kernel_Integer$35.$$arity = -2);
    
    Opal.def(self, '$Float', $Kernel_Float$36 = function $$Float(value) {
      var self = this;

      
      var str;

      if (value === nil) {
        self.$raise($$($nesting, 'TypeError'), "can't convert nil into Float")
      }

      if (value.$$is_string) {
        str = value.toString();

        str = str.replace(/(\d)_(?=\d)/g, '$1');

        //Special case for hex strings only:
        if (/^\s*[-+]?0[xX][0-9a-fA-F]+\s*$/.test(str)) {
          return self.$Integer(str);
        }

        if (!/^\s*[-+]?[0-9]*\.?[0-9]+([eE][-+]?[0-9]+)?\s*$/.test(str)) {
          self.$raise($$($nesting, 'ArgumentError'), "" + "invalid value for Float(): \"" + (value) + "\"")
        }

        return parseFloat(str);
      }

      return $$($nesting, 'Opal')['$coerce_to!'](value, $$($nesting, 'Float'), "to_f");
    
    }, $Kernel_Float$36.$$arity = 1);
    
    Opal.def(self, '$Hash', $Kernel_Hash$37 = function $$Hash(arg) {
      var self = this, $ret_or_4 = nil;

      
      if ($truthy((function() {if ($truthy(($ret_or_4 = arg['$nil?']()))) {
        return $ret_or_4
      } else {
        return arg['$==']([])
      }; return nil; })())) {
        return $hash2([], {})};
      if ($truthy($$($nesting, 'Hash')['$==='](arg))) {
        return arg};
      return $$($nesting, 'Opal')['$coerce_to!'](arg, $$($nesting, 'Hash'), "to_hash");
    }, $Kernel_Hash$37.$$arity = 1);
    
    Opal.def(self, '$is_a?', $Kernel_is_a$ques$38 = function(klass) {
      var self = this;

      
      if (!klass.$$is_class && !klass.$$is_module) {
        self.$raise($$($nesting, 'TypeError'), "class or module required");
      }

      return Opal.is_a(self, klass);
    
    }, $Kernel_is_a$ques$38.$$arity = 1);
    
    Opal.def(self, '$itself', $Kernel_itself$39 = function $$itself() {
      var self = this;

      return self
    }, $Kernel_itself$39.$$arity = 0);
    $alias(self, "kind_of?", "is_a?");
    
    Opal.def(self, '$lambda', $Kernel_lambda$40 = function $$lambda() {
      var $iter = $Kernel_lambda$40.$$p, block = $iter || nil, self = this;

      if ($iter) $Kernel_lambda$40.$$p = null;
      
      
      if ($iter) $Kernel_lambda$40.$$p = null;;
      return Opal.lambda(block);;
    }, $Kernel_lambda$40.$$arity = 0);
    
    Opal.def(self, '$load', $Kernel_load$41 = function $$load(file) {
      var self = this;

      
      file = $$($nesting, 'Opal')['$coerce_to!'](file, $$($nesting, 'String'), "to_str");
      return Opal.load(file);
    }, $Kernel_load$41.$$arity = 1);
    
    Opal.def(self, '$loop', $Kernel_loop$42 = function $$loop() {
      var $$43, $a, $iter = $Kernel_loop$42.$$p, $yield = $iter || nil, self = this, e = nil;

      if ($iter) $Kernel_loop$42.$$p = null;
      
      if (($yield !== nil)) {
      } else {
        return $send(self, 'enum_for', ["loop"], ($$43 = function(){var self = $$43.$$s == null ? this : $$43.$$s;

          return $$$($$($nesting, 'Float'), 'INFINITY')}, $$43.$$s = self, $$43.$$arity = 0, $$43))
      };
      while ($truthy(true)) {
        
        try {
          Opal.yieldX($yield, [])
        } catch ($err) {
          if (Opal.rescue($err, [$$($nesting, 'StopIteration')])) {(e = $err)
            try {
              return e.$result()
            } finally { Opal.pop_exception(); }
          } else { throw $err; }
        };
      };
      return self;
    }, $Kernel_loop$42.$$arity = 0);
    
    Opal.def(self, '$nil?', $Kernel_nil$ques$44 = function() {
      var self = this;

      return false
    }, $Kernel_nil$ques$44.$$arity = 0);
    $alias(self, "object_id", "__id__");
    
    Opal.def(self, '$printf', $Kernel_printf$45 = function $$printf($a) {
      var $post_args, args, self = this;

      
      
      $post_args = Opal.slice.call(arguments, 0, arguments.length);
      
      args = $post_args;;
      if ($truthy(args['$any?']())) {
        self.$print($send(self, 'format', Opal.to_a(args)))};
      return nil;
    }, $Kernel_printf$45.$$arity = -1);
    
    Opal.def(self, '$proc', $Kernel_proc$46 = function $$proc() {
      var $iter = $Kernel_proc$46.$$p, block = $iter || nil, self = this;

      if ($iter) $Kernel_proc$46.$$p = null;
      
      
      if ($iter) $Kernel_proc$46.$$p = null;;
      if ($truthy(block)) {
      } else {
        self.$raise($$($nesting, 'ArgumentError'), "tried to create Proc object without a block")
      };
      block.$$is_lambda = false;
      return block;
    }, $Kernel_proc$46.$$arity = 0);
    
    Opal.def(self, '$puts', $Kernel_puts$47 = function $$puts($a) {
      var $post_args, strs, self = this;
      if ($gvars.stdout == null) $gvars.stdout = nil;

      
      
      $post_args = Opal.slice.call(arguments, 0, arguments.length);
      
      strs = $post_args;;
      return $send($gvars.stdout, 'puts', Opal.to_a(strs));
    }, $Kernel_puts$47.$$arity = -1);
    
    Opal.def(self, '$p', $Kernel_p$48 = function $$p($a) {
      var $post_args, args, $$49, self = this;

      
      
      $post_args = Opal.slice.call(arguments, 0, arguments.length);
      
      args = $post_args;;
      $send(args, 'each', [], ($$49 = function(obj){var self = $$49.$$s == null ? this : $$49.$$s;
        if ($gvars.stdout == null) $gvars.stdout = nil;

        
        
        if (obj == null) {
          obj = nil;
        };
        return $gvars.stdout.$puts(obj.$inspect());}, $$49.$$s = self, $$49.$$arity = 1, $$49));
      if ($truthy($rb_le(args.$length(), 1))) {
        return args['$[]'](0)
      } else {
        return args
      };
    }, $Kernel_p$48.$$arity = -1);
    
    Opal.def(self, '$print', $Kernel_print$50 = function $$print($a) {
      var $post_args, strs, self = this;
      if ($gvars.stdout == null) $gvars.stdout = nil;

      
      
      $post_args = Opal.slice.call(arguments, 0, arguments.length);
      
      strs = $post_args;;
      return $send($gvars.stdout, 'print', Opal.to_a(strs));
    }, $Kernel_print$50.$$arity = -1);
    
    Opal.def(self, '$readline', $Kernel_readline$51 = function $$readline($a) {
      var $post_args, args, self = this;
      if ($gvars.stdin == null) $gvars.stdin = nil;

      
      
      $post_args = Opal.slice.call(arguments, 0, arguments.length);
      
      args = $post_args;;
      return $send($gvars.stdin, 'readline', Opal.to_a(args));
    }, $Kernel_readline$51.$$arity = -1);
    
    Opal.def(self, '$warn', $Kernel_warn$52 = function $$warn($a, $b) {
      var $post_args, $kwargs, strs, uplevel, $c, $d, $$53, self = this, location = nil, $ret_or_5 = nil;
      if ($gvars.VERBOSE == null) $gvars.VERBOSE = nil;
      if ($gvars.stderr == null) $gvars.stderr = nil;

      
      
      $post_args = Opal.slice.call(arguments, 0, arguments.length);
      
      $kwargs = Opal.extract_kwargs($post_args);
      
      if ($kwargs == null) {
        $kwargs = $hash2([], {});
      } else if (!$kwargs.$$is_hash) {
        throw Opal.ArgumentError.$new('expected kwargs');
      };
      
      strs = $post_args;;
      
      uplevel = $kwargs.$$smap["uplevel"];
      if (uplevel == null) {
        uplevel = nil
      };
      if ($truthy(uplevel)) {
        
        uplevel = $$($nesting, 'Opal')['$coerce_to!'](uplevel, $$($nesting, 'Integer'), "to_str");
        if ($truthy($rb_lt(uplevel, 0))) {
          self.$raise($$($nesting, 'ArgumentError'), "" + "negative level (" + (uplevel) + ")")};
        location = ($d = ($c = self.$caller($rb_plus(uplevel, 1), 1).$first(), ($c === nil || $c == null) ? nil : $send($c, 'split', [":in `"])), ($d === nil || $d == null) ? nil : $send($d, 'first', []));
        if ($truthy(location)) {
          location = "" + (location) + ": "};
        strs = $send(strs, 'map', [], ($$53 = function(s){var self = $$53.$$s == null ? this : $$53.$$s;

          
          
          if (s == null) {
            s = nil;
          };
          return "" + (location) + "warning: " + (s);}, $$53.$$s = self, $$53.$$arity = 1, $$53));};
      if ($truthy((function() {if ($truthy(($ret_or_5 = $gvars.VERBOSE['$nil?']()))) {
        return $ret_or_5
      } else {
        return strs['$empty?']()
      }; return nil; })())) {
        return nil
      } else {
        return $send($gvars.stderr, 'puts', Opal.to_a(strs))
      };
    }, $Kernel_warn$52.$$arity = -1);
    
    Opal.def(self, '$raise', $Kernel_raise$54 = function $$raise(exception, string, backtrace) {
      var self = this;
      if ($gvars["!"] == null) $gvars["!"] = nil;
      if ($gvars["@"] == null) $gvars["@"] = nil;

      
      ;
      
      if (string == null) {
        string = nil;
      };
      
      if (backtrace == null) {
        backtrace = nil;
      };
      
      if (exception == null && $gvars["!"] !== nil) {
        throw $gvars["!"];
      }
      if (exception == null) {
        exception = $$($nesting, 'RuntimeError').$new("");
      }
      else if ($respond_to(exception, '$to_str')) {
        exception = $$($nesting, 'RuntimeError').$new(exception.$to_str());
      }
      // using respond_to? and not an undefined check to avoid method_missing matching as true
      else if (exception.$$is_class && $respond_to(exception, '$exception')) {
        exception = exception.$exception(string);
      }
      else if (exception.$$is_exception) {
        // exception is fine
      }
      else {
        exception = $$($nesting, 'TypeError').$new("exception class/object expected");
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
    }, $Kernel_raise$54.$$arity = -1);
    $alias(self, "fail", "raise");
    
    Opal.def(self, '$rand', $Kernel_rand$55 = function $$rand(max) {
      var self = this;

      
      ;
      
      if (max === undefined) {
        return $$$($$($nesting, 'Random'), 'DEFAULT').$rand();
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
      return $$$($$($nesting, 'Random'), 'DEFAULT').$rand(max);
    }, $Kernel_rand$55.$$arity = -1);
    
    Opal.def(self, '$respond_to?', $Kernel_respond_to$ques$56 = function(name, include_all) {
      var self = this;

      
      
      if (include_all == null) {
        include_all = false;
      };
      
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
    }, $Kernel_respond_to$ques$56.$$arity = -2);
    
    Opal.def(self, '$respond_to_missing?', $Kernel_respond_to_missing$ques$57 = function(method_name, include_all) {
      var self = this;

      
      
      if (include_all == null) {
        include_all = false;
      };
      return false;
    }, $Kernel_respond_to_missing$ques$57.$$arity = -2);
    $$($nesting, 'Opal').$pristine(self, "respond_to?", "respond_to_missing?");
    
    Opal.def(self, '$require', $Kernel_require$58 = function $$require(file) {
      var self = this;

      
      // As Object.require refers to Kernel.require once Kernel has been loaded the String
      // class may not be available yet, the coercion requires both  String and Array to be loaded.
      if (typeof file !== 'string' && Opal.String && Opal.Array) {
        (file = $$($nesting, 'Opal')['$coerce_to!'](file, $$($nesting, 'String'), "to_str"))
      }
      return Opal.require(file)
    
    }, $Kernel_require$58.$$arity = 1);
    
    Opal.def(self, '$require_relative', $Kernel_require_relative$59 = function $$require_relative(file) {
      var self = this;

      
      $$($nesting, 'Opal')['$try_convert!'](file, $$($nesting, 'String'), "to_str");
      file = $$($nesting, 'File').$expand_path($$($nesting, 'File').$join(Opal.current_file, "..", file));
      return Opal.require(file);
    }, $Kernel_require_relative$59.$$arity = 1);
    
    Opal.def(self, '$require_tree', $Kernel_require_tree$60 = function $$require_tree(path, $kwargs) {
      var autoload, self = this;

      
      
      if ($kwargs == null) {
        $kwargs = $hash2([], {});
      } else if (!$kwargs.$$is_hash) {
        throw Opal.ArgumentError.$new('expected kwargs');
      };
      
      autoload = $kwargs.$$smap["autoload"];
      if (autoload == null) {
        autoload = false
      };
      
      var result = [];

      path = $$($nesting, 'File').$expand_path(path)
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
    }, $Kernel_require_tree$60.$$arity = -2);
    $alias(self, "send", "__send__");
    $alias(self, "public_send", "__send__");
    
    Opal.def(self, '$singleton_class', $Kernel_singleton_class$61 = function $$singleton_class() {
      var self = this;

      return Opal.get_singleton_class(self);
    }, $Kernel_singleton_class$61.$$arity = 0);
    
    Opal.def(self, '$sleep', $Kernel_sleep$62 = function $$sleep(seconds) {
      var self = this;

      
      
      if (seconds == null) {
        seconds = nil;
      };
      
      if (seconds === nil) {
        self.$raise($$($nesting, 'TypeError'), "can't convert NilClass into time interval")
      }
      if (!seconds.$$is_number) {
        self.$raise($$($nesting, 'TypeError'), "" + "can't convert " + (seconds.$class()) + " into time interval")
      }
      if (seconds < 0) {
        self.$raise($$($nesting, 'ArgumentError'), "time interval must be positive")
      }
      var get_time = Opal.global.performance ?
        function() {return performance.now()} :
        function() {return new Date()}

      var t = get_time();
      while (get_time() - t <= seconds * 1000);
      return Math.round(seconds);
    ;
    }, $Kernel_sleep$62.$$arity = -1);
    
    Opal.def(self, '$srand', $Kernel_srand$63 = function $$srand(seed) {
      var self = this;

      
      
      if (seed == null) {
        seed = $$($nesting, 'Random').$new_seed();
      };
      return $$($nesting, 'Random').$srand(seed);
    }, $Kernel_srand$63.$$arity = -1);
    
    Opal.def(self, '$String', $Kernel_String$64 = function $$String(str) {
      var self = this, $ret_or_6 = nil;

      if ($truthy(($ret_or_6 = $$($nesting, 'Opal')['$coerce_to?'](str, $$($nesting, 'String'), "to_str")))) {
        return $ret_or_6
      } else {
        return $$($nesting, 'Opal')['$coerce_to!'](str, $$($nesting, 'String'), "to_s")
      }
    }, $Kernel_String$64.$$arity = 1);
    
    Opal.def(self, '$tap', $Kernel_tap$65 = function $$tap() {
      var $iter = $Kernel_tap$65.$$p, block = $iter || nil, self = this;

      if ($iter) $Kernel_tap$65.$$p = null;
      
      
      if ($iter) $Kernel_tap$65.$$p = null;;
      Opal.yield1(block, self);
      return self;
    }, $Kernel_tap$65.$$arity = 0);
    
    Opal.def(self, '$to_proc', $Kernel_to_proc$66 = function $$to_proc() {
      var self = this;

      return self
    }, $Kernel_to_proc$66.$$arity = 0);
    
    Opal.def(self, '$to_s', $Kernel_to_s$67 = function $$to_s() {
      var self = this;

      return "" + "#<" + (self.$class()) + ":0x" + (self.$__id__().$to_s(16)) + ">"
    }, $Kernel_to_s$67.$$arity = 0);
    
    Opal.def(self, '$catch', $Kernel_catch$68 = function(tag) {
      var $iter = $Kernel_catch$68.$$p, $yield = $iter || nil, self = this, $ret_or_7 = nil, e = nil;

      if ($iter) $Kernel_catch$68.$$p = null;
      
      
      if (tag == null) {
        tag = nil;
      };
      try {
        
        tag = (function() {if ($truthy(($ret_or_7 = tag))) {
          return $ret_or_7
        } else {
          return $$($nesting, 'Object').$new()
        }; return nil; })();
        return Opal.yield1($yield, tag);;
      } catch ($err) {
        if (Opal.rescue($err, [$$($nesting, 'UncaughtThrowError')])) {(e = $err)
          try {
            
            if (e.$tag()['$=='](tag)) {
              return e.$value()};
            return self.$raise();
          } finally { Opal.pop_exception(); }
        } else { throw $err; }
      };
    }, $Kernel_catch$68.$$arity = -1);
    
    Opal.def(self, '$throw', $Kernel_throw$69 = function(tag, obj) {
      var self = this;

      
      
      if (obj == null) {
        obj = nil;
      };
      return self.$raise($$($nesting, 'UncaughtThrowError').$new(tag, obj));
    }, $Kernel_throw$69.$$arity = -2);
    
    Opal.def(self, '$open', $Kernel_open$70 = function $$open($a) {
      var $iter = $Kernel_open$70.$$p, block = $iter || nil, $post_args, args, self = this;

      if ($iter) $Kernel_open$70.$$p = null;
      
      
      if ($iter) $Kernel_open$70.$$p = null;;
      
      $post_args = Opal.slice.call(arguments, 0, arguments.length);
      
      args = $post_args;;
      return $send($$($nesting, 'File'), 'open', Opal.to_a(args), block.$to_proc());
    }, $Kernel_open$70.$$arity = -1);
    
    Opal.def(self, '$yield_self', $Kernel_yield_self$71 = function $$yield_self() {
      var $$72, $iter = $Kernel_yield_self$71.$$p, $yield = $iter || nil, self = this;

      if ($iter) $Kernel_yield_self$71.$$p = null;
      
      if (($yield !== nil)) {
      } else {
        return $send(self, 'enum_for', ["yield_self"], ($$72 = function(){var self = $$72.$$s == null ? this : $$72.$$s;

          return 1}, $$72.$$s = self, $$72.$$arity = 0, $$72))
      };
      return Opal.yield1($yield, self);;
    }, $Kernel_yield_self$71.$$arity = 0);
    $alias(self, "then", "yield_self");
    return $$($nesting, 'Opal').$pristine(self, "method_missing");
  })($nesting[0], $nesting);
  return (function($base, $super, $parent_nesting) {
    var self = $klass($base, $super, 'Object');

    var $nesting = [self].concat($parent_nesting);

    
    delete Opal.Object.$$prototype.$require;
    return self.$include($$($nesting, 'Kernel'));
  })($nesting[0], null, $nesting);
};

Opal.modules["corelib/error"] = function(Opal) {/* Generated by Opal 1.3.0 */
  function $rb_plus(lhs, rhs) {
    return (typeof(lhs) === 'number' && typeof(rhs) === 'number') ? lhs + rhs : lhs['$+'](rhs);
  }
  var self = Opal.top, $nesting = [], nil = Opal.nil, $$$ = Opal.$$$, $$ = Opal.$$, $klass = Opal.klass, $gvars = Opal.gvars, $send = Opal.send, $hash2 = Opal.hash2, $truthy = Opal.truthy, $module = Opal.module, $send2 = Opal.send2, $find_super = Opal.find_super;

  Opal.add_stubs(['$new', '$map', '$backtrace', '$clone', '$to_s', '$tty?', '$include?', '$raise', '$dup', '$!', '$empty?', '$caller', '$shift', '$+', '$class', '$join', '$cause', '$full_message', '$==', '$reverse', '$split', '$attr_reader', '$inspect']);
  
  (function($base, $super, $parent_nesting) {
    var self = $klass($base, $super, 'Exception');

    var $nesting = [self].concat($parent_nesting), $Exception_new$1, $Exception_exception$2, $Exception_initialize$3, $Exception_backtrace$4, $Exception_backtrace_locations$5, $Exception_cause$7, $Exception_exception$8, $Exception_message$9, $Exception_full_message$10, $Exception_inspect$12, $Exception_set_backtrace$13, $Exception_to_s$15;

    self.$$prototype.message = nil;
    
    Opal.defineProperty(self.$$prototype, '$$is_exception', true);
    var stack_trace_limit;
    Opal.defs(self, '$new', $Exception_new$1 = function($a) {
      var $post_args, args, self = this;
      if ($gvars["!"] == null) $gvars["!"] = nil;

      
      
      $post_args = Opal.slice.call(arguments, 0, arguments.length);
      
      args = $post_args;;
      
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
    }, $Exception_new$1.$$arity = -1);
    stack_trace_limit = self.$new;
    Opal.defs(self, '$exception', $Exception_exception$2 = function $$exception($a) {
      var $post_args, args, self = this;

      
      
      $post_args = Opal.slice.call(arguments, 0, arguments.length);
      
      args = $post_args;;
      return $send(self, 'new', Opal.to_a(args));
    }, $Exception_exception$2.$$arity = -1);
    
    Opal.def(self, '$initialize', $Exception_initialize$3 = function $$initialize($a) {
      var $post_args, args, self = this;

      
      
      $post_args = Opal.slice.call(arguments, 0, arguments.length);
      
      args = $post_args;;
      return self.message = (args.length > 0) ? args[0] : nil;;
    }, $Exception_initialize$3.$$arity = -1);
    
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
    
    Opal.def(self, '$backtrace', $Exception_backtrace$4 = function $$backtrace() {
      var self = this;

      
      if (self.backtrace) {
        // nil is a valid backtrace
        return self.backtrace;
      }

      var backtrace = self.stack;

      if (typeof(backtrace) !== 'undefined' && backtrace.$$is_string) {
        return self.backtrace = correct_backtrace(backtrace.split("\n").slice(0, 15));
      }
      else if (backtrace) {
        return self.backtrace = correct_backtrace(backtrace.slice(0, 15));
      }

      return [];
    
    }, $Exception_backtrace$4.$$arity = 0);
    
    Opal.def(self, '$backtrace_locations', $Exception_backtrace_locations$5 = function $$backtrace_locations() {
      var $a, $$6, self = this;

      
      if (self.backtrace_locations) return self.backtrace_locations;
      self.backtrace_locations = ($a = self.$backtrace(), ($a === nil || $a == null) ? nil : $send($a, 'map', [], ($$6 = function(loc){var self = $$6.$$s == null ? this : $$6.$$s;

        
        
        if (loc == null) {
          loc = nil;
        };
        return $$$($$$($$$('::', 'Thread'), 'Backtrace'), 'Location').$new(loc);}, $$6.$$s = self, $$6.$$arity = 1, $$6)))
      return self.backtrace_locations;
    
    }, $Exception_backtrace_locations$5.$$arity = 0);
    
    Opal.def(self, '$cause', $Exception_cause$7 = function $$cause() {
      var self = this;

      return self.cause || nil;
    }, $Exception_cause$7.$$arity = 0);
    
    Opal.def(self, '$exception', $Exception_exception$8 = function $$exception(str) {
      var self = this;

      
      
      if (str == null) {
        str = nil;
      };
      
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
    }, $Exception_exception$8.$$arity = -1);
    
    Opal.def(self, '$message', $Exception_message$9 = function $$message() {
      var self = this;

      return self.$to_s()
    }, $Exception_message$9.$$arity = 0);
    
    Opal.def(self, '$full_message', $Exception_full_message$10 = function $$full_message($kwargs) {
      var highlight, order, $$11, self = this, bold_underline = nil, bold = nil, reset = nil, bt = nil, $ret_or_1 = nil, first = nil, msg = nil;
      if ($gvars.stderr == null) $gvars.stderr = nil;

      
      
      if ($kwargs == null) {
        $kwargs = $hash2([], {});
      } else if (!$kwargs.$$is_hash) {
        throw Opal.ArgumentError.$new('expected kwargs');
      };
      
      highlight = $kwargs.$$smap["highlight"];
      if (highlight == null) {
        highlight = $gvars.stderr['$tty?']()
      };
      
      order = $kwargs.$$smap["order"];
      if (order == null) {
        order = "top"
      };
      if ($truthy([true, false]['$include?'](highlight))) {
      } else {
        self.$raise($$($nesting, 'ArgumentError'), "" + "expected true or false as highlight: " + (highlight))
      };
      if ($truthy(["top", "bottom"]['$include?'](order))) {
      } else {
        self.$raise($$($nesting, 'ArgumentError'), "" + "expected :top or :bottom as order: " + (order))
      };
      if ($truthy(highlight)) {
        
        bold_underline = "\u001b[1;4m";
        bold = "\u001b[1m";
        reset = "\u001b[m";
      } else {
        bold_underline = (bold = (reset = ""))
      };
      bt = self.$backtrace().$dup();
      if ($truthy((function() {if ($truthy(($ret_or_1 = bt['$!']()))) {
        return $ret_or_1
      } else {
        return bt['$empty?']()
      }; return nil; })())) {
        bt = self.$caller()};
      first = bt.$shift();
      msg = "" + (first) + ": ";
      msg = $rb_plus(msg, "" + (bold) + (self.$to_s()) + " (" + (bold_underline) + (self.$class()) + (reset) + (bold) + ")" + (reset) + "\n");
      msg = $rb_plus(msg, $send(bt, 'map', [], ($$11 = function(loc){var self = $$11.$$s == null ? this : $$11.$$s;

        
        
        if (loc == null) {
          loc = nil;
        };
        return "" + "\tfrom " + (loc) + "\n";}, $$11.$$s = self, $$11.$$arity = 1, $$11)).$join());
      if ($truthy(self.$cause())) {
        msg = $rb_plus(msg, self.$cause().$full_message($hash2(["highlight"], {"highlight": highlight})))};
      if (order['$==']("bottom")) {
        
        msg = msg.$split("\n").$reverse().$join("\n");
        msg = $rb_plus("" + (bold) + "Traceback" + (reset) + " (most recent call last):\n", msg);};
      return msg;
    }, $Exception_full_message$10.$$arity = -1);
    
    Opal.def(self, '$inspect', $Exception_inspect$12 = function $$inspect() {
      var self = this, as_str = nil;

      
      as_str = self.$to_s();
      if ($truthy(as_str['$empty?']())) {
        return self.$class().$to_s()
      } else {
        return "" + "#<" + (self.$class().$to_s()) + ": " + (self.$to_s()) + ">"
      };
    }, $Exception_inspect$12.$$arity = 0);
    
    Opal.def(self, '$set_backtrace', $Exception_set_backtrace$13 = function $$set_backtrace(backtrace) {
      var $$14, self = this;

      
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
          self.$raise($$($nesting, 'TypeError'), "backtrace must be Array of String")
        }

        self.backtrace = backtrace;
        self.stack = $send((backtrace), 'map', [], ($$14 = function(i){var self = $$14.$$s == null ? this : $$14.$$s;

        
        
        if (i == null) {
          i = nil;
        };
        return $rb_plus("  from ", i);}, $$14.$$s = self, $$14.$$arity = 1, $$14)).join("\n");
      }

      return backtrace;
    
    }, $Exception_set_backtrace$13.$$arity = 1);
    return (Opal.def(self, '$to_s', $Exception_to_s$15 = function $$to_s() {
      var self = this, $ret_or_2 = nil, $ret_or_3 = nil;

      if ($truthy(($ret_or_2 = (function() {if ($truthy(($ret_or_3 = self.message))) {
        return self.message.$to_s()
      } else {
        return $ret_or_3
      }; return nil; })()))) {
        return $ret_or_2
      } else {
        return self.$class().$to_s()
      }
    }, $Exception_to_s$15.$$arity = 0), nil) && 'to_s';
  })($nesting[0], Error, $nesting);
  (function($base, $super, $parent_nesting) {
    var self = $klass($base, $super, 'ScriptError');

    var $nesting = [self].concat($parent_nesting);

    return nil
  })($nesting[0], $$($nesting, 'Exception'), $nesting);
  (function($base, $super, $parent_nesting) {
    var self = $klass($base, $super, 'SyntaxError');

    var $nesting = [self].concat($parent_nesting);

    return nil
  })($nesting[0], $$($nesting, 'ScriptError'), $nesting);
  (function($base, $super, $parent_nesting) {
    var self = $klass($base, $super, 'LoadError');

    var $nesting = [self].concat($parent_nesting);

    return nil
  })($nesting[0], $$($nesting, 'ScriptError'), $nesting);
  (function($base, $super, $parent_nesting) {
    var self = $klass($base, $super, 'NotImplementedError');

    var $nesting = [self].concat($parent_nesting);

    return nil
  })($nesting[0], $$($nesting, 'ScriptError'), $nesting);
  (function($base, $super, $parent_nesting) {
    var self = $klass($base, $super, 'SystemExit');

    var $nesting = [self].concat($parent_nesting);

    return nil
  })($nesting[0], $$($nesting, 'Exception'), $nesting);
  (function($base, $super, $parent_nesting) {
    var self = $klass($base, $super, 'NoMemoryError');

    var $nesting = [self].concat($parent_nesting);

    return nil
  })($nesting[0], $$($nesting, 'Exception'), $nesting);
  (function($base, $super, $parent_nesting) {
    var self = $klass($base, $super, 'SignalException');

    var $nesting = [self].concat($parent_nesting);

    return nil
  })($nesting[0], $$($nesting, 'Exception'), $nesting);
  (function($base, $super, $parent_nesting) {
    var self = $klass($base, $super, 'Interrupt');

    var $nesting = [self].concat($parent_nesting);

    return nil
  })($nesting[0], $$($nesting, 'SignalException'), $nesting);
  (function($base, $super, $parent_nesting) {
    var self = $klass($base, $super, 'SecurityError');

    var $nesting = [self].concat($parent_nesting);

    return nil
  })($nesting[0], $$($nesting, 'Exception'), $nesting);
  (function($base, $super, $parent_nesting) {
    var self = $klass($base, $super, 'SystemStackError');

    var $nesting = [self].concat($parent_nesting);

    return nil
  })($nesting[0], $$($nesting, 'Exception'), $nesting);
  (function($base, $super, $parent_nesting) {
    var self = $klass($base, $super, 'StandardError');

    var $nesting = [self].concat($parent_nesting);

    return nil
  })($nesting[0], $$($nesting, 'Exception'), $nesting);
  (function($base, $super, $parent_nesting) {
    var self = $klass($base, $super, 'EncodingError');

    var $nesting = [self].concat($parent_nesting);

    return nil
  })($nesting[0], $$($nesting, 'StandardError'), $nesting);
  (function($base, $super, $parent_nesting) {
    var self = $klass($base, $super, 'ZeroDivisionError');

    var $nesting = [self].concat($parent_nesting);

    return nil
  })($nesting[0], $$($nesting, 'StandardError'), $nesting);
  (function($base, $super, $parent_nesting) {
    var self = $klass($base, $super, 'NameError');

    var $nesting = [self].concat($parent_nesting);

    return nil
  })($nesting[0], $$($nesting, 'StandardError'), $nesting);
  (function($base, $super, $parent_nesting) {
    var self = $klass($base, $super, 'NoMethodError');

    var $nesting = [self].concat($parent_nesting);

    return nil
  })($nesting[0], $$($nesting, 'NameError'), $nesting);
  (function($base, $super, $parent_nesting) {
    var self = $klass($base, $super, 'RuntimeError');

    var $nesting = [self].concat($parent_nesting);

    return nil
  })($nesting[0], $$($nesting, 'StandardError'), $nesting);
  (function($base, $super, $parent_nesting) {
    var self = $klass($base, $super, 'FrozenError');

    var $nesting = [self].concat($parent_nesting);

    return nil
  })($nesting[0], $$($nesting, 'RuntimeError'), $nesting);
  (function($base, $super, $parent_nesting) {
    var self = $klass($base, $super, 'LocalJumpError');

    var $nesting = [self].concat($parent_nesting);

    return nil
  })($nesting[0], $$($nesting, 'StandardError'), $nesting);
  (function($base, $super, $parent_nesting) {
    var self = $klass($base, $super, 'TypeError');

    var $nesting = [self].concat($parent_nesting);

    return nil
  })($nesting[0], $$($nesting, 'StandardError'), $nesting);
  (function($base, $super, $parent_nesting) {
    var self = $klass($base, $super, 'ArgumentError');

    var $nesting = [self].concat($parent_nesting);

    return nil
  })($nesting[0], $$($nesting, 'StandardError'), $nesting);
  (function($base, $super, $parent_nesting) {
    var self = $klass($base, $super, 'UncaughtThrowError');

    var $nesting = [self].concat($parent_nesting);

    return nil
  })($nesting[0], $$($nesting, 'ArgumentError'), $nesting);
  (function($base, $super, $parent_nesting) {
    var self = $klass($base, $super, 'IndexError');

    var $nesting = [self].concat($parent_nesting);

    return nil
  })($nesting[0], $$($nesting, 'StandardError'), $nesting);
  (function($base, $super, $parent_nesting) {
    var self = $klass($base, $super, 'StopIteration');

    var $nesting = [self].concat($parent_nesting);

    return nil
  })($nesting[0], $$($nesting, 'IndexError'), $nesting);
  (function($base, $super, $parent_nesting) {
    var self = $klass($base, $super, 'ClosedQueueError');

    var $nesting = [self].concat($parent_nesting);

    return nil
  })($nesting[0], $$($nesting, 'StopIteration'), $nesting);
  (function($base, $super, $parent_nesting) {
    var self = $klass($base, $super, 'KeyError');

    var $nesting = [self].concat($parent_nesting);

    return nil
  })($nesting[0], $$($nesting, 'IndexError'), $nesting);
  (function($base, $super, $parent_nesting) {
    var self = $klass($base, $super, 'RangeError');

    var $nesting = [self].concat($parent_nesting);

    return nil
  })($nesting[0], $$($nesting, 'StandardError'), $nesting);
  (function($base, $super, $parent_nesting) {
    var self = $klass($base, $super, 'FloatDomainError');

    var $nesting = [self].concat($parent_nesting);

    return nil
  })($nesting[0], $$($nesting, 'RangeError'), $nesting);
  (function($base, $super, $parent_nesting) {
    var self = $klass($base, $super, 'IOError');

    var $nesting = [self].concat($parent_nesting);

    return nil
  })($nesting[0], $$($nesting, 'StandardError'), $nesting);
  (function($base, $super, $parent_nesting) {
    var self = $klass($base, $super, 'EOFError');

    var $nesting = [self].concat($parent_nesting);

    return nil
  })($nesting[0], $$($nesting, 'IOError'), $nesting);
  (function($base, $super, $parent_nesting) {
    var self = $klass($base, $super, 'SystemCallError');

    var $nesting = [self].concat($parent_nesting);

    return nil
  })($nesting[0], $$($nesting, 'StandardError'), $nesting);
  (function($base, $super, $parent_nesting) {
    var self = $klass($base, $super, 'RegexpError');

    var $nesting = [self].concat($parent_nesting);

    return nil
  })($nesting[0], $$($nesting, 'StandardError'), $nesting);
  (function($base, $super, $parent_nesting) {
    var self = $klass($base, $super, 'ThreadError');

    var $nesting = [self].concat($parent_nesting);

    return nil
  })($nesting[0], $$($nesting, 'StandardError'), $nesting);
  (function($base, $super, $parent_nesting) {
    var self = $klass($base, $super, 'FiberError');

    var $nesting = [self].concat($parent_nesting);

    return nil
  })($nesting[0], $$($nesting, 'StandardError'), $nesting);
  (function($base, $parent_nesting) {
    var self = $module($base, 'Errno');

    var $nesting = [self].concat($parent_nesting);

    return (function($base, $super, $parent_nesting) {
      var self = $klass($base, $super, 'EINVAL');

      var $nesting = [self].concat($parent_nesting), $EINVAL_new$16;

      return (Opal.defs(self, '$new', $EINVAL_new$16 = function(name) {
        var $iter = $EINVAL_new$16.$$p, $yield = $iter || nil, self = this, message = nil;

        if ($iter) $EINVAL_new$16.$$p = null;
        
        
        if (name == null) {
          name = nil;
        };
        message = "Invalid argument";
        if ($truthy(name)) {
          message = $rb_plus(message, "" + " - " + (name))};
        return $send2(self, $find_super(self, 'new', $EINVAL_new$16, false, true), 'new', [message], null);
      }, $EINVAL_new$16.$$arity = -1), nil) && 'new'
    })($nesting[0], $$($nesting, 'SystemCallError'), $nesting)
  })($nesting[0], $nesting);
  (function($base, $super, $parent_nesting) {
    var self = $klass($base, $super, 'UncaughtThrowError');

    var $nesting = [self].concat($parent_nesting), $UncaughtThrowError_initialize$17;

    self.$$prototype.tag = nil;
    
    self.$attr_reader("tag", "value");
    return (Opal.def(self, '$initialize', $UncaughtThrowError_initialize$17 = function $$initialize(tag, value) {
      var $iter = $UncaughtThrowError_initialize$17.$$p, $yield = $iter || nil, self = this;

      if ($iter) $UncaughtThrowError_initialize$17.$$p = null;
      
      
      if (value == null) {
        value = nil;
      };
      self.tag = tag;
      self.value = value;
      return $send2(self, $find_super(self, 'initialize', $UncaughtThrowError_initialize$17, false, true), 'initialize', ["" + "uncaught throw " + (self.tag.$inspect())], null);
    }, $UncaughtThrowError_initialize$17.$$arity = -2), nil) && 'initialize';
  })($nesting[0], $$($nesting, 'ArgumentError'), $nesting);
  (function($base, $super, $parent_nesting) {
    var self = $klass($base, $super, 'NameError');

    var $nesting = [self].concat($parent_nesting), $NameError_initialize$18;

    
    self.$attr_reader("name");
    return (Opal.def(self, '$initialize', $NameError_initialize$18 = function $$initialize(message, name) {
      var $iter = $NameError_initialize$18.$$p, $yield = $iter || nil, self = this;

      if ($iter) $NameError_initialize$18.$$p = null;
      
      
      if (name == null) {
        name = nil;
      };
      $send2(self, $find_super(self, 'initialize', $NameError_initialize$18, false, true), 'initialize', [message], null);
      return (self.name = name);
    }, $NameError_initialize$18.$$arity = -2), nil) && 'initialize';
  })($nesting[0], null, $nesting);
  (function($base, $super, $parent_nesting) {
    var self = $klass($base, $super, 'NoMethodError');

    var $nesting = [self].concat($parent_nesting), $NoMethodError_initialize$19;

    
    self.$attr_reader("args");
    return (Opal.def(self, '$initialize', $NoMethodError_initialize$19 = function $$initialize(message, name, args) {
      var $iter = $NoMethodError_initialize$19.$$p, $yield = $iter || nil, self = this;

      if ($iter) $NoMethodError_initialize$19.$$p = null;
      
      
      if (name == null) {
        name = nil;
      };
      
      if (args == null) {
        args = [];
      };
      $send2(self, $find_super(self, 'initialize', $NoMethodError_initialize$19, false, true), 'initialize', [message, name], null);
      return (self.args = args);
    }, $NoMethodError_initialize$19.$$arity = -2), nil) && 'initialize';
  })($nesting[0], null, $nesting);
  (function($base, $super, $parent_nesting) {
    var self = $klass($base, $super, 'StopIteration');

    var $nesting = [self].concat($parent_nesting);

    return self.$attr_reader("result")
  })($nesting[0], null, $nesting);
  (function($base, $super, $parent_nesting) {
    var self = $klass($base, $super, 'KeyError');

    var $nesting = [self].concat($parent_nesting), $KeyError_initialize$20, $KeyError_receiver$21, $KeyError_key$22;

    self.$$prototype.receiver = self.$$prototype.key = nil;
    
    
    Opal.def(self, '$initialize', $KeyError_initialize$20 = function $$initialize(message, $kwargs) {
      var receiver, key, $iter = $KeyError_initialize$20.$$p, $yield = $iter || nil, self = this;

      if ($iter) $KeyError_initialize$20.$$p = null;
      
      
      if ($kwargs == null) {
        $kwargs = $hash2([], {});
      } else if (!$kwargs.$$is_hash) {
        throw Opal.ArgumentError.$new('expected kwargs');
      };
      
      receiver = $kwargs.$$smap["receiver"];
      if (receiver == null) {
        receiver = nil
      };
      
      key = $kwargs.$$smap["key"];
      if (key == null) {
        key = nil
      };
      $send2(self, $find_super(self, 'initialize', $KeyError_initialize$20, false, true), 'initialize', [message], null);
      self.receiver = receiver;
      return (self.key = key);
    }, $KeyError_initialize$20.$$arity = -2);
    
    Opal.def(self, '$receiver', $KeyError_receiver$21 = function $$receiver() {
      var self = this, $ret_or_4 = nil;

      if ($truthy(($ret_or_4 = self.receiver))) {
        return $ret_or_4
      } else {
        return self.$raise($$($nesting, 'ArgumentError'), "no receiver is available")
      }
    }, $KeyError_receiver$21.$$arity = 0);
    return (Opal.def(self, '$key', $KeyError_key$22 = function $$key() {
      var self = this, $ret_or_5 = nil;

      if ($truthy(($ret_or_5 = self.key))) {
        return $ret_or_5
      } else {
        return self.$raise($$($nesting, 'ArgumentError'), "no key is available")
      }
    }, $KeyError_key$22.$$arity = 0), nil) && 'key';
  })($nesting[0], null, $nesting);
  return (function($base, $parent_nesting) {
    var self = $module($base, 'JS');

    var $nesting = [self].concat($parent_nesting);

    return (function($base, $super, $parent_nesting) {
      var self = $klass($base, $super, 'Error');

      var $nesting = [self].concat($parent_nesting);

      return nil
    })($nesting[0], null, $nesting)
  })($nesting[0], $nesting);
};

Opal.modules["corelib/constants"] = function(Opal) {/* Generated by Opal 1.3.0 */
  var self = Opal.top, $nesting = [], nil = Opal.nil, $$$ = Opal.$$$, $$ = Opal.$$;

  
  Opal.const_set($nesting[0], 'RUBY_PLATFORM', "opal");
  Opal.const_set($nesting[0], 'RUBY_ENGINE', "opal");
  Opal.const_set($nesting[0], 'RUBY_VERSION', "3.0.2");
  Opal.const_set($nesting[0], 'RUBY_ENGINE_VERSION', "1.3.0");
  Opal.const_set($nesting[0], 'RUBY_RELEASE_DATE', "2021-10-27");
  Opal.const_set($nesting[0], 'RUBY_PATCHLEVEL', 0);
  Opal.const_set($nesting[0], 'RUBY_REVISION', "0");
  Opal.const_set($nesting[0], 'RUBY_COPYRIGHT', "opal - Copyright (C) 2013-2021 Adam Beynon and the Opal contributors");
  return Opal.const_set($nesting[0], 'RUBY_DESCRIPTION', "" + "opal " + ($$($nesting, 'RUBY_ENGINE_VERSION')) + " (" + ($$($nesting, 'RUBY_RELEASE_DATE')) + " revision " + ($$($nesting, 'RUBY_REVISION')) + ")");
};

Opal.modules["opal/base"] = function(Opal) {/* Generated by Opal 1.3.0 */
  var self = Opal.top, $nesting = [], nil = Opal.nil, $$$ = Opal.$$$, $$ = Opal.$$;

  Opal.add_stubs(['$require']);
  
  self.$require("corelib/runtime");
  self.$require("corelib/helpers");
  self.$require("corelib/module");
  self.$require("corelib/class");
  self.$require("corelib/basic_object");
  self.$require("corelib/kernel");
  self.$require("corelib/error");
  return self.$require("corelib/constants");
};

Opal.modules["corelib/nil"] = function(Opal) {/* Generated by Opal 1.3.0 */
  function $rb_gt(lhs, rhs) {
    return (typeof(lhs) === 'number' && typeof(rhs) === 'number') ? lhs > rhs : lhs['$>'](rhs);
  }
  var self = Opal.top, $nesting = [], nil = Opal.nil, $$$ = Opal.$$$, $$ = Opal.$$, $klass = Opal.klass, $hash2 = Opal.hash2, $alias = Opal.alias, $truthy = Opal.truthy;

  Opal.add_stubs(['$raise', '$name', '$new', '$>', '$length', '$Rational']);
  
  (function($base, $super, $parent_nesting) {
    var self = $klass($base, $super, 'NilClass');

    var $nesting = [self].concat($parent_nesting), $NilClass_$excl$2, $NilClass_$$3, $NilClass_$$4, $NilClass_$$5, $NilClass_$eq_eq$6, $NilClass_dup$7, $NilClass_clone$8, $NilClass_inspect$9, $NilClass_nil$ques$10, $NilClass_singleton_class$11, $NilClass_to_a$12, $NilClass_to_h$13, $NilClass_to_i$14, $NilClass_to_s$15, $NilClass_to_c$16, $NilClass_rationalize$17, $NilClass_to_r$18, $NilClass_instance_variables$19;

    
    self.$$prototype.$$meta = self;
    (function(self, $parent_nesting) {
      var $nesting = [self].concat($parent_nesting), $allocate$1;

      
      
      Opal.def(self, '$allocate', $allocate$1 = function $$allocate() {
        var self = this;

        return self.$raise($$($nesting, 'TypeError'), "" + "allocator undefined for " + (self.$name()))
      }, $allocate$1.$$arity = 0);
      
      
      Opal.udef(self, '$' + "new");;
      return nil;;
    })(Opal.get_singleton_class(self), $nesting);
    
    Opal.def(self, '$!', $NilClass_$excl$2 = function() {
      var self = this;

      return true
    }, $NilClass_$excl$2.$$arity = 0);
    
    Opal.def(self, '$&', $NilClass_$$3 = function(other) {
      var self = this;

      return false
    }, $NilClass_$$3.$$arity = 1);
    
    Opal.def(self, '$|', $NilClass_$$4 = function(other) {
      var self = this;

      return other !== false && other !== nil;
    }, $NilClass_$$4.$$arity = 1);
    
    Opal.def(self, '$^', $NilClass_$$5 = function(other) {
      var self = this;

      return other !== false && other !== nil;
    }, $NilClass_$$5.$$arity = 1);
    
    Opal.def(self, '$==', $NilClass_$eq_eq$6 = function(other) {
      var self = this;

      return other === nil;
    }, $NilClass_$eq_eq$6.$$arity = 1);
    
    Opal.def(self, '$dup', $NilClass_dup$7 = function $$dup() {
      var self = this;

      return nil
    }, $NilClass_dup$7.$$arity = 0);
    
    Opal.def(self, '$clone', $NilClass_clone$8 = function $$clone($kwargs) {
      var freeze, self = this;

      
      
      if ($kwargs == null) {
        $kwargs = $hash2([], {});
      } else if (!$kwargs.$$is_hash) {
        throw Opal.ArgumentError.$new('expected kwargs');
      };
      
      freeze = $kwargs.$$smap["freeze"];
      if (freeze == null) {
        freeze = true
      };
      return nil;
    }, $NilClass_clone$8.$$arity = -1);
    
    Opal.def(self, '$inspect', $NilClass_inspect$9 = function $$inspect() {
      var self = this;

      return "nil"
    }, $NilClass_inspect$9.$$arity = 0);
    
    Opal.def(self, '$nil?', $NilClass_nil$ques$10 = function() {
      var self = this;

      return true
    }, $NilClass_nil$ques$10.$$arity = 0);
    
    Opal.def(self, '$singleton_class', $NilClass_singleton_class$11 = function $$singleton_class() {
      var self = this;

      return $$($nesting, 'NilClass')
    }, $NilClass_singleton_class$11.$$arity = 0);
    
    Opal.def(self, '$to_a', $NilClass_to_a$12 = function $$to_a() {
      var self = this;

      return []
    }, $NilClass_to_a$12.$$arity = 0);
    
    Opal.def(self, '$to_h', $NilClass_to_h$13 = function $$to_h() {
      var self = this;

      return Opal.hash();
    }, $NilClass_to_h$13.$$arity = 0);
    
    Opal.def(self, '$to_i', $NilClass_to_i$14 = function $$to_i() {
      var self = this;

      return 0
    }, $NilClass_to_i$14.$$arity = 0);
    $alias(self, "to_f", "to_i");
    
    Opal.def(self, '$to_s', $NilClass_to_s$15 = function $$to_s() {
      var self = this;

      return ""
    }, $NilClass_to_s$15.$$arity = 0);
    
    Opal.def(self, '$to_c', $NilClass_to_c$16 = function $$to_c() {
      var self = this;

      return $$($nesting, 'Complex').$new(0, 0)
    }, $NilClass_to_c$16.$$arity = 0);
    
    Opal.def(self, '$rationalize', $NilClass_rationalize$17 = function $$rationalize($a) {
      var $post_args, args, self = this;

      
      
      $post_args = Opal.slice.call(arguments, 0, arguments.length);
      
      args = $post_args;;
      if ($truthy($rb_gt(args.$length(), 1))) {
        self.$raise($$($nesting, 'ArgumentError'))};
      return self.$Rational(0, 1);
    }, $NilClass_rationalize$17.$$arity = -1);
    
    Opal.def(self, '$to_r', $NilClass_to_r$18 = function $$to_r() {
      var self = this;

      return self.$Rational(0, 1)
    }, $NilClass_to_r$18.$$arity = 0);
    return (Opal.def(self, '$instance_variables', $NilClass_instance_variables$19 = function $$instance_variables() {
      var self = this;

      return []
    }, $NilClass_instance_variables$19.$$arity = 0), nil) && 'instance_variables';
  })($nesting[0], null, $nesting);
  return Opal.const_set($nesting[0], 'NIL', nil);
};

Opal.modules["corelib/boolean"] = function(Opal) {/* Generated by Opal 1.3.0 */
  var self = Opal.top, $nesting = [], nil = Opal.nil, $$$ = Opal.$$$, $$ = Opal.$$, $klass = Opal.klass, $alias = Opal.alias, $hash2 = Opal.hash2, $truthy = Opal.truthy, $send2 = Opal.send2, $find_super = Opal.find_super;

  Opal.add_stubs(['$raise', '$name']);
  
  (function($base, $super, $parent_nesting) {
    var self = $klass($base, $super, 'Boolean');

    var $nesting = [self].concat($parent_nesting), $Boolean___id__$2, $Boolean_$excl$3, $Boolean_$$4, $Boolean_$$5, $Boolean_$$6, $Boolean_$eq_eq$7, $Boolean_singleton_class$8, $Boolean_to_s$9, $Boolean_dup$10, $Boolean_clone$11, $Boolean_method_missing$12, $Boolean_respond_to_missing$ques$13;

    
    Opal.defineProperty(self.$$prototype, '$$is_boolean', true);
    
    var properties = ['$$class', '$$meta'];

    for (var i = 0; i < properties.length; i++) {
      Object.defineProperty(self.$$prototype, properties[i], {
        configurable: true,
        enumerable: false,
        get: function() {
          return this == true  ? Opal.TrueClass :
                 this == false ? Opal.FalseClass :
                                 Opal.Boolean;
        }
      });
    }

    Object.defineProperty(self.$$prototype, "$$id", {
      configurable: true,
      enumerable: false,
      get: function() {
        return this == true  ? 2 :
               this == false ? 0 :
                               nil;
      }
    });
  ;
    (function(self, $parent_nesting) {
      var $nesting = [self].concat($parent_nesting), $allocate$1;

      
      
      Opal.def(self, '$allocate', $allocate$1 = function $$allocate() {
        var self = this;

        return self.$raise($$($nesting, 'TypeError'), "" + "allocator undefined for " + (self.$name()))
      }, $allocate$1.$$arity = 0);
      
      
      Opal.udef(self, '$' + "new");;
      return nil;;
    })(Opal.get_singleton_class(self), $nesting);
    
    Opal.def(self, '$__id__', $Boolean___id__$2 = function $$__id__() {
      var self = this;

      return self.valueOf() ? 2 : 0;
    }, $Boolean___id__$2.$$arity = 0);
    $alias(self, "object_id", "__id__");
    
    Opal.def(self, '$!', $Boolean_$excl$3 = function() {
      var self = this;

      return self != true;
    }, $Boolean_$excl$3.$$arity = 0);
    
    Opal.def(self, '$&', $Boolean_$$4 = function(other) {
      var self = this;

      return (self == true) ? (other !== false && other !== nil) : false;
    }, $Boolean_$$4.$$arity = 1);
    
    Opal.def(self, '$|', $Boolean_$$5 = function(other) {
      var self = this;

      return (self == true) ? true : (other !== false && other !== nil);
    }, $Boolean_$$5.$$arity = 1);
    
    Opal.def(self, '$^', $Boolean_$$6 = function(other) {
      var self = this;

      return (self == true) ? (other === false || other === nil) : (other !== false && other !== nil);
    }, $Boolean_$$6.$$arity = 1);
    
    Opal.def(self, '$==', $Boolean_$eq_eq$7 = function(other) {
      var self = this;

      return (self == true) === other.valueOf();
    }, $Boolean_$eq_eq$7.$$arity = 1);
    $alias(self, "equal?", "==");
    $alias(self, "eql?", "==");
    
    Opal.def(self, '$singleton_class', $Boolean_singleton_class$8 = function $$singleton_class() {
      var self = this;

      return self.$$meta;
    }, $Boolean_singleton_class$8.$$arity = 0);
    
    Opal.def(self, '$to_s', $Boolean_to_s$9 = function $$to_s() {
      var self = this;

      return (self == true) ? 'true' : 'false';
    }, $Boolean_to_s$9.$$arity = 0);
    $alias(self, "inspect", "to_s");
    
    Opal.def(self, '$dup', $Boolean_dup$10 = function $$dup() {
      var self = this;

      return self
    }, $Boolean_dup$10.$$arity = 0);
    
    Opal.def(self, '$clone', $Boolean_clone$11 = function $$clone($kwargs) {
      var freeze, self = this;

      
      
      if ($kwargs == null) {
        $kwargs = $hash2([], {});
      } else if (!$kwargs.$$is_hash) {
        throw Opal.ArgumentError.$new('expected kwargs');
      };
      
      freeze = $kwargs.$$smap["freeze"];
      if (freeze == null) {
        freeze = true
      };
      return self;
    }, $Boolean_clone$11.$$arity = -1);
    
    Opal.def(self, '$method_missing', $Boolean_method_missing$12 = function $$method_missing(method, $a) {
      var $iter = $Boolean_method_missing$12.$$p, block = $iter || nil, $post_args, args, self = this;

      if ($iter) $Boolean_method_missing$12.$$p = null;
      
      
      if ($iter) $Boolean_method_missing$12.$$p = null;;
      
      $post_args = Opal.slice.call(arguments, 1, arguments.length);
      
      args = $post_args;;
      var body = self.$$class.$$prototype['$' + method];
      if ($truthy(typeof body !== 'undefined' && !body.$$stub)) {
      } else {
        $send2(self, $find_super(self, 'method_missing', $Boolean_method_missing$12, false, true), 'method_missing', [method].concat(Opal.to_a(args)), $iter)
      };
      return Opal.send(self, body, args, block);
    }, $Boolean_method_missing$12.$$arity = -2);
    return (Opal.def(self, '$respond_to_missing?', $Boolean_respond_to_missing$ques$13 = function(method, _include_all) {
      var self = this;

      
      
      if (_include_all == null) {
        _include_all = false;
      };
      var body = self.$$class.$$prototype['$' + method];
      return typeof body !== 'undefined' && !body.$$stub;;
    }, $Boolean_respond_to_missing$ques$13.$$arity = -2), nil) && 'respond_to_missing?';
  })($nesting[0], Boolean, $nesting);
  (function($base, $super, $parent_nesting) {
    var self = $klass($base, $super, 'TrueClass');

    var $nesting = [self].concat($parent_nesting);

    return nil
  })($nesting[0], $$($nesting, 'Boolean'), $nesting);
  (function($base, $super, $parent_nesting) {
    var self = $klass($base, $super, 'FalseClass');

    var $nesting = [self].concat($parent_nesting);

    return nil
  })($nesting[0], $$($nesting, 'Boolean'), $nesting);
  Opal.const_set($nesting[0], 'TRUE', true);
  return Opal.const_set($nesting[0], 'FALSE', false);
};

Opal.modules["corelib/comparable"] = function(Opal) {/* Generated by Opal 1.3.0 */
  function $rb_gt(lhs, rhs) {
    return (typeof(lhs) === 'number' && typeof(rhs) === 'number') ? lhs > rhs : lhs['$>'](rhs);
  }
  function $rb_lt(lhs, rhs) {
    return (typeof(lhs) === 'number' && typeof(rhs) === 'number') ? lhs < rhs : lhs['$<'](rhs);
  }
  var self = Opal.top, $nesting = [], nil = Opal.nil, $$$ = Opal.$$$, $$ = Opal.$$, $falsy = Opal.falsy, $module = Opal.module, $truthy = Opal.truthy;

  Opal.add_stubs(['$>', '$<', '$===', '$raise', '$class', '$<=>', '$equal?']);
  return (function($base, $parent_nesting) {
    var self = $module($base, 'Comparable');

    var $nesting = [self].concat($parent_nesting), $Comparable_$eq_eq$1, $Comparable_$gt$2, $Comparable_$gt_eq$3, $Comparable_$lt$4, $Comparable_$lt_eq$5, $Comparable_between$ques$6, $Comparable_clamp$7, $case = nil;

    
    
    function normalize(what) {
      if (Opal.is_a(what, Opal.Integer)) { return what; }

      if ($rb_gt(what, 0)) { return 1; }
      if ($rb_lt(what, 0)) { return -1; }
      return 0;
    }

    function fail_comparison(lhs, rhs) {
      var class_name;
      (function() {$case = rhs;
    if (nil['$===']($case) || true['$===']($case) || false['$===']($case) || $$($nesting, 'Integer')['$===']($case) || $$($nesting, 'Float')['$===']($case)) {return class_name = rhs.$inspect();}
    else {return class_name = rhs.$$class;}})()
      self.$raise($$($nesting, 'ArgumentError'), "" + "comparison of " + ((lhs).$class()) + " with " + (class_name) + " failed")
    }

    function cmp_or_fail(lhs, rhs) {
      var cmp = (lhs)['$<=>'](rhs);
      if ($falsy(cmp)) fail_comparison(lhs, rhs);
      return normalize(cmp);
    }
  ;
    
    Opal.def(self, '$==', $Comparable_$eq_eq$1 = function(other) {
      var self = this, cmp = nil;

      
      if ($truthy(self['$equal?'](other))) {
        return true};
      
      if (self["$<=>"] == Opal.Kernel["$<=>"]) {
        return false;
      }

      // check for infinite recursion
      if (self.$$comparable) {
        delete self.$$comparable;
        return false;
      }
    ;
      if ($truthy((cmp = self['$<=>'](other)))) {
      } else {
        return false
      };
      return normalize(cmp) == 0;;
    }, $Comparable_$eq_eq$1.$$arity = 1);
    
    Opal.def(self, '$>', $Comparable_$gt$2 = function(other) {
      var self = this;

      return cmp_or_fail(self, other) > 0;
    }, $Comparable_$gt$2.$$arity = 1);
    
    Opal.def(self, '$>=', $Comparable_$gt_eq$3 = function(other) {
      var self = this;

      return cmp_or_fail(self, other) >= 0;
    }, $Comparable_$gt_eq$3.$$arity = 1);
    
    Opal.def(self, '$<', $Comparable_$lt$4 = function(other) {
      var self = this;

      return cmp_or_fail(self, other) < 0;
    }, $Comparable_$lt$4.$$arity = 1);
    
    Opal.def(self, '$<=', $Comparable_$lt_eq$5 = function(other) {
      var self = this;

      return cmp_or_fail(self, other) <= 0;
    }, $Comparable_$lt_eq$5.$$arity = 1);
    
    Opal.def(self, '$between?', $Comparable_between$ques$6 = function(min, max) {
      var self = this;

      
      if ($rb_lt(self, min)) {
        return false};
      if ($rb_gt(self, max)) {
        return false};
      return true;
    }, $Comparable_between$ques$6.$$arity = 2);
    return (Opal.def(self, '$clamp', $Comparable_clamp$7 = function $$clamp(min, max) {
      var self = this;

      
      
      if (max == null) {
        max = nil;
      };
      
      var c, excl;

      if (max === nil) {
        // We are dealing with a new Ruby 2.7 behaviour that we are able to
        // provide a single Range argument instead of 2 Comparables.

        if (!Opal.is_a(min, Opal.Range)) {
          self.$raise($$($nesting, 'TypeError'), "" + "wrong argument type " + (min.$class()) + " (expected Range)")
        }

        excl = min.excl;
        max = min.end;
        min = min.begin;

        if (max !== nil && excl) {
          self.$raise($$($nesting, 'ArgumentError'), "cannot clamp with an exclusive range")
        }
      }

      if (min !== nil && max !== nil && cmp_or_fail(min, max) > 0) {
        self.$raise($$($nesting, 'ArgumentError'), "min argument must be smaller than max argument")
      }

      if (min !== nil) {
        c = cmp_or_fail(self, min);

        if (c == 0) return self;
        if (c < 0) return min;
      }

      if (max !== nil) {
        c = cmp_or_fail(self, max);

        if (c > 0) return max;
      }

      return self;
    ;
    }, $Comparable_clamp$7.$$arity = -2), nil) && 'clamp';
  })($nesting[0], $nesting)
};

Opal.modules["corelib/regexp"] = function(Opal) {/* Generated by Opal 1.3.0 */
  function $rb_plus(lhs, rhs) {
    return (typeof(lhs) === 'number' && typeof(rhs) === 'number') ? lhs + rhs : lhs['$+'](rhs);
  }
  function $rb_minus(lhs, rhs) {
    return (typeof(lhs) === 'number' && typeof(rhs) === 'number') ? lhs - rhs : lhs['$-'](rhs);
  }
  var self = Opal.top, $nesting = [], nil = Opal.nil, $$$ = Opal.$$$, $$ = Opal.$$, $coerce_to = Opal.coerce_to, $klass = Opal.klass, $send2 = Opal.send2, $find_super = Opal.find_super, $truthy = Opal.truthy, $gvars = Opal.gvars, $alias = Opal.alias, $send = Opal.send;

  Opal.add_stubs(['$nil?', '$[]', '$raise', '$escape', '$options', '$to_str', '$new', '$join', '$coerce_to!', '$!', '$match', '$coerce_to?', '$begin', '$uniq', '$map', '$scan', '$source', '$to_proc', '$transform_values', '$group_by', '$each_with_index', '$+', '$last', '$=~', '$attr_reader', '$include?', '$names', '$regexp', '$named_captures', '$===', '$captures', '$-', '$inspect', '$empty?', '$each', '$to_a']);
  
  (function($base, $super, $parent_nesting) {
    var self = $klass($base, $super, 'RegexpError');

    var $nesting = [self].concat($parent_nesting);

    return nil
  })($nesting[0], $$($nesting, 'StandardError'), $nesting);
  (function($base, $super, $parent_nesting) {
    var self = $klass($base, $super, 'Regexp');

    var $nesting = [self].concat($parent_nesting), $Regexp_$eq_eq$6, $Regexp_$eq_eq_eq$7, $Regexp_$eq_tilde$8, $Regexp_inspect$9, $Regexp_match$10, $Regexp_match$ques$11, $Regexp_names$12, $Regexp_named_captures$13, $Regexp_$$16, $Regexp_source$17, $Regexp_options$18, $Regexp_casefold$ques$19;

    
    Opal.const_set($nesting[0], 'IGNORECASE', 1);
    Opal.const_set($nesting[0], 'EXTENDED', 2);
    Opal.const_set($nesting[0], 'MULTILINE', 4);
    Opal.defineProperty(self.$$prototype, '$$is_regexp', true);
    (function(self, $parent_nesting) {
      var $nesting = [self].concat($parent_nesting), $allocate$1, $escape$2, $last_match$3, $union$4, $new$5;

      
      
      Opal.def(self, '$allocate', $allocate$1 = function $$allocate() {
        var $iter = $allocate$1.$$p, $yield = $iter || nil, self = this, allocated = nil;

        if ($iter) $allocate$1.$$p = null;
        
        allocated = $send2(self, $find_super(self, 'allocate', $allocate$1, false, true), 'allocate', [], $iter);
        allocated.uninitialized = true;
        return allocated;
      }, $allocate$1.$$arity = 0);
      
      Opal.def(self, '$escape', $escape$2 = function $$escape(string) {
        var self = this;

        return Opal.escape_regexp(string);
      }, $escape$2.$$arity = 1);
      
      Opal.def(self, '$last_match', $last_match$3 = function $$last_match(n) {
        var self = this;
        if ($gvars["~"] == null) $gvars["~"] = nil;

        
        
        if (n == null) {
          n = nil;
        };
        if ($truthy(n['$nil?']())) {
          return $gvars["~"]
        } else if ($truthy($gvars["~"])) {
          return $gvars["~"]['$[]'](n)
        } else {
          return nil
        };
      }, $last_match$3.$$arity = -1);
      $alias(self, "quote", "escape");
      
      Opal.def(self, '$union', $union$4 = function $$union($a) {
        var $post_args, parts, self = this;

        
        
        $post_args = Opal.slice.call(arguments, 0, arguments.length);
        
        parts = $post_args;;
        
        var is_first_part_array, quoted_validated, part, options, each_part_options;
        if (parts.length == 0) {
          return /(?!)/;
        }
        // return fast if there's only one element
        if (parts.length == 1 && parts[0].$$is_regexp) {
          return parts[0];
        }
        // cover the 2 arrays passed as arguments case
        is_first_part_array = parts[0].$$is_array;
        if (parts.length > 1 && is_first_part_array) {
          self.$raise($$($nesting, 'TypeError'), "no implicit conversion of Array into String")
        }
        // deal with splat issues (related to https://github.com/opal/opal/issues/858)
        if (is_first_part_array) {
          parts = parts[0];
        }
        options = undefined;
        quoted_validated = [];
        for (var i=0; i < parts.length; i++) {
          part = parts[i];
          if (part.$$is_string) {
            quoted_validated.push(self.$escape(part));
          }
          else if (part.$$is_regexp) {
            each_part_options = (part).$options();
            if (options != undefined && options != each_part_options) {
              self.$raise($$($nesting, 'TypeError'), "All expressions must use the same options")
            }
            options = each_part_options;
            quoted_validated.push('('+part.source+')');
          }
          else {
            quoted_validated.push(self.$escape((part).$to_str()));
          }
        }
      ;
        return self.$new((quoted_validated).$join("|"), options);
      }, $union$4.$$arity = -1);
      
      Opal.def(self, '$new', $new$5 = function(regexp, options) {
        var self = this;

        
        ;
        
        if (regexp.$$is_regexp) {
          return new RegExp(regexp);
        }

        regexp = $$($nesting, 'Opal')['$coerce_to!'](regexp, $$($nesting, 'String'), "to_str");

        if (regexp.charAt(regexp.length - 1) === '\\' && regexp.charAt(regexp.length - 2) !== '\\') {
          self.$raise($$($nesting, 'RegexpError'), "" + "too short escape sequence: /" + (regexp) + "/")
        }

        if (options === undefined || options['$!']()) {
          return new RegExp(regexp);
        }

        if (options.$$is_number) {
          var temp = '';
          if ($$($nesting, 'IGNORECASE') & options) { temp += 'i'; }
          if ($$($nesting, 'MULTILINE')  & options) { temp += 'm'; }
          options = temp;
        }
        else {
          options = 'i';
        }

        return new RegExp(regexp, options);
      ;
      }, $new$5.$$arity = -2);
      return $alias(self, "compile", "new");
    })(Opal.get_singleton_class(self), $nesting);
    
    Opal.def(self, '$==', $Regexp_$eq_eq$6 = function(other) {
      var self = this;

      return other instanceof RegExp && self.toString() === other.toString();
    }, $Regexp_$eq_eq$6.$$arity = 1);
    
    Opal.def(self, '$===', $Regexp_$eq_eq_eq$7 = function(string) {
      var self = this;

      return self.$match($$($nesting, 'Opal')['$coerce_to?'](string, $$($nesting, 'String'), "to_str")) !== nil
    }, $Regexp_$eq_eq_eq$7.$$arity = 1);
    
    Opal.def(self, '$=~', $Regexp_$eq_tilde$8 = function(string) {
      var self = this, $ret_or_1 = nil;
      if ($gvars["~"] == null) $gvars["~"] = nil;

      if ($truthy(($ret_or_1 = self.$match(string)))) {
        return $gvars["~"].$begin(0)
      } else {
        return $ret_or_1
      }
    }, $Regexp_$eq_tilde$8.$$arity = 1);
    $alias(self, "eql?", "==");
    
    Opal.def(self, '$inspect', $Regexp_inspect$9 = function $$inspect() {
      var self = this;

      
      var regexp_format = /^\/(.*)\/([^\/]*)$/;
      var value = self.toString();
      var matches = regexp_format.exec(value);
      if (matches) {
        var regexp_pattern = matches[1];
        var regexp_flags = matches[2];
        var chars = regexp_pattern.split('');
        var chars_length = chars.length;
        var char_escaped = false;
        var regexp_pattern_escaped = '';
        for (var i = 0; i < chars_length; i++) {
          var current_char = chars[i];
          if (!char_escaped && current_char == '/') {
            regexp_pattern_escaped = regexp_pattern_escaped.concat('\\');
          }
          regexp_pattern_escaped = regexp_pattern_escaped.concat(current_char);
          if (current_char == '\\') {
            if (char_escaped) {
              // does not over escape
              char_escaped = false;
            } else {
              char_escaped = true;
            }
          } else {
            char_escaped = false;
          }
        }
        return '/' + regexp_pattern_escaped + '/' + regexp_flags;
      } else {
        return value;
      }
    
    }, $Regexp_inspect$9.$$arity = 0);
    
    Opal.def(self, '$match', $Regexp_match$10 = function $$match(string, pos) {
      var $iter = $Regexp_match$10.$$p, block = $iter || nil, self = this;
      if ($gvars["~"] == null) $gvars["~"] = nil;

      if ($iter) $Regexp_match$10.$$p = null;
      
      
      if ($iter) $Regexp_match$10.$$p = null;;
      ;
      
      if (self.uninitialized) {
        self.$raise($$($nesting, 'TypeError'), "uninitialized Regexp")
      }

      if (pos === undefined) {
        if (string === nil) return ($gvars["~"] = nil);
        var m = self.exec($coerce_to(string, $$($nesting, 'String'), 'to_str'));
        if (m) {
          ($gvars["~"] = $$($nesting, 'MatchData').$new(self, m));
          return block === nil ? $gvars["~"] : Opal.yield1(block, $gvars["~"]);
        } else {
          return ($gvars["~"] = nil);
        }
      }

      pos = $coerce_to(pos, $$($nesting, 'Integer'), 'to_int');

      if (string === nil) {
        return ($gvars["~"] = nil);
      }

      string = $coerce_to(string, $$($nesting, 'String'), 'to_str');

      if (pos < 0) {
        pos += string.length;
        if (pos < 0) {
          return ($gvars["~"] = nil);
        }
      }

      // global RegExp maintains state, so not using self/this
      var md, re = Opal.global_regexp(self);

      while (true) {
        md = re.exec(string);
        if (md === null) {
          return ($gvars["~"] = nil);
        }
        if (md.index >= pos) {
          ($gvars["~"] = $$($nesting, 'MatchData').$new(re, md));
          return block === nil ? $gvars["~"] : Opal.yield1(block, $gvars["~"]);
        }
        re.lastIndex = md.index + 1;
      }
    ;
    }, $Regexp_match$10.$$arity = -2);
    
    Opal.def(self, '$match?', $Regexp_match$ques$11 = function(string, pos) {
      var self = this;

      
      ;
      
      if (self.uninitialized) {
        self.$raise($$($nesting, 'TypeError'), "uninitialized Regexp")
      }

      if (pos === undefined) {
        return string === nil ? false : self.test($coerce_to(string, $$($nesting, 'String'), 'to_str'));
      }

      pos = $coerce_to(pos, $$($nesting, 'Integer'), 'to_int');

      if (string === nil) {
        return false;
      }

      string = $coerce_to(string, $$($nesting, 'String'), 'to_str');

      if (pos < 0) {
        pos += string.length;
        if (pos < 0) {
          return false;
        }
      }

      // global RegExp maintains state, so not using self/this
      var md, re = Opal.global_regexp(self);

      md = re.exec(string);
      if (md === null || md.index < pos) {
        return false;
      } else {
        return true;
      }
    ;
    }, $Regexp_match$ques$11.$$arity = -2);
    
    Opal.def(self, '$names', $Regexp_names$12 = function $$names() {
      var self = this;

      return $send(self.$source().$scan(/\(?<(\w+)>/), 'map', [], "first".$to_proc()).$uniq()
    }, $Regexp_names$12.$$arity = 0);
    
    Opal.def(self, '$named_captures', $Regexp_named_captures$13 = function $$named_captures() {
      var $$14, self = this;

      return $send($send($send(self.$source().$scan(/\(?<(\w+)>/), 'map', [], "first".$to_proc()).$each_with_index(), 'group_by', [], "first".$to_proc()), 'transform_values', [], ($$14 = function(i){var self = $$14.$$s == null ? this : $$14.$$s, $$15;

        
        
        if (i == null) {
          i = nil;
        };
        return $send(i, 'map', [], ($$15 = function(j){var self = $$15.$$s == null ? this : $$15.$$s;

          
          
          if (j == null) {
            j = nil;
          };
          return $rb_plus(j.$last(), 1);}, $$15.$$s = self, $$15.$$arity = 1, $$15));}, $$14.$$s = self, $$14.$$arity = 1, $$14))
    }, $Regexp_named_captures$13.$$arity = 0);
    
    Opal.def(self, '$~', $Regexp_$$16 = function() {
      var self = this;
      if ($gvars._ == null) $gvars._ = nil;

      return self['$=~']($gvars._)
    }, $Regexp_$$16.$$arity = 0);
    
    Opal.def(self, '$source', $Regexp_source$17 = function $$source() {
      var self = this;

      return self.source;
    }, $Regexp_source$17.$$arity = 0);
    
    Opal.def(self, '$options', $Regexp_options$18 = function $$options() {
      var self = this;

      
      if (self.uninitialized) {
        self.$raise($$($nesting, 'TypeError'), "uninitialized Regexp")
      }
      var result = 0;
      // should be supported in IE6 according to https://msdn.microsoft.com/en-us/library/7f5z26w4(v=vs.94).aspx
      if (self.multiline) {
        result |= $$($nesting, 'MULTILINE');
      }
      if (self.ignoreCase) {
        result |= $$($nesting, 'IGNORECASE');
      }
      return result;
    
    }, $Regexp_options$18.$$arity = 0);
    
    Opal.def(self, '$casefold?', $Regexp_casefold$ques$19 = function() {
      var self = this;

      return self.ignoreCase;
    }, $Regexp_casefold$ques$19.$$arity = 0);
    return $alias(self, "to_s", "source");
  })($nesting[0], RegExp, $nesting);
  return (function($base, $super, $parent_nesting) {
    var self = $klass($base, $super, 'MatchData');

    var $nesting = [self].concat($parent_nesting), $MatchData_initialize$20, $MatchData_$$$21, $MatchData_offset$22, $MatchData_$eq_eq$23, $MatchData_begin$24, $MatchData_end$25, $MatchData_captures$26, $MatchData_named_captures$27, $MatchData_names$29, $MatchData_inspect$30, $MatchData_length$32, $MatchData_to_a$33, $MatchData_to_s$34, $MatchData_values_at$35;

    self.$$prototype.matches = nil;
    
    self.$attr_reader("post_match", "pre_match", "regexp", "string");
    
    Opal.def(self, '$initialize', $MatchData_initialize$20 = function $$initialize(regexp, match_groups) {
      var self = this;

      
      $gvars["~"] = self;
      self.regexp = regexp;
      self.begin = match_groups.index;
      self.string = match_groups.input;
      self.pre_match = match_groups.input.slice(0, match_groups.index);
      self.post_match = match_groups.input.slice(match_groups.index + match_groups[0].length);
      self.matches = [];
      
      for (var i = 0, length = match_groups.length; i < length; i++) {
        var group = match_groups[i];

        if (group == null) {
          self.matches.push(nil);
        }
        else {
          self.matches.push(group);
        }
      }
    ;
    }, $MatchData_initialize$20.$$arity = 2);
    
    Opal.def(self, '$[]', $MatchData_$$$21 = function($a) {
      var $post_args, args, self = this;

      
      
      $post_args = Opal.slice.call(arguments, 0, arguments.length);
      
      args = $post_args;;
      
      if (args[0].$$is_string) {
        if (self.$regexp().$names()['$include?'](args['$[]'](0))['$!']()) {
          self.$raise($$($nesting, 'IndexError'), "" + "undefined group name reference: " + (args['$[]'](0)))
        }
        return self.$named_captures()['$[]'](args['$[]'](0))
      }
      else {
        return $send(self.matches, '[]', Opal.to_a(args))
      }
    ;
    }, $MatchData_$$$21.$$arity = -1);
    
    Opal.def(self, '$offset', $MatchData_offset$22 = function $$offset(n) {
      var self = this;

      
      if (n !== 0) {
        self.$raise($$($nesting, 'ArgumentError'), "MatchData#offset only supports 0th element")
      }
      return [self.begin, self.begin + self.matches[n].length];
    
    }, $MatchData_offset$22.$$arity = 1);
    
    Opal.def(self, '$==', $MatchData_$eq_eq$23 = function(other) {
      var self = this, $ret_or_2 = nil, $ret_or_3 = nil, $ret_or_4 = nil, $ret_or_5 = nil;

      
      if ($truthy($$($nesting, 'MatchData')['$==='](other))) {
      } else {
        return false
      };
      if ($truthy(($ret_or_2 = (function() {if ($truthy(($ret_or_3 = (function() {if ($truthy(($ret_or_4 = (function() {if ($truthy(($ret_or_5 = self.string == other.string))) {
        return self.regexp.toString() == other.regexp.toString();
      } else {
        return $ret_or_5
      }; return nil; })()))) {
        return self.pre_match == other.pre_match;
      } else {
        return $ret_or_4
      }; return nil; })()))) {
        return self.post_match == other.post_match;
      } else {
        return $ret_or_3
      }; return nil; })()))) {
        return self.begin == other.begin;
      } else {
        return $ret_or_2
      };
    }, $MatchData_$eq_eq$23.$$arity = 1);
    $alias(self, "eql?", "==");
    
    Opal.def(self, '$begin', $MatchData_begin$24 = function $$begin(n) {
      var self = this;

      
      if (n !== 0) {
        self.$raise($$($nesting, 'ArgumentError'), "MatchData#begin only supports 0th element")
      }
      return self.begin;
    
    }, $MatchData_begin$24.$$arity = 1);
    
    Opal.def(self, '$end', $MatchData_end$25 = function $$end(n) {
      var self = this;

      
      if (n !== 0) {
        self.$raise($$($nesting, 'ArgumentError'), "MatchData#end only supports 0th element")
      }
      return self.begin + self.matches[n].length;
    
    }, $MatchData_end$25.$$arity = 1);
    
    Opal.def(self, '$captures', $MatchData_captures$26 = function $$captures() {
      var self = this;

      return self.matches.slice(1)
    }, $MatchData_captures$26.$$arity = 0);
    
    Opal.def(self, '$named_captures', $MatchData_named_captures$27 = function $$named_captures() {
      var $$28, self = this, matches = nil;

      
      matches = self.$captures();
      return $send(self.$regexp().$named_captures(), 'transform_values', [], ($$28 = function(i){var self = $$28.$$s == null ? this : $$28.$$s;

        
        
        if (i == null) {
          i = nil;
        };
        return matches['$[]']($rb_minus(i.$last(), 1));}, $$28.$$s = self, $$28.$$arity = 1, $$28));
    }, $MatchData_named_captures$27.$$arity = 0);
    
    Opal.def(self, '$names', $MatchData_names$29 = function $$names() {
      var self = this;

      return self.$regexp().$names()
    }, $MatchData_names$29.$$arity = 0);
    
    Opal.def(self, '$inspect', $MatchData_inspect$30 = function $$inspect() {
      var $$31, self = this;

      
      var str = "#<MatchData " + (self.matches[0]).$inspect();

      if (self.$regexp().$names()['$empty?']()) {
        for (var i = 1, length = self.matches.length; i < length; i++) {
          str += " " + i + ":" + (self.matches[i]).$inspect();
        }
      }
      else {
        $send(self.$named_captures(), 'each', [], ($$31 = function(k, v){var self = $$31.$$s == null ? this : $$31.$$s;

        
        
        if (k == null) {
          k = nil;
        };
        
        if (v == null) {
          v = nil;
        };
        return                str += " " + k + ":" + v.$inspect();}, $$31.$$s = self, $$31.$$arity = 2, $$31))
      }

      return str + ">";
    
    }, $MatchData_inspect$30.$$arity = 0);
    
    Opal.def(self, '$length', $MatchData_length$32 = function $$length() {
      var self = this;

      return self.matches.length
    }, $MatchData_length$32.$$arity = 0);
    $alias(self, "size", "length");
    
    Opal.def(self, '$to_a', $MatchData_to_a$33 = function $$to_a() {
      var self = this;

      return self.matches
    }, $MatchData_to_a$33.$$arity = 0);
    
    Opal.def(self, '$to_s', $MatchData_to_s$34 = function $$to_s() {
      var self = this;

      return self.matches[0]
    }, $MatchData_to_s$34.$$arity = 0);
    return (Opal.def(self, '$values_at', $MatchData_values_at$35 = function $$values_at($a) {
      var $post_args, args, self = this;

      
      
      $post_args = Opal.slice.call(arguments, 0, arguments.length);
      
      args = $post_args;;
      
      var i, a, index, values = [];

      for (i = 0; i < args.length; i++) {

        if (args[i].$$is_range) {
          a = (args[i]).$to_a();
          a.unshift(i, 1);
          Array.prototype.splice.apply(args, a);
        }

        index = $$($nesting, 'Opal')['$coerce_to!'](args[i], $$($nesting, 'Integer'), "to_int");

        if (index < 0) {
          index += self.matches.length;
          if (index < 0) {
            values.push(nil);
            continue;
          }
        }

        values.push(self.matches[index]);
      }

      return values;
    ;
    }, $MatchData_values_at$35.$$arity = -1), nil) && 'values_at';
  })($nesting[0], null, $nesting);
};

Opal.modules["corelib/string"] = function(Opal) {/* Generated by Opal 1.3.0 */
  function $rb_divide(lhs, rhs) {
    return (typeof(lhs) === 'number' && typeof(rhs) === 'number') ? lhs / rhs : lhs['$/'](rhs);
  }
  function $rb_plus(lhs, rhs) {
    return (typeof(lhs) === 'number' && typeof(rhs) === 'number') ? lhs + rhs : lhs['$+'](rhs);
  }
  var self = Opal.top, $nesting = [], nil = Opal.nil, $$$ = Opal.$$$, $$ = Opal.$$, $coerce_to = Opal.coerce_to, $respond_to = Opal.respond_to, $klass = Opal.klass, $alias = Opal.alias, $send = Opal.send, $hash2 = Opal.hash2, $truthy = Opal.truthy, $gvars = Opal.gvars;

  Opal.add_stubs(['$require', '$include', '$coerce_to?', '$initialize', '$===', '$format', '$raise', '$respond_to?', '$to_s', '$to_str', '$<=>', '$==', '$=~', '$new', '$force_encoding', '$casecmp', '$empty?', '$ljust', '$ceil', '$/', '$+', '$rjust', '$floor', '$coerce_to!', '$copy_singleton_methods', '$initialize_clone', '$initialize_dup', '$enum_for', '$chomp', '$[]', '$to_i', '$each_line', '$to_proc', '$to_a', '$class', '$match', '$match?', '$captures', '$proc', '$succ', '$escape', '$include?', '$upcase', '$unicode_normalize', '$pristine']);
  
  self.$require("corelib/comparable");
  self.$require("corelib/regexp");
  (function($base, $super, $parent_nesting) {
    var self = $klass($base, $super, 'String');

    var $nesting = [self].concat($parent_nesting), $String___id__$1, $String_try_convert$2, $String_new$3, $String_initialize$4, $String_$percent$5, $String_$$6, $String_$plus$7, $String_$lt_eq_gt$8, $String_$eq_eq$9, $String_$eq_tilde$10, $String_$$$11, $String_b$12, $String_capitalize$13, $String_casecmp$14, $String_casecmp$ques$15, $String_center$16, $String_chomp$17, $String_chop$18, $String_chr$19, $String_clone$20, $String_dup$21, $String_count$22, $String_delete$23, $String_delete_prefix$24, $String_delete_suffix$25, $String_downcase$26, $String_each_line$27, $String_empty$ques$28, $String_end_with$ques$29, $String_gsub$30, $String_hash$31, $String_hex$32, $String_include$ques$33, $String_index$34, $String_inspect$35, $String_intern$36, $String_lines$37, $String_ljust$38, $String_lstrip$39, $String_ascii_only$ques$40, $String_match$41, $String_match$ques$42, $String_next$43, $String_oct$44, $String_ord$45, $String_partition$46, $String_reverse$47, $String_rindex$48, $String_rjust$49, $String_rpartition$50, $String_rstrip$51, $String_scan$52, $String_split$53, $String_squeeze$54, $String_start_with$ques$55, $String_strip$56, $String_sub$57, $String_sum$58, $String_swapcase$59, $String_to_f$60, $String_to_i$61, $String_to_proc$62, $String_to_s$64, $String_tr$65, $String_tr_s$66, $String_upcase$67, $String_upto$68, $String_instance_variables$69, $String__load$70, $String_unicode_normalize$71, $String_unicode_normalized$ques$72, $String_unpack$73, $String_unpack1$74, $String_freeze$75, $String_$minus$$76, $String_frozen$ques$77;

    
    self.$include($$($nesting, 'Comparable'));
    
    Opal.defineProperty(self.$$prototype, '$$is_string', true);

    Opal.defineProperty(self.$$prototype, '$$cast', function(string) {
      var klass = this.$$class;
      if (klass.$$constructor === String) {
        return string;
      } else {
        return new klass.$$constructor(string);
      }
    });
  ;
    
    Opal.def(self, '$__id__', $String___id__$1 = function $$__id__() {
      var self = this;

      return self.toString();
    }, $String___id__$1.$$arity = 0);
    $alias(self, "object_id", "__id__");
    Opal.defs(self, '$try_convert', $String_try_convert$2 = function $$try_convert(what) {
      var self = this;

      return $$($nesting, 'Opal')['$coerce_to?'](what, $$($nesting, 'String'), "to_str")
    }, $String_try_convert$2.$$arity = 1);
    Opal.defs(self, '$new', $String_new$3 = function($a) {
      var $post_args, args, self = this;

      
      
      $post_args = Opal.slice.call(arguments, 0, arguments.length);
      
      args = $post_args;;
      
      var str = args[0] || "";
      var opts = args[args.length-1];
      str = $coerce_to(str, $$($nesting, 'String'), 'to_str');
      if (opts && opts.$$is_hash) {
        if (opts.$$smap.encoding) str = str.$force_encoding(opts.$$smap.encoding);
      }
      str = new self.$$constructor(str);
      if (!str.$initialize.$$pristine) $send((str), 'initialize', Opal.to_a(args));
      return str;
    ;
    }, $String_new$3.$$arity = -1);
    
    Opal.def(self, '$initialize', $String_initialize$4 = function $$initialize($a, $b) {
      var $post_args, $kwargs, str, encoding, capacity, self = this;

      
      
      $post_args = Opal.slice.call(arguments, 0, arguments.length);
      
      $kwargs = Opal.extract_kwargs($post_args);
      
      if ($kwargs == null) {
        $kwargs = $hash2([], {});
      } else if (!$kwargs.$$is_hash) {
        throw Opal.ArgumentError.$new('expected kwargs');
      };
      
      if ($post_args.length > 0) {
        str = $post_args[0];
        $post_args.splice(0, 1);
      };
      
      encoding = $kwargs.$$smap["encoding"];
      if (encoding == null) {
        encoding = nil
      };
      
      capacity = $kwargs.$$smap["capacity"];
      if (capacity == null) {
        capacity = nil
      };
      return nil;
    }, $String_initialize$4.$$arity = -1);
    
    Opal.def(self, '$%', $String_$percent$5 = function(data) {
      var self = this;

      if ($truthy($$($nesting, 'Array')['$==='](data))) {
        return $send(self, 'format', [self].concat(Opal.to_a(data)))
      } else {
        return self.$format(self, data)
      }
    }, $String_$percent$5.$$arity = 1);
    
    Opal.def(self, '$*', $String_$$6 = function(count) {
      var self = this;

      
      count = $coerce_to(count, $$($nesting, 'Integer'), 'to_int');

      if (count < 0) {
        self.$raise($$($nesting, 'ArgumentError'), "negative argument")
      }

      if (count === 0) {
        return self.$$cast('');
      }

      var result = '',
          string = self.toString();

      // All credit for the bit-twiddling magic code below goes to Mozilla
      // polyfill implementation of String.prototype.repeat() posted here:
      // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/repeat

      if (string.length * count >= 1 << 28) {
        self.$raise($$($nesting, 'RangeError'), "multiply count must not overflow maximum string size")
      }

      for (;;) {
        if ((count & 1) === 1) {
          result += string;
        }
        count >>>= 1;
        if (count === 0) {
          break;
        }
        string += string;
      }

      return self.$$cast(result);
    
    }, $String_$$6.$$arity = 1);
    
    Opal.def(self, '$+', $String_$plus$7 = function(other) {
      var self = this;

      
      other = $coerce_to(other, $$($nesting, 'String'), 'to_str');
      
      if (other == "" && self.$$class === Opal.String) return self;
      if (self == "" && other.$$class === Opal.String) return other;
      var out = self + other;
      if (self.encoding === out.encoding && other.encoding === out.encoding) return out;
      if (self.encoding.name === "UTF-8" || other.encoding.name === "UTF-8") return out;
      return Opal.enc(out, self.encoding);
    ;
    }, $String_$plus$7.$$arity = 1);
    
    Opal.def(self, '$<=>', $String_$lt_eq_gt$8 = function(other) {
      var self = this;

      if ($truthy(other['$respond_to?']("to_str"))) {
        
        other = other.$to_str().$to_s();
        return self > other ? 1 : (self < other ? -1 : 0);;
      } else {
        
        var cmp = other['$<=>'](self);

        if (cmp === nil) {
          return nil;
        }
        else {
          return cmp > 0 ? -1 : (cmp < 0 ? 1 : 0);
        }
      
      }
    }, $String_$lt_eq_gt$8.$$arity = 1);
    
    Opal.def(self, '$==', $String_$eq_eq$9 = function(other) {
      var self = this;

      
      if (other.$$is_string) {
        return self.toString() === other.toString();
      }
      if ($respond_to(other, '$to_str')) {
        return other['$=='](self);
      }
      return false;
    
    }, $String_$eq_eq$9.$$arity = 1);
    $alias(self, "eql?", "==");
    $alias(self, "===", "==");
    
    Opal.def(self, '$=~', $String_$eq_tilde$10 = function(other) {
      var self = this;

      
      if (other.$$is_string) {
        self.$raise($$($nesting, 'TypeError'), "type mismatch: String given");
      }

      return other['$=~'](self);
    
    }, $String_$eq_tilde$10.$$arity = 1);
    
    Opal.def(self, '$[]', $String_$$$11 = function(index, length) {
      var self = this;

      
      ;
      
      var size = self.length, exclude;

      if (index.$$is_range) {
        exclude = index.excl;
        length  = $coerce_to(index.end, $$($nesting, 'Integer'), 'to_int');
        index   = $coerce_to(index.begin, $$($nesting, 'Integer'), 'to_int');

        if (Math.abs(index) > size) {
          return nil;
        }

        if (index < 0) {
          index += size;
        }

        if (length < 0) {
          length += size;
        }

        if (!exclude) {
          length += 1;
        }

        length = length - index;

        if (length < 0) {
          length = 0;
        }

        return self.$$cast(self.substr(index, length));
      }


      if (index.$$is_string) {
        if (length != null) {
          self.$raise($$($nesting, 'TypeError'))
        }
        return self.indexOf(index) !== -1 ? self.$$cast(index) : nil;
      }


      if (index.$$is_regexp) {
        var match = self.match(index);

        if (match === null) {
          ($gvars["~"] = nil)
          return nil;
        }

        ($gvars["~"] = $$($nesting, 'MatchData').$new(index, match))

        if (length == null) {
          return self.$$cast(match[0]);
        }

        length = $coerce_to(length, $$($nesting, 'Integer'), 'to_int');

        if (length < 0 && -length < match.length) {
          return self.$$cast(match[length += match.length]);
        }

        if (length >= 0 && length < match.length) {
          return self.$$cast(match[length]);
        }

        return nil;
      }


      index = $coerce_to(index, $$($nesting, 'Integer'), 'to_int');

      if (index < 0) {
        index += size;
      }

      if (length == null) {
        if (index >= size || index < 0) {
          return nil;
        }
        return self.$$cast(self.substr(index, 1));
      }

      length = $coerce_to(length, $$($nesting, 'Integer'), 'to_int');

      if (length < 0) {
        return nil;
      }

      if (index > size || index < 0) {
        return nil;
      }

      return self.$$cast(self.substr(index, length));
    ;
    }, $String_$$$11.$$arity = -2);
    $alias(self, "byteslice", "[]");
    
    Opal.def(self, '$b', $String_b$12 = function $$b() {
      var self = this;

      return (new String(self)).$force_encoding("binary")
    }, $String_b$12.$$arity = 0);
    
    Opal.def(self, '$capitalize', $String_capitalize$13 = function $$capitalize() {
      var self = this;

      return self.$$cast(self.charAt(0).toUpperCase() + self.substr(1).toLowerCase());
    }, $String_capitalize$13.$$arity = 0);
    
    Opal.def(self, '$casecmp', $String_casecmp$14 = function $$casecmp(other) {
      var self = this;

      
      if ($truthy(other['$respond_to?']("to_str"))) {
      } else {
        return nil
      };
      other = ($coerce_to(other, $$($nesting, 'String'), 'to_str')).$to_s();
      
      var ascii_only = /^[\x00-\x7F]*$/;
      if (ascii_only.test(self) && ascii_only.test(other)) {
        self = self.toLowerCase();
        other = other.toLowerCase();
      }
    ;
      return self['$<=>'](other);
    }, $String_casecmp$14.$$arity = 1);
    
    Opal.def(self, '$casecmp?', $String_casecmp$ques$15 = function(other) {
      var self = this;

      
      var cmp = self.$casecmp(other);
      if (cmp === nil) {
        return nil;
      } else {
        return cmp === 0;
      }
    
    }, $String_casecmp$ques$15.$$arity = 1);
    
    Opal.def(self, '$center', $String_center$16 = function $$center(width, padstr) {
      var self = this;

      
      
      if (padstr == null) {
        padstr = " ";
      };
      width = $coerce_to(width, $$($nesting, 'Integer'), 'to_int');
      padstr = ($coerce_to(padstr, $$($nesting, 'String'), 'to_str')).$to_s();
      if ($truthy(padstr['$empty?']())) {
        self.$raise($$($nesting, 'ArgumentError'), "zero width padding")};
      if ($truthy(width <= self.length)) {
        return self};
      
      var ljustified = self.$ljust($rb_divide($rb_plus(width, self.length), 2).$ceil(), padstr),
          rjustified = self.$rjust($rb_divide($rb_plus(width, self.length), 2).$floor(), padstr);

      return self.$$cast(rjustified + ljustified.slice(self.length));
    ;
    }, $String_center$16.$$arity = -2);
    
    Opal.def(self, '$chomp', $String_chomp$17 = function $$chomp(separator) {
      var self = this;
      if ($gvars["/"] == null) $gvars["/"] = nil;

      
      
      if (separator == null) {
        separator = $gvars["/"];
      };
      if ($truthy(separator === nil || self.length === 0)) {
        return self};
      separator = $$($nesting, 'Opal')['$coerce_to!'](separator, $$($nesting, 'String'), "to_str").$to_s();
      
      var result;

      if (separator === "\n") {
        result = self.replace(/\r?\n?$/, '');
      }
      else if (separator === "") {
        result = self.replace(/(\r?\n)+$/, '');
      }
      else if (self.length >= separator.length) {
        var tail = self.substr(self.length - separator.length, separator.length);

        if (tail === separator) {
          result = self.substr(0, self.length - separator.length);
        }
      }

      if (result != null) {
        return self.$$cast(result);
      }
    ;
      return self;
    }, $String_chomp$17.$$arity = -1);
    
    Opal.def(self, '$chop', $String_chop$18 = function $$chop() {
      var self = this;

      
      var length = self.length, result;

      if (length <= 1) {
        result = "";
      } else if (self.charAt(length - 1) === "\n" && self.charAt(length - 2) === "\r") {
        result = self.substr(0, length - 2);
      } else {
        result = self.substr(0, length - 1);
      }

      return self.$$cast(result);
    
    }, $String_chop$18.$$arity = 0);
    
    Opal.def(self, '$chr', $String_chr$19 = function $$chr() {
      var self = this;

      return self.charAt(0);
    }, $String_chr$19.$$arity = 0);
    
    Opal.def(self, '$clone', $String_clone$20 = function $$clone() {
      var self = this, copy = nil;

      
      copy = new String(self);
      copy.$copy_singleton_methods(self);
      copy.$initialize_clone(self);
      return copy;
    }, $String_clone$20.$$arity = 0);
    
    Opal.def(self, '$dup', $String_dup$21 = function $$dup() {
      var self = this, copy = nil;

      
      copy = new String(self);
      copy.$initialize_dup(self);
      return copy;
    }, $String_dup$21.$$arity = 0);
    
    Opal.def(self, '$count', $String_count$22 = function $$count($a) {
      var $post_args, sets, self = this;

      
      
      $post_args = Opal.slice.call(arguments, 0, arguments.length);
      
      sets = $post_args;;
      
      if (sets.length === 0) {
        self.$raise($$($nesting, 'ArgumentError'), "ArgumentError: wrong number of arguments (0 for 1+)")
      }
      var char_class = char_class_from_char_sets(sets);
      if (char_class === null) {
        return 0;
      }
      return self.length - self.replace(new RegExp(char_class, 'g'), '').length;
    ;
    }, $String_count$22.$$arity = -1);
    
    Opal.def(self, '$delete', $String_delete$23 = function($a) {
      var $post_args, sets, self = this;

      
      
      $post_args = Opal.slice.call(arguments, 0, arguments.length);
      
      sets = $post_args;;
      
      if (sets.length === 0) {
        self.$raise($$($nesting, 'ArgumentError'), "ArgumentError: wrong number of arguments (0 for 1+)")
      }
      var char_class = char_class_from_char_sets(sets);
      if (char_class === null) {
        return self;
      }
      return self.$$cast(self.replace(new RegExp(char_class, 'g'), ''));
    ;
    }, $String_delete$23.$$arity = -1);
    
    Opal.def(self, '$delete_prefix', $String_delete_prefix$24 = function $$delete_prefix(prefix) {
      var self = this;

      
      if (!prefix.$$is_string) {
        prefix = $coerce_to(prefix, $$($nesting, 'String'), 'to_str');
      }

      if (self.slice(0, prefix.length) === prefix) {
        return self.$$cast(self.slice(prefix.length));
      } else {
        return self;
      }
    
    }, $String_delete_prefix$24.$$arity = 1);
    
    Opal.def(self, '$delete_suffix', $String_delete_suffix$25 = function $$delete_suffix(suffix) {
      var self = this;

      
      if (!suffix.$$is_string) {
        suffix = $coerce_to(suffix, $$($nesting, 'String'), 'to_str');
      }

      if (self.slice(self.length - suffix.length) === suffix) {
        return self.$$cast(self.slice(0, self.length - suffix.length));
      } else {
        return self;
      }
    
    }, $String_delete_suffix$25.$$arity = 1);
    
    Opal.def(self, '$downcase', $String_downcase$26 = function $$downcase() {
      var self = this;

      return self.$$cast(self.toLowerCase());
    }, $String_downcase$26.$$arity = 0);
    
    Opal.def(self, '$each_line', $String_each_line$27 = function $$each_line(separator) {
      var $iter = $String_each_line$27.$$p, block = $iter || nil, self = this;
      if ($gvars["/"] == null) $gvars["/"] = nil;

      if ($iter) $String_each_line$27.$$p = null;
      
      
      if ($iter) $String_each_line$27.$$p = null;;
      
      if (separator == null) {
        separator = $gvars["/"];
      };
      if ((block !== nil)) {
      } else {
        return self.$enum_for("each_line", separator)
      };
      
      if (separator === nil) {
        Opal.yield1(block, self);

        return self;
      }

      separator = $coerce_to(separator, $$($nesting, 'String'), 'to_str')

      var a, i, n, length, chomped, trailing, splitted;

      if (separator.length === 0) {
        for (a = self.split(/(\n{2,})/), i = 0, n = a.length; i < n; i += 2) {
          if (a[i] || a[i + 1]) {
            var value = (a[i] || "") + (a[i + 1] || "");
            Opal.yield1(block, self.$$cast(value));
          }
        }

        return self;
      }

      chomped  = self.$chomp(separator);
      trailing = self.length != chomped.length;
      splitted = chomped.split(separator);

      for (i = 0, length = splitted.length; i < length; i++) {
        if (i < length - 1 || trailing) {
          Opal.yield1(block, self.$$cast(splitted[i] + separator));
        }
        else {
          Opal.yield1(block, self.$$cast(splitted[i]));
        }
      }
    ;
      return self;
    }, $String_each_line$27.$$arity = -1);
    
    Opal.def(self, '$empty?', $String_empty$ques$28 = function() {
      var self = this;

      return self.length === 0;
    }, $String_empty$ques$28.$$arity = 0);
    
    Opal.def(self, '$end_with?', $String_end_with$ques$29 = function($a) {
      var $post_args, suffixes, self = this;

      
      
      $post_args = Opal.slice.call(arguments, 0, arguments.length);
      
      suffixes = $post_args;;
      
      for (var i = 0, length = suffixes.length; i < length; i++) {
        var suffix = $coerce_to(suffixes[i], $$($nesting, 'String'), 'to_str').$to_s();

        if (self.length >= suffix.length &&
            self.substr(self.length - suffix.length, suffix.length) == suffix) {
          return true;
        }
      }
    ;
      return false;
    }, $String_end_with$ques$29.$$arity = -1);
    $alias(self, "equal?", "===");
    
    Opal.def(self, '$gsub', $String_gsub$30 = function $$gsub(pattern, replacement) {
      var $iter = $String_gsub$30.$$p, block = $iter || nil, self = this;

      if ($iter) $String_gsub$30.$$p = null;
      
      
      if ($iter) $String_gsub$30.$$p = null;;
      ;
      
      if (replacement === undefined && block === nil) {
        return self.$enum_for("gsub", pattern);
      }

      var result = '', match_data = nil, index = 0, match, _replacement;

      if (pattern.$$is_regexp) {
        pattern = Opal.global_multiline_regexp(pattern);
      } else {
        pattern = $coerce_to(pattern, $$($nesting, 'String'), 'to_str');
        pattern = new RegExp(pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gm');
      }

      var lastIndex;
      while (true) {
        match = pattern.exec(self);

        if (match === null) {
          ($gvars["~"] = nil)
          result += self.slice(index);
          break;
        }

        match_data = $$($nesting, 'MatchData').$new(pattern, match);

        if (replacement === undefined) {
          lastIndex = pattern.lastIndex;
          _replacement = block(match[0]);
          pattern.lastIndex = lastIndex; // save and restore lastIndex
        }
        else if (replacement.$$is_hash) {
          _replacement = (replacement)['$[]'](match[0]).$to_s();
        }
        else {
          if (!replacement.$$is_string) {
            replacement = $coerce_to(replacement, $$($nesting, 'String'), 'to_str');
          }
          _replacement = replacement.replace(/([\\]+)([0-9+&`'])/g, function (original, slashes, command) {
            if (slashes.length % 2 === 0) {
              return original;
            }
            switch (command) {
            case "+":
              for (var i = match.length - 1; i > 0; i--) {
                if (match[i] !== undefined) {
                  return slashes.slice(1) + match[i];
                }
              }
              return '';
            case "&": return slashes.slice(1) + match[0];
            case "`": return slashes.slice(1) + self.slice(0, match.index);
            case "'": return slashes.slice(1) + self.slice(match.index + match[0].length);
            default:  return slashes.slice(1) + (match[command] || '');
            }
          }).replace(/\\\\/g, '\\');
        }

        if (pattern.lastIndex === match.index) {
          result += (self.slice(index, match.index) + _replacement + (self[match.index] || ""));
          pattern.lastIndex += 1;
        }
        else {
          result += (self.slice(index, match.index) + _replacement)
        }
        index = pattern.lastIndex;
      }

      ($gvars["~"] = match_data)
      return self.$$cast(result);
    ;
    }, $String_gsub$30.$$arity = -2);
    
    Opal.def(self, '$hash', $String_hash$31 = function $$hash() {
      var self = this;

      return self.toString();
    }, $String_hash$31.$$arity = 0);
    
    Opal.def(self, '$hex', $String_hex$32 = function $$hex() {
      var self = this;

      return self.$to_i(16)
    }, $String_hex$32.$$arity = 0);
    
    Opal.def(self, '$include?', $String_include$ques$33 = function(other) {
      var self = this;

      
      if (!other.$$is_string) {
        other = $coerce_to(other, $$($nesting, 'String'), 'to_str');
      }
      return self.indexOf(other) !== -1;
    
    }, $String_include$ques$33.$$arity = 1);
    
    Opal.def(self, '$index', $String_index$34 = function $$index(search, offset) {
      var self = this;

      
      ;
      
      var index,
          match,
          regex;

      if (offset === undefined) {
        offset = 0;
      } else {
        offset = $coerce_to(offset, $$($nesting, 'Integer'), 'to_int');
        if (offset < 0) {
          offset += self.length;
          if (offset < 0) {
            return nil;
          }
        }
      }

      if (search.$$is_regexp) {
        regex = Opal.global_multiline_regexp(search);
        while (true) {
          match = regex.exec(self);
          if (match === null) {
            ($gvars["~"] = nil);
            index = -1;
            break;
          }
          if (match.index >= offset) {
            ($gvars["~"] = $$($nesting, 'MatchData').$new(regex, match))
            index = match.index;
            break;
          }
          regex.lastIndex = match.index + 1;
        }
      } else {
        search = $coerce_to(search, $$($nesting, 'String'), 'to_str');
        if (search.length === 0 && offset > self.length) {
          index = -1;
        } else {
          index = self.indexOf(search, offset);
        }
      }

      return index === -1 ? nil : index;
    ;
    }, $String_index$34.$$arity = -2);
    
    Opal.def(self, '$inspect', $String_inspect$35 = function $$inspect() {
      var self = this;

      
      /* eslint-disable no-misleading-character-class */
      var escapable = /[\\\"\x00-\x1f\u007F-\u009F\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,
          meta = {
            '\u0007': '\\a',
            '\u001b': '\\e',
            '\b': '\\b',
            '\t': '\\t',
            '\n': '\\n',
            '\f': '\\f',
            '\r': '\\r',
            '\v': '\\v',
            '"' : '\\"',
            '\\': '\\\\'
          },
          escaped = self.replace(escapable, function (chr) {
            if (meta[chr]) return meta[chr];
            chr = chr.charCodeAt(0);
            if (chr <= 0xff && (self.encoding["$binary?"]() || self.internal_encoding["$binary?"]())) {
              return '\\x' + ('00' + chr.toString(16).toUpperCase()).slice(-2);
            } else {
              return '\\u' + ('0000' + chr.toString(16).toUpperCase()).slice(-4);
            }
          });
      return '"' + escaped.replace(/\#[\$\@\{]/g, '\\$&') + '"';
      /* eslint-enable no-misleading-character-class */
    
    }, $String_inspect$35.$$arity = 0);
    
    Opal.def(self, '$intern', $String_intern$36 = function $$intern() {
      var self = this;

      return self.toString();
    }, $String_intern$36.$$arity = 0);
    
    Opal.def(self, '$lines', $String_lines$37 = function $$lines(separator) {
      var $iter = $String_lines$37.$$p, block = $iter || nil, self = this, e = nil;
      if ($gvars["/"] == null) $gvars["/"] = nil;

      if ($iter) $String_lines$37.$$p = null;
      
      
      if ($iter) $String_lines$37.$$p = null;;
      
      if (separator == null) {
        separator = $gvars["/"];
      };
      e = $send(self, 'each_line', [separator], block.$to_proc());
      if ($truthy(block)) {
        return self
      } else {
        return e.$to_a()
      };
    }, $String_lines$37.$$arity = -1);
    
    Opal.def(self, '$ljust', $String_ljust$38 = function $$ljust(width, padstr) {
      var self = this;

      
      
      if (padstr == null) {
        padstr = " ";
      };
      width = $coerce_to(width, $$($nesting, 'Integer'), 'to_int');
      padstr = ($coerce_to(padstr, $$($nesting, 'String'), 'to_str')).$to_s();
      if ($truthy(padstr['$empty?']())) {
        self.$raise($$($nesting, 'ArgumentError'), "zero width padding")};
      if ($truthy(width <= self.length)) {
        return self};
      
      var index  = -1,
          result = "";

      width -= self.length;

      while (++index < width) {
        result += padstr;
      }

      return self.$$cast(self + result.slice(0, width));
    ;
    }, $String_ljust$38.$$arity = -2);
    
    Opal.def(self, '$lstrip', $String_lstrip$39 = function $$lstrip() {
      var self = this;

      return self.replace(/^\s*/, '');
    }, $String_lstrip$39.$$arity = 0);
    
    Opal.def(self, '$ascii_only?', $String_ascii_only$ques$40 = function() {
      var self = this;

      
      if (!self.encoding.ascii) return false;
      return /^[\x00-\x7F]*$/.test(self);
    
    }, $String_ascii_only$ques$40.$$arity = 0);
    
    Opal.def(self, '$match', $String_match$41 = function $$match(pattern, pos) {
      var $iter = $String_match$41.$$p, block = $iter || nil, self = this, $ret_or_1 = nil;

      if ($iter) $String_match$41.$$p = null;
      
      
      if ($iter) $String_match$41.$$p = null;;
      ;
      if ($truthy((function() {if ($truthy(($ret_or_1 = $$($nesting, 'String')['$==='](pattern)))) {
        return $ret_or_1
      } else {
        return pattern['$respond_to?']("to_str")
      }; return nil; })())) {
        pattern = $$($nesting, 'Regexp').$new(pattern.$to_str())};
      if ($truthy($$($nesting, 'Regexp')['$==='](pattern))) {
      } else {
        self.$raise($$($nesting, 'TypeError'), "" + "wrong argument type " + (pattern.$class()) + " (expected Regexp)")
      };
      return $send(pattern, 'match', [self, pos], block.$to_proc());
    }, $String_match$41.$$arity = -2);
    
    Opal.def(self, '$match?', $String_match$ques$42 = function(pattern, pos) {
      var self = this, $ret_or_2 = nil;

      
      ;
      if ($truthy((function() {if ($truthy(($ret_or_2 = $$($nesting, 'String')['$==='](pattern)))) {
        return $ret_or_2
      } else {
        return pattern['$respond_to?']("to_str")
      }; return nil; })())) {
        pattern = $$($nesting, 'Regexp').$new(pattern.$to_str())};
      if ($truthy($$($nesting, 'Regexp')['$==='](pattern))) {
      } else {
        self.$raise($$($nesting, 'TypeError'), "" + "wrong argument type " + (pattern.$class()) + " (expected Regexp)")
      };
      return pattern['$match?'](self, pos);
    }, $String_match$ques$42.$$arity = -2);
    
    Opal.def(self, '$next', $String_next$43 = function $$next() {
      var self = this;

      
      var i = self.length;
      if (i === 0) {
        return self.$$cast('');
      }
      var result = self;
      var first_alphanum_char_index = self.search(/[a-zA-Z0-9]/);
      var carry = false;
      var code;
      while (i--) {
        code = self.charCodeAt(i);
        if ((code >= 48 && code <= 57) ||
          (code >= 65 && code <= 90) ||
          (code >= 97 && code <= 122)) {
          switch (code) {
          case 57:
            carry = true;
            code = 48;
            break;
          case 90:
            carry = true;
            code = 65;
            break;
          case 122:
            carry = true;
            code = 97;
            break;
          default:
            carry = false;
            code += 1;
          }
        } else {
          if (first_alphanum_char_index === -1) {
            if (code === 255) {
              carry = true;
              code = 0;
            } else {
              carry = false;
              code += 1;
            }
          } else {
            carry = true;
          }
        }
        result = result.slice(0, i) + String.fromCharCode(code) + result.slice(i + 1);
        if (carry && (i === 0 || i === first_alphanum_char_index)) {
          switch (code) {
          case 65:
            break;
          case 97:
            break;
          default:
            code += 1;
          }
          if (i === 0) {
            result = String.fromCharCode(code) + result;
          } else {
            result = result.slice(0, i) + String.fromCharCode(code) + result.slice(i);
          }
          carry = false;
        }
        if (!carry) {
          break;
        }
      }
      return self.$$cast(result);
    
    }, $String_next$43.$$arity = 0);
    
    Opal.def(self, '$oct', $String_oct$44 = function $$oct() {
      var self = this;

      
      var result,
          string = self,
          radix = 8;

      if (/^\s*_/.test(string)) {
        return 0;
      }

      string = string.replace(/^(\s*[+-]?)(0[bodx]?)(.+)$/i, function (original, head, flag, tail) {
        switch (tail.charAt(0)) {
        case '+':
        case '-':
          return original;
        case '0':
          if (tail.charAt(1) === 'x' && flag === '0x') {
            return original;
          }
        }
        switch (flag) {
        case '0b':
          radix = 2;
          break;
        case '0':
        case '0o':
          radix = 8;
          break;
        case '0d':
          radix = 10;
          break;
        case '0x':
          radix = 16;
          break;
        }
        return head + tail;
      });

      result = parseInt(string.replace(/_(?!_)/g, ''), radix);
      return isNaN(result) ? 0 : result;
    
    }, $String_oct$44.$$arity = 0);
    
    Opal.def(self, '$ord', $String_ord$45 = function $$ord() {
      var self = this;

      
      if (typeof self.codePointAt === "function") {
        return self.codePointAt(0);
      }
      else {
        return self.charCodeAt(0);
      }
    
    }, $String_ord$45.$$arity = 0);
    
    Opal.def(self, '$partition', $String_partition$46 = function $$partition(sep) {
      var self = this;

      
      var i, m;

      if (sep.$$is_regexp) {
        m = sep.exec(self);
        if (m === null) {
          i = -1;
        } else {
          $$($nesting, 'MatchData').$new(sep, m);
          sep = m[0];
          i = m.index;
        }
      } else {
        sep = $coerce_to(sep, $$($nesting, 'String'), 'to_str');
        i = self.indexOf(sep);
      }

      if (i === -1) {
        return [self, '', ''];
      }

      return [
        self.slice(0, i),
        self.slice(i, i + sep.length),
        self.slice(i + sep.length)
      ];
    
    }, $String_partition$46.$$arity = 1);
    
    Opal.def(self, '$reverse', $String_reverse$47 = function $$reverse() {
      var self = this;

      return self.split('').reverse().join('');
    }, $String_reverse$47.$$arity = 0);
    
    Opal.def(self, '$rindex', $String_rindex$48 = function $$rindex(search, offset) {
      var self = this;

      
      ;
      
      var i, m, r, _m;

      if (offset === undefined) {
        offset = self.length;
      } else {
        offset = $coerce_to(offset, $$($nesting, 'Integer'), 'to_int');
        if (offset < 0) {
          offset += self.length;
          if (offset < 0) {
            return nil;
          }
        }
      }

      if (search.$$is_regexp) {
        m = null;
        r = Opal.global_multiline_regexp(search);
        while (true) {
          _m = r.exec(self);
          if (_m === null || _m.index > offset) {
            break;
          }
          m = _m;
          r.lastIndex = m.index + 1;
        }
        if (m === null) {
          ($gvars["~"] = nil)
          i = -1;
        } else {
          $$($nesting, 'MatchData').$new(r, m);
          i = m.index;
        }
      } else {
        search = $coerce_to(search, $$($nesting, 'String'), 'to_str');
        i = self.lastIndexOf(search, offset);
      }

      return i === -1 ? nil : i;
    ;
    }, $String_rindex$48.$$arity = -2);
    
    Opal.def(self, '$rjust', $String_rjust$49 = function $$rjust(width, padstr) {
      var self = this;

      
      
      if (padstr == null) {
        padstr = " ";
      };
      width = $coerce_to(width, $$($nesting, 'Integer'), 'to_int');
      padstr = ($coerce_to(padstr, $$($nesting, 'String'), 'to_str')).$to_s();
      if ($truthy(padstr['$empty?']())) {
        self.$raise($$($nesting, 'ArgumentError'), "zero width padding")};
      if ($truthy(width <= self.length)) {
        return self};
      
      var chars     = Math.floor(width - self.length),
          patterns  = Math.floor(chars / padstr.length),
          result    = Array(patterns + 1).join(padstr),
          remaining = chars - result.length;

      return self.$$cast(result + padstr.slice(0, remaining) + self);
    ;
    }, $String_rjust$49.$$arity = -2);
    
    Opal.def(self, '$rpartition', $String_rpartition$50 = function $$rpartition(sep) {
      var self = this;

      
      var i, m, r, _m;

      if (sep.$$is_regexp) {
        m = null;
        r = Opal.global_multiline_regexp(sep);

        while (true) {
          _m = r.exec(self);
          if (_m === null) {
            break;
          }
          m = _m;
          r.lastIndex = m.index + 1;
        }

        if (m === null) {
          i = -1;
        } else {
          $$($nesting, 'MatchData').$new(r, m);
          sep = m[0];
          i = m.index;
        }

      } else {
        sep = $coerce_to(sep, $$($nesting, 'String'), 'to_str');
        i = self.lastIndexOf(sep);
      }

      if (i === -1) {
        return ['', '', self];
      }

      return [
        self.slice(0, i),
        self.slice(i, i + sep.length),
        self.slice(i + sep.length)
      ];
    
    }, $String_rpartition$50.$$arity = 1);
    
    Opal.def(self, '$rstrip', $String_rstrip$51 = function $$rstrip() {
      var self = this;

      return self.replace(/[\s\u0000]*$/, '');
    }, $String_rstrip$51.$$arity = 0);
    
    Opal.def(self, '$scan', $String_scan$52 = function $$scan(pattern) {
      var $iter = $String_scan$52.$$p, block = $iter || nil, self = this;

      if ($iter) $String_scan$52.$$p = null;
      
      
      if ($iter) $String_scan$52.$$p = null;;
      
      var result = [],
          match_data = nil,
          match;

      if (pattern.$$is_regexp) {
        pattern = Opal.global_multiline_regexp(pattern);
      } else {
        pattern = $coerce_to(pattern, $$($nesting, 'String'), 'to_str');
        pattern = new RegExp(pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gm');
      }

      while ((match = pattern.exec(self)) != null) {
        match_data = $$($nesting, 'MatchData').$new(pattern, match);
        if (block === nil) {
          match.length == 1 ? result.push(match[0]) : result.push((match_data).$captures());
        } else {
          match.length == 1 ? block(match[0]) : block.call(self, (match_data).$captures());
        }
        if (pattern.lastIndex === match.index) {
          pattern.lastIndex += 1;
        }
      }

      ($gvars["~"] = match_data)

      return (block !== nil ? self : result);
    ;
    }, $String_scan$52.$$arity = 1);
    $alias(self, "slice", "[]");
    
    Opal.def(self, '$split', $String_split$53 = function $$split(pattern, limit) {
      var self = this, $ret_or_3 = nil;
      if ($gvars[";"] == null) $gvars[";"] = nil;

      
      ;
      ;
      
      if (self.length === 0) {
        return [];
      }

      if (limit === undefined) {
        limit = 0;
      } else {
        limit = $$($nesting, 'Opal')['$coerce_to!'](limit, $$($nesting, 'Integer'), "to_int");
        if (limit === 1) {
          return [self];
        }
      }

      if (pattern === undefined || pattern === nil) {
        pattern = (function() {if ($truthy(($ret_or_3 = $gvars[";"]))) {
        return $ret_or_3
      } else {
        return " "
      }; return nil; })();
      }

      var result = [],
          string = self.toString(),
          index = 0,
          match,
          i, ii;

      if (pattern.$$is_regexp) {
        pattern = Opal.global_multiline_regexp(pattern);
      } else {
        pattern = $coerce_to(pattern, $$($nesting, 'String'), 'to_str').$to_s();
        if (pattern === ' ') {
          pattern = /\s+/gm;
          string = string.replace(/^\s+/, '');
        } else {
          pattern = new RegExp(pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gm');
        }
      }

      result = string.split(pattern);

      if (result.length === 1 && result[0] === string) {
        return [self.$$cast(result[0])];
      }

      while ((i = result.indexOf(undefined)) !== -1) {
        result.splice(i, 1);
      }

      function castResult() {
        for (i = 0; i < result.length; i++) {
          result[i] = self.$$cast(result[i]);
        }
      }

      if (limit === 0) {
        while (result[result.length - 1] === '') {
          result.length -= 1;
        }
        castResult();
        return result;
      }

      match = pattern.exec(string);

      if (limit < 0) {
        if (match !== null && match[0] === '' && pattern.source.indexOf('(?=') === -1) {
          for (i = 0, ii = match.length; i < ii; i++) {
            result.push('');
          }
        }
        castResult();
        return result;
      }

      if (match !== null && match[0] === '') {
        result.splice(limit - 1, result.length - 1, result.slice(limit - 1).join(''));
        castResult();
        return result;
      }

      if (limit >= result.length) {
        castResult();
        return result;
      }

      i = 0;
      while (match !== null) {
        i++;
        index = pattern.lastIndex;
        if (i + 1 === limit) {
          break;
        }
        match = pattern.exec(string);
      }
      result.splice(limit - 1, result.length - 1, string.slice(index));
      castResult();
      return result;
    ;
    }, $String_split$53.$$arity = -1);
    
    Opal.def(self, '$squeeze', $String_squeeze$54 = function $$squeeze($a) {
      var $post_args, sets, self = this;

      
      
      $post_args = Opal.slice.call(arguments, 0, arguments.length);
      
      sets = $post_args;;
      
      if (sets.length === 0) {
        return self.$$cast(self.replace(/(.)\1+/g, '$1'));
      }
      var char_class = char_class_from_char_sets(sets);
      if (char_class === null) {
        return self;
      }
      return self.$$cast(self.replace(new RegExp('(' + char_class + ')\\1+', 'g'), '$1'));
    ;
    }, $String_squeeze$54.$$arity = -1);
    
    Opal.def(self, '$start_with?', $String_start_with$ques$55 = function($a) {
      var $post_args, prefixes, self = this;

      
      
      $post_args = Opal.slice.call(arguments, 0, arguments.length);
      
      prefixes = $post_args;;
      
      for (var i = 0, length = prefixes.length; i < length; i++) {
        if (prefixes[i].$$is_regexp) {
          var regexp = prefixes[i];
          var match = regexp.exec(self);

          if (match != null && match.index === 0) {
            ($gvars["~"] = $$($nesting, 'MatchData').$new(regexp, match));
            return true;
          } else {
            ($gvars["~"] = nil)
          }
        } else {
          var prefix = $coerce_to(prefixes[i], $$($nesting, 'String'), 'to_str').$to_s();

          if (self.indexOf(prefix) === 0) {
            return true;
          }
        }
      }

      return false;
    ;
    }, $String_start_with$ques$55.$$arity = -1);
    
    Opal.def(self, '$strip', $String_strip$56 = function $$strip() {
      var self = this;

      return self.replace(/^\s*/, '').replace(/[\s\u0000]*$/, '');
    }, $String_strip$56.$$arity = 0);
    
    Opal.def(self, '$sub', $String_sub$57 = function $$sub(pattern, replacement) {
      var $iter = $String_sub$57.$$p, block = $iter || nil, self = this;

      if ($iter) $String_sub$57.$$p = null;
      
      
      if ($iter) $String_sub$57.$$p = null;;
      ;
      
      if (!pattern.$$is_regexp) {
        pattern = $coerce_to(pattern, $$($nesting, 'String'), 'to_str');
        pattern = new RegExp(pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
      }

      var result, match = pattern.exec(self);

      if (match === null) {
        ($gvars["~"] = nil)
        result = self.toString();
      } else {
        $$($nesting, 'MatchData').$new(pattern, match)

        if (replacement === undefined) {

          if (block === nil) {
            self.$raise($$($nesting, 'ArgumentError'), "wrong number of arguments (1 for 2)")
          }
          result = self.slice(0, match.index) + block(match[0]) + self.slice(match.index + match[0].length);

        } else if (replacement.$$is_hash) {

          result = self.slice(0, match.index) + (replacement)['$[]'](match[0]).$to_s() + self.slice(match.index + match[0].length);

        } else {

          replacement = $coerce_to(replacement, $$($nesting, 'String'), 'to_str');

          replacement = replacement.replace(/([\\]+)([0-9+&`'])/g, function (original, slashes, command) {
            if (slashes.length % 2 === 0) {
              return original;
            }
            switch (command) {
            case "+":
              for (var i = match.length - 1; i > 0; i--) {
                if (match[i] !== undefined) {
                  return slashes.slice(1) + match[i];
                }
              }
              return '';
            case "&": return slashes.slice(1) + match[0];
            case "`": return slashes.slice(1) + self.slice(0, match.index);
            case "'": return slashes.slice(1) + self.slice(match.index + match[0].length);
            default:  return slashes.slice(1) + (match[command] || '');
            }
          }).replace(/\\\\/g, '\\');

          result = self.slice(0, match.index) + replacement + self.slice(match.index + match[0].length);
        }
      }

      return self.$$cast(result);
    ;
    }, $String_sub$57.$$arity = -2);
    $alias(self, "succ", "next");
    
    Opal.def(self, '$sum', $String_sum$58 = function $$sum(n) {
      var self = this;

      
      
      if (n == null) {
        n = 16;
      };
      
      n = $coerce_to(n, $$($nesting, 'Integer'), 'to_int');

      var result = 0,
          length = self.length,
          i = 0;

      for (; i < length; i++) {
        result += self.charCodeAt(i);
      }

      if (n <= 0) {
        return result;
      }

      return result & (Math.pow(2, n) - 1);
    ;
    }, $String_sum$58.$$arity = -1);
    
    Opal.def(self, '$swapcase', $String_swapcase$59 = function $$swapcase() {
      var self = this;

      
      var str = self.replace(/([a-z]+)|([A-Z]+)/g, function($0,$1,$2) {
        return $1 ? $0.toUpperCase() : $0.toLowerCase();
      });

      if (self.constructor === String) {
        return str;
      }

      return self.$class().$new(str);
    
    }, $String_swapcase$59.$$arity = 0);
    
    Opal.def(self, '$to_f', $String_to_f$60 = function $$to_f() {
      var self = this;

      
      if (self.charAt(0) === '_') {
        return 0;
      }

      var result = parseFloat(self.replace(/_/g, ''));

      if (isNaN(result) || result == Infinity || result == -Infinity) {
        return 0;
      }
      else {
        return result;
      }
    
    }, $String_to_f$60.$$arity = 0);
    
    Opal.def(self, '$to_i', $String_to_i$61 = function $$to_i(base) {
      var self = this;

      
      
      if (base == null) {
        base = 10;
      };
      
      var result,
          string = self.toLowerCase(),
          radix = $coerce_to(base, $$($nesting, 'Integer'), 'to_int');

      if (radix === 1 || radix < 0 || radix > 36) {
        self.$raise($$($nesting, 'ArgumentError'), "" + "invalid radix " + (radix))
      }

      if (/^\s*_/.test(string)) {
        return 0;
      }

      string = string.replace(/^(\s*[+-]?)(0[bodx]?)(.+)$/, function (original, head, flag, tail) {
        switch (tail.charAt(0)) {
        case '+':
        case '-':
          return original;
        case '0':
          if (tail.charAt(1) === 'x' && flag === '0x' && (radix === 0 || radix === 16)) {
            return original;
          }
        }
        switch (flag) {
        case '0b':
          if (radix === 0 || radix === 2) {
            radix = 2;
            return head + tail;
          }
          break;
        case '0':
        case '0o':
          if (radix === 0 || radix === 8) {
            radix = 8;
            return head + tail;
          }
          break;
        case '0d':
          if (radix === 0 || radix === 10) {
            radix = 10;
            return head + tail;
          }
          break;
        case '0x':
          if (radix === 0 || radix === 16) {
            radix = 16;
            return head + tail;
          }
          break;
        }
        return original
      });

      result = parseInt(string.replace(/_(?!_)/g, ''), radix);
      return isNaN(result) ? 0 : result;
    ;
    }, $String_to_i$61.$$arity = -1);
    
    Opal.def(self, '$to_proc', $String_to_proc$62 = function $$to_proc() {
      var $$63, $iter = $String_to_proc$62.$$p, $yield = $iter || nil, self = this, method_name = nil;

      if ($iter) $String_to_proc$62.$$p = null;
      
      method_name = $rb_plus("$", self.valueOf());
      return $send(self, 'proc', [], ($$63 = function($a){var self = $$63.$$s == null ? this : $$63.$$s, $iter = $$63.$$p, block = $iter || nil, $post_args, args;

        
        
        if ($iter) $$63.$$p = null;;
        
        $post_args = Opal.slice.call(arguments, 0, arguments.length);
        
        args = $post_args;;
        
        if (args.length === 0) {
          self.$raise($$($nesting, 'ArgumentError'), "no receiver given")
        }

        var recv = args[0];

        if (recv == null) recv = nil;

        var body = recv[method_name];

        if (!body) {
          return recv.$method_missing.apply(recv, args);
        }

        if (typeof block === 'function') {
          body.$$p = block;
        }

        if (args.length === 1) {
          return body.call(recv);
        } else {
          return body.apply(recv, args.slice(1));
        }
      ;}, $$63.$$s = self, $$63.$$arity = -1, $$63));
    }, $String_to_proc$62.$$arity = 0);
    
    Opal.def(self, '$to_s', $String_to_s$64 = function $$to_s() {
      var self = this;

      return self.toString();
    }, $String_to_s$64.$$arity = 0);
    $alias(self, "to_str", "to_s");
    $alias(self, "to_sym", "intern");
    
    Opal.def(self, '$tr', $String_tr$65 = function $$tr(from, to) {
      var self = this;

      
      from = $coerce_to(from, $$($nesting, 'String'), 'to_str').$to_s();
      to = $coerce_to(to, $$($nesting, 'String'), 'to_str').$to_s();

      if (from.length == 0 || from === to) {
        return self;
      }

      var i, in_range, c, ch, start, end, length;
      var subs = {};
      var from_chars = from.split('');
      var from_length = from_chars.length;
      var to_chars = to.split('');
      var to_length = to_chars.length;

      var inverse = false;
      var global_sub = null;
      if (from_chars[0] === '^' && from_chars.length > 1) {
        inverse = true;
        from_chars.shift();
        global_sub = to_chars[to_length - 1]
        from_length -= 1;
      }

      var from_chars_expanded = [];
      var last_from = null;
      in_range = false;
      for (i = 0; i < from_length; i++) {
        ch = from_chars[i];
        if (last_from == null) {
          last_from = ch;
          from_chars_expanded.push(ch);
        }
        else if (ch === '-') {
          if (last_from === '-') {
            from_chars_expanded.push('-');
            from_chars_expanded.push('-');
          }
          else if (i == from_length - 1) {
            from_chars_expanded.push('-');
          }
          else {
            in_range = true;
          }
        }
        else if (in_range) {
          start = last_from.charCodeAt(0);
          end = ch.charCodeAt(0);
          if (start > end) {
            self.$raise($$($nesting, 'ArgumentError'), "" + "invalid range \"" + (String.fromCharCode(start)) + "-" + (String.fromCharCode(end)) + "\" in string transliteration")
          }
          for (c = start + 1; c < end; c++) {
            from_chars_expanded.push(String.fromCharCode(c));
          }
          from_chars_expanded.push(ch);
          in_range = null;
          last_from = null;
        }
        else {
          from_chars_expanded.push(ch);
        }
      }

      from_chars = from_chars_expanded;
      from_length = from_chars.length;

      if (inverse) {
        for (i = 0; i < from_length; i++) {
          subs[from_chars[i]] = true;
        }
      }
      else {
        if (to_length > 0) {
          var to_chars_expanded = [];
          var last_to = null;
          in_range = false;
          for (i = 0; i < to_length; i++) {
            ch = to_chars[i];
            if (last_to == null) {
              last_to = ch;
              to_chars_expanded.push(ch);
            }
            else if (ch === '-') {
              if (last_to === '-') {
                to_chars_expanded.push('-');
                to_chars_expanded.push('-');
              }
              else if (i == to_length - 1) {
                to_chars_expanded.push('-');
              }
              else {
                in_range = true;
              }
            }
            else if (in_range) {
              start = last_to.charCodeAt(0);
              end = ch.charCodeAt(0);
              if (start > end) {
                self.$raise($$($nesting, 'ArgumentError'), "" + "invalid range \"" + (String.fromCharCode(start)) + "-" + (String.fromCharCode(end)) + "\" in string transliteration")
              }
              for (c = start + 1; c < end; c++) {
                to_chars_expanded.push(String.fromCharCode(c));
              }
              to_chars_expanded.push(ch);
              in_range = null;
              last_to = null;
            }
            else {
              to_chars_expanded.push(ch);
            }
          }

          to_chars = to_chars_expanded;
          to_length = to_chars.length;
        }

        var length_diff = from_length - to_length;
        if (length_diff > 0) {
          var pad_char = (to_length > 0 ? to_chars[to_length - 1] : '');
          for (i = 0; i < length_diff; i++) {
            to_chars.push(pad_char);
          }
        }

        for (i = 0; i < from_length; i++) {
          subs[from_chars[i]] = to_chars[i];
        }
      }

      var new_str = ''
      for (i = 0, length = self.length; i < length; i++) {
        ch = self.charAt(i);
        var sub = subs[ch];
        if (inverse) {
          new_str += (sub == null ? global_sub : ch);
        }
        else {
          new_str += (sub != null ? sub : ch);
        }
      }
      return self.$$cast(new_str);
    
    }, $String_tr$65.$$arity = 2);
    
    Opal.def(self, '$tr_s', $String_tr_s$66 = function $$tr_s(from, to) {
      var self = this;

      
      from = $coerce_to(from, $$($nesting, 'String'), 'to_str').$to_s();
      to = $coerce_to(to, $$($nesting, 'String'), 'to_str').$to_s();

      if (from.length == 0) {
        return self;
      }

      var i, in_range, c, ch, start, end, length;
      var subs = {};
      var from_chars = from.split('');
      var from_length = from_chars.length;
      var to_chars = to.split('');
      var to_length = to_chars.length;

      var inverse = false;
      var global_sub = null;
      if (from_chars[0] === '^' && from_chars.length > 1) {
        inverse = true;
        from_chars.shift();
        global_sub = to_chars[to_length - 1]
        from_length -= 1;
      }

      var from_chars_expanded = [];
      var last_from = null;
      in_range = false;
      for (i = 0; i < from_length; i++) {
        ch = from_chars[i];
        if (last_from == null) {
          last_from = ch;
          from_chars_expanded.push(ch);
        }
        else if (ch === '-') {
          if (last_from === '-') {
            from_chars_expanded.push('-');
            from_chars_expanded.push('-');
          }
          else if (i == from_length - 1) {
            from_chars_expanded.push('-');
          }
          else {
            in_range = true;
          }
        }
        else if (in_range) {
          start = last_from.charCodeAt(0);
          end = ch.charCodeAt(0);
          if (start > end) {
            self.$raise($$($nesting, 'ArgumentError'), "" + "invalid range \"" + (String.fromCharCode(start)) + "-" + (String.fromCharCode(end)) + "\" in string transliteration")
          }
          for (c = start + 1; c < end; c++) {
            from_chars_expanded.push(String.fromCharCode(c));
          }
          from_chars_expanded.push(ch);
          in_range = null;
          last_from = null;
        }
        else {
          from_chars_expanded.push(ch);
        }
      }

      from_chars = from_chars_expanded;
      from_length = from_chars.length;

      if (inverse) {
        for (i = 0; i < from_length; i++) {
          subs[from_chars[i]] = true;
        }
      }
      else {
        if (to_length > 0) {
          var to_chars_expanded = [];
          var last_to = null;
          in_range = false;
          for (i = 0; i < to_length; i++) {
            ch = to_chars[i];
            if (last_from == null) {
              last_from = ch;
              to_chars_expanded.push(ch);
            }
            else if (ch === '-') {
              if (last_to === '-') {
                to_chars_expanded.push('-');
                to_chars_expanded.push('-');
              }
              else if (i == to_length - 1) {
                to_chars_expanded.push('-');
              }
              else {
                in_range = true;
              }
            }
            else if (in_range) {
              start = last_from.charCodeAt(0);
              end = ch.charCodeAt(0);
              if (start > end) {
                self.$raise($$($nesting, 'ArgumentError'), "" + "invalid range \"" + (String.fromCharCode(start)) + "-" + (String.fromCharCode(end)) + "\" in string transliteration")
              }
              for (c = start + 1; c < end; c++) {
                to_chars_expanded.push(String.fromCharCode(c));
              }
              to_chars_expanded.push(ch);
              in_range = null;
              last_from = null;
            }
            else {
              to_chars_expanded.push(ch);
            }
          }

          to_chars = to_chars_expanded;
          to_length = to_chars.length;
        }

        var length_diff = from_length - to_length;
        if (length_diff > 0) {
          var pad_char = (to_length > 0 ? to_chars[to_length - 1] : '');
          for (i = 0; i < length_diff; i++) {
            to_chars.push(pad_char);
          }
        }

        for (i = 0; i < from_length; i++) {
          subs[from_chars[i]] = to_chars[i];
        }
      }
      var new_str = ''
      var last_substitute = null
      for (i = 0, length = self.length; i < length; i++) {
        ch = self.charAt(i);
        var sub = subs[ch]
        if (inverse) {
          if (sub == null) {
            if (last_substitute == null) {
              new_str += global_sub;
              last_substitute = true;
            }
          }
          else {
            new_str += ch;
            last_substitute = null;
          }
        }
        else {
          if (sub != null) {
            if (last_substitute == null || last_substitute !== sub) {
              new_str += sub;
              last_substitute = sub;
            }
          }
          else {
            new_str += ch;
            last_substitute = null;
          }
        }
      }
      return self.$$cast(new_str);
    
    }, $String_tr_s$66.$$arity = 2);
    
    Opal.def(self, '$upcase', $String_upcase$67 = function $$upcase() {
      var self = this;

      return self.$$cast(self.toUpperCase());
    }, $String_upcase$67.$$arity = 0);
    
    Opal.def(self, '$upto', $String_upto$68 = function $$upto(stop, excl) {
      var $iter = $String_upto$68.$$p, block = $iter || nil, self = this;

      if ($iter) $String_upto$68.$$p = null;
      
      
      if ($iter) $String_upto$68.$$p = null;;
      
      if (excl == null) {
        excl = false;
      };
      if ((block !== nil)) {
      } else {
        return self.$enum_for("upto", stop, excl)
      };
      
      var a, b, s = self.toString();

      stop = $coerce_to(stop, $$($nesting, 'String'), 'to_str');

      if (s.length === 1 && stop.length === 1) {

        a = s.charCodeAt(0);
        b = stop.charCodeAt(0);

        while (a <= b) {
          if (excl && a === b) {
            break;
          }

          block(String.fromCharCode(a));

          a += 1;
        }

      } else if (parseInt(s, 10).toString() === s && parseInt(stop, 10).toString() === stop) {

        a = parseInt(s, 10);
        b = parseInt(stop, 10);

        while (a <= b) {
          if (excl && a === b) {
            break;
          }

          block(a.toString());

          a += 1;
        }

      } else {

        while (s.length <= stop.length && s <= stop) {
          if (excl && s === stop) {
            break;
          }

          block(s);

          s = (s).$succ();
        }

      }
      return self;
    ;
    }, $String_upto$68.$$arity = -2);
    
    function char_class_from_char_sets(sets) {
      function explode_sequences_in_character_set(set) {
        var result = '',
            i, len = set.length,
            curr_char,
            skip_next_dash,
            char_code_from,
            char_code_upto,
            char_code;
        for (i = 0; i < len; i++) {
          curr_char = set.charAt(i);
          if (curr_char === '-' && i > 0 && i < (len - 1) && !skip_next_dash) {
            char_code_from = set.charCodeAt(i - 1);
            char_code_upto = set.charCodeAt(i + 1);
            if (char_code_from > char_code_upto) {
              self.$raise($$($nesting, 'ArgumentError'), "" + "invalid range \"" + (char_code_from) + "-" + (char_code_upto) + "\" in string transliteration")
            }
            for (char_code = char_code_from + 1; char_code < char_code_upto + 1; char_code++) {
              result += String.fromCharCode(char_code);
            }
            skip_next_dash = true;
            i++;
          } else {
            skip_next_dash = (curr_char === '\\');
            result += curr_char;
          }
        }
        return result;
      }

      function intersection(setA, setB) {
        if (setA.length === 0) {
          return setB;
        }
        var result = '',
            i, len = setA.length,
            chr;
        for (i = 0; i < len; i++) {
          chr = setA.charAt(i);
          if (setB.indexOf(chr) !== -1) {
            result += chr;
          }
        }
        return result;
      }

      var i, len, set, neg, chr, tmp,
          pos_intersection = '',
          neg_intersection = '';

      for (i = 0, len = sets.length; i < len; i++) {
        set = $coerce_to(sets[i], $$($nesting, 'String'), 'to_str');
        neg = (set.charAt(0) === '^' && set.length > 1);
        set = explode_sequences_in_character_set(neg ? set.slice(1) : set);
        if (neg) {
          neg_intersection = intersection(neg_intersection, set);
        } else {
          pos_intersection = intersection(pos_intersection, set);
        }
      }

      if (pos_intersection.length > 0 && neg_intersection.length > 0) {
        tmp = '';
        for (i = 0, len = pos_intersection.length; i < len; i++) {
          chr = pos_intersection.charAt(i);
          if (neg_intersection.indexOf(chr) === -1) {
            tmp += chr;
          }
        }
        pos_intersection = tmp;
        neg_intersection = '';
      }

      if (pos_intersection.length > 0) {
        return '[' + $$($nesting, 'Regexp').$escape(pos_intersection) + ']';
      }

      if (neg_intersection.length > 0) {
        return '[^' + $$($nesting, 'Regexp').$escape(neg_intersection) + ']';
      }

      return null;
    }
  ;
    
    Opal.def(self, '$instance_variables', $String_instance_variables$69 = function $$instance_variables() {
      var self = this;

      return []
    }, $String_instance_variables$69.$$arity = 0);
    Opal.defs(self, '$_load', $String__load$70 = function $$_load($a) {
      var $post_args, args, self = this;

      
      
      $post_args = Opal.slice.call(arguments, 0, arguments.length);
      
      args = $post_args;;
      return $send(self, 'new', Opal.to_a(args));
    }, $String__load$70.$$arity = -1);
    
    Opal.def(self, '$unicode_normalize', $String_unicode_normalize$71 = function $$unicode_normalize(form) {
      var self = this;

      
      
      if (form == null) {
        form = "nfc";
      };
      if ($truthy(["nfc", "nfd", "nfkc", "nfkd"]['$include?'](form))) {
      } else {
        self.$raise($$($nesting, 'ArgumentError'), "" + "Invalid normalization form " + (form))
      };
      return self.normalize(form.$upcase());
    }, $String_unicode_normalize$71.$$arity = -1);
    
    Opal.def(self, '$unicode_normalized?', $String_unicode_normalized$ques$72 = function(form) {
      var self = this;

      
      
      if (form == null) {
        form = "nfc";
      };
      return self.$unicode_normalize(form)['$=='](self);
    }, $String_unicode_normalized$ques$72.$$arity = -1);
    
    Opal.def(self, '$unpack', $String_unpack$73 = function $$unpack(format) {
      var self = this;

      return self.$raise("To use String#unpack, you must first require 'corelib/string/unpack'.")
    }, $String_unpack$73.$$arity = 1);
    
    Opal.def(self, '$unpack1', $String_unpack1$74 = function $$unpack1(format) {
      var self = this;

      return self.$raise("To use String#unpack1, you must first require 'corelib/string/unpack'.")
    }, $String_unpack1$74.$$arity = 1);
    
    Opal.def(self, '$freeze', $String_freeze$75 = function $$freeze() {
      var self = this;

      
      if (typeof self === 'string') return self;
      self.$$frozen = true;
      return self;
    
    }, $String_freeze$75.$$arity = 0);
    $alias(self, "+@", "dup");
    
    Opal.def(self, '$-@', $String_$minus$$76 = function() {
      var self = this;

      
      if (typeof self === 'string') return self;
      if (self.$$frozen === true) return self;
      if (self.encoding.name == 'UTF-8' && self.internal_encoding.name == 'UTF-8') return self.toString();
      return self.$dup().$freeze();
    
    }, $String_$minus$$76.$$arity = 0);
    
    Opal.def(self, '$frozen?', $String_frozen$ques$77 = function() {
      var self = this;

      return typeof self === 'string' || self.$$frozen === true;
    }, $String_frozen$ques$77.$$arity = 0);
    return $$($nesting, 'Opal').$pristine(self, "initialize");
  })($nesting[0], String, $nesting);
  return Opal.const_set($nesting[0], 'Symbol', $$($nesting, 'String'));
};

Opal.modules["corelib/enumerable"] = function(Opal) {/* Generated by Opal 1.3.0 */
  function $rb_gt(lhs, rhs) {
    return (typeof(lhs) === 'number' && typeof(rhs) === 'number') ? lhs > rhs : lhs['$>'](rhs);
  }
  function $rb_times(lhs, rhs) {
    return (typeof(lhs) === 'number' && typeof(rhs) === 'number') ? lhs * rhs : lhs['$*'](rhs);
  }
  function $rb_lt(lhs, rhs) {
    return (typeof(lhs) === 'number' && typeof(rhs) === 'number') ? lhs < rhs : lhs['$<'](rhs);
  }
  function $rb_plus(lhs, rhs) {
    return (typeof(lhs) === 'number' && typeof(rhs) === 'number') ? lhs + rhs : lhs['$+'](rhs);
  }
  function $rb_minus(lhs, rhs) {
    return (typeof(lhs) === 'number' && typeof(rhs) === 'number') ? lhs - rhs : lhs['$-'](rhs);
  }
  function $rb_divide(lhs, rhs) {
    return (typeof(lhs) === 'number' && typeof(rhs) === 'number') ? lhs / rhs : lhs['$/'](rhs);
  }
  function $rb_le(lhs, rhs) {
    return (typeof(lhs) === 'number' && typeof(rhs) === 'number') ? lhs <= rhs : lhs['$<='](rhs);
  }
  var self = Opal.top, $nesting = [], nil = Opal.nil, $$$ = Opal.$$$, $$ = Opal.$$, $falsy = Opal.falsy, $truthy = Opal.truthy, $coerce_to = Opal.coerce_to, $module = Opal.module, $send = Opal.send, $alias = Opal.alias, $hash2 = Opal.hash2, $lambda = Opal.lambda;

  Opal.add_stubs(['$each', '$public_send', '$destructure', '$to_enum', '$enumerator_size', '$new', '$yield', '$raise', '$slice_when', '$!', '$enum_for', '$flatten', '$map', '$warn', '$proc', '$==', '$nil?', '$respond_to?', '$coerce_to!', '$>', '$*', '$try_convert', '$<', '$+', '$-', '$ceil', '$/', '$size', '$select', '$to_proc', '$__send__', '$length', '$<=', '$[]', '$push', '$<<', '$[]=', '$===', '$inspect', '$<=>', '$first', '$reverse', '$sort', '$take', '$sort_by', '$compare', '$call', '$dup', '$to_a', '$sort!', '$map!', '$key?', '$values', '$transform_values', '$group_by', '$to_h', '$coerce_to?', '$class', '$zip']);
  return (function($base, $parent_nesting) {
    var self = $module($base, 'Enumerable');

    var $nesting = [self].concat($parent_nesting), $Enumerable_all$ques$1, $Enumerable_any$ques$5, $Enumerable_chunk$9, $Enumerable_chunk_while$12, $Enumerable_collect$14, $Enumerable_collect_concat$16, $Enumerable_count$19, $Enumerable_cycle$23, $Enumerable_detect$25, $Enumerable_drop$27, $Enumerable_drop_while$28, $Enumerable_each_cons$29, $Enumerable_each_entry$31, $Enumerable_each_slice$33, $Enumerable_each_with_index$35, $Enumerable_each_with_object$37, $Enumerable_entries$39, $Enumerable_filter_map$40, $Enumerable_find_all$42, $Enumerable_find_index$44, $Enumerable_first$47, $Enumerable_grep$50, $Enumerable_grep_v$52, $Enumerable_group_by$54, $Enumerable_include$ques$56, $Enumerable_inject$58, $Enumerable_lazy$59, $Enumerable_enumerator_size$61, $Enumerable_max$62, $Enumerable_max_by$63, $Enumerable_min$65, $Enumerable_min_by$67, $Enumerable_minmax$69, $Enumerable_minmax_by$71, $Enumerable_none$ques$73, $Enumerable_one$ques$77, $Enumerable_partition$81, $Enumerable_reject$83, $Enumerable_reverse_each$85, $Enumerable_slice_before$87, $Enumerable_slice_after$89, $Enumerable_slice_when$92, $Enumerable_sort$94, $Enumerable_sort_by$96, $Enumerable_sum$101, $Enumerable_take$103, $Enumerable_take_while$104, $Enumerable_uniq$106, $Enumerable_tally$108, $Enumerable_to_h$109, $Enumerable_zip$110;

    
    
    function comparableForPattern(value) {
      if (value.length === 0) {
        value = [nil];
      }

      if (value.length > 1) {
        value = [value];
      }

      return value;
    }
  ;
    
    Opal.def(self, '$all?', $Enumerable_all$ques$1 = function(pattern) {try {

      var $iter = $Enumerable_all$ques$1.$$p, block = $iter || nil, $$2, $$3, $$4, self = this;

      if ($iter) $Enumerable_all$ques$1.$$p = null;
      
      
      if ($iter) $Enumerable_all$ques$1.$$p = null;;
      ;
      if ($truthy(pattern !== undefined)) {
        $send(self, 'each', [], ($$2 = function($a){var self = $$2.$$s == null ? this : $$2.$$s, $post_args, value, comparable = nil;

          
          
          $post_args = Opal.slice.call(arguments, 0, arguments.length);
          
          value = $post_args;;
          comparable = comparableForPattern(value);
          if ($truthy($send(pattern, 'public_send', ["==="].concat(Opal.to_a(comparable))))) {
            return nil
          } else {
            Opal.ret(false)
          };}, $$2.$$s = self, $$2.$$arity = -1, $$2))
      } else if ((block !== nil)) {
        $send(self, 'each', [], ($$3 = function($a){var self = $$3.$$s == null ? this : $$3.$$s, $post_args, value;

          
          
          $post_args = Opal.slice.call(arguments, 0, arguments.length);
          
          value = $post_args;;
          if ($truthy(Opal.yieldX(block, Opal.to_a(value)))) {
            return nil
          } else {
            Opal.ret(false)
          };}, $$3.$$s = self, $$3.$$arity = -1, $$3))
      } else {
        $send(self, 'each', [], ($$4 = function($a){var self = $$4.$$s == null ? this : $$4.$$s, $post_args, value;

          
          
          $post_args = Opal.slice.call(arguments, 0, arguments.length);
          
          value = $post_args;;
          if ($truthy($$($nesting, 'Opal').$destructure(value))) {
            return nil
          } else {
            Opal.ret(false)
          };}, $$4.$$s = self, $$4.$$arity = -1, $$4))
      };
      return true;
      } catch ($returner) { if ($returner === Opal.returner) { return $returner.$v } throw $returner; }
    }, $Enumerable_all$ques$1.$$arity = -1);
    
    Opal.def(self, '$any?', $Enumerable_any$ques$5 = function(pattern) {try {

      var $iter = $Enumerable_any$ques$5.$$p, block = $iter || nil, $$6, $$7, $$8, self = this;

      if ($iter) $Enumerable_any$ques$5.$$p = null;
      
      
      if ($iter) $Enumerable_any$ques$5.$$p = null;;
      ;
      if ($truthy(pattern !== undefined)) {
        $send(self, 'each', [], ($$6 = function($a){var self = $$6.$$s == null ? this : $$6.$$s, $post_args, value, comparable = nil;

          
          
          $post_args = Opal.slice.call(arguments, 0, arguments.length);
          
          value = $post_args;;
          comparable = comparableForPattern(value);
          if ($truthy($send(pattern, 'public_send', ["==="].concat(Opal.to_a(comparable))))) {
            Opal.ret(true)
          } else {
            return nil
          };}, $$6.$$s = self, $$6.$$arity = -1, $$6))
      } else if ((block !== nil)) {
        $send(self, 'each', [], ($$7 = function($a){var self = $$7.$$s == null ? this : $$7.$$s, $post_args, value;

          
          
          $post_args = Opal.slice.call(arguments, 0, arguments.length);
          
          value = $post_args;;
          if ($truthy(Opal.yieldX(block, Opal.to_a(value)))) {
            Opal.ret(true)
          } else {
            return nil
          };}, $$7.$$s = self, $$7.$$arity = -1, $$7))
      } else {
        $send(self, 'each', [], ($$8 = function($a){var self = $$8.$$s == null ? this : $$8.$$s, $post_args, value;

          
          
          $post_args = Opal.slice.call(arguments, 0, arguments.length);
          
          value = $post_args;;
          if ($truthy($$($nesting, 'Opal').$destructure(value))) {
            Opal.ret(true)
          } else {
            return nil
          };}, $$8.$$s = self, $$8.$$arity = -1, $$8))
      };
      return false;
      } catch ($returner) { if ($returner === Opal.returner) { return $returner.$v } throw $returner; }
    }, $Enumerable_any$ques$5.$$arity = -1);
    
    Opal.def(self, '$chunk', $Enumerable_chunk$9 = function $$chunk() {
      var $iter = $Enumerable_chunk$9.$$p, block = $iter || nil, $$10, $$11, self = this;

      if ($iter) $Enumerable_chunk$9.$$p = null;
      
      
      if ($iter) $Enumerable_chunk$9.$$p = null;;
      if ((block !== nil)) {
      } else {
        return $send(self, 'to_enum', ["chunk"], ($$10 = function(){var self = $$10.$$s == null ? this : $$10.$$s;

          return self.$enumerator_size()}, $$10.$$s = self, $$10.$$arity = 0, $$10))
      };
      return $send($$$('::', 'Enumerator'), 'new', [], ($$11 = function(yielder){var self = $$11.$$s == null ? this : $$11.$$s;

        
        
        if (yielder == null) {
          yielder = nil;
        };
        
        var previous = nil, accumulate = [];

        function releaseAccumulate() {
          if (accumulate.length > 0) {
            yielder.$yield(previous, accumulate)
          }
        }

        self.$each.$$p = function(value) {
          var key = Opal.yield1(block, value);

          if (key === nil) {
            releaseAccumulate();
            accumulate = [];
            previous = nil;
          } else {
            if (previous === nil || previous === key) {
              accumulate.push(value);
            } else {
              releaseAccumulate();
              accumulate = [value];
            }

            previous = key;
          }
        }

        self.$each();

        releaseAccumulate();
      ;}, $$11.$$s = self, $$11.$$arity = 1, $$11));
    }, $Enumerable_chunk$9.$$arity = 0);
    
    Opal.def(self, '$chunk_while', $Enumerable_chunk_while$12 = function $$chunk_while() {
      var $iter = $Enumerable_chunk_while$12.$$p, block = $iter || nil, $$13, self = this;

      if ($iter) $Enumerable_chunk_while$12.$$p = null;
      
      
      if ($iter) $Enumerable_chunk_while$12.$$p = null;;
      if ((block !== nil)) {
      } else {
        self.$raise($$($nesting, 'ArgumentError'), "no block given")
      };
      return $send(self, 'slice_when', [], ($$13 = function(before, after){var self = $$13.$$s == null ? this : $$13.$$s;

        
        
        if (before == null) {
          before = nil;
        };
        
        if (after == null) {
          after = nil;
        };
        return Opal.yieldX(block, [before, after])['$!']();}, $$13.$$s = self, $$13.$$arity = 2, $$13));
    }, $Enumerable_chunk_while$12.$$arity = 0);
    
    Opal.def(self, '$collect', $Enumerable_collect$14 = function $$collect() {
      var $iter = $Enumerable_collect$14.$$p, block = $iter || nil, $$15, self = this;

      if ($iter) $Enumerable_collect$14.$$p = null;
      
      
      if ($iter) $Enumerable_collect$14.$$p = null;;
      if ((block !== nil)) {
      } else {
        return $send(self, 'enum_for', ["collect"], ($$15 = function(){var self = $$15.$$s == null ? this : $$15.$$s;

          return self.$enumerator_size()}, $$15.$$s = self, $$15.$$arity = 0, $$15))
      };
      
      var result = [];

      self.$each.$$p = function() {
        var value = Opal.yieldX(block, arguments);

        result.push(value);
      };

      self.$each();

      return result;
    ;
    }, $Enumerable_collect$14.$$arity = 0);
    
    Opal.def(self, '$collect_concat', $Enumerable_collect_concat$16 = function $$collect_concat() {
      var $iter = $Enumerable_collect_concat$16.$$p, block = $iter || nil, $$17, $$18, self = this;

      if ($iter) $Enumerable_collect_concat$16.$$p = null;
      
      
      if ($iter) $Enumerable_collect_concat$16.$$p = null;;
      if ((block !== nil)) {
      } else {
        return $send(self, 'enum_for', ["collect_concat"], ($$17 = function(){var self = $$17.$$s == null ? this : $$17.$$s;

          return self.$enumerator_size()}, $$17.$$s = self, $$17.$$arity = 0, $$17))
      };
      return $send(self, 'map', [], ($$18 = function(item){var self = $$18.$$s == null ? this : $$18.$$s;

        
        
        if (item == null) {
          item = nil;
        };
        return Opal.yield1(block, item);;}, $$18.$$s = self, $$18.$$arity = 1, $$18)).$flatten(1);
    }, $Enumerable_collect_concat$16.$$arity = 0);
    
    Opal.def(self, '$count', $Enumerable_count$19 = function $$count(object) {
      var $iter = $Enumerable_count$19.$$p, block = $iter || nil, $$20, $$21, $$22, self = this, result = nil;

      if ($iter) $Enumerable_count$19.$$p = null;
      
      
      if ($iter) $Enumerable_count$19.$$p = null;;
      ;
      result = 0;
      
      if (object != null && block !== nil) {
        self.$warn("warning: given block not used")
      }
    ;
      if ($truthy(object != null)) {
        block = $send(self, 'proc', [], ($$20 = function($a){var self = $$20.$$s == null ? this : $$20.$$s, $post_args, args;

          
          
          $post_args = Opal.slice.call(arguments, 0, arguments.length);
          
          args = $post_args;;
          return $$($nesting, 'Opal').$destructure(args)['$=='](object);}, $$20.$$s = self, $$20.$$arity = -1, $$20))
      } else if ($truthy(block['$nil?']())) {
        block = $send(self, 'proc', [], ($$21 = function(){var self = $$21.$$s == null ? this : $$21.$$s;

          return true}, $$21.$$s = self, $$21.$$arity = 0, $$21))};
      $send(self, 'each', [], ($$22 = function($a){var self = $$22.$$s == null ? this : $$22.$$s, $post_args, args;

        
        
        $post_args = Opal.slice.call(arguments, 0, arguments.length);
        
        args = $post_args;;
        if ($truthy(Opal.yieldX(block, args))) {
          return result++;
        } else {
          return nil
        };}, $$22.$$s = self, $$22.$$arity = -1, $$22));
      return result;
    }, $Enumerable_count$19.$$arity = -1);
    
    Opal.def(self, '$cycle', $Enumerable_cycle$23 = function $$cycle(n) {
      var $iter = $Enumerable_cycle$23.$$p, block = $iter || nil, $$24, self = this;

      if ($iter) $Enumerable_cycle$23.$$p = null;
      
      
      if ($iter) $Enumerable_cycle$23.$$p = null;;
      
      if (n == null) {
        n = nil;
      };
      if ((block !== nil)) {
      } else {
        return $send(self, 'enum_for', ["cycle", n], ($$24 = function(){var self = $$24.$$s == null ? this : $$24.$$s;

          if ($truthy(n['$nil?']())) {
            if ($truthy(self['$respond_to?']("size"))) {
              return $$$($$($nesting, 'Float'), 'INFINITY')
            } else {
              return nil
            }
          } else {
            
            n = $$($nesting, 'Opal')['$coerce_to!'](n, $$($nesting, 'Integer'), "to_int");
            if ($truthy($rb_gt(n, 0))) {
              return $rb_times(self.$enumerator_size(), n)
            } else {
              return 0
            };
          }}, $$24.$$s = self, $$24.$$arity = 0, $$24))
      };
      if ($truthy(n['$nil?']())) {
      } else {
        
        n = $$($nesting, 'Opal')['$coerce_to!'](n, $$($nesting, 'Integer'), "to_int");
        if ($truthy(n <= 0)) {
          return nil};
      };
      
      var all = [], i, length, value;

      self.$each.$$p = function() {
        var param = $$($nesting, 'Opal').$destructure(arguments),
            value = Opal.yield1(block, param);

        all.push(param);
      }

      self.$each();

      if (all.length === 0) {
        return nil;
      }

      if (n === nil) {
        while (true) {
          for (i = 0, length = all.length; i < length; i++) {
            value = Opal.yield1(block, all[i]);
          }
        }
      }
      else {
        while (n > 1) {
          for (i = 0, length = all.length; i < length; i++) {
            value = Opal.yield1(block, all[i]);
          }

          n--;
        }
      }
    ;
    }, $Enumerable_cycle$23.$$arity = -1);
    
    Opal.def(self, '$detect', $Enumerable_detect$25 = function $$detect(ifnone) {try {

      var $iter = $Enumerable_detect$25.$$p, block = $iter || nil, $$26, self = this;

      if ($iter) $Enumerable_detect$25.$$p = null;
      
      
      if ($iter) $Enumerable_detect$25.$$p = null;;
      ;
      if ((block !== nil)) {
      } else {
        return self.$enum_for("detect", ifnone)
      };
      $send(self, 'each', [], ($$26 = function($a){var self = $$26.$$s == null ? this : $$26.$$s, $post_args, args, value = nil;

        
        
        $post_args = Opal.slice.call(arguments, 0, arguments.length);
        
        args = $post_args;;
        value = $$($nesting, 'Opal').$destructure(args);
        if ($truthy(Opal.yield1(block, value))) {
          Opal.ret(value)
        } else {
          return nil
        };}, $$26.$$s = self, $$26.$$arity = -1, $$26));
      
      if (ifnone !== undefined) {
        if (typeof(ifnone) === 'function') {
          return ifnone();
        } else {
          return ifnone;
        }
      }
    ;
      return nil;
      } catch ($returner) { if ($returner === Opal.returner) { return $returner.$v } throw $returner; }
    }, $Enumerable_detect$25.$$arity = -1);
    
    Opal.def(self, '$drop', $Enumerable_drop$27 = function $$drop(number) {
      var self = this;

      
      number = $coerce_to(number, $$($nesting, 'Integer'), 'to_int');
      if ($truthy(number < 0)) {
        self.$raise($$($nesting, 'ArgumentError'), "attempt to drop negative size")};
      
      var result  = [],
          current = 0;

      self.$each.$$p = function() {
        if (number <= current) {
          result.push($$($nesting, 'Opal').$destructure(arguments));
        }

        current++;
      };

      self.$each()

      return result;
    ;
    }, $Enumerable_drop$27.$$arity = 1);
    
    Opal.def(self, '$drop_while', $Enumerable_drop_while$28 = function $$drop_while() {
      var $iter = $Enumerable_drop_while$28.$$p, block = $iter || nil, self = this;

      if ($iter) $Enumerable_drop_while$28.$$p = null;
      
      
      if ($iter) $Enumerable_drop_while$28.$$p = null;;
      if ((block !== nil)) {
      } else {
        return self.$enum_for("drop_while")
      };
      
      var result   = [],
          dropping = true;

      self.$each.$$p = function() {
        var param = $$($nesting, 'Opal').$destructure(arguments);

        if (dropping) {
          var value = Opal.yield1(block, param);

          if ($falsy(value)) {
            dropping = false;
            result.push(param);
          }
        }
        else {
          result.push(param);
        }
      };

      self.$each();

      return result;
    ;
    }, $Enumerable_drop_while$28.$$arity = 0);
    
    Opal.def(self, '$each_cons', $Enumerable_each_cons$29 = function $$each_cons(n) {
      var $iter = $Enumerable_each_cons$29.$$p, block = $iter || nil, $$30, self = this;

      if ($iter) $Enumerable_each_cons$29.$$p = null;
      
      
      if ($iter) $Enumerable_each_cons$29.$$p = null;;
      if ($truthy(arguments.length != 1)) {
        self.$raise($$($nesting, 'ArgumentError'), "" + "wrong number of arguments (" + (arguments.length) + " for 1)")};
      n = $$($nesting, 'Opal').$try_convert(n, $$($nesting, 'Integer'), "to_int");
      if ($truthy(n <= 0)) {
        self.$raise($$($nesting, 'ArgumentError'), "invalid size")};
      if ((block !== nil)) {
      } else {
        return $send(self, 'enum_for', ["each_cons", n], ($$30 = function(){var self = $$30.$$s == null ? this : $$30.$$s, enum_size = nil, $ret_or_1 = nil;

          
          enum_size = self.$enumerator_size();
          if ($truthy(enum_size['$nil?']())) {
            return nil
          } else if ($truthy((function() {if ($truthy(($ret_or_1 = enum_size['$=='](0)))) {
            return $ret_or_1
          } else {
            return $rb_lt(enum_size, n)
          }; return nil; })())) {
            return 0
          } else {
            return $rb_plus($rb_minus(enum_size, n), 1)
          };}, $$30.$$s = self, $$30.$$arity = 0, $$30))
      };
      
      var buffer = [];

      self.$each.$$p = function() {
        var element = $$($nesting, 'Opal').$destructure(arguments);
        buffer.push(element);
        if (buffer.length > n) {
          buffer.shift();
        }
        if (buffer.length == n) {
          Opal.yield1(block, buffer.slice(0, n));
        }
      }

      self.$each();

      return nil;
    ;
    }, $Enumerable_each_cons$29.$$arity = 1);
    
    Opal.def(self, '$each_entry', $Enumerable_each_entry$31 = function $$each_entry($a) {
      var $iter = $Enumerable_each_entry$31.$$p, block = $iter || nil, $post_args, data, $$32, self = this;

      if ($iter) $Enumerable_each_entry$31.$$p = null;
      
      
      if ($iter) $Enumerable_each_entry$31.$$p = null;;
      
      $post_args = Opal.slice.call(arguments, 0, arguments.length);
      
      data = $post_args;;
      if ((block !== nil)) {
      } else {
        return $send(self, 'to_enum', ["each_entry"].concat(Opal.to_a(data)), ($$32 = function(){var self = $$32.$$s == null ? this : $$32.$$s;

          return self.$enumerator_size()}, $$32.$$s = self, $$32.$$arity = 0, $$32))
      };
      
      self.$each.$$p = function() {
        var item = $$($nesting, 'Opal').$destructure(arguments);

        Opal.yield1(block, item);
      }

      self.$each.apply(self, data);

      return self;
    ;
    }, $Enumerable_each_entry$31.$$arity = -1);
    
    Opal.def(self, '$each_slice', $Enumerable_each_slice$33 = function $$each_slice(n) {
      var $iter = $Enumerable_each_slice$33.$$p, block = $iter || nil, $$34, self = this;

      if ($iter) $Enumerable_each_slice$33.$$p = null;
      
      
      if ($iter) $Enumerable_each_slice$33.$$p = null;;
      n = $coerce_to(n, $$($nesting, 'Integer'), 'to_int');
      if ($truthy(n <= 0)) {
        self.$raise($$($nesting, 'ArgumentError'), "invalid slice size")};
      if ((block !== nil)) {
      } else {
        return $send(self, 'enum_for', ["each_slice", n], ($$34 = function(){var self = $$34.$$s == null ? this : $$34.$$s;

          if ($truthy(self['$respond_to?']("size"))) {
            return $rb_divide(self.$size(), n).$ceil()
          } else {
            return nil
          }}, $$34.$$s = self, $$34.$$arity = 0, $$34))
      };
      
      var slice = []

      self.$each.$$p = function() {
        var param = $$($nesting, 'Opal').$destructure(arguments);

        slice.push(param);

        if (slice.length === n) {
          Opal.yield1(block, slice);
          slice = [];
        }
      };

      self.$each();

      // our "last" group, if smaller than n then won't have been yielded
      if (slice.length > 0) {
        Opal.yield1(block, slice);
      }
    ;
      return nil;
    }, $Enumerable_each_slice$33.$$arity = 1);
    
    Opal.def(self, '$each_with_index', $Enumerable_each_with_index$35 = function $$each_with_index($a) {
      var $iter = $Enumerable_each_with_index$35.$$p, block = $iter || nil, $post_args, args, $$36, self = this;

      if ($iter) $Enumerable_each_with_index$35.$$p = null;
      
      
      if ($iter) $Enumerable_each_with_index$35.$$p = null;;
      
      $post_args = Opal.slice.call(arguments, 0, arguments.length);
      
      args = $post_args;;
      if ((block !== nil)) {
      } else {
        return $send(self, 'enum_for', ["each_with_index"].concat(Opal.to_a(args)), ($$36 = function(){var self = $$36.$$s == null ? this : $$36.$$s;

          return self.$enumerator_size()}, $$36.$$s = self, $$36.$$arity = 0, $$36))
      };
      
      var index = 0;

      self.$each.$$p = function() {
        var param = $$($nesting, 'Opal').$destructure(arguments);

        block(param, index);

        index++;
      };

      self.$each.apply(self, args);
    ;
      return self;
    }, $Enumerable_each_with_index$35.$$arity = -1);
    
    Opal.def(self, '$each_with_object', $Enumerable_each_with_object$37 = function $$each_with_object(object) {
      var $iter = $Enumerable_each_with_object$37.$$p, block = $iter || nil, $$38, self = this;

      if ($iter) $Enumerable_each_with_object$37.$$p = null;
      
      
      if ($iter) $Enumerable_each_with_object$37.$$p = null;;
      if ((block !== nil)) {
      } else {
        return $send(self, 'enum_for', ["each_with_object", object], ($$38 = function(){var self = $$38.$$s == null ? this : $$38.$$s;

          return self.$enumerator_size()}, $$38.$$s = self, $$38.$$arity = 0, $$38))
      };
      
      self.$each.$$p = function() {
        var param = $$($nesting, 'Opal').$destructure(arguments);

        block(param, object);
      };

      self.$each();
    ;
      return object;
    }, $Enumerable_each_with_object$37.$$arity = 1);
    
    Opal.def(self, '$entries', $Enumerable_entries$39 = function $$entries($a) {
      var $post_args, args, self = this;

      
      
      $post_args = Opal.slice.call(arguments, 0, arguments.length);
      
      args = $post_args;;
      
      var result = [];

      self.$each.$$p = function() {
        result.push($$($nesting, 'Opal').$destructure(arguments));
      };

      self.$each.apply(self, args);

      return result;
    ;
    }, $Enumerable_entries$39.$$arity = -1);
    
    Opal.def(self, '$filter_map', $Enumerable_filter_map$40 = function $$filter_map() {
      var $iter = $Enumerable_filter_map$40.$$p, block = $iter || nil, $$41, self = this;

      if ($iter) $Enumerable_filter_map$40.$$p = null;
      
      
      if ($iter) $Enumerable_filter_map$40.$$p = null;;
      if ((block !== nil)) {
      } else {
        return $send(self, 'enum_for', ["filter_map"], ($$41 = function(){var self = $$41.$$s == null ? this : $$41.$$s;

          return self.$enumerator_size()}, $$41.$$s = self, $$41.$$arity = 0, $$41))
      };
      return $send($send(self, 'map', [], block.$to_proc()), 'select', [], "itself".$to_proc());
    }, $Enumerable_filter_map$40.$$arity = 0);
    $alias(self, "find", "detect");
    
    Opal.def(self, '$find_all', $Enumerable_find_all$42 = function $$find_all() {
      var $iter = $Enumerable_find_all$42.$$p, block = $iter || nil, $$43, self = this;

      if ($iter) $Enumerable_find_all$42.$$p = null;
      
      
      if ($iter) $Enumerable_find_all$42.$$p = null;;
      if ((block !== nil)) {
      } else {
        return $send(self, 'enum_for', ["find_all"], ($$43 = function(){var self = $$43.$$s == null ? this : $$43.$$s;

          return self.$enumerator_size()}, $$43.$$s = self, $$43.$$arity = 0, $$43))
      };
      
      var result = [];

      self.$each.$$p = function() {
        var param = $$($nesting, 'Opal').$destructure(arguments),
            value = Opal.yield1(block, param);

        if ($truthy(value)) {
          result.push(param);
        }
      };

      self.$each();

      return result;
    ;
    }, $Enumerable_find_all$42.$$arity = 0);
    $alias(self, "filter", "find_all");
    
    Opal.def(self, '$find_index', $Enumerable_find_index$44 = function $$find_index(object) {try {

      var $iter = $Enumerable_find_index$44.$$p, block = $iter || nil, $$45, $$46, self = this, index = nil;

      if ($iter) $Enumerable_find_index$44.$$p = null;
      
      
      if ($iter) $Enumerable_find_index$44.$$p = null;;
      ;
      if ($truthy(object === undefined && block === nil)) {
        return self.$enum_for("find_index")};
      
      if (object != null && block !== nil) {
        self.$warn("warning: given block not used")
      }
    ;
      index = 0;
      if ($truthy(object != null)) {
        $send(self, 'each', [], ($$45 = function($a){var self = $$45.$$s == null ? this : $$45.$$s, $post_args, value;

          
          
          $post_args = Opal.slice.call(arguments, 0, arguments.length);
          
          value = $post_args;;
          if ($$($nesting, 'Opal').$destructure(value)['$=='](object)) {
            Opal.ret(index)};
          return index += 1;;}, $$45.$$s = self, $$45.$$arity = -1, $$45))
      } else {
        $send(self, 'each', [], ($$46 = function($a){var self = $$46.$$s == null ? this : $$46.$$s, $post_args, value;

          
          
          $post_args = Opal.slice.call(arguments, 0, arguments.length);
          
          value = $post_args;;
          if ($truthy(Opal.yieldX(block, Opal.to_a(value)))) {
            Opal.ret(index)};
          return index += 1;;}, $$46.$$s = self, $$46.$$arity = -1, $$46))
      };
      return nil;
      } catch ($returner) { if ($returner === Opal.returner) { return $returner.$v } throw $returner; }
    }, $Enumerable_find_index$44.$$arity = -1);
    
    Opal.def(self, '$first', $Enumerable_first$47 = function $$first(number) {try {

      var $$48, $$49, self = this, result = nil, current = nil;

      
      ;
      if ($truthy(number === undefined)) {
        return $send(self, 'each', [], ($$48 = function(value){var self = $$48.$$s == null ? this : $$48.$$s;

          
          
          if (value == null) {
            value = nil;
          };
          Opal.ret(value);}, $$48.$$s = self, $$48.$$arity = 1, $$48))
      } else {
        
        result = [];
        number = $coerce_to(number, $$($nesting, 'Integer'), 'to_int');
        if ($truthy(number < 0)) {
          self.$raise($$($nesting, 'ArgumentError'), "attempt to take negative size")};
        if ($truthy(number == 0)) {
          return []};
        current = 0;
        $send(self, 'each', [], ($$49 = function($a){var self = $$49.$$s == null ? this : $$49.$$s, $post_args, args;

          
          
          $post_args = Opal.slice.call(arguments, 0, arguments.length);
          
          args = $post_args;;
          result.push($$($nesting, 'Opal').$destructure(args));
          if ($truthy(number <= ++current)) {
            Opal.ret(result)
          } else {
            return nil
          };}, $$49.$$s = self, $$49.$$arity = -1, $$49));
        return result;
      };
      } catch ($returner) { if ($returner === Opal.returner) { return $returner.$v } throw $returner; }
    }, $Enumerable_first$47.$$arity = -1);
    $alias(self, "flat_map", "collect_concat");
    
    Opal.def(self, '$grep', $Enumerable_grep$50 = function $$grep(pattern) {
      var $iter = $Enumerable_grep$50.$$p, block = $iter || nil, $$51, self = this, result = nil;

      if ($iter) $Enumerable_grep$50.$$p = null;
      
      
      if ($iter) $Enumerable_grep$50.$$p = null;;
      result = [];
      $send(self, 'each', [], ($$51 = function($a){var self = $$51.$$s == null ? this : $$51.$$s, $post_args, value, cmp = nil;

        
        
        $post_args = Opal.slice.call(arguments, 0, arguments.length);
        
        value = $post_args;;
        cmp = comparableForPattern(value);
        if ($truthy($send(pattern, '__send__', ["==="].concat(Opal.to_a(cmp))))) {
        } else {
          return nil;
        };
        if ((block !== nil)) {
          
          if ($truthy($rb_gt(value.$length(), 1))) {
            value = [value]};
          value = Opal.yieldX(block, Opal.to_a(value));
        } else if ($truthy($rb_le(value.$length(), 1))) {
          value = value['$[]'](0)};
        return result.$push(value);}, $$51.$$s = self, $$51.$$arity = -1, $$51));
      return result;
    }, $Enumerable_grep$50.$$arity = 1);
    
    Opal.def(self, '$grep_v', $Enumerable_grep_v$52 = function $$grep_v(pattern) {
      var $iter = $Enumerable_grep_v$52.$$p, block = $iter || nil, $$53, self = this, result = nil;

      if ($iter) $Enumerable_grep_v$52.$$p = null;
      
      
      if ($iter) $Enumerable_grep_v$52.$$p = null;;
      result = [];
      $send(self, 'each', [], ($$53 = function($a){var self = $$53.$$s == null ? this : $$53.$$s, $post_args, value, cmp = nil;

        
        
        $post_args = Opal.slice.call(arguments, 0, arguments.length);
        
        value = $post_args;;
        cmp = comparableForPattern(value);
        if ($truthy($send(pattern, '__send__', ["==="].concat(Opal.to_a(cmp))))) {
          return nil;};
        if ((block !== nil)) {
          
          if ($truthy($rb_gt(value.$length(), 1))) {
            value = [value]};
          value = Opal.yieldX(block, Opal.to_a(value));
        } else if ($truthy($rb_le(value.$length(), 1))) {
          value = value['$[]'](0)};
        return result.$push(value);}, $$53.$$s = self, $$53.$$arity = -1, $$53));
      return result;
    }, $Enumerable_grep_v$52.$$arity = 1);
    
    Opal.def(self, '$group_by', $Enumerable_group_by$54 = function $$group_by() {
      var $iter = $Enumerable_group_by$54.$$p, block = $iter || nil, $$55, self = this, hash = nil, $ret_or_2 = nil, $writer = nil;

      if ($iter) $Enumerable_group_by$54.$$p = null;
      
      
      if ($iter) $Enumerable_group_by$54.$$p = null;;
      if ((block !== nil)) {
      } else {
        return $send(self, 'enum_for', ["group_by"], ($$55 = function(){var self = $$55.$$s == null ? this : $$55.$$s;

          return self.$enumerator_size()}, $$55.$$s = self, $$55.$$arity = 0, $$55))
      };
      hash = $hash2([], {});
      
      var result;

      self.$each.$$p = function() {
        var param = $$($nesting, 'Opal').$destructure(arguments),
            value = Opal.yield1(block, param);

        (function() {if ($truthy(($ret_or_2 = hash['$[]'](value)))) {
        return $ret_or_2
      } else {
        
        $writer = [value, []];
        $send(hash, '[]=', Opal.to_a($writer));
        return $writer[$rb_minus($writer["length"], 1)];
      }; return nil; })()['$<<'](param);
      }

      self.$each();

      if (result !== undefined) {
        return result;
      }
    ;
      return hash;
    }, $Enumerable_group_by$54.$$arity = 0);
    
    Opal.def(self, '$include?', $Enumerable_include$ques$56 = function(obj) {try {

      var $$57, self = this;

      
      $send(self, 'each', [], ($$57 = function($a){var self = $$57.$$s == null ? this : $$57.$$s, $post_args, args;

        
        
        $post_args = Opal.slice.call(arguments, 0, arguments.length);
        
        args = $post_args;;
        if ($$($nesting, 'Opal').$destructure(args)['$=='](obj)) {
          Opal.ret(true)
        } else {
          return nil
        };}, $$57.$$s = self, $$57.$$arity = -1, $$57));
      return false;
      } catch ($returner) { if ($returner === Opal.returner) { return $returner.$v } throw $returner; }
    }, $Enumerable_include$ques$56.$$arity = 1);
    
    Opal.def(self, '$inject', $Enumerable_inject$58 = function $$inject(object, sym) {
      var $iter = $Enumerable_inject$58.$$p, block = $iter || nil, self = this;

      if ($iter) $Enumerable_inject$58.$$p = null;
      
      
      if ($iter) $Enumerable_inject$58.$$p = null;;
      ;
      ;
      
      var result = object;

      if (block !== nil && sym === undefined) {
        self.$each.$$p = function() {
          var value = $$($nesting, 'Opal').$destructure(arguments);

          if (result === undefined) {
            result = value;
            return;
          }

          value = Opal.yieldX(block, [result, value]);

          result = value;
        };
      }
      else {
        if (sym === undefined) {
          if (!$$($nesting, 'Symbol')['$==='](object)) {
            self.$raise($$($nesting, 'TypeError'), "" + (object.$inspect()) + " is not a Symbol");
          }

          sym    = object;
          result = undefined;
        }

        self.$each.$$p = function() {
          var value = $$($nesting, 'Opal').$destructure(arguments);

          if (result === undefined) {
            result = value;
            return;
          }

          result = (result).$__send__(sym, value);
        };
      }

      self.$each();

      return result == undefined ? nil : result;
    ;
    }, $Enumerable_inject$58.$$arity = -1);
    
    Opal.def(self, '$lazy', $Enumerable_lazy$59 = function $$lazy() {
      var $$60, self = this;

      return $send($$$($$($nesting, 'Enumerator'), 'Lazy'), 'new', [self, self.$enumerator_size()], ($$60 = function(enum$, $a){var self = $$60.$$s == null ? this : $$60.$$s, $post_args, args;

        
        
        if (enum$ == null) {
          enum$ = nil;
        };
        
        $post_args = Opal.slice.call(arguments, 1, arguments.length);
        
        args = $post_args;;
        return $send(enum$, 'yield', Opal.to_a(args));}, $$60.$$s = self, $$60.$$arity = -2, $$60))
    }, $Enumerable_lazy$59.$$arity = 0);
    
    Opal.def(self, '$enumerator_size', $Enumerable_enumerator_size$61 = function $$enumerator_size() {
      var self = this;

      if ($truthy(self['$respond_to?']("size"))) {
        return self.$size()
      } else {
        return nil
      }
    }, $Enumerable_enumerator_size$61.$$arity = 0);
    $alias(self, "map", "collect");
    
    Opal.def(self, '$max', $Enumerable_max$62 = function $$max(n) {
      var $iter = $Enumerable_max$62.$$p, block = $iter || nil, self = this;

      if ($iter) $Enumerable_max$62.$$p = null;
      
      
      if ($iter) $Enumerable_max$62.$$p = null;;
      ;
      
      if (n === undefined || n === nil) {
        var result, value;

        self.$each.$$p = function() {
          var item = $$($nesting, 'Opal').$destructure(arguments);

          if (result === undefined) {
            result = item;
            return;
          }

          if (block !== nil) {
            value = Opal.yieldX(block, [item, result]);
          } else {
            value = (item)['$<=>'](result);
          }

          if (value === nil) {
            self.$raise($$($nesting, 'ArgumentError'), "comparison failed");
          }

          if (value > 0) {
            result = item;
          }
        }

        self.$each();

        if (result === undefined) {
          return nil;
        } else {
          return result;
        }
      }

      n = $coerce_to(n, $$($nesting, 'Integer'), 'to_int');
    ;
      return $send(self, 'sort', [], block.$to_proc()).$reverse().$first(n);
    }, $Enumerable_max$62.$$arity = -1);
    
    Opal.def(self, '$max_by', $Enumerable_max_by$63 = function $$max_by(n) {
      var $iter = $Enumerable_max_by$63.$$p, block = $iter || nil, $$64, self = this;

      if ($iter) $Enumerable_max_by$63.$$p = null;
      
      
      if ($iter) $Enumerable_max_by$63.$$p = null;;
      
      if (n == null) {
        n = nil;
      };
      if ($truthy(block)) {
      } else {
        return $send(self, 'enum_for', ["max_by", n], ($$64 = function(){var self = $$64.$$s == null ? this : $$64.$$s;

          return self.$enumerator_size()}, $$64.$$s = self, $$64.$$arity = 0, $$64))
      };
      if ($truthy(n['$nil?']())) {
      } else {
        return $send(self, 'sort_by', [], block.$to_proc()).$reverse().$take(n)
      };
      
      var result,
          by;

      self.$each.$$p = function() {
        var param = $$($nesting, 'Opal').$destructure(arguments),
            value = Opal.yield1(block, param);

        if (result === undefined) {
          result = param;
          by     = value;
          return;
        }

        if ((value)['$<=>'](by) > 0) {
          result = param
          by     = value;
        }
      };

      self.$each();

      return result === undefined ? nil : result;
    ;
    }, $Enumerable_max_by$63.$$arity = -1);
    $alias(self, "member?", "include?");
    
    Opal.def(self, '$min', $Enumerable_min$65 = function $$min(n) {
      var $iter = $Enumerable_min$65.$$p, block = $iter || nil, $$66, self = this;

      if ($iter) $Enumerable_min$65.$$p = null;
      
      
      if ($iter) $Enumerable_min$65.$$p = null;;
      
      if (n == null) {
        n = nil;
      };
      if ($truthy(n['$nil?']())) {
      } else if ((block !== nil)) {
        return $send(self, 'sort', [], ($$66 = function(a, b){var self = $$66.$$s == null ? this : $$66.$$s;

          
          
          if (a == null) {
            a = nil;
          };
          
          if (b == null) {
            b = nil;
          };
          return Opal.yieldX(block, [a, b]);;}, $$66.$$s = self, $$66.$$arity = 2, $$66)).$take(n)
      } else {
        return self.$sort().$take(n)
      };
      
      var result;

      if (block !== nil) {
        self.$each.$$p = function() {
          var param = $$($nesting, 'Opal').$destructure(arguments);

          if (result === undefined) {
            result = param;
            return;
          }

          var value = block(param, result);

          if (value === nil) {
            self.$raise($$($nesting, 'ArgumentError'), "comparison failed");
          }

          if (value < 0) {
            result = param;
          }
        };
      }
      else {
        self.$each.$$p = function() {
          var param = $$($nesting, 'Opal').$destructure(arguments);

          if (result === undefined) {
            result = param;
            return;
          }

          if ($$($nesting, 'Opal').$compare(param, result) < 0) {
            result = param;
          }
        };
      }

      self.$each();

      return result === undefined ? nil : result;
    ;
    }, $Enumerable_min$65.$$arity = -1);
    
    Opal.def(self, '$min_by', $Enumerable_min_by$67 = function $$min_by(n) {
      var $iter = $Enumerable_min_by$67.$$p, block = $iter || nil, $$68, self = this;

      if ($iter) $Enumerable_min_by$67.$$p = null;
      
      
      if ($iter) $Enumerable_min_by$67.$$p = null;;
      
      if (n == null) {
        n = nil;
      };
      if ($truthy(block)) {
      } else {
        return $send(self, 'enum_for', ["min_by", n], ($$68 = function(){var self = $$68.$$s == null ? this : $$68.$$s;

          return self.$enumerator_size()}, $$68.$$s = self, $$68.$$arity = 0, $$68))
      };
      if ($truthy(n['$nil?']())) {
      } else {
        return $send(self, 'sort_by', [], block.$to_proc()).$take(n)
      };
      
      var result,
          by;

      self.$each.$$p = function() {
        var param = $$($nesting, 'Opal').$destructure(arguments),
            value = Opal.yield1(block, param);

        if (result === undefined) {
          result = param;
          by     = value;
          return;
        }

        if ((value)['$<=>'](by) < 0) {
          result = param
          by     = value;
        }
      };

      self.$each();

      return result === undefined ? nil : result;
    ;
    }, $Enumerable_min_by$67.$$arity = -1);
    
    Opal.def(self, '$minmax', $Enumerable_minmax$69 = function $$minmax() {
      var $iter = $Enumerable_minmax$69.$$p, block = $iter || nil, $$70, self = this, $ret_or_3 = nil;

      if ($iter) $Enumerable_minmax$69.$$p = null;
      
      
      if ($iter) $Enumerable_minmax$69.$$p = null;;
      block = (function() {if ($truthy(($ret_or_3 = block))) {
        return $ret_or_3
      } else {
        return $send(self, 'proc', [], ($$70 = function(a, b){var self = $$70.$$s == null ? this : $$70.$$s;

          
          
          if (a == null) {
            a = nil;
          };
          
          if (b == null) {
            b = nil;
          };
          return a['$<=>'](b);}, $$70.$$s = self, $$70.$$arity = 2, $$70))
      }; return nil; })();
      
      var min = nil, max = nil, first_time = true;

      self.$each.$$p = function() {
        var element = $$($nesting, 'Opal').$destructure(arguments);
        if (first_time) {
          min = max = element;
          first_time = false;
        } else {
          var min_cmp = block.$call(min, element);

          if (min_cmp === nil) {
            self.$raise($$($nesting, 'ArgumentError'), "comparison failed")
          } else if (min_cmp > 0) {
            min = element;
          }

          var max_cmp = block.$call(max, element);

          if (max_cmp === nil) {
            self.$raise($$($nesting, 'ArgumentError'), "comparison failed")
          } else if (max_cmp < 0) {
            max = element;
          }
        }
      }

      self.$each();

      return [min, max];
    ;
    }, $Enumerable_minmax$69.$$arity = 0);
    
    Opal.def(self, '$minmax_by', $Enumerable_minmax_by$71 = function $$minmax_by() {
      var $iter = $Enumerable_minmax_by$71.$$p, block = $iter || nil, $$72, self = this;

      if ($iter) $Enumerable_minmax_by$71.$$p = null;
      
      
      if ($iter) $Enumerable_minmax_by$71.$$p = null;;
      if ($truthy(block)) {
      } else {
        return $send(self, 'enum_for', ["minmax_by"], ($$72 = function(){var self = $$72.$$s == null ? this : $$72.$$s;

          return self.$enumerator_size()}, $$72.$$s = self, $$72.$$arity = 0, $$72))
      };
      
      var min_result = nil,
          max_result = nil,
          min_by,
          max_by;

      self.$each.$$p = function() {
        var param = $$($nesting, 'Opal').$destructure(arguments),
            value = Opal.yield1(block, param);

        if ((min_by === undefined) || (value)['$<=>'](min_by) < 0) {
          min_result = param;
          min_by     = value;
        }

        if ((max_by === undefined) || (value)['$<=>'](max_by) > 0) {
          max_result = param;
          max_by     = value;
        }
      };

      self.$each();

      return [min_result, max_result];
    ;
    }, $Enumerable_minmax_by$71.$$arity = 0);
    
    Opal.def(self, '$none?', $Enumerable_none$ques$73 = function(pattern) {try {

      var $iter = $Enumerable_none$ques$73.$$p, block = $iter || nil, $$74, $$75, $$76, self = this;

      if ($iter) $Enumerable_none$ques$73.$$p = null;
      
      
      if ($iter) $Enumerable_none$ques$73.$$p = null;;
      ;
      if ($truthy(pattern !== undefined)) {
        $send(self, 'each', [], ($$74 = function($a){var self = $$74.$$s == null ? this : $$74.$$s, $post_args, value, comparable = nil;

          
          
          $post_args = Opal.slice.call(arguments, 0, arguments.length);
          
          value = $post_args;;
          comparable = comparableForPattern(value);
          if ($truthy($send(pattern, 'public_send', ["==="].concat(Opal.to_a(comparable))))) {
            Opal.ret(false)
          } else {
            return nil
          };}, $$74.$$s = self, $$74.$$arity = -1, $$74))
      } else if ((block !== nil)) {
        $send(self, 'each', [], ($$75 = function($a){var self = $$75.$$s == null ? this : $$75.$$s, $post_args, value;

          
          
          $post_args = Opal.slice.call(arguments, 0, arguments.length);
          
          value = $post_args;;
          if ($truthy(Opal.yieldX(block, Opal.to_a(value)))) {
            Opal.ret(false)
          } else {
            return nil
          };}, $$75.$$s = self, $$75.$$arity = -1, $$75))
      } else {
        $send(self, 'each', [], ($$76 = function($a){var self = $$76.$$s == null ? this : $$76.$$s, $post_args, value, item = nil;

          
          
          $post_args = Opal.slice.call(arguments, 0, arguments.length);
          
          value = $post_args;;
          item = $$($nesting, 'Opal').$destructure(value);
          if ($truthy(item)) {
            Opal.ret(false)
          } else {
            return nil
          };}, $$76.$$s = self, $$76.$$arity = -1, $$76))
      };
      return true;
      } catch ($returner) { if ($returner === Opal.returner) { return $returner.$v } throw $returner; }
    }, $Enumerable_none$ques$73.$$arity = -1);
    
    Opal.def(self, '$one?', $Enumerable_one$ques$77 = function(pattern) {try {

      var $iter = $Enumerable_one$ques$77.$$p, block = $iter || nil, $$78, $$79, $$80, self = this, count = nil;

      if ($iter) $Enumerable_one$ques$77.$$p = null;
      
      
      if ($iter) $Enumerable_one$ques$77.$$p = null;;
      ;
      count = 0;
      if ($truthy(pattern !== undefined)) {
        $send(self, 'each', [], ($$78 = function($a){var self = $$78.$$s == null ? this : $$78.$$s, $post_args, value, comparable = nil;

          
          
          $post_args = Opal.slice.call(arguments, 0, arguments.length);
          
          value = $post_args;;
          comparable = comparableForPattern(value);
          if ($truthy($send(pattern, 'public_send', ["==="].concat(Opal.to_a(comparable))))) {
            
            count = $rb_plus(count, 1);
            if ($truthy($rb_gt(count, 1))) {
              Opal.ret(false)
            } else {
              return nil
            };
          } else {
            return nil
          };}, $$78.$$s = self, $$78.$$arity = -1, $$78))
      } else if ((block !== nil)) {
        $send(self, 'each', [], ($$79 = function($a){var self = $$79.$$s == null ? this : $$79.$$s, $post_args, value;

          
          
          $post_args = Opal.slice.call(arguments, 0, arguments.length);
          
          value = $post_args;;
          if ($truthy(Opal.yieldX(block, Opal.to_a(value)))) {
          } else {
            return nil;
          };
          count = $rb_plus(count, 1);
          if ($truthy($rb_gt(count, 1))) {
            Opal.ret(false)
          } else {
            return nil
          };}, $$79.$$s = self, $$79.$$arity = -1, $$79))
      } else {
        $send(self, 'each', [], ($$80 = function($a){var self = $$80.$$s == null ? this : $$80.$$s, $post_args, value;

          
          
          $post_args = Opal.slice.call(arguments, 0, arguments.length);
          
          value = $post_args;;
          if ($truthy($$($nesting, 'Opal').$destructure(value))) {
          } else {
            return nil;
          };
          count = $rb_plus(count, 1);
          if ($truthy($rb_gt(count, 1))) {
            Opal.ret(false)
          } else {
            return nil
          };}, $$80.$$s = self, $$80.$$arity = -1, $$80))
      };
      return count['$=='](1);
      } catch ($returner) { if ($returner === Opal.returner) { return $returner.$v } throw $returner; }
    }, $Enumerable_one$ques$77.$$arity = -1);
    
    Opal.def(self, '$partition', $Enumerable_partition$81 = function $$partition() {
      var $iter = $Enumerable_partition$81.$$p, block = $iter || nil, $$82, self = this;

      if ($iter) $Enumerable_partition$81.$$p = null;
      
      
      if ($iter) $Enumerable_partition$81.$$p = null;;
      if ((block !== nil)) {
      } else {
        return $send(self, 'enum_for', ["partition"], ($$82 = function(){var self = $$82.$$s == null ? this : $$82.$$s;

          return self.$enumerator_size()}, $$82.$$s = self, $$82.$$arity = 0, $$82))
      };
      
      var truthy = [], falsy = [], result;

      self.$each.$$p = function() {
        var param = $$($nesting, 'Opal').$destructure(arguments),
            value = Opal.yield1(block, param);

        if ($truthy(value)) {
          truthy.push(param);
        }
        else {
          falsy.push(param);
        }
      };

      self.$each();

      return [truthy, falsy];
    ;
    }, $Enumerable_partition$81.$$arity = 0);
    $alias(self, "reduce", "inject");
    
    Opal.def(self, '$reject', $Enumerable_reject$83 = function $$reject() {
      var $iter = $Enumerable_reject$83.$$p, block = $iter || nil, $$84, self = this;

      if ($iter) $Enumerable_reject$83.$$p = null;
      
      
      if ($iter) $Enumerable_reject$83.$$p = null;;
      if ((block !== nil)) {
      } else {
        return $send(self, 'enum_for', ["reject"], ($$84 = function(){var self = $$84.$$s == null ? this : $$84.$$s;

          return self.$enumerator_size()}, $$84.$$s = self, $$84.$$arity = 0, $$84))
      };
      
      var result = [];

      self.$each.$$p = function() {
        var param = $$($nesting, 'Opal').$destructure(arguments),
            value = Opal.yield1(block, param);

        if ($falsy(value)) {
          result.push(param);
        }
      };

      self.$each();

      return result;
    ;
    }, $Enumerable_reject$83.$$arity = 0);
    
    Opal.def(self, '$reverse_each', $Enumerable_reverse_each$85 = function $$reverse_each() {
      var $iter = $Enumerable_reverse_each$85.$$p, block = $iter || nil, $$86, self = this;

      if ($iter) $Enumerable_reverse_each$85.$$p = null;
      
      
      if ($iter) $Enumerable_reverse_each$85.$$p = null;;
      if ((block !== nil)) {
      } else {
        return $send(self, 'enum_for', ["reverse_each"], ($$86 = function(){var self = $$86.$$s == null ? this : $$86.$$s;

          return self.$enumerator_size()}, $$86.$$s = self, $$86.$$arity = 0, $$86))
      };
      
      var result = [];

      self.$each.$$p = function() {
        result.push(arguments);
      };

      self.$each();

      for (var i = result.length - 1; i >= 0; i--) {
        Opal.yieldX(block, result[i]);
      }

      return result;
    ;
    }, $Enumerable_reverse_each$85.$$arity = 0);
    $alias(self, "select", "find_all");
    
    Opal.def(self, '$slice_before', $Enumerable_slice_before$87 = function $$slice_before(pattern) {
      var $iter = $Enumerable_slice_before$87.$$p, block = $iter || nil, $$88, self = this;

      if ($iter) $Enumerable_slice_before$87.$$p = null;
      
      
      if ($iter) $Enumerable_slice_before$87.$$p = null;;
      ;
      if ($truthy(pattern === undefined && block === nil)) {
        self.$raise($$($nesting, 'ArgumentError'), "both pattern and block are given")};
      if ($truthy(pattern !== undefined && block !== nil || arguments.length > 1)) {
        self.$raise($$($nesting, 'ArgumentError'), "" + "wrong number of arguments (" + (arguments.length) + " expected 1)")};
      return $send($$($nesting, 'Enumerator'), 'new', [], ($$88 = function(e){var self = $$88.$$s == null ? this : $$88.$$s;

        
        
        if (e == null) {
          e = nil;
        };
        
        var slice = [];

        if (block !== nil) {
          if (pattern === undefined) {
            self.$each.$$p = function() {
              var param = $$($nesting, 'Opal').$destructure(arguments),
                  value = Opal.yield1(block, param);

              if ($truthy(value) && slice.length > 0) {
                e['$<<'](slice);
                slice = [];
              }

              slice.push(param);
            };
          }
          else {
            self.$each.$$p = function() {
              var param = $$($nesting, 'Opal').$destructure(arguments),
                  value = block(param, pattern.$dup());

              if ($truthy(value) && slice.length > 0) {
                e['$<<'](slice);
                slice = [];
              }

              slice.push(param);
            };
          }
        }
        else {
          self.$each.$$p = function() {
            var param = $$($nesting, 'Opal').$destructure(arguments),
                value = pattern['$==='](param);

            if ($truthy(value) && slice.length > 0) {
              e['$<<'](slice);
              slice = [];
            }

            slice.push(param);
          };
        }

        self.$each();

        if (slice.length > 0) {
          e['$<<'](slice);
        }
      ;}, $$88.$$s = self, $$88.$$arity = 1, $$88));
    }, $Enumerable_slice_before$87.$$arity = -1);
    
    Opal.def(self, '$slice_after', $Enumerable_slice_after$89 = function $$slice_after(pattern) {
      var $iter = $Enumerable_slice_after$89.$$p, block = $iter || nil, $$90, $$91, self = this;

      if ($iter) $Enumerable_slice_after$89.$$p = null;
      
      
      if ($iter) $Enumerable_slice_after$89.$$p = null;;
      ;
      if ($truthy(pattern === undefined && block === nil)) {
        self.$raise($$($nesting, 'ArgumentError'), "both pattern and block are given")};
      if ($truthy(pattern !== undefined && block !== nil || arguments.length > 1)) {
        self.$raise($$($nesting, 'ArgumentError'), "" + "wrong number of arguments (" + (arguments.length) + " expected 1)")};
      if ($truthy(pattern !== undefined)) {
        block = $send(self, 'proc', [], ($$90 = function(e){var self = $$90.$$s == null ? this : $$90.$$s;

          
          
          if (e == null) {
            e = nil;
          };
          return pattern['$==='](e);}, $$90.$$s = self, $$90.$$arity = 1, $$90))};
      return $send($$($nesting, 'Enumerator'), 'new', [], ($$91 = function(yielder){var self = $$91.$$s == null ? this : $$91.$$s;

        
        
        if (yielder == null) {
          yielder = nil;
        };
        
        var accumulate;

        self.$each.$$p = function() {
          var element = $$($nesting, 'Opal').$destructure(arguments),
              end_chunk = Opal.yield1(block, element);

          if (accumulate == null) {
            accumulate = [];
          }

          if ($truthy(end_chunk)) {
            accumulate.push(element);
            yielder.$yield(accumulate);
            accumulate = null;
          } else {
            accumulate.push(element)
          }
        }

        self.$each();

        if (accumulate != null) {
          yielder.$yield(accumulate);
        }
      ;}, $$91.$$s = self, $$91.$$arity = 1, $$91));
    }, $Enumerable_slice_after$89.$$arity = -1);
    
    Opal.def(self, '$slice_when', $Enumerable_slice_when$92 = function $$slice_when() {
      var $iter = $Enumerable_slice_when$92.$$p, block = $iter || nil, $$93, self = this;

      if ($iter) $Enumerable_slice_when$92.$$p = null;
      
      
      if ($iter) $Enumerable_slice_when$92.$$p = null;;
      if ((block !== nil)) {
      } else {
        self.$raise($$($nesting, 'ArgumentError'), "wrong number of arguments (0 for 1)")
      };
      return $send($$($nesting, 'Enumerator'), 'new', [], ($$93 = function(yielder){var self = $$93.$$s == null ? this : $$93.$$s;

        
        
        if (yielder == null) {
          yielder = nil;
        };
        
        var slice = nil, last_after = nil;

        self.$each_cons.$$p = function() {
          var params = $$($nesting, 'Opal').$destructure(arguments),
              before = params[0],
              after = params[1],
              match = Opal.yieldX(block, [before, after]);

          last_after = after;

          if (slice === nil) {
            slice = [];
          }

          if ($truthy(match)) {
            slice.push(before);
            yielder.$yield(slice);
            slice = [];
          } else {
            slice.push(before);
          }
        }

        self.$each_cons(2);

        if (slice !== nil) {
          slice.push(last_after);
          yielder.$yield(slice);
        }
      ;}, $$93.$$s = self, $$93.$$arity = 1, $$93));
    }, $Enumerable_slice_when$92.$$arity = 0);
    
    Opal.def(self, '$sort', $Enumerable_sort$94 = function $$sort() {
      var $iter = $Enumerable_sort$94.$$p, block = $iter || nil, $$95, self = this, ary = nil;

      if ($iter) $Enumerable_sort$94.$$p = null;
      
      
      if ($iter) $Enumerable_sort$94.$$p = null;;
      ary = self.$to_a();
      if ((block !== nil)) {
      } else {
        block = $lambda(($$95 = function(a, b){var self = $$95.$$s == null ? this : $$95.$$s;

          
          
          if (a == null) {
            a = nil;
          };
          
          if (b == null) {
            b = nil;
          };
          return a['$<=>'](b);}, $$95.$$s = self, $$95.$$arity = 2, $$95))
      };
      return $send(ary, 'sort', [], block.$to_proc());
    }, $Enumerable_sort$94.$$arity = 0);
    
    Opal.def(self, '$sort_by', $Enumerable_sort_by$96 = function $$sort_by() {
      var $iter = $Enumerable_sort_by$96.$$p, block = $iter || nil, $$97, $$98, $$99, $$100, self = this, dup = nil;

      if ($iter) $Enumerable_sort_by$96.$$p = null;
      
      
      if ($iter) $Enumerable_sort_by$96.$$p = null;;
      if ((block !== nil)) {
      } else {
        return $send(self, 'enum_for', ["sort_by"], ($$97 = function(){var self = $$97.$$s == null ? this : $$97.$$s;

          return self.$enumerator_size()}, $$97.$$s = self, $$97.$$arity = 0, $$97))
      };
      dup = $send(self, 'map', [], ($$98 = function(){var self = $$98.$$s == null ? this : $$98.$$s, arg = nil;

        
        arg = $$($nesting, 'Opal').$destructure(arguments);
        return [Opal.yield1(block, arg), arg];}, $$98.$$s = self, $$98.$$arity = 0, $$98));
      $send(dup, 'sort!', [], ($$99 = function(a, b){var self = $$99.$$s == null ? this : $$99.$$s;

        
        
        if (a == null) {
          a = nil;
        };
        
        if (b == null) {
          b = nil;
        };
        return (a[0])['$<=>'](b[0]);}, $$99.$$s = self, $$99.$$arity = 2, $$99));
      return $send(dup, 'map!', [], ($$100 = function(i){var self = $$100.$$s == null ? this : $$100.$$s;

        
        
        if (i == null) {
          i = nil;
        };
        return i[1];;}, $$100.$$s = self, $$100.$$arity = 1, $$100));
    }, $Enumerable_sort_by$96.$$arity = 0);
    
    Opal.def(self, '$sum', $Enumerable_sum$101 = function $$sum(initial) {
      var $$102, $iter = $Enumerable_sum$101.$$p, $yield = $iter || nil, self = this, result = nil;

      if ($iter) $Enumerable_sum$101.$$p = null;
      
      
      if (initial == null) {
        initial = 0;
      };
      result = initial;
      $send(self, 'each', [], ($$102 = function($a){var self = $$102.$$s == null ? this : $$102.$$s, $post_args, args, item = nil;

        
        
        $post_args = Opal.slice.call(arguments, 0, arguments.length);
        
        args = $post_args;;
        item = (function() {if (($yield !== nil)) {
          return Opal.yieldX($yield, Opal.to_a(args));
        } else {
          return $$($nesting, 'Opal').$destructure(args)
        }; return nil; })();
        return (result = $rb_plus(result, item));}, $$102.$$s = self, $$102.$$arity = -1, $$102));
      return result;
    }, $Enumerable_sum$101.$$arity = -1);
    
    Opal.def(self, '$take', $Enumerable_take$103 = function $$take(num) {
      var self = this;

      return self.$first(num)
    }, $Enumerable_take$103.$$arity = 1);
    
    Opal.def(self, '$take_while', $Enumerable_take_while$104 = function $$take_while() {try {

      var $iter = $Enumerable_take_while$104.$$p, block = $iter || nil, $$105, self = this, result = nil;

      if ($iter) $Enumerable_take_while$104.$$p = null;
      
      
      if ($iter) $Enumerable_take_while$104.$$p = null;;
      if ($truthy(block)) {
      } else {
        return self.$enum_for("take_while")
      };
      result = [];
      return $send(self, 'each', [], ($$105 = function($a){var self = $$105.$$s == null ? this : $$105.$$s, $post_args, args, value = nil;

        
        
        $post_args = Opal.slice.call(arguments, 0, arguments.length);
        
        args = $post_args;;
        value = $$($nesting, 'Opal').$destructure(args);
        if ($truthy(Opal.yield1(block, value))) {
        } else {
          Opal.ret(result)
        };
        return result.push(value);;}, $$105.$$s = self, $$105.$$arity = -1, $$105));
      } catch ($returner) { if ($returner === Opal.returner) { return $returner.$v } throw $returner; }
    }, $Enumerable_take_while$104.$$arity = 0);
    
    Opal.def(self, '$uniq', $Enumerable_uniq$106 = function $$uniq() {
      var $iter = $Enumerable_uniq$106.$$p, block = $iter || nil, $$107, self = this, hash = nil;

      if ($iter) $Enumerable_uniq$106.$$p = null;
      
      
      if ($iter) $Enumerable_uniq$106.$$p = null;;
      hash = $hash2([], {});
      $send(self, 'each', [], ($$107 = function($a){var self = $$107.$$s == null ? this : $$107.$$s, $post_args, args, value = nil, produced = nil, $writer = nil;

        
        
        $post_args = Opal.slice.call(arguments, 0, arguments.length);
        
        args = $post_args;;
        value = $$($nesting, 'Opal').$destructure(args);
        produced = (function() {if ((block !== nil)) {
          return Opal.yield1(block, value);
        } else {
          return value
        }; return nil; })();
        if ($truthy(hash['$key?'](produced))) {
          return nil
        } else {
          
          $writer = [produced, value];
          $send(hash, '[]=', Opal.to_a($writer));
          return $writer[$rb_minus($writer["length"], 1)];
        };}, $$107.$$s = self, $$107.$$arity = -1, $$107));
      return hash.$values();
    }, $Enumerable_uniq$106.$$arity = 0);
    
    Opal.def(self, '$tally', $Enumerable_tally$108 = function $$tally() {
      var self = this;

      return $send($send(self, 'group_by', [], "itself".$to_proc()), 'transform_values', [], "count".$to_proc())
    }, $Enumerable_tally$108.$$arity = 0);
    $alias(self, "to_a", "entries");
    
    Opal.def(self, '$to_h', $Enumerable_to_h$109 = function $$to_h($a) {
      var $iter = $Enumerable_to_h$109.$$p, block = $iter || nil, $post_args, args, self = this;

      if ($iter) $Enumerable_to_h$109.$$p = null;
      
      
      if ($iter) $Enumerable_to_h$109.$$p = null;;
      
      $post_args = Opal.slice.call(arguments, 0, arguments.length);
      
      args = $post_args;;
      if ((block !== nil)) {
        return $send($send(self, 'map', [], block.$to_proc()), 'to_h', Opal.to_a(args))};
      
      var hash = $hash2([], {});

      self.$each.$$p = function() {
        var param = $$($nesting, 'Opal').$destructure(arguments);
        var ary = $$($nesting, 'Opal')['$coerce_to?'](param, $$($nesting, 'Array'), "to_ary"), key, val;
        if (!ary.$$is_array) {
          self.$raise($$($nesting, 'TypeError'), "" + "wrong element type " + ((ary).$class()) + " (expected array)")
        }
        if (ary.length !== 2) {
          self.$raise($$($nesting, 'ArgumentError'), "" + "wrong array length (expected 2, was " + ((ary).$length()) + ")")
        }
        key = ary[0];
        val = ary[1];

        Opal.hash_put(hash, key, val);
      };

      self.$each.apply(self, args);

      return hash;
    ;
    }, $Enumerable_to_h$109.$$arity = -1);
    return (Opal.def(self, '$zip', $Enumerable_zip$110 = function $$zip($a) {
      var $iter = $Enumerable_zip$110.$$p, block = $iter || nil, $post_args, others, self = this;

      if ($iter) $Enumerable_zip$110.$$p = null;
      
      
      if ($iter) $Enumerable_zip$110.$$p = null;;
      
      $post_args = Opal.slice.call(arguments, 0, arguments.length);
      
      others = $post_args;;
      return $send(self.$to_a(), 'zip', Opal.to_a(others));
    }, $Enumerable_zip$110.$$arity = -1), nil) && 'zip';
  })($nesting[0], $nesting)
};

Opal.modules["corelib/enumerator"] = function(Opal) {/* Generated by Opal 1.3.0 */
  function $rb_plus(lhs, rhs) {
    return (typeof(lhs) === 'number' && typeof(rhs) === 'number') ? lhs + rhs : lhs['$+'](rhs);
  }
  function $rb_lt(lhs, rhs) {
    return (typeof(lhs) === 'number' && typeof(rhs) === 'number') ? lhs < rhs : lhs['$<'](rhs);
  }
  var self = Opal.top, $nesting = [], nil = Opal.nil, $$$ = Opal.$$$, $$ = Opal.$$, $breaker = Opal.breaker, $slice = Opal.slice, $falsy = Opal.falsy, $truthy = Opal.truthy, $coerce_to = Opal.coerce_to, $klass = Opal.klass, $send = Opal.send, $alias = Opal.alias, $send2 = Opal.send2, $find_super = Opal.find_super;

  Opal.add_stubs(['$require', '$include', '$allocate', '$new', '$to_proc', '$!', '$respond_to?', '$nil?', '$empty?', '$+', '$class', '$__send__', '$call', '$enum_for', '$size', '$destructure', '$inspect', '$any?', '$[]', '$raise', '$yield', '$each', '$enumerator_size', '$try_convert', '$<', '$===', '$for']);
  
  self.$require("corelib/enumerable");
  return (function($base, $super, $parent_nesting) {
    var self = $klass($base, $super, 'Enumerator');

    var $nesting = [self].concat($parent_nesting), $Enumerator_for$1, $Enumerator_initialize$2, $Enumerator_each$3, $Enumerator_size$4, $Enumerator_with_index$5, $Enumerator_each_with_index$7, $Enumerator_inspect$9;

    self.$$prototype.size = self.$$prototype.args = self.$$prototype.object = self.$$prototype.method = nil;
    
    self.$include($$($nesting, 'Enumerable'));
    self.$$prototype.$$is_enumerator = true;
    Opal.defs(self, '$for', $Enumerator_for$1 = function(object, $a, $b) {
      var $iter = $Enumerator_for$1.$$p, block = $iter || nil, $post_args, method, args, self = this;

      if ($iter) $Enumerator_for$1.$$p = null;
      
      
      if ($iter) $Enumerator_for$1.$$p = null;;
      
      $post_args = Opal.slice.call(arguments, 1, arguments.length);
      
      if ($post_args.length > 0) {
        method = $post_args[0];
        $post_args.splice(0, 1);
      }
      if (method == null) {
        method = "each";
      };
      
      args = $post_args;;
      
      var obj = self.$allocate();

      obj.object = object;
      obj.size   = block;
      obj.method = method;
      obj.args   = args;

      return obj;
    ;
    }, $Enumerator_for$1.$$arity = -2);
    
    Opal.def(self, '$initialize', $Enumerator_initialize$2 = function $$initialize($a) {
      var $iter = $Enumerator_initialize$2.$$p, block = $iter || nil, $post_args, $rest_arg, self = this, $ret_or_1 = nil;

      if ($iter) $Enumerator_initialize$2.$$p = null;
      
      
      if ($iter) $Enumerator_initialize$2.$$p = null;;
      
      $post_args = Opal.slice.call(arguments, 0, arguments.length);
      
      $rest_arg = $post_args;;
      if ($truthy(block)) {
        
        self.object = $send($$($nesting, 'Generator'), 'new', [], block.$to_proc());
        self.method = "each";
        self.args = [];
        self.size = arguments[0] || nil;
        if ($truthy((function() {if ($truthy(($ret_or_1 = self.size))) {
          return self.size['$respond_to?']("call")['$!']()
        } else {
          return $ret_or_1
        }; return nil; })())) {
          return (self.size = $coerce_to(self.size, $$($nesting, 'Integer'), 'to_int'))
        } else {
          return nil
        };
      } else {
        
        self.object = arguments[0];
        self.method = arguments[1] || "each";
        self.args = $slice.call(arguments, 2);
        return (self.size = nil);
      };
    }, $Enumerator_initialize$2.$$arity = -1);
    
    Opal.def(self, '$each', $Enumerator_each$3 = function $$each($a) {
      var $iter = $Enumerator_each$3.$$p, block = $iter || nil, $post_args, args, self = this, $ret_or_2 = nil;

      if ($iter) $Enumerator_each$3.$$p = null;
      
      
      if ($iter) $Enumerator_each$3.$$p = null;;
      
      $post_args = Opal.slice.call(arguments, 0, arguments.length);
      
      args = $post_args;;
      if ($truthy((function() {if ($truthy(($ret_or_2 = block['$nil?']()))) {
        return args['$empty?']()
      } else {
        return $ret_or_2
      }; return nil; })())) {
        return self};
      args = $rb_plus(self.args, args);
      if ($truthy(block['$nil?']())) {
        return $send(self.$class(), 'new', [self.object, self.method].concat(Opal.to_a(args)))};
      return $send(self.object, '__send__', [self.method].concat(Opal.to_a(args)), block.$to_proc());
    }, $Enumerator_each$3.$$arity = -1);
    
    Opal.def(self, '$size', $Enumerator_size$4 = function $$size() {
      var self = this;

      if ($truthy(self.size['$respond_to?']("call"))) {
        return $send(self.size, 'call', Opal.to_a(self.args))
      } else {
        return self.size
      }
    }, $Enumerator_size$4.$$arity = 0);
    
    Opal.def(self, '$with_index', $Enumerator_with_index$5 = function $$with_index(offset) {
      var $iter = $Enumerator_with_index$5.$$p, block = $iter || nil, $$6, self = this;

      if ($iter) $Enumerator_with_index$5.$$p = null;
      
      
      if ($iter) $Enumerator_with_index$5.$$p = null;;
      
      if (offset == null) {
        offset = 0;
      };
      offset = (function() {if ($truthy(offset)) {
        return $coerce_to(offset, $$($nesting, 'Integer'), 'to_int')
      } else {
        return 0
      }; return nil; })();
      if ($truthy(block)) {
      } else {
        return $send(self, 'enum_for', ["with_index", offset], ($$6 = function(){var self = $$6.$$s == null ? this : $$6.$$s;

          return self.$size()}, $$6.$$s = self, $$6.$$arity = 0, $$6))
      };
      
      var result, index = offset;

      self.$each.$$p = function() {
        var param = $$($nesting, 'Opal').$destructure(arguments),
            value = block(param, index);

        index++;

        return value;
      }

      return self.$each();
    ;
    }, $Enumerator_with_index$5.$$arity = -1);
    $alias(self, "with_object", "each_with_object");
    
    Opal.def(self, '$each_with_index', $Enumerator_each_with_index$7 = function $$each_with_index() {
      var $iter = $Enumerator_each_with_index$7.$$p, block = $iter || nil, $$8, self = this;

      if ($iter) $Enumerator_each_with_index$7.$$p = null;
      
      
      if ($iter) $Enumerator_each_with_index$7.$$p = null;;
      if ((block !== nil)) {
      } else {
        return $send(self, 'enum_for', ["each_with_index"], ($$8 = function(){var self = $$8.$$s == null ? this : $$8.$$s;

          return self.$size()}, $$8.$$s = self, $$8.$$arity = 0, $$8))
      };
      $send2(self, $find_super(self, 'each_with_index', $Enumerator_each_with_index$7, false, true), 'each_with_index', [], $iter);
      return self.object;
    }, $Enumerator_each_with_index$7.$$arity = 0);
    
    Opal.def(self, '$inspect', $Enumerator_inspect$9 = function $$inspect() {
      var self = this, result = nil;

      
      result = "" + "#<" + (self.$class()) + ": " + (self.object.$inspect()) + ":" + (self.method);
      if ($truthy(self.args['$any?']())) {
        result = $rb_plus(result, "" + "(" + (self.args.$inspect()['$[]']($$($nesting, 'Range').$new(1, -2))) + ")")};
      return $rb_plus(result, ">");
    }, $Enumerator_inspect$9.$$arity = 0);
    (function($base, $super, $parent_nesting) {
      var self = $klass($base, $super, 'Generator');

      var $nesting = [self].concat($parent_nesting), $Generator_initialize$10, $Generator_each$11;

      self.$$prototype.block = nil;
      
      self.$include($$($nesting, 'Enumerable'));
      
      Opal.def(self, '$initialize', $Generator_initialize$10 = function $$initialize() {
        var $iter = $Generator_initialize$10.$$p, block = $iter || nil, self = this;

        if ($iter) $Generator_initialize$10.$$p = null;
        
        
        if ($iter) $Generator_initialize$10.$$p = null;;
        if ($truthy(block)) {
        } else {
          self.$raise($$($nesting, 'LocalJumpError'), "no block given")
        };
        return (self.block = block);
      }, $Generator_initialize$10.$$arity = 0);
      return (Opal.def(self, '$each', $Generator_each$11 = function $$each($a) {
        var $iter = $Generator_each$11.$$p, block = $iter || nil, $post_args, args, self = this, yielder = nil;

        if ($iter) $Generator_each$11.$$p = null;
        
        
        if ($iter) $Generator_each$11.$$p = null;;
        
        $post_args = Opal.slice.call(arguments, 0, arguments.length);
        
        args = $post_args;;
        yielder = $send($$($nesting, 'Yielder'), 'new', [], block.$to_proc());
        
        try {
          args.unshift(yielder);

          Opal.yieldX(self.block, args);
        }
        catch (e) {
          if (e === $breaker) {
            return $breaker.$v;
          }
          else {
            throw e;
          }
        }
      ;
        return self;
      }, $Generator_each$11.$$arity = -1), nil) && 'each';
    })($nesting[0], null, $nesting);
    (function($base, $super, $parent_nesting) {
      var self = $klass($base, $super, 'Yielder');

      var $nesting = [self].concat($parent_nesting), $Yielder_initialize$12, $Yielder_yield$13, $Yielder_$lt$lt$14;

      self.$$prototype.block = nil;
      
      
      Opal.def(self, '$initialize', $Yielder_initialize$12 = function $$initialize() {
        var $iter = $Yielder_initialize$12.$$p, block = $iter || nil, self = this;

        if ($iter) $Yielder_initialize$12.$$p = null;
        
        
        if ($iter) $Yielder_initialize$12.$$p = null;;
        return (self.block = block);
      }, $Yielder_initialize$12.$$arity = 0);
      
      Opal.def(self, '$yield', $Yielder_yield$13 = function($a) {
        var $post_args, values, self = this;

        
        
        $post_args = Opal.slice.call(arguments, 0, arguments.length);
        
        values = $post_args;;
        
        var value = Opal.yieldX(self.block, values);

        if (value === $breaker) {
          throw $breaker;
        }

        return value;
      ;
      }, $Yielder_yield$13.$$arity = -1);
      return (Opal.def(self, '$<<', $Yielder_$lt$lt$14 = function($a) {
        var $post_args, values, self = this;

        
        
        $post_args = Opal.slice.call(arguments, 0, arguments.length);
        
        values = $post_args;;
        $send(self, 'yield', Opal.to_a(values));
        return self;
      }, $Yielder_$lt$lt$14.$$arity = -1), nil) && '<<';
    })($nesting[0], null, $nesting);
    (function($base, $super, $parent_nesting) {
      var self = $klass($base, $super, 'Lazy');

      var $nesting = [self].concat($parent_nesting), $Lazy_initialize$15, $Lazy_lazy$18, $Lazy_collect$19, $Lazy_collect_concat$21, $Lazy_drop$25, $Lazy_drop_while$27, $Lazy_enum_for$29, $Lazy_find_all$30, $Lazy_grep$32, $Lazy_reject$35, $Lazy_take$37, $Lazy_take_while$39, $Lazy_inspect$41;

      self.$$prototype.enumerator = nil;
      
      (function($base, $super, $parent_nesting) {
        var self = $klass($base, $super, 'StopLazyError');

        var $nesting = [self].concat($parent_nesting);

        return nil
      })($nesting[0], $$($nesting, 'Exception'), $nesting);
      
      Opal.def(self, '$initialize', $Lazy_initialize$15 = function $$initialize(object, size) {
        var $iter = $Lazy_initialize$15.$$p, block = $iter || nil, $$16, self = this;

        if ($iter) $Lazy_initialize$15.$$p = null;
        
        
        if ($iter) $Lazy_initialize$15.$$p = null;;
        
        if (size == null) {
          size = nil;
        };
        if ((block !== nil)) {
        } else {
          self.$raise($$($nesting, 'ArgumentError'), "tried to call lazy new without a block")
        };
        self.enumerator = object;
        return $send2(self, $find_super(self, 'initialize', $Lazy_initialize$15, false, true), 'initialize', [size], ($$16 = function(yielder, $a){var self = $$16.$$s == null ? this : $$16.$$s, $post_args, each_args, $$17;

          
          
          if (yielder == null) {
            yielder = nil;
          };
          
          $post_args = Opal.slice.call(arguments, 1, arguments.length);
          
          each_args = $post_args;;
          try {
            return $send(object, 'each', Opal.to_a(each_args), ($$17 = function($b){var self = $$17.$$s == null ? this : $$17.$$s, $post_args, args;

              
              
              $post_args = Opal.slice.call(arguments, 0, arguments.length);
              
              args = $post_args;;
              
            args.unshift(yielder);

            Opal.yieldX(block, args);
          ;}, $$17.$$s = self, $$17.$$arity = -1, $$17))
          } catch ($err) {
            if (Opal.rescue($err, [$$($nesting, 'Exception')])) {
              try {
                return nil
              } finally { Opal.pop_exception(); }
            } else { throw $err; }
          };}, $$16.$$s = self, $$16.$$arity = -2, $$16));
      }, $Lazy_initialize$15.$$arity = -2);
      $alias(self, "force", "to_a");
      
      Opal.def(self, '$lazy', $Lazy_lazy$18 = function $$lazy() {
        var self = this;

        return self
      }, $Lazy_lazy$18.$$arity = 0);
      
      Opal.def(self, '$collect', $Lazy_collect$19 = function $$collect() {
        var $iter = $Lazy_collect$19.$$p, block = $iter || nil, $$20, self = this;

        if ($iter) $Lazy_collect$19.$$p = null;
        
        
        if ($iter) $Lazy_collect$19.$$p = null;;
        if ($truthy(block)) {
        } else {
          self.$raise($$($nesting, 'ArgumentError'), "tried to call lazy map without a block")
        };
        return $send($$($nesting, 'Lazy'), 'new', [self, self.$enumerator_size()], ($$20 = function(enum$, $a){var self = $$20.$$s == null ? this : $$20.$$s, $post_args, args;

          
          
          if (enum$ == null) {
            enum$ = nil;
          };
          
          $post_args = Opal.slice.call(arguments, 1, arguments.length);
          
          args = $post_args;;
          
          var value = Opal.yieldX(block, args);

          enum$.$yield(value);
        ;}, $$20.$$s = self, $$20.$$arity = -2, $$20));
      }, $Lazy_collect$19.$$arity = 0);
      
      Opal.def(self, '$collect_concat', $Lazy_collect_concat$21 = function $$collect_concat() {
        var $iter = $Lazy_collect_concat$21.$$p, block = $iter || nil, $$22, self = this;

        if ($iter) $Lazy_collect_concat$21.$$p = null;
        
        
        if ($iter) $Lazy_collect_concat$21.$$p = null;;
        if ($truthy(block)) {
        } else {
          self.$raise($$($nesting, 'ArgumentError'), "tried to call lazy map without a block")
        };
        return $send($$($nesting, 'Lazy'), 'new', [self, nil], ($$22 = function(enum$, $a){var self = $$22.$$s == null ? this : $$22.$$s, $post_args, args, $$23, $$24;

          
          
          if (enum$ == null) {
            enum$ = nil;
          };
          
          $post_args = Opal.slice.call(arguments, 1, arguments.length);
          
          args = $post_args;;
          
          var value = Opal.yieldX(block, args);

          if ((value)['$respond_to?']("force") && (value)['$respond_to?']("each")) {
            $send((value), 'each', [], ($$23 = function(v){var self = $$23.$$s == null ? this : $$23.$$s;

            
            
            if (v == null) {
              v = nil;
            };
            return enum$.$yield(v);}, $$23.$$s = self, $$23.$$arity = 1, $$23))
          }
          else {
            var array = $$($nesting, 'Opal').$try_convert(value, $$($nesting, 'Array'), "to_ary");

            if (array === nil) {
              enum$.$yield(value);
            }
            else {
              $send((value), 'each', [], ($$24 = function(v){var self = $$24.$$s == null ? this : $$24.$$s;

            
            
            if (v == null) {
              v = nil;
            };
            return enum$.$yield(v);}, $$24.$$s = self, $$24.$$arity = 1, $$24));
            }
          }
        ;}, $$22.$$s = self, $$22.$$arity = -2, $$22));
      }, $Lazy_collect_concat$21.$$arity = 0);
      
      Opal.def(self, '$drop', $Lazy_drop$25 = function $$drop(n) {
        var $$26, self = this, current_size = nil, set_size = nil, dropped = nil;

        
        n = $coerce_to(n, $$($nesting, 'Integer'), 'to_int');
        if ($truthy($rb_lt(n, 0))) {
          self.$raise($$($nesting, 'ArgumentError'), "attempt to drop negative size")};
        current_size = self.$enumerator_size();
        set_size = (function() {if ($truthy($$($nesting, 'Integer')['$==='](current_size))) {
          if ($truthy($rb_lt(n, current_size))) {
            return n
          } else {
            return current_size
          }
        } else {
          return current_size
        }; return nil; })();
        dropped = 0;
        return $send($$($nesting, 'Lazy'), 'new', [self, set_size], ($$26 = function(enum$, $a){var self = $$26.$$s == null ? this : $$26.$$s, $post_args, args;

          
          
          if (enum$ == null) {
            enum$ = nil;
          };
          
          $post_args = Opal.slice.call(arguments, 1, arguments.length);
          
          args = $post_args;;
          if ($truthy($rb_lt(dropped, n))) {
            return (dropped = $rb_plus(dropped, 1))
          } else {
            return $send(enum$, 'yield', Opal.to_a(args))
          };}, $$26.$$s = self, $$26.$$arity = -2, $$26));
      }, $Lazy_drop$25.$$arity = 1);
      
      Opal.def(self, '$drop_while', $Lazy_drop_while$27 = function $$drop_while() {
        var $iter = $Lazy_drop_while$27.$$p, block = $iter || nil, $$28, self = this, succeeding = nil;

        if ($iter) $Lazy_drop_while$27.$$p = null;
        
        
        if ($iter) $Lazy_drop_while$27.$$p = null;;
        if ($truthy(block)) {
        } else {
          self.$raise($$($nesting, 'ArgumentError'), "tried to call lazy drop_while without a block")
        };
        succeeding = true;
        return $send($$($nesting, 'Lazy'), 'new', [self, nil], ($$28 = function(enum$, $a){var self = $$28.$$s == null ? this : $$28.$$s, $post_args, args;

          
          
          if (enum$ == null) {
            enum$ = nil;
          };
          
          $post_args = Opal.slice.call(arguments, 1, arguments.length);
          
          args = $post_args;;
          if ($truthy(succeeding)) {
            
            var value = Opal.yieldX(block, args);

            if ($falsy(value)) {
              succeeding = false;

              $send(enum$, 'yield', Opal.to_a(args));
            }
          
          } else {
            return $send(enum$, 'yield', Opal.to_a(args))
          };}, $$28.$$s = self, $$28.$$arity = -2, $$28));
      }, $Lazy_drop_while$27.$$arity = 0);
      
      Opal.def(self, '$enum_for', $Lazy_enum_for$29 = function $$enum_for($a, $b) {
        var $iter = $Lazy_enum_for$29.$$p, block = $iter || nil, $post_args, method, args, self = this;

        if ($iter) $Lazy_enum_for$29.$$p = null;
        
        
        if ($iter) $Lazy_enum_for$29.$$p = null;;
        
        $post_args = Opal.slice.call(arguments, 0, arguments.length);
        
        if ($post_args.length > 0) {
          method = $post_args[0];
          $post_args.splice(0, 1);
        }
        if (method == null) {
          method = "each";
        };
        
        args = $post_args;;
        return $send(self.$class(), 'for', [self, method].concat(Opal.to_a(args)), block.$to_proc());
      }, $Lazy_enum_for$29.$$arity = -1);
      $alias(self, "filter", "find_all");
      
      Opal.def(self, '$find_all', $Lazy_find_all$30 = function $$find_all() {
        var $iter = $Lazy_find_all$30.$$p, block = $iter || nil, $$31, self = this;

        if ($iter) $Lazy_find_all$30.$$p = null;
        
        
        if ($iter) $Lazy_find_all$30.$$p = null;;
        if ($truthy(block)) {
        } else {
          self.$raise($$($nesting, 'ArgumentError'), "tried to call lazy select without a block")
        };
        return $send($$($nesting, 'Lazy'), 'new', [self, nil], ($$31 = function(enum$, $a){var self = $$31.$$s == null ? this : $$31.$$s, $post_args, args;

          
          
          if (enum$ == null) {
            enum$ = nil;
          };
          
          $post_args = Opal.slice.call(arguments, 1, arguments.length);
          
          args = $post_args;;
          
          var value = Opal.yieldX(block, args);

          if ($truthy(value)) {
            $send(enum$, 'yield', Opal.to_a(args));
          }
        ;}, $$31.$$s = self, $$31.$$arity = -2, $$31));
      }, $Lazy_find_all$30.$$arity = 0);
      $alias(self, "flat_map", "collect_concat");
      
      Opal.def(self, '$grep', $Lazy_grep$32 = function $$grep(pattern) {
        var $iter = $Lazy_grep$32.$$p, block = $iter || nil, $$33, $$34, self = this;

        if ($iter) $Lazy_grep$32.$$p = null;
        
        
        if ($iter) $Lazy_grep$32.$$p = null;;
        if ($truthy(block)) {
          return $send($$($nesting, 'Lazy'), 'new', [self, nil], ($$33 = function(enum$, $a){var self = $$33.$$s == null ? this : $$33.$$s, $post_args, args;

            
            
            if (enum$ == null) {
              enum$ = nil;
            };
            
            $post_args = Opal.slice.call(arguments, 1, arguments.length);
            
            args = $post_args;;
            
            var param = $$($nesting, 'Opal').$destructure(args),
                value = pattern['$==='](param);

            if ($truthy(value)) {
              value = Opal.yield1(block, param);

              enum$.$yield(Opal.yield1(block, param));
            }
          ;}, $$33.$$s = self, $$33.$$arity = -2, $$33))
        } else {
          return $send($$($nesting, 'Lazy'), 'new', [self, nil], ($$34 = function(enum$, $a){var self = $$34.$$s == null ? this : $$34.$$s, $post_args, args;

            
            
            if (enum$ == null) {
              enum$ = nil;
            };
            
            $post_args = Opal.slice.call(arguments, 1, arguments.length);
            
            args = $post_args;;
            
            var param = $$($nesting, 'Opal').$destructure(args),
                value = pattern['$==='](param);

            if ($truthy(value)) {
              enum$.$yield(param);
            }
          ;}, $$34.$$s = self, $$34.$$arity = -2, $$34))
        };
      }, $Lazy_grep$32.$$arity = 1);
      $alias(self, "map", "collect");
      $alias(self, "select", "find_all");
      
      Opal.def(self, '$reject', $Lazy_reject$35 = function $$reject() {
        var $iter = $Lazy_reject$35.$$p, block = $iter || nil, $$36, self = this;

        if ($iter) $Lazy_reject$35.$$p = null;
        
        
        if ($iter) $Lazy_reject$35.$$p = null;;
        if ($truthy(block)) {
        } else {
          self.$raise($$($nesting, 'ArgumentError'), "tried to call lazy reject without a block")
        };
        return $send($$($nesting, 'Lazy'), 'new', [self, nil], ($$36 = function(enum$, $a){var self = $$36.$$s == null ? this : $$36.$$s, $post_args, args;

          
          
          if (enum$ == null) {
            enum$ = nil;
          };
          
          $post_args = Opal.slice.call(arguments, 1, arguments.length);
          
          args = $post_args;;
          
          var value = Opal.yieldX(block, args);

          if ($falsy(value)) {
            $send(enum$, 'yield', Opal.to_a(args));
          }
        ;}, $$36.$$s = self, $$36.$$arity = -2, $$36));
      }, $Lazy_reject$35.$$arity = 0);
      
      Opal.def(self, '$take', $Lazy_take$37 = function $$take(n) {
        var $$38, self = this, current_size = nil, set_size = nil, taken = nil;

        
        n = $coerce_to(n, $$($nesting, 'Integer'), 'to_int');
        if ($truthy($rb_lt(n, 0))) {
          self.$raise($$($nesting, 'ArgumentError'), "attempt to take negative size")};
        current_size = self.$enumerator_size();
        set_size = (function() {if ($truthy($$($nesting, 'Integer')['$==='](current_size))) {
          if ($truthy($rb_lt(n, current_size))) {
            return n
          } else {
            return current_size
          }
        } else {
          return current_size
        }; return nil; })();
        taken = 0;
        return $send($$($nesting, 'Lazy'), 'new', [self, set_size], ($$38 = function(enum$, $a){var self = $$38.$$s == null ? this : $$38.$$s, $post_args, args;

          
          
          if (enum$ == null) {
            enum$ = nil;
          };
          
          $post_args = Opal.slice.call(arguments, 1, arguments.length);
          
          args = $post_args;;
          if ($truthy($rb_lt(taken, n))) {
            
            $send(enum$, 'yield', Opal.to_a(args));
            return (taken = $rb_plus(taken, 1));
          } else {
            return self.$raise($$($nesting, 'StopLazyError'))
          };}, $$38.$$s = self, $$38.$$arity = -2, $$38));
      }, $Lazy_take$37.$$arity = 1);
      
      Opal.def(self, '$take_while', $Lazy_take_while$39 = function $$take_while() {
        var $iter = $Lazy_take_while$39.$$p, block = $iter || nil, $$40, self = this;

        if ($iter) $Lazy_take_while$39.$$p = null;
        
        
        if ($iter) $Lazy_take_while$39.$$p = null;;
        if ($truthy(block)) {
        } else {
          self.$raise($$($nesting, 'ArgumentError'), "tried to call lazy take_while without a block")
        };
        return $send($$($nesting, 'Lazy'), 'new', [self, nil], ($$40 = function(enum$, $a){var self = $$40.$$s == null ? this : $$40.$$s, $post_args, args;

          
          
          if (enum$ == null) {
            enum$ = nil;
          };
          
          $post_args = Opal.slice.call(arguments, 1, arguments.length);
          
          args = $post_args;;
          
          var value = Opal.yieldX(block, args);

          if ($truthy(value)) {
            $send(enum$, 'yield', Opal.to_a(args));
          }
          else {
            self.$raise($$($nesting, 'StopLazyError'));
          }
        ;}, $$40.$$s = self, $$40.$$arity = -2, $$40));
      }, $Lazy_take_while$39.$$arity = 0);
      $alias(self, "to_enum", "enum_for");
      return (Opal.def(self, '$inspect', $Lazy_inspect$41 = function $$inspect() {
        var self = this;

        return "" + "#<" + (self.$class()) + ": " + (self.enumerator.$inspect()) + ">"
      }, $Lazy_inspect$41.$$arity = 0), nil) && 'inspect';
    })($nesting[0], self, $nesting);
    return (function($base, $super, $parent_nesting) {
      var self = $klass($base, $super, 'ArithmeticSequence');

      var $nesting = [self].concat($parent_nesting);

      return nil
    })($nesting[0], self, $nesting);
  })($nesting[0], null, $nesting);
};

Opal.modules["corelib/numeric"] = function(Opal) {/* Generated by Opal 1.3.0 */
  function $rb_minus(lhs, rhs) {
    return (typeof(lhs) === 'number' && typeof(rhs) === 'number') ? lhs - rhs : lhs['$-'](rhs);
  }
  function $rb_times(lhs, rhs) {
    return (typeof(lhs) === 'number' && typeof(rhs) === 'number') ? lhs * rhs : lhs['$*'](rhs);
  }
  function $rb_lt(lhs, rhs) {
    return (typeof(lhs) === 'number' && typeof(rhs) === 'number') ? lhs < rhs : lhs['$<'](rhs);
  }
  function $rb_divide(lhs, rhs) {
    return (typeof(lhs) === 'number' && typeof(rhs) === 'number') ? lhs / rhs : lhs['$/'](rhs);
  }
  function $rb_ge(lhs, rhs) {
    return (typeof(lhs) === 'number' && typeof(rhs) === 'number') ? lhs >= rhs : lhs['$>='](rhs);
  }
  function $rb_le(lhs, rhs) {
    return (typeof(lhs) === 'number' && typeof(rhs) === 'number') ? lhs <= rhs : lhs['$<='](rhs);
  }
  function $rb_plus(lhs, rhs) {
    return (typeof(lhs) === 'number' && typeof(rhs) === 'number') ? lhs + rhs : lhs['$+'](rhs);
  }
  function $rb_gt(lhs, rhs) {
    return (typeof(lhs) === 'number' && typeof(rhs) === 'number') ? lhs > rhs : lhs['$>'](rhs);
  }
  var self = Opal.top, $nesting = [], nil = Opal.nil, $$$ = Opal.$$$, $$ = Opal.$$, $klass = Opal.klass, $truthy = Opal.truthy, $alias = Opal.alias, $hash2 = Opal.hash2, $send = Opal.send;

  Opal.add_stubs(['$require', '$include', '$instance_of?', '$class', '$Float', '$respond_to?', '$coerce', '$__send__', '$===', '$raise', '$equal?', '$-', '$*', '$div', '$<', '$-@', '$ceil', '$to_f', '$denominator', '$to_r', '$==', '$floor', '$/', '$%', '$Complex', '$zero?', '$numerator', '$abs', '$arg', '$coerce_to!', '$round', '$<=>', '$compare', '$enum_for', '$to_proc', '$negative?', '$>=', '$<=', '$+', '$to_i', '$truncate', '$>']);
  
  self.$require("corelib/comparable");
  return (function($base, $super, $parent_nesting) {
    var self = $klass($base, $super, 'Numeric');

    var $nesting = [self].concat($parent_nesting), $Numeric_coerce$1, $Numeric___coerced__$2, $Numeric_$lt_eq_gt$3, $Numeric_$plus$$4, $Numeric_$minus$$5, $Numeric_$percent$6, $Numeric_abs$7, $Numeric_abs2$8, $Numeric_angle$9, $Numeric_ceil$10, $Numeric_conj$11, $Numeric_denominator$12, $Numeric_div$13, $Numeric_divmod$14, $Numeric_fdiv$15, $Numeric_floor$16, $Numeric_i$17, $Numeric_imag$18, $Numeric_integer$ques$19, $Numeric_nonzero$ques$20, $Numeric_numerator$21, $Numeric_polar$22, $Numeric_quo$23, $Numeric_real$24, $Numeric_real$ques$25, $Numeric_rect$26, $Numeric_round$27, $Numeric_step$28, $Numeric_to_c$29, $Numeric_to_int$30, $Numeric_truncate$31, $Numeric_zero$ques$32, $Numeric_positive$ques$33, $Numeric_negative$ques$34, $Numeric_dup$35, $Numeric_clone$36, $Numeric_finite$ques$37, $Numeric_infinite$ques$38;

    
    self.$include($$($nesting, 'Comparable'));
    
    Opal.def(self, '$coerce', $Numeric_coerce$1 = function $$coerce(other) {
      var self = this;

      
      if ($truthy(other['$instance_of?'](self.$class()))) {
        return [other, self]};
      return [self.$Float(other), self.$Float(self)];
    }, $Numeric_coerce$1.$$arity = 1);
    
    Opal.def(self, '$__coerced__', $Numeric___coerced__$2 = function $$__coerced__(method, other) {
      var $a, $b, self = this, a = nil, b = nil, $case = nil;

      if ($truthy(other['$respond_to?']("coerce"))) {
        
        $b = other.$coerce(self), $a = Opal.to_ary($b), (a = ($a[0] == null ? nil : $a[0])), (b = ($a[1] == null ? nil : $a[1])), $b;
        return a.$__send__(method, b);
      } else {
        return (function() {$case = method;
        if ("+"['$===']($case) || "-"['$===']($case) || "*"['$===']($case) || "/"['$===']($case) || "%"['$===']($case) || "&"['$===']($case) || "|"['$===']($case) || "^"['$===']($case) || "**"['$===']($case)) {return self.$raise($$($nesting, 'TypeError'), "" + (other.$class()) + " can't be coerced into Numeric")}
        else if (">"['$===']($case) || ">="['$===']($case) || "<"['$===']($case) || "<="['$===']($case) || "<=>"['$===']($case)) {return self.$raise($$($nesting, 'ArgumentError'), "" + "comparison of " + (self.$class()) + " with " + (other.$class()) + " failed")}
        else { return nil }})()
      }
    }, $Numeric___coerced__$2.$$arity = 2);
    
    Opal.def(self, '$<=>', $Numeric_$lt_eq_gt$3 = function(other) {
      var self = this;

      
      if ($truthy(self['$equal?'](other))) {
        return 0};
      return nil;
    }, $Numeric_$lt_eq_gt$3.$$arity = 1);
    
    Opal.def(self, '$+@', $Numeric_$plus$$4 = function() {
      var self = this;

      return self
    }, $Numeric_$plus$$4.$$arity = 0);
    
    Opal.def(self, '$-@', $Numeric_$minus$$5 = function() {
      var self = this;

      return $rb_minus(0, self)
    }, $Numeric_$minus$$5.$$arity = 0);
    
    Opal.def(self, '$%', $Numeric_$percent$6 = function(other) {
      var self = this;

      return $rb_minus(self, $rb_times(other, self.$div(other)))
    }, $Numeric_$percent$6.$$arity = 1);
    
    Opal.def(self, '$abs', $Numeric_abs$7 = function $$abs() {
      var self = this;

      if ($rb_lt(self, 0)) {
        return self['$-@']()
      } else {
        return self
      }
    }, $Numeric_abs$7.$$arity = 0);
    
    Opal.def(self, '$abs2', $Numeric_abs2$8 = function $$abs2() {
      var self = this;

      return $rb_times(self, self)
    }, $Numeric_abs2$8.$$arity = 0);
    
    Opal.def(self, '$angle', $Numeric_angle$9 = function $$angle() {
      var self = this;

      if ($rb_lt(self, 0)) {
        return $$$($$($nesting, 'Math'), 'PI')
      } else {
        return 0
      }
    }, $Numeric_angle$9.$$arity = 0);
    $alias(self, "arg", "angle");
    
    Opal.def(self, '$ceil', $Numeric_ceil$10 = function $$ceil(ndigits) {
      var self = this;

      
      
      if (ndigits == null) {
        ndigits = 0;
      };
      return self.$to_f().$ceil(ndigits);
    }, $Numeric_ceil$10.$$arity = -1);
    
    Opal.def(self, '$conj', $Numeric_conj$11 = function $$conj() {
      var self = this;

      return self
    }, $Numeric_conj$11.$$arity = 0);
    $alias(self, "conjugate", "conj");
    
    Opal.def(self, '$denominator', $Numeric_denominator$12 = function $$denominator() {
      var self = this;

      return self.$to_r().$denominator()
    }, $Numeric_denominator$12.$$arity = 0);
    
    Opal.def(self, '$div', $Numeric_div$13 = function $$div(other) {
      var self = this;

      
      if (other['$=='](0)) {
        self.$raise($$($nesting, 'ZeroDivisionError'), "divided by o")};
      return $rb_divide(self, other).$floor();
    }, $Numeric_div$13.$$arity = 1);
    
    Opal.def(self, '$divmod', $Numeric_divmod$14 = function $$divmod(other) {
      var self = this;

      return [self.$div(other), self['$%'](other)]
    }, $Numeric_divmod$14.$$arity = 1);
    
    Opal.def(self, '$fdiv', $Numeric_fdiv$15 = function $$fdiv(other) {
      var self = this;

      return $rb_divide(self.$to_f(), other)
    }, $Numeric_fdiv$15.$$arity = 1);
    
    Opal.def(self, '$floor', $Numeric_floor$16 = function $$floor(ndigits) {
      var self = this;

      
      
      if (ndigits == null) {
        ndigits = 0;
      };
      return self.$to_f().$floor(ndigits);
    }, $Numeric_floor$16.$$arity = -1);
    
    Opal.def(self, '$i', $Numeric_i$17 = function $$i() {
      var self = this;

      return self.$Complex(0, self)
    }, $Numeric_i$17.$$arity = 0);
    
    Opal.def(self, '$imag', $Numeric_imag$18 = function $$imag() {
      var self = this;

      return 0
    }, $Numeric_imag$18.$$arity = 0);
    $alias(self, "imaginary", "imag");
    
    Opal.def(self, '$integer?', $Numeric_integer$ques$19 = function() {
      var self = this;

      return false
    }, $Numeric_integer$ques$19.$$arity = 0);
    $alias(self, "magnitude", "abs");
    $alias(self, "modulo", "%");
    
    Opal.def(self, '$nonzero?', $Numeric_nonzero$ques$20 = function() {
      var self = this;

      if ($truthy(self['$zero?']())) {
        return nil
      } else {
        return self
      }
    }, $Numeric_nonzero$ques$20.$$arity = 0);
    
    Opal.def(self, '$numerator', $Numeric_numerator$21 = function $$numerator() {
      var self = this;

      return self.$to_r().$numerator()
    }, $Numeric_numerator$21.$$arity = 0);
    $alias(self, "phase", "arg");
    
    Opal.def(self, '$polar', $Numeric_polar$22 = function $$polar() {
      var self = this;

      return [self.$abs(), self.$arg()]
    }, $Numeric_polar$22.$$arity = 0);
    
    Opal.def(self, '$quo', $Numeric_quo$23 = function $$quo(other) {
      var self = this;

      return $rb_divide($$($nesting, 'Opal')['$coerce_to!'](self, $$($nesting, 'Rational'), "to_r"), other)
    }, $Numeric_quo$23.$$arity = 1);
    
    Opal.def(self, '$real', $Numeric_real$24 = function $$real() {
      var self = this;

      return self
    }, $Numeric_real$24.$$arity = 0);
    
    Opal.def(self, '$real?', $Numeric_real$ques$25 = function() {
      var self = this;

      return true
    }, $Numeric_real$ques$25.$$arity = 0);
    
    Opal.def(self, '$rect', $Numeric_rect$26 = function $$rect() {
      var self = this;

      return [self, 0]
    }, $Numeric_rect$26.$$arity = 0);
    $alias(self, "rectangular", "rect");
    
    Opal.def(self, '$round', $Numeric_round$27 = function $$round(digits) {
      var self = this;

      
      ;
      return self.$to_f().$round(digits);
    }, $Numeric_round$27.$$arity = -1);
    
    Opal.def(self, '$step', $Numeric_step$28 = function $$step($a, $b, $c) {
      var $iter = $Numeric_step$28.$$p, block = $iter || nil, $post_args, $kwargs, limit, step, to, by, $d, self = this, counter = nil;

      if ($iter) $Numeric_step$28.$$p = null;
      
      
      if ($iter) $Numeric_step$28.$$p = null;;
      
      $post_args = Opal.slice.call(arguments, 0, arguments.length);
      
      $kwargs = Opal.extract_kwargs($post_args);
      
      if ($kwargs == null) {
        $kwargs = $hash2([], {});
      } else if (!$kwargs.$$is_hash) {
        throw Opal.ArgumentError.$new('expected kwargs');
      };
      
      if ($post_args.length > 0) {
        limit = $post_args[0];
        $post_args.splice(0, 1);
      };
      
      if ($post_args.length > 0) {
        step = $post_args[0];
        $post_args.splice(0, 1);
      };
      
      to = $kwargs.$$smap["to"];;
      
      by = $kwargs.$$smap["by"];;
      
      if (limit !== undefined && to !== undefined) {
        self.$raise($$($nesting, 'ArgumentError'), "to is given twice")
      }

      if (step !== undefined && by !== undefined) {
        self.$raise($$($nesting, 'ArgumentError'), "step is given twice")
      }

      if (to !== undefined) {
        limit = to;
      }

      if (by !== undefined) {
        step = by;
      }

      if (limit === undefined) {
        limit = nil;
      }

      function validateParameters() {
        if (step === nil) {
          self.$raise($$($nesting, 'TypeError'), "step must be numeric")
        }

        if (step != null && step['$=='](0)) {
          self.$raise($$($nesting, 'ArgumentError'), "step can't be 0")
        }

        if (step === nil || step == null) {
          step = 1;
        }

        var sign = step['$<=>'](0);

        if (sign === nil) {
          self.$raise($$($nesting, 'ArgumentError'), "" + "0 can't be coerced into " + (step.$class()))
        }

        if (limit === nil || limit == null) {
          limit = sign > 0 ? $$$($$($nesting, 'Float'), 'INFINITY') : $$$($$($nesting, 'Float'), 'INFINITY')['$-@']();
        }

        $$($nesting, 'Opal').$compare(self, limit)
      }

      function stepFloatSize() {
        if ((step > 0 && self > limit) || (step < 0 && self < limit)) {
          return 0;
        } else if (step === Infinity || step === -Infinity) {
          return 1;
        } else {
          var abs = Math.abs, floor = Math.floor,
              err = (abs(self) + abs(limit) + abs(limit - self)) / abs(step) * $$$($$($nesting, 'Float'), 'EPSILON');

          if (err === Infinity || err === -Infinity) {
            return 0;
          } else {
            if (err > 0.5) {
              err = 0.5;
            }

            return floor((limit - self) / step + err) + 1
          }
        }
      }

      function stepSize() {
        validateParameters();

        if (step === 0) {
          return Infinity;
        }

        if (step % 1 !== 0) {
          return stepFloatSize();
        } else if ((step > 0 && self > limit) || (step < 0 && self < limit)) {
          return 0;
        } else {
          var ceil = Math.ceil, abs = Math.abs,
              lhs = abs(self - limit) + 1,
              rhs = abs(step);

          return ceil(lhs / rhs);
        }
      }

    ;
      if ((block !== nil)) {
      } else {
        return $send(self, 'enum_for', ["step", limit, step], (stepSize).$to_proc())
      };
      
      validateParameters();

      var isDesc = step['$negative?'](),
          isInf = step['$=='](0) ||
                  (limit === Infinity && !isDesc) ||
                  (limit === -Infinity && isDesc);

      if (self.$$is_number && step.$$is_number && limit.$$is_number) {
        if (self % 1 === 0 && (isInf || limit % 1 === 0) && step % 1 === 0) {
          var value = self;

          if (isInf) {
            for (;; value += step) {
              block(value);
            }
          } else if (isDesc) {
            for (; value >= limit; value += step) {
              block(value);
            }
          } else {
            for (; value <= limit; value += step) {
              block(value);
            }
          }

          return self;
        } else {
          var begin = self.$to_f().valueOf();
          step = step.$to_f().valueOf();
          limit = limit.$to_f().valueOf();

          var n = stepFloatSize();

          if (!isFinite(step)) {
            if (n !== 0) block(begin);
          } else if (step === 0) {
            while (true) {
              block(begin);
            }
          } else {
            for (var i = 0; i < n; i++) {
              var d = i * step + self;
              if (step >= 0 ? limit < d : limit > d) {
                d = limit;
              }
              block(d);
            }
          }

          return self;
        }
      }
    ;
      counter = self;
      while ($truthy(isDesc ? $rb_ge(counter, limit) : $rb_le(counter, limit))) {
        
        Opal.yield1(block, counter);
        counter = $rb_plus(counter, step);
      };
    }, $Numeric_step$28.$$arity = -1);
    
    Opal.def(self, '$to_c', $Numeric_to_c$29 = function $$to_c() {
      var self = this;

      return self.$Complex(self, 0)
    }, $Numeric_to_c$29.$$arity = 0);
    
    Opal.def(self, '$to_int', $Numeric_to_int$30 = function $$to_int() {
      var self = this;

      return self.$to_i()
    }, $Numeric_to_int$30.$$arity = 0);
    
    Opal.def(self, '$truncate', $Numeric_truncate$31 = function $$truncate(ndigits) {
      var self = this;

      
      
      if (ndigits == null) {
        ndigits = 0;
      };
      return self.$to_f().$truncate(ndigits);
    }, $Numeric_truncate$31.$$arity = -1);
    
    Opal.def(self, '$zero?', $Numeric_zero$ques$32 = function() {
      var self = this;

      return self['$=='](0)
    }, $Numeric_zero$ques$32.$$arity = 0);
    
    Opal.def(self, '$positive?', $Numeric_positive$ques$33 = function() {
      var self = this;

      return $rb_gt(self, 0)
    }, $Numeric_positive$ques$33.$$arity = 0);
    
    Opal.def(self, '$negative?', $Numeric_negative$ques$34 = function() {
      var self = this;

      return $rb_lt(self, 0)
    }, $Numeric_negative$ques$34.$$arity = 0);
    
    Opal.def(self, '$dup', $Numeric_dup$35 = function $$dup() {
      var self = this;

      return self
    }, $Numeric_dup$35.$$arity = 0);
    
    Opal.def(self, '$clone', $Numeric_clone$36 = function $$clone($kwargs) {
      var freeze, self = this;

      
      
      if ($kwargs == null) {
        $kwargs = $hash2([], {});
      } else if (!$kwargs.$$is_hash) {
        throw Opal.ArgumentError.$new('expected kwargs');
      };
      
      freeze = $kwargs.$$smap["freeze"];
      if (freeze == null) {
        freeze = true
      };
      return self;
    }, $Numeric_clone$36.$$arity = -1);
    
    Opal.def(self, '$finite?', $Numeric_finite$ques$37 = function() {
      var self = this;

      return true
    }, $Numeric_finite$ques$37.$$arity = 0);
    return (Opal.def(self, '$infinite?', $Numeric_infinite$ques$38 = function() {
      var self = this;

      return nil
    }, $Numeric_infinite$ques$38.$$arity = 0), nil) && 'infinite?';
  })($nesting[0], null, $nesting);
};

Opal.modules["corelib/array"] = function(Opal) {/* Generated by Opal 1.3.0 */
  function $rb_gt(lhs, rhs) {
    return (typeof(lhs) === 'number' && typeof(rhs) === 'number') ? lhs > rhs : lhs['$>'](rhs);
  }
  function $rb_times(lhs, rhs) {
    return (typeof(lhs) === 'number' && typeof(rhs) === 'number') ? lhs * rhs : lhs['$*'](rhs);
  }
  function $rb_minus(lhs, rhs) {
    return (typeof(lhs) === 'number' && typeof(rhs) === 'number') ? lhs - rhs : lhs['$-'](rhs);
  }
  function $rb_ge(lhs, rhs) {
    return (typeof(lhs) === 'number' && typeof(rhs) === 'number') ? lhs >= rhs : lhs['$>='](rhs);
  }
  function $rb_lt(lhs, rhs) {
    return (typeof(lhs) === 'number' && typeof(rhs) === 'number') ? lhs < rhs : lhs['$<'](rhs);
  }
  var self = Opal.top, $nesting = [], nil = Opal.nil, $$$ = Opal.$$$, $$ = Opal.$$, $truthy = Opal.truthy, $falsy = Opal.falsy, $hash_ids = Opal.hash_ids, $yield1 = Opal.yield1, $hash_get = Opal.hash_get, $hash_put = Opal.hash_put, $hash_delete = Opal.hash_delete, $coerce_to = Opal.coerce_to, $respond_to = Opal.respond_to, $klass = Opal.klass, $hash2 = Opal.hash2, $send2 = Opal.send2, $find_super = Opal.find_super, $send = Opal.send, $gvars = Opal.gvars, $alias = Opal.alias;

  Opal.add_stubs(['$require', '$include', '$to_a', '$warn', '$raise', '$replace', '$respond_to?', '$to_ary', '$coerce_to?', '$===', '$join', '$to_str', '$hash', '$<=>', '$==', '$object_id', '$inspect', '$enum_for', '$class', '$bsearch_index', '$to_proc', '$nil?', '$coerce_to!', '$>', '$*', '$enumerator_size', '$empty?', '$size', '$map', '$equal?', '$dup', '$each', '$reduce', '$-', '$[]', '$dig', '$eql?', '$length', '$exclude_end?', '$flatten', '$__id__', '$&', '$to_s', '$new', '$max', '$min', '$!', '$>=', '$**', '$delete_if', '$reverse', '$rotate', '$rand', '$at', '$keep_if', '$shuffle!', '$<', '$sort', '$sort_by', '$!=', '$times', '$[]=', '$<<', '$uniq', '$|', '$values', '$is_a?', '$last', '$first', '$upto', '$reject', '$pristine', '$singleton_class']);
  
  self.$require("corelib/enumerable");
  self.$require("corelib/numeric");
  return (function($base, $super, $parent_nesting) {
    var self = $klass($base, $super, 'Array');

    var $nesting = [self].concat($parent_nesting), $Array_$$$1, $Array_initialize$2, $Array_try_convert$3, $Array_$$4, $Array_$$5, $Array_$$6, $Array_$plus$7, $Array_$minus$8, $Array_$lt$lt$9, $Array_$lt_eq_gt$10, $Array_$eq_eq$11, $Array_$$$12, $Array_$$$eq$13, $Array_any$ques$14, $Array_assoc$15, $Array_at$16, $Array_bsearch_index$17, $Array_bsearch$18, $Array_cycle$19, $Array_clear$21, $Array_count$22, $Array_initialize_copy$23, $Array_collect$24, $Array_collect$excl$26, $Array_combination$28, $Array_repeated_combination$30, $Array_compact$32, $Array_compact$excl$33, $Array_concat$34, $Array_delete$37, $Array_delete_at$38, $Array_delete_if$39, $Array_difference$41, $Array_dig$43, $Array_drop$44, $Array_dup$45, $Array_each$46, $Array_each_index$48, $Array_empty$ques$50, $Array_eql$ques$51, $Array_fetch$52, $Array_fill$53, $Array_first$54, $Array_flatten$55, $Array_flatten$excl$56, $Array_hash$57, $Array_include$ques$58, $Array_index$59, $Array_insert$60, $Array_inspect$61, $Array_intersection$62, $Array_join$64, $Array_keep_if$65, $Array_last$67, $Array_length$68, $Array_max$69, $Array_min$70, $Array_permutation$71, $Array_repeated_permutation$73, $Array_pop$75, $Array_product$76, $Array_push$77, $Array_rassoc$78, $Array_reject$79, $Array_reject$excl$81, $Array_replace$83, $Array_reverse$84, $Array_reverse$excl$85, $Array_reverse_each$86, $Array_rindex$88, $Array_rotate$89, $Array_rotate$excl$90, $Array_sample$93, $Array_select$94, $Array_select$excl$96, $Array_shift$98, $Array_shuffle$99, $Array_shuffle$excl$100, $Array_slice$excl$101, $Array_sort$102, $Array_sort$excl$103, $Array_sort_by$excl$104, $Array_take$106, $Array_take_while$107, $Array_to_a$108, $Array_to_ary$109, $Array_to_h$110, $Array_transpose$111, $Array_union$114, $Array_uniq$116, $Array_uniq$excl$117, $Array_unshift$118, $Array_values_at$119, $Array_zip$122, $Array_inherited$123, $Array_instance_variables$124, $Array_pack$126;

    
    self.$include($$($nesting, 'Enumerable'));
    Opal.defineProperty(self.$$prototype, '$$is_array', true);
    
    // Recent versions of V8 (> 7.1) only use an optimized implementation when Array.prototype is unmodified.
    // For instance, "array-splice.tq" has a "fast path" (ExtractFastJSArray, defined in "src/codegen/code-stub-assembler.cc")
    // but it's only enabled when "IsPrototypeInitialArrayPrototype()" is true.
    //
    // Older versions of V8 were using relatively fast JS-with-extensions code even when Array.prototype is modified:
    // https://github.com/v8/v8/blob/7.0.1/src/js/array.js#L599-L642
    //
    // In short, Array operations are slow in recent versions of V8 when the Array.prototype has been tampered.
    // So, when possible, we are using faster open-coded version to boost the performance.

    // As of V8 8.4, depending on the size of the array, this is up to ~25x times faster than Array#shift()
    // Implementation is heavily inspired by: https://github.com/nodejs/node/blob/ba684805b6c0eded76e5cd89ee00328ac7a59365/lib/internal/util.js#L341-L347
    function shiftNoArg(list) {
      var r = list[0];
      var index = 1;
      var length = list.length;
      for (; index < length; index++) {
        list[index - 1] = list[index];
      }
      list.pop();
      return r;
    }

    function toArraySubclass(obj, klass) {
      if (klass.$$name === Opal.Array) {
        return obj;
      } else {
        return klass.$allocate().$replace((obj).$to_a());
      }
    }

    // A helper for keep_if and delete_if, filter is either Opal.truthy
    // or Opal.falsy.
    function filterIf(self, filter, block) {
      var value, raised = null, updated = new Array(self.length);

      for (var i = 0, i2 = 0, length = self.length; i < length; i++) {
        if (!raised) {
          try {
            value = $yield1(block, self[i])
          } catch(error) {
            raised = error;
          }
        }

        if (raised || filter(value)) {
          updated[i2] = self[i]
          i2 += 1;
        }
      }

      if (i2 !== i) {
        self.splice.apply(self, [0, updated.length].concat(updated));
        self.splice(i2, updated.length);
      }

      if (raised) throw raised;
    }
  ;
    Opal.defs(self, '$[]', $Array_$$$1 = function($a) {
      var $post_args, objects, self = this;

      
      
      $post_args = Opal.slice.call(arguments, 0, arguments.length);
      
      objects = $post_args;;
      return toArraySubclass(objects, self);;
    }, $Array_$$$1.$$arity = -1);
    
    Opal.def(self, '$initialize', $Array_initialize$2 = function $$initialize(size, obj) {
      var $iter = $Array_initialize$2.$$p, block = $iter || nil, self = this;

      if ($iter) $Array_initialize$2.$$p = null;
      
      
      if ($iter) $Array_initialize$2.$$p = null;;
      
      if (size == null) {
        size = nil;
      };
      
      if (obj == null) {
        obj = nil;
      };
      
      if (obj !== nil && block !== nil) {
        self.$warn("warning: block supersedes default value argument")
      }

      if (size > $$$($$($nesting, 'Integer'), 'MAX')) {
        self.$raise($$($nesting, 'ArgumentError'), "array size too big")
      }

      if (arguments.length > 2) {
        self.$raise($$($nesting, 'ArgumentError'), "" + "wrong number of arguments (" + (arguments.length) + " for 0..2)")
      }

      if (arguments.length === 0) {
        self.splice(0, self.length);
        return self;
      }

      if (arguments.length === 1) {
        if (size.$$is_array) {
          self.$replace(size.$to_a())
          return self;
        } else if (size['$respond_to?']("to_ary")) {
          self.$replace(size.$to_ary())
          return self;
        }
      }

      size = $coerce_to(size, $$($nesting, 'Integer'), 'to_int');

      if (size < 0) {
        self.$raise($$($nesting, 'ArgumentError'), "negative array size")
      }

      self.splice(0, self.length);
      var i, value;

      if (block === nil) {
        for (i = 0; i < size; i++) {
          self.push(obj);
        }
      }
      else {
        for (i = 0, value; i < size; i++) {
          value = block(i);
          self[i] = value;
        }
      }

      return self;
    ;
    }, $Array_initialize$2.$$arity = -1);
    Opal.defs(self, '$try_convert', $Array_try_convert$3 = function $$try_convert(obj) {
      var self = this;

      return $$($nesting, 'Opal')['$coerce_to?'](obj, $$($nesting, 'Array'), "to_ary")
    }, $Array_try_convert$3.$$arity = 1);
    
    Opal.def(self, '$&', $Array_$$4 = function(other) {
      var self = this;

      
      other = (function() {if ($truthy($$($nesting, 'Array')['$==='](other))) {
        return other.$to_a()
      } else {
        return ($coerce_to(other, $$($nesting, 'Array'), 'to_ary')).$to_a()
      }; return nil; })();
      
      var result = [], hash = $hash2([], {}), i, length, item;

      for (i = 0, length = other.length; i < length; i++) {
        $hash_put(hash, other[i], true);
      }

      for (i = 0, length = self.length; i < length; i++) {
        item = self[i];
        if ($hash_delete(hash, item) !== undefined) {
          result.push(item);
        }
      }

      return result;
    ;
    }, $Array_$$4.$$arity = 1);
    
    Opal.def(self, '$|', $Array_$$5 = function(other) {
      var self = this;

      
      other = (function() {if ($truthy($$($nesting, 'Array')['$==='](other))) {
        return other.$to_a()
      } else {
        return ($coerce_to(other, $$($nesting, 'Array'), 'to_ary')).$to_a()
      }; return nil; })();
      
      var hash = $hash2([], {}), i, length, item;

      for (i = 0, length = self.length; i < length; i++) {
        $hash_put(hash, self[i], true);
      }

      for (i = 0, length = other.length; i < length; i++) {
        $hash_put(hash, other[i], true);
      }

      return hash.$keys();
    ;
    }, $Array_$$5.$$arity = 1);
    
    Opal.def(self, '$*', $Array_$$6 = function(other) {
      var self = this;

      
      if ($truthy(other['$respond_to?']("to_str"))) {
        return self.$join(other.$to_str())};
      other = $coerce_to(other, $$($nesting, 'Integer'), 'to_int');
      if ($truthy(other < 0)) {
        self.$raise($$($nesting, 'ArgumentError'), "negative argument")};
      
      var result = [],
          converted = self.$to_a();

      for (var i = 0; i < other; i++) {
        result = result.concat(converted);
      }

      return result;
    ;
    }, $Array_$$6.$$arity = 1);
    
    Opal.def(self, '$+', $Array_$plus$7 = function(other) {
      var self = this;

      
      other = (function() {if ($truthy($$($nesting, 'Array')['$==='](other))) {
        return other.$to_a()
      } else {
        return ($coerce_to(other, $$($nesting, 'Array'), 'to_ary')).$to_a()
      }; return nil; })();
      return self.concat(other);;
    }, $Array_$plus$7.$$arity = 1);
    
    Opal.def(self, '$-', $Array_$minus$8 = function(other) {
      var self = this;

      
      other = (function() {if ($truthy($$($nesting, 'Array')['$==='](other))) {
        return other.$to_a()
      } else {
        return ($coerce_to(other, $$($nesting, 'Array'), 'to_ary')).$to_a()
      }; return nil; })();
      if ($truthy(self.length === 0)) {
        return []};
      if ($truthy(other.length === 0)) {
        return self.slice()};
      
      var result = [], hash = $hash2([], {}), i, length, item;

      for (i = 0, length = other.length; i < length; i++) {
        $hash_put(hash, other[i], true);
      }

      for (i = 0, length = self.length; i < length; i++) {
        item = self[i];
        if ($hash_get(hash, item) === undefined) {
          result.push(item);
        }
      }

      return result;
    ;
    }, $Array_$minus$8.$$arity = 1);
    
    Opal.def(self, '$<<', $Array_$lt$lt$9 = function(object) {
      var self = this;

      
      self.push(object);
      return self;
    }, $Array_$lt$lt$9.$$arity = 1);
    
    Opal.def(self, '$<=>', $Array_$lt_eq_gt$10 = function(other) {
      var self = this;

      
      if ($truthy($$($nesting, 'Array')['$==='](other))) {
        other = other.$to_a()
      } else if ($truthy(other['$respond_to?']("to_ary"))) {
        other = other.$to_ary().$to_a()
      } else {
        return nil
      };
      
      if (self.$hash() === other.$hash()) {
        return 0;
      }

      var count = Math.min(self.length, other.length);

      for (var i = 0; i < count; i++) {
        var tmp = (self[i])['$<=>'](other[i]);

        if (tmp !== 0) {
          return tmp;
        }
      }

      return (self.length)['$<=>'](other.length);
    ;
    }, $Array_$lt_eq_gt$10.$$arity = 1);
    
    Opal.def(self, '$==', $Array_$eq_eq$11 = function(other) {
      var self = this;

      
      var recursed = {};

      function _eqeq(array, other) {
        var i, length, a, b;

        if (array === other)
          return true;

        if (!other.$$is_array) {
          if ($respond_to(other, '$to_ary')) {
            return (other)['$=='](array);
          } else {
            return false;
          }
        }

        if (array.$$constructor !== Array)
          array = (array).$to_a();
        if (other.$$constructor !== Array)
          other = (other).$to_a();

        if (array.length !== other.length) {
          return false;
        }

        recursed[(array).$object_id()] = true;

        for (i = 0, length = array.length; i < length; i++) {
          a = array[i];
          b = other[i];
          if (a.$$is_array) {
            if (b.$$is_array && b.length !== a.length) {
              return false;
            }
            if (!recursed.hasOwnProperty((a).$object_id())) {
              if (!_eqeq(a, b)) {
                return false;
              }
            }
          } else {
            if (!(a)['$=='](b)) {
              return false;
            }
          }
        }

        return true;
      }

      return _eqeq(self, other);
    
    }, $Array_$eq_eq$11.$$arity = 1);
    
    function $array_slice_range(self, index) {
      var size = self.length,
          exclude, from, to, result;

      exclude = index.excl;
      from    = $coerce_to(index.begin, Opal.Integer, 'to_int');
      to      = $coerce_to(index.end, Opal.Integer, 'to_int');

      if (from < 0) {
        from += size;

        if (from < 0) {
          return nil;
        }
      }

      if (from > size) {
        return nil;
      }

      if (to < 0) {
        to += size;

        if (to < 0) {
          return [];
        }
      }

      if (!exclude) {
        to += 1;
      }

      result = self.slice(from, to);
      return result;
    }

    function $array_slice_index_length(self, index, length) {
      var size = self.length,
          exclude, from, to, result;

      index = $coerce_to(index, Opal.Integer, 'to_int');

      if (index < 0) {
        index += size;

        if (index < 0) {
          return nil;
        }
      }

      if (length === undefined) {
        if (index >= size || index < 0) {
          return nil;
        }

        return self[index];
      }
      else {
        length = $coerce_to(length, Opal.Integer, 'to_int');

        if (length < 0 || index > size || index < 0) {
          return nil;
        }

        result = self.slice(index, index + length);
      }
      return result;
    }
  ;
    
    Opal.def(self, '$[]', $Array_$$$12 = function(index, length) {
      var self = this;

      
      ;
      
      if (index.$$is_range) {
        return $array_slice_range(self, index);
      }
      else {
        return $array_slice_index_length(self, index, length);
      }
    ;
    }, $Array_$$$12.$$arity = -2);
    
    Opal.def(self, '$[]=', $Array_$$$eq$13 = function(index, value, extra) {
      var self = this, data = nil, length = nil;

      
      ;
            var i, size = self.length;;
      if ($truthy($$($nesting, 'Range')['$==='](index))) {
        
        data = (function() {if ($truthy($$($nesting, 'Array')['$==='](value))) {
          return value.$to_a()
        } else if ($truthy(value['$respond_to?']("to_ary"))) {
          return value.$to_ary().$to_a()
        } else {
          return [value]
        }; return nil; })();
        
        var exclude = index.excl,
            from    = $coerce_to(index.begin, $$($nesting, 'Integer'), 'to_int'),
            to      = $coerce_to(index.end, $$($nesting, 'Integer'), 'to_int');

        if (from < 0) {
          from += size;

          if (from < 0) {
            self.$raise($$($nesting, 'RangeError'), "" + (index.$inspect()) + " out of range");
          }
        }

        if (to < 0) {
          to += size;
        }

        if (!exclude) {
          to += 1;
        }

        if (from > size) {
          for (i = size; i < from; i++) {
            self[i] = nil;
          }
        }

        if (to < 0) {
          self.splice.apply(self, [from, 0].concat(data));
        }
        else {
          self.splice.apply(self, [from, to - from].concat(data));
        }

        return value;
      ;
      } else {
        
        if ($truthy(extra === undefined)) {
          length = 1
        } else {
          
          length = value;
          value = extra;
          data = (function() {if ($truthy($$($nesting, 'Array')['$==='](value))) {
            return value.$to_a()
          } else if ($truthy(value['$respond_to?']("to_ary"))) {
            return value.$to_ary().$to_a()
          } else {
            return [value]
          }; return nil; })();
        };
        
        var old;

        index  = $coerce_to(index, $$($nesting, 'Integer'), 'to_int');
        length = $coerce_to(length, $$($nesting, 'Integer'), 'to_int');

        if (index < 0) {
          old    = index;
          index += size;

          if (index < 0) {
            self.$raise($$($nesting, 'IndexError'), "" + "index " + (old) + " too small for array; minimum " + (-self.length));
          }
        }

        if (length < 0) {
          self.$raise($$($nesting, 'IndexError'), "" + "negative length (" + (length) + ")")
        }

        if (index > size) {
          for (i = size; i < index; i++) {
            self[i] = nil;
          }
        }

        if (extra === undefined) {
          self[index] = value;
        }
        else {
          self.splice.apply(self, [index, length].concat(data));
        }

        return value;
      ;
      };
    }, $Array_$$$eq$13.$$arity = -3);
    
    Opal.def(self, '$any?', $Array_any$ques$14 = function(pattern) {
      var $iter = $Array_any$ques$14.$$p, block = $iter || nil, self = this;

      if ($iter) $Array_any$ques$14.$$p = null;
      
      
      if ($iter) $Array_any$ques$14.$$p = null;;
      ;
      if (self.length === 0) return false;
      return $send2(self, $find_super(self, 'any?', $Array_any$ques$14, false, true), 'any?', [pattern], $iter);
    }, $Array_any$ques$14.$$arity = -1);
    
    Opal.def(self, '$assoc', $Array_assoc$15 = function $$assoc(object) {
      var self = this;

      
      for (var i = 0, length = self.length, item; i < length; i++) {
        if (item = self[i], item.length && (item[0])['$=='](object)) {
          return item;
        }
      }

      return nil;
    
    }, $Array_assoc$15.$$arity = 1);
    
    Opal.def(self, '$at', $Array_at$16 = function $$at(index) {
      var self = this;

      
      index = $coerce_to(index, $$($nesting, 'Integer'), 'to_int')

      if (index < 0) {
        index += self.length;
      }

      if (index < 0 || index >= self.length) {
        return nil;
      }

      return self[index];
    
    }, $Array_at$16.$$arity = 1);
    
    Opal.def(self, '$bsearch_index', $Array_bsearch_index$17 = function $$bsearch_index() {
      var $iter = $Array_bsearch_index$17.$$p, block = $iter || nil, self = this;

      if ($iter) $Array_bsearch_index$17.$$p = null;
      
      
      if ($iter) $Array_bsearch_index$17.$$p = null;;
      if ((block !== nil)) {
      } else {
        return self.$enum_for("bsearch_index")
      };
      
      var min = 0,
          max = self.length,
          mid,
          val,
          ret,
          smaller = false,
          satisfied = nil;

      while (min < max) {
        mid = min + Math.floor((max - min) / 2);
        val = self[mid];
        ret = $yield1(block, val);

        if (ret === true) {
          satisfied = mid;
          smaller = true;
        }
        else if (ret === false || ret === nil) {
          smaller = false;
        }
        else if (ret.$$is_number) {
          if (ret === 0) { return mid; }
          smaller = (ret < 0);
        }
        else {
          self.$raise($$($nesting, 'TypeError'), "" + "wrong argument type " + ((ret).$class()) + " (must be numeric, true, false or nil)")
        }

        if (smaller) { max = mid; } else { min = mid + 1; }
      }

      return satisfied;
    ;
    }, $Array_bsearch_index$17.$$arity = 0);
    
    Opal.def(self, '$bsearch', $Array_bsearch$18 = function $$bsearch() {
      var $iter = $Array_bsearch$18.$$p, block = $iter || nil, self = this, index = nil;

      if ($iter) $Array_bsearch$18.$$p = null;
      
      
      if ($iter) $Array_bsearch$18.$$p = null;;
      if ((block !== nil)) {
      } else {
        return self.$enum_for("bsearch")
      };
      index = $send(self, 'bsearch_index', [], block.$to_proc());
      
      if (index != null && index.$$is_number) {
        return self[index];
      } else {
        return index;
      }
    ;
    }, $Array_bsearch$18.$$arity = 0);
    
    Opal.def(self, '$cycle', $Array_cycle$19 = function $$cycle(n) {
      var $iter = $Array_cycle$19.$$p, block = $iter || nil, $$20, self = this, $ret_or_1 = nil;

      if ($iter) $Array_cycle$19.$$p = null;
      
      
      if ($iter) $Array_cycle$19.$$p = null;;
      
      if (n == null) {
        n = nil;
      };
      if ((block !== nil)) {
      } else {
        return $send(self, 'enum_for', ["cycle", n], ($$20 = function(){var self = $$20.$$s == null ? this : $$20.$$s;

          if ($truthy(n['$nil?']())) {
            return $$$($$($nesting, 'Float'), 'INFINITY')
          } else {
            
            n = $$($nesting, 'Opal')['$coerce_to!'](n, $$($nesting, 'Integer'), "to_int");
            if ($truthy($rb_gt(n, 0))) {
              return $rb_times(self.$enumerator_size(), n)
            } else {
              return 0
            };
          }}, $$20.$$s = self, $$20.$$arity = 0, $$20))
      };
      if ($truthy((function() {if ($truthy(($ret_or_1 = self['$empty?']()))) {
        return $ret_or_1
      } else {
        return n['$=='](0)
      }; return nil; })())) {
        return nil};
      
      var i, length, value;

      if (n === nil) {
        while (true) {
          for (i = 0, length = self.length; i < length; i++) {
            value = $yield1(block, self[i]);
          }
        }
      }
      else {
        n = $$($nesting, 'Opal')['$coerce_to!'](n, $$($nesting, 'Integer'), "to_int");
        if (n <= 0) {
          return self;
        }

        while (n > 0) {
          for (i = 0, length = self.length; i < length; i++) {
            value = $yield1(block, self[i]);
          }

          n--;
        }
      }
    ;
      return self;
    }, $Array_cycle$19.$$arity = -1);
    
    Opal.def(self, '$clear', $Array_clear$21 = function $$clear() {
      var self = this;

      
      self.splice(0, self.length);
      return self;
    }, $Array_clear$21.$$arity = 0);
    
    Opal.def(self, '$count', $Array_count$22 = function $$count(object) {
      var $iter = $Array_count$22.$$p, block = $iter || nil, self = this, $ret_or_2 = nil;

      if ($iter) $Array_count$22.$$p = null;
      
      
      if ($iter) $Array_count$22.$$p = null;;
      ;
      if ($truthy((function() {if ($truthy(($ret_or_2 = object !== undefined))) {
        return $ret_or_2
      } else {
        return block
      }; return nil; })())) {
        return $send2(self, $find_super(self, 'count', $Array_count$22, false, true), 'count', [object], $iter)
      } else {
        return self.$size()
      };
    }, $Array_count$22.$$arity = -1);
    
    Opal.def(self, '$initialize_copy', $Array_initialize_copy$23 = function $$initialize_copy(other) {
      var self = this;

      return self.$replace(other)
    }, $Array_initialize_copy$23.$$arity = 1);
    
    Opal.def(self, '$collect', $Array_collect$24 = function $$collect() {
      var $iter = $Array_collect$24.$$p, block = $iter || nil, $$25, self = this;

      if ($iter) $Array_collect$24.$$p = null;
      
      
      if ($iter) $Array_collect$24.$$p = null;;
      if ((block !== nil)) {
      } else {
        return $send(self, 'enum_for', ["collect"], ($$25 = function(){var self = $$25.$$s == null ? this : $$25.$$s;

          return self.$size()}, $$25.$$s = self, $$25.$$arity = 0, $$25))
      };
      
      var result = [];

      for (var i = 0, length = self.length; i < length; i++) {
        var value = $yield1(block, self[i]);
        result.push(value);
      }

      return result;
    ;
    }, $Array_collect$24.$$arity = 0);
    
    Opal.def(self, '$collect!', $Array_collect$excl$26 = function() {
      var $iter = $Array_collect$excl$26.$$p, block = $iter || nil, $$27, self = this;

      if ($iter) $Array_collect$excl$26.$$p = null;
      
      
      if ($iter) $Array_collect$excl$26.$$p = null;;
      if ((block !== nil)) {
      } else {
        return $send(self, 'enum_for', ["collect!"], ($$27 = function(){var self = $$27.$$s == null ? this : $$27.$$s;

          return self.$size()}, $$27.$$s = self, $$27.$$arity = 0, $$27))
      };
      
      for (var i = 0, length = self.length; i < length; i++) {
        var value = $yield1(block, self[i]);
        self[i] = value;
      }
    ;
      return self;
    }, $Array_collect$excl$26.$$arity = 0);
    
    function binomial_coefficient(n, k) {
      if (n === k || k === 0) {
        return 1;
      }

      if (k > 0 && n > k) {
        return binomial_coefficient(n - 1, k - 1) + binomial_coefficient(n - 1, k);
      }

      return 0;
    }
  ;
    
    Opal.def(self, '$combination', $Array_combination$28 = function $$combination(n) {
      var $$29, $iter = $Array_combination$28.$$p, $yield = $iter || nil, self = this, num = nil;

      if ($iter) $Array_combination$28.$$p = null;
      
      num = $$($nesting, 'Opal')['$coerce_to!'](n, $$($nesting, 'Integer'), "to_int");
      if (($yield !== nil)) {
      } else {
        return $send(self, 'enum_for', ["combination", num], ($$29 = function(){var self = $$29.$$s == null ? this : $$29.$$s;

          return binomial_coefficient(self.length, num)}, $$29.$$s = self, $$29.$$arity = 0, $$29))
      };
      
      var i, length, stack, chosen, lev, done, next;

      if (num === 0) {
        Opal.yield1($yield, [])
      } else if (num === 1) {
        for (i = 0, length = self.length; i < length; i++) {
          Opal.yield1($yield, [self[i]])
        }
      }
      else if (num === self.length) {
        Opal.yield1($yield, self.slice())
      }
      else if (num >= 0 && num < self.length) {
        stack = [];
        for (i = 0; i <= num + 1; i++) {
          stack.push(0);
        }

        chosen = [];
        lev = 0;
        done = false;
        stack[0] = -1;

        while (!done) {
          chosen[lev] = self[stack[lev+1]];
          while (lev < num - 1) {
            lev++;
            next = stack[lev+1] = stack[lev] + 1;
            chosen[lev] = self[next];
          }
          Opal.yield1($yield, chosen.slice())
          lev++;
          do {
            done = (lev === 0);
            stack[lev]++;
            lev--;
          } while ( stack[lev+1] + num === self.length + lev + 1 );
        }
      }
    ;
      return self;
    }, $Array_combination$28.$$arity = 1);
    
    Opal.def(self, '$repeated_combination', $Array_repeated_combination$30 = function $$repeated_combination(n) {
      var $$31, $iter = $Array_repeated_combination$30.$$p, $yield = $iter || nil, self = this, num = nil;

      if ($iter) $Array_repeated_combination$30.$$p = null;
      
      num = $$($nesting, 'Opal')['$coerce_to!'](n, $$($nesting, 'Integer'), "to_int");
      if (($yield !== nil)) {
      } else {
        return $send(self, 'enum_for', ["repeated_combination", num], ($$31 = function(){var self = $$31.$$s == null ? this : $$31.$$s;

          return binomial_coefficient(self.length + num - 1, num);}, $$31.$$s = self, $$31.$$arity = 0, $$31))
      };
      
      function iterate(max, from, buffer, self) {
        if (buffer.length == max) {
          var copy = buffer.slice();
          Opal.yield1($yield, copy)
          return;
        }
        for (var i = from; i < self.length; i++) {
          buffer.push(self[i]);
          iterate(max, i, buffer, self);
          buffer.pop();
        }
      }

      if (num >= 0) {
        iterate(num, 0, [], self);
      }
    ;
      return self;
    }, $Array_repeated_combination$30.$$arity = 1);
    
    Opal.def(self, '$compact', $Array_compact$32 = function $$compact() {
      var self = this;

      
      var result = [];

      for (var i = 0, length = self.length, item; i < length; i++) {
        if ((item = self[i]) !== nil) {
          result.push(item);
        }
      }

      return result;
    
    }, $Array_compact$32.$$arity = 0);
    
    Opal.def(self, '$compact!', $Array_compact$excl$33 = function() {
      var self = this;

      
      var original = self.length;

      for (var i = 0, length = self.length; i < length; i++) {
        if (self[i] === nil) {
          self.splice(i, 1);

          length--;
          i--;
        }
      }

      return self.length === original ? nil : self;
    
    }, $Array_compact$excl$33.$$arity = 0);
    
    Opal.def(self, '$concat', $Array_concat$34 = function $$concat($a) {
      var $post_args, others, $$35, $$36, self = this;

      
      
      $post_args = Opal.slice.call(arguments, 0, arguments.length);
      
      others = $post_args;;
      others = $send(others, 'map', [], ($$35 = function(other){var self = $$35.$$s == null ? this : $$35.$$s;

        
        
        if (other == null) {
          other = nil;
        };
        other = (function() {if ($truthy($$($nesting, 'Array')['$==='](other))) {
          return other.$to_a()
        } else {
          return ($coerce_to(other, $$($nesting, 'Array'), 'to_ary')).$to_a()
        }; return nil; })();
        if ($truthy(other['$equal?'](self))) {
          other = other.$dup()};
        return other;}, $$35.$$s = self, $$35.$$arity = 1, $$35));
      $send(others, 'each', [], ($$36 = function(other){var self = $$36.$$s == null ? this : $$36.$$s;

        
        
        if (other == null) {
          other = nil;
        };
        
        for (var i = 0, length = other.length; i < length; i++) {
          self.push(other[i]);
        }
      ;}, $$36.$$s = self, $$36.$$arity = 1, $$36));
      return self;
    }, $Array_concat$34.$$arity = -1);
    
    Opal.def(self, '$delete', $Array_delete$37 = function(object) {
      var $iter = $Array_delete$37.$$p, $yield = $iter || nil, self = this;

      if ($iter) $Array_delete$37.$$p = null;
      
      var original = self.length;

      for (var i = 0, length = original; i < length; i++) {
        if ((self[i])['$=='](object)) {
          self.splice(i, 1);

          length--;
          i--;
        }
      }

      if (self.length === original) {
        if (($yield !== nil)) {
          return Opal.yieldX($yield, []);
        }
        return nil;
      }
      return object;
    
    }, $Array_delete$37.$$arity = 1);
    
    Opal.def(self, '$delete_at', $Array_delete_at$38 = function $$delete_at(index) {
      var self = this;

      
      index = $coerce_to(index, $$($nesting, 'Integer'), 'to_int');

      if (index < 0) {
        index += self.length;
      }

      if (index < 0 || index >= self.length) {
        return nil;
      }

      var result = self[index];

      self.splice(index, 1);

      return result;
    
    }, $Array_delete_at$38.$$arity = 1);
    
    Opal.def(self, '$delete_if', $Array_delete_if$39 = function $$delete_if() {
      var $iter = $Array_delete_if$39.$$p, block = $iter || nil, $$40, self = this;

      if ($iter) $Array_delete_if$39.$$p = null;
      
      
      if ($iter) $Array_delete_if$39.$$p = null;;
      if ((block !== nil)) {
      } else {
        return $send(self, 'enum_for', ["delete_if"], ($$40 = function(){var self = $$40.$$s == null ? this : $$40.$$s;

          return self.$size()}, $$40.$$s = self, $$40.$$arity = 0, $$40))
      };
      filterIf(self, $falsy, block);
      return self;
    }, $Array_delete_if$39.$$arity = 0);
    
    Opal.def(self, '$difference', $Array_difference$41 = function $$difference($a) {
      var $post_args, arrays, $$42, self = this;

      
      
      $post_args = Opal.slice.call(arguments, 0, arguments.length);
      
      arrays = $post_args;;
      return $send(arrays, 'reduce', [self.$to_a().$dup()], ($$42 = function(a, b){var self = $$42.$$s == null ? this : $$42.$$s;

        
        
        if (a == null) {
          a = nil;
        };
        
        if (b == null) {
          b = nil;
        };
        return $rb_minus(a, b);}, $$42.$$s = self, $$42.$$arity = 2, $$42));
    }, $Array_difference$41.$$arity = -1);
    
    Opal.def(self, '$dig', $Array_dig$43 = function $$dig(idx, $a) {
      var $post_args, idxs, self = this, item = nil;

      
      
      $post_args = Opal.slice.call(arguments, 1, arguments.length);
      
      idxs = $post_args;;
      item = self['$[]'](idx);
      
      if (item === nil || idxs.length === 0) {
        return item;
      }
    ;
      if ($truthy(item['$respond_to?']("dig"))) {
      } else {
        self.$raise($$($nesting, 'TypeError'), "" + (item.$class()) + " does not have #dig method")
      };
      return $send(item, 'dig', Opal.to_a(idxs));
    }, $Array_dig$43.$$arity = -2);
    
    Opal.def(self, '$drop', $Array_drop$44 = function $$drop(number) {
      var self = this;

      
      if (number < 0) {
        self.$raise($$($nesting, 'ArgumentError'))
      }

      return self.slice(number);
    
    }, $Array_drop$44.$$arity = 1);
    
    Opal.def(self, '$dup', $Array_dup$45 = function $$dup() {
      var $iter = $Array_dup$45.$$p, $yield = $iter || nil, self = this;

      if ($iter) $Array_dup$45.$$p = null;
      
      
      if (self.$$class === Opal.Array &&
          self.$$class.$allocate.$$pristine &&
          self.$copy_instance_variables.$$pristine &&
          self.$initialize_dup.$$pristine) {
        return self.slice(0);
      }
    ;
      return $send2(self, $find_super(self, 'dup', $Array_dup$45, false, true), 'dup', [], $iter);
    }, $Array_dup$45.$$arity = 0);
    
    Opal.def(self, '$each', $Array_each$46 = function $$each() {
      var $iter = $Array_each$46.$$p, block = $iter || nil, $$47, self = this;

      if ($iter) $Array_each$46.$$p = null;
      
      
      if ($iter) $Array_each$46.$$p = null;;
      if ((block !== nil)) {
      } else {
        return $send(self, 'enum_for', ["each"], ($$47 = function(){var self = $$47.$$s == null ? this : $$47.$$s;

          return self.$size()}, $$47.$$s = self, $$47.$$arity = 0, $$47))
      };
      
      for (var i = 0, length = self.length; i < length; i++) {
        var value = $yield1(block, self[i]);
      }
    ;
      return self;
    }, $Array_each$46.$$arity = 0);
    
    Opal.def(self, '$each_index', $Array_each_index$48 = function $$each_index() {
      var $iter = $Array_each_index$48.$$p, block = $iter || nil, $$49, self = this;

      if ($iter) $Array_each_index$48.$$p = null;
      
      
      if ($iter) $Array_each_index$48.$$p = null;;
      if ((block !== nil)) {
      } else {
        return $send(self, 'enum_for', ["each_index"], ($$49 = function(){var self = $$49.$$s == null ? this : $$49.$$s;

          return self.$size()}, $$49.$$s = self, $$49.$$arity = 0, $$49))
      };
      
      for (var i = 0, length = self.length; i < length; i++) {
        var value = $yield1(block, i);
      }
    ;
      return self;
    }, $Array_each_index$48.$$arity = 0);
    
    Opal.def(self, '$empty?', $Array_empty$ques$50 = function() {
      var self = this;

      return self.length === 0;
    }, $Array_empty$ques$50.$$arity = 0);
    
    Opal.def(self, '$eql?', $Array_eql$ques$51 = function(other) {
      var self = this;

      
      var recursed = {};

      function _eql(array, other) {
        var i, length, a, b;

        if (!other.$$is_array) {
          return false;
        }

        other = other.$to_a();

        if (array.length !== other.length) {
          return false;
        }

        recursed[(array).$object_id()] = true;

        for (i = 0, length = array.length; i < length; i++) {
          a = array[i];
          b = other[i];
          if (a.$$is_array) {
            if (b.$$is_array && b.length !== a.length) {
              return false;
            }
            if (!recursed.hasOwnProperty((a).$object_id())) {
              if (!_eql(a, b)) {
                return false;
              }
            }
          } else {
            if (!(a)['$eql?'](b)) {
              return false;
            }
          }
        }

        return true;
      }

      return _eql(self, other);
    
    }, $Array_eql$ques$51.$$arity = 1);
    
    Opal.def(self, '$fetch', $Array_fetch$52 = function $$fetch(index, defaults) {
      var $iter = $Array_fetch$52.$$p, block = $iter || nil, self = this;

      if ($iter) $Array_fetch$52.$$p = null;
      
      
      if ($iter) $Array_fetch$52.$$p = null;;
      ;
      
      var original = index;

      index = $coerce_to(index, $$($nesting, 'Integer'), 'to_int');

      if (index < 0) {
        index += self.length;
      }

      if (index >= 0 && index < self.length) {
        return self[index];
      }

      if (block !== nil && defaults != null) {
        self.$warn("warning: block supersedes default value argument")
      }

      if (block !== nil) {
        return block(original);
      }

      if (defaults != null) {
        return defaults;
      }

      if (self.length === 0) {
        self.$raise($$($nesting, 'IndexError'), "" + "index " + (original) + " outside of array bounds: 0...0")
      }
      else {
        self.$raise($$($nesting, 'IndexError'), "" + "index " + (original) + " outside of array bounds: -" + (self.length) + "..." + (self.length));
      }
    ;
    }, $Array_fetch$52.$$arity = -2);
    
    Opal.def(self, '$fill', $Array_fill$53 = function $$fill($a) {
      var $iter = $Array_fill$53.$$p, block = $iter || nil, $post_args, args, $b, $c, self = this, one = nil, two = nil, obj = nil, left = nil, right = nil;

      if ($iter) $Array_fill$53.$$p = null;
      
      
      if ($iter) $Array_fill$53.$$p = null;;
      
      $post_args = Opal.slice.call(arguments, 0, arguments.length);
      
      args = $post_args;;
            var i, length, value;;
      if ($truthy(block)) {
        
        if ($truthy(args.length > 2)) {
          self.$raise($$($nesting, 'ArgumentError'), "" + "wrong number of arguments (" + (args.$length()) + " for 0..2)")};
        $c = args, $b = Opal.to_ary($c), (one = ($b[0] == null ? nil : $b[0])), (two = ($b[1] == null ? nil : $b[1])), $c;
      } else {
        
        if ($truthy(args.length == 0)) {
          self.$raise($$($nesting, 'ArgumentError'), "wrong number of arguments (0 for 1..3)")
        } else if ($truthy(args.length > 3)) {
          self.$raise($$($nesting, 'ArgumentError'), "" + "wrong number of arguments (" + (args.$length()) + " for 1..3)")};
        $c = args, $b = Opal.to_ary($c), (obj = ($b[0] == null ? nil : $b[0])), (one = ($b[1] == null ? nil : $b[1])), (two = ($b[2] == null ? nil : $b[2])), $c;
      };
      if ($truthy($$($nesting, 'Range')['$==='](one))) {
        
        if ($truthy(two)) {
          self.$raise($$($nesting, 'TypeError'), "length invalid with range")};
        left = $coerce_to(one.begin, $$($nesting, 'Integer'), 'to_int');
        if ($truthy(left < 0)) {
          left += this.length};
        if ($truthy(left < 0)) {
          self.$raise($$($nesting, 'RangeError'), "" + (one.$inspect()) + " out of range")};
        right = $coerce_to(one.end, $$($nesting, 'Integer'), 'to_int');
        if ($truthy(right < 0)) {
          right += this.length};
        if ($truthy(one['$exclude_end?']())) {
        } else {
          right += 1
        };
        if ($truthy(right <= left)) {
          return self};
      } else if ($truthy(one)) {
        
        left = $coerce_to(one, $$($nesting, 'Integer'), 'to_int');
        if ($truthy(left < 0)) {
          left += this.length};
        if ($truthy(left < 0)) {
          left = 0};
        if ($truthy(two)) {
          
          right = $coerce_to(two, $$($nesting, 'Integer'), 'to_int');
          if ($truthy(right == 0)) {
            return self};
          right += left;
        } else {
          right = this.length
        };
      } else {
        
        left = 0;
        right = this.length;
      };
      if ($truthy(left > this.length)) {
        
        for (i = this.length; i < right; i++) {
          self[i] = nil;
        }
      };
      if ($truthy(right > this.length)) {
        this.length = right};
      if ($truthy(block)) {
        
        for (length = this.length; left < right; left++) {
          value = block(left);
          self[left] = value;
        }
      
      } else {
        
        for (length = this.length; left < right; left++) {
          self[left] = obj;
        }
      
      };
      return self;
    }, $Array_fill$53.$$arity = -1);
    
    Opal.def(self, '$first', $Array_first$54 = function $$first(count) {
      var self = this;

      
      ;
      
      if (count == null) {
        return self.length === 0 ? nil : self[0];
      }

      count = $coerce_to(count, $$($nesting, 'Integer'), 'to_int');

      if (count < 0) {
        self.$raise($$($nesting, 'ArgumentError'), "negative array size");
      }

      return self.slice(0, count);
    ;
    }, $Array_first$54.$$arity = -1);
    
    Opal.def(self, '$flatten', $Array_flatten$55 = function $$flatten(level) {
      var self = this;

      
      ;
      
      function _flatten(array, level) {
        var result = [],
            i, length,
            item, ary;

        array = (array).$to_a();

        for (i = 0, length = array.length; i < length; i++) {
          item = array[i];

          if (!$respond_to(item, '$to_ary', true)) {
            result.push(item);
            continue;
          }

          ary = (item).$to_ary();

          if (ary === nil) {
            result.push(item);
            continue;
          }

          if (!ary.$$is_array) {
            self.$raise($$($nesting, 'TypeError'));
          }

          if (ary === self) {
            self.$raise($$($nesting, 'ArgumentError'));
          }

          switch (level) {
          case undefined:
            result = result.concat(_flatten(ary));
            break;
          case 0:
            result.push(ary);
            break;
          default:
            result.push.apply(result, _flatten(ary, level - 1));
          }
        }
        return result;
      }

      if (level !== undefined) {
        level = $coerce_to(level, $$($nesting, 'Integer'), 'to_int');
      }

      return _flatten(self, level);
    ;
    }, $Array_flatten$55.$$arity = -1);
    
    Opal.def(self, '$flatten!', $Array_flatten$excl$56 = function(level) {
      var self = this;

      
      ;
      
      var flattened = self.$flatten(level);

      if (self.length == flattened.length) {
        for (var i = 0, length = self.length; i < length; i++) {
          if (self[i] !== flattened[i]) {
            break;
          }
        }

        if (i == length) {
          return nil;
        }
      }

      self.$replace(flattened);
    ;
      return self;
    }, $Array_flatten$excl$56.$$arity = -1);
    
    Opal.def(self, '$hash', $Array_hash$57 = function $$hash() {
      var self = this;

      
      var top = ($hash_ids === undefined),
          result = ['A'],
          hash_id = self.$object_id(),
          item, i, key;

      try {
        if (top) {
          $hash_ids = Object.create(null);
        }

        // return early for recursive structures
        if ($hash_ids[hash_id]) {
          return 'self';
        }

        for (key in $hash_ids) {
          item = $hash_ids[key];
          if (self['$eql?'](item)) {
            return 'self';
          }
        }

        $hash_ids[hash_id] = self;

        for (i = 0; i < self.length; i++) {
          item = self[i];
          result.push(item.$hash());
        }

        return result.join(',');
      } finally {
        if (top) {
          $hash_ids = undefined;
        }
      }
    
    }, $Array_hash$57.$$arity = 0);
    
    Opal.def(self, '$include?', $Array_include$ques$58 = function(member) {
      var self = this;

      
      for (var i = 0, length = self.length; i < length; i++) {
        if ((self[i])['$=='](member)) {
          return true;
        }
      }

      return false;
    
    }, $Array_include$ques$58.$$arity = 1);
    
    Opal.def(self, '$index', $Array_index$59 = function $$index(object) {
      var $iter = $Array_index$59.$$p, block = $iter || nil, self = this;

      if ($iter) $Array_index$59.$$p = null;
      
      
      if ($iter) $Array_index$59.$$p = null;;
      ;
      
      var i, length, value;

      if (object != null && block !== nil) {
        self.$warn("warning: given block not used")
      }

      if (object != null) {
        for (i = 0, length = self.length; i < length; i++) {
          if ((self[i])['$=='](object)) {
            return i;
          }
        }
      }
      else if (block !== nil) {
        for (i = 0, length = self.length; i < length; i++) {
          value = block(self[i]);

          if (value !== false && value !== nil) {
            return i;
          }
        }
      }
      else {
        return self.$enum_for("index");
      }

      return nil;
    ;
    }, $Array_index$59.$$arity = -1);
    
    Opal.def(self, '$insert', $Array_insert$60 = function $$insert(index, $a) {
      var $post_args, objects, self = this;

      
      
      $post_args = Opal.slice.call(arguments, 1, arguments.length);
      
      objects = $post_args;;
      
      index = $coerce_to(index, $$($nesting, 'Integer'), 'to_int');

      if (objects.length > 0) {
        if (index < 0) {
          index += self.length + 1;

          if (index < 0) {
            self.$raise($$($nesting, 'IndexError'), "" + (index) + " is out of bounds");
          }
        }
        if (index > self.length) {
          for (var i = self.length; i < index; i++) {
            self.push(nil);
          }
        }

        self.splice.apply(self, [index, 0].concat(objects));
      }
    ;
      return self;
    }, $Array_insert$60.$$arity = -2);
    
    Opal.def(self, '$inspect', $Array_inspect$61 = function $$inspect() {
      var self = this;

      
      var result = [],
          id     = self.$__id__();

      for (var i = 0, length = self.length; i < length; i++) {
        var item = self['$[]'](i);

        if ((item).$__id__() === id) {
          result.push('[...]');
        }
        else {
          result.push((item).$inspect());
        }
      }

      return '[' + result.join(', ') + ']';
    
    }, $Array_inspect$61.$$arity = 0);
    
    Opal.def(self, '$intersection', $Array_intersection$62 = function $$intersection($a) {
      var $post_args, arrays, $$63, self = this;

      
      
      $post_args = Opal.slice.call(arguments, 0, arguments.length);
      
      arrays = $post_args;;
      return $send(arrays, 'reduce', [self.$to_a().$dup()], ($$63 = function(a, b){var self = $$63.$$s == null ? this : $$63.$$s;

        
        
        if (a == null) {
          a = nil;
        };
        
        if (b == null) {
          b = nil;
        };
        return a['$&'](b);}, $$63.$$s = self, $$63.$$arity = 2, $$63));
    }, $Array_intersection$62.$$arity = -1);
    
    Opal.def(self, '$join', $Array_join$64 = function $$join(sep) {
      var self = this;
      if ($gvars[","] == null) $gvars[","] = nil;

      
      
      if (sep == null) {
        sep = nil;
      };
      if ($truthy(self.length === 0)) {
        return ""};
      if ($truthy(sep === nil)) {
        sep = $gvars[","]};
      
      var result = [];
      var i, length, item, tmp;

      for (i = 0, length = self.length; i < length; i++) {
        item = self[i];

        if ($respond_to(item, '$to_str')) {
          tmp = (item).$to_str();

          if (tmp !== nil) {
            result.push((tmp).$to_s());

            continue;
          }
        }

        if ($respond_to(item, '$to_ary')) {
          tmp = (item).$to_ary();

          if (tmp === self) {
            self.$raise($$($nesting, 'ArgumentError'));
          }

          if (tmp !== nil) {
            result.push((tmp).$join(sep));

            continue;
          }
        }

        if ($respond_to(item, '$to_s')) {
          tmp = (item).$to_s();

          if (tmp !== nil) {
            result.push(tmp);

            continue;
          }
        }

        self.$raise($$($nesting, 'NoMethodError').$new("" + (Opal.inspect(item)) + " doesn't respond to #to_str, #to_ary or #to_s", "to_str"));
      }

      if (sep === nil) {
        return result.join('');
      }
      else {
        return result.join($$($nesting, 'Opal')['$coerce_to!'](sep, $$($nesting, 'String'), "to_str").$to_s());
      }
    ;
    }, $Array_join$64.$$arity = -1);
    
    Opal.def(self, '$keep_if', $Array_keep_if$65 = function $$keep_if() {
      var $iter = $Array_keep_if$65.$$p, block = $iter || nil, $$66, self = this;

      if ($iter) $Array_keep_if$65.$$p = null;
      
      
      if ($iter) $Array_keep_if$65.$$p = null;;
      if ((block !== nil)) {
      } else {
        return $send(self, 'enum_for', ["keep_if"], ($$66 = function(){var self = $$66.$$s == null ? this : $$66.$$s;

          return self.$size()}, $$66.$$s = self, $$66.$$arity = 0, $$66))
      };
      filterIf(self, $truthy, block);
      return self;
    }, $Array_keep_if$65.$$arity = 0);
    
    Opal.def(self, '$last', $Array_last$67 = function $$last(count) {
      var self = this;

      
      ;
      
      if (count == null) {
        return self.length === 0 ? nil : self[self.length - 1];
      }

      count = $coerce_to(count, $$($nesting, 'Integer'), 'to_int');

      if (count < 0) {
        self.$raise($$($nesting, 'ArgumentError'), "negative array size");
      }

      if (count > self.length) {
        count = self.length;
      }

      return self.slice(self.length - count, self.length);
    ;
    }, $Array_last$67.$$arity = -1);
    
    Opal.def(self, '$length', $Array_length$68 = function $$length() {
      var self = this;

      return self.length;
    }, $Array_length$68.$$arity = 0);
    $alias(self, "map", "collect");
    $alias(self, "map!", "collect!");
    
    Opal.def(self, '$max', $Array_max$69 = function $$max(n) {
      var $iter = $Array_max$69.$$p, block = $iter || nil, self = this;

      if ($iter) $Array_max$69.$$p = null;
      
      
      if ($iter) $Array_max$69.$$p = null;;
      ;
      return $send(self.$each(), 'max', [n], block.$to_proc());
    }, $Array_max$69.$$arity = -1);
    
    Opal.def(self, '$min', $Array_min$70 = function $$min() {
      var $iter = $Array_min$70.$$p, block = $iter || nil, self = this;

      if ($iter) $Array_min$70.$$p = null;
      
      
      if ($iter) $Array_min$70.$$p = null;;
      return $send(self.$each(), 'min', [], block.$to_proc());
    }, $Array_min$70.$$arity = 0);
    
    // Returns the product of from, from-1, ..., from - how_many + 1.
    function descending_factorial(from, how_many) {
      var count = how_many >= 0 ? 1 : 0;
      while (how_many) {
        count *= from;
        from--;
        how_many--;
      }
      return count;
    }
  ;
    
    Opal.def(self, '$permutation', $Array_permutation$71 = function $$permutation(num) {
      var $iter = $Array_permutation$71.$$p, block = $iter || nil, $$72, self = this, perm = nil, used = nil;

      if ($iter) $Array_permutation$71.$$p = null;
      
      
      if ($iter) $Array_permutation$71.$$p = null;;
      ;
      if ((block !== nil)) {
      } else {
        return $send(self, 'enum_for', ["permutation", num], ($$72 = function(){var self = $$72.$$s == null ? this : $$72.$$s;

          return descending_factorial(self.length, num === undefined ? self.length : num);}, $$72.$$s = self, $$72.$$arity = 0, $$72))
      };
      
      var permute, offensive, output;

      if (num === undefined) {
        num = self.length;
      }
      else {
        num = $coerce_to(num, $$($nesting, 'Integer'), 'to_int');
      }

      if (num < 0 || self.length < num) {
        // no permutations, yield nothing
      }
      else if (num === 0) {
        // exactly one permutation: the zero-length array
        Opal.yield1(block, [])
      }
      else if (num === 1) {
        // this is a special, easy case
        for (var i = 0; i < self.length; i++) {
          Opal.yield1(block, [self[i]])
        }
      }
      else {
        // this is the general case
        (perm = $$($nesting, 'Array').$new(num));
        (used = $$($nesting, 'Array').$new(self.length, false));

        permute = function(num, perm, index, used, blk) {
          self = this;
          for(var i = 0; i < self.length; i++){
            if(used['$[]'](i)['$!']()) {
              perm[index] = i;
              if(index < num - 1) {
                used[i] = true;
                permute.call(self, num, perm, index + 1, used, blk);
                used[i] = false;
              }
              else {
                output = [];
                for (var j = 0; j < perm.length; j++) {
                  output.push(self[perm[j]]);
                }
                $yield1(blk, output);
              }
            }
          }
        }

        if ((block !== nil)) {
          // offensive (both definitions) copy.
          offensive = self.slice();
          permute.call(offensive, num, perm, 0, used, block);
        }
        else {
          permute.call(self, num, perm, 0, used, block);
        }
      }
    ;
      return self;
    }, $Array_permutation$71.$$arity = -1);
    
    Opal.def(self, '$repeated_permutation', $Array_repeated_permutation$73 = function $$repeated_permutation(n) {
      var $$74, $iter = $Array_repeated_permutation$73.$$p, $yield = $iter || nil, self = this, num = nil;

      if ($iter) $Array_repeated_permutation$73.$$p = null;
      
      num = $$($nesting, 'Opal')['$coerce_to!'](n, $$($nesting, 'Integer'), "to_int");
      if (($yield !== nil)) {
      } else {
        return $send(self, 'enum_for', ["repeated_permutation", num], ($$74 = function(){var self = $$74.$$s == null ? this : $$74.$$s;

          if ($truthy($rb_ge(num, 0))) {
            return self.$size()['$**'](num)
          } else {
            return 0
          }}, $$74.$$s = self, $$74.$$arity = 0, $$74))
      };
      
      function iterate(max, buffer, self) {
        if (buffer.length == max) {
          var copy = buffer.slice();
          Opal.yield1($yield, copy)
          return;
        }
        for (var i = 0; i < self.length; i++) {
          buffer.push(self[i]);
          iterate(max, buffer, self);
          buffer.pop();
        }
      }

      iterate(num, [], self.slice());
    ;
      return self;
    }, $Array_repeated_permutation$73.$$arity = 1);
    
    Opal.def(self, '$pop', $Array_pop$75 = function $$pop(count) {
      var self = this;

      
      ;
      if ($truthy(count === undefined)) {
        
        if ($truthy(self.length === 0)) {
          return nil};
        return self.pop();};
      count = $coerce_to(count, $$($nesting, 'Integer'), 'to_int');
      if ($truthy(count < 0)) {
        self.$raise($$($nesting, 'ArgumentError'), "negative array size")};
      if ($truthy(self.length === 0)) {
        return []};
      if ($truthy(count === 1)) {
        return [self.pop()];
      } else if ($truthy(count > self.length)) {
        return self.splice(0, self.length);
      } else {
        return self.splice(self.length - count, self.length);
      };
    }, $Array_pop$75.$$arity = -1);
    
    Opal.def(self, '$product', $Array_product$76 = function $$product($a) {
      var $iter = $Array_product$76.$$p, block = $iter || nil, $post_args, args, self = this;

      if ($iter) $Array_product$76.$$p = null;
      
      
      if ($iter) $Array_product$76.$$p = null;;
      
      $post_args = Opal.slice.call(arguments, 0, arguments.length);
      
      args = $post_args;;
      
      var result = (block !== nil) ? null : [],
          n = args.length + 1,
          counters = new Array(n),
          lengths  = new Array(n),
          arrays   = new Array(n),
          i, m, subarray, len, resultlen = 1;

      arrays[0] = self;
      for (i = 1; i < n; i++) {
        arrays[i] = $coerce_to(args[i - 1], $$($nesting, 'Array'), 'to_ary');
      }

      for (i = 0; i < n; i++) {
        len = arrays[i].length;
        if (len === 0) {
          return result || self;
        }
        resultlen *= len;
        if (resultlen > 2147483647) {
          self.$raise($$($nesting, 'RangeError'), "too big to product")
        }
        lengths[i] = len;
        counters[i] = 0;
      }

      outer_loop: for (;;) {
        subarray = [];
        for (i = 0; i < n; i++) {
          subarray.push(arrays[i][counters[i]]);
        }
        if (result) {
          result.push(subarray);
        } else {
          Opal.yield1(block, subarray)
        }
        m = n - 1;
        counters[m]++;
        while (counters[m] === lengths[m]) {
          counters[m] = 0;
          if (--m < 0) break outer_loop;
          counters[m]++;
        }
      }

      return result || self;
    ;
    }, $Array_product$76.$$arity = -1);
    
    Opal.def(self, '$push', $Array_push$77 = function $$push($a) {
      var $post_args, objects, self = this;

      
      
      $post_args = Opal.slice.call(arguments, 0, arguments.length);
      
      objects = $post_args;;
      
      for (var i = 0, length = objects.length; i < length; i++) {
        self.push(objects[i]);
      }
    ;
      return self;
    }, $Array_push$77.$$arity = -1);
    $alias(self, "append", "push");
    
    Opal.def(self, '$rassoc', $Array_rassoc$78 = function $$rassoc(object) {
      var self = this;

      
      for (var i = 0, length = self.length, item; i < length; i++) {
        item = self[i];

        if (item.length && item[1] !== undefined) {
          if ((item[1])['$=='](object)) {
            return item;
          }
        }
      }

      return nil;
    
    }, $Array_rassoc$78.$$arity = 1);
    
    Opal.def(self, '$reject', $Array_reject$79 = function $$reject() {
      var $iter = $Array_reject$79.$$p, block = $iter || nil, $$80, self = this;

      if ($iter) $Array_reject$79.$$p = null;
      
      
      if ($iter) $Array_reject$79.$$p = null;;
      if ((block !== nil)) {
      } else {
        return $send(self, 'enum_for', ["reject"], ($$80 = function(){var self = $$80.$$s == null ? this : $$80.$$s;

          return self.$size()}, $$80.$$s = self, $$80.$$arity = 0, $$80))
      };
      
      var result = [];

      for (var i = 0, length = self.length, value; i < length; i++) {
        value = block(self[i]);

        if (value === false || value === nil) {
          result.push(self[i]);
        }
      }
      return result;
    ;
    }, $Array_reject$79.$$arity = 0);
    
    Opal.def(self, '$reject!', $Array_reject$excl$81 = function() {
      var $iter = $Array_reject$excl$81.$$p, block = $iter || nil, $$82, self = this, original = nil;

      if ($iter) $Array_reject$excl$81.$$p = null;
      
      
      if ($iter) $Array_reject$excl$81.$$p = null;;
      if ((block !== nil)) {
      } else {
        return $send(self, 'enum_for', ["reject!"], ($$82 = function(){var self = $$82.$$s == null ? this : $$82.$$s;

          return self.$size()}, $$82.$$s = self, $$82.$$arity = 0, $$82))
      };
      original = self.$length();
      $send(self, 'delete_if', [], block.$to_proc());
      if (self.$length()['$=='](original)) {
        return nil
      } else {
        return self
      };
    }, $Array_reject$excl$81.$$arity = 0);
    
    Opal.def(self, '$replace', $Array_replace$83 = function $$replace(other) {
      var self = this;

      
      other = (function() {if ($truthy($$($nesting, 'Array')['$==='](other))) {
        return other.$to_a()
      } else {
        return ($coerce_to(other, $$($nesting, 'Array'), 'to_ary')).$to_a()
      }; return nil; })();
      
      self.splice(0, self.length);
      self.push.apply(self, other);
    ;
      return self;
    }, $Array_replace$83.$$arity = 1);
    
    Opal.def(self, '$reverse', $Array_reverse$84 = function $$reverse() {
      var self = this;

      return self.slice(0).reverse();
    }, $Array_reverse$84.$$arity = 0);
    
    Opal.def(self, '$reverse!', $Array_reverse$excl$85 = function() {
      var self = this;

      return self.reverse();
    }, $Array_reverse$excl$85.$$arity = 0);
    
    Opal.def(self, '$reverse_each', $Array_reverse_each$86 = function $$reverse_each() {
      var $iter = $Array_reverse_each$86.$$p, block = $iter || nil, $$87, self = this;

      if ($iter) $Array_reverse_each$86.$$p = null;
      
      
      if ($iter) $Array_reverse_each$86.$$p = null;;
      if ((block !== nil)) {
      } else {
        return $send(self, 'enum_for', ["reverse_each"], ($$87 = function(){var self = $$87.$$s == null ? this : $$87.$$s;

          return self.$size()}, $$87.$$s = self, $$87.$$arity = 0, $$87))
      };
      $send(self.$reverse(), 'each', [], block.$to_proc());
      return self;
    }, $Array_reverse_each$86.$$arity = 0);
    
    Opal.def(self, '$rindex', $Array_rindex$88 = function $$rindex(object) {
      var $iter = $Array_rindex$88.$$p, block = $iter || nil, self = this;

      if ($iter) $Array_rindex$88.$$p = null;
      
      
      if ($iter) $Array_rindex$88.$$p = null;;
      ;
      
      var i, value;

      if (object != null && block !== nil) {
        self.$warn("warning: given block not used")
      }

      if (object != null) {
        for (i = self.length - 1; i >= 0; i--) {
          if (i >= self.length) {
            break;
          }
          if ((self[i])['$=='](object)) {
            return i;
          }
        }
      }
      else if (block !== nil) {
        for (i = self.length - 1; i >= 0; i--) {
          if (i >= self.length) {
            break;
          }

          value = block(self[i]);

          if (value !== false && value !== nil) {
            return i;
          }
        }
      }
      else if (object == null) {
        return self.$enum_for("rindex");
      }

      return nil;
    ;
    }, $Array_rindex$88.$$arity = -1);
    
    Opal.def(self, '$rotate', $Array_rotate$89 = function $$rotate(n) {
      var self = this;

      
      
      if (n == null) {
        n = 1;
      };
      
      var ary, idx, firstPart, lastPart;

      n = $coerce_to(n, $$($nesting, 'Integer'), 'to_int')

      if (self.length === 1) {
        return self.slice();
      }
      if (self.length === 0) {
        return [];
      }

      ary = self.slice();
      idx = n % ary.length;

      firstPart = ary.slice(idx);
      lastPart = ary.slice(0, idx);
      return firstPart.concat(lastPart);
    ;
    }, $Array_rotate$89.$$arity = -1);
    
    Opal.def(self, '$rotate!', $Array_rotate$excl$90 = function(cnt) {
      var self = this, ary = nil;

      
      
      if (cnt == null) {
        cnt = 1;
      };
      
      if (self.length === 0 || self.length === 1) {
        return self;
      }
      cnt = $coerce_to(cnt, $$($nesting, 'Integer'), 'to_int');
    ;
      ary = self.$rotate(cnt);
      return self.$replace(ary);
    }, $Array_rotate$excl$90.$$arity = -1);
    (function($base, $super, $parent_nesting) {
      var self = $klass($base, $super, 'SampleRandom');

      var $nesting = [self].concat($parent_nesting), $SampleRandom_initialize$91, $SampleRandom_rand$92;

      self.$$prototype.rng = nil;
      
      
      Opal.def(self, '$initialize', $SampleRandom_initialize$91 = function $$initialize(rng) {
        var self = this;

        return (self.rng = rng)
      }, $SampleRandom_initialize$91.$$arity = 1);
      return (Opal.def(self, '$rand', $SampleRandom_rand$92 = function $$rand(size) {
        var self = this, random = nil;

        
        random = $coerce_to(self.rng.$rand(size), $$($nesting, 'Integer'), 'to_int');
        if ($truthy(random < 0)) {
          self.$raise($$($nesting, 'RangeError'), "random value must be >= 0")};
        if ($truthy(random < size)) {
        } else {
          self.$raise($$($nesting, 'RangeError'), "random value must be less than Array size")
        };
        return random;
      }, $SampleRandom_rand$92.$$arity = 1), nil) && 'rand';
    })($nesting[0], null, $nesting);
    
    Opal.def(self, '$sample', $Array_sample$93 = function $$sample(count, options) {
      var self = this, o = nil, $ret_or_3 = nil, rng = nil, $ret_or_4 = nil;

      
      ;
      ;
      if ($truthy(count === undefined)) {
        return self.$at($$($nesting, 'Kernel').$rand(self.length))};
      if ($truthy(options === undefined)) {
        if ($truthy((o = $$($nesting, 'Opal')['$coerce_to?'](count, $$($nesting, 'Hash'), "to_hash")))) {
          
          options = o;
          count = nil;
        } else {
          
          options = nil;
          count = $coerce_to(count, $$($nesting, 'Integer'), 'to_int');
        }
      } else {
        
        count = $coerce_to(count, $$($nesting, 'Integer'), 'to_int');
        options = $coerce_to(options, $$($nesting, 'Hash'), 'to_hash');
      };
      if ($truthy((function() {if ($truthy(($ret_or_3 = count))) {
        return count < 0;
      } else {
        return $ret_or_3
      }; return nil; })())) {
        self.$raise($$($nesting, 'ArgumentError'), "count must be greater than 0")};
      if ($truthy(options)) {
        rng = options['$[]']("random")};
      rng = (function() {if ($truthy((function() {if ($truthy(($ret_or_4 = rng))) {
        return rng['$respond_to?']("rand")
      } else {
        return $ret_or_4
      }; return nil; })())) {
        return $$($nesting, 'SampleRandom').$new(rng)
      } else {
        return $$($nesting, 'Kernel')
      }; return nil; })();
      if ($truthy(count)) {
      } else {
        return self[rng.$rand(self.length)]
      };
      

      var abandon, spin, result, i, j, k, targetIndex, oldValue;

      if (count > self.length) {
        count = self.length;
      }

      switch (count) {
        case 0:
          return [];
          break;
        case 1:
          return [self[rng.$rand(self.length)]];
          break;
        case 2:
          i = rng.$rand(self.length);
          j = rng.$rand(self.length);
          if (i === j) {
            j = i === 0 ? i + 1 : i - 1;
          }
          return [self[i], self[j]];
          break;
        default:
          if (self.length / count > 3) {
            abandon = false;
            spin = 0;

            result = $$($nesting, 'Array').$new(count);
            i = 1;

            result[0] = rng.$rand(self.length);
            while (i < count) {
              k = rng.$rand(self.length);
              j = 0;

              while (j < i) {
                while (k === result[j]) {
                  spin++;
                  if (spin > 100) {
                    abandon = true;
                    break;
                  }
                  k = rng.$rand(self.length);
                }
                if (abandon) { break; }

                j++;
              }

              if (abandon) { break; }

              result[i] = k;

              i++;
            }

            if (!abandon) {
              i = 0;
              while (i < count) {
                result[i] = self[result[i]];
                i++;
              }

              return result;
            }
          }

          result = self.slice();

          for (var c = 0; c < count; c++) {
            targetIndex = rng.$rand(self.length);
            oldValue = result[c];
            result[c] = result[targetIndex];
            result[targetIndex] = oldValue;
          }

          return count === self.length ? result : (result)['$[]'](0, count);
      }
    ;
    }, $Array_sample$93.$$arity = -1);
    
    Opal.def(self, '$select', $Array_select$94 = function $$select() {
      var $iter = $Array_select$94.$$p, block = $iter || nil, $$95, self = this;

      if ($iter) $Array_select$94.$$p = null;
      
      
      if ($iter) $Array_select$94.$$p = null;;
      if ((block !== nil)) {
      } else {
        return $send(self, 'enum_for', ["select"], ($$95 = function(){var self = $$95.$$s == null ? this : $$95.$$s;

          return self.$size()}, $$95.$$s = self, $$95.$$arity = 0, $$95))
      };
      
      var result = [];

      for (var i = 0, length = self.length, item, value; i < length; i++) {
        item = self[i];

        value = $yield1(block, item);

        if ($truthy(value)) {
          result.push(item);
        }
      }

      return result;
    ;
    }, $Array_select$94.$$arity = 0);
    
    Opal.def(self, '$select!', $Array_select$excl$96 = function() {
      var $iter = $Array_select$excl$96.$$p, block = $iter || nil, $$97, self = this;

      if ($iter) $Array_select$excl$96.$$p = null;
      
      
      if ($iter) $Array_select$excl$96.$$p = null;;
      if ((block !== nil)) {
      } else {
        return $send(self, 'enum_for', ["select!"], ($$97 = function(){var self = $$97.$$s == null ? this : $$97.$$s;

          return self.$size()}, $$97.$$s = self, $$97.$$arity = 0, $$97))
      };
      
      var original = self.length;
      $send(self, 'keep_if', [], block.$to_proc());
      return self.length === original ? nil : self;
    ;
    }, $Array_select$excl$96.$$arity = 0);
    $alias(self, "filter", "select");
    $alias(self, "filter!", "select!");
    
    Opal.def(self, '$shift', $Array_shift$98 = function $$shift(count) {
      var self = this;

      
      ;
      if ($truthy(count === undefined)) {
        
        if ($truthy(self.length === 0)) {
          return nil};
        return shiftNoArg(self);};
      count = $coerce_to(count, $$($nesting, 'Integer'), 'to_int');
      if ($truthy(count < 0)) {
        self.$raise($$($nesting, 'ArgumentError'), "negative array size")};
      if ($truthy(self.length === 0)) {
        return []};
      return self.splice(0, count);;
    }, $Array_shift$98.$$arity = -1);
    $alias(self, "size", "length");
    
    Opal.def(self, '$shuffle', $Array_shuffle$99 = function $$shuffle(rng) {
      var self = this;

      
      ;
      return self.$dup().$to_a()['$shuffle!'](rng);
    }, $Array_shuffle$99.$$arity = -1);
    
    Opal.def(self, '$shuffle!', $Array_shuffle$excl$100 = function(rng) {
      var self = this;

      
      ;
      
      var randgen, i = self.length, j, tmp;

      if (rng !== undefined) {
        rng = $$($nesting, 'Opal')['$coerce_to?'](rng, $$($nesting, 'Hash'), "to_hash");

        if (rng !== nil) {
          rng = rng['$[]']("random");

          if (rng !== nil && rng['$respond_to?']("rand")) {
            randgen = rng;
          }
        }
      }

      while (i) {
        if (randgen) {
          j = randgen.$rand(i).$to_int();

          if (j < 0) {
            self.$raise($$($nesting, 'RangeError'), "" + "random number too small " + (j))
          }

          if (j >= i) {
            self.$raise($$($nesting, 'RangeError'), "" + "random number too big " + (j))
          }
        }
        else {
          j = self.$rand(i);
        }

        tmp = self[--i];
        self[i] = self[j];
        self[j] = tmp;
      }

      return self;
    ;
    }, $Array_shuffle$excl$100.$$arity = -1);
    $alias(self, "slice", "[]");
    
    Opal.def(self, '$slice!', $Array_slice$excl$101 = function(index, length) {
      var self = this, result = nil, range = nil, range_start = nil, range_end = nil, start = nil;

      
      ;
      result = nil;
      if ($truthy(length === undefined)) {
        if ($truthy($$($nesting, 'Range')['$==='](index))) {
          
          range = index;
          result = self['$[]'](range);
          range_start = $coerce_to(range.begin, $$($nesting, 'Integer'), 'to_int');
          range_end = $coerce_to(range.end, $$($nesting, 'Integer'), 'to_int');
          
          if (range_start < 0) {
            range_start += self.length;
          }

          if (range_end < 0) {
            range_end += self.length;
          } else if (range_end >= self.length) {
            range_end = self.length - 1;
            if (range.excl) {
              range_end += 1;
            }
          }

          var range_length = range_end - range_start;
          if (range.excl) {
            range_end -= 1;
          } else {
            range_length += 1;
          }

          if (range_start < self.length && range_start >= 0 && range_end < self.length && range_end >= 0 && range_length > 0) {
            self.splice(range_start, range_length);
          }
        ;
        } else {
          
          start = $coerce_to(index, $$($nesting, 'Integer'), 'to_int');
          
          if (start < 0) {
            start += self.length;
          }

          if (start < 0 || start >= self.length) {
            return nil;
          }

          result = self[start];

          if (start === 0) {
            self.shift();
          } else {
            self.splice(start, 1);
          }
        ;
        }
      } else {
        
        start = $coerce_to(index, $$($nesting, 'Integer'), 'to_int');
        length = $coerce_to(length, $$($nesting, 'Integer'), 'to_int');
        
        if (length < 0) {
          return nil;
        }

        var end = start + length;

        result = self['$[]'](start, length);

        if (start < 0) {
          start += self.length;
        }

        if (start + length > self.length) {
          length = self.length - start;
        }

        if (start < self.length && start >= 0) {
          self.splice(start, length);
        }
      ;
      };
      return result;
    }, $Array_slice$excl$101.$$arity = -2);
    
    Opal.def(self, '$sort', $Array_sort$102 = function $$sort() {
      var $iter = $Array_sort$102.$$p, block = $iter || nil, self = this;

      if ($iter) $Array_sort$102.$$p = null;
      
      
      if ($iter) $Array_sort$102.$$p = null;;
      if ($truthy(self.length > 1)) {
      } else {
        return self
      };
      
      if (block === nil) {
        block = function(a, b) {
          return (a)['$<=>'](b);
        };
      }

      return self.slice().sort(function(x, y) {
        var ret = block(x, y);

        if (ret === nil) {
          self.$raise($$($nesting, 'ArgumentError'), "" + "comparison of " + ((x).$inspect()) + " with " + ((y).$inspect()) + " failed");
        }

        return $rb_gt(ret, 0) ? 1 : ($rb_lt(ret, 0) ? -1 : 0);
      });
    ;
    }, $Array_sort$102.$$arity = 0);
    
    Opal.def(self, '$sort!', $Array_sort$excl$103 = function() {
      var $iter = $Array_sort$excl$103.$$p, block = $iter || nil, self = this;

      if ($iter) $Array_sort$excl$103.$$p = null;
      
      
      if ($iter) $Array_sort$excl$103.$$p = null;;
      
      var result;

      if ((block !== nil)) {
        result = $send((self.slice()), 'sort', [], block.$to_proc());
      }
      else {
        result = (self.slice()).$sort();
      }

      self.length = 0;
      for(var i = 0, length = result.length; i < length; i++) {
        self.push(result[i]);
      }

      return self;
    ;
    }, $Array_sort$excl$103.$$arity = 0);
    
    Opal.def(self, '$sort_by!', $Array_sort_by$excl$104 = function() {
      var $iter = $Array_sort_by$excl$104.$$p, block = $iter || nil, $$105, self = this;

      if ($iter) $Array_sort_by$excl$104.$$p = null;
      
      
      if ($iter) $Array_sort_by$excl$104.$$p = null;;
      if ((block !== nil)) {
      } else {
        return $send(self, 'enum_for', ["sort_by!"], ($$105 = function(){var self = $$105.$$s == null ? this : $$105.$$s;

          return self.$size()}, $$105.$$s = self, $$105.$$arity = 0, $$105))
      };
      return self.$replace($send(self, 'sort_by', [], block.$to_proc()));
    }, $Array_sort_by$excl$104.$$arity = 0);
    
    Opal.def(self, '$take', $Array_take$106 = function $$take(count) {
      var self = this;

      
      if (count < 0) {
        self.$raise($$($nesting, 'ArgumentError'));
      }

      return self.slice(0, count);
    
    }, $Array_take$106.$$arity = 1);
    
    Opal.def(self, '$take_while', $Array_take_while$107 = function $$take_while() {
      var $iter = $Array_take_while$107.$$p, block = $iter || nil, self = this;

      if ($iter) $Array_take_while$107.$$p = null;
      
      
      if ($iter) $Array_take_while$107.$$p = null;;
      
      var result = [];

      for (var i = 0, length = self.length, item, value; i < length; i++) {
        item = self[i];

        value = block(item);

        if (value === false || value === nil) {
          return result;
        }

        result.push(item);
      }

      return result;
    ;
    }, $Array_take_while$107.$$arity = 0);
    
    Opal.def(self, '$to_a', $Array_to_a$108 = function $$to_a() {
      var self = this;

      
      if (self.$$class === Opal.Array) {
        return self;
      }
      else {
        return Opal.Array.$new(self);
      }
    
    }, $Array_to_a$108.$$arity = 0);
    
    Opal.def(self, '$to_ary', $Array_to_ary$109 = function $$to_ary() {
      var self = this;

      return self
    }, $Array_to_ary$109.$$arity = 0);
    
    Opal.def(self, '$to_h', $Array_to_h$110 = function $$to_h() {
      var $iter = $Array_to_h$110.$$p, block = $iter || nil, self = this, array = nil;

      if ($iter) $Array_to_h$110.$$p = null;
      
      
      if ($iter) $Array_to_h$110.$$p = null;;
      array = self;
      if ((block !== nil)) {
        array = $send(array, 'map', [], block.$to_proc())};
      
      var i, len = array.length, ary, key, val, hash = $hash2([], {});

      for (i = 0; i < len; i++) {
        ary = $$($nesting, 'Opal')['$coerce_to?'](array[i], $$($nesting, 'Array'), "to_ary");
        if (!ary.$$is_array) {
          self.$raise($$($nesting, 'TypeError'), "" + "wrong element type " + ((ary).$class()) + " at " + (i) + " (expected array)")
        }
        if (ary.length !== 2) {
          self.$raise($$($nesting, 'ArgumentError'), "" + "wrong array length at " + (i) + " (expected 2, was " + ((ary).$length()) + ")")
        }
        key = ary[0];
        val = ary[1];
        $hash_put(hash, key, val);
      }

      return hash;
    ;
    }, $Array_to_h$110.$$arity = 0);
    $alias(self, "to_s", "inspect");
    
    Opal.def(self, '$transpose', $Array_transpose$111 = function $$transpose() {
      var $$112, self = this, result = nil, max = nil;

      
      if ($truthy(self['$empty?']())) {
        return []};
      result = [];
      max = nil;
      $send(self, 'each', [], ($$112 = function(row){var self = $$112.$$s == null ? this : $$112.$$s, $$113, $ret_or_5 = nil;

        
        
        if (row == null) {
          row = nil;
        };
        row = (function() {if ($truthy($$($nesting, 'Array')['$==='](row))) {
          return row.$to_a()
        } else {
          return ($coerce_to(row, $$($nesting, 'Array'), 'to_ary')).$to_a()
        }; return nil; })();
        max = (function() {if ($truthy(($ret_or_5 = max))) {
          return $ret_or_5
        } else {
          return row.length;
        }; return nil; })();
        if ($truthy((row.length)['$!='](max))) {
          self.$raise($$($nesting, 'IndexError'), "" + "element size differs (" + (row.length) + " should be " + (max) + ")")};
        return $send((row.length), 'times', [], ($$113 = function(i){var self = $$113.$$s == null ? this : $$113.$$s, entry = nil, $ret_or_6 = nil, $writer = nil;

          
          
          if (i == null) {
            i = nil;
          };
          entry = (function() {if ($truthy(($ret_or_6 = result['$[]'](i)))) {
            return $ret_or_6
          } else {
            
            $writer = [i, []];
            $send(result, '[]=', Opal.to_a($writer));
            return $writer[$rb_minus($writer["length"], 1)];
          }; return nil; })();
          return entry['$<<'](row.$at(i));}, $$113.$$s = self, $$113.$$arity = 1, $$113));}, $$112.$$s = self, $$112.$$arity = 1, $$112));
      return result;
    }, $Array_transpose$111.$$arity = 0);
    
    Opal.def(self, '$union', $Array_union$114 = function $$union($a) {
      var $post_args, arrays, $$115, self = this;

      
      
      $post_args = Opal.slice.call(arguments, 0, arguments.length);
      
      arrays = $post_args;;
      return $send(arrays, 'reduce', [self.$uniq()], ($$115 = function(a, b){var self = $$115.$$s == null ? this : $$115.$$s;

        
        
        if (a == null) {
          a = nil;
        };
        
        if (b == null) {
          b = nil;
        };
        return a['$|'](b);}, $$115.$$s = self, $$115.$$arity = 2, $$115));
    }, $Array_union$114.$$arity = -1);
    
    Opal.def(self, '$uniq', $Array_uniq$116 = function $$uniq() {
      var $iter = $Array_uniq$116.$$p, block = $iter || nil, self = this;

      if ($iter) $Array_uniq$116.$$p = null;
      
      
      if ($iter) $Array_uniq$116.$$p = null;;
      
      var hash = $hash2([], {}), i, length, item, key;

      if (block === nil) {
        for (i = 0, length = self.length; i < length; i++) {
          item = self[i];
          if ($hash_get(hash, item) === undefined) {
            $hash_put(hash, item, item);
          }
        }
      }
      else {
        for (i = 0, length = self.length; i < length; i++) {
          item = self[i];
          key = $yield1(block, item);
          if ($hash_get(hash, key) === undefined) {
            $hash_put(hash, key, item);
          }
        }
      }

      return (hash).$values();
    ;
    }, $Array_uniq$116.$$arity = 0);
    
    Opal.def(self, '$uniq!', $Array_uniq$excl$117 = function() {
      var $iter = $Array_uniq$excl$117.$$p, block = $iter || nil, self = this;

      if ($iter) $Array_uniq$excl$117.$$p = null;
      
      
      if ($iter) $Array_uniq$excl$117.$$p = null;;
      
      var original_length = self.length, hash = $hash2([], {}), i, length, item, key;

      for (i = 0, length = original_length; i < length; i++) {
        item = self[i];
        key = (block === nil ? item : $yield1(block, item));

        if ($hash_get(hash, key) === undefined) {
          $hash_put(hash, key, item);
          continue;
        }

        self.splice(i, 1);
        length--;
        i--;
      }

      return self.length === original_length ? nil : self;
    ;
    }, $Array_uniq$excl$117.$$arity = 0);
    
    Opal.def(self, '$unshift', $Array_unshift$118 = function $$unshift($a) {
      var $post_args, objects, self = this;

      
      
      $post_args = Opal.slice.call(arguments, 0, arguments.length);
      
      objects = $post_args;;
      
      var selfLength = self.length
      var objectsLength = objects.length
      if (objectsLength == 0) return self;
      var index = selfLength - objectsLength
      for (var i = 0; i < objectsLength; i++) {
        self.push(self[index + i])
      }
      var len = selfLength - 1
      while (len - objectsLength >= 0) {
        self[len] = self[len - objectsLength]
        len--
      }
      for (var j = 0; j < objectsLength; j++) {
        self[j] = objects[j]
      }
      return self;
    ;
    }, $Array_unshift$118.$$arity = -1);
    $alias(self, "prepend", "unshift");
    
    Opal.def(self, '$values_at', $Array_values_at$119 = function $$values_at($a) {
      var $post_args, args, $$120, self = this, out = nil;

      
      
      $post_args = Opal.slice.call(arguments, 0, arguments.length);
      
      args = $post_args;;
      out = [];
      $send(args, 'each', [], ($$120 = function(elem){var self = $$120.$$s == null ? this : $$120.$$s, $$121, finish = nil, start = nil, i = nil;

        
        
        if (elem == null) {
          elem = nil;
        };
        if ($truthy(elem['$is_a?']($$($nesting, 'Range')))) {
          
          finish = $coerce_to(elem.$last(), $$($nesting, 'Integer'), 'to_int');
          start = $coerce_to(elem.$first(), $$($nesting, 'Integer'), 'to_int');
          
          if (start < 0) {
            start = start + self.length;
            return nil;;
          }
        ;
          
          if (finish < 0) {
            finish = finish + self.length;
          }
          if (elem['$exclude_end?']()) {
            finish--;
          }
          if (finish < start) {
            return nil;;
          }
        ;
          return $send(start, 'upto', [finish], ($$121 = function(i){var self = $$121.$$s == null ? this : $$121.$$s;

            
            
            if (i == null) {
              i = nil;
            };
            return out['$<<'](self.$at(i));}, $$121.$$s = self, $$121.$$arity = 1, $$121));
        } else {
          
          i = $coerce_to(elem, $$($nesting, 'Integer'), 'to_int');
          return out['$<<'](self.$at(i));
        };}, $$120.$$s = self, $$120.$$arity = 1, $$120));
      return out;
    }, $Array_values_at$119.$$arity = -1);
    
    Opal.def(self, '$zip', $Array_zip$122 = function $$zip($a) {
      var $iter = $Array_zip$122.$$p, block = $iter || nil, $post_args, others, self = this, $ret_or_7 = nil;

      if ($iter) $Array_zip$122.$$p = null;
      
      
      if ($iter) $Array_zip$122.$$p = null;;
      
      $post_args = Opal.slice.call(arguments, 0, arguments.length);
      
      others = $post_args;;
      
      var result = [], size = self.length, part, o, i, j, jj;

      for (j = 0, jj = others.length; j < jj; j++) {
        o = others[j];
        if (o.$$is_array) {
          continue;
        }
        if (o.$$is_range || o.$$is_enumerator) {
          others[j] = o.$take(size);
          continue;
        }
        others[j] = (function() {if ($truthy(($ret_or_7 = $$($nesting, 'Opal')['$coerce_to?'](o, $$($nesting, 'Array'), "to_ary")))) {
        return $ret_or_7
      } else {
        return $$($nesting, 'Opal')['$coerce_to!'](o, $$($nesting, 'Enumerator'), "to_enum", "each")
      }; return nil; })().$to_a();
      }

      for (i = 0; i < size; i++) {
        part = [self[i]];

        for (j = 0, jj = others.length; j < jj; j++) {
          o = others[j][i];

          if (o == null) {
            o = nil;
          }

          part[j + 1] = o;
        }

        result[i] = part;
      }

      if (block !== nil) {
        for (i = 0; i < size; i++) {
          block(result[i]);
        }

        return nil;
      }

      return result;
    ;
    }, $Array_zip$122.$$arity = -1);
    Opal.defs(self, '$inherited', $Array_inherited$123 = function $$inherited(klass) {
      var self = this;

      
      klass.$$prototype.$to_a = function() {
        return this.slice(0, this.length);
      }
    
    }, $Array_inherited$123.$$arity = 1);
    
    Opal.def(self, '$instance_variables', $Array_instance_variables$124 = function $$instance_variables() {
      var $$125, $iter = $Array_instance_variables$124.$$p, $yield = $iter || nil, self = this;

      if ($iter) $Array_instance_variables$124.$$p = null;
      return $send($send2(self, $find_super(self, 'instance_variables', $Array_instance_variables$124, false, true), 'instance_variables', [], $iter), 'reject', [], ($$125 = function(ivar){var self = $$125.$$s == null ? this : $$125.$$s, $ret_or_8 = nil;

        
        
        if (ivar == null) {
          ivar = nil;
        };
        if ($truthy(($ret_or_8 = /^@\d+$/.test(ivar)))) {
          return $ret_or_8
        } else {
          return ivar['$==']("@length")
        };}, $$125.$$s = self, $$125.$$arity = 1, $$125))
    }, $Array_instance_variables$124.$$arity = 0);
    $$($nesting, 'Opal').$pristine(self.$singleton_class(), "allocate");
    $$($nesting, 'Opal').$pristine(self, "copy_instance_variables", "initialize_dup");
    return (Opal.def(self, '$pack', $Array_pack$126 = function $$pack($a) {
      var $post_args, args, self = this;

      
      
      $post_args = Opal.slice.call(arguments, 0, arguments.length);
      
      args = $post_args;;
      return self.$raise("To use Array#pack, you must first require 'corelib/array/pack'.");
    }, $Array_pack$126.$$arity = -1), nil) && 'pack';
  })($nesting[0], Array, $nesting);
};

Opal.modules["corelib/hash"] = function(Opal) {/* Generated by Opal 1.3.0 */
  function $rb_ge(lhs, rhs) {
    return (typeof(lhs) === 'number' && typeof(rhs) === 'number') ? lhs >= rhs : lhs['$>='](rhs);
  }
  function $rb_gt(lhs, rhs) {
    return (typeof(lhs) === 'number' && typeof(rhs) === 'number') ? lhs > rhs : lhs['$>'](rhs);
  }
  function $rb_minus(lhs, rhs) {
    return (typeof(lhs) === 'number' && typeof(rhs) === 'number') ? lhs - rhs : lhs['$-'](rhs);
  }
  var self = Opal.top, $nesting = [], nil = Opal.nil, $$$ = Opal.$$$, $$ = Opal.$$, $klass = Opal.klass, $send = Opal.send, $hash2 = Opal.hash2, $truthy = Opal.truthy, $alias = Opal.alias;

  Opal.add_stubs(['$require', '$include', '$coerce_to?', '$[]', '$merge!', '$allocate', '$raise', '$coerce_to!', '$each', '$fetch', '$>=', '$>', '$==', '$compare_by_identity', '$lambda?', '$abs', '$arity', '$enum_for', '$size', '$respond_to?', '$class', '$dig', '$except!', '$dup', '$delete', '$new', '$inspect', '$map', '$to_proc', '$flatten', '$eql?', '$default', '$default_proc', '$default_proc=', '$-', '$default=', '$to_h', '$proc']);
  
  self.$require("corelib/enumerable");
  return (function($base, $super, $parent_nesting) {
    var self = $klass($base, $super, 'Hash');

    var $nesting = [self].concat($parent_nesting), $Hash_$$$1, $Hash_allocate$2, $Hash_try_convert$3, $Hash_initialize$4, $Hash_$eq_eq$5, $Hash_$gt_eq$6, $Hash_$gt$8, $Hash_$lt$9, $Hash_$lt_eq$10, $Hash_$$$11, $Hash_$$$eq$12, $Hash_assoc$13, $Hash_clear$14, $Hash_clone$15, $Hash_compact$16, $Hash_compact$excl$17, $Hash_compare_by_identity$18, $Hash_compare_by_identity$ques$19, $Hash_default$20, $Hash_default$eq$21, $Hash_default_proc$22, $Hash_default_proc$eq$23, $Hash_delete$24, $Hash_delete_if$25, $Hash_dig$27, $Hash_each$28, $Hash_each_key$30, $Hash_each_value$32, $Hash_empty$ques$34, $Hash_except$35, $Hash_except$excl$36, $Hash_fetch$38, $Hash_fetch_values$39, $Hash_flatten$41, $Hash_has_key$ques$42, $Hash_has_value$ques$43, $Hash_hash$44, $Hash_index$45, $Hash_indexes$46, $Hash_inspect$47, $Hash_invert$48, $Hash_keep_if$49, $Hash_keys$51, $Hash_length$52, $Hash_merge$53, $Hash_merge$excl$54, $Hash_rassoc$55, $Hash_rehash$56, $Hash_reject$57, $Hash_reject$excl$59, $Hash_replace$61, $Hash_select$62, $Hash_select$excl$64, $Hash_shift$66, $Hash_slice$67, $Hash_to_a$68, $Hash_to_h$69, $Hash_to_hash$70, $Hash_to_proc$71, $Hash_transform_keys$73, $Hash_transform_keys$excl$75, $Hash_transform_values$77, $Hash_transform_values$excl$79, $Hash_values$81;

    
    self.$include($$($nesting, 'Enumerable'));
    self.$$prototype.$$is_hash = true;
    Opal.defs(self, '$[]', $Hash_$$$1 = function($a) {
      var $post_args, argv, self = this;

      
      
      $post_args = Opal.slice.call(arguments, 0, arguments.length);
      
      argv = $post_args;;
      
      var hash, argc = argv.length, i;

      if (argc === 1) {
        hash = $$($nesting, 'Opal')['$coerce_to?'](argv['$[]'](0), $$($nesting, 'Hash'), "to_hash");
        if (hash !== nil) {
          return self.$allocate()['$merge!'](hash);
        }

        argv = $$($nesting, 'Opal')['$coerce_to?'](argv['$[]'](0), $$($nesting, 'Array'), "to_ary");
        if (argv === nil) {
          self.$raise($$($nesting, 'ArgumentError'), "odd number of arguments for Hash")
        }

        argc = argv.length;
        hash = self.$allocate();

        for (i = 0; i < argc; i++) {
          if (!argv[i].$$is_array) continue;
          switch(argv[i].length) {
          case 1:
            hash.$store(argv[i][0], nil);
            break;
          case 2:
            hash.$store(argv[i][0], argv[i][1]);
            break;
          default:
            self.$raise($$($nesting, 'ArgumentError'), "" + "invalid number of elements (" + (argv[i].length) + " for 1..2)")
          }
        }

        return hash;
      }

      if (argc % 2 !== 0) {
        self.$raise($$($nesting, 'ArgumentError'), "odd number of arguments for Hash")
      }

      hash = self.$allocate();

      for (i = 0; i < argc; i += 2) {
        hash.$store(argv[i], argv[i + 1]);
      }

      return hash;
    ;
    }, $Hash_$$$1.$$arity = -1);
    Opal.defs(self, '$allocate', $Hash_allocate$2 = function $$allocate() {
      var self = this;

      
      var hash = new self.$$constructor();

      Opal.hash_init(hash);

      hash.$$none = nil;
      hash.$$proc = nil;

      return hash;
    
    }, $Hash_allocate$2.$$arity = 0);
    Opal.defs(self, '$try_convert', $Hash_try_convert$3 = function $$try_convert(obj) {
      var self = this;

      return $$($nesting, 'Opal')['$coerce_to?'](obj, $$($nesting, 'Hash'), "to_hash")
    }, $Hash_try_convert$3.$$arity = 1);
    
    Opal.def(self, '$initialize', $Hash_initialize$4 = function $$initialize(defaults) {
      var $iter = $Hash_initialize$4.$$p, block = $iter || nil, self = this;

      if ($iter) $Hash_initialize$4.$$p = null;
      
      
      if ($iter) $Hash_initialize$4.$$p = null;;
      ;
      
      if (defaults !== undefined && block !== nil) {
        self.$raise($$($nesting, 'ArgumentError'), "wrong number of arguments (1 for 0)")
      }
      self.$$none = (defaults === undefined ? nil : defaults);
      self.$$proc = block;

      return self;
    ;
    }, $Hash_initialize$4.$$arity = -1);
    
    Opal.def(self, '$==', $Hash_$eq_eq$5 = function(other) {
      var self = this;

      
      if (self === other) {
        return true;
      }

      if (!other.$$is_hash) {
        return false;
      }

      if (self.$$keys.length !== other.$$keys.length) {
        return false;
      }

      for (var i = 0, keys = self.$$keys, length = keys.length, key, value, other_value; i < length; i++) {
        key = keys[i];

        if (key.$$is_string) {
          value = self.$$smap[key];
          other_value = other.$$smap[key];
        } else {
          value = key.value;
          other_value = Opal.hash_get(other, key.key);
        }

        if (other_value === undefined || !value['$eql?'](other_value)) {
          return false;
        }
      }

      return true;
    
    }, $Hash_$eq_eq$5.$$arity = 1);
    
    Opal.def(self, '$>=', $Hash_$gt_eq$6 = function(other) {
      var $$7, self = this, result = nil;

      
      other = $$($nesting, 'Opal')['$coerce_to!'](other, $$($nesting, 'Hash'), "to_hash");
      
      if (self.$$keys.length < other.$$keys.length) {
        return false
      }
    ;
      result = true;
      $send(other, 'each', [], ($$7 = function(other_key, other_val){var self = $$7.$$s == null ? this : $$7.$$s, val = nil;

        
        
        if (other_key == null) {
          other_key = nil;
        };
        
        if (other_val == null) {
          other_val = nil;
        };
        val = self.$fetch(other_key, null);
        
        if (val == null || val !== other_val) {
          result = false;
          return;
        }
      ;}, $$7.$$s = self, $$7.$$arity = 2, $$7));
      return result;
    }, $Hash_$gt_eq$6.$$arity = 1);
    
    Opal.def(self, '$>', $Hash_$gt$8 = function(other) {
      var self = this;

      
      other = $$($nesting, 'Opal')['$coerce_to!'](other, $$($nesting, 'Hash'), "to_hash");
      
      if (self.$$keys.length <= other.$$keys.length) {
        return false
      }
    ;
      return $rb_ge(self, other);
    }, $Hash_$gt$8.$$arity = 1);
    
    Opal.def(self, '$<', $Hash_$lt$9 = function(other) {
      var self = this;

      
      other = $$($nesting, 'Opal')['$coerce_to!'](other, $$($nesting, 'Hash'), "to_hash");
      return $rb_gt(other, self);
    }, $Hash_$lt$9.$$arity = 1);
    
    Opal.def(self, '$<=', $Hash_$lt_eq$10 = function(other) {
      var self = this;

      
      other = $$($nesting, 'Opal')['$coerce_to!'](other, $$($nesting, 'Hash'), "to_hash");
      return $rb_ge(other, self);
    }, $Hash_$lt_eq$10.$$arity = 1);
    
    Opal.def(self, '$[]', $Hash_$$$11 = function(key) {
      var self = this;

      
      var value = Opal.hash_get(self, key);

      if (value !== undefined) {
        return value;
      }

      return self.$default(key);
    
    }, $Hash_$$$11.$$arity = 1);
    
    Opal.def(self, '$[]=', $Hash_$$$eq$12 = function(key, value) {
      var self = this;

      
      Opal.hash_put(self, key, value);
      return value;
    
    }, $Hash_$$$eq$12.$$arity = 2);
    
    Opal.def(self, '$assoc', $Hash_assoc$13 = function $$assoc(object) {
      var self = this;

      
      for (var i = 0, keys = self.$$keys, length = keys.length, key; i < length; i++) {
        key = keys[i];

        if (key.$$is_string) {
          if ((key)['$=='](object)) {
            return [key, self.$$smap[key]];
          }
        } else {
          if ((key.key)['$=='](object)) {
            return [key.key, key.value];
          }
        }
      }

      return nil;
    
    }, $Hash_assoc$13.$$arity = 1);
    
    Opal.def(self, '$clear', $Hash_clear$14 = function $$clear() {
      var self = this;

      
      Opal.hash_init(self);
      return self;
    
    }, $Hash_clear$14.$$arity = 0);
    
    Opal.def(self, '$clone', $Hash_clone$15 = function $$clone() {
      var self = this;

      
      var hash = new self.$$class();

      Opal.hash_init(hash);
      Opal.hash_clone(self, hash);

      return hash;
    
    }, $Hash_clone$15.$$arity = 0);
    
    Opal.def(self, '$compact', $Hash_compact$16 = function $$compact() {
      var self = this;

      
      var hash = Opal.hash();

      for (var i = 0, keys = self.$$keys, length = keys.length, key, value, obj; i < length; i++) {
        key = keys[i];

        if (key.$$is_string) {
          value = self.$$smap[key];
        } else {
          value = key.value;
          key = key.key;
        }

        if (value !== nil) {
          Opal.hash_put(hash, key, value);
        }
      }

      return hash;
    
    }, $Hash_compact$16.$$arity = 0);
    
    Opal.def(self, '$compact!', $Hash_compact$excl$17 = function() {
      var self = this;

      
      var changes_were_made = false;

      for (var i = 0, keys = self.$$keys, length = keys.length, key, value, obj; i < length; i++) {
        key = keys[i];

        if (key.$$is_string) {
          value = self.$$smap[key];
        } else {
          value = key.value;
          key = key.key;
        }

        if (value === nil) {
          if (Opal.hash_delete(self, key) !== undefined) {
            changes_were_made = true;
            length--;
            i--;
          }
        }
      }

      return changes_were_made ? self : nil;
    
    }, $Hash_compact$excl$17.$$arity = 0);
    
    Opal.def(self, '$compare_by_identity', $Hash_compare_by_identity$18 = function $$compare_by_identity() {
      var self = this;

      
      var i, ii, key, keys = self.$$keys, identity_hash;

      if (self.$$by_identity) return self;
      if (self.$$keys.length === 0) {
        self.$$by_identity = true
        return self;
      }

      identity_hash = $hash2([], {}).$compare_by_identity();
      for(i = 0, ii = keys.length; i < ii; i++) {
        key = keys[i];
        if (!key.$$is_string) key = key.key;
        Opal.hash_put(identity_hash, key, Opal.hash_get(self, key));
      }

      self.$$by_identity = true;
      self.$$map = identity_hash.$$map;
      self.$$smap = identity_hash.$$smap;
      return self;
    
    }, $Hash_compare_by_identity$18.$$arity = 0);
    
    Opal.def(self, '$compare_by_identity?', $Hash_compare_by_identity$ques$19 = function() {
      var self = this;

      return self.$$by_identity === true;
    }, $Hash_compare_by_identity$ques$19.$$arity = 0);
    
    Opal.def(self, '$default', $Hash_default$20 = function(key) {
      var self = this;

      
      ;
      
      if (key !== undefined && self.$$proc !== nil && self.$$proc !== undefined) {
        return self.$$proc.$call(self, key);
      }
      if (self.$$none === undefined) {
        return nil;
      }
      return self.$$none;
    ;
    }, $Hash_default$20.$$arity = -1);
    
    Opal.def(self, '$default=', $Hash_default$eq$21 = function(object) {
      var self = this;

      
      self.$$proc = nil;
      self.$$none = object;

      return object;
    
    }, $Hash_default$eq$21.$$arity = 1);
    
    Opal.def(self, '$default_proc', $Hash_default_proc$22 = function $$default_proc() {
      var self = this;

      
      if (self.$$proc !== undefined) {
        return self.$$proc;
      }
      return nil;
    
    }, $Hash_default_proc$22.$$arity = 0);
    
    Opal.def(self, '$default_proc=', $Hash_default_proc$eq$23 = function(default_proc) {
      var self = this;

      
      var proc = default_proc;

      if (proc !== nil) {
        proc = $$($nesting, 'Opal')['$coerce_to!'](proc, $$($nesting, 'Proc'), "to_proc");

        if ((proc)['$lambda?']() && (proc).$arity().$abs() !== 2) {
          self.$raise($$($nesting, 'TypeError'), "default_proc takes two arguments");
        }
      }

      self.$$none = nil;
      self.$$proc = proc;

      return default_proc;
    
    }, $Hash_default_proc$eq$23.$$arity = 1);
    
    Opal.def(self, '$delete', $Hash_delete$24 = function(key) {
      var $iter = $Hash_delete$24.$$p, block = $iter || nil, self = this;

      if ($iter) $Hash_delete$24.$$p = null;
      
      
      if ($iter) $Hash_delete$24.$$p = null;;
      
      var value = Opal.hash_delete(self, key);

      if (value !== undefined) {
        return value;
      }

      if (block !== nil) {
        return Opal.yield1(block, key);
      }

      return nil;
    ;
    }, $Hash_delete$24.$$arity = 1);
    
    Opal.def(self, '$delete_if', $Hash_delete_if$25 = function $$delete_if() {
      var $iter = $Hash_delete_if$25.$$p, block = $iter || nil, $$26, self = this;

      if ($iter) $Hash_delete_if$25.$$p = null;
      
      
      if ($iter) $Hash_delete_if$25.$$p = null;;
      if ($truthy(block)) {
      } else {
        return $send(self, 'enum_for', ["delete_if"], ($$26 = function(){var self = $$26.$$s == null ? this : $$26.$$s;

          return self.$size()}, $$26.$$s = self, $$26.$$arity = 0, $$26))
      };
      
      for (var i = 0, keys = self.$$keys, length = keys.length, key, value, obj; i < length; i++) {
        key = keys[i];

        if (key.$$is_string) {
          value = self.$$smap[key];
        } else {
          value = key.value;
          key = key.key;
        }

        obj = block(key, value);

        if (obj !== false && obj !== nil) {
          if (Opal.hash_delete(self, key) !== undefined) {
            length--;
            i--;
          }
        }
      }

      return self;
    ;
    }, $Hash_delete_if$25.$$arity = 0);
    $alias(self, "dup", "clone");
    
    Opal.def(self, '$dig', $Hash_dig$27 = function $$dig(key, $a) {
      var $post_args, keys, self = this, item = nil;

      
      
      $post_args = Opal.slice.call(arguments, 1, arguments.length);
      
      keys = $post_args;;
      item = self['$[]'](key);
      
      if (item === nil || keys.length === 0) {
        return item;
      }
    ;
      if ($truthy(item['$respond_to?']("dig"))) {
      } else {
        self.$raise($$($nesting, 'TypeError'), "" + (item.$class()) + " does not have #dig method")
      };
      return $send(item, 'dig', Opal.to_a(keys));
    }, $Hash_dig$27.$$arity = -2);
    
    Opal.def(self, '$each', $Hash_each$28 = function $$each() {
      var $iter = $Hash_each$28.$$p, block = $iter || nil, $$29, self = this;

      if ($iter) $Hash_each$28.$$p = null;
      
      
      if ($iter) $Hash_each$28.$$p = null;;
      if ($truthy(block)) {
      } else {
        return $send(self, 'enum_for', ["each"], ($$29 = function(){var self = $$29.$$s == null ? this : $$29.$$s;

          return self.$size()}, $$29.$$s = self, $$29.$$arity = 0, $$29))
      };
      
      for (var i = 0, keys = self.$$keys, length = keys.length, key, value; i < length; i++) {
        key = keys[i];

        if (key.$$is_string) {
          value = self.$$smap[key];
        } else {
          value = key.value;
          key = key.key;
        }

        Opal.yield1(block, [key, value]);
      }

      return self;
    ;
    }, $Hash_each$28.$$arity = 0);
    
    Opal.def(self, '$each_key', $Hash_each_key$30 = function $$each_key() {
      var $iter = $Hash_each_key$30.$$p, block = $iter || nil, $$31, self = this;

      if ($iter) $Hash_each_key$30.$$p = null;
      
      
      if ($iter) $Hash_each_key$30.$$p = null;;
      if ($truthy(block)) {
      } else {
        return $send(self, 'enum_for', ["each_key"], ($$31 = function(){var self = $$31.$$s == null ? this : $$31.$$s;

          return self.$size()}, $$31.$$s = self, $$31.$$arity = 0, $$31))
      };
      
      for (var i = 0, keys = self.$$keys, length = keys.length, key; i < length; i++) {
        key = keys[i];

        block(key.$$is_string ? key : key.key);
      }

      return self;
    ;
    }, $Hash_each_key$30.$$arity = 0);
    $alias(self, "each_pair", "each");
    
    Opal.def(self, '$each_value', $Hash_each_value$32 = function $$each_value() {
      var $iter = $Hash_each_value$32.$$p, block = $iter || nil, $$33, self = this;

      if ($iter) $Hash_each_value$32.$$p = null;
      
      
      if ($iter) $Hash_each_value$32.$$p = null;;
      if ($truthy(block)) {
      } else {
        return $send(self, 'enum_for', ["each_value"], ($$33 = function(){var self = $$33.$$s == null ? this : $$33.$$s;

          return self.$size()}, $$33.$$s = self, $$33.$$arity = 0, $$33))
      };
      
      for (var i = 0, keys = self.$$keys, length = keys.length, key; i < length; i++) {
        key = keys[i];

        block(key.$$is_string ? self.$$smap[key] : key.value);
      }

      return self;
    ;
    }, $Hash_each_value$32.$$arity = 0);
    
    Opal.def(self, '$empty?', $Hash_empty$ques$34 = function() {
      var self = this;

      return self.$$keys.length === 0;
    }, $Hash_empty$ques$34.$$arity = 0);
    $alias(self, "eql?", "==");
    
    Opal.def(self, '$except', $Hash_except$35 = function $$except($a) {
      var $post_args, keys, self = this;

      
      
      $post_args = Opal.slice.call(arguments, 0, arguments.length);
      
      keys = $post_args;;
      return $send(self.$dup(), 'except!', Opal.to_a(keys));
    }, $Hash_except$35.$$arity = -1);
    
    Opal.def(self, '$except!', $Hash_except$excl$36 = function($a) {
      var $post_args, keys, $$37, self = this;

      
      
      $post_args = Opal.slice.call(arguments, 0, arguments.length);
      
      keys = $post_args;;
      $send(keys, 'each', [], ($$37 = function(key){var self = $$37.$$s == null ? this : $$37.$$s;

        
        
        if (key == null) {
          key = nil;
        };
        return self.$delete(key);}, $$37.$$s = self, $$37.$$arity = 1, $$37));
      return self;
    }, $Hash_except$excl$36.$$arity = -1);
    
    Opal.def(self, '$fetch', $Hash_fetch$38 = function $$fetch(key, defaults) {
      var $iter = $Hash_fetch$38.$$p, block = $iter || nil, self = this;

      if ($iter) $Hash_fetch$38.$$p = null;
      
      
      if ($iter) $Hash_fetch$38.$$p = null;;
      ;
      
      var value = Opal.hash_get(self, key);

      if (value !== undefined) {
        return value;
      }

      if (block !== nil) {
        return block(key);
      }

      if (defaults !== undefined) {
        return defaults;
      }
    ;
      return self.$raise($$($nesting, 'KeyError').$new("" + "key not found: " + (key.$inspect()), $hash2(["key", "receiver"], {"key": key, "receiver": self})));
    }, $Hash_fetch$38.$$arity = -2);
    
    Opal.def(self, '$fetch_values', $Hash_fetch_values$39 = function $$fetch_values($a) {
      var $iter = $Hash_fetch_values$39.$$p, block = $iter || nil, $post_args, keys, $$40, self = this;

      if ($iter) $Hash_fetch_values$39.$$p = null;
      
      
      if ($iter) $Hash_fetch_values$39.$$p = null;;
      
      $post_args = Opal.slice.call(arguments, 0, arguments.length);
      
      keys = $post_args;;
      return $send(keys, 'map', [], ($$40 = function(key){var self = $$40.$$s == null ? this : $$40.$$s;

        
        
        if (key == null) {
          key = nil;
        };
        return $send(self, 'fetch', [key], block.$to_proc());}, $$40.$$s = self, $$40.$$arity = 1, $$40));
    }, $Hash_fetch_values$39.$$arity = -1);
    
    Opal.def(self, '$flatten', $Hash_flatten$41 = function $$flatten(level) {
      var self = this;

      
      
      if (level == null) {
        level = 1;
      };
      level = $$($nesting, 'Opal')['$coerce_to!'](level, $$($nesting, 'Integer'), "to_int");
      
      var result = [];

      for (var i = 0, keys = self.$$keys, length = keys.length, key, value; i < length; i++) {
        key = keys[i];

        if (key.$$is_string) {
          value = self.$$smap[key];
        } else {
          value = key.value;
          key = key.key;
        }

        result.push(key);

        if (value.$$is_array) {
          if (level === 1) {
            result.push(value);
            continue;
          }

          result = result.concat((value).$flatten(level - 2));
          continue;
        }

        result.push(value);
      }

      return result;
    ;
    }, $Hash_flatten$41.$$arity = -1);
    
    Opal.def(self, '$has_key?', $Hash_has_key$ques$42 = function(key) {
      var self = this;

      return Opal.hash_get(self, key) !== undefined;
    }, $Hash_has_key$ques$42.$$arity = 1);
    
    Opal.def(self, '$has_value?', $Hash_has_value$ques$43 = function(value) {
      var self = this;

      
      for (var i = 0, keys = self.$$keys, length = keys.length, key; i < length; i++) {
        key = keys[i];

        if (((key.$$is_string ? self.$$smap[key] : key.value))['$=='](value)) {
          return true;
        }
      }

      return false;
    
    }, $Hash_has_value$ques$43.$$arity = 1);
    
    Opal.def(self, '$hash', $Hash_hash$44 = function $$hash() {
      var self = this;

      
      var top = (Opal.hash_ids === undefined),
          hash_id = self.$object_id(),
          result = ['Hash'],
          key, item;

      try {
        if (top) {
          Opal.hash_ids = Object.create(null);
        }

        if (Opal[hash_id]) {
          return 'self';
        }

        for (key in Opal.hash_ids) {
          item = Opal.hash_ids[key];
          if (self['$eql?'](item)) {
            return 'self';
          }
        }

        Opal.hash_ids[hash_id] = self;

        for (var i = 0, keys = self.$$keys, length = keys.length; i < length; i++) {
          key = keys[i];

          if (key.$$is_string) {
            result.push([key, self.$$smap[key].$hash()]);
          } else {
            result.push([key.key_hash, key.value.$hash()]);
          }
        }

        return result.sort().join();

      } finally {
        if (top) {
          Opal.hash_ids = undefined;
        }
      }
    
    }, $Hash_hash$44.$$arity = 0);
    $alias(self, "include?", "has_key?");
    
    Opal.def(self, '$index', $Hash_index$45 = function $$index(object) {
      var self = this;

      
      for (var i = 0, keys = self.$$keys, length = keys.length, key, value; i < length; i++) {
        key = keys[i];

        if (key.$$is_string) {
          value = self.$$smap[key];
        } else {
          value = key.value;
          key = key.key;
        }

        if ((value)['$=='](object)) {
          return key;
        }
      }

      return nil;
    
    }, $Hash_index$45.$$arity = 1);
    
    Opal.def(self, '$indexes', $Hash_indexes$46 = function $$indexes($a) {
      var $post_args, args, self = this;

      
      
      $post_args = Opal.slice.call(arguments, 0, arguments.length);
      
      args = $post_args;;
      
      var result = [];

      for (var i = 0, length = args.length, key, value; i < length; i++) {
        key = args[i];
        value = Opal.hash_get(self, key);

        if (value === undefined) {
          result.push(self.$default());
          continue;
        }

        result.push(value);
      }

      return result;
    ;
    }, $Hash_indexes$46.$$arity = -1);
    $alias(self, "indices", "indexes");
    var inspect_ids;
    
    Opal.def(self, '$inspect', $Hash_inspect$47 = function $$inspect() {
      var self = this;

      
      var top = (inspect_ids === undefined),
          hash_id = self.$object_id(),
          result = [];

      try {
        if (top) {
          inspect_ids = {};
        }

        if (inspect_ids.hasOwnProperty(hash_id)) {
          return '{...}';
        }

        inspect_ids[hash_id] = true;

        for (var i = 0, keys = self.$$keys, length = keys.length, key, value; i < length; i++) {
          key = keys[i];

          if (key.$$is_string) {
            value = self.$$smap[key];
          } else {
            value = key.value;
            key = key.key;
          }

          result.push(key.$inspect() + '=>' + value.$inspect());
        }

        return '{' + result.join(', ') + '}';

      } finally {
        if (top) {
          inspect_ids = undefined;
        }
      }
    
    }, $Hash_inspect$47.$$arity = 0);
    
    Opal.def(self, '$invert', $Hash_invert$48 = function $$invert() {
      var self = this;

      
      var hash = Opal.hash();

      for (var i = 0, keys = self.$$keys, length = keys.length, key, value; i < length; i++) {
        key = keys[i];

        if (key.$$is_string) {
          value = self.$$smap[key];
        } else {
          value = key.value;
          key = key.key;
        }

        Opal.hash_put(hash, value, key);
      }

      return hash;
    
    }, $Hash_invert$48.$$arity = 0);
    
    Opal.def(self, '$keep_if', $Hash_keep_if$49 = function $$keep_if() {
      var $iter = $Hash_keep_if$49.$$p, block = $iter || nil, $$50, self = this;

      if ($iter) $Hash_keep_if$49.$$p = null;
      
      
      if ($iter) $Hash_keep_if$49.$$p = null;;
      if ($truthy(block)) {
      } else {
        return $send(self, 'enum_for', ["keep_if"], ($$50 = function(){var self = $$50.$$s == null ? this : $$50.$$s;

          return self.$size()}, $$50.$$s = self, $$50.$$arity = 0, $$50))
      };
      
      for (var i = 0, keys = self.$$keys, length = keys.length, key, value, obj; i < length; i++) {
        key = keys[i];

        if (key.$$is_string) {
          value = self.$$smap[key];
        } else {
          value = key.value;
          key = key.key;
        }

        obj = block(key, value);

        if (obj === false || obj === nil) {
          if (Opal.hash_delete(self, key) !== undefined) {
            length--;
            i--;
          }
        }
      }

      return self;
    ;
    }, $Hash_keep_if$49.$$arity = 0);
    $alias(self, "key", "index");
    $alias(self, "key?", "has_key?");
    
    Opal.def(self, '$keys', $Hash_keys$51 = function $$keys() {
      var self = this;

      
      var result = [];

      for (var i = 0, keys = self.$$keys, length = keys.length, key; i < length; i++) {
        key = keys[i];

        if (key.$$is_string) {
          result.push(key);
        } else {
          result.push(key.key);
        }
      }

      return result;
    
    }, $Hash_keys$51.$$arity = 0);
    
    Opal.def(self, '$length', $Hash_length$52 = function $$length() {
      var self = this;

      return self.$$keys.length;
    }, $Hash_length$52.$$arity = 0);
    $alias(self, "member?", "has_key?");
    
    Opal.def(self, '$merge', $Hash_merge$53 = function $$merge($a) {
      var $iter = $Hash_merge$53.$$p, block = $iter || nil, $post_args, others, self = this;

      if ($iter) $Hash_merge$53.$$p = null;
      
      
      if ($iter) $Hash_merge$53.$$p = null;;
      
      $post_args = Opal.slice.call(arguments, 0, arguments.length);
      
      others = $post_args;;
      return $send(self.$dup(), 'merge!', Opal.to_a(others), block.$to_proc());
    }, $Hash_merge$53.$$arity = -1);
    
    Opal.def(self, '$merge!', $Hash_merge$excl$54 = function($a) {
      var $iter = $Hash_merge$excl$54.$$p, block = $iter || nil, $post_args, others, self = this;

      if ($iter) $Hash_merge$excl$54.$$p = null;
      
      
      if ($iter) $Hash_merge$excl$54.$$p = null;;
      
      $post_args = Opal.slice.call(arguments, 0, arguments.length);
      
      others = $post_args;;
      
      var i, j, other, other_keys, length, key, value, other_value;
      for (i = 0; i < others.length; ++i) {
        other = $$($nesting, 'Opal')['$coerce_to!'](others[i], $$($nesting, 'Hash'), "to_hash");
        other_keys = other.$$keys, length = other_keys.length;

        if (block === nil) {
          for (j = 0; j < length; j++) {
            key = other_keys[j];

            if (key.$$is_string) {
              other_value = other.$$smap[key];
            } else {
              other_value = key.value;
              key = key.key;
            }

            Opal.hash_put(self, key, other_value);
          }
        } else {
          for (j = 0; j < length; j++) {
            key = other_keys[j];

            if (key.$$is_string) {
              other_value = other.$$smap[key];
            } else {
              other_value = key.value;
              key = key.key;
            }

            value = Opal.hash_get(self, key);

            if (value === undefined) {
              Opal.hash_put(self, key, other_value);
              continue;
            }

            Opal.hash_put(self, key, block(key, value, other_value));
          }
        }
      }

      return self;
    ;
    }, $Hash_merge$excl$54.$$arity = -1);
    
    Opal.def(self, '$rassoc', $Hash_rassoc$55 = function $$rassoc(object) {
      var self = this;

      
      for (var i = 0, keys = self.$$keys, length = keys.length, key, value; i < length; i++) {
        key = keys[i];

        if (key.$$is_string) {
          value = self.$$smap[key];
        } else {
          value = key.value;
          key = key.key;
        }

        if ((value)['$=='](object)) {
          return [key, value];
        }
      }

      return nil;
    
    }, $Hash_rassoc$55.$$arity = 1);
    
    Opal.def(self, '$rehash', $Hash_rehash$56 = function $$rehash() {
      var self = this;

      
      Opal.hash_rehash(self);
      return self;
    
    }, $Hash_rehash$56.$$arity = 0);
    
    Opal.def(self, '$reject', $Hash_reject$57 = function $$reject() {
      var $iter = $Hash_reject$57.$$p, block = $iter || nil, $$58, self = this;

      if ($iter) $Hash_reject$57.$$p = null;
      
      
      if ($iter) $Hash_reject$57.$$p = null;;
      if ($truthy(block)) {
      } else {
        return $send(self, 'enum_for', ["reject"], ($$58 = function(){var self = $$58.$$s == null ? this : $$58.$$s;

          return self.$size()}, $$58.$$s = self, $$58.$$arity = 0, $$58))
      };
      
      var hash = Opal.hash();

      for (var i = 0, keys = self.$$keys, length = keys.length, key, value, obj; i < length; i++) {
        key = keys[i];

        if (key.$$is_string) {
          value = self.$$smap[key];
        } else {
          value = key.value;
          key = key.key;
        }

        obj = block(key, value);

        if (obj === false || obj === nil) {
          Opal.hash_put(hash, key, value);
        }
      }

      return hash;
    ;
    }, $Hash_reject$57.$$arity = 0);
    
    Opal.def(self, '$reject!', $Hash_reject$excl$59 = function() {
      var $iter = $Hash_reject$excl$59.$$p, block = $iter || nil, $$60, self = this;

      if ($iter) $Hash_reject$excl$59.$$p = null;
      
      
      if ($iter) $Hash_reject$excl$59.$$p = null;;
      if ($truthy(block)) {
      } else {
        return $send(self, 'enum_for', ["reject!"], ($$60 = function(){var self = $$60.$$s == null ? this : $$60.$$s;

          return self.$size()}, $$60.$$s = self, $$60.$$arity = 0, $$60))
      };
      
      var changes_were_made = false;

      for (var i = 0, keys = self.$$keys, length = keys.length, key, value, obj; i < length; i++) {
        key = keys[i];

        if (key.$$is_string) {
          value = self.$$smap[key];
        } else {
          value = key.value;
          key = key.key;
        }

        obj = block(key, value);

        if (obj !== false && obj !== nil) {
          if (Opal.hash_delete(self, key) !== undefined) {
            changes_were_made = true;
            length--;
            i--;
          }
        }
      }

      return changes_were_made ? self : nil;
    ;
    }, $Hash_reject$excl$59.$$arity = 0);
    
    Opal.def(self, '$replace', $Hash_replace$61 = function $$replace(other) {
      var self = this, $writer = nil;

      
      other = $$($nesting, 'Opal')['$coerce_to!'](other, $$($nesting, 'Hash'), "to_hash");
      
      Opal.hash_init(self);

      for (var i = 0, other_keys = other.$$keys, length = other_keys.length, key, value, other_value; i < length; i++) {
        key = other_keys[i];

        if (key.$$is_string) {
          other_value = other.$$smap[key];
        } else {
          other_value = key.value;
          key = key.key;
        }

        Opal.hash_put(self, key, other_value);
      }
    ;
      if ($truthy(other.$default_proc())) {
        
        $writer = [other.$default_proc()];
        $send(self, 'default_proc=', Opal.to_a($writer));
        $writer[$rb_minus($writer["length"], 1)];
      } else {
        
        $writer = [other.$default()];
        $send(self, 'default=', Opal.to_a($writer));
        $writer[$rb_minus($writer["length"], 1)];
      };
      return self;
    }, $Hash_replace$61.$$arity = 1);
    
    Opal.def(self, '$select', $Hash_select$62 = function $$select() {
      var $iter = $Hash_select$62.$$p, block = $iter || nil, $$63, self = this;

      if ($iter) $Hash_select$62.$$p = null;
      
      
      if ($iter) $Hash_select$62.$$p = null;;
      if ($truthy(block)) {
      } else {
        return $send(self, 'enum_for', ["select"], ($$63 = function(){var self = $$63.$$s == null ? this : $$63.$$s;

          return self.$size()}, $$63.$$s = self, $$63.$$arity = 0, $$63))
      };
      
      var hash = Opal.hash();

      for (var i = 0, keys = self.$$keys, length = keys.length, key, value, obj; i < length; i++) {
        key = keys[i];

        if (key.$$is_string) {
          value = self.$$smap[key];
        } else {
          value = key.value;
          key = key.key;
        }

        obj = block(key, value);

        if (obj !== false && obj !== nil) {
          Opal.hash_put(hash, key, value);
        }
      }

      return hash;
    ;
    }, $Hash_select$62.$$arity = 0);
    
    Opal.def(self, '$select!', $Hash_select$excl$64 = function() {
      var $iter = $Hash_select$excl$64.$$p, block = $iter || nil, $$65, self = this;

      if ($iter) $Hash_select$excl$64.$$p = null;
      
      
      if ($iter) $Hash_select$excl$64.$$p = null;;
      if ($truthy(block)) {
      } else {
        return $send(self, 'enum_for', ["select!"], ($$65 = function(){var self = $$65.$$s == null ? this : $$65.$$s;

          return self.$size()}, $$65.$$s = self, $$65.$$arity = 0, $$65))
      };
      
      var result = nil;

      for (var i = 0, keys = self.$$keys, length = keys.length, key, value, obj; i < length; i++) {
        key = keys[i];

        if (key.$$is_string) {
          value = self.$$smap[key];
        } else {
          value = key.value;
          key = key.key;
        }

        obj = block(key, value);

        if (obj === false || obj === nil) {
          if (Opal.hash_delete(self, key) !== undefined) {
            length--;
            i--;
          }
          result = self;
        }
      }

      return result;
    ;
    }, $Hash_select$excl$64.$$arity = 0);
    $alias(self, "filter", "select");
    $alias(self, "filter!", "select!");
    
    Opal.def(self, '$shift', $Hash_shift$66 = function $$shift() {
      var self = this;

      
      var keys = self.$$keys,
          key;

      if (keys.length > 0) {
        key = keys[0];

        key = key.$$is_string ? key : key.key;

        return [key, Opal.hash_delete(self, key)];
      }

      return self.$default(nil);
    
    }, $Hash_shift$66.$$arity = 0);
    $alias(self, "size", "length");
    
    Opal.def(self, '$slice', $Hash_slice$67 = function $$slice($a) {
      var $post_args, keys, self = this;

      
      
      $post_args = Opal.slice.call(arguments, 0, arguments.length);
      
      keys = $post_args;;
      
      var result = Opal.hash();

      for (var i = 0, length = keys.length; i < length; i++) {
        var key = keys[i], value = Opal.hash_get(self, key);

        if (value !== undefined) {
          Opal.hash_put(result, key, value);
        }
      }

      return result;
    ;
    }, $Hash_slice$67.$$arity = -1);
    $alias(self, "store", "[]=");
    
    Opal.def(self, '$to_a', $Hash_to_a$68 = function $$to_a() {
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

        result.push([key, value]);
      }

      return result;
    
    }, $Hash_to_a$68.$$arity = 0);
    
    Opal.def(self, '$to_h', $Hash_to_h$69 = function $$to_h() {
      var $iter = $Hash_to_h$69.$$p, block = $iter || nil, self = this;

      if ($iter) $Hash_to_h$69.$$p = null;
      
      
      if ($iter) $Hash_to_h$69.$$p = null;;
      if ((block !== nil)) {
        return $send(self, 'map', [], block.$to_proc()).$to_h()};
      
      if (self.$$class === Opal.Hash) {
        return self;
      }

      var hash = new Opal.Hash();

      Opal.hash_init(hash);
      Opal.hash_clone(self, hash);

      return hash;
    ;
    }, $Hash_to_h$69.$$arity = 0);
    
    Opal.def(self, '$to_hash', $Hash_to_hash$70 = function $$to_hash() {
      var self = this;

      return self
    }, $Hash_to_hash$70.$$arity = 0);
    
    Opal.def(self, '$to_proc', $Hash_to_proc$71 = function $$to_proc() {
      var $$72, self = this;

      return $send(self, 'proc', [], ($$72 = function(key){var self = $$72.$$s == null ? this : $$72.$$s;

        
        ;
        
        if (key == null) {
          self.$raise($$($nesting, 'ArgumentError'), "no key given")
        }
      ;
        return self['$[]'](key);}, $$72.$$s = self, $$72.$$arity = -1, $$72))
    }, $Hash_to_proc$71.$$arity = 0);
    $alias(self, "to_s", "inspect");
    
    Opal.def(self, '$transform_keys', $Hash_transform_keys$73 = function $$transform_keys() {
      var $iter = $Hash_transform_keys$73.$$p, block = $iter || nil, $$74, self = this;

      if ($iter) $Hash_transform_keys$73.$$p = null;
      
      
      if ($iter) $Hash_transform_keys$73.$$p = null;;
      if ($truthy(block)) {
      } else {
        return $send(self, 'enum_for', ["transform_keys"], ($$74 = function(){var self = $$74.$$s == null ? this : $$74.$$s;

          return self.$size()}, $$74.$$s = self, $$74.$$arity = 0, $$74))
      };
      
      var result = Opal.hash();

      for (var i = 0, keys = self.$$keys, length = keys.length, key, value; i < length; i++) {
        key = keys[i];

        if (key.$$is_string) {
          value = self.$$smap[key];
        } else {
          value = key.value;
          key = key.key;
        }

        key = Opal.yield1(block, key);

        Opal.hash_put(result, key, value);
      }

      return result;
    ;
    }, $Hash_transform_keys$73.$$arity = 0);
    
    Opal.def(self, '$transform_keys!', $Hash_transform_keys$excl$75 = function() {
      var $iter = $Hash_transform_keys$excl$75.$$p, block = $iter || nil, $$76, self = this;

      if ($iter) $Hash_transform_keys$excl$75.$$p = null;
      
      
      if ($iter) $Hash_transform_keys$excl$75.$$p = null;;
      if ($truthy(block)) {
      } else {
        return $send(self, 'enum_for', ["transform_keys!"], ($$76 = function(){var self = $$76.$$s == null ? this : $$76.$$s;

          return self.$size()}, $$76.$$s = self, $$76.$$arity = 0, $$76))
      };
      
      var keys = Opal.slice.call(self.$$keys),
          i, length = keys.length, key, value, new_key;

      for (i = 0; i < length; i++) {
        key = keys[i];

        if (key.$$is_string) {
          value = self.$$smap[key];
        } else {
          value = key.value;
          key = key.key;
        }

        new_key = Opal.yield1(block, key);

        Opal.hash_delete(self, key);
        Opal.hash_put(self, new_key, value);
      }

      return self;
    ;
    }, $Hash_transform_keys$excl$75.$$arity = 0);
    
    Opal.def(self, '$transform_values', $Hash_transform_values$77 = function $$transform_values() {
      var $iter = $Hash_transform_values$77.$$p, block = $iter || nil, $$78, self = this;

      if ($iter) $Hash_transform_values$77.$$p = null;
      
      
      if ($iter) $Hash_transform_values$77.$$p = null;;
      if ($truthy(block)) {
      } else {
        return $send(self, 'enum_for', ["transform_values"], ($$78 = function(){var self = $$78.$$s == null ? this : $$78.$$s;

          return self.$size()}, $$78.$$s = self, $$78.$$arity = 0, $$78))
      };
      
      var result = Opal.hash();

      for (var i = 0, keys = self.$$keys, length = keys.length, key, value; i < length; i++) {
        key = keys[i];

        if (key.$$is_string) {
          value = self.$$smap[key];
        } else {
          value = key.value;
          key = key.key;
        }

        value = Opal.yield1(block, value);

        Opal.hash_put(result, key, value);
      }

      return result;
    ;
    }, $Hash_transform_values$77.$$arity = 0);
    
    Opal.def(self, '$transform_values!', $Hash_transform_values$excl$79 = function() {
      var $iter = $Hash_transform_values$excl$79.$$p, block = $iter || nil, $$80, self = this;

      if ($iter) $Hash_transform_values$excl$79.$$p = null;
      
      
      if ($iter) $Hash_transform_values$excl$79.$$p = null;;
      if ($truthy(block)) {
      } else {
        return $send(self, 'enum_for', ["transform_values!"], ($$80 = function(){var self = $$80.$$s == null ? this : $$80.$$s;

          return self.$size()}, $$80.$$s = self, $$80.$$arity = 0, $$80))
      };
      
      for (var i = 0, keys = self.$$keys, length = keys.length, key, value; i < length; i++) {
        key = keys[i];

        if (key.$$is_string) {
          value = self.$$smap[key];
        } else {
          value = key.value;
          key = key.key;
        }

        value = Opal.yield1(block, value);

        Opal.hash_put(self, key, value);
      }

      return self;
    ;
    }, $Hash_transform_values$excl$79.$$arity = 0);
    $alias(self, "update", "merge!");
    $alias(self, "value?", "has_value?");
    $alias(self, "values_at", "indexes");
    return (Opal.def(self, '$values', $Hash_values$81 = function $$values() {
      var self = this;

      
      var result = [];

      for (var i = 0, keys = self.$$keys, length = keys.length, key; i < length; i++) {
        key = keys[i];

        if (key.$$is_string) {
          result.push(self.$$smap[key]);
        } else {
          result.push(key.value);
        }
      }

      return result;
    
    }, $Hash_values$81.$$arity = 0), nil) && 'values';
  })($nesting[0], null, $nesting);
};

Opal.modules["corelib/number"] = function(Opal) {/* Generated by Opal 1.3.0 */
  function $rb_gt(lhs, rhs) {
    return (typeof(lhs) === 'number' && typeof(rhs) === 'number') ? lhs > rhs : lhs['$>'](rhs);
  }
  function $rb_lt(lhs, rhs) {
    return (typeof(lhs) === 'number' && typeof(rhs) === 'number') ? lhs < rhs : lhs['$<'](rhs);
  }
  function $rb_plus(lhs, rhs) {
    return (typeof(lhs) === 'number' && typeof(rhs) === 'number') ? lhs + rhs : lhs['$+'](rhs);
  }
  function $rb_minus(lhs, rhs) {
    return (typeof(lhs) === 'number' && typeof(rhs) === 'number') ? lhs - rhs : lhs['$-'](rhs);
  }
  function $rb_divide(lhs, rhs) {
    return (typeof(lhs) === 'number' && typeof(rhs) === 'number') ? lhs / rhs : lhs['$/'](rhs);
  }
  function $rb_times(lhs, rhs) {
    return (typeof(lhs) === 'number' && typeof(rhs) === 'number') ? lhs * rhs : lhs['$*'](rhs);
  }
  function $rb_le(lhs, rhs) {
    return (typeof(lhs) === 'number' && typeof(rhs) === 'number') ? lhs <= rhs : lhs['$<='](rhs);
  }
  function $rb_ge(lhs, rhs) {
    return (typeof(lhs) === 'number' && typeof(rhs) === 'number') ? lhs >= rhs : lhs['$>='](rhs);
  }
  var self = Opal.top, $nesting = [], nil = Opal.nil, $$$ = Opal.$$$, $$ = Opal.$$, $klass = Opal.klass, $alias = Opal.alias, $truthy = Opal.truthy, $send2 = Opal.send2, $find_super = Opal.find_super, $send = Opal.send;

  Opal.add_stubs(['$require', '$bridge', '$raise', '$name', '$class', '$Float', '$respond_to?', '$coerce_to!', '$__coerced__', '$===', '$!', '$>', '$**', '$new', '$<', '$to_f', '$==', '$nan?', '$infinite?', '$enum_for', '$+', '$-', '$gcd', '$lcm', '$%', '$/', '$frexp', '$to_i', '$ldexp', '$rationalize', '$*', '$<<', '$to_r', '$truncate', '$-@', '$size', '$<=', '$>=', '$inspect']);
  
  self.$require("corelib/numeric");
  (function($base, $super, $parent_nesting) {
    var self = $klass($base, $super, 'Number');

    var $nesting = [self].concat($parent_nesting), $Number_coerce$2, $Number___id__$3, $Number_$plus$4, $Number_$minus$5, $Number_$$6, $Number_$slash$7, $Number_$percent$8, $Number_$$9, $Number_$$10, $Number_$$11, $Number_$lt$12, $Number_$lt_eq$13, $Number_$gt$14, $Number_$gt_eq$15, $Number_$lt_eq_gt$16, $Number_$lt$lt$17, $Number_$gt$gt$18, $Number_$$$19, $Number_$plus$$20, $Number_$minus$$21, $Number_$$22, $Number_$$$23, $Number_$eq_eq_eq$24, $Number_$eq_eq$25, $Number_abs$26, $Number_abs2$27, $Number_allbits$ques$28, $Number_anybits$ques$29, $Number_angle$30, $Number_bit_length$31, $Number_ceil$32, $Number_chr$33, $Number_denominator$34, $Number_downto$35, $Number_equal$ques$37, $Number_even$ques$38, $Number_floor$39, $Number_gcd$40, $Number_gcdlcm$41, $Number_integer$ques$42, $Number_is_a$ques$43, $Number_instance_of$ques$44, $Number_lcm$45, $Number_next$46, $Number_nobits$ques$47, $Number_nonzero$ques$48, $Number_numerator$49, $Number_odd$ques$50, $Number_ord$51, $Number_pow$52, $Number_pred$53, $Number_quo$54, $Number_rationalize$55, $Number_remainder$56, $Number_round$57, $Number_times$58, $Number_to_f$60, $Number_to_i$61, $Number_to_r$62, $Number_to_s$63, $Number_truncate$64, $Number_digits$65, $Number_divmod$66, $Number_upto$67, $Number_zero$ques$69, $Number_size$70, $Number_nan$ques$71, $Number_finite$ques$72, $Number_infinite$ques$73, $Number_positive$ques$74, $Number_negative$ques$75;

    
    $$($nesting, 'Opal').$bridge(Number, self);
    Opal.defineProperty(self.$$prototype, '$$is_number', true);
    self.$$is_number_class = true;
    (function(self, $parent_nesting) {
      var $nesting = [self].concat($parent_nesting), $allocate$1;

      
      
      Opal.def(self, '$allocate', $allocate$1 = function $$allocate() {
        var self = this;

        return self.$raise($$($nesting, 'TypeError'), "" + "allocator undefined for " + (self.$name()))
      }, $allocate$1.$$arity = 0);
      
      
      Opal.udef(self, '$' + "new");;
      return nil;;
    })(Opal.get_singleton_class(self), $nesting);
    
    Opal.def(self, '$coerce', $Number_coerce$2 = function $$coerce(other) {
      var self = this;

      
      if (other === nil) {
        self.$raise($$($nesting, 'TypeError'), "" + "can't convert " + (other.$class()) + " into Float");
      }
      else if (other.$$is_string) {
        return [self.$Float(other), self];
      }
      else if (other['$respond_to?']("to_f")) {
        return [$$($nesting, 'Opal')['$coerce_to!'](other, $$($nesting, 'Float'), "to_f"), self];
      }
      else if (other.$$is_number) {
        return [other, self];
      }
      else {
        self.$raise($$($nesting, 'TypeError'), "" + "can't convert " + (other.$class()) + " into Float");
      }
    
    }, $Number_coerce$2.$$arity = 1);
    
    Opal.def(self, '$__id__', $Number___id__$3 = function $$__id__() {
      var self = this;

      return (self * 2) + 1;
    }, $Number___id__$3.$$arity = 0);
    $alias(self, "object_id", "__id__");
    
    Opal.def(self, '$+', $Number_$plus$4 = function(other) {
      var self = this;

      
      if (other.$$is_number) {
        return self + other;
      }
      else {
        return self.$__coerced__("+", other);
      }
    
    }, $Number_$plus$4.$$arity = 1);
    
    Opal.def(self, '$-', $Number_$minus$5 = function(other) {
      var self = this;

      
      if (other.$$is_number) {
        return self - other;
      }
      else {
        return self.$__coerced__("-", other);
      }
    
    }, $Number_$minus$5.$$arity = 1);
    
    Opal.def(self, '$*', $Number_$$6 = function(other) {
      var self = this;

      
      if (other.$$is_number) {
        return self * other;
      }
      else {
        return self.$__coerced__("*", other);
      }
    
    }, $Number_$$6.$$arity = 1);
    
    Opal.def(self, '$/', $Number_$slash$7 = function(other) {
      var self = this;

      
      if (other.$$is_number) {
        return self / other;
      }
      else {
        return self.$__coerced__("/", other);
      }
    
    }, $Number_$slash$7.$$arity = 1);
    $alias(self, "fdiv", "/");
    
    Opal.def(self, '$%', $Number_$percent$8 = function(other) {
      var self = this;

      
      if (other.$$is_number) {
        if (other == -Infinity) {
          return other;
        }
        else if (other == 0) {
          self.$raise($$($nesting, 'ZeroDivisionError'), "divided by 0");
        }
        else if (other < 0 || self < 0) {
          return (self % other + other) % other;
        }
        else {
          return self % other;
        }
      }
      else {
        return self.$__coerced__("%", other);
      }
    
    }, $Number_$percent$8.$$arity = 1);
    
    Opal.def(self, '$&', $Number_$$9 = function(other) {
      var self = this;

      
      if (other.$$is_number) {
        return self & other;
      }
      else {
        return self.$__coerced__("&", other);
      }
    
    }, $Number_$$9.$$arity = 1);
    
    Opal.def(self, '$|', $Number_$$10 = function(other) {
      var self = this;

      
      if (other.$$is_number) {
        return self | other;
      }
      else {
        return self.$__coerced__("|", other);
      }
    
    }, $Number_$$10.$$arity = 1);
    
    Opal.def(self, '$^', $Number_$$11 = function(other) {
      var self = this;

      
      if (other.$$is_number) {
        return self ^ other;
      }
      else {
        return self.$__coerced__("^", other);
      }
    
    }, $Number_$$11.$$arity = 1);
    
    Opal.def(self, '$<', $Number_$lt$12 = function(other) {
      var self = this;

      
      if (other.$$is_number) {
        return self < other;
      }
      else {
        return self.$__coerced__("<", other);
      }
    
    }, $Number_$lt$12.$$arity = 1);
    
    Opal.def(self, '$<=', $Number_$lt_eq$13 = function(other) {
      var self = this;

      
      if (other.$$is_number) {
        return self <= other;
      }
      else {
        return self.$__coerced__("<=", other);
      }
    
    }, $Number_$lt_eq$13.$$arity = 1);
    
    Opal.def(self, '$>', $Number_$gt$14 = function(other) {
      var self = this;

      
      if (other.$$is_number) {
        return self > other;
      }
      else {
        return self.$__coerced__(">", other);
      }
    
    }, $Number_$gt$14.$$arity = 1);
    
    Opal.def(self, '$>=', $Number_$gt_eq$15 = function(other) {
      var self = this;

      
      if (other.$$is_number) {
        return self >= other;
      }
      else {
        return self.$__coerced__(">=", other);
      }
    
    }, $Number_$gt_eq$15.$$arity = 1);
    
    var spaceship_operator = function(self, other) {
      if (other.$$is_number) {
        if (isNaN(self) || isNaN(other)) {
          return nil;
        }

        if (self > other) {
          return 1;
        } else if (self < other) {
          return -1;
        } else {
          return 0;
        }
      }
      else {
        return self.$__coerced__("<=>", other);
      }
    }
  ;
    
    Opal.def(self, '$<=>', $Number_$lt_eq_gt$16 = function(other) {
      var self = this;

      try {
        return spaceship_operator(self, other);
      } catch ($err) {
        if (Opal.rescue($err, [$$($nesting, 'ArgumentError')])) {
          try {
            return nil
          } finally { Opal.pop_exception(); }
        } else { throw $err; }
      }
    }, $Number_$lt_eq_gt$16.$$arity = 1);
    
    Opal.def(self, '$<<', $Number_$lt$lt$17 = function(count) {
      var self = this;

      
      count = $$($nesting, 'Opal')['$coerce_to!'](count, $$($nesting, 'Integer'), "to_int");
      return count > 0 ? self << count : self >> -count;
    }, $Number_$lt$lt$17.$$arity = 1);
    
    Opal.def(self, '$>>', $Number_$gt$gt$18 = function(count) {
      var self = this;

      
      count = $$($nesting, 'Opal')['$coerce_to!'](count, $$($nesting, 'Integer'), "to_int");
      return count > 0 ? self >> count : self << -count;
    }, $Number_$gt$gt$18.$$arity = 1);
    
    Opal.def(self, '$[]', $Number_$$$19 = function(bit) {
      var self = this;

      
      bit = $$($nesting, 'Opal')['$coerce_to!'](bit, $$($nesting, 'Integer'), "to_int");
      
      if (bit < 0) {
        return 0;
      }
      if (bit >= 32) {
        return self < 0 ? 1 : 0;
      }
      return (self >> bit) & 1;
    ;
    }, $Number_$$$19.$$arity = 1);
    
    Opal.def(self, '$+@', $Number_$plus$$20 = function() {
      var self = this;

      return +self;
    }, $Number_$plus$$20.$$arity = 0);
    
    Opal.def(self, '$-@', $Number_$minus$$21 = function() {
      var self = this;

      return -self;
    }, $Number_$minus$$21.$$arity = 0);
    
    Opal.def(self, '$~', $Number_$$22 = function() {
      var self = this;

      return ~self;
    }, $Number_$$22.$$arity = 0);
    
    Opal.def(self, '$**', $Number_$$$23 = function(other) {
      var self = this, $ret_or_1 = nil, $ret_or_2 = nil, $ret_or_3 = nil;

      if ($truthy($$($nesting, 'Integer')['$==='](other))) {
        if ($truthy((function() {if ($truthy(($ret_or_1 = $$($nesting, 'Integer')['$==='](self)['$!']()))) {
          return $ret_or_1
        } else {
          return $rb_gt(other, 0)
        }; return nil; })())) {
          return Math.pow(self, other);
        } else {
          return $$($nesting, 'Rational').$new(self, 1)['$**'](other)
        }
      } else if ($truthy((function() {if ($truthy(($ret_or_2 = $rb_lt(self, 0)))) {
        
        if ($truthy(($ret_or_3 = $$($nesting, 'Float')['$==='](other)))) {
          return $ret_or_3
        } else {
          return $$($nesting, 'Rational')['$==='](other)
        };
      } else {
        return $ret_or_2
      }; return nil; })())) {
        return $$($nesting, 'Complex').$new(self, 0)['$**'](other.$to_f())
      } else if ($truthy(other.$$is_number != null)) {
        return Math.pow(self, other);
      } else {
        return self.$__coerced__("**", other)
      }
    }, $Number_$$$23.$$arity = 1);
    
    Opal.def(self, '$===', $Number_$eq_eq_eq$24 = function(other) {
      var self = this;

      
      if (other.$$is_number) {
        return self.valueOf() === other.valueOf();
      }
      else if (other['$respond_to?']("==")) {
        return other['$=='](self);
      }
      else {
        return false;
      }
    
    }, $Number_$eq_eq_eq$24.$$arity = 1);
    
    Opal.def(self, '$==', $Number_$eq_eq$25 = function(other) {
      var self = this;

      
      if (other.$$is_number) {
        return self.valueOf() === other.valueOf();
      }
      else if (other['$respond_to?']("==")) {
        return other['$=='](self);
      }
      else {
        return false;
      }
    
    }, $Number_$eq_eq$25.$$arity = 1);
    
    Opal.def(self, '$abs', $Number_abs$26 = function $$abs() {
      var self = this;

      return Math.abs(self);
    }, $Number_abs$26.$$arity = 0);
    
    Opal.def(self, '$abs2', $Number_abs2$27 = function $$abs2() {
      var self = this;

      return Math.abs(self * self);
    }, $Number_abs2$27.$$arity = 0);
    
    Opal.def(self, '$allbits?', $Number_allbits$ques$28 = function(mask) {
      var self = this;

      
      mask = $$($nesting, 'Opal')['$coerce_to!'](mask, $$($nesting, 'Integer'), "to_int");
      return (self & mask) == mask;;
    }, $Number_allbits$ques$28.$$arity = 1);
    
    Opal.def(self, '$anybits?', $Number_anybits$ques$29 = function(mask) {
      var self = this;

      
      mask = $$($nesting, 'Opal')['$coerce_to!'](mask, $$($nesting, 'Integer'), "to_int");
      return (self & mask) !== 0;;
    }, $Number_anybits$ques$29.$$arity = 1);
    
    Opal.def(self, '$angle', $Number_angle$30 = function $$angle() {
      var self = this;

      
      if ($truthy(self['$nan?']())) {
        return self};
      
      if (self == 0) {
        if (1 / self > 0) {
          return 0;
        }
        else {
          return Math.PI;
        }
      }
      else if (self < 0) {
        return Math.PI;
      }
      else {
        return 0;
      }
    ;
    }, $Number_angle$30.$$arity = 0);
    $alias(self, "arg", "angle");
    $alias(self, "phase", "angle");
    
    Opal.def(self, '$bit_length', $Number_bit_length$31 = function $$bit_length() {
      var self = this;

      
      if ($truthy($$($nesting, 'Integer')['$==='](self))) {
      } else {
        self.$raise($$($nesting, 'NoMethodError').$new("" + "undefined method `bit_length` for " + (self) + ":Float", "bit_length"))
      };
      
      if (self === 0 || self === -1) {
        return 0;
      }

      var result = 0,
          value  = self < 0 ? ~self : self;

      while (value != 0) {
        result   += 1;
        value  >>>= 1;
      }

      return result;
    ;
    }, $Number_bit_length$31.$$arity = 0);
    
    Opal.def(self, '$ceil', $Number_ceil$32 = function $$ceil(ndigits) {
      var self = this;

      
      
      if (ndigits == null) {
        ndigits = 0;
      };
      
      var f = self.$to_f();

      if (f % 1 === 0 && ndigits >= 0) {
        return f;
      }

      var factor = Math.pow(10, ndigits),
          result = Math.ceil(f * factor) / factor;

      if (f % 1 === 0) {
        result = Math.round(result);
      }

      return result;
    ;
    }, $Number_ceil$32.$$arity = -1);
    
    Opal.def(self, '$chr', $Number_chr$33 = function $$chr(encoding) {
      var self = this;

      
      ;
      return Opal.enc(String.fromCharCode(self), encoding || "BINARY");;
    }, $Number_chr$33.$$arity = -1);
    
    Opal.def(self, '$denominator', $Number_denominator$34 = function $$denominator() {
      var $iter = $Number_denominator$34.$$p, $yield = $iter || nil, self = this, $ret_or_4 = nil;

      if ($iter) $Number_denominator$34.$$p = null;
      if ($truthy((function() {if ($truthy(($ret_or_4 = self['$nan?']()))) {
        return $ret_or_4
      } else {
        return self['$infinite?']()
      }; return nil; })())) {
        return 1
      } else {
        return $send2(self, $find_super(self, 'denominator', $Number_denominator$34, false, true), 'denominator', [], $iter)
      }
    }, $Number_denominator$34.$$arity = 0);
    
    Opal.def(self, '$downto', $Number_downto$35 = function $$downto(stop) {
      var $iter = $Number_downto$35.$$p, block = $iter || nil, $$36, self = this;

      if ($iter) $Number_downto$35.$$p = null;
      
      
      if ($iter) $Number_downto$35.$$p = null;;
      if ((block !== nil)) {
      } else {
        return $send(self, 'enum_for', ["downto", stop], ($$36 = function(){var self = $$36.$$s == null ? this : $$36.$$s;

          
          if ($truthy($$($nesting, 'Numeric')['$==='](stop))) {
          } else {
            self.$raise($$($nesting, 'ArgumentError'), "" + "comparison of " + (self.$class()) + " with " + (stop.$class()) + " failed")
          };
          if ($truthy($rb_gt(stop, self))) {
            return 0
          } else {
            return $rb_plus($rb_minus(self, stop), 1)
          };}, $$36.$$s = self, $$36.$$arity = 0, $$36))
      };
      
      if (!stop.$$is_number) {
        self.$raise($$($nesting, 'ArgumentError'), "" + "comparison of " + (self.$class()) + " with " + (stop.$class()) + " failed")
      }
      for (var i = self; i >= stop; i--) {
        block(i);
      }
    ;
      return self;
    }, $Number_downto$35.$$arity = 1);
    $alias(self, "eql?", "==");
    
    Opal.def(self, '$equal?', $Number_equal$ques$37 = function(other) {
      var self = this, $ret_or_5 = nil;

      if ($truthy(($ret_or_5 = self['$=='](other)))) {
        return $ret_or_5
      } else {
        return isNaN(self) && isNaN(other);
      }
    }, $Number_equal$ques$37.$$arity = 1);
    
    Opal.def(self, '$even?', $Number_even$ques$38 = function() {
      var self = this;

      return self % 2 === 0;
    }, $Number_even$ques$38.$$arity = 0);
    
    Opal.def(self, '$floor', $Number_floor$39 = function $$floor(ndigits) {
      var self = this;

      
      
      if (ndigits == null) {
        ndigits = 0;
      };
      
      var f = self.$to_f();

      if (f % 1 === 0 && ndigits >= 0) {
        return f;
      }

      var factor = Math.pow(10, ndigits),
          result = Math.floor(f * factor) / factor;

      if (f % 1 === 0) {
        result = Math.round(result);
      }

      return result;
    ;
    }, $Number_floor$39.$$arity = -1);
    
    Opal.def(self, '$gcd', $Number_gcd$40 = function $$gcd(other) {
      var self = this;

      
      if ($truthy($$($nesting, 'Integer')['$==='](other))) {
      } else {
        self.$raise($$($nesting, 'TypeError'), "not an integer")
      };
      
      var min = Math.abs(self),
          max = Math.abs(other);

      while (min > 0) {
        var tmp = min;

        min = max % min;
        max = tmp;
      }

      return max;
    ;
    }, $Number_gcd$40.$$arity = 1);
    
    Opal.def(self, '$gcdlcm', $Number_gcdlcm$41 = function $$gcdlcm(other) {
      var self = this;

      return [self.$gcd(other), self.$lcm(other)]
    }, $Number_gcdlcm$41.$$arity = 1);
    
    Opal.def(self, '$integer?', $Number_integer$ques$42 = function() {
      var self = this;

      return self % 1 === 0;
    }, $Number_integer$ques$42.$$arity = 0);
    
    Opal.def(self, '$is_a?', $Number_is_a$ques$43 = function(klass) {
      var $iter = $Number_is_a$ques$43.$$p, $yield = $iter || nil, self = this, $ret_or_6 = nil, $ret_or_7 = nil, $ret_or_8 = nil;

      if ($iter) $Number_is_a$ques$43.$$p = null;
      
      if ($truthy((function() {if ($truthy(($ret_or_6 = klass['$==']($$($nesting, 'Integer'))))) {
        return $$($nesting, 'Integer')['$==='](self)
      } else {
        return $ret_or_6
      }; return nil; })())) {
        return true};
      if ($truthy((function() {if ($truthy(($ret_or_7 = klass['$==']($$($nesting, 'Integer'))))) {
        return $$($nesting, 'Integer')['$==='](self)
      } else {
        return $ret_or_7
      }; return nil; })())) {
        return true};
      if ($truthy((function() {if ($truthy(($ret_or_8 = klass['$==']($$($nesting, 'Float'))))) {
        return $$($nesting, 'Float')['$==='](self)
      } else {
        return $ret_or_8
      }; return nil; })())) {
        return true};
      return $send2(self, $find_super(self, 'is_a?', $Number_is_a$ques$43, false, true), 'is_a?', [klass], $iter);
    }, $Number_is_a$ques$43.$$arity = 1);
    $alias(self, "kind_of?", "is_a?");
    
    Opal.def(self, '$instance_of?', $Number_instance_of$ques$44 = function(klass) {
      var $iter = $Number_instance_of$ques$44.$$p, $yield = $iter || nil, self = this, $ret_or_9 = nil, $ret_or_10 = nil, $ret_or_11 = nil;

      if ($iter) $Number_instance_of$ques$44.$$p = null;
      
      if ($truthy((function() {if ($truthy(($ret_or_9 = klass['$==']($$($nesting, 'Integer'))))) {
        return $$($nesting, 'Integer')['$==='](self)
      } else {
        return $ret_or_9
      }; return nil; })())) {
        return true};
      if ($truthy((function() {if ($truthy(($ret_or_10 = klass['$==']($$($nesting, 'Integer'))))) {
        return $$($nesting, 'Integer')['$==='](self)
      } else {
        return $ret_or_10
      }; return nil; })())) {
        return true};
      if ($truthy((function() {if ($truthy(($ret_or_11 = klass['$==']($$($nesting, 'Float'))))) {
        return $$($nesting, 'Float')['$==='](self)
      } else {
        return $ret_or_11
      }; return nil; })())) {
        return true};
      return $send2(self, $find_super(self, 'instance_of?', $Number_instance_of$ques$44, false, true), 'instance_of?', [klass], $iter);
    }, $Number_instance_of$ques$44.$$arity = 1);
    
    Opal.def(self, '$lcm', $Number_lcm$45 = function $$lcm(other) {
      var self = this;

      
      if ($truthy($$($nesting, 'Integer')['$==='](other))) {
      } else {
        self.$raise($$($nesting, 'TypeError'), "not an integer")
      };
      
      if (self == 0 || other == 0) {
        return 0;
      }
      else {
        return Math.abs(self * other / self.$gcd(other));
      }
    ;
    }, $Number_lcm$45.$$arity = 1);
    $alias(self, "magnitude", "abs");
    $alias(self, "modulo", "%");
    
    Opal.def(self, '$next', $Number_next$46 = function $$next() {
      var self = this;

      return self + 1;
    }, $Number_next$46.$$arity = 0);
    
    Opal.def(self, '$nobits?', $Number_nobits$ques$47 = function(mask) {
      var self = this;

      
      mask = $$($nesting, 'Opal')['$coerce_to!'](mask, $$($nesting, 'Integer'), "to_int");
      return (self & mask) == 0;;
    }, $Number_nobits$ques$47.$$arity = 1);
    
    Opal.def(self, '$nonzero?', $Number_nonzero$ques$48 = function() {
      var self = this;

      return self == 0 ? nil : self;
    }, $Number_nonzero$ques$48.$$arity = 0);
    
    Opal.def(self, '$numerator', $Number_numerator$49 = function $$numerator() {
      var $iter = $Number_numerator$49.$$p, $yield = $iter || nil, self = this, $ret_or_12 = nil;

      if ($iter) $Number_numerator$49.$$p = null;
      if ($truthy((function() {if ($truthy(($ret_or_12 = self['$nan?']()))) {
        return $ret_or_12
      } else {
        return self['$infinite?']()
      }; return nil; })())) {
        return self
      } else {
        return $send2(self, $find_super(self, 'numerator', $Number_numerator$49, false, true), 'numerator', [], $iter)
      }
    }, $Number_numerator$49.$$arity = 0);
    
    Opal.def(self, '$odd?', $Number_odd$ques$50 = function() {
      var self = this;

      return self % 2 !== 0;
    }, $Number_odd$ques$50.$$arity = 0);
    
    Opal.def(self, '$ord', $Number_ord$51 = function $$ord() {
      var self = this;

      return self
    }, $Number_ord$51.$$arity = 0);
    
    Opal.def(self, '$pow', $Number_pow$52 = function $$pow(b, m) {
      var self = this;

      
      ;
      
      if (self == 0) {
        self.$raise($$($nesting, 'ZeroDivisionError'), "divided by 0")
      }

      if (m === undefined) {
        return self['$**'](b);
      } else {
        if (!($$($nesting, 'Integer')['$==='](b))) {
          self.$raise($$($nesting, 'TypeError'), "Integer#pow() 2nd argument not allowed unless a 1st argument is integer")
        }

        if (b < 0) {
          self.$raise($$($nesting, 'TypeError'), "Integer#pow() 1st argument cannot be negative when 2nd argument specified")
        }

        if (!($$($nesting, 'Integer')['$==='](m))) {
          self.$raise($$($nesting, 'TypeError'), "Integer#pow() 2nd argument not allowed unless all arguments are integers")
        }

        if (m === 0) {
          self.$raise($$($nesting, 'ZeroDivisionError'), "divided by 0")
        }

        return self['$**'](b)['$%'](m)
      }
    ;
    }, $Number_pow$52.$$arity = -2);
    
    Opal.def(self, '$pred', $Number_pred$53 = function $$pred() {
      var self = this;

      return self - 1;
    }, $Number_pred$53.$$arity = 0);
    
    Opal.def(self, '$quo', $Number_quo$54 = function $$quo(other) {
      var $iter = $Number_quo$54.$$p, $yield = $iter || nil, self = this;

      if ($iter) $Number_quo$54.$$p = null;
      if ($truthy($$($nesting, 'Integer')['$==='](self))) {
        return $send2(self, $find_super(self, 'quo', $Number_quo$54, false, true), 'quo', [other], $iter)
      } else {
        return $rb_divide(self, other)
      }
    }, $Number_quo$54.$$arity = 1);
    
    Opal.def(self, '$rationalize', $Number_rationalize$55 = function $$rationalize(eps) {
      var $a, $b, self = this, f = nil, n = nil;

      
      ;
      
      if (arguments.length > 1) {
        self.$raise($$($nesting, 'ArgumentError'), "" + "wrong number of arguments (" + (arguments.length) + " for 0..1)");
      }
    ;
      if ($truthy($$($nesting, 'Integer')['$==='](self))) {
        return $$($nesting, 'Rational').$new(self, 1)
      } else if ($truthy(self['$infinite?']())) {
        return self.$raise($$($nesting, 'FloatDomainError'), "Infinity")
      } else if ($truthy(self['$nan?']())) {
        return self.$raise($$($nesting, 'FloatDomainError'), "NaN")
      } else if ($truthy(eps == null)) {
        
        $b = $$($nesting, 'Math').$frexp(self), $a = Opal.to_ary($b), (f = ($a[0] == null ? nil : $a[0])), (n = ($a[1] == null ? nil : $a[1])), $b;
        f = $$($nesting, 'Math').$ldexp(f, $$$($$($nesting, 'Float'), 'MANT_DIG')).$to_i();
        n = $rb_minus(n, $$$($$($nesting, 'Float'), 'MANT_DIG'));
        return $$($nesting, 'Rational').$new($rb_times(2, f), (1)['$<<']($rb_minus(1, n))).$rationalize($$($nesting, 'Rational').$new(1, (1)['$<<']($rb_minus(1, n))));
      } else {
        return self.$to_r().$rationalize(eps)
      };
    }, $Number_rationalize$55.$$arity = -1);
    
    Opal.def(self, '$remainder', $Number_remainder$56 = function $$remainder(y) {
      var self = this;

      return $rb_minus(self, $rb_times(y, $rb_divide(self, y).$truncate()))
    }, $Number_remainder$56.$$arity = 1);
    
    Opal.def(self, '$round', $Number_round$57 = function $$round(ndigits) {
      var $a, $b, self = this, $ret_or_13 = nil, $ret_or_14 = nil, $ret_or_15 = nil, _ = nil, exp = nil;

      
      ;
      if ($truthy($$($nesting, 'Integer')['$==='](self))) {
        
        if ($truthy(ndigits == null)) {
          return self};
        if ($truthy((function() {if ($truthy(($ret_or_13 = $$($nesting, 'Float')['$==='](ndigits)))) {
          return ndigits['$infinite?']()
        } else {
          return $ret_or_13
        }; return nil; })())) {
          self.$raise($$($nesting, 'RangeError'), "Infinity")};
        ndigits = $$($nesting, 'Opal')['$coerce_to!'](ndigits, $$($nesting, 'Integer'), "to_int");
        if ($truthy($rb_lt(ndigits, $$$($$($nesting, 'Integer'), 'MIN')))) {
          self.$raise($$($nesting, 'RangeError'), "out of bounds")};
        if ($truthy(ndigits >= 0)) {
          return self};
        ndigits = ndigits['$-@']();
        
        if (0.415241 * ndigits - 0.125 > self.$size()) {
          return 0;
        }

        var f = Math.pow(10, ndigits),
            x = Math.floor((Math.abs(self) + f / 2) / f) * f;

        return self < 0 ? -x : x;
      ;
      } else {
        
        if ($truthy((function() {if ($truthy(($ret_or_14 = self['$nan?']()))) {
          return ndigits == null;
        } else {
          return $ret_or_14
        }; return nil; })())) {
          self.$raise($$($nesting, 'FloatDomainError'), "NaN")};
        ndigits = $$($nesting, 'Opal')['$coerce_to!'](ndigits || 0, $$($nesting, 'Integer'), "to_int");
        if ($truthy($rb_le(ndigits, 0))) {
          if ($truthy(self['$nan?']())) {
            self.$raise($$($nesting, 'RangeError'), "NaN")
          } else if ($truthy(self['$infinite?']())) {
            self.$raise($$($nesting, 'FloatDomainError'), "Infinity")}
        } else if (ndigits['$=='](0)) {
          return Math.round(self)
        } else if ($truthy((function() {if ($truthy(($ret_or_15 = self['$nan?']()))) {
          return $ret_or_15
        } else {
          return self['$infinite?']()
        }; return nil; })())) {
          return self};
        $b = $$($nesting, 'Math').$frexp(self), $a = Opal.to_ary($b), (_ = ($a[0] == null ? nil : $a[0])), (exp = ($a[1] == null ? nil : $a[1])), $b;
        if ($truthy($rb_ge(ndigits, $rb_minus($rb_plus($$$($$($nesting, 'Float'), 'DIG'), 2), (function() {if ($truthy($rb_gt(exp, 0))) {
          return $rb_divide(exp, 4)
        } else {
          return $rb_minus($rb_divide(exp, 3), 1)
        }; return nil; })())))) {
          return self};
        if ($truthy($rb_lt(ndigits, (function() {if ($truthy($rb_gt(exp, 0))) {
          return $rb_plus($rb_divide(exp, 3), 1)
        } else {
          return $rb_divide(exp, 4)
        }; return nil; })()['$-@']()))) {
          return 0};
        return Math.round(self * Math.pow(10, ndigits)) / Math.pow(10, ndigits);;
      };
    }, $Number_round$57.$$arity = -1);
    $alias(self, "succ", "next");
    
    Opal.def(self, '$times', $Number_times$58 = function $$times() {
      var $iter = $Number_times$58.$$p, block = $iter || nil, $$59, self = this;

      if ($iter) $Number_times$58.$$p = null;
      
      
      if ($iter) $Number_times$58.$$p = null;;
      if ($truthy(block)) {
      } else {
        return $send(self, 'enum_for', ["times"], ($$59 = function(){var self = $$59.$$s == null ? this : $$59.$$s;

          return self}, $$59.$$s = self, $$59.$$arity = 0, $$59))
      };
      
      for (var i = 0; i < self; i++) {
        block(i);
      }
    ;
      return self;
    }, $Number_times$58.$$arity = 0);
    
    Opal.def(self, '$to_f', $Number_to_f$60 = function $$to_f() {
      var self = this;

      return self
    }, $Number_to_f$60.$$arity = 0);
    
    Opal.def(self, '$to_i', $Number_to_i$61 = function $$to_i() {
      var self = this;

      return self < 0 ? Math.ceil(self) : Math.floor(self);
    }, $Number_to_i$61.$$arity = 0);
    $alias(self, "to_int", "to_i");
    
    Opal.def(self, '$to_r', $Number_to_r$62 = function $$to_r() {
      var $a, $b, self = this, f = nil, e = nil;

      if ($truthy($$($nesting, 'Integer')['$==='](self))) {
        return $$($nesting, 'Rational').$new(self, 1)
      } else {
        
        $b = $$($nesting, 'Math').$frexp(self), $a = Opal.to_ary($b), (f = ($a[0] == null ? nil : $a[0])), (e = ($a[1] == null ? nil : $a[1])), $b;
        f = $$($nesting, 'Math').$ldexp(f, $$$($$($nesting, 'Float'), 'MANT_DIG')).$to_i();
        e = $rb_minus(e, $$$($$($nesting, 'Float'), 'MANT_DIG'));
        return $rb_times(f, $$$($$($nesting, 'Float'), 'RADIX')['$**'](e)).$to_r();
      }
    }, $Number_to_r$62.$$arity = 0);
    
    Opal.def(self, '$to_s', $Number_to_s$63 = function $$to_s(base) {
      var self = this, $ret_or_16 = nil, $ret_or_17 = nil;

      
      
      if (base == null) {
        base = 10;
      };
      base = $$($nesting, 'Opal')['$coerce_to!'](base, $$($nesting, 'Integer'), "to_int");
      if ($truthy((function() {if ($truthy(($ret_or_16 = $rb_lt(base, 2)))) {
        return $ret_or_16
      } else {
        return $rb_gt(base, 36)
      }; return nil; })())) {
        self.$raise($$($nesting, 'ArgumentError'), "" + "invalid radix " + (base))};
      if ($truthy((function() {if ($truthy(($ret_or_17 = self['$=='](0)))) {
        return 1/self === -Infinity;
      } else {
        return $ret_or_17
      }; return nil; })())) {
        return "-0.0"};
      return self.toString(base);;
    }, $Number_to_s$63.$$arity = -1);
    
    Opal.def(self, '$truncate', $Number_truncate$64 = function $$truncate(ndigits) {
      var self = this;

      
      
      if (ndigits == null) {
        ndigits = 0;
      };
      
      var f = self.$to_f();

      if (f % 1 === 0 && ndigits >= 0) {
        return f;
      }

      var factor = Math.pow(10, ndigits),
          result = parseInt(f * factor, 10) / factor;

      if (f % 1 === 0) {
        result = Math.round(result);
      }

      return result;
    ;
    }, $Number_truncate$64.$$arity = -1);
    $alias(self, "inspect", "to_s");
    
    Opal.def(self, '$digits', $Number_digits$65 = function $$digits(base) {
      var self = this;

      
      
      if (base == null) {
        base = 10;
      };
      if ($rb_lt(self, 0)) {
        self.$raise($$$($$($nesting, 'Math'), 'DomainError'), "out of domain")};
      base = $$($nesting, 'Opal')['$coerce_to!'](base, $$($nesting, 'Integer'), "to_int");
      if ($truthy($rb_lt(base, 2))) {
        self.$raise($$($nesting, 'ArgumentError'), "" + "invalid radix " + (base))};
      
      if (self != parseInt(self)) self.$raise($$($nesting, 'NoMethodError'), "" + "undefined method `digits' for " + (self.$inspect()))

      var value = self, result = [];

      if (self == 0) {
        return [0];
      }

      while (value != 0) {
        result.push(value % base);
        value = parseInt(value / base, 10);
      }

      return result;
    ;
    }, $Number_digits$65.$$arity = -1);
    
    Opal.def(self, '$divmod', $Number_divmod$66 = function $$divmod(other) {
      var $iter = $Number_divmod$66.$$p, $yield = $iter || nil, self = this, $ret_or_18 = nil;

      if ($iter) $Number_divmod$66.$$p = null;
      if ($truthy((function() {if ($truthy(($ret_or_18 = self['$nan?']()))) {
        return $ret_or_18
      } else {
        return other['$nan?']()
      }; return nil; })())) {
        return self.$raise($$($nesting, 'FloatDomainError'), "NaN")
      } else if ($truthy(self['$infinite?']())) {
        return self.$raise($$($nesting, 'FloatDomainError'), "Infinity")
      } else {
        return $send2(self, $find_super(self, 'divmod', $Number_divmod$66, false, true), 'divmod', [other], $iter)
      }
    }, $Number_divmod$66.$$arity = 1);
    
    Opal.def(self, '$upto', $Number_upto$67 = function $$upto(stop) {
      var $iter = $Number_upto$67.$$p, block = $iter || nil, $$68, self = this;

      if ($iter) $Number_upto$67.$$p = null;
      
      
      if ($iter) $Number_upto$67.$$p = null;;
      if ((block !== nil)) {
      } else {
        return $send(self, 'enum_for', ["upto", stop], ($$68 = function(){var self = $$68.$$s == null ? this : $$68.$$s;

          
          if ($truthy($$($nesting, 'Numeric')['$==='](stop))) {
          } else {
            self.$raise($$($nesting, 'ArgumentError'), "" + "comparison of " + (self.$class()) + " with " + (stop.$class()) + " failed")
          };
          if ($truthy($rb_lt(stop, self))) {
            return 0
          } else {
            return $rb_plus($rb_minus(stop, self), 1)
          };}, $$68.$$s = self, $$68.$$arity = 0, $$68))
      };
      
      if (!stop.$$is_number) {
        self.$raise($$($nesting, 'ArgumentError'), "" + "comparison of " + (self.$class()) + " with " + (stop.$class()) + " failed")
      }
      for (var i = self; i <= stop; i++) {
        block(i);
      }
    ;
      return self;
    }, $Number_upto$67.$$arity = 1);
    
    Opal.def(self, '$zero?', $Number_zero$ques$69 = function() {
      var self = this;

      return self == 0;
    }, $Number_zero$ques$69.$$arity = 0);
    
    Opal.def(self, '$size', $Number_size$70 = function $$size() {
      var self = this;

      return 4
    }, $Number_size$70.$$arity = 0);
    
    Opal.def(self, '$nan?', $Number_nan$ques$71 = function() {
      var self = this;

      return isNaN(self);
    }, $Number_nan$ques$71.$$arity = 0);
    
    Opal.def(self, '$finite?', $Number_finite$ques$72 = function() {
      var self = this;

      return self != Infinity && self != -Infinity && !isNaN(self);
    }, $Number_finite$ques$72.$$arity = 0);
    
    Opal.def(self, '$infinite?', $Number_infinite$ques$73 = function() {
      var self = this;

      
      if (self == Infinity) {
        return +1;
      }
      else if (self == -Infinity) {
        return -1;
      }
      else {
        return nil;
      }
    
    }, $Number_infinite$ques$73.$$arity = 0);
    
    Opal.def(self, '$positive?', $Number_positive$ques$74 = function() {
      var self = this;

      return self != 0 && (self == Infinity || 1 / self > 0);
    }, $Number_positive$ques$74.$$arity = 0);
    return (Opal.def(self, '$negative?', $Number_negative$ques$75 = function() {
      var self = this;

      return self == -Infinity || 1 / self < 0;
    }, $Number_negative$ques$75.$$arity = 0), nil) && 'negative?';
  })($nesting[0], $$($nesting, 'Numeric'), $nesting);
  Opal.const_set($nesting[0], 'Fixnum', $$($nesting, 'Number'));
  (function($base, $super, $parent_nesting) {
    var self = $klass($base, $super, 'Integer');

    var $nesting = [self].concat($parent_nesting);

    
    self.$$is_number_class = true;
    self.$$is_integer_class = true;
    (function(self, $parent_nesting) {
      var $nesting = [self].concat($parent_nesting), $allocate$76, $sqrt$77;

      
      
      Opal.def(self, '$allocate', $allocate$76 = function $$allocate() {
        var self = this;

        return self.$raise($$($nesting, 'TypeError'), "" + "allocator undefined for " + (self.$name()))
      }, $allocate$76.$$arity = 0);
      
      Opal.udef(self, '$' + "new");;
      return (Opal.def(self, '$sqrt', $sqrt$77 = function $$sqrt(n) {
        var self = this;

        
        n = $$($nesting, 'Opal')['$coerce_to!'](n, $$($nesting, 'Integer'), "to_int");
        
        if (n < 0) {
          self.$raise($$$($$($nesting, 'Math'), 'DomainError'), "Numerical argument is out of domain - \"isqrt\"")
        }

        return parseInt(Math.sqrt(n), 10);
      ;
      }, $sqrt$77.$$arity = 1), nil) && 'sqrt';
    })(Opal.get_singleton_class(self), $nesting);
    Opal.const_set($nesting[0], 'MAX', Math.pow(2, 30) - 1);
    return Opal.const_set($nesting[0], 'MIN', -Math.pow(2, 30));
  })($nesting[0], $$($nesting, 'Numeric'), $nesting);
  return (function($base, $super, $parent_nesting) {
    var self = $klass($base, $super, 'Float');

    var $nesting = [self].concat($parent_nesting);

    
    self.$$is_number_class = true;
    (function(self, $parent_nesting) {
      var $nesting = [self].concat($parent_nesting), $allocate$78, $eq_eq_eq$79;

      
      
      Opal.def(self, '$allocate', $allocate$78 = function $$allocate() {
        var self = this;

        return self.$raise($$($nesting, 'TypeError'), "" + "allocator undefined for " + (self.$name()))
      }, $allocate$78.$$arity = 0);
      
      Opal.udef(self, '$' + "new");;
      return (Opal.def(self, '$===', $eq_eq_eq$79 = function(other) {
        var self = this;

        return !!other.$$is_number;
      }, $eq_eq_eq$79.$$arity = 1), nil) && '===';
    })(Opal.get_singleton_class(self), $nesting);
    Opal.const_set($nesting[0], 'INFINITY', Infinity);
    Opal.const_set($nesting[0], 'MAX', Number.MAX_VALUE);
    Opal.const_set($nesting[0], 'MIN', Number.MIN_VALUE);
    Opal.const_set($nesting[0], 'NAN', NaN);
    Opal.const_set($nesting[0], 'DIG', 15);
    Opal.const_set($nesting[0], 'MANT_DIG', 53);
    Opal.const_set($nesting[0], 'RADIX', 2);
    return Opal.const_set($nesting[0], 'EPSILON', Number.EPSILON || 2.2204460492503130808472633361816E-16);
  })($nesting[0], $$($nesting, 'Numeric'), $nesting);
};

Opal.modules["corelib/range"] = function(Opal) {/* Generated by Opal 1.3.0 */
  function $rb_lt(lhs, rhs) {
    return (typeof(lhs) === 'number' && typeof(rhs) === 'number') ? lhs < rhs : lhs['$<'](rhs);
  }
  function $rb_le(lhs, rhs) {
    return (typeof(lhs) === 'number' && typeof(rhs) === 'number') ? lhs <= rhs : lhs['$<='](rhs);
  }
  function $rb_gt(lhs, rhs) {
    return (typeof(lhs) === 'number' && typeof(rhs) === 'number') ? lhs > rhs : lhs['$>'](rhs);
  }
  function $rb_minus(lhs, rhs) {
    return (typeof(lhs) === 'number' && typeof(rhs) === 'number') ? lhs - rhs : lhs['$-'](rhs);
  }
  function $rb_divide(lhs, rhs) {
    return (typeof(lhs) === 'number' && typeof(rhs) === 'number') ? lhs / rhs : lhs['$/'](rhs);
  }
  function $rb_plus(lhs, rhs) {
    return (typeof(lhs) === 'number' && typeof(rhs) === 'number') ? lhs + rhs : lhs['$+'](rhs);
  }
  function $rb_times(lhs, rhs) {
    return (typeof(lhs) === 'number' && typeof(rhs) === 'number') ? lhs * rhs : lhs['$*'](rhs);
  }
  function $rb_ge(lhs, rhs) {
    return (typeof(lhs) === 'number' && typeof(rhs) === 'number') ? lhs >= rhs : lhs['$>='](rhs);
  }
  var self = Opal.top, $nesting = [], nil = Opal.nil, $$$ = Opal.$$$, $$ = Opal.$$, $klass = Opal.klass, $truthy = Opal.truthy, $send2 = Opal.send2, $find_super = Opal.find_super, $send = Opal.send, $alias = Opal.alias;

  Opal.add_stubs(['$require', '$include', '$attr_reader', '$raise', '$<=>', '$nil?', '$include?', '$!', '$<', '$<=', '$enum_for', '$size', '$upto', '$to_proc', '$respond_to?', '$class', '$succ', '$==', '$===', '$exclude_end?', '$eql?', '$begin', '$end', '$last', '$to_a', '$>', '$-@', '$-', '$to_i', '$coerce_to!', '$ceil', '$/', '$loop', '$+', '$*', '$>=', '$each_with_index', '$%', '$bsearch', '$inspect', '$[]', '$hash']);
  
  self.$require("corelib/enumerable");
  return (function($base, $super, $parent_nesting) {
    var self = $klass($base, $super, 'Range');

    var $nesting = [self].concat($parent_nesting), $Range_initialize$1, $Range_$eq_eq_eq$2, $Range_count$3, $Range_to_a$4, $Range_cover$ques$5, $Range_each$6, $Range_eql$ques$8, $Range_exclude_end$ques$9, $Range_first$10, $Range_last$11, $Range_max$12, $Range_min$13, $Range_size$14, $Range_step$15, $Range_bsearch$19, $Range_to_s$20, $Range_inspect$21, $Range_marshal_load$22, $Range_hash$23;

    self.$$prototype.begin = self.$$prototype.end = self.$$prototype.excl = nil;
    
    self.$include($$($nesting, 'Enumerable'));
    self.$$prototype.$$is_range = true;
    self.$attr_reader("begin", "end");
    
    Opal.def(self, '$initialize', $Range_initialize$1 = function $$initialize(first, last, exclude) {
      var self = this, $ret_or_1 = nil, $ret_or_2 = nil;

      
      
      if (exclude == null) {
        exclude = false;
      };
      if ($truthy(self.begin)) {
        self.$raise($$($nesting, 'NameError'), "'initialize' called twice")};
      if ($truthy((function() {if ($truthy(($ret_or_1 = (function() {if ($truthy(($ret_or_2 = first['$<=>'](last)))) {
        return $ret_or_2
      } else {
        return first['$nil?']()
      }; return nil; })()))) {
        return $ret_or_1
      } else {
        return last['$nil?']()
      }; return nil; })())) {
      } else {
        self.$raise($$($nesting, 'ArgumentError'), "bad value for range")
      };
      self.begin = first;
      self.end = last;
      return (self.excl = exclude);
    }, $Range_initialize$1.$$arity = -3);
    
    Opal.def(self, '$===', $Range_$eq_eq_eq$2 = function(value) {
      var self = this;

      return self['$include?'](value)
    }, $Range_$eq_eq_eq$2.$$arity = 1);
    
    function is_infinite(self) {
      if (self.begin === nil || self.end === nil ||
          self.begin === -Infinity || self.end === Infinity ||
          self.begin === Infinity || self.end === -Infinity) return true;
      return false;
    }
  ;
    
    Opal.def(self, '$count', $Range_count$3 = function $$count() {
      var $iter = $Range_count$3.$$p, block = $iter || nil, self = this, $ret_or_3 = nil;

      if ($iter) $Range_count$3.$$p = null;
      
      
      if ($iter) $Range_count$3.$$p = null;;
      if ($truthy((function() {if ($truthy(($ret_or_3 = (block !== nil)['$!']()))) {
        return is_infinite(self);
      } else {
        return $ret_or_3
      }; return nil; })())) {
        return $$$($$($nesting, 'Float'), 'INFINITY')};
      return $send2(self, $find_super(self, 'count', $Range_count$3, false, true), 'count', [], $iter);
    }, $Range_count$3.$$arity = 0);
    
    Opal.def(self, '$to_a', $Range_to_a$4 = function $$to_a() {
      var $iter = $Range_to_a$4.$$p, $yield = $iter || nil, self = this;

      if ($iter) $Range_to_a$4.$$p = null;
      
      if ($truthy(is_infinite(self))) {
        self.$raise($$($nesting, 'TypeError'), "cannot convert endless range to an array")};
      return $send2(self, $find_super(self, 'to_a', $Range_to_a$4, false, true), 'to_a', [], $iter);
    }, $Range_to_a$4.$$arity = 0);
    
    Opal.def(self, '$cover?', $Range_cover$ques$5 = function(value) {
      var self = this, beg_cmp = nil, $ret_or_4 = nil, $ret_or_5 = nil, $ret_or_6 = nil, end_cmp = nil, $ret_or_7 = nil, $ret_or_8 = nil, $ret_or_9 = nil, $ret_or_10 = nil, $ret_or_11 = nil, $ret_or_12 = nil, $ret_or_13 = nil;

      
      beg_cmp = (function() {if ($truthy(($ret_or_4 = (function() {if ($truthy(($ret_or_5 = (function() {if ($truthy(($ret_or_6 = self.begin['$nil?']()))) {
        return -1
      } else {
        return $ret_or_6
      }; return nil; })()))) {
        return $ret_or_5
      } else {
        
        return self.begin['$<=>'](value);
      }; return nil; })()))) {
        return $ret_or_4
      } else {
        return false
      }; return nil; })();
      end_cmp = (function() {if ($truthy(($ret_or_7 = (function() {if ($truthy(($ret_or_8 = (function() {if ($truthy(($ret_or_9 = self.end['$nil?']()))) {
        return -1
      } else {
        return $ret_or_9
      }; return nil; })()))) {
        return $ret_or_8
      } else {
        
        return value['$<=>'](self.end);
      }; return nil; })()))) {
        return $ret_or_7
      } else {
        return false
      }; return nil; })();
      if ($truthy(($ret_or_10 = (function() {if ($truthy(($ret_or_11 = (function() {if ($truthy(self.excl)) {
        if ($truthy(($ret_or_12 = end_cmp))) {
          return $rb_lt(end_cmp, 0)
        } else {
          return $ret_or_12
        }
      } else if ($truthy(($ret_or_13 = end_cmp))) {
        return $rb_le(end_cmp, 0)
      } else {
        return $ret_or_13
      }; return nil; })()))) {
        return beg_cmp
      } else {
        return $ret_or_11
      }; return nil; })()))) {
        return $rb_le(beg_cmp, 0)
      } else {
        return $ret_or_10
      };
    }, $Range_cover$ques$5.$$arity = 1);
    
    Opal.def(self, '$each', $Range_each$6 = function $$each() {
      var $iter = $Range_each$6.$$p, block = $iter || nil, $$7, $a, self = this, current = nil, last = nil, $ret_or_14 = nil, $ret_or_15 = nil;

      if ($iter) $Range_each$6.$$p = null;
      
      
      if ($iter) $Range_each$6.$$p = null;;
      if ((block !== nil)) {
      } else {
        return $send(self, 'enum_for', ["each"], ($$7 = function(){var self = $$7.$$s == null ? this : $$7.$$s;

          return self.$size()}, $$7.$$s = self, $$7.$$arity = 0, $$7))
      };
      
      var i, limit;

      if (self.begin.$$is_number && self.end.$$is_number) {
        if (self.begin % 1 !== 0 || self.end % 1 !== 0) {
          self.$raise($$($nesting, 'TypeError'), "can't iterate from Float")
        }

        for (i = self.begin, limit = self.end + (function() {if ($truthy(self.excl)) {
        return 0
      } else {
        return 1
      }; return nil; })(); i < limit; i++) {
          block(i);
        }

        return self;
      }

      if (self.begin.$$is_string && self.end.$$is_string) {
        $send(self.begin, 'upto', [self.end, self.excl], block.$to_proc())
        return self;
      }
    ;
      current = self.begin;
      last = self.end;
      if ($truthy(current['$respond_to?']("succ"))) {
      } else {
        self.$raise($$($nesting, 'TypeError'), "" + "can't iterate from " + (current.$class()))
      };
      while ($truthy((function() {if ($truthy(($ret_or_14 = self.end['$nil?']()))) {
        return $ret_or_14
      } else {
        return $rb_lt(current['$<=>'](last), 0)
      }; return nil; })())) {
        
        Opal.yield1(block, current);
        current = current.$succ();
      };
      if ($truthy((function() {if ($truthy(($ret_or_15 = self.excl['$!']()))) {
        return current['$=='](last)
      } else {
        return $ret_or_15
      }; return nil; })())) {
        Opal.yield1(block, current)};
      return self;
    }, $Range_each$6.$$arity = 0);
    
    Opal.def(self, '$eql?', $Range_eql$ques$8 = function(other) {
      var self = this, $ret_or_16 = nil, $ret_or_17 = nil;

      
      if ($truthy($$($nesting, 'Range')['$==='](other))) {
      } else {
        return false
      };
      if ($truthy(($ret_or_16 = (function() {if ($truthy(($ret_or_17 = self.excl['$==='](other['$exclude_end?']())))) {
        return self.begin['$eql?'](other.$begin())
      } else {
        return $ret_or_17
      }; return nil; })()))) {
        return self.end['$eql?'](other.$end())
      } else {
        return $ret_or_16
      };
    }, $Range_eql$ques$8.$$arity = 1);
    $alias(self, "==", "eql?");
    
    Opal.def(self, '$exclude_end?', $Range_exclude_end$ques$9 = function() {
      var self = this;

      return self.excl
    }, $Range_exclude_end$ques$9.$$arity = 0);
    
    Opal.def(self, '$first', $Range_first$10 = function $$first(n) {
      var $iter = $Range_first$10.$$p, $yield = $iter || nil, self = this;

      if ($iter) $Range_first$10.$$p = null;
      
      ;
      if ($truthy(self.begin['$nil?']())) {
        self.$raise($$($nesting, 'RangeError'), "cannot get the minimum of beginless range")};
      if ($truthy(n == null)) {
        return self.begin};
      return $send2(self, $find_super(self, 'first', $Range_first$10, false, true), 'first', [n], $iter);
    }, $Range_first$10.$$arity = -1);
    $alias(self, "include?", "cover?");
    
    Opal.def(self, '$last', $Range_last$11 = function $$last(n) {
      var self = this;

      
      ;
      if ($truthy(self.end['$nil?']())) {
        self.$raise($$($nesting, 'RangeError'), "cannot get the maximum of endless range")};
      if ($truthy(n == null)) {
        return self.end};
      return self.$to_a().$last(n);
    }, $Range_last$11.$$arity = -1);
    
    Opal.def(self, '$max', $Range_max$12 = function $$max() {
      var $iter = $Range_max$12.$$p, $yield = $iter || nil, self = this, $ret_or_18 = nil, $ret_or_19 = nil, $ret_or_20 = nil;

      if ($iter) $Range_max$12.$$p = null;
      if ($truthy(self.end['$nil?']())) {
        return self.$raise($$($nesting, 'RangeError'), "cannot get the maximum of endless range")
      } else if (($yield !== nil)) {
        return $send2(self, $find_super(self, 'max', $Range_max$12, false, true), 'max', [], $iter)
      } else if ($truthy((function() {if ($truthy(($ret_or_18 = self.begin['$nil?']()['$!']()))) {
        
        if ($truthy(($ret_or_19 = $rb_gt(self.begin, self.end)))) {
          return $ret_or_19
        } else if ($truthy(($ret_or_20 = self.excl))) {
          return self.begin['$=='](self.end)
        } else {
          return $ret_or_20
        };
      } else {
        return $ret_or_18
      }; return nil; })())) {
        return nil
      } else {
        return self.excl ? self.end - 1 : self.end
      }
    }, $Range_max$12.$$arity = 0);
    $alias(self, "member?", "cover?");
    
    Opal.def(self, '$min', $Range_min$13 = function $$min() {
      var $iter = $Range_min$13.$$p, $yield = $iter || nil, self = this, $ret_or_21 = nil, $ret_or_22 = nil, $ret_or_23 = nil;

      if ($iter) $Range_min$13.$$p = null;
      if ($truthy(self.begin['$nil?']())) {
        return self.$raise($$($nesting, 'RangeError'), "cannot get the minimum of beginless range")
      } else if (($yield !== nil)) {
        return $send2(self, $find_super(self, 'min', $Range_min$13, false, true), 'min', [], $iter)
      } else if ($truthy((function() {if ($truthy(($ret_or_21 = self.end['$nil?']()['$!']()))) {
        
        if ($truthy(($ret_or_22 = $rb_gt(self.begin, self.end)))) {
          return $ret_or_22
        } else if ($truthy(($ret_or_23 = self.excl))) {
          return self.begin['$=='](self.end)
        } else {
          return $ret_or_23
        };
      } else {
        return $ret_or_21
      }; return nil; })())) {
        return nil
      } else {
        return self.begin
      }
    }, $Range_min$13.$$arity = 0);
    
    Opal.def(self, '$size', $Range_size$14 = function $$size() {
      var self = this, infinity = nil, $ret_or_24 = nil, $ret_or_25 = nil, $ret_or_26 = nil, $ret_or_27 = nil, range_begin = nil, range_end = nil;

      
      infinity = $$$($$($nesting, 'Float'), 'INFINITY');
      if ($truthy((function() {if ($truthy(($ret_or_24 = (function() {if ($truthy(($ret_or_25 = self.begin['$=='](infinity)))) {
        return self.end['$nil?']()['$!']()
      } else {
        return $ret_or_25
      }; return nil; })()))) {
        return $ret_or_24
      } else {
        
        if ($truthy(($ret_or_26 = self.end['$=='](infinity['$-@']())))) {
          return self.begin['$nil?']()['$!']()
        } else {
          return $ret_or_26
        };
      }; return nil; })())) {
        return 0};
      if ($truthy(is_infinite(self))) {
        return infinity};
      if ($truthy((function() {if ($truthy(($ret_or_27 = $$($nesting, 'Numeric')['$==='](self.begin)))) {
        return $$($nesting, 'Numeric')['$==='](self.end)
      } else {
        return $ret_or_27
      }; return nil; })())) {
      } else {
        return nil
      };
      range_begin = self.begin;
      range_end = self.end;
      if ($truthy(self.excl)) {
        range_end = $rb_minus(range_end, 1)};
      if ($truthy($rb_lt(range_end, range_begin))) {
        return 0};
      return (Math.abs(range_end - range_begin) + 1).$to_i();
    }, $Range_size$14.$$arity = 0);
    
    Opal.def(self, '$step', $Range_step$15 = function $$step(n) {
      var $$16, $$17, $$18, $iter = $Range_step$15.$$p, $yield = $iter || nil, self = this, i = nil;

      if ($iter) $Range_step$15.$$p = null;
      
      
      if (n == null) {
        n = 1;
      };
      
      function coerceStepSize() {
        if (!n.$$is_number) {
          n = $$($nesting, 'Opal')['$coerce_to!'](n, $$($nesting, 'Integer'), "to_int")
        }

        if (n < 0) {
          self.$raise($$($nesting, 'ArgumentError'), "step can't be negative")
        } else if (n === 0) {
          self.$raise($$($nesting, 'ArgumentError'), "step can't be 0")
        }
      }

      function enumeratorSize() {
        if (!self.begin['$respond_to?']("succ")) {
          return nil;
        }

        if (self.begin.$$is_string && self.end.$$is_string) {
          return nil;
        }

        if (n % 1 === 0) {
          return $rb_divide(self.$size(), n).$ceil();
        } else {
          // n is a float
          var begin = self.begin, end = self.end,
              abs = Math.abs, floor = Math.floor,
              err = (abs(begin) + abs(end) + abs(end - begin)) / abs(n) * $$$($$($nesting, 'Float'), 'EPSILON'),
              size;

          if (err > 0.5) {
            err = 0.5;
          }

          if (self.excl) {
            size = floor((end - begin) / n - err);
            if (size * n + begin < end) {
              size++;
            }
          } else {
            size = floor((end - begin) / n + err) + 1
          }

          return size;
        }
      }
    ;
      if (($yield !== nil)) {
      } else {
        return $send(self, 'enum_for', ["step", n], ($$16 = function(){var self = $$16.$$s == null ? this : $$16.$$s;

          
          coerceStepSize();
          return enumeratorSize();
        }, $$16.$$s = self, $$16.$$arity = 0, $$16))
      };
      coerceStepSize();
      if ($truthy(self.begin.$$is_number && self.end.$$is_number)) {
        
        i = 0;
        (function(){var $brk = Opal.new_brk(); try {return $send(self, 'loop', [], ($$17 = function(){var self = $$17.$$s == null ? this : $$17.$$s, current = nil;
          if (self.begin == null) self.begin = nil;
          if (self.excl == null) self.excl = nil;
          if (self.end == null) self.end = nil;

          
          current = $rb_plus(self.begin, $rb_times(i, n));
          if ($truthy(self.excl)) {
            if ($truthy($rb_ge(current, self.end))) {
              
              Opal.brk(nil, $brk)}
          } else if ($truthy($rb_gt(current, self.end))) {
            
            Opal.brk(nil, $brk)};
          Opal.yield1($yield, current);
          return (i = $rb_plus(i, 1));}, $$17.$$s = self, $$17.$$brk = $brk, $$17.$$arity = 0, $$17))
        } catch (err) { if (err === $brk) { return err.$v } else { throw err } }})();
      } else {
        
        
        if (self.begin.$$is_string && self.end.$$is_string && n % 1 !== 0) {
          self.$raise($$($nesting, 'TypeError'), "no implicit conversion to float from string")
        }
      ;
        $send(self, 'each_with_index', [], ($$18 = function(value, idx){var self = $$18.$$s == null ? this : $$18.$$s;

          
          
          if (value == null) {
            value = nil;
          };
          
          if (idx == null) {
            idx = nil;
          };
          if (idx['$%'](n)['$=='](0)) {
            return Opal.yield1($yield, value);
          } else {
            return nil
          };}, $$18.$$s = self, $$18.$$arity = 2, $$18));
      };
      return self;
    }, $Range_step$15.$$arity = -1);
    
    Opal.def(self, '$bsearch', $Range_bsearch$19 = function $$bsearch() {
      var $iter = $Range_bsearch$19.$$p, block = $iter || nil, self = this;

      if ($iter) $Range_bsearch$19.$$p = null;
      
      
      if ($iter) $Range_bsearch$19.$$p = null;;
      if ((block !== nil)) {
      } else {
        return self.$enum_for("bsearch")
      };
      if ($truthy(is_infinite(self) && (self.begin.$$is_number || self.end.$$is_number))) {
        self.$raise($$($nesting, 'NotImplementedError'), "Can't #bsearch an infinite range")};
      if ($truthy(self.begin.$$is_number && self.end.$$is_number)) {
      } else {
        self.$raise($$($nesting, 'TypeError'), "" + "can't do binary search for " + (self.begin.$class()))
      };
      return $send(self.$to_a(), 'bsearch', [], block.$to_proc());
    }, $Range_bsearch$19.$$arity = 0);
    
    Opal.def(self, '$to_s', $Range_to_s$20 = function $$to_s() {
      var self = this, $ret_or_28 = nil, $ret_or_29 = nil;

      return "" + ((function() {if ($truthy(($ret_or_28 = self.begin))) {
        return $ret_or_28
      } else {
        return ""
      }; return nil; })()) + ((function() {if ($truthy(self.excl)) {
        return "..."
      } else {
        return ".."
      }; return nil; })()) + ((function() {if ($truthy(($ret_or_29 = self.end))) {
        return $ret_or_29
      } else {
        return ""
      }; return nil; })())
    }, $Range_to_s$20.$$arity = 0);
    
    Opal.def(self, '$inspect', $Range_inspect$21 = function $$inspect() {
      var self = this, $ret_or_30 = nil, $ret_or_31 = nil;

      return "" + ((function() {if ($truthy(($ret_or_30 = self.begin))) {
        return self.begin.$inspect()
      } else {
        return $ret_or_30
      }; return nil; })()) + ((function() {if ($truthy(self.excl)) {
        return "..."
      } else {
        return ".."
      }; return nil; })()) + ((function() {if ($truthy(($ret_or_31 = self.end))) {
        return self.end.$inspect()
      } else {
        return $ret_or_31
      }; return nil; })())
    }, $Range_inspect$21.$$arity = 0);
    
    Opal.def(self, '$marshal_load', $Range_marshal_load$22 = function $$marshal_load(args) {
      var self = this;

      
      self.begin = args['$[]']("begin");
      self.end = args['$[]']("end");
      return (self.excl = args['$[]']("excl"));
    }, $Range_marshal_load$22.$$arity = 1);
    return (Opal.def(self, '$hash', $Range_hash$23 = function $$hash() {
      var self = this;

      return [self.begin, self.end, self.excl].$hash()
    }, $Range_hash$23.$$arity = 0), nil) && 'hash';
  })($nesting[0], null, $nesting);
};

Opal.modules["corelib/proc"] = function(Opal) {/* Generated by Opal 1.3.0 */
  var self = Opal.top, $nesting = [], nil = Opal.nil, $$$ = Opal.$$$, $$ = Opal.$$, $slice = Opal.slice, $klass = Opal.klass, $truthy = Opal.truthy, $alias = Opal.alias, $send = Opal.send;

  Opal.add_stubs(['$raise', '$proc', '$call', '$to_proc', '$coerce_to!']);
  return (function($base, $super, $parent_nesting) {
    var self = $klass($base, $super, 'Proc');

    var $nesting = [self].concat($parent_nesting), $Proc_new$1, $Proc_call$2, $Proc_$gt$gt$3, $Proc_$lt$lt$5, $Proc_to_proc$7, $Proc_lambda$ques$8, $Proc_arity$9, $Proc_source_location$10, $Proc_binding$11, $Proc_parameters$12, $Proc_curry$13, $Proc_dup$14;

    
    Opal.defineProperty(self.$$prototype, '$$is_proc', true);
    Opal.defineProperty(self.$$prototype, '$$is_lambda', false);
    Opal.defs(self, '$new', $Proc_new$1 = function() {
      var $iter = $Proc_new$1.$$p, block = $iter || nil, self = this;

      if ($iter) $Proc_new$1.$$p = null;
      
      
      if ($iter) $Proc_new$1.$$p = null;;
      if ($truthy(block)) {
      } else {
        self.$raise($$($nesting, 'ArgumentError'), "tried to create a Proc object without a block")
      };
      return block;
    }, $Proc_new$1.$$arity = 0);
    
    Opal.def(self, '$call', $Proc_call$2 = function $$call($a) {
      var $iter = $Proc_call$2.$$p, block = $iter || nil, $post_args, args, self = this;

      if ($iter) $Proc_call$2.$$p = null;
      
      
      if ($iter) $Proc_call$2.$$p = null;;
      
      $post_args = Opal.slice.call(arguments, 0, arguments.length);
      
      args = $post_args;;
      
      if (block !== nil) {
        self.$$p = block;
      }

      var result, $brk = self.$$brk;

      if ($brk) {
        try {
          if (self.$$is_lambda) {
            result = self.apply(null, args);
          }
          else {
            result = Opal.yieldX(self, args);
          }
        } catch (err) {
          if (err === $brk) {
            return $brk.$v
          }
          else {
            throw err
          }
        }
      }
      else {
        if (self.$$is_lambda) {
          result = self.apply(null, args);
        }
        else {
          result = Opal.yieldX(self, args);
        }
      }

      return result;
    ;
    }, $Proc_call$2.$$arity = -1);
    $alias(self, "[]", "call");
    $alias(self, "===", "call");
    $alias(self, "yield", "call");
    
    Opal.def(self, '$>>', $Proc_$gt$gt$3 = function(other) {
      var $$4, $iter = $Proc_$gt$gt$3.$$p, $yield = $iter || nil, self = this;

      if ($iter) $Proc_$gt$gt$3.$$p = null;
      return $send(self, 'proc', [], ($$4 = function($a){var self = $$4.$$s == null ? this : $$4.$$s, $iter = $$4.$$p, block = $iter || nil, $post_args, args, out = nil;

        
        
        if ($iter) $$4.$$p = null;;
        
        $post_args = Opal.slice.call(arguments, 0, arguments.length);
        
        args = $post_args;;
        out = $send(self, 'call', Opal.to_a(args), block.$to_proc());
        return other.$call(out);}, $$4.$$s = self, $$4.$$arity = -1, $$4))
    }, $Proc_$gt$gt$3.$$arity = 1);
    
    Opal.def(self, '$<<', $Proc_$lt$lt$5 = function(other) {
      var $$6, $iter = $Proc_$lt$lt$5.$$p, $yield = $iter || nil, self = this;

      if ($iter) $Proc_$lt$lt$5.$$p = null;
      return $send(self, 'proc', [], ($$6 = function($a){var self = $$6.$$s == null ? this : $$6.$$s, $iter = $$6.$$p, block = $iter || nil, $post_args, args, out = nil;

        
        
        if ($iter) $$6.$$p = null;;
        
        $post_args = Opal.slice.call(arguments, 0, arguments.length);
        
        args = $post_args;;
        out = $send(other, 'call', Opal.to_a(args), block.$to_proc());
        return self.$call(out);}, $$6.$$s = self, $$6.$$arity = -1, $$6))
    }, $Proc_$lt$lt$5.$$arity = 1);
    
    Opal.def(self, '$to_proc', $Proc_to_proc$7 = function $$to_proc() {
      var self = this;

      return self
    }, $Proc_to_proc$7.$$arity = 0);
    
    Opal.def(self, '$lambda?', $Proc_lambda$ques$8 = function() {
      var self = this;

      return !!self.$$is_lambda;
    }, $Proc_lambda$ques$8.$$arity = 0);
    
    Opal.def(self, '$arity', $Proc_arity$9 = function $$arity() {
      var self = this;

      
      if (self.$$is_curried) {
        return -1;
      } else {
        return self.$$arity;
      }
    
    }, $Proc_arity$9.$$arity = 0);
    
    Opal.def(self, '$source_location', $Proc_source_location$10 = function $$source_location() {
      var self = this;

      
      if (self.$$is_curried) { return nil; };
      return nil;
    }, $Proc_source_location$10.$$arity = 0);
    
    Opal.def(self, '$binding', $Proc_binding$11 = function $$binding() {
      var self = this;

      
      if (self.$$is_curried) { self.$raise($$($nesting, 'ArgumentError'), "Can't create Binding") };
      return nil;
    }, $Proc_binding$11.$$arity = 0);
    
    Opal.def(self, '$parameters', $Proc_parameters$12 = function $$parameters() {
      var self = this;

      
      if (self.$$is_curried) {
        return [["rest"]];
      } else if (self.$$parameters) {
        if (self.$$is_lambda) {
          return self.$$parameters;
        } else {
          var result = [], i, length;

          for (i = 0, length = self.$$parameters.length; i < length; i++) {
            var parameter = self.$$parameters[i];

            if (parameter[0] === 'req') {
              // required arguments always have name
              parameter = ['opt', parameter[1]];
            }

            result.push(parameter);
          }

          return result;
        }
      } else {
        return [];
      }
    
    }, $Proc_parameters$12.$$arity = 0);
    
    Opal.def(self, '$curry', $Proc_curry$13 = function $$curry(arity) {
      var self = this;

      
      ;
      
      if (arity === undefined) {
        arity = self.length;
      }
      else {
        arity = $$($nesting, 'Opal')['$coerce_to!'](arity, $$($nesting, 'Integer'), "to_int");
        if (self.$$is_lambda && arity !== self.length) {
          self.$raise($$($nesting, 'ArgumentError'), "" + "wrong number of arguments (" + (arity) + " for " + (self.length) + ")")
        }
      }

      function curried () {
        var args = $slice.call(arguments),
            length = args.length,
            result;

        if (length > arity && self.$$is_lambda && !self.$$is_curried) {
          self.$raise($$($nesting, 'ArgumentError'), "" + "wrong number of arguments (" + (length) + " for " + (arity) + ")")
        }

        if (length >= arity) {
          return self.$call.apply(self, args);
        }

        result = function () {
          return curried.apply(null,
            args.concat($slice.call(arguments)));
        }
        result.$$is_lambda = self.$$is_lambda;
        result.$$is_curried = true;

        return result;
      };

      curried.$$is_lambda = self.$$is_lambda;
      curried.$$is_curried = true;
      return curried;
    ;
    }, $Proc_curry$13.$$arity = -1);
    
    Opal.def(self, '$dup', $Proc_dup$14 = function $$dup() {
      var self = this;

      
      var original_proc = self.$$original_proc || self,
          proc = function () {
            return original_proc.apply(this, arguments);
          };

      for (var prop in self) {
        if (self.hasOwnProperty(prop)) {
          proc[prop] = self[prop];
        }
      }

      return proc;
    
    }, $Proc_dup$14.$$arity = 0);
    return $alias(self, "clone", "dup");
  })($nesting[0], Function, $nesting)
};

Opal.modules["corelib/method"] = function(Opal) {/* Generated by Opal 1.3.0 */
  var self = Opal.top, $nesting = [], nil = Opal.nil, $$$ = Opal.$$$, $$ = Opal.$$, $klass = Opal.klass, $truthy = Opal.truthy, $alias = Opal.alias;

  Opal.add_stubs(['$attr_reader', '$arity', '$curry', '$>>', '$<<', '$new', '$class', '$join', '$source_location', '$raise']);
  
  (function($base, $super, $parent_nesting) {
    var self = $klass($base, $super, 'Method');

    var $nesting = [self].concat($parent_nesting), $Method_initialize$1, $Method_arity$2, $Method_parameters$3, $Method_source_location$4, $Method_comments$5, $Method_call$6, $Method_curry$7, $Method_$gt$gt$8, $Method_$lt$lt$9, $Method_unbind$10, $Method_to_proc$11, $Method_inspect$12;

    self.$$prototype.method = self.$$prototype.receiver = self.$$prototype.owner = self.$$prototype.name = nil;
    
    self.$attr_reader("owner", "receiver", "name");
    
    Opal.def(self, '$initialize', $Method_initialize$1 = function $$initialize(receiver, owner, method, name) {
      var self = this;

      
      self.receiver = receiver;
      self.owner = owner;
      self.name = name;
      return (self.method = method);
    }, $Method_initialize$1.$$arity = 4);
    
    Opal.def(self, '$arity', $Method_arity$2 = function $$arity() {
      var self = this;

      return self.method.$arity()
    }, $Method_arity$2.$$arity = 0);
    
    Opal.def(self, '$parameters', $Method_parameters$3 = function $$parameters() {
      var self = this;

      return self.method.$$parameters
    }, $Method_parameters$3.$$arity = 0);
    
    Opal.def(self, '$source_location', $Method_source_location$4 = function $$source_location() {
      var self = this, $ret_or_1 = nil;

      if ($truthy(($ret_or_1 = self.method.$$source_location))) {
        return $ret_or_1
      } else {
        return ["(eval)", 0]
      }
    }, $Method_source_location$4.$$arity = 0);
    
    Opal.def(self, '$comments', $Method_comments$5 = function $$comments() {
      var self = this, $ret_or_2 = nil;

      if ($truthy(($ret_or_2 = self.method.$$comments))) {
        return $ret_or_2
      } else {
        return []
      }
    }, $Method_comments$5.$$arity = 0);
    
    Opal.def(self, '$call', $Method_call$6 = function $$call($a) {
      var $iter = $Method_call$6.$$p, block = $iter || nil, $post_args, args, self = this;

      if ($iter) $Method_call$6.$$p = null;
      
      
      if ($iter) $Method_call$6.$$p = null;;
      
      $post_args = Opal.slice.call(arguments, 0, arguments.length);
      
      args = $post_args;;
      
      self.method.$$p = block;

      return self.method.apply(self.receiver, args);
    ;
    }, $Method_call$6.$$arity = -1);
    
    Opal.def(self, '$curry', $Method_curry$7 = function $$curry(arity) {
      var self = this;

      
      ;
      return self.method.$curry(arity);
    }, $Method_curry$7.$$arity = -1);
    $alias(self, "[]", "call");
    $alias(self, "===", "call");
    
    Opal.def(self, '$>>', $Method_$gt$gt$8 = function(other) {
      var self = this;

      return self.method['$>>'](other)
    }, $Method_$gt$gt$8.$$arity = 1);
    
    Opal.def(self, '$<<', $Method_$lt$lt$9 = function(other) {
      var self = this;

      return self.method['$<<'](other)
    }, $Method_$lt$lt$9.$$arity = 1);
    
    Opal.def(self, '$unbind', $Method_unbind$10 = function $$unbind() {
      var self = this;

      return $$($nesting, 'UnboundMethod').$new(self.receiver.$class(), self.owner, self.method, self.name)
    }, $Method_unbind$10.$$arity = 0);
    
    Opal.def(self, '$to_proc', $Method_to_proc$11 = function $$to_proc() {
      var self = this;

      
      var proc = self.$call.bind(self);
      proc.$$unbound = self.method;
      proc.$$is_lambda = true;
      proc.$$arity = self.method.$$arity;
      proc.$$parameters = self.method.$$parameters;
      return proc;
    
    }, $Method_to_proc$11.$$arity = 0);
    return (Opal.def(self, '$inspect', $Method_inspect$12 = function $$inspect() {
      var self = this;

      return "" + "#<" + (self.$class()) + ": " + (self.receiver.$class()) + "#" + (self.name) + " (defined in " + (self.owner) + " in " + (self.$source_location().$join(":")) + ")>"
    }, $Method_inspect$12.$$arity = 0), nil) && 'inspect';
  })($nesting[0], null, $nesting);
  return (function($base, $super, $parent_nesting) {
    var self = $klass($base, $super, 'UnboundMethod');

    var $nesting = [self].concat($parent_nesting), $UnboundMethod_initialize$13, $UnboundMethod_arity$14, $UnboundMethod_parameters$15, $UnboundMethod_source_location$16, $UnboundMethod_comments$17, $UnboundMethod_bind$18, $UnboundMethod_inspect$19;

    self.$$prototype.method = self.$$prototype.owner = self.$$prototype.name = self.$$prototype.source = nil;
    
    self.$attr_reader("source", "owner", "name");
    
    Opal.def(self, '$initialize', $UnboundMethod_initialize$13 = function $$initialize(source, owner, method, name) {
      var self = this;

      
      self.source = source;
      self.owner = owner;
      self.method = method;
      return (self.name = name);
    }, $UnboundMethod_initialize$13.$$arity = 4);
    
    Opal.def(self, '$arity', $UnboundMethod_arity$14 = function $$arity() {
      var self = this;

      return self.method.$arity()
    }, $UnboundMethod_arity$14.$$arity = 0);
    
    Opal.def(self, '$parameters', $UnboundMethod_parameters$15 = function $$parameters() {
      var self = this;

      return self.method.$$parameters
    }, $UnboundMethod_parameters$15.$$arity = 0);
    
    Opal.def(self, '$source_location', $UnboundMethod_source_location$16 = function $$source_location() {
      var self = this, $ret_or_3 = nil;

      if ($truthy(($ret_or_3 = self.method.$$source_location))) {
        return $ret_or_3
      } else {
        return ["(eval)", 0]
      }
    }, $UnboundMethod_source_location$16.$$arity = 0);
    
    Opal.def(self, '$comments', $UnboundMethod_comments$17 = function $$comments() {
      var self = this, $ret_or_4 = nil;

      if ($truthy(($ret_or_4 = self.method.$$comments))) {
        return $ret_or_4
      } else {
        return []
      }
    }, $UnboundMethod_comments$17.$$arity = 0);
    
    Opal.def(self, '$bind', $UnboundMethod_bind$18 = function $$bind(object) {
      var self = this;

      
      if (self.owner.$$is_module || Opal.is_a(object, self.owner)) {
        return $$($nesting, 'Method').$new(object, self.owner, self.method, self.name);
      }
      else {
        self.$raise($$($nesting, 'TypeError'), "" + "can't bind singleton method to a different class (expected " + (object) + ".kind_of?(" + (self.owner) + " to be true)");
      }
    
    }, $UnboundMethod_bind$18.$$arity = 1);
    return (Opal.def(self, '$inspect', $UnboundMethod_inspect$19 = function $$inspect() {
      var self = this;

      return "" + "#<" + (self.$class()) + ": " + (self.source) + "#" + (self.name) + " (defined in " + (self.owner) + " in " + (self.$source_location().$join(":")) + ")>"
    }, $UnboundMethod_inspect$19.$$arity = 0), nil) && 'inspect';
  })($nesting[0], null, $nesting);
};

Opal.modules["corelib/variables"] = function(Opal) {/* Generated by Opal 1.3.0 */
  var self = Opal.top, $nesting = [], nil = Opal.nil, $$$ = Opal.$$$, $$ = Opal.$$, $gvars = Opal.gvars, $hash2 = Opal.hash2;

  Opal.add_stubs(['$new']);
  
  $gvars['&'] = $gvars['~'] = $gvars['`'] = $gvars["'"] = nil;
  $gvars.LOADED_FEATURES = ($gvars["\""] = Opal.loaded_features);
  $gvars.LOAD_PATH = ($gvars[":"] = []);
  $gvars["/"] = "\n";
  $gvars[","] = nil;
  Opal.const_set($nesting[0], 'ARGV', []);
  Opal.const_set($nesting[0], 'ARGF', $$($nesting, 'Object').$new());
  Opal.const_set($nesting[0], 'ENV', $hash2([], {}));
  $gvars.VERBOSE = false;
  $gvars.DEBUG = false;
  return ($gvars.SAFE = 0);
};

Opal.modules["corelib/io"] = function(Opal) {/* Generated by Opal 1.3.0 */
  function $rb_plus(lhs, rhs) {
    return (typeof(lhs) === 'number' && typeof(rhs) === 'number') ? lhs + rhs : lhs['$+'](rhs);
  }
  function $rb_gt(lhs, rhs) {
    return (typeof(lhs) === 'number' && typeof(rhs) === 'number') ? lhs > rhs : lhs['$>'](rhs);
  }
  function $rb_minus(lhs, rhs) {
    return (typeof(lhs) === 'number' && typeof(rhs) === 'number') ? lhs - rhs : lhs['$-'](rhs);
  }
  var self = Opal.top, $nesting = [], nil = Opal.nil, $$$ = Opal.$$$, $$ = Opal.$$, $klass = Opal.klass, $truthy = Opal.truthy, $alias = Opal.alias, $gvars = Opal.gvars, $range = Opal.range, $send = Opal.send, $hash2 = Opal.hash2, $writer = nil;

  Opal.add_stubs(['$include?', '$!', '$match?', '$attr_accessor', '$size', '$attr_reader', '$write', '$String', '$chomp', '$sysread_noraise', '$+', '$!=', '$[]', '$ord', '$getc', '$readchar', '$raise', '$gets', '$==', '$to_str', '$split', '$length', '$sub', '$sysread', '$>', '$to_a', '$each_line', '$enum_for', '$getbyte', '$closed_write?', '$closed_read?', '$new', '$write_proc=', '$-', '$read_proc=']);
  
  (function($base, $super, $parent_nesting) {
    var self = $klass($base, $super, 'IO');

    var $nesting = [self].concat($parent_nesting), $IO_initialize$1, $IO_fileno$2, $IO_tty$ques$3, $IO_write$4, $IO_flush$5, $IO_$lt$lt$6, $IO_print$7, $IO_puts$8, $IO_getc$9, $IO_getbyte$10, $IO_readbyte$11, $IO_readchar$12, $IO_readline$13, $IO_gets$14, $IO_sysread$15, $IO_sysread_noraise$16, $IO_readpartial$17, $IO_read$18, $IO_readlines$19, $IO_each$20, $IO_each_byte$21, $IO_each_char$22, $IO_close$23, $IO_close_read$24, $IO_close_write$25, $IO_closed$ques$26, $IO_closed_read$ques$27, $IO_closed_write$ques$28, $IO_check_writable$29, $IO_check_readable$30;

    self.$$prototype.fd = self.$$prototype.read_buffer = self.$$prototype.closed = nil;
    
    Opal.const_set($nesting[0], 'SEEK_SET', 0);
    Opal.const_set($nesting[0], 'SEEK_CUR', 1);
    Opal.const_set($nesting[0], 'SEEK_END', 2);
    Opal.const_set($nesting[0], 'SEEK_DATA', 3);
    Opal.const_set($nesting[0], 'SEEK_HOLE', 4);
    Opal.const_set($nesting[0], 'READABLE', 1);
    Opal.const_set($nesting[0], 'WRITABLE', 4);
    
    Opal.def(self, '$initialize', $IO_initialize$1 = function $$initialize(fd, flags) {
      var self = this, $ret_or_1 = nil, $ret_or_2 = nil;

      
      
      if (flags == null) {
        flags = "r";
      };
      self.fd = fd;
      self.flags = flags;
      self.eof = false;
      if ($truthy((function() {if ($truthy(($ret_or_1 = flags['$include?']("r")))) {
        return flags['$match?'](/[wa+]/)['$!']()
      } else {
        return $ret_or_1
      }; return nil; })())) {
        return (self.closed = "write")
      } else if ($truthy((function() {if ($truthy(($ret_or_2 = flags['$match?'](/[wa]/)))) {
        return flags['$match?'](/[r+]/)['$!']()
      } else {
        return $ret_or_2
      }; return nil; })())) {
        return (self.closed = "read")
      } else {
        return nil
      };
    }, $IO_initialize$1.$$arity = -2);
    
    Opal.def(self, '$fileno', $IO_fileno$2 = function $$fileno() {
      var self = this;

      return self.fd
    }, $IO_fileno$2.$$arity = 0);
    
    Opal.def(self, '$tty?', $IO_tty$ques$3 = function() {
      var self = this;

      return self.tty == true;
    }, $IO_tty$ques$3.$$arity = 0);
    self.$attr_accessor("write_proc");
    self.$attr_accessor("read_proc");
    
    Opal.def(self, '$write', $IO_write$4 = function $$write(string) {
      var self = this;

      
      self.write_proc(string);
      return string.$size();
    }, $IO_write$4.$$arity = 1);
    self.$attr_accessor("sync", "tty");
    self.$attr_reader("eof");
    $alias(self, "eof?", "eof");
    
    Opal.def(self, '$flush', $IO_flush$5 = function $$flush() {
      var self = this;

      return nil
    }, $IO_flush$5.$$arity = 0);
    
    Opal.def(self, '$<<', $IO_$lt$lt$6 = function(string) {
      var self = this;

      
      self.$write(string);
      return self;
    }, $IO_$lt$lt$6.$$arity = 1);
    
    Opal.def(self, '$print', $IO_print$7 = function $$print($a) {
      var $post_args, args, self = this;
      if ($gvars[","] == null) $gvars[","] = nil;

      
      
      $post_args = Opal.slice.call(arguments, 0, arguments.length);
      
      args = $post_args;;
      
      for (var i = 0, ii = args.length; i < ii; i++) {
        args[i] = self.$String(args[i])
      }
      self.$write(args.join($gvars[","]));
    ;
      return nil;
    }, $IO_print$7.$$arity = -1);
    
    Opal.def(self, '$puts', $IO_puts$8 = function $$puts($a) {
      var $post_args, args, self = this;
      if ($gvars["/"] == null) $gvars["/"] = nil;

      
      
      $post_args = Opal.slice.call(arguments, 0, arguments.length);
      
      args = $post_args;;
      
      for (var i = 0, ii = args.length; i < ii; i++) {
        args[i] = self.$String(args[i]).$chomp()
      }
      self.$write(args.concat([nil]).join($gvars["/"]));
    ;
      return nil;
    }, $IO_puts$8.$$arity = -1);
    
    Opal.def(self, '$getc', $IO_getc$9 = function $$getc() {
      var $a, self = this, $ret_or_3 = nil, parts = nil, ret = nil;

      
      self.read_buffer = (function() {if ($truthy(($ret_or_3 = self.read_buffer))) {
        return $ret_or_3
      } else {
        return ""
      }; return nil; })();
      parts = "";
      do {
        
        self.read_buffer = $rb_plus(self.read_buffer, parts);
        if ($truthy(self.read_buffer['$!='](""))) {
          
          ret = self.read_buffer['$[]'](0);
          self.read_buffer = self.read_buffer['$[]']($range(1, -1, false));
          return ret;};
      } while ($truthy((parts = self.$sysread_noraise(1))));;
      return nil;
    }, $IO_getc$9.$$arity = 0);
    
    Opal.def(self, '$getbyte', $IO_getbyte$10 = function $$getbyte() {
      var $a, self = this;

      return ($a = self.$getc(), ($a === nil || $a == null) ? nil : $send($a, 'ord', []))
    }, $IO_getbyte$10.$$arity = 0);
    
    Opal.def(self, '$readbyte', $IO_readbyte$11 = function $$readbyte() {
      var self = this;

      return self.$readchar().$ord()
    }, $IO_readbyte$11.$$arity = 0);
    
    Opal.def(self, '$readchar', $IO_readchar$12 = function $$readchar() {
      var self = this, $ret_or_4 = nil;

      if ($truthy(($ret_or_4 = self.$getc()))) {
        return $ret_or_4
      } else {
        return self.$raise($$($nesting, 'EOFError'), "end of file reached")
      }
    }, $IO_readchar$12.$$arity = 0);
    
    Opal.def(self, '$readline', $IO_readline$13 = function $$readline($a) {
      var $post_args, args, self = this, $ret_or_5 = nil;

      
      
      $post_args = Opal.slice.call(arguments, 0, arguments.length);
      
      args = $post_args;;
      if ($truthy(($ret_or_5 = $send(self, 'gets', Opal.to_a(args))))) {
        return $ret_or_5
      } else {
        return self.$raise($$($nesting, 'EOFError'), "end of file reached")
      };
    }, $IO_readline$13.$$arity = -1);
    
    Opal.def(self, '$gets', $IO_gets$14 = function $$gets(sep, limit, opts) {
      var $a, $b, $c, self = this, $ret_or_6 = nil, $ret_or_7 = nil, $ret_or_8 = nil, $ret_or_9 = nil, orig_sep = nil, $ret_or_10 = nil, seplen = nil, $ret_or_11 = nil, data = nil, ret = nil, $ret_or_12 = nil, orig_buffer = nil, $ret_or_13 = nil;
      if ($gvars["/"] == null) $gvars["/"] = nil;

      
      
      if (sep == null) {
        sep = false;
      };
      
      if (limit == null) {
        limit = nil;
      };
      
      if (opts == null) {
        opts = $hash2([], {});
      };
      if ($truthy((function() {if ($truthy(($ret_or_6 = sep.$$is_number))) {
        return limit['$!']()
      } else {
        return $ret_or_6
      }; return nil; })())) {
        $a = [false, sep, limit], (sep = $a[0]), (limit = $a[1]), (opts = $a[2]), $a};
      if ($truthy((function() {if ($truthy(($ret_or_7 = (function() {if ($truthy(($ret_or_8 = sep.$$is_hash))) {
        return limit['$!']()
      } else {
        return $ret_or_8
      }; return nil; })()))) {
        return opts['$==']($hash2([], {}))
      } else {
        return $ret_or_7
      }; return nil; })())) {
        $a = [false, nil, sep], (sep = $a[0]), (limit = $a[1]), (opts = $a[2]), $a
      } else if ($truthy((function() {if ($truthy(($ret_or_9 = limit.$$is_hash))) {
        return opts['$==']($hash2([], {}))
      } else {
        return $ret_or_9
      }; return nil; })())) {
        $a = [sep, nil, limit], (sep = $a[0]), (limit = $a[1]), (opts = $a[2]), $a};
      orig_sep = sep;
      if (sep['$=='](false)) {
        sep = $gvars["/"]};
      if (sep['$==']("")) {
        sep = /\r?\n\r?\n/};
      sep = (function() {if ($truthy(($ret_or_10 = sep))) {
        return $ret_or_10
      } else {
        return ""
      }; return nil; })();
      if (orig_sep['$==']("")) {
      } else {
        sep = sep.$to_str()
      };
      seplen = orig_sep == '' ? 2 : sep.length;
      if (sep['$=='](" ")) {
        sep = / /};
      self.read_buffer = (function() {if ($truthy(($ret_or_11 = self.read_buffer))) {
        return $ret_or_11
      } else {
        return ""
      }; return nil; })();
      data = "";
      ret = nil;
      do {
        
        self.read_buffer = $rb_plus(self.read_buffer, data);
        if ($truthy((function() {if ($truthy(($ret_or_12 = sep['$!=']("")))) {
          
          if ($truthy(sep.$$is_regexp)) {
            return self.read_buffer['$match?'](sep)
          } else {
            return self.read_buffer['$include?'](sep)
          };
        } else {
          return $ret_or_12
        }; return nil; })())) {
          
          orig_buffer = self.read_buffer;
          $c = self.read_buffer.$split(sep, 2), $b = Opal.to_ary($c), (ret = ($b[0] == null ? nil : $b[0])), (self.read_buffer = ($b[1] == null ? nil : $b[1])), $c;
          if ($truthy(ret['$!='](orig_buffer))) {
            ret = $rb_plus(ret, orig_buffer['$[]'](ret.$length(), seplen))};
          break;;};
      } while ($truthy((data = self.$sysread_noraise((function() {if (sep['$==']("")) {
        return 65536
      } else {
        return 1
      }; return nil; })()))));;
      if ($truthy(ret)) {
      } else {
        
        $a = [(function() {if ($truthy(($ret_or_13 = self.read_buffer))) {
          return $ret_or_13
        } else {
          return ""
        }; return nil; })(), ""], (ret = $a[0]), (self.read_buffer = $a[1]), $a;
        if (ret['$==']("")) {
          ret = nil};
      };
      if ($truthy(ret)) {
        
        if ($truthy(limit)) {
          
          ret = ret['$[]'](Opal.Range.$new(0,limit, true));
          self.read_buffer = $rb_plus(ret['$[]'](Opal.Range.$new(limit, -1, false)), self.read_buffer);};
        if ($truthy(opts['$[]']("chomp"))) {
          ret = ret.$sub(/\r?\n$/, "")};
        if (orig_sep['$==']("")) {
          ret = ret.$sub(/^[\r\n]+/, "")};};
      if (orig_sep['$=='](false)) {
        $gvars._ = ret};
      return ret;
    }, $IO_gets$14.$$arity = -1);
    
    Opal.def(self, '$sysread', $IO_sysread$15 = function $$sysread(integer) {
      var self = this, $ret_or_14 = nil;

      if ($truthy(($ret_or_14 = self.read_proc(integer)))) {
        return $ret_or_14
      } else {
        
        self.eof = true;
        return self.$raise($$($nesting, 'EOFError'), "end of file reached");
      }
    }, $IO_sysread$15.$$arity = 1);
    
    Opal.def(self, '$sysread_noraise', $IO_sysread_noraise$16 = function $$sysread_noraise(integer) {
      var self = this;

      try {
        return self.$sysread(integer)
      } catch ($err) {
        if (Opal.rescue($err, [$$($nesting, 'EOFError')])) {
          try {
            return nil
          } finally { Opal.pop_exception(); }
        } else { throw $err; }
      }
    }, $IO_sysread_noraise$16.$$arity = 1);
    
    Opal.def(self, '$readpartial', $IO_readpartial$17 = function $$readpartial(integer) {
      var $a, self = this, $ret_or_15 = nil, part = nil, $ret_or_16 = nil, ret = nil;

      
      self.read_buffer = (function() {if ($truthy(($ret_or_15 = self.read_buffer))) {
        return $ret_or_15
      } else {
        return ""
      }; return nil; })();
      part = self.$sysread(integer);
      $a = [$rb_plus(self.read_buffer, (function() {if ($truthy(($ret_or_16 = part))) {
        return $ret_or_16
      } else {
        return ""
      }; return nil; })()), ""], (ret = $a[0]), (self.read_buffer = $a[1]), $a;
      if (ret['$==']("")) {
        ret = nil};
      return ret;
    }, $IO_readpartial$17.$$arity = 1);
    
    Opal.def(self, '$read', $IO_read$18 = function $$read(integer) {
      var $a, $b, self = this, $ret_or_17 = nil, parts = nil, ret = nil, $ret_or_18 = nil, $ret_or_19 = nil;

      
      
      if (integer == null) {
        integer = nil;
      };
      self.read_buffer = (function() {if ($truthy(($ret_or_17 = self.read_buffer))) {
        return $ret_or_17
      } else {
        return ""
      }; return nil; })();
      parts = "";
      ret = nil;
      do {
        
        self.read_buffer = $rb_plus(self.read_buffer, parts);
        if ($truthy((function() {if ($truthy(($ret_or_19 = integer))) {
          return $rb_gt(self.read_buffer.$length(), integer)
        } else {
          return $ret_or_19
        }; return nil; })())) {
          
          $b = [self.read_buffer['$[]'](Opal.Range.$new(0,integer, true)), self.read_buffer['$[]'](Opal.Range.$new(integer, -1, false))], (ret = $b[0]), (self.read_buffer = $b[1]), $b;
          return ret;};
      } while ($truthy((parts = self.$sysread_noraise((function() {if ($truthy(($ret_or_18 = integer))) {
        return $ret_or_18
      } else {
        return 65536
      }; return nil; })()))));;
      $a = [self.read_buffer, ""], (ret = $a[0]), (self.read_buffer = $a[1]), $a;
      return ret;
    }, $IO_read$18.$$arity = -1);
    
    Opal.def(self, '$readlines', $IO_readlines$19 = function $$readlines(separator) {
      var self = this;
      if ($gvars["/"] == null) $gvars["/"] = nil;

      
      
      if (separator == null) {
        separator = $gvars["/"];
      };
      return self.$each_line(separator).$to_a();
    }, $IO_readlines$19.$$arity = -1);
    
    Opal.def(self, '$each', $IO_each$20 = function $$each($a, $b) {
      var $iter = $IO_each$20.$$p, block = $iter || nil, $post_args, sep, args, $c, self = this, s = nil;
      if ($gvars["/"] == null) $gvars["/"] = nil;

      if ($iter) $IO_each$20.$$p = null;
      
      
      if ($iter) $IO_each$20.$$p = null;;
      
      $post_args = Opal.slice.call(arguments, 0, arguments.length);
      
      if ($post_args.length > 0) {
        sep = $post_args[0];
        $post_args.splice(0, 1);
      }
      if (sep == null) {
        sep = $gvars["/"];
      };
      
      args = $post_args;;
      if ((block !== nil)) {
      } else {
        return $send(self, 'enum_for', ["each", sep].concat(Opal.to_a(args)))
      };
      while ($truthy((s = $send(self, 'gets', [sep].concat(Opal.to_a(args)))))) {
        Opal.yield1(block, s)
      };
      return self;
    }, $IO_each$20.$$arity = -1);
    $alias(self, "each_line", "each");
    
    Opal.def(self, '$each_byte', $IO_each_byte$21 = function $$each_byte() {
      var $iter = $IO_each_byte$21.$$p, block = $iter || nil, $a, self = this, s = nil;

      if ($iter) $IO_each_byte$21.$$p = null;
      
      
      if ($iter) $IO_each_byte$21.$$p = null;;
      if ((block !== nil)) {
      } else {
        return self.$enum_for("each_byte")
      };
      while ($truthy((s = self.$getbyte()))) {
        Opal.yield1(block, s)
      };
      return self;
    }, $IO_each_byte$21.$$arity = 0);
    
    Opal.def(self, '$each_char', $IO_each_char$22 = function $$each_char() {
      var $iter = $IO_each_char$22.$$p, block = $iter || nil, $a, self = this, s = nil;

      if ($iter) $IO_each_char$22.$$p = null;
      
      
      if ($iter) $IO_each_char$22.$$p = null;;
      if ((block !== nil)) {
      } else {
        return self.$enum_for("each_char")
      };
      while ($truthy((s = self.$getc()))) {
        Opal.yield1(block, s)
      };
      return self;
    }, $IO_each_char$22.$$arity = 0);
    
    Opal.def(self, '$close', $IO_close$23 = function $$close() {
      var self = this;

      return (self.closed = "both")
    }, $IO_close$23.$$arity = 0);
    
    Opal.def(self, '$close_read', $IO_close_read$24 = function $$close_read() {
      var self = this;

      if (self.closed['$==']("write")) {
        return (self.closed = "both")
      } else {
        return (self.closed = "read")
      }
    }, $IO_close_read$24.$$arity = 0);
    
    Opal.def(self, '$close_write', $IO_close_write$25 = function $$close_write() {
      var self = this;

      if (self.closed['$==']("read")) {
        return (self.closed = "both")
      } else {
        return (self.closed = "write")
      }
    }, $IO_close_write$25.$$arity = 0);
    
    Opal.def(self, '$closed?', $IO_closed$ques$26 = function() {
      var self = this;

      return self.closed['$==']("both")
    }, $IO_closed$ques$26.$$arity = 0);
    
    Opal.def(self, '$closed_read?', $IO_closed_read$ques$27 = function() {
      var self = this, $ret_or_20 = nil;

      if ($truthy(($ret_or_20 = self.closed['$==']("read")))) {
        return $ret_or_20
      } else {
        return self.closed['$==']("both")
      }
    }, $IO_closed_read$ques$27.$$arity = 0);
    
    Opal.def(self, '$closed_write?', $IO_closed_write$ques$28 = function() {
      var self = this, $ret_or_21 = nil;

      if ($truthy(($ret_or_21 = self.closed['$==']("write")))) {
        return $ret_or_21
      } else {
        return self.closed['$==']("both")
      }
    }, $IO_closed_write$ques$28.$$arity = 0);
    
    Opal.def(self, '$check_writable', $IO_check_writable$29 = function $$check_writable() {
      var self = this;

      if ($truthy(self['$closed_write?']())) {
        return self.$raise($$($nesting, 'IOError'), "not opened for writing")
      } else {
        return nil
      }
    }, $IO_check_writable$29.$$arity = 0);
    return (Opal.def(self, '$check_readable', $IO_check_readable$30 = function $$check_readable() {
      var self = this;

      if ($truthy(self['$closed_read?']())) {
        return self.$raise($$($nesting, 'IOError'), "not opened for reading")
      } else {
        return nil
      }
    }, $IO_check_readable$30.$$arity = 0), nil) && 'check_readable';
  })($nesting[0], null, $nesting);
  Opal.const_set($nesting[0], 'STDIN', ($gvars.stdin = $$($nesting, 'IO').$new(0, "r")));
  Opal.const_set($nesting[0], 'STDOUT', ($gvars.stdout = $$($nesting, 'IO').$new(1, "w")));
  Opal.const_set($nesting[0], 'STDERR', ($gvars.stderr = $$($nesting, 'IO').$new(2, "w")));
  var console = Opal.global.console;
  
  $writer = [typeof(process) === 'object' && typeof(process.stdout) === 'object' ? function(s){process.stdout.write(s)} : function(s){console.log(s)}];
  $send($$($nesting, 'STDOUT'), 'write_proc=', Opal.to_a($writer));
  $writer[$rb_minus($writer["length"], 1)];;
  
  $writer = [typeof(process) === 'object' && typeof(process.stderr) === 'object' ? function(s){process.stderr.write(s)} : function(s){console.warn(s)}];
  $send($$($nesting, 'STDERR'), 'write_proc=', Opal.to_a($writer));
  $writer[$rb_minus($writer["length"], 1)];;
  
  $writer = [function(s) { var p = prompt(); if (p !== null) return p + "\n"; return nil; }];
  $send($$($nesting, 'STDIN'), 'read_proc=', Opal.to_a($writer));
  return $writer[$rb_minus($writer["length"], 1)];;
};

Opal.modules["opal/regexp_anchors"] = function(Opal) {/* Generated by Opal 1.3.0 */
  var self = Opal.top, $nesting = [], nil = Opal.nil, $$$ = Opal.$$$, $$ = Opal.$$, $module = Opal.module;

  Opal.add_stubs(['$new']);
  return (function($base, $parent_nesting) {
    var self = $module($base, 'Opal');

    var $nesting = [self].concat($parent_nesting);

    
    Opal.const_set($nesting[0], 'REGEXP_START', "^");
    Opal.const_set($nesting[0], 'REGEXP_END', "$");
    Opal.const_set($nesting[0], 'FORBIDDEN_STARTING_IDENTIFIER_CHARS', "\\u0001-\\u002F\\u003A-\\u0040\\u005B-\\u005E\\u0060\\u007B-\\u007F");
    Opal.const_set($nesting[0], 'FORBIDDEN_ENDING_IDENTIFIER_CHARS', "\\u0001-\\u0020\\u0022-\\u002F\\u003A-\\u003E\\u0040\\u005B-\\u005E\\u0060\\u007B-\\u007F");
    Opal.const_set($nesting[0], 'INLINE_IDENTIFIER_REGEXP', $$($nesting, 'Regexp').$new("" + "[^" + ($$($nesting, 'FORBIDDEN_STARTING_IDENTIFIER_CHARS')) + "]*[^" + ($$($nesting, 'FORBIDDEN_ENDING_IDENTIFIER_CHARS')) + "]"));
    Opal.const_set($nesting[0], 'FORBIDDEN_CONST_NAME_CHARS', "\\u0001-\\u0020\\u0021-\\u002F\\u003B-\\u003F\\u0040\\u005B-\\u005E\\u0060\\u007B-\\u007F");
    return Opal.const_set($nesting[0], 'CONST_NAME_REGEXP', $$($nesting, 'Regexp').$new("" + ($$($nesting, 'REGEXP_START')) + "(::)?[A-Z][^" + ($$($nesting, 'FORBIDDEN_CONST_NAME_CHARS')) + "]*" + ($$($nesting, 'REGEXP_END'))));
  })($nesting[0], $nesting)
};

Opal.modules["opal/mini"] = function(Opal) {/* Generated by Opal 1.3.0 */
  var self = Opal.top, $nesting = [], nil = Opal.nil, $$$ = Opal.$$$, $$ = Opal.$$;

  Opal.add_stubs(['$require']);
  
  self.$require("opal/base");
  self.$require("corelib/nil");
  self.$require("corelib/boolean");
  self.$require("corelib/string");
  self.$require("corelib/comparable");
  self.$require("corelib/enumerable");
  self.$require("corelib/enumerator");
  self.$require("corelib/array");
  self.$require("corelib/hash");
  self.$require("corelib/number");
  self.$require("corelib/range");
  self.$require("corelib/proc");
  self.$require("corelib/method");
  self.$require("corelib/regexp");
  self.$require("corelib/variables");
  self.$require("corelib/io");
  return self.$require("opal/regexp_anchors");
};

Opal.modules["corelib/main"] = function(Opal) {/* Generated by Opal 1.3.0 */
  var $to_s$1, $include$2, $autoload$3, $using$4, self = Opal.top, $nesting = [], nil = Opal.nil, $$$ = Opal.$$$, $$ = Opal.$$, $send = Opal.send;

  Opal.add_stubs(['$include', '$autoload', '$raise']);
  
  Opal.defs(self, '$to_s', $to_s$1 = function $$to_s() {
    var self = this;

    return "main"
  }, $to_s$1.$$arity = 0);
  Opal.defs(self, '$include', $include$2 = function $$include(mod) {
    var self = this;

    return $$($nesting, 'Object').$include(mod)
  }, $include$2.$$arity = 1);
  Opal.defs(self, '$autoload', $autoload$3 = function $$autoload($a) {
    var $post_args, args, self = this;

    
    
    $post_args = Opal.slice.call(arguments, 0, arguments.length);
    
    args = $post_args;;
    return $send($$($nesting, 'Object'), 'autoload', Opal.to_a(args));
  }, $autoload$3.$$arity = -1);
  return (Opal.defs(self, '$using', $using$4 = function $$using(mod) {
    var self = this;

    return self.$raise("main.using is permitted only at toplevel")
  }, $using$4.$$arity = 1), nil) && 'using';
};

Opal.modules["corelib/kernel/format"] = function(Opal) {/* Generated by Opal 1.3.0 */
  var self = Opal.top, $nesting = [], nil = Opal.nil, $$$ = Opal.$$$, $$ = Opal.$$, $coerce_to = Opal.coerce_to, $module = Opal.module, $truthy = Opal.truthy, $gvars = Opal.gvars, $alias = Opal.alias;

  Opal.add_stubs(['$==', '$length', '$respond_to?', '$[]', '$coerce_to?', '$nil?', '$to_a', '$raise', '$to_int', '$fetch', '$Integer', '$Float', '$to_ary', '$to_str', '$inspect', '$to_s']);
  return (function($base, $parent_nesting) {
    var self = $module($base, 'Kernel');

    var $nesting = [self].concat($parent_nesting), $Kernel_format$1;

    
    
    Opal.def(self, '$format', $Kernel_format$1 = function $$format(format_string, $a) {
      var $post_args, args, self = this, $ret_or_1 = nil, ary = nil;
      if ($gvars.DEBUG == null) $gvars.DEBUG = nil;

      
      
      $post_args = Opal.slice.call(arguments, 1, arguments.length);
      
      args = $post_args;;
      if ($truthy((function() {if ($truthy(($ret_or_1 = args.$length()['$=='](1)))) {
        return args['$[]'](0)['$respond_to?']("to_ary")
      } else {
        return $ret_or_1
      }; return nil; })())) {
        
        ary = $$($nesting, 'Opal')['$coerce_to?'](args['$[]'](0), $$($nesting, 'Array'), "to_ary");
        if ($truthy(ary['$nil?']())) {
        } else {
          args = ary.$to_a()
        };};
      
      var result = '',
          //used for slicing:
          begin_slice = 0,
          end_slice,
          //used for iterating over the format string:
          i,
          len = format_string.length,
          //used for processing field values:
          arg,
          str,
          //used for processing %g and %G fields:
          exponent,
          //used for keeping track of width and precision:
          width,
          precision,
          //used for holding temporary values:
          tmp_num,
          //used for processing %{} and %<> fileds:
          hash_parameter_key,
          closing_brace_char,
          //used for processing %b, %B, %o, %x, and %X fields:
          base_number,
          base_prefix,
          base_neg_zero_regex,
          base_neg_zero_digit,
          //used for processing arguments:
          next_arg,
          seq_arg_num = 1,
          pos_arg_num = 0,
          //used for keeping track of flags:
          flags,
          FNONE  = 0,
          FSHARP = 1,
          FMINUS = 2,
          FPLUS  = 4,
          FZERO  = 8,
          FSPACE = 16,
          FWIDTH = 32,
          FPREC  = 64,
          FPREC0 = 128;

      function CHECK_FOR_FLAGS() {
        if (flags&FWIDTH) { self.$raise($$($nesting, 'ArgumentError'), "flag after width") }
        if (flags&FPREC0) { self.$raise($$($nesting, 'ArgumentError'), "flag after precision") }
      }

      function CHECK_FOR_WIDTH() {
        if (flags&FWIDTH) { self.$raise($$($nesting, 'ArgumentError'), "width given twice") }
        if (flags&FPREC0) { self.$raise($$($nesting, 'ArgumentError'), "width after precision") }
      }

      function GET_NTH_ARG(num) {
        if (num >= args.length) { self.$raise($$($nesting, 'ArgumentError'), "too few arguments") }
        return args[num];
      }

      function GET_NEXT_ARG() {
        switch (pos_arg_num) {
        case -1: self.$raise($$($nesting, 'ArgumentError'), "" + "unnumbered(" + (seq_arg_num) + ") mixed with numbered") // raise
        case -2: self.$raise($$($nesting, 'ArgumentError'), "" + "unnumbered(" + (seq_arg_num) + ") mixed with named") // raise
        }
        pos_arg_num = seq_arg_num++;
        return GET_NTH_ARG(pos_arg_num - 1);
      }

      function GET_POS_ARG(num) {
        if (pos_arg_num > 0) {
          self.$raise($$($nesting, 'ArgumentError'), "" + "numbered(" + (num) + ") after unnumbered(" + (pos_arg_num) + ")")
        }
        if (pos_arg_num === -2) {
          self.$raise($$($nesting, 'ArgumentError'), "" + "numbered(" + (num) + ") after named")
        }
        if (num < 1) {
          self.$raise($$($nesting, 'ArgumentError'), "" + "invalid index - " + (num) + "$")
        }
        pos_arg_num = -1;
        return GET_NTH_ARG(num - 1);
      }

      function GET_ARG() {
        return (next_arg === undefined ? GET_NEXT_ARG() : next_arg);
      }

      function READ_NUM(label) {
        var num, str = '';
        for (;; i++) {
          if (i === len) {
            self.$raise($$($nesting, 'ArgumentError'), "malformed format string - %*[0-9]")
          }
          if (format_string.charCodeAt(i) < 48 || format_string.charCodeAt(i) > 57) {
            i--;
            num = parseInt(str, 10) || 0;
            if (num > 2147483647) {
              self.$raise($$($nesting, 'ArgumentError'), "" + (label) + " too big")
            }
            return num;
          }
          str += format_string.charAt(i);
        }
      }

      function READ_NUM_AFTER_ASTER(label) {
        var arg, num = READ_NUM(label);
        if (format_string.charAt(i + 1) === '$') {
          i++;
          arg = GET_POS_ARG(num);
        } else {
          arg = GET_NEXT_ARG();
        }
        return (arg).$to_int();
      }

      for (i = format_string.indexOf('%'); i !== -1; i = format_string.indexOf('%', i)) {
        str = undefined;

        flags = FNONE;
        width = -1;
        precision = -1;
        next_arg = undefined;

        end_slice = i;

        i++;

        switch (format_string.charAt(i)) {
        case '%':
          begin_slice = i;
          // no-break
        case '':
        case '\n':
        case '\0':
          i++;
          continue;
        }

        format_sequence: for (; i < len; i++) {
          switch (format_string.charAt(i)) {

          case ' ':
            CHECK_FOR_FLAGS();
            flags |= FSPACE;
            continue format_sequence;

          case '#':
            CHECK_FOR_FLAGS();
            flags |= FSHARP;
            continue format_sequence;

          case '+':
            CHECK_FOR_FLAGS();
            flags |= FPLUS;
            continue format_sequence;

          case '-':
            CHECK_FOR_FLAGS();
            flags |= FMINUS;
            continue format_sequence;

          case '0':
            CHECK_FOR_FLAGS();
            flags |= FZERO;
            continue format_sequence;

          case '1':
          case '2':
          case '3':
          case '4':
          case '5':
          case '6':
          case '7':
          case '8':
          case '9':
            tmp_num = READ_NUM('width');
            if (format_string.charAt(i + 1) === '$') {
              if (i + 2 === len) {
                str = '%';
                i++;
                break format_sequence;
              }
              if (next_arg !== undefined) {
                self.$raise($$($nesting, 'ArgumentError'), "" + "value given twice - %" + (tmp_num) + "$")
              }
              next_arg = GET_POS_ARG(tmp_num);
              i++;
            } else {
              CHECK_FOR_WIDTH();
              flags |= FWIDTH;
              width = tmp_num;
            }
            continue format_sequence;

          case '<':
          case '\{':
            closing_brace_char = (format_string.charAt(i) === '<' ? '>' : '\}');
            hash_parameter_key = '';

            i++;

            for (;; i++) {
              if (i === len) {
                self.$raise($$($nesting, 'ArgumentError'), "malformed name - unmatched parenthesis")
              }
              if (format_string.charAt(i) === closing_brace_char) {

                if (pos_arg_num > 0) {
                  self.$raise($$($nesting, 'ArgumentError'), "" + "named " + (hash_parameter_key) + " after unnumbered(" + (pos_arg_num) + ")")
                }
                if (pos_arg_num === -1) {
                  self.$raise($$($nesting, 'ArgumentError'), "" + "named " + (hash_parameter_key) + " after numbered")
                }
                pos_arg_num = -2;

                if (args[0] === undefined || !args[0].$$is_hash) {
                  self.$raise($$($nesting, 'ArgumentError'), "one hash required")
                }

                next_arg = (args[0]).$fetch(hash_parameter_key);

                if (closing_brace_char === '>') {
                  continue format_sequence;
                } else {
                  str = next_arg.toString();
                  if (precision !== -1) { str = str.slice(0, precision); }
                  if (flags&FMINUS) {
                    while (str.length < width) { str = str + ' '; }
                  } else {
                    while (str.length < width) { str = ' ' + str; }
                  }
                  break format_sequence;
                }
              }
              hash_parameter_key += format_string.charAt(i);
            }
            // raise

          case '*':
            i++;
            CHECK_FOR_WIDTH();
            flags |= FWIDTH;
            width = READ_NUM_AFTER_ASTER('width');
            if (width < 0) {
              flags |= FMINUS;
              width = -width;
            }
            continue format_sequence;

          case '.':
            if (flags&FPREC0) {
              self.$raise($$($nesting, 'ArgumentError'), "precision given twice")
            }
            flags |= FPREC|FPREC0;
            precision = 0;
            i++;
            if (format_string.charAt(i) === '*') {
              i++;
              precision = READ_NUM_AFTER_ASTER('precision');
              if (precision < 0) {
                flags &= ~FPREC;
              }
              continue format_sequence;
            }
            precision = READ_NUM('precision');
            continue format_sequence;

          case 'd':
          case 'i':
          case 'u':
            arg = self.$Integer(GET_ARG());
            if (arg >= 0) {
              str = arg.toString();
              while (str.length < precision) { str = '0' + str; }
              if (flags&FMINUS) {
                if (flags&FPLUS || flags&FSPACE) { str = (flags&FPLUS ? '+' : ' ') + str; }
                while (str.length < width) { str = str + ' '; }
              } else {
                if (flags&FZERO && precision === -1) {
                  while (str.length < width - ((flags&FPLUS || flags&FSPACE) ? 1 : 0)) { str = '0' + str; }
                  if (flags&FPLUS || flags&FSPACE) { str = (flags&FPLUS ? '+' : ' ') + str; }
                } else {
                  if (flags&FPLUS || flags&FSPACE) { str = (flags&FPLUS ? '+' : ' ') + str; }
                  while (str.length < width) { str = ' ' + str; }
                }
              }
            } else {
              str = (-arg).toString();
              while (str.length < precision) { str = '0' + str; }
              if (flags&FMINUS) {
                str = '-' + str;
                while (str.length < width) { str = str + ' '; }
              } else {
                if (flags&FZERO && precision === -1) {
                  while (str.length < width - 1) { str = '0' + str; }
                  str = '-' + str;
                } else {
                  str = '-' + str;
                  while (str.length < width) { str = ' ' + str; }
                }
              }
            }
            break format_sequence;

          case 'b':
          case 'B':
          case 'o':
          case 'x':
          case 'X':
            switch (format_string.charAt(i)) {
            case 'b':
            case 'B':
              base_number = 2;
              base_prefix = '0b';
              base_neg_zero_regex = /^1+/;
              base_neg_zero_digit = '1';
              break;
            case 'o':
              base_number = 8;
              base_prefix = '0';
              base_neg_zero_regex = /^3?7+/;
              base_neg_zero_digit = '7';
              break;
            case 'x':
            case 'X':
              base_number = 16;
              base_prefix = '0x';
              base_neg_zero_regex = /^f+/;
              base_neg_zero_digit = 'f';
              break;
            }
            arg = self.$Integer(GET_ARG());
            if (arg >= 0) {
              str = arg.toString(base_number);
              while (str.length < precision) { str = '0' + str; }
              if (flags&FMINUS) {
                if (flags&FPLUS || flags&FSPACE) { str = (flags&FPLUS ? '+' : ' ') + str; }
                if (flags&FSHARP && arg !== 0) { str = base_prefix + str; }
                while (str.length < width) { str = str + ' '; }
              } else {
                if (flags&FZERO && precision === -1) {
                  while (str.length < width - ((flags&FPLUS || flags&FSPACE) ? 1 : 0) - ((flags&FSHARP && arg !== 0) ? base_prefix.length : 0)) { str = '0' + str; }
                  if (flags&FSHARP && arg !== 0) { str = base_prefix + str; }
                  if (flags&FPLUS || flags&FSPACE) { str = (flags&FPLUS ? '+' : ' ') + str; }
                } else {
                  if (flags&FSHARP && arg !== 0) { str = base_prefix + str; }
                  if (flags&FPLUS || flags&FSPACE) { str = (flags&FPLUS ? '+' : ' ') + str; }
                  while (str.length < width) { str = ' ' + str; }
                }
              }
            } else {
              if (flags&FPLUS || flags&FSPACE) {
                str = (-arg).toString(base_number);
                while (str.length < precision) { str = '0' + str; }
                if (flags&FMINUS) {
                  if (flags&FSHARP) { str = base_prefix + str; }
                  str = '-' + str;
                  while (str.length < width) { str = str + ' '; }
                } else {
                  if (flags&FZERO && precision === -1) {
                    while (str.length < width - 1 - (flags&FSHARP ? 2 : 0)) { str = '0' + str; }
                    if (flags&FSHARP) { str = base_prefix + str; }
                    str = '-' + str;
                  } else {
                    if (flags&FSHARP) { str = base_prefix + str; }
                    str = '-' + str;
                    while (str.length < width) { str = ' ' + str; }
                  }
                }
              } else {
                str = (arg >>> 0).toString(base_number).replace(base_neg_zero_regex, base_neg_zero_digit);
                while (str.length < precision - 2) { str = base_neg_zero_digit + str; }
                if (flags&FMINUS) {
                  str = '..' + str;
                  if (flags&FSHARP) { str = base_prefix + str; }
                  while (str.length < width) { str = str + ' '; }
                } else {
                  if (flags&FZERO && precision === -1) {
                    while (str.length < width - 2 - (flags&FSHARP ? base_prefix.length : 0)) { str = base_neg_zero_digit + str; }
                    str = '..' + str;
                    if (flags&FSHARP) { str = base_prefix + str; }
                  } else {
                    str = '..' + str;
                    if (flags&FSHARP) { str = base_prefix + str; }
                    while (str.length < width) { str = ' ' + str; }
                  }
                }
              }
            }
            if (format_string.charAt(i) === format_string.charAt(i).toUpperCase()) {
              str = str.toUpperCase();
            }
            break format_sequence;

          case 'f':
          case 'e':
          case 'E':
          case 'g':
          case 'G':
            arg = self.$Float(GET_ARG());
            if (arg >= 0 || isNaN(arg)) {
              if (arg === Infinity) {
                str = 'Inf';
              } else {
                switch (format_string.charAt(i)) {
                case 'f':
                  str = arg.toFixed(precision === -1 ? 6 : precision);
                  break;
                case 'e':
                case 'E':
                  str = arg.toExponential(precision === -1 ? 6 : precision);
                  break;
                case 'g':
                case 'G':
                  str = arg.toExponential();
                  exponent = parseInt(str.split('e')[1], 10);
                  if (!(exponent < -4 || exponent >= (precision === -1 ? 6 : precision))) {
                    str = arg.toPrecision(precision === -1 ? (flags&FSHARP ? 6 : undefined) : precision);
                  }
                  break;
                }
              }
              if (flags&FMINUS) {
                if (flags&FPLUS || flags&FSPACE) { str = (flags&FPLUS ? '+' : ' ') + str; }
                while (str.length < width) { str = str + ' '; }
              } else {
                if (flags&FZERO && arg !== Infinity && !isNaN(arg)) {
                  while (str.length < width - ((flags&FPLUS || flags&FSPACE) ? 1 : 0)) { str = '0' + str; }
                  if (flags&FPLUS || flags&FSPACE) { str = (flags&FPLUS ? '+' : ' ') + str; }
                } else {
                  if (flags&FPLUS || flags&FSPACE) { str = (flags&FPLUS ? '+' : ' ') + str; }
                  while (str.length < width) { str = ' ' + str; }
                }
              }
            } else {
              if (arg === -Infinity) {
                str = 'Inf';
              } else {
                switch (format_string.charAt(i)) {
                case 'f':
                  str = (-arg).toFixed(precision === -1 ? 6 : precision);
                  break;
                case 'e':
                case 'E':
                  str = (-arg).toExponential(precision === -1 ? 6 : precision);
                  break;
                case 'g':
                case 'G':
                  str = (-arg).toExponential();
                  exponent = parseInt(str.split('e')[1], 10);
                  if (!(exponent < -4 || exponent >= (precision === -1 ? 6 : precision))) {
                    str = (-arg).toPrecision(precision === -1 ? (flags&FSHARP ? 6 : undefined) : precision);
                  }
                  break;
                }
              }
              if (flags&FMINUS) {
                str = '-' + str;
                while (str.length < width) { str = str + ' '; }
              } else {
                if (flags&FZERO && arg !== -Infinity) {
                  while (str.length < width - 1) { str = '0' + str; }
                  str = '-' + str;
                } else {
                  str = '-' + str;
                  while (str.length < width) { str = ' ' + str; }
                }
              }
            }
            if (format_string.charAt(i) === format_string.charAt(i).toUpperCase() && arg !== Infinity && arg !== -Infinity && !isNaN(arg)) {
              str = str.toUpperCase();
            }
            str = str.replace(/([eE][-+]?)([0-9])$/, '$10$2');
            break format_sequence;

          case 'a':
          case 'A':
            // Not implemented because there are no specs for this field type.
            self.$raise($$($nesting, 'NotImplementedError'), "`A` and `a` format field types are not implemented in Opal yet")
            // raise

          case 'c':
            arg = GET_ARG();
            if ((arg)['$respond_to?']("to_ary")) { arg = (arg).$to_ary()[0]; }
            if ((arg)['$respond_to?']("to_str")) {
              str = (arg).$to_str();
            } else {
              str = String.fromCharCode($coerce_to(arg, $$($nesting, 'Integer'), 'to_int'));
            }
            if (str.length !== 1) {
              self.$raise($$($nesting, 'ArgumentError'), "%c requires a character")
            }
            if (flags&FMINUS) {
              while (str.length < width) { str = str + ' '; }
            } else {
              while (str.length < width) { str = ' ' + str; }
            }
            break format_sequence;

          case 'p':
            str = (GET_ARG()).$inspect();
            if (precision !== -1) { str = str.slice(0, precision); }
            if (flags&FMINUS) {
              while (str.length < width) { str = str + ' '; }
            } else {
              while (str.length < width) { str = ' ' + str; }
            }
            break format_sequence;

          case 's':
            str = (GET_ARG()).$to_s();
            if (precision !== -1) { str = str.slice(0, precision); }
            if (flags&FMINUS) {
              while (str.length < width) { str = str + ' '; }
            } else {
              while (str.length < width) { str = ' ' + str; }
            }
            break format_sequence;

          default:
            self.$raise($$($nesting, 'ArgumentError'), "" + "malformed format string - %" + (format_string.charAt(i)))
          }
        }

        if (str === undefined) {
          self.$raise($$($nesting, 'ArgumentError'), "malformed format string - %")
        }

        result += format_string.slice(begin_slice, end_slice) + str;
        begin_slice = i + 1;
      }

      if ($gvars.DEBUG && pos_arg_num >= 0 && seq_arg_num < args.length) {
        self.$raise($$($nesting, 'ArgumentError'), "too many arguments for format string")
      }

      return result + format_string.slice(begin_slice);
    ;
    }, $Kernel_format$1.$$arity = -2);
    return $alias(self, "sprintf", "format");
  })($nesting[0], $nesting)
};

Opal.modules["corelib/string/encoding"] = function(Opal) {/* Generated by Opal 1.3.0 */
  function $rb_plus(lhs, rhs) {
    return (typeof(lhs) === 'number' && typeof(rhs) === 'number') ? lhs + rhs : lhs['$+'](rhs);
  }
  function $rb_lt(lhs, rhs) {
    return (typeof(lhs) === 'number' && typeof(rhs) === 'number') ? lhs < rhs : lhs['$<'](rhs);
  }
  function $rb_minus(lhs, rhs) {
    return (typeof(lhs) === 'number' && typeof(rhs) === 'number') ? lhs - rhs : lhs['$-'](rhs);
  }
  var $$14, $$17, $$20, $$22, $$25, $$27, self = Opal.top, $nesting = [], nil = Opal.nil, $$$ = Opal.$$$, $$ = Opal.$$, $klass = Opal.klass, $hash2 = Opal.hash2, $truthy = Opal.truthy, $send = Opal.send, $alias = Opal.alias, $writer = nil;

  Opal.add_stubs(['$require', '$+', '$[]', '$clone', '$initialize', '$new', '$instance_eval', '$to_proc', '$each', '$const_set', '$tr', '$==', '$default_external', '$attr_accessor', '$singleton_class', '$attr_reader', '$raise', '$register', '$length', '$bytes', '$force_encoding', '$dup', '$bytesize', '$enum_for', '$each_byte', '$to_a', '$each_char', '$each_codepoint', '$coerce_to!', '$find', '$<', '$default_external=', '$-']);
  
  self.$require("corelib/string");
  (function($base, $super, $parent_nesting) {
    var self = $klass($base, $super, 'Encoding');

    var $nesting = [self].concat($parent_nesting), $Encoding_register$1, $Encoding_find$3, $Encoding_initialize$4, $Encoding_ascii_compatible$ques$5, $Encoding_dummy$ques$6, $Encoding_binary$ques$7, $Encoding_to_s$8, $Encoding_inspect$9, $Encoding_charsize$10, $Encoding_each_char$11, $Encoding_each_byte$12, $Encoding_bytesize$13;

    self.$$prototype.ascii = self.$$prototype.dummy = self.$$prototype.name = nil;
    
    Opal.defs(self, '$register', $Encoding_register$1 = function $$register(name, options) {
      var $iter = $Encoding_register$1.$$p, block = $iter || nil, $$2, self = this, names = nil, $ret_or_1 = nil, ascii = nil, $ret_or_2 = nil, dummy = nil, $ret_or_3 = nil, encoding = nil, register = nil;

      if ($iter) $Encoding_register$1.$$p = null;
      
      
      if ($iter) $Encoding_register$1.$$p = null;;
      
      if (options == null) {
        options = $hash2([], {});
      };
      names = $rb_plus([name], (function() {if ($truthy(($ret_or_1 = options['$[]']("aliases")))) {
        return $ret_or_1
      } else {
        return []
      }; return nil; })());
      ascii = (function() {if ($truthy(($ret_or_2 = options['$[]']("ascii")))) {
        return $ret_or_2
      } else {
        return false
      }; return nil; })();
      dummy = (function() {if ($truthy(($ret_or_3 = options['$[]']("dummy")))) {
        return $ret_or_3
      } else {
        return false
      }; return nil; })();
      if ($truthy(options['$[]']("inherits"))) {
        
        encoding = options['$[]']("inherits").$clone();
        encoding.$initialize(name, names, ascii, dummy);
      } else {
        encoding = self.$new(name, names, ascii, dummy)
      };
      if ((block !== nil)) {
        $send(encoding, 'instance_eval', [], block.$to_proc())};
      register = Opal.encodings;
      return $send(names, 'each', [], ($$2 = function(encoding_name){var self = $$2.$$s == null ? this : $$2.$$s;

        
        
        if (encoding_name == null) {
          encoding_name = nil;
        };
        self.$const_set(encoding_name.$tr("-", "_"), encoding);
        return register[encoding_name] = encoding;}, $$2.$$s = self, $$2.$$arity = 1, $$2));
    }, $Encoding_register$1.$$arity = -2);
    Opal.defs(self, '$find', $Encoding_find$3 = function $$find(name) {
      var self = this;

      
      if (name['$==']("default_external")) {
        return self.$default_external()};
      return Opal.find_encoding(name);;
    }, $Encoding_find$3.$$arity = 1);
    self.$singleton_class().$attr_accessor("default_external");
    self.$attr_reader("name", "names");
    
    Opal.def(self, '$initialize', $Encoding_initialize$4 = function $$initialize(name, names, ascii, dummy) {
      var self = this;

      
      self.name = name;
      self.names = names;
      self.ascii = ascii;
      return (self.dummy = dummy);
    }, $Encoding_initialize$4.$$arity = 4);
    
    Opal.def(self, '$ascii_compatible?', $Encoding_ascii_compatible$ques$5 = function() {
      var self = this;

      return self.ascii
    }, $Encoding_ascii_compatible$ques$5.$$arity = 0);
    
    Opal.def(self, '$dummy?', $Encoding_dummy$ques$6 = function() {
      var self = this;

      return self.dummy
    }, $Encoding_dummy$ques$6.$$arity = 0);
    
    Opal.def(self, '$binary?', $Encoding_binary$ques$7 = function() {
      var self = this;

      return false
    }, $Encoding_binary$ques$7.$$arity = 0);
    
    Opal.def(self, '$to_s', $Encoding_to_s$8 = function $$to_s() {
      var self = this;

      return self.name
    }, $Encoding_to_s$8.$$arity = 0);
    
    Opal.def(self, '$inspect', $Encoding_inspect$9 = function $$inspect() {
      var self = this;

      return "" + "#<Encoding:" + (self.name) + ((function() {if ($truthy(self.dummy)) {
        return " (dummy)"
      } else {
        return nil
      }; return nil; })()) + ">"
    }, $Encoding_inspect$9.$$arity = 0);
    
    Opal.def(self, '$charsize', $Encoding_charsize$10 = function $$charsize(string) {
      var self = this;

      
      var len = 0;
      for (var i = 0, length = string.length; i < length; i++) {
        var charcode = string.charCodeAt(i);
        if (!(charcode >= 0xD800 && charcode <= 0xDBFF)) {
          len++;
        }
      }
      return len;
    
    }, $Encoding_charsize$10.$$arity = 1);
    
    Opal.def(self, '$each_char', $Encoding_each_char$11 = function $$each_char(string) {
      var $iter = $Encoding_each_char$11.$$p, block = $iter || nil, self = this;

      if ($iter) $Encoding_each_char$11.$$p = null;
      
      
      if ($iter) $Encoding_each_char$11.$$p = null;;
      
      var low_surrogate = "";
      for (var i = 0, length = string.length; i < length; i++) {
        var charcode = string.charCodeAt(i);
        var chr = string.charAt(i);
        if (charcode >= 0xDC00 && charcode <= 0xDFFF) {
          low_surrogate = chr;
          continue;
        }
        else if (charcode >= 0xD800 && charcode <= 0xDBFF) {
          chr = low_surrogate + chr;
        }
        if (string.encoding.name != "UTF-8") {
          chr = new String(chr);
          chr.encoding = string.encoding;
        }
        Opal.yield1(block, chr);
      }
    ;
    }, $Encoding_each_char$11.$$arity = 1);
    
    Opal.def(self, '$each_byte', $Encoding_each_byte$12 = function $$each_byte($a) {
      var $post_args, $rest_arg, self = this;

      
      
      $post_args = Opal.slice.call(arguments, 0, arguments.length);
      
      $rest_arg = $post_args;;
      return self.$raise($$($nesting, 'NotImplementedError'));
    }, $Encoding_each_byte$12.$$arity = -1);
    
    Opal.def(self, '$bytesize', $Encoding_bytesize$13 = function $$bytesize($a) {
      var $post_args, $rest_arg, self = this;

      
      
      $post_args = Opal.slice.call(arguments, 0, arguments.length);
      
      $rest_arg = $post_args;;
      return self.$raise($$($nesting, 'NotImplementedError'));
    }, $Encoding_bytesize$13.$$arity = -1);
    (function($base, $super, $parent_nesting) {
      var self = $klass($base, $super, 'EncodingError');

      var $nesting = [self].concat($parent_nesting);

      return nil
    })($nesting[0], $$($nesting, 'StandardError'), $nesting);
    return (function($base, $super, $parent_nesting) {
      var self = $klass($base, $super, 'CompatibilityError');

      var $nesting = [self].concat($parent_nesting);

      return nil
    })($nesting[0], $$($nesting, 'EncodingError'), $nesting);
  })($nesting[0], null, $nesting);
  $send($$($nesting, 'Encoding'), 'register', ["UTF-8", $hash2(["aliases", "ascii"], {"aliases": ["CP65001"], "ascii": true})], ($$14 = function(){var self = $$14.$$s == null ? this : $$14.$$s, $each_byte$15, $bytesize$16;

    
    
    Opal.def(self, '$each_byte', $each_byte$15 = function $$each_byte(string) {
      var $iter = $each_byte$15.$$p, block = $iter || nil, self = this;

      if ($iter) $each_byte$15.$$p = null;
      
      
      if ($iter) $each_byte$15.$$p = null;;
      
      // Taken from: https://github.com/feross/buffer/blob/f52dffd9df0445b93c0c9065c2f8f0f46b2c729a/index.js#L1954-L2032
      var units = Infinity;
      var codePoint;
      var length = string.length;
      var leadSurrogate = null;

      for (var i = 0; i < length; ++i) {
        codePoint = string.charCodeAt(i);

        // is surrogate component
        if (codePoint > 0xD7FF && codePoint < 0xE000) {
          // last char was a lead
          if (!leadSurrogate) {
            // no lead yet
            if (codePoint > 0xDBFF) {
              // unexpected trail
              if ((units -= 3) > -1) {
                Opal.yield1(block, 0xEF);
                Opal.yield1(block, 0xBF);
                Opal.yield1(block, 0xBD);
              }
              continue;
            } else if (i + 1 === length) {
              // unpaired lead
              if ((units -= 3) > -1) {
                Opal.yield1(block, 0xEF);
                Opal.yield1(block, 0xBF);
                Opal.yield1(block, 0xBD);
              }
              continue;
            }

            // valid lead
            leadSurrogate = codePoint;

            continue;
          }

          // 2 leads in a row
          if (codePoint < 0xDC00) {
            if ((units -= 3) > -1) {
              Opal.yield1(block, 0xEF);
              Opal.yield1(block, 0xBF);
              Opal.yield1(block, 0xBD);
            }
            leadSurrogate = codePoint;
            continue;
          }

          // valid surrogate pair
          codePoint = (leadSurrogate - 0xD800 << 10 | codePoint - 0xDC00) + 0x10000;
        } else if (leadSurrogate) {
          // valid bmp char, but last char was a lead
          if ((units -= 3) > -1) {
            Opal.yield1(block, 0xEF);
            Opal.yield1(block, 0xBF);
            Opal.yield1(block, 0xBD);
          }
        }

        leadSurrogate = null;

        // encode utf8
        if (codePoint < 0x80) {
          if ((units -= 1) < 0) break;
          Opal.yield1(block, codePoint);
        } else if (codePoint < 0x800) {
          if ((units -= 2) < 0) break;
          Opal.yield1(block, codePoint >> 0x6 | 0xC0);
          Opal.yield1(block, codePoint & 0x3F | 0x80);
        } else if (codePoint < 0x10000) {
          if ((units -= 3) < 0) break;
          Opal.yield1(block, codePoint >> 0xC | 0xE0);
          Opal.yield1(block, codePoint >> 0x6 & 0x3F | 0x80);
          Opal.yield1(block, codePoint & 0x3F | 0x80);
        } else if (codePoint < 0x110000) {
          if ((units -= 4) < 0) break;
          Opal.yield1(block, codePoint >> 0x12 | 0xF0);
          Opal.yield1(block, codePoint >> 0xC & 0x3F | 0x80);
          Opal.yield1(block, codePoint >> 0x6 & 0x3F | 0x80);
          Opal.yield1(block, codePoint & 0x3F | 0x80);
        } else {
          // Invalid code point
        }
      }
    ;
    }, $each_byte$15.$$arity = 1);
    return (Opal.def(self, '$bytesize', $bytesize$16 = function $$bytesize(string) {
      var self = this;

      return string.$bytes().$length()
    }, $bytesize$16.$$arity = 1), nil) && 'bytesize';}, $$14.$$s = self, $$14.$$arity = 0, $$14));
  $send($$($nesting, 'Encoding'), 'register', ["UTF-16LE"], ($$17 = function(){var self = $$17.$$s == null ? this : $$17.$$s, $each_byte$18, $bytesize$19;

    
    
    Opal.def(self, '$each_byte', $each_byte$18 = function $$each_byte(string) {
      var $iter = $each_byte$18.$$p, block = $iter || nil, self = this;

      if ($iter) $each_byte$18.$$p = null;
      
      
      if ($iter) $each_byte$18.$$p = null;;
      
      for (var i = 0, length = string.length; i < length; i++) {
        var code = string.charCodeAt(i);

        Opal.yield1(block, code & 0xff);
        Opal.yield1(block, code >> 8);
      }
    ;
    }, $each_byte$18.$$arity = 1);
    return (Opal.def(self, '$bytesize', $bytesize$19 = function $$bytesize(string) {
      var self = this;

      return string.length * 2;
    }, $bytesize$19.$$arity = 1), nil) && 'bytesize';}, $$17.$$s = self, $$17.$$arity = 0, $$17));
  $send($$($nesting, 'Encoding'), 'register', ["UTF-16BE", $hash2(["inherits"], {"inherits": $$$($$($nesting, 'Encoding'), 'UTF_16LE')})], ($$20 = function(){var self = $$20.$$s == null ? this : $$20.$$s, $each_byte$21;

    return (Opal.def(self, '$each_byte', $each_byte$21 = function $$each_byte(string) {
      var $iter = $each_byte$21.$$p, block = $iter || nil, self = this;

      if ($iter) $each_byte$21.$$p = null;
      
      
      if ($iter) $each_byte$21.$$p = null;;
      
      for (var i = 0, length = string.length; i < length; i++) {
        var code = string.charCodeAt(i);

        Opal.yield1(block, code >> 8);
        Opal.yield1(block, code & 0xff);
      }
    ;
    }, $each_byte$21.$$arity = 1), nil) && 'each_byte'}, $$20.$$s = self, $$20.$$arity = 0, $$20));
  $send($$($nesting, 'Encoding'), 'register', ["UTF-32LE"], ($$22 = function(){var self = $$22.$$s == null ? this : $$22.$$s, $each_byte$23, $bytesize$24;

    
    
    Opal.def(self, '$each_byte', $each_byte$23 = function $$each_byte(string) {
      var $iter = $each_byte$23.$$p, block = $iter || nil, self = this;

      if ($iter) $each_byte$23.$$p = null;
      
      
      if ($iter) $each_byte$23.$$p = null;;
      
      for (var i = 0, length = string.length; i < length; i++) {
        var code = string.charCodeAt(i);

        Opal.yield1(block, code & 0xff);
        Opal.yield1(block, code >> 8);
        Opal.yield1(block, 0);
        Opal.yield1(block, 0);
      }
    ;
    }, $each_byte$23.$$arity = 1);
    return (Opal.def(self, '$bytesize', $bytesize$24 = function $$bytesize(string) {
      var self = this;

      return string.length * 4;
    }, $bytesize$24.$$arity = 1), nil) && 'bytesize';}, $$22.$$s = self, $$22.$$arity = 0, $$22));
  $send($$($nesting, 'Encoding'), 'register', ["UTF-32BE", $hash2(["inherits"], {"inherits": $$$($$($nesting, 'Encoding'), 'UTF_32LE')})], ($$25 = function(){var self = $$25.$$s == null ? this : $$25.$$s, $each_byte$26;

    return (Opal.def(self, '$each_byte', $each_byte$26 = function $$each_byte(string) {
      var $iter = $each_byte$26.$$p, block = $iter || nil, self = this;

      if ($iter) $each_byte$26.$$p = null;
      
      
      if ($iter) $each_byte$26.$$p = null;;
      
      for (var i = 0, length = string.length; i < length; i++) {
        var code = string.charCodeAt(i);

        Opal.yield1(block, 0);
        Opal.yield1(block, 0);
        Opal.yield1(block, code >> 8);
        Opal.yield1(block, code & 0xff);
      }
    ;
    }, $each_byte$26.$$arity = 1), nil) && 'each_byte'}, $$25.$$s = self, $$25.$$arity = 0, $$25));
  $send($$($nesting, 'Encoding'), 'register', ["ASCII-8BIT", $hash2(["aliases", "ascii"], {"aliases": ["BINARY"], "ascii": true})], ($$27 = function(){var self = $$27.$$s == null ? this : $$27.$$s, $each_char$28, $charsize$29, $each_byte$30, $bytesize$31, $binary$ques$32;

    
    
    Opal.def(self, '$each_char', $each_char$28 = function $$each_char(string) {
      var $iter = $each_char$28.$$p, block = $iter || nil, self = this;

      if ($iter) $each_char$28.$$p = null;
      
      
      if ($iter) $each_char$28.$$p = null;;
      
      for (var i = 0, length = string.length; i < length; i++) {
        var chr = new String(string.charAt(i));
        chr.encoding = string.encoding;
        Opal.yield1(block, chr);
      }
    ;
    }, $each_char$28.$$arity = 1);
    
    Opal.def(self, '$charsize', $charsize$29 = function $$charsize(string) {
      var self = this;

      return string.length;
    }, $charsize$29.$$arity = 1);
    
    Opal.def(self, '$each_byte', $each_byte$30 = function $$each_byte(string) {
      var $iter = $each_byte$30.$$p, block = $iter || nil, self = this;

      if ($iter) $each_byte$30.$$p = null;
      
      
      if ($iter) $each_byte$30.$$p = null;;
      
      for (var i = 0, length = string.length; i < length; i++) {
        var code = string.charCodeAt(i);
        Opal.yield1(block, code & 0xff);
      }
    ;
    }, $each_byte$30.$$arity = 1);
    
    Opal.def(self, '$bytesize', $bytesize$31 = function $$bytesize(string) {
      var self = this;

      return string.length;
    }, $bytesize$31.$$arity = 1);
    return (Opal.def(self, '$binary?', $binary$ques$32 = function() {
      var self = this;

      return true
    }, $binary$ques$32.$$arity = 0), nil) && 'binary?';}, $$27.$$s = self, $$27.$$arity = 0, $$27));
  $$($nesting, 'Encoding').$register("ISO-8859-1", $hash2(["aliases", "ascii", "inherits"], {"aliases": ["ISO8859-1"], "ascii": true, "inherits": $$$($$($nesting, 'Encoding'), 'ASCII_8BIT')}));
  $$($nesting, 'Encoding').$register("US-ASCII", $hash2(["aliases", "ascii", "inherits"], {"aliases": ["ASCII"], "ascii": true, "inherits": $$$($$($nesting, 'Encoding'), 'ASCII_8BIT')}));
  (function($base, $super, $parent_nesting) {
    var self = $klass($base, $super, 'String');

    var $nesting = [self].concat($parent_nesting), $String_b$33, $String_bytesize$34, $String_each_byte$35, $String_bytes$37, $String_each_char$38, $String_chars$40, $String_each_codepoint$41, $String_codepoints$42, $String_encode$43, $String_force_encoding$44, $String_getbyte$45, $String_initialize_copy$46, $String_length$47, $String_valid_encoding$ques$48;

    self.$$prototype.internal_encoding = self.$$prototype.bytes = self.$$prototype.encoding = nil;
    
    self.$attr_reader("encoding");
    self.$attr_reader("internal_encoding");
    Opal.defineProperty(String.prototype, 'bytes', nil);
    Opal.defineProperty(String.prototype, 'encoding', $$$($$($nesting, 'Encoding'), 'UTF_8'));
    Opal.defineProperty(String.prototype, 'internal_encoding', $$$($$($nesting, 'Encoding'), 'UTF_8'));
    
    Opal.def(self, '$b', $String_b$33 = function $$b() {
      var self = this;

      return self.$dup().$force_encoding("binary")
    }, $String_b$33.$$arity = 0);
    
    Opal.def(self, '$bytesize', $String_bytesize$34 = function $$bytesize() {
      var self = this;

      return self.internal_encoding.$bytesize(self)
    }, $String_bytesize$34.$$arity = 0);
    
    Opal.def(self, '$each_byte', $String_each_byte$35 = function $$each_byte() {
      var $iter = $String_each_byte$35.$$p, block = $iter || nil, $$36, self = this;

      if ($iter) $String_each_byte$35.$$p = null;
      
      
      if ($iter) $String_each_byte$35.$$p = null;;
      if ((block !== nil)) {
      } else {
        return $send(self, 'enum_for', ["each_byte"], ($$36 = function(){var self = $$36.$$s == null ? this : $$36.$$s;

          return self.$bytesize()}, $$36.$$s = self, $$36.$$arity = 0, $$36))
      };
      $send(self.internal_encoding, 'each_byte', [self], block.$to_proc());
      return self;
    }, $String_each_byte$35.$$arity = 0);
    
    Opal.def(self, '$bytes', $String_bytes$37 = function $$bytes() {
      var self = this, $ret_or_4 = nil;

      
      
      if (typeof self === 'string') {
        return (new String(self)).$each_byte().$to_a();
      }
    ;
      self.bytes = (function() {if ($truthy(($ret_or_4 = self.bytes))) {
        return $ret_or_4
      } else {
        return self.$each_byte().$to_a()
      }; return nil; })();
      return self.bytes.$dup();
    }, $String_bytes$37.$$arity = 0);
    
    Opal.def(self, '$each_char', $String_each_char$38 = function $$each_char() {
      var $iter = $String_each_char$38.$$p, block = $iter || nil, $$39, self = this;

      if ($iter) $String_each_char$38.$$p = null;
      
      
      if ($iter) $String_each_char$38.$$p = null;;
      if ((block !== nil)) {
      } else {
        return $send(self, 'enum_for', ["each_char"], ($$39 = function(){var self = $$39.$$s == null ? this : $$39.$$s;

          return self.$length()}, $$39.$$s = self, $$39.$$arity = 0, $$39))
      };
      $send(self.encoding, 'each_char', [self], block.$to_proc());
      return self;
    }, $String_each_char$38.$$arity = 0);
    
    Opal.def(self, '$chars', $String_chars$40 = function $$chars() {
      var $iter = $String_chars$40.$$p, block = $iter || nil, self = this;

      if ($iter) $String_chars$40.$$p = null;
      
      
      if ($iter) $String_chars$40.$$p = null;;
      if ($truthy(block)) {
      } else {
        return self.$each_char().$to_a()
      };
      return $send(self, 'each_char', [], block.$to_proc());
    }, $String_chars$40.$$arity = 0);
    
    Opal.def(self, '$each_codepoint', $String_each_codepoint$41 = function $$each_codepoint() {
      var $iter = $String_each_codepoint$41.$$p, block = $iter || nil, self = this;

      if ($iter) $String_each_codepoint$41.$$p = null;
      
      
      if ($iter) $String_each_codepoint$41.$$p = null;;
      if ((block !== nil)) {
      } else {
        return self.$enum_for("each_codepoint")
      };
      
      for (var i = 0, length = self.length; i < length; i++) {
        Opal.yield1(block, self.codePointAt(i));
      }
    ;
      return self;
    }, $String_each_codepoint$41.$$arity = 0);
    
    Opal.def(self, '$codepoints', $String_codepoints$42 = function $$codepoints() {
      var $iter = $String_codepoints$42.$$p, block = $iter || nil, self = this;

      if ($iter) $String_codepoints$42.$$p = null;
      
      
      if ($iter) $String_codepoints$42.$$p = null;;
      if ((block !== nil)) {
        return $send(self, 'each_codepoint', [], block.$to_proc())};
      return self.$each_codepoint().$to_a();
    }, $String_codepoints$42.$$arity = 0);
    
    Opal.def(self, '$encode', $String_encode$43 = function $$encode(encoding) {
      var self = this;

      return Opal.enc(self, encoding);
    }, $String_encode$43.$$arity = 1);
    
    Opal.def(self, '$force_encoding', $String_force_encoding$44 = function $$force_encoding(encoding) {
      var self = this;

      
      var str = self;

      if (encoding === str.encoding) { return str; }

      encoding = $$($nesting, 'Opal')['$coerce_to!'](encoding, $$($nesting, 'String'), "to_s");
      encoding = $$($nesting, 'Encoding').$find(encoding);

      if (encoding === str.encoding) { return str; }

      str = Opal.set_encoding(str, encoding);

      return str;
    
    }, $String_force_encoding$44.$$arity = 1);
    
    Opal.def(self, '$getbyte', $String_getbyte$45 = function $$getbyte(idx) {
      var self = this, string_bytes = nil;

      
      string_bytes = self.$bytes();
      idx = $$($nesting, 'Opal')['$coerce_to!'](idx, $$($nesting, 'Integer'), "to_int");
      if ($truthy($rb_lt(string_bytes.$length(), idx))) {
        return nil};
      return string_bytes['$[]'](idx);
    }, $String_getbyte$45.$$arity = 1);
    
    Opal.def(self, '$initialize_copy', $String_initialize_copy$46 = function $$initialize_copy(other) {
      var self = this;

      return "" + "\n" + "      self.encoding = other.encoding;\n" + "      self.internal_encoding = other.internal_encoding;\n" + "    "
    }, $String_initialize_copy$46.$$arity = 1);
    
    Opal.def(self, '$length', $String_length$47 = function $$length() {
      var self = this;

      return self.length;
    }, $String_length$47.$$arity = 0);
    $alias(self, "size", "length");
    return (Opal.def(self, '$valid_encoding?', $String_valid_encoding$ques$48 = function() {
      var self = this;

      return true
    }, $String_valid_encoding$ques$48.$$arity = 0), nil) && 'valid_encoding?';
  })($nesting[0], null, $nesting);
  
  $writer = [$$$($$($nesting, 'Encoding'), 'UTF_8')];
  $send($$($nesting, 'Encoding'), 'default_external=', Opal.to_a($writer));
  return $writer[$rb_minus($writer["length"], 1)];;
};

Opal.modules["corelib/math"] = function(Opal) {/* Generated by Opal 1.3.0 */
  function $rb_minus(lhs, rhs) {
    return (typeof(lhs) === 'number' && typeof(rhs) === 'number') ? lhs - rhs : lhs['$-'](rhs);
  }
  function $rb_divide(lhs, rhs) {
    return (typeof(lhs) === 'number' && typeof(rhs) === 'number') ? lhs / rhs : lhs['$/'](rhs);
  }
  var self = Opal.top, $nesting = [], nil = Opal.nil, $$$ = Opal.$$$, $$ = Opal.$$, $type_error = Opal.type_error, $module = Opal.module, $truthy = Opal.truthy;

  Opal.add_stubs(['$new', '$raise', '$Float', '$Integer', '$module_function', '$checked', '$float!', '$===', '$gamma', '$-', '$integer!', '$/', '$infinite?']);
  return (function($base, $parent_nesting) {
    var self = $module($base, 'Math');

    var $nesting = [self].concat($parent_nesting), $Math_checked$1, $Math_float$excl$2, $Math_integer$excl$3, $Math_acos$4, $Math_acosh$5, $Math_asin$6, $Math_asinh$7, $Math_atan$8, $Math_atan2$9, $Math_atanh$10, $Math_cbrt$11, $Math_cos$12, $Math_cosh$13, $Math_erf$14, $Math_erfc$15, $Math_exp$16, $Math_frexp$17, $Math_gamma$18, $Math_hypot$19, $Math_ldexp$20, $Math_lgamma$21, $Math_log$22, $Math_log10$23, $Math_log2$24, $Math_sin$25, $Math_sinh$26, $Math_sqrt$27, $Math_tan$28, $Math_tanh$29;

    
    Opal.const_set($nesting[0], 'E', Math.E);
    Opal.const_set($nesting[0], 'PI', Math.PI);
    Opal.const_set($nesting[0], 'DomainError', $$($nesting, 'Class').$new($$($nesting, 'StandardError')));
    Opal.defs(self, '$checked', $Math_checked$1 = function $$checked(method, $a) {
      var $post_args, args, self = this;

      
      
      $post_args = Opal.slice.call(arguments, 1, arguments.length);
      
      args = $post_args;;
      
      if (isNaN(args[0]) || (args.length == 2 && isNaN(args[1]))) {
        return NaN;
      }

      var result = Math[method].apply(null, args);

      if (isNaN(result)) {
        self.$raise($$($nesting, 'DomainError'), "" + "Numerical argument is out of domain - \"" + (method) + "\"");
      }

      return result;
    ;
    }, $Math_checked$1.$$arity = -2);
    Opal.defs(self, '$float!', $Math_float$excl$2 = function(value) {
      var self = this;

      try {
        return self.$Float(value)
      } catch ($err) {
        if (Opal.rescue($err, [$$($nesting, 'ArgumentError')])) {
          try {
            return self.$raise($type_error(value, $$($nesting, 'Float')))
          } finally { Opal.pop_exception(); }
        } else { throw $err; }
      }
    }, $Math_float$excl$2.$$arity = 1);
    Opal.defs(self, '$integer!', $Math_integer$excl$3 = function(value) {
      var self = this;

      try {
        return self.$Integer(value)
      } catch ($err) {
        if (Opal.rescue($err, [$$($nesting, 'ArgumentError')])) {
          try {
            return self.$raise($type_error(value, $$($nesting, 'Integer')))
          } finally { Opal.pop_exception(); }
        } else { throw $err; }
      }
    }, $Math_integer$excl$3.$$arity = 1);
    self.$module_function();
    
    Opal.def(self, '$acos', $Math_acos$4 = function $$acos(x) {
      var self = this;

      return $$($nesting, 'Math').$checked("acos", $$($nesting, 'Math')['$float!'](x))
    }, $Math_acos$4.$$arity = 1);
    if ($truthy((typeof(Math.acosh) !== "undefined"))) {
    } else {
      
      Math.acosh = function(x) {
        return Math.log(x + Math.sqrt(x * x - 1));
      }
    
    };
    
    Opal.def(self, '$acosh', $Math_acosh$5 = function $$acosh(x) {
      var self = this;

      return $$($nesting, 'Math').$checked("acosh", $$($nesting, 'Math')['$float!'](x))
    }, $Math_acosh$5.$$arity = 1);
    
    Opal.def(self, '$asin', $Math_asin$6 = function $$asin(x) {
      var self = this;

      return $$($nesting, 'Math').$checked("asin", $$($nesting, 'Math')['$float!'](x))
    }, $Math_asin$6.$$arity = 1);
    if ($truthy((typeof(Math.asinh) !== "undefined"))) {
    } else {
      
      Math.asinh = function(x) {
        return Math.log(x + Math.sqrt(x * x + 1))
      }
    
    };
    
    Opal.def(self, '$asinh', $Math_asinh$7 = function $$asinh(x) {
      var self = this;

      return $$($nesting, 'Math').$checked("asinh", $$($nesting, 'Math')['$float!'](x))
    }, $Math_asinh$7.$$arity = 1);
    
    Opal.def(self, '$atan', $Math_atan$8 = function $$atan(x) {
      var self = this;

      return $$($nesting, 'Math').$checked("atan", $$($nesting, 'Math')['$float!'](x))
    }, $Math_atan$8.$$arity = 1);
    
    Opal.def(self, '$atan2', $Math_atan2$9 = function $$atan2(y, x) {
      var self = this;

      return $$($nesting, 'Math').$checked("atan2", $$($nesting, 'Math')['$float!'](y), $$($nesting, 'Math')['$float!'](x))
    }, $Math_atan2$9.$$arity = 2);
    if ($truthy((typeof(Math.atanh) !== "undefined"))) {
    } else {
      
      Math.atanh = function(x) {
        return 0.5 * Math.log((1 + x) / (1 - x));
      }
    
    };
    
    Opal.def(self, '$atanh', $Math_atanh$10 = function $$atanh(x) {
      var self = this;

      return $$($nesting, 'Math').$checked("atanh", $$($nesting, 'Math')['$float!'](x))
    }, $Math_atanh$10.$$arity = 1);
    if ($truthy((typeof(Math.cbrt) !== "undefined"))) {
    } else {
      
      Math.cbrt = function(x) {
        if (x == 0) {
          return 0;
        }

        if (x < 0) {
          return -Math.cbrt(-x);
        }

        var r  = x,
            ex = 0;

        while (r < 0.125) {
          r *= 8;
          ex--;
        }

        while (r > 1.0) {
          r *= 0.125;
          ex++;
        }

        r = (-0.46946116 * r + 1.072302) * r + 0.3812513;

        while (ex < 0) {
          r *= 0.5;
          ex++;
        }

        while (ex > 0) {
          r *= 2;
          ex--;
        }

        r = (2.0 / 3.0) * r + (1.0 / 3.0) * x / (r * r);
        r = (2.0 / 3.0) * r + (1.0 / 3.0) * x / (r * r);
        r = (2.0 / 3.0) * r + (1.0 / 3.0) * x / (r * r);
        r = (2.0 / 3.0) * r + (1.0 / 3.0) * x / (r * r);

        return r;
      }
    
    };
    
    Opal.def(self, '$cbrt', $Math_cbrt$11 = function $$cbrt(x) {
      var self = this;

      return $$($nesting, 'Math').$checked("cbrt", $$($nesting, 'Math')['$float!'](x))
    }, $Math_cbrt$11.$$arity = 1);
    
    Opal.def(self, '$cos', $Math_cos$12 = function $$cos(x) {
      var self = this;

      return $$($nesting, 'Math').$checked("cos", $$($nesting, 'Math')['$float!'](x))
    }, $Math_cos$12.$$arity = 1);
    if ($truthy((typeof(Math.cosh) !== "undefined"))) {
    } else {
      
      Math.cosh = function(x) {
        return (Math.exp(x) + Math.exp(-x)) / 2;
      }
    
    };
    
    Opal.def(self, '$cosh', $Math_cosh$13 = function $$cosh(x) {
      var self = this;

      return $$($nesting, 'Math').$checked("cosh", $$($nesting, 'Math')['$float!'](x))
    }, $Math_cosh$13.$$arity = 1);
    if ($truthy((typeof(Math.erf) !== "undefined"))) {
    } else {
      
      Opal.defineProperty(Math, 'erf', function(x) {
        var A1 =  0.254829592,
            A2 = -0.284496736,
            A3 =  1.421413741,
            A4 = -1.453152027,
            A5 =  1.061405429,
            P  =  0.3275911;

        var sign = 1;

        if (x < 0) {
            sign = -1;
        }

        x = Math.abs(x);

        var t = 1.0 / (1.0 + P * x);
        var y = 1.0 - (((((A5 * t + A4) * t) + A3) * t + A2) * t + A1) * t * Math.exp(-x * x);

        return sign * y;
      });
    
    };
    
    Opal.def(self, '$erf', $Math_erf$14 = function $$erf(x) {
      var self = this;

      return $$($nesting, 'Math').$checked("erf", $$($nesting, 'Math')['$float!'](x))
    }, $Math_erf$14.$$arity = 1);
    if ($truthy((typeof(Math.erfc) !== "undefined"))) {
    } else {
      
      Opal.defineProperty(Math, 'erfc', function(x) {
        var z = Math.abs(x),
            t = 1.0 / (0.5 * z + 1.0);

        var A1 = t * 0.17087277 + -0.82215223,
            A2 = t * A1 + 1.48851587,
            A3 = t * A2 + -1.13520398,
            A4 = t * A3 + 0.27886807,
            A5 = t * A4 + -0.18628806,
            A6 = t * A5 + 0.09678418,
            A7 = t * A6 + 0.37409196,
            A8 = t * A7 + 1.00002368,
            A9 = t * A8,
            A10 = -z * z - 1.26551223 + A9;

        var a = t * Math.exp(A10);

        if (x < 0.0) {
          return 2.0 - a;
        }
        else {
          return a;
        }
      });
    
    };
    
    Opal.def(self, '$erfc', $Math_erfc$15 = function $$erfc(x) {
      var self = this;

      return $$($nesting, 'Math').$checked("erfc", $$($nesting, 'Math')['$float!'](x))
    }, $Math_erfc$15.$$arity = 1);
    
    Opal.def(self, '$exp', $Math_exp$16 = function $$exp(x) {
      var self = this;

      return $$($nesting, 'Math').$checked("exp", $$($nesting, 'Math')['$float!'](x))
    }, $Math_exp$16.$$arity = 1);
    
    Opal.def(self, '$frexp', $Math_frexp$17 = function $$frexp(x) {
      var self = this;

      
      x = $$($nesting, 'Math')['$float!'](x);
      
      if (isNaN(x)) {
        return [NaN, 0];
      }

      var ex   = Math.floor(Math.log(Math.abs(x)) / Math.log(2)) + 1,
          frac = x / Math.pow(2, ex);

      return [frac, ex];
    ;
    }, $Math_frexp$17.$$arity = 1);
    
    Opal.def(self, '$gamma', $Math_gamma$18 = function $$gamma(n) {
      var self = this;

      
      n = $$($nesting, 'Math')['$float!'](n);
      
      var i, t, x, value, result, twoN, threeN, fourN, fiveN;

      var G = 4.7421875;

      var P = [
         0.99999999999999709182,
         57.156235665862923517,
        -59.597960355475491248,
         14.136097974741747174,
        -0.49191381609762019978,
         0.33994649984811888699e-4,
         0.46523628927048575665e-4,
        -0.98374475304879564677e-4,
         0.15808870322491248884e-3,
        -0.21026444172410488319e-3,
         0.21743961811521264320e-3,
        -0.16431810653676389022e-3,
         0.84418223983852743293e-4,
        -0.26190838401581408670e-4,
         0.36899182659531622704e-5
      ];


      if (isNaN(n)) {
        return NaN;
      }

      if (n === 0 && 1 / n < 0) {
        return -Infinity;
      }

      if (n === -1 || n === -Infinity) {
        self.$raise($$($nesting, 'DomainError'), "Numerical argument is out of domain - \"gamma\"");
      }

      if ($$($nesting, 'Integer')['$==='](n)) {
        if (n <= 0) {
          return isFinite(n) ? Infinity : NaN;
        }

        if (n > 171) {
          return Infinity;
        }

        value  = n - 2;
        result = n - 1;

        while (value > 1) {
          result *= value;
          value--;
        }

        if (result == 0) {
          result = 1;
        }

        return result;
      }

      if (n < 0.5) {
        return Math.PI / (Math.sin(Math.PI * n) * $$($nesting, 'Math').$gamma($rb_minus(1, n)));
      }

      if (n >= 171.35) {
        return Infinity;
      }

      if (n > 85.0) {
        twoN   = n * n;
        threeN = twoN * n;
        fourN  = threeN * n;
        fiveN  = fourN * n;

        return Math.sqrt(2 * Math.PI / n) * Math.pow((n / Math.E), n) *
          (1 + 1 / (12 * n) + 1 / (288 * twoN) - 139 / (51840 * threeN) -
          571 / (2488320 * fourN) + 163879 / (209018880 * fiveN) +
          5246819 / (75246796800 * fiveN * n));
      }

      n -= 1;
      x  = P[0];

      for (i = 1; i < P.length; ++i) {
        x += P[i] / (n + i);
      }

      t = n + G + 0.5;

      return Math.sqrt(2 * Math.PI) * Math.pow(t, n + 0.5) * Math.exp(-t) * x;
    ;
    }, $Math_gamma$18.$$arity = 1);
    if ($truthy((typeof(Math.hypot) !== "undefined"))) {
    } else {
      
      Math.hypot = function(x, y) {
        return Math.sqrt(x * x + y * y)
      }
    
    };
    
    Opal.def(self, '$hypot', $Math_hypot$19 = function $$hypot(x, y) {
      var self = this;

      return $$($nesting, 'Math').$checked("hypot", $$($nesting, 'Math')['$float!'](x), $$($nesting, 'Math')['$float!'](y))
    }, $Math_hypot$19.$$arity = 2);
    
    Opal.def(self, '$ldexp', $Math_ldexp$20 = function $$ldexp(mantissa, exponent) {
      var self = this;

      
      mantissa = $$($nesting, 'Math')['$float!'](mantissa);
      exponent = $$($nesting, 'Math')['$integer!'](exponent);
      
      if (isNaN(exponent)) {
        self.$raise($$($nesting, 'RangeError'), "float NaN out of range of integer");
      }

      return mantissa * Math.pow(2, exponent);
    ;
    }, $Math_ldexp$20.$$arity = 2);
    
    Opal.def(self, '$lgamma', $Math_lgamma$21 = function $$lgamma(n) {
      var self = this;

      
      if (n == -1) {
        return [Infinity, 1];
      }
      else {
        return [Math.log(Math.abs($$($nesting, 'Math').$gamma(n))), $$($nesting, 'Math').$gamma(n) < 0 ? -1 : 1];
      }
    
    }, $Math_lgamma$21.$$arity = 1);
    
    Opal.def(self, '$log', $Math_log$22 = function $$log(x, base) {
      var self = this;

      
      ;
      if ($truthy($$($nesting, 'String')['$==='](x))) {
        self.$raise($type_error(x, $$($nesting, 'Float')))};
      if ($truthy(base == null)) {
        return $$($nesting, 'Math').$checked("log", $$($nesting, 'Math')['$float!'](x))
      } else {
        
        if ($truthy($$($nesting, 'String')['$==='](base))) {
          self.$raise($type_error(base, $$($nesting, 'Float')))};
        return $rb_divide($$($nesting, 'Math').$checked("log", $$($nesting, 'Math')['$float!'](x)), $$($nesting, 'Math').$checked("log", $$($nesting, 'Math')['$float!'](base)));
      };
    }, $Math_log$22.$$arity = -2);
    if ($truthy((typeof(Math.log10) !== "undefined"))) {
    } else {
      
      Math.log10 = function(x) {
        return Math.log(x) / Math.LN10;
      }
    
    };
    
    Opal.def(self, '$log10', $Math_log10$23 = function $$log10(x) {
      var self = this;

      
      if ($truthy($$($nesting, 'String')['$==='](x))) {
        self.$raise($type_error(x, $$($nesting, 'Float')))};
      return $$($nesting, 'Math').$checked("log10", $$($nesting, 'Math')['$float!'](x));
    }, $Math_log10$23.$$arity = 1);
    if ($truthy((typeof(Math.log2) !== "undefined"))) {
    } else {
      
      Math.log2 = function(x) {
        return Math.log(x) / Math.LN2;
      }
    
    };
    
    Opal.def(self, '$log2', $Math_log2$24 = function $$log2(x) {
      var self = this;

      
      if ($truthy($$($nesting, 'String')['$==='](x))) {
        self.$raise($type_error(x, $$($nesting, 'Float')))};
      return $$($nesting, 'Math').$checked("log2", $$($nesting, 'Math')['$float!'](x));
    }, $Math_log2$24.$$arity = 1);
    
    Opal.def(self, '$sin', $Math_sin$25 = function $$sin(x) {
      var self = this;

      return $$($nesting, 'Math').$checked("sin", $$($nesting, 'Math')['$float!'](x))
    }, $Math_sin$25.$$arity = 1);
    if ($truthy((typeof(Math.sinh) !== "undefined"))) {
    } else {
      
      Math.sinh = function(x) {
        return (Math.exp(x) - Math.exp(-x)) / 2;
      }
    
    };
    
    Opal.def(self, '$sinh', $Math_sinh$26 = function $$sinh(x) {
      var self = this;

      return $$($nesting, 'Math').$checked("sinh", $$($nesting, 'Math')['$float!'](x))
    }, $Math_sinh$26.$$arity = 1);
    
    Opal.def(self, '$sqrt', $Math_sqrt$27 = function $$sqrt(x) {
      var self = this;

      return $$($nesting, 'Math').$checked("sqrt", $$($nesting, 'Math')['$float!'](x))
    }, $Math_sqrt$27.$$arity = 1);
    
    Opal.def(self, '$tan', $Math_tan$28 = function $$tan(x) {
      var self = this;

      
      x = $$($nesting, 'Math')['$float!'](x);
      if ($truthy(x['$infinite?']())) {
        return $$$($$($nesting, 'Float'), 'NAN')};
      return $$($nesting, 'Math').$checked("tan", $$($nesting, 'Math')['$float!'](x));
    }, $Math_tan$28.$$arity = 1);
    if ($truthy((typeof(Math.tanh) !== "undefined"))) {
    } else {
      
      Math.tanh = function(x) {
        if (x == Infinity) {
          return 1;
        }
        else if (x == -Infinity) {
          return -1;
        }
        else {
          return (Math.exp(x) - Math.exp(-x)) / (Math.exp(x) + Math.exp(-x));
        }
      }
    
    };
    return (Opal.def(self, '$tanh', $Math_tanh$29 = function $$tanh(x) {
      var self = this;

      return $$($nesting, 'Math').$checked("tanh", $$($nesting, 'Math')['$float!'](x))
    }, $Math_tanh$29.$$arity = 1), nil) && 'tanh';
  })($nesting[0], $nesting)
};

Opal.modules["corelib/complex/base"] = function(Opal) {/* Generated by Opal 1.3.0 */
  var self = Opal.top, $nesting = [], nil = Opal.nil, $$$ = Opal.$$$, $$ = Opal.$$, $module = Opal.module, $truthy = Opal.truthy, $klass = Opal.klass;

  Opal.add_stubs(['$new', '$from_string']);
  
  (function($base, $parent_nesting) {
    var self = $module($base, 'Kernel');

    var $nesting = [self].concat($parent_nesting), $Kernel_Complex$1;

    return (Opal.def(self, '$Complex', $Kernel_Complex$1 = function $$Complex(real, imag) {
      var self = this;

      
      
      if (imag == null) {
        imag = nil;
      };
      if ($truthy(imag)) {
        return $$($nesting, 'Complex').$new(real, imag)
      } else {
        return $$($nesting, 'Complex').$new(real, 0)
      };
    }, $Kernel_Complex$1.$$arity = -2), nil) && 'Complex'
  })($nesting[0], $nesting);
  return (function($base, $super, $parent_nesting) {
    var self = $klass($base, $super, 'String');

    var $nesting = [self].concat($parent_nesting), $String_to_c$2;

    return (Opal.def(self, '$to_c', $String_to_c$2 = function $$to_c() {
      var self = this;

      return $$($nesting, 'Complex').$from_string(self)
    }, $String_to_c$2.$$arity = 0), nil) && 'to_c'
  })($nesting[0], null, $nesting);
};

Opal.modules["corelib/complex"] = function(Opal) {/* Generated by Opal 1.3.0 */
  function $rb_times(lhs, rhs) {
    return (typeof(lhs) === 'number' && typeof(rhs) === 'number') ? lhs * rhs : lhs['$*'](rhs);
  }
  function $rb_plus(lhs, rhs) {
    return (typeof(lhs) === 'number' && typeof(rhs) === 'number') ? lhs + rhs : lhs['$+'](rhs);
  }
  function $rb_minus(lhs, rhs) {
    return (typeof(lhs) === 'number' && typeof(rhs) === 'number') ? lhs - rhs : lhs['$-'](rhs);
  }
  function $rb_divide(lhs, rhs) {
    return (typeof(lhs) === 'number' && typeof(rhs) === 'number') ? lhs / rhs : lhs['$/'](rhs);
  }
  function $rb_gt(lhs, rhs) {
    return (typeof(lhs) === 'number' && typeof(rhs) === 'number') ? lhs > rhs : lhs['$>'](rhs);
  }
  var self = Opal.top, $nesting = [], nil = Opal.nil, $$$ = Opal.$$$, $$ = Opal.$$, $klass = Opal.klass, $truthy = Opal.truthy, $alias = Opal.alias;

  Opal.add_stubs(['$require', '$===', '$real?', '$raise', '$new', '$*', '$cos', '$sin', '$attr_reader', '$class', '$==', '$real', '$imag', '$Complex', '$-@', '$+', '$__coerced__', '$-', '$nan?', '$/', '$conj', '$abs2', '$quo', '$polar', '$exp', '$log', '$>', '$!=', '$divmod', '$**', '$hypot', '$atan2', '$lcm', '$denominator', '$finite?', '$infinite?', '$numerator', '$abs', '$arg', '$rationalize', '$to_f', '$to_i', '$to_r', '$inspect', '$positive?', '$zero?', '$Rational']);
  
  self.$require("corelib/numeric");
  self.$require("corelib/complex/base");
  return (function($base, $super, $parent_nesting) {
    var self = $klass($base, $super, 'Complex');

    var $nesting = [self].concat($parent_nesting), $Complex_rect$1, $Complex_polar$2, $Complex_initialize$3, $Complex_coerce$4, $Complex_$eq_eq$5, $Complex_$minus$$6, $Complex_$plus$7, $Complex_$minus$8, $Complex_$$9, $Complex_$slash$10, $Complex_$$$11, $Complex_abs$12, $Complex_abs2$13, $Complex_angle$14, $Complex_conj$15, $Complex_denominator$16, $Complex_eql$ques$17, $Complex_fdiv$18, $Complex_finite$ques$19, $Complex_hash$20, $Complex_infinite$ques$21, $Complex_inspect$22, $Complex_numerator$23, $Complex_polar$24, $Complex_rationalize$25, $Complex_real$ques$26, $Complex_rect$27, $Complex_to_f$28, $Complex_to_i$29, $Complex_to_r$30, $Complex_to_s$31, $Complex_from_string$32;

    self.$$prototype.real = self.$$prototype.imag = nil;
    
    Opal.defs(self, '$rect', $Complex_rect$1 = function $$rect(real, imag) {
      var self = this, $ret_or_1 = nil, $ret_or_2 = nil, $ret_or_3 = nil;

      
      
      if (imag == null) {
        imag = 0;
      };
      if ($truthy((function() {if ($truthy(($ret_or_1 = (function() {if ($truthy(($ret_or_2 = (function() {if ($truthy(($ret_or_3 = $$($nesting, 'Numeric')['$==='](real)))) {
        return real['$real?']()
      } else {
        return $ret_or_3
      }; return nil; })()))) {
        return $$($nesting, 'Numeric')['$==='](imag)
      } else {
        return $ret_or_2
      }; return nil; })()))) {
        return imag['$real?']()
      } else {
        return $ret_or_1
      }; return nil; })())) {
      } else {
        self.$raise($$($nesting, 'TypeError'), "not a real")
      };
      return self.$new(real, imag);
    }, $Complex_rect$1.$$arity = -2);
    (function(self, $parent_nesting) {
      var $nesting = [self].concat($parent_nesting);

      return $alias(self, "rectangular", "rect")
    })(Opal.get_singleton_class(self), $nesting);
    Opal.defs(self, '$polar', $Complex_polar$2 = function $$polar(r, theta) {
      var self = this, $ret_or_4 = nil, $ret_or_5 = nil, $ret_or_6 = nil;

      
      
      if (theta == null) {
        theta = 0;
      };
      if ($truthy((function() {if ($truthy(($ret_or_4 = (function() {if ($truthy(($ret_or_5 = (function() {if ($truthy(($ret_or_6 = $$($nesting, 'Numeric')['$==='](r)))) {
        return r['$real?']()
      } else {
        return $ret_or_6
      }; return nil; })()))) {
        return $$($nesting, 'Numeric')['$==='](theta)
      } else {
        return $ret_or_5
      }; return nil; })()))) {
        return theta['$real?']()
      } else {
        return $ret_or_4
      }; return nil; })())) {
      } else {
        self.$raise($$($nesting, 'TypeError'), "not a real")
      };
      return self.$new($rb_times(r, $$($nesting, 'Math').$cos(theta)), $rb_times(r, $$($nesting, 'Math').$sin(theta)));
    }, $Complex_polar$2.$$arity = -2);
    self.$attr_reader("real", "imag");
    
    Opal.def(self, '$initialize', $Complex_initialize$3 = function $$initialize(real, imag) {
      var self = this;

      
      
      if (imag == null) {
        imag = 0;
      };
      self.real = real;
      return (self.imag = imag);
    }, $Complex_initialize$3.$$arity = -2);
    
    Opal.def(self, '$coerce', $Complex_coerce$4 = function $$coerce(other) {
      var self = this, $ret_or_7 = nil;

      if ($truthy($$($nesting, 'Complex')['$==='](other))) {
        return [other, self]
      } else if ($truthy((function() {if ($truthy(($ret_or_7 = $$($nesting, 'Numeric')['$==='](other)))) {
        return other['$real?']()
      } else {
        return $ret_or_7
      }; return nil; })())) {
        return [$$($nesting, 'Complex').$new(other, 0), self]
      } else {
        return self.$raise($$($nesting, 'TypeError'), "" + (other.$class()) + " can't be coerced into Complex")
      }
    }, $Complex_coerce$4.$$arity = 1);
    
    Opal.def(self, '$==', $Complex_$eq_eq$5 = function(other) {
      var self = this, $ret_or_8 = nil, $ret_or_9 = nil, $ret_or_10 = nil;

      if ($truthy($$($nesting, 'Complex')['$==='](other))) {
        if ($truthy(($ret_or_8 = self.real['$=='](other.$real())))) {
          return self.imag['$=='](other.$imag())
        } else {
          return $ret_or_8
        }
      } else if ($truthy((function() {if ($truthy(($ret_or_9 = $$($nesting, 'Numeric')['$==='](other)))) {
        return other['$real?']()
      } else {
        return $ret_or_9
      }; return nil; })())) {
        if ($truthy(($ret_or_10 = self.real['$=='](other)))) {
          return self.imag['$=='](0)
        } else {
          return $ret_or_10
        }
      } else {
        return other['$=='](self)
      }
    }, $Complex_$eq_eq$5.$$arity = 1);
    
    Opal.def(self, '$-@', $Complex_$minus$$6 = function() {
      var self = this;

      return self.$Complex(self.real['$-@'](), self.imag['$-@']())
    }, $Complex_$minus$$6.$$arity = 0);
    
    Opal.def(self, '$+', $Complex_$plus$7 = function(other) {
      var self = this, $ret_or_11 = nil;

      if ($truthy($$($nesting, 'Complex')['$==='](other))) {
        return self.$Complex($rb_plus(self.real, other.$real()), $rb_plus(self.imag, other.$imag()))
      } else if ($truthy((function() {if ($truthy(($ret_or_11 = $$($nesting, 'Numeric')['$==='](other)))) {
        return other['$real?']()
      } else {
        return $ret_or_11
      }; return nil; })())) {
        return self.$Complex($rb_plus(self.real, other), self.imag)
      } else {
        return self.$__coerced__("+", other)
      }
    }, $Complex_$plus$7.$$arity = 1);
    
    Opal.def(self, '$-', $Complex_$minus$8 = function(other) {
      var self = this, $ret_or_12 = nil;

      if ($truthy($$($nesting, 'Complex')['$==='](other))) {
        return self.$Complex($rb_minus(self.real, other.$real()), $rb_minus(self.imag, other.$imag()))
      } else if ($truthy((function() {if ($truthy(($ret_or_12 = $$($nesting, 'Numeric')['$==='](other)))) {
        return other['$real?']()
      } else {
        return $ret_or_12
      }; return nil; })())) {
        return self.$Complex($rb_minus(self.real, other), self.imag)
      } else {
        return self.$__coerced__("-", other)
      }
    }, $Complex_$minus$8.$$arity = 1);
    
    Opal.def(self, '$*', $Complex_$$9 = function(other) {
      var self = this, $ret_or_13 = nil;

      if ($truthy($$($nesting, 'Complex')['$==='](other))) {
        return self.$Complex($rb_minus($rb_times(self.real, other.$real()), $rb_times(self.imag, other.$imag())), $rb_plus($rb_times(self.real, other.$imag()), $rb_times(self.imag, other.$real())))
      } else if ($truthy((function() {if ($truthy(($ret_or_13 = $$($nesting, 'Numeric')['$==='](other)))) {
        return other['$real?']()
      } else {
        return $ret_or_13
      }; return nil; })())) {
        return self.$Complex($rb_times(self.real, other), $rb_times(self.imag, other))
      } else {
        return self.$__coerced__("*", other)
      }
    }, $Complex_$$9.$$arity = 1);
    
    Opal.def(self, '$/', $Complex_$slash$10 = function(other) {
      var self = this, $ret_or_14 = nil, $ret_or_15 = nil, $ret_or_16 = nil, $ret_or_17 = nil, $ret_or_18 = nil, $ret_or_19 = nil, $ret_or_20 = nil, $ret_or_21 = nil;

      if ($truthy($$($nesting, 'Complex')['$==='](other))) {
        if ($truthy((function() {if ($truthy(($ret_or_14 = (function() {if ($truthy(($ret_or_15 = (function() {if ($truthy(($ret_or_16 = (function() {if ($truthy(($ret_or_17 = $$($nesting, 'Number')['$==='](self.real)))) {
          return self.real['$nan?']()
        } else {
          return $ret_or_17
        }; return nil; })()))) {
          return $ret_or_16
        } else {
          
          if ($truthy(($ret_or_18 = $$($nesting, 'Number')['$==='](self.imag)))) {
            return self.imag['$nan?']()
          } else {
            return $ret_or_18
          };
        }; return nil; })()))) {
          return $ret_or_15
        } else {
          
          if ($truthy(($ret_or_19 = $$($nesting, 'Number')['$==='](other.$real())))) {
            return other.$real()['$nan?']()
          } else {
            return $ret_or_19
          };
        }; return nil; })()))) {
          return $ret_or_14
        } else {
          
          if ($truthy(($ret_or_20 = $$($nesting, 'Number')['$==='](other.$imag())))) {
            return other.$imag()['$nan?']()
          } else {
            return $ret_or_20
          };
        }; return nil; })())) {
          return $$($nesting, 'Complex').$new($$$($$($nesting, 'Float'), 'NAN'), $$$($$($nesting, 'Float'), 'NAN'))
        } else {
          return $rb_divide($rb_times(self, other.$conj()), other.$abs2())
        }
      } else if ($truthy((function() {if ($truthy(($ret_or_21 = $$($nesting, 'Numeric')['$==='](other)))) {
        return other['$real?']()
      } else {
        return $ret_or_21
      }; return nil; })())) {
        return self.$Complex(self.real.$quo(other), self.imag.$quo(other))
      } else {
        return self.$__coerced__("/", other)
      }
    }, $Complex_$slash$10.$$arity = 1);
    
    Opal.def(self, '$**', $Complex_$$$11 = function(other) {
      var $a, $b, $c, $d, self = this, r = nil, theta = nil, ore = nil, oim = nil, nr = nil, ntheta = nil, x = nil, z = nil, n = nil, div = nil, mod = nil, $ret_or_22 = nil;

      
      if (other['$=='](0)) {
        return $$($nesting, 'Complex').$new(1, 0)};
      if ($truthy($$($nesting, 'Complex')['$==='](other))) {
        
        $b = self.$polar(), $a = Opal.to_ary($b), (r = ($a[0] == null ? nil : $a[0])), (theta = ($a[1] == null ? nil : $a[1])), $b;
        ore = other.$real();
        oim = other.$imag();
        nr = $$($nesting, 'Math').$exp($rb_minus($rb_times(ore, $$($nesting, 'Math').$log(r)), $rb_times(oim, theta)));
        ntheta = $rb_plus($rb_times(theta, ore), $rb_times(oim, $$($nesting, 'Math').$log(r)));
        return $$($nesting, 'Complex').$polar(nr, ntheta);
      } else if ($truthy($$($nesting, 'Integer')['$==='](other))) {
        if ($truthy($rb_gt(other, 0))) {
          
          x = self;
          z = x;
          n = $rb_minus(other, 1);
          while ($truthy(n['$!='](0))) {
            
            $c = n.$divmod(2), $b = Opal.to_ary($c), (div = ($b[0] == null ? nil : $b[0])), (mod = ($b[1] == null ? nil : $b[1])), $c;
            while (mod['$=='](0)) {
              
              x = self.$Complex($rb_minus($rb_times(x.$real(), x.$real()), $rb_times(x.$imag(), x.$imag())), $rb_times($rb_times(2, x.$real()), x.$imag()));
              n = div;
              $d = n.$divmod(2), $c = Opal.to_ary($d), (div = ($c[0] == null ? nil : $c[0])), (mod = ($c[1] == null ? nil : $c[1])), $d;
            };
            z = $rb_times(z, x);
            n = $rb_minus(n, 1);
          };
          return z;
        } else {
          return $rb_divide($$($nesting, 'Rational').$new(1, 1), self)['$**'](other['$-@']())
        }
      } else if ($truthy((function() {if ($truthy(($ret_or_22 = $$($nesting, 'Float')['$==='](other)))) {
        return $ret_or_22
      } else {
        return $$($nesting, 'Rational')['$==='](other)
      }; return nil; })())) {
        
        $b = self.$polar(), $a = Opal.to_ary($b), (r = ($a[0] == null ? nil : $a[0])), (theta = ($a[1] == null ? nil : $a[1])), $b;
        return $$($nesting, 'Complex').$polar(r['$**'](other), $rb_times(theta, other));
      } else {
        return self.$__coerced__("**", other)
      };
    }, $Complex_$$$11.$$arity = 1);
    
    Opal.def(self, '$abs', $Complex_abs$12 = function $$abs() {
      var self = this;

      return $$($nesting, 'Math').$hypot(self.real, self.imag)
    }, $Complex_abs$12.$$arity = 0);
    
    Opal.def(self, '$abs2', $Complex_abs2$13 = function $$abs2() {
      var self = this;

      return $rb_plus($rb_times(self.real, self.real), $rb_times(self.imag, self.imag))
    }, $Complex_abs2$13.$$arity = 0);
    
    Opal.def(self, '$angle', $Complex_angle$14 = function $$angle() {
      var self = this;

      return $$($nesting, 'Math').$atan2(self.imag, self.real)
    }, $Complex_angle$14.$$arity = 0);
    $alias(self, "arg", "angle");
    
    Opal.def(self, '$conj', $Complex_conj$15 = function $$conj() {
      var self = this;

      return self.$Complex(self.real, self.imag['$-@']())
    }, $Complex_conj$15.$$arity = 0);
    $alias(self, "conjugate", "conj");
    
    Opal.def(self, '$denominator', $Complex_denominator$16 = function $$denominator() {
      var self = this;

      return self.real.$denominator().$lcm(self.imag.$denominator())
    }, $Complex_denominator$16.$$arity = 0);
    $alias(self, "divide", "/");
    
    Opal.def(self, '$eql?', $Complex_eql$ques$17 = function(other) {
      var self = this, $ret_or_23 = nil, $ret_or_24 = nil;

      if ($truthy(($ret_or_23 = (function() {if ($truthy(($ret_or_24 = $$($nesting, 'Complex')['$==='](other)))) {
        return self.real.$class()['$=='](self.imag.$class())
      } else {
        return $ret_or_24
      }; return nil; })()))) {
        return self['$=='](other)
      } else {
        return $ret_or_23
      }
    }, $Complex_eql$ques$17.$$arity = 1);
    
    Opal.def(self, '$fdiv', $Complex_fdiv$18 = function $$fdiv(other) {
      var self = this;

      
      if ($truthy($$($nesting, 'Numeric')['$==='](other))) {
      } else {
        self.$raise($$($nesting, 'TypeError'), "" + (other.$class()) + " can't be coerced into Complex")
      };
      return $rb_divide(self, other);
    }, $Complex_fdiv$18.$$arity = 1);
    
    Opal.def(self, '$finite?', $Complex_finite$ques$19 = function() {
      var self = this, $ret_or_25 = nil;

      if ($truthy(($ret_or_25 = self.real['$finite?']()))) {
        return self.imag['$finite?']()
      } else {
        return $ret_or_25
      }
    }, $Complex_finite$ques$19.$$arity = 0);
    
    Opal.def(self, '$hash', $Complex_hash$20 = function $$hash() {
      var self = this;

      return "" + "Complex:" + (self.real) + ":" + (self.imag)
    }, $Complex_hash$20.$$arity = 0);
    $alias(self, "imaginary", "imag");
    
    Opal.def(self, '$infinite?', $Complex_infinite$ques$21 = function() {
      var self = this, $ret_or_26 = nil;

      if ($truthy(($ret_or_26 = self.real['$infinite?']()))) {
        return $ret_or_26
      } else {
        return self.imag['$infinite?']()
      }
    }, $Complex_infinite$ques$21.$$arity = 0);
    
    Opal.def(self, '$inspect', $Complex_inspect$22 = function $$inspect() {
      var self = this;

      return "" + "(" + (self) + ")"
    }, $Complex_inspect$22.$$arity = 0);
    $alias(self, "magnitude", "abs");
    
    Opal.udef(self, '$' + "negative?");;
    
    Opal.def(self, '$numerator', $Complex_numerator$23 = function $$numerator() {
      var self = this, d = nil;

      
      d = self.$denominator();
      return self.$Complex($rb_times(self.real.$numerator(), $rb_divide(d, self.real.$denominator())), $rb_times(self.imag.$numerator(), $rb_divide(d, self.imag.$denominator())));
    }, $Complex_numerator$23.$$arity = 0);
    $alias(self, "phase", "arg");
    
    Opal.def(self, '$polar', $Complex_polar$24 = function $$polar() {
      var self = this;

      return [self.$abs(), self.$arg()]
    }, $Complex_polar$24.$$arity = 0);
    
    Opal.udef(self, '$' + "positive?");;
    $alias(self, "quo", "/");
    
    Opal.def(self, '$rationalize', $Complex_rationalize$25 = function $$rationalize(eps) {
      var self = this;

      
      ;
      
      if (arguments.length > 1) {
        self.$raise($$($nesting, 'ArgumentError'), "" + "wrong number of arguments (" + (arguments.length) + " for 0..1)");
      }
    ;
      if ($truthy(self.imag['$!='](0))) {
        self.$raise($$($nesting, 'RangeError'), "" + "can't' convert " + (self) + " into Rational")};
      return self.$real().$rationalize(eps);
    }, $Complex_rationalize$25.$$arity = -1);
    
    Opal.def(self, '$real?', $Complex_real$ques$26 = function() {
      var self = this;

      return false
    }, $Complex_real$ques$26.$$arity = 0);
    
    Opal.def(self, '$rect', $Complex_rect$27 = function $$rect() {
      var self = this;

      return [self.real, self.imag]
    }, $Complex_rect$27.$$arity = 0);
    $alias(self, "rectangular", "rect");
    
    Opal.udef(self, '$' + "step");;
    
    Opal.def(self, '$to_f', $Complex_to_f$28 = function $$to_f() {
      var self = this;

      
      if (self.imag['$=='](0)) {
      } else {
        self.$raise($$($nesting, 'RangeError'), "" + "can't convert " + (self) + " into Float")
      };
      return self.real.$to_f();
    }, $Complex_to_f$28.$$arity = 0);
    
    Opal.def(self, '$to_i', $Complex_to_i$29 = function $$to_i() {
      var self = this;

      
      if (self.imag['$=='](0)) {
      } else {
        self.$raise($$($nesting, 'RangeError'), "" + "can't convert " + (self) + " into Integer")
      };
      return self.real.$to_i();
    }, $Complex_to_i$29.$$arity = 0);
    
    Opal.def(self, '$to_r', $Complex_to_r$30 = function $$to_r() {
      var self = this;

      
      if (self.imag['$=='](0)) {
      } else {
        self.$raise($$($nesting, 'RangeError'), "" + "can't convert " + (self) + " into Rational")
      };
      return self.real.$to_r();
    }, $Complex_to_r$30.$$arity = 0);
    
    Opal.def(self, '$to_s', $Complex_to_s$31 = function $$to_s() {
      var self = this, result = nil, $ret_or_27 = nil, $ret_or_28 = nil, $ret_or_29 = nil, $ret_or_30 = nil, $ret_or_31 = nil;

      
      result = self.real.$inspect();
      result = $rb_plus(result, (function() {if ($truthy((function() {if ($truthy(($ret_or_27 = (function() {if ($truthy(($ret_or_28 = (function() {if ($truthy(($ret_or_29 = $$($nesting, 'Number')['$==='](self.imag)))) {
        return self.imag['$nan?']()
      } else {
        return $ret_or_29
      }; return nil; })()))) {
        return $ret_or_28
      } else {
        return self.imag['$positive?']()
      }; return nil; })()))) {
        return $ret_or_27
      } else {
        return self.imag['$zero?']()
      }; return nil; })())) {
        return "+"
      } else {
        return "-"
      }; return nil; })());
      result = $rb_plus(result, self.imag.$abs().$inspect());
      if ($truthy((function() {if ($truthy(($ret_or_30 = $$($nesting, 'Number')['$==='](self.imag)))) {
        
        if ($truthy(($ret_or_31 = self.imag['$nan?']()))) {
          return $ret_or_31
        } else {
          return self.imag['$infinite?']()
        };
      } else {
        return $ret_or_30
      }; return nil; })())) {
        result = $rb_plus(result, "*")};
      return $rb_plus(result, "i");
    }, $Complex_to_s$31.$$arity = 0);
    Opal.const_set($nesting[0], 'I', self.$new(0, 1));
    return (Opal.defs(self, '$from_string', $Complex_from_string$32 = function $$from_string(str) {
      var self = this;

      
      var re = /[+-]?[\d_]+(\.[\d_]+)?(e\d+)?/,
          match = str.match(re),
          real, imag, denominator;

      function isFloat() {
        return re.test(str);
      }

      function cutFloat() {
        var match = str.match(re);
        var number = match[0];
        str = str.slice(number.length);
        return number.replace(/_/g, '');
      }

      // handles both floats and rationals
      function cutNumber() {
        if (isFloat()) {
          var numerator = parseFloat(cutFloat());

          if (str[0] === '/') {
            // rational real part
            str = str.slice(1);

            if (isFloat()) {
              var denominator = parseFloat(cutFloat());
              return self.$Rational(numerator, denominator);
            } else {
              // reverting '/'
              str = '/' + str;
              return numerator;
            }
          } else {
            // float real part, no denominator
            return numerator;
          }
        } else {
          return null;
        }
      }

      real = cutNumber();

      if (!real) {
        if (str[0] === 'i') {
          // i => Complex(0, 1)
          return self.$Complex(0, 1);
        }
        if (str[0] === '-' && str[1] === 'i') {
          // -i => Complex(0, -1)
          return self.$Complex(0, -1);
        }
        if (str[0] === '+' && str[1] === 'i') {
          // +i => Complex(0, 1)
          return self.$Complex(0, 1);
        }
        // anything => Complex(0, 0)
        return self.$Complex(0, 0);
      }

      imag = cutNumber();
      if (!imag) {
        if (str[0] === 'i') {
          // 3i => Complex(0, 3)
          return self.$Complex(0, real);
        } else {
          // 3 => Complex(3, 0)
          return self.$Complex(real, 0);
        }
      } else {
        // 3+2i => Complex(3, 2)
        return self.$Complex(real, imag);
      }
    
    }, $Complex_from_string$32.$$arity = 1), nil) && 'from_string';
  })($nesting[0], $$($nesting, 'Numeric'), $nesting);
};

Opal.modules["corelib/rational/base"] = function(Opal) {/* Generated by Opal 1.3.0 */
  var self = Opal.top, $nesting = [], nil = Opal.nil, $$$ = Opal.$$$, $$ = Opal.$$, $module = Opal.module, $klass = Opal.klass;

  Opal.add_stubs(['$convert', '$from_string']);
  
  (function($base, $parent_nesting) {
    var self = $module($base, 'Kernel');

    var $nesting = [self].concat($parent_nesting), $Kernel_Rational$1;

    return (Opal.def(self, '$Rational', $Kernel_Rational$1 = function $$Rational(numerator, denominator) {
      var self = this;

      
      
      if (denominator == null) {
        denominator = 1;
      };
      return $$($nesting, 'Rational').$convert(numerator, denominator);
    }, $Kernel_Rational$1.$$arity = -2), nil) && 'Rational'
  })($nesting[0], $nesting);
  return (function($base, $super, $parent_nesting) {
    var self = $klass($base, $super, 'String');

    var $nesting = [self].concat($parent_nesting), $String_to_r$2;

    return (Opal.def(self, '$to_r', $String_to_r$2 = function $$to_r() {
      var self = this;

      return $$($nesting, 'Rational').$from_string(self)
    }, $String_to_r$2.$$arity = 0), nil) && 'to_r'
  })($nesting[0], null, $nesting);
};

Opal.modules["corelib/rational"] = function(Opal) {/* Generated by Opal 1.3.0 */
  function $rb_lt(lhs, rhs) {
    return (typeof(lhs) === 'number' && typeof(rhs) === 'number') ? lhs < rhs : lhs['$<'](rhs);
  }
  function $rb_divide(lhs, rhs) {
    return (typeof(lhs) === 'number' && typeof(rhs) === 'number') ? lhs / rhs : lhs['$/'](rhs);
  }
  function $rb_minus(lhs, rhs) {
    return (typeof(lhs) === 'number' && typeof(rhs) === 'number') ? lhs - rhs : lhs['$-'](rhs);
  }
  function $rb_times(lhs, rhs) {
    return (typeof(lhs) === 'number' && typeof(rhs) === 'number') ? lhs * rhs : lhs['$*'](rhs);
  }
  function $rb_plus(lhs, rhs) {
    return (typeof(lhs) === 'number' && typeof(rhs) === 'number') ? lhs + rhs : lhs['$+'](rhs);
  }
  function $rb_gt(lhs, rhs) {
    return (typeof(lhs) === 'number' && typeof(rhs) === 'number') ? lhs > rhs : lhs['$>'](rhs);
  }
  function $rb_le(lhs, rhs) {
    return (typeof(lhs) === 'number' && typeof(rhs) === 'number') ? lhs <= rhs : lhs['$<='](rhs);
  }
  var self = Opal.top, $nesting = [], nil = Opal.nil, $$$ = Opal.$$$, $$ = Opal.$$, $klass = Opal.klass, $truthy = Opal.truthy, $alias = Opal.alias;

  Opal.add_stubs(['$require', '$to_i', '$==', '$raise', '$<', '$-@', '$new', '$gcd', '$/', '$nil?', '$===', '$reduce', '$to_r', '$equal?', '$!', '$coerce_to!', '$to_f', '$numerator', '$denominator', '$<=>', '$-', '$*', '$__coerced__', '$+', '$Rational', '$>', '$**', '$abs', '$ceil', '$with_precision', '$floor', '$<=', '$truncate', '$send']);
  
  self.$require("corelib/numeric");
  self.$require("corelib/rational/base");
  return (function($base, $super, $parent_nesting) {
    var self = $klass($base, $super, 'Rational');

    var $nesting = [self].concat($parent_nesting), $Rational_reduce$1, $Rational_convert$2, $Rational_initialize$3, $Rational_numerator$4, $Rational_denominator$5, $Rational_coerce$6, $Rational_$eq_eq$7, $Rational_$lt_eq_gt$8, $Rational_$plus$9, $Rational_$minus$10, $Rational_$$11, $Rational_$slash$12, $Rational_$$$13, $Rational_abs$14, $Rational_ceil$15, $Rational_floor$16, $Rational_hash$17, $Rational_inspect$18, $Rational_rationalize$19, $Rational_round$20, $Rational_to_f$21, $Rational_to_i$22, $Rational_to_r$23, $Rational_to_s$24, $Rational_truncate$25, $Rational_with_precision$26, $Rational_from_string$27;

    self.$$prototype.num = self.$$prototype.den = nil;
    
    Opal.defs(self, '$reduce', $Rational_reduce$1 = function $$reduce(num, den) {
      var self = this, gcd = nil;

      
      num = num.$to_i();
      den = den.$to_i();
      if (den['$=='](0)) {
        self.$raise($$($nesting, 'ZeroDivisionError'), "divided by 0")
      } else if ($truthy($rb_lt(den, 0))) {
        
        num = num['$-@']();
        den = den['$-@']();
      } else if (den['$=='](1)) {
        return self.$new(num, den)};
      gcd = num.$gcd(den);
      return self.$new($rb_divide(num, gcd), $rb_divide(den, gcd));
    }, $Rational_reduce$1.$$arity = 2);
    Opal.defs(self, '$convert', $Rational_convert$2 = function $$convert(num, den) {
      var self = this, $ret_or_1 = nil, $ret_or_2 = nil, $ret_or_3 = nil, $ret_or_4 = nil, $ret_or_5 = nil, $ret_or_6 = nil, $ret_or_7 = nil, $ret_or_8 = nil;

      
      if ($truthy((function() {if ($truthy(($ret_or_1 = num['$nil?']()))) {
        return $ret_or_1
      } else {
        return den['$nil?']()
      }; return nil; })())) {
        self.$raise($$($nesting, 'TypeError'), "cannot convert nil into Rational")};
      if ($truthy((function() {if ($truthy(($ret_or_2 = $$($nesting, 'Integer')['$==='](num)))) {
        return $$($nesting, 'Integer')['$==='](den)
      } else {
        return $ret_or_2
      }; return nil; })())) {
        return self.$reduce(num, den)};
      if ($truthy((function() {if ($truthy(($ret_or_3 = (function() {if ($truthy(($ret_or_4 = $$($nesting, 'Float')['$==='](num)))) {
        return $ret_or_4
      } else {
        return $$($nesting, 'String')['$==='](num)
      }; return nil; })()))) {
        return $ret_or_3
      } else {
        return $$($nesting, 'Complex')['$==='](num)
      }; return nil; })())) {
        num = num.$to_r()};
      if ($truthy((function() {if ($truthy(($ret_or_5 = (function() {if ($truthy(($ret_or_6 = $$($nesting, 'Float')['$==='](den)))) {
        return $ret_or_6
      } else {
        return $$($nesting, 'String')['$==='](den)
      }; return nil; })()))) {
        return $ret_or_5
      } else {
        return $$($nesting, 'Complex')['$==='](den)
      }; return nil; })())) {
        den = den.$to_r()};
      if ($truthy((function() {if ($truthy(($ret_or_7 = den['$equal?'](1)))) {
        return $$($nesting, 'Integer')['$==='](num)['$!']()
      } else {
        return $ret_or_7
      }; return nil; })())) {
        return $$($nesting, 'Opal')['$coerce_to!'](num, $$($nesting, 'Rational'), "to_r")
      } else if ($truthy((function() {if ($truthy(($ret_or_8 = $$($nesting, 'Numeric')['$==='](num)))) {
        return $$($nesting, 'Numeric')['$==='](den)
      } else {
        return $ret_or_8
      }; return nil; })())) {
        return $rb_divide(num, den)
      } else {
        return self.$reduce(num, den)
      };
    }, $Rational_convert$2.$$arity = 2);
    
    Opal.def(self, '$initialize', $Rational_initialize$3 = function $$initialize(num, den) {
      var self = this;

      
      self.num = num;
      return (self.den = den);
    }, $Rational_initialize$3.$$arity = 2);
    
    Opal.def(self, '$numerator', $Rational_numerator$4 = function $$numerator() {
      var self = this;

      return self.num
    }, $Rational_numerator$4.$$arity = 0);
    
    Opal.def(self, '$denominator', $Rational_denominator$5 = function $$denominator() {
      var self = this;

      return self.den
    }, $Rational_denominator$5.$$arity = 0);
    
    Opal.def(self, '$coerce', $Rational_coerce$6 = function $$coerce(other) {
      var self = this, $case = nil;

      return (function() {$case = other;
      if ($$($nesting, 'Rational')['$===']($case)) {return [other, self]}
      else if ($$($nesting, 'Integer')['$===']($case)) {return [other.$to_r(), self]}
      else if ($$($nesting, 'Float')['$===']($case)) {return [other, self.$to_f()]}
      else { return nil }})()
    }, $Rational_coerce$6.$$arity = 1);
    
    Opal.def(self, '$==', $Rational_$eq_eq$7 = function(other) {
      var self = this, $case = nil, $ret_or_9 = nil, $ret_or_10 = nil;

      return (function() {$case = other;
      if ($$($nesting, 'Rational')['$===']($case)) {if ($truthy(($ret_or_9 = self.num['$=='](other.$numerator())))) {
        return self.den['$=='](other.$denominator())
      } else {
        return $ret_or_9
      }}
      else if ($$($nesting, 'Integer')['$===']($case)) {if ($truthy(($ret_or_10 = self.num['$=='](other)))) {
        return self.den['$=='](1)
      } else {
        return $ret_or_10
      }}
      else if ($$($nesting, 'Float')['$===']($case)) {return self.$to_f()['$=='](other)}
      else {return other['$=='](self)}})()
    }, $Rational_$eq_eq$7.$$arity = 1);
    
    Opal.def(self, '$<=>', $Rational_$lt_eq_gt$8 = function(other) {
      var self = this, $case = nil;

      return (function() {$case = other;
      if ($$($nesting, 'Rational')['$===']($case)) {return $rb_minus($rb_times(self.num, other.$denominator()), $rb_times(self.den, other.$numerator()))['$<=>'](0)}
      else if ($$($nesting, 'Integer')['$===']($case)) {return $rb_minus(self.num, $rb_times(self.den, other))['$<=>'](0)}
      else if ($$($nesting, 'Float')['$===']($case)) {return self.$to_f()['$<=>'](other)}
      else {return self.$__coerced__("<=>", other)}})()
    }, $Rational_$lt_eq_gt$8.$$arity = 1);
    
    Opal.def(self, '$+', $Rational_$plus$9 = function(other) {
      var self = this, $case = nil, num = nil, den = nil;

      return (function() {$case = other;
      if ($$($nesting, 'Rational')['$===']($case)) {
      num = $rb_plus($rb_times(self.num, other.$denominator()), $rb_times(self.den, other.$numerator()));
      den = $rb_times(self.den, other.$denominator());
      return self.$Rational(num, den);}
      else if ($$($nesting, 'Integer')['$===']($case)) {return self.$Rational($rb_plus(self.num, $rb_times(other, self.den)), self.den)}
      else if ($$($nesting, 'Float')['$===']($case)) {return $rb_plus(self.$to_f(), other)}
      else {return self.$__coerced__("+", other)}})()
    }, $Rational_$plus$9.$$arity = 1);
    
    Opal.def(self, '$-', $Rational_$minus$10 = function(other) {
      var self = this, $case = nil, num = nil, den = nil;

      return (function() {$case = other;
      if ($$($nesting, 'Rational')['$===']($case)) {
      num = $rb_minus($rb_times(self.num, other.$denominator()), $rb_times(self.den, other.$numerator()));
      den = $rb_times(self.den, other.$denominator());
      return self.$Rational(num, den);}
      else if ($$($nesting, 'Integer')['$===']($case)) {return self.$Rational($rb_minus(self.num, $rb_times(other, self.den)), self.den)}
      else if ($$($nesting, 'Float')['$===']($case)) {return $rb_minus(self.$to_f(), other)}
      else {return self.$__coerced__("-", other)}})()
    }, $Rational_$minus$10.$$arity = 1);
    
    Opal.def(self, '$*', $Rational_$$11 = function(other) {
      var self = this, $case = nil, num = nil, den = nil;

      return (function() {$case = other;
      if ($$($nesting, 'Rational')['$===']($case)) {
      num = $rb_times(self.num, other.$numerator());
      den = $rb_times(self.den, other.$denominator());
      return self.$Rational(num, den);}
      else if ($$($nesting, 'Integer')['$===']($case)) {return self.$Rational($rb_times(self.num, other), self.den)}
      else if ($$($nesting, 'Float')['$===']($case)) {return $rb_times(self.$to_f(), other)}
      else {return self.$__coerced__("*", other)}})()
    }, $Rational_$$11.$$arity = 1);
    
    Opal.def(self, '$/', $Rational_$slash$12 = function(other) {
      var self = this, $case = nil, num = nil, den = nil;

      return (function() {$case = other;
      if ($$($nesting, 'Rational')['$===']($case)) {
      num = $rb_times(self.num, other.$denominator());
      den = $rb_times(self.den, other.$numerator());
      return self.$Rational(num, den);}
      else if ($$($nesting, 'Integer')['$===']($case)) {if (other['$=='](0)) {
        return $rb_divide(self.$to_f(), 0.0)
      } else {
        return self.$Rational(self.num, $rb_times(self.den, other))
      }}
      else if ($$($nesting, 'Float')['$===']($case)) {return $rb_divide(self.$to_f(), other)}
      else {return self.$__coerced__("/", other)}})()
    }, $Rational_$slash$12.$$arity = 1);
    
    Opal.def(self, '$**', $Rational_$$$13 = function(other) {
      var self = this, $case = nil, $ret_or_11 = nil, $ret_or_12 = nil;

      return (function() {$case = other;
      if ($$($nesting, 'Integer')['$===']($case)) {if ($truthy((function() {if ($truthy(($ret_or_11 = self['$=='](0)))) {
        return $rb_lt(other, 0)
      } else {
        return $ret_or_11
      }; return nil; })())) {
        return $$$($$($nesting, 'Float'), 'INFINITY')
      } else if ($truthy($rb_gt(other, 0))) {
        return self.$Rational(self.num['$**'](other), self.den['$**'](other))
      } else if ($truthy($rb_lt(other, 0))) {
        return self.$Rational(self.den['$**'](other['$-@']()), self.num['$**'](other['$-@']()))
      } else {
        return self.$Rational(1, 1)
      }}
      else if ($$($nesting, 'Float')['$===']($case)) {return self.$to_f()['$**'](other)}
      else if ($$($nesting, 'Rational')['$===']($case)) {if (other['$=='](0)) {
        return self.$Rational(1, 1)
      } else if (other.$denominator()['$=='](1)) {
        if ($truthy($rb_lt(other, 0))) {
          return self.$Rational(self.den['$**'](other.$numerator().$abs()), self.num['$**'](other.$numerator().$abs()))
        } else {
          return self.$Rational(self.num['$**'](other.$numerator()), self.den['$**'](other.$numerator()))
        }
      } else if ($truthy((function() {if ($truthy(($ret_or_12 = self['$=='](0)))) {
        return $rb_lt(other, 0)
      } else {
        return $ret_or_12
      }; return nil; })())) {
        return self.$raise($$($nesting, 'ZeroDivisionError'), "divided by 0")
      } else {
        return self.$to_f()['$**'](other)
      }}
      else {return self.$__coerced__("**", other)}})()
    }, $Rational_$$$13.$$arity = 1);
    
    Opal.def(self, '$abs', $Rational_abs$14 = function $$abs() {
      var self = this;

      return self.$Rational(self.num.$abs(), self.den.$abs())
    }, $Rational_abs$14.$$arity = 0);
    
    Opal.def(self, '$ceil', $Rational_ceil$15 = function $$ceil(precision) {
      var self = this;

      
      
      if (precision == null) {
        precision = 0;
      };
      if (precision['$=='](0)) {
        return $rb_divide(self.num['$-@'](), self.den)['$-@']().$ceil()
      } else {
        return self.$with_precision("ceil", precision)
      };
    }, $Rational_ceil$15.$$arity = -1);
    $alias(self, "divide", "/");
    
    Opal.def(self, '$floor', $Rational_floor$16 = function $$floor(precision) {
      var self = this;

      
      
      if (precision == null) {
        precision = 0;
      };
      if (precision['$=='](0)) {
        return $rb_divide(self.num['$-@'](), self.den)['$-@']().$floor()
      } else {
        return self.$with_precision("floor", precision)
      };
    }, $Rational_floor$16.$$arity = -1);
    
    Opal.def(self, '$hash', $Rational_hash$17 = function $$hash() {
      var self = this;

      return "" + "Rational:" + (self.num) + ":" + (self.den)
    }, $Rational_hash$17.$$arity = 0);
    
    Opal.def(self, '$inspect', $Rational_inspect$18 = function $$inspect() {
      var self = this;

      return "" + "(" + (self) + ")"
    }, $Rational_inspect$18.$$arity = 0);
    $alias(self, "quo", "/");
    
    Opal.def(self, '$rationalize', $Rational_rationalize$19 = function $$rationalize(eps) {
      var self = this;

      
      ;
      
      if (arguments.length > 1) {
        self.$raise($$($nesting, 'ArgumentError'), "" + "wrong number of arguments (" + (arguments.length) + " for 0..1)");
      }

      if (eps == null) {
        return self;
      }

      var e = eps.$abs(),
          a = $rb_minus(self, e),
          b = $rb_plus(self, e);

      var p0 = 0,
          p1 = 1,
          q0 = 1,
          q1 = 0,
          p2, q2;

      var c, k, t;

      while (true) {
        c = (a).$ceil();

        if ($rb_le(c, b)) {
          break;
        }

        k  = c - 1;
        p2 = k * p1 + p0;
        q2 = k * q1 + q0;
        t  = $rb_divide(1, $rb_minus(b, k));
        b  = $rb_divide(1, $rb_minus(a, k));
        a  = t;

        p0 = p1;
        q0 = q1;
        p1 = p2;
        q1 = q2;
      }

      return self.$Rational(c * p1 + p0, c * q1 + q0);
    ;
    }, $Rational_rationalize$19.$$arity = -1);
    
    Opal.def(self, '$round', $Rational_round$20 = function $$round(precision) {
      var self = this, num = nil, den = nil, approx = nil;

      
      
      if (precision == null) {
        precision = 0;
      };
      if (precision['$=='](0)) {
      } else {
        return self.$with_precision("round", precision)
      };
      if (self.num['$=='](0)) {
        return 0};
      if (self.den['$=='](1)) {
        return self.num};
      num = $rb_plus($rb_times(self.num.$abs(), 2), self.den);
      den = $rb_times(self.den, 2);
      approx = $rb_divide(num, den).$truncate();
      if ($truthy($rb_lt(self.num, 0))) {
        return approx['$-@']()
      } else {
        return approx
      };
    }, $Rational_round$20.$$arity = -1);
    
    Opal.def(self, '$to_f', $Rational_to_f$21 = function $$to_f() {
      var self = this;

      return $rb_divide(self.num, self.den)
    }, $Rational_to_f$21.$$arity = 0);
    
    Opal.def(self, '$to_i', $Rational_to_i$22 = function $$to_i() {
      var self = this;

      return self.$truncate()
    }, $Rational_to_i$22.$$arity = 0);
    
    Opal.def(self, '$to_r', $Rational_to_r$23 = function $$to_r() {
      var self = this;

      return self
    }, $Rational_to_r$23.$$arity = 0);
    
    Opal.def(self, '$to_s', $Rational_to_s$24 = function $$to_s() {
      var self = this;

      return "" + (self.num) + "/" + (self.den)
    }, $Rational_to_s$24.$$arity = 0);
    
    Opal.def(self, '$truncate', $Rational_truncate$25 = function $$truncate(precision) {
      var self = this;

      
      
      if (precision == null) {
        precision = 0;
      };
      if (precision['$=='](0)) {
        if ($truthy($rb_lt(self.num, 0))) {
          return self.$ceil()
        } else {
          return self.$floor()
        }
      } else {
        return self.$with_precision("truncate", precision)
      };
    }, $Rational_truncate$25.$$arity = -1);
    
    Opal.def(self, '$with_precision', $Rational_with_precision$26 = function $$with_precision(method, precision) {
      var self = this, p = nil, s = nil;

      
      if ($truthy($$($nesting, 'Integer')['$==='](precision))) {
      } else {
        self.$raise($$($nesting, 'TypeError'), "not an Integer")
      };
      p = (10)['$**'](precision);
      s = $rb_times(self, p);
      if ($truthy($rb_lt(precision, 1))) {
        return $rb_divide(s.$send(method), p).$to_i()
      } else {
        return self.$Rational(s.$send(method), p)
      };
    }, $Rational_with_precision$26.$$arity = 2);
    return (Opal.defs(self, '$from_string', $Rational_from_string$27 = function $$from_string(string) {
      var self = this;

      
      var str = string.trimLeft(),
          re = /^[+-]?[\d_]+(\.[\d_]+)?/,
          match = str.match(re),
          numerator, denominator;

      function isFloat() {
        return re.test(str);
      }

      function cutFloat() {
        var match = str.match(re);
        var number = match[0];
        str = str.slice(number.length);
        return number.replace(/_/g, '');
      }

      if (isFloat()) {
        numerator = parseFloat(cutFloat());

        if (str[0] === '/') {
          // rational real part
          str = str.slice(1);

          if (isFloat()) {
            denominator = parseFloat(cutFloat());
            return self.$Rational(numerator, denominator);
          } else {
            return self.$Rational(numerator, 1);
          }
        } else {
          return self.$Rational(numerator, 1);
        }
      } else {
        return self.$Rational(0, 1);
      }
    
    }, $Rational_from_string$27.$$arity = 1), nil) && 'from_string';
  })($nesting[0], $$($nesting, 'Numeric'), $nesting);
};

Opal.modules["corelib/time"] = function(Opal) {/* Generated by Opal 1.3.0 */
  function $rb_gt(lhs, rhs) {
    return (typeof(lhs) === 'number' && typeof(rhs) === 'number') ? lhs > rhs : lhs['$>'](rhs);
  }
  function $rb_lt(lhs, rhs) {
    return (typeof(lhs) === 'number' && typeof(rhs) === 'number') ? lhs < rhs : lhs['$<'](rhs);
  }
  function $rb_plus(lhs, rhs) {
    return (typeof(lhs) === 'number' && typeof(rhs) === 'number') ? lhs + rhs : lhs['$+'](rhs);
  }
  function $rb_divide(lhs, rhs) {
    return (typeof(lhs) === 'number' && typeof(rhs) === 'number') ? lhs / rhs : lhs['$/'](rhs);
  }
  function $rb_minus(lhs, rhs) {
    return (typeof(lhs) === 'number' && typeof(rhs) === 'number') ? lhs - rhs : lhs['$-'](rhs);
  }
  function $rb_le(lhs, rhs) {
    return (typeof(lhs) === 'number' && typeof(rhs) === 'number') ? lhs <= rhs : lhs['$<='](rhs);
  }
  var self = Opal.top, $nesting = [], nil = Opal.nil, $$$ = Opal.$$$, $$ = Opal.$$, $slice = Opal.slice, $klass = Opal.klass, $alias = Opal.alias, $truthy = Opal.truthy, $range = Opal.range;

  Opal.add_stubs(['$require', '$include', '$===', '$raise', '$coerce_to!', '$respond_to?', '$to_str', '$to_i', '$new', '$<=>', '$to_f', '$nil?', '$>', '$<', '$strftime', '$year', '$month', '$day', '$+', '$round', '$/', '$-', '$copy_instance_variables', '$initialize_dup', '$is_a?', '$zero?', '$wday', '$utc?', '$mon', '$yday', '$hour', '$min', '$sec', '$rjust', '$ljust', '$zone', '$to_s', '$[]', '$cweek_cyear', '$isdst', '$<=', '$!=', '$==', '$ceil']);
  
  self.$require("corelib/comparable");
  return (function($base, $super, $parent_nesting) {
    var self = $klass($base, $super, 'Time');

    var $nesting = [self].concat($parent_nesting), $Time_at$1, $Time_new$2, $Time_local$3, $Time_gm$4, $Time_now$5, $Time_$plus$6, $Time_$minus$7, $Time_$lt_eq_gt$8, $Time_$eq_eq$9, $Time_asctime$10, $Time_day$11, $Time_yday$12, $Time_isdst$13, $Time_dup$14, $Time_eql$ques$15, $Time_friday$ques$16, $Time_hash$17, $Time_hour$18, $Time_inspect$19, $Time_min$20, $Time_mon$21, $Time_monday$ques$22, $Time_saturday$ques$23, $Time_sec$24, $Time_succ$25, $Time_usec$26, $Time_zone$27, $Time_getgm$28, $Time_gmtime$29, $Time_gmt$ques$30, $Time_gmt_offset$31, $Time_strftime$32, $Time_sunday$ques$33, $Time_thursday$ques$34, $Time_to_a$35, $Time_to_f$36, $Time_to_i$37, $Time_tuesday$ques$38, $Time_wday$39, $Time_wednesday$ques$40, $Time_year$41, $Time_cweek_cyear$42;

    
    self.$include($$($nesting, 'Comparable'));
    
    var days_of_week = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
        short_days   = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
        short_months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
        long_months  = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  ;
    Opal.defs(self, '$at', $Time_at$1 = function $$at(seconds, frac) {
      var self = this;

      
      ;
      
      var result;

      if ($$($nesting, 'Time')['$==='](seconds)) {
        if (frac !== undefined) {
          self.$raise($$($nesting, 'TypeError'), "can't convert Time into an exact number")
        }
        result = new Date(seconds.getTime());
        result.is_utc = seconds.is_utc;
        return result;
      }

      if (!seconds.$$is_number) {
        seconds = $$($nesting, 'Opal')['$coerce_to!'](seconds, $$($nesting, 'Integer'), "to_int");
      }

      if (frac === undefined) {
        return new Date(seconds * 1000);
      }

      if (!frac.$$is_number) {
        frac = $$($nesting, 'Opal')['$coerce_to!'](frac, $$($nesting, 'Integer'), "to_int");
      }

      return new Date(seconds * 1000 + (frac / 1000));
    ;
    }, $Time_at$1.$$arity = -2);
    
    function time_params(year, month, day, hour, min, sec) {
      if (year.$$is_string) {
        year = parseInt(year, 10);
      } else {
        year = $$($nesting, 'Opal')['$coerce_to!'](year, $$($nesting, 'Integer'), "to_int");
      }

      if (month === nil) {
        month = 1;
      } else if (!month.$$is_number) {
        if ((month)['$respond_to?']("to_str")) {
          month = (month).$to_str();
          switch (month.toLowerCase()) {
          case 'jan': month =  1; break;
          case 'feb': month =  2; break;
          case 'mar': month =  3; break;
          case 'apr': month =  4; break;
          case 'may': month =  5; break;
          case 'jun': month =  6; break;
          case 'jul': month =  7; break;
          case 'aug': month =  8; break;
          case 'sep': month =  9; break;
          case 'oct': month = 10; break;
          case 'nov': month = 11; break;
          case 'dec': month = 12; break;
          default: month = (month).$to_i();
          }
        } else {
          month = $$($nesting, 'Opal')['$coerce_to!'](month, $$($nesting, 'Integer'), "to_int");
        }
      }

      if (month < 1 || month > 12) {
        self.$raise($$($nesting, 'ArgumentError'), "" + "month out of range: " + (month))
      }
      month = month - 1;

      if (day === nil) {
        day = 1;
      } else if (day.$$is_string) {
        day = parseInt(day, 10);
      } else {
        day = $$($nesting, 'Opal')['$coerce_to!'](day, $$($nesting, 'Integer'), "to_int");
      }

      if (day < 1 || day > 31) {
        self.$raise($$($nesting, 'ArgumentError'), "" + "day out of range: " + (day))
      }

      if (hour === nil) {
        hour = 0;
      } else if (hour.$$is_string) {
        hour = parseInt(hour, 10);
      } else {
        hour = $$($nesting, 'Opal')['$coerce_to!'](hour, $$($nesting, 'Integer'), "to_int");
      }

      if (hour < 0 || hour > 24) {
        self.$raise($$($nesting, 'ArgumentError'), "" + "hour out of range: " + (hour))
      }

      if (min === nil) {
        min = 0;
      } else if (min.$$is_string) {
        min = parseInt(min, 10);
      } else {
        min = $$($nesting, 'Opal')['$coerce_to!'](min, $$($nesting, 'Integer'), "to_int");
      }

      if (min < 0 || min > 59) {
        self.$raise($$($nesting, 'ArgumentError'), "" + "min out of range: " + (min))
      }

      if (sec === nil) {
        sec = 0;
      } else if (!sec.$$is_number) {
        if (sec.$$is_string) {
          sec = parseInt(sec, 10);
        } else {
          sec = $$($nesting, 'Opal')['$coerce_to!'](sec, $$($nesting, 'Integer'), "to_int");
        }
      }

      if (sec < 0 || sec > 60) {
        self.$raise($$($nesting, 'ArgumentError'), "" + "sec out of range: " + (sec))
      }

      return [year, month, day, hour, min, sec];
    }
  ;
    Opal.defs(self, '$new', $Time_new$2 = function(year, month, day, hour, min, sec, utc_offset) {
      var self = this;

      
      ;
      
      if (month == null) {
        month = nil;
      };
      
      if (day == null) {
        day = nil;
      };
      
      if (hour == null) {
        hour = nil;
      };
      
      if (min == null) {
        min = nil;
      };
      
      if (sec == null) {
        sec = nil;
      };
      
      if (utc_offset == null) {
        utc_offset = nil;
      };
      
      var args, result;

      if (year === undefined) {
        return new Date();
      }

      if (utc_offset !== nil) {
        self.$raise($$($nesting, 'ArgumentError'), "Opal does not support explicitly specifying UTC offset for Time")
      }

      args  = time_params(year, month, day, hour, min, sec);
      year  = args[0];
      month = args[1];
      day   = args[2];
      hour  = args[3];
      min   = args[4];
      sec   = args[5];

      result = new Date(year, month, day, hour, min, 0, sec * 1000);
      if (year < 100) {
        result.setFullYear(year);
      }
      return result;
    ;
    }, $Time_new$2.$$arity = -1);
    Opal.defs(self, '$local', $Time_local$3 = function $$local(year, month, day, hour, min, sec, millisecond, _dummy1, _dummy2, _dummy3) {
      var self = this;

      
      
      if (month == null) {
        month = nil;
      };
      
      if (day == null) {
        day = nil;
      };
      
      if (hour == null) {
        hour = nil;
      };
      
      if (min == null) {
        min = nil;
      };
      
      if (sec == null) {
        sec = nil;
      };
      
      if (millisecond == null) {
        millisecond = nil;
      };
      
      if (_dummy1 == null) {
        _dummy1 = nil;
      };
      
      if (_dummy2 == null) {
        _dummy2 = nil;
      };
      
      if (_dummy3 == null) {
        _dummy3 = nil;
      };
      
      var args, result;

      if (arguments.length === 10) {
        args  = $slice.call(arguments);
        year  = args[5];
        month = args[4];
        day   = args[3];
        hour  = args[2];
        min   = args[1];
        sec   = args[0];
      }

      args  = time_params(year, month, day, hour, min, sec);
      year  = args[0];
      month = args[1];
      day   = args[2];
      hour  = args[3];
      min   = args[4];
      sec   = args[5];

      result = new Date(year, month, day, hour, min, 0, sec * 1000);
      if (year < 100) {
        result.setFullYear(year);
      }
      return result;
    ;
    }, $Time_local$3.$$arity = -2);
    Opal.defs(self, '$gm', $Time_gm$4 = function $$gm(year, month, day, hour, min, sec, millisecond, _dummy1, _dummy2, _dummy3) {
      var self = this;

      
      
      if (month == null) {
        month = nil;
      };
      
      if (day == null) {
        day = nil;
      };
      
      if (hour == null) {
        hour = nil;
      };
      
      if (min == null) {
        min = nil;
      };
      
      if (sec == null) {
        sec = nil;
      };
      
      if (millisecond == null) {
        millisecond = nil;
      };
      
      if (_dummy1 == null) {
        _dummy1 = nil;
      };
      
      if (_dummy2 == null) {
        _dummy2 = nil;
      };
      
      if (_dummy3 == null) {
        _dummy3 = nil;
      };
      
      var args, result;

      if (arguments.length === 10) {
        args  = $slice.call(arguments);
        year  = args[5];
        month = args[4];
        day   = args[3];
        hour  = args[2];
        min   = args[1];
        sec   = args[0];
      }

      args  = time_params(year, month, day, hour, min, sec);
      year  = args[0];
      month = args[1];
      day   = args[2];
      hour  = args[3];
      min   = args[4];
      sec   = args[5];

      result = new Date(Date.UTC(year, month, day, hour, min, 0, sec * 1000));
      if (year < 100) {
        result.setUTCFullYear(year);
      }
      result.is_utc = true;
      return result;
    ;
    }, $Time_gm$4.$$arity = -2);
    (function(self, $parent_nesting) {
      var $nesting = [self].concat($parent_nesting);

      
      $alias(self, "mktime", "local");
      return $alias(self, "utc", "gm");
    })(Opal.get_singleton_class(self), $nesting);
    Opal.defs(self, '$now', $Time_now$5 = function $$now() {
      var self = this;

      return self.$new()
    }, $Time_now$5.$$arity = 0);
    
    Opal.def(self, '$+', $Time_$plus$6 = function(other) {
      var self = this;

      
      if ($truthy($$($nesting, 'Time')['$==='](other))) {
        self.$raise($$($nesting, 'TypeError'), "time + time?")};
      
      if (!other.$$is_number) {
        other = $$($nesting, 'Opal')['$coerce_to!'](other, $$($nesting, 'Integer'), "to_int");
      }
      var result = new Date(self.getTime() + (other * 1000));
      result.is_utc = self.is_utc;
      return result;
    ;
    }, $Time_$plus$6.$$arity = 1);
    
    Opal.def(self, '$-', $Time_$minus$7 = function(other) {
      var self = this;

      
      if ($truthy($$($nesting, 'Time')['$==='](other))) {
        return (self.getTime() - other.getTime()) / 1000};
      
      if (!other.$$is_number) {
        other = $$($nesting, 'Opal')['$coerce_to!'](other, $$($nesting, 'Integer'), "to_int");
      }
      var result = new Date(self.getTime() - (other * 1000));
      result.is_utc = self.is_utc;
      return result;
    ;
    }, $Time_$minus$7.$$arity = 1);
    
    Opal.def(self, '$<=>', $Time_$lt_eq_gt$8 = function(other) {
      var self = this, r = nil;

      if ($truthy($$($nesting, 'Time')['$==='](other))) {
        return self.$to_f()['$<=>'](other.$to_f())
      } else {
        
        r = other['$<=>'](self);
        if ($truthy(r['$nil?']())) {
          return nil
        } else if ($truthy($rb_gt(r, 0))) {
          return -1
        } else if ($truthy($rb_lt(r, 0))) {
          return 1
        } else {
          return 0
        };
      }
    }, $Time_$lt_eq_gt$8.$$arity = 1);
    
    Opal.def(self, '$==', $Time_$eq_eq$9 = function(other) {
      var self = this, $ret_or_1 = nil;

      if ($truthy(($ret_or_1 = $$($nesting, 'Time')['$==='](other)))) {
        return self.$to_f() === other.$to_f()
      } else {
        return $ret_or_1
      }
    }, $Time_$eq_eq$9.$$arity = 1);
    
    Opal.def(self, '$asctime', $Time_asctime$10 = function $$asctime() {
      var self = this;

      return self.$strftime("%a %b %e %H:%M:%S %Y")
    }, $Time_asctime$10.$$arity = 0);
    $alias(self, "ctime", "asctime");
    
    Opal.def(self, '$day', $Time_day$11 = function $$day() {
      var self = this;

      return self.is_utc ? self.getUTCDate() : self.getDate();
    }, $Time_day$11.$$arity = 0);
    
    Opal.def(self, '$yday', $Time_yday$12 = function $$yday() {
      var self = this, start_of_year = nil, start_of_day = nil, one_day = nil;

      
      start_of_year = $$($nesting, 'Time').$new(self.$year()).$to_i();
      start_of_day = $$($nesting, 'Time').$new(self.$year(), self.$month(), self.$day()).$to_i();
      one_day = 86400;
      return $rb_plus($rb_divide($rb_minus(start_of_day, start_of_year), one_day).$round(), 1);
    }, $Time_yday$12.$$arity = 0);
    
    Opal.def(self, '$isdst', $Time_isdst$13 = function $$isdst() {
      var self = this;

      
      var jan = new Date(self.getFullYear(), 0, 1),
          jul = new Date(self.getFullYear(), 6, 1);
      return self.getTimezoneOffset() < Math.max(jan.getTimezoneOffset(), jul.getTimezoneOffset());
    
    }, $Time_isdst$13.$$arity = 0);
    $alias(self, "dst?", "isdst");
    
    Opal.def(self, '$dup', $Time_dup$14 = function $$dup() {
      var self = this, copy = nil;

      
      copy = new Date(self.getTime());
      copy.$copy_instance_variables(self);
      copy.$initialize_dup(self);
      return copy;
    }, $Time_dup$14.$$arity = 0);
    
    Opal.def(self, '$eql?', $Time_eql$ques$15 = function(other) {
      var self = this, $ret_or_2 = nil;

      if ($truthy(($ret_or_2 = other['$is_a?']($$($nesting, 'Time'))))) {
        return self['$<=>'](other)['$zero?']()
      } else {
        return $ret_or_2
      }
    }, $Time_eql$ques$15.$$arity = 1);
    
    Opal.def(self, '$friday?', $Time_friday$ques$16 = function() {
      var self = this;

      return self.$wday() == 5
    }, $Time_friday$ques$16.$$arity = 0);
    
    Opal.def(self, '$hash', $Time_hash$17 = function $$hash() {
      var self = this;

      return 'Time:' + self.getTime();
    }, $Time_hash$17.$$arity = 0);
    
    Opal.def(self, '$hour', $Time_hour$18 = function $$hour() {
      var self = this;

      return self.is_utc ? self.getUTCHours() : self.getHours();
    }, $Time_hour$18.$$arity = 0);
    
    Opal.def(self, '$inspect', $Time_inspect$19 = function $$inspect() {
      var self = this;

      if ($truthy(self['$utc?']())) {
        return self.$strftime("%Y-%m-%d %H:%M:%S UTC")
      } else {
        return self.$strftime("%Y-%m-%d %H:%M:%S %z")
      }
    }, $Time_inspect$19.$$arity = 0);
    $alias(self, "mday", "day");
    
    Opal.def(self, '$min', $Time_min$20 = function $$min() {
      var self = this;

      return self.is_utc ? self.getUTCMinutes() : self.getMinutes();
    }, $Time_min$20.$$arity = 0);
    
    Opal.def(self, '$mon', $Time_mon$21 = function $$mon() {
      var self = this;

      return (self.is_utc ? self.getUTCMonth() : self.getMonth()) + 1;
    }, $Time_mon$21.$$arity = 0);
    
    Opal.def(self, '$monday?', $Time_monday$ques$22 = function() {
      var self = this;

      return self.$wday() == 1
    }, $Time_monday$ques$22.$$arity = 0);
    $alias(self, "month", "mon");
    
    Opal.def(self, '$saturday?', $Time_saturday$ques$23 = function() {
      var self = this;

      return self.$wday() == 6
    }, $Time_saturday$ques$23.$$arity = 0);
    
    Opal.def(self, '$sec', $Time_sec$24 = function $$sec() {
      var self = this;

      return self.is_utc ? self.getUTCSeconds() : self.getSeconds();
    }, $Time_sec$24.$$arity = 0);
    
    Opal.def(self, '$succ', $Time_succ$25 = function $$succ() {
      var self = this;

      
      var result = new Date(self.getTime() + 1000);
      result.is_utc = self.is_utc;
      return result;
    
    }, $Time_succ$25.$$arity = 0);
    
    Opal.def(self, '$usec', $Time_usec$26 = function $$usec() {
      var self = this;

      return self.getMilliseconds() * 1000;
    }, $Time_usec$26.$$arity = 0);
    
    Opal.def(self, '$zone', $Time_zone$27 = function $$zone() {
      var self = this;

      
      var string = self.toString(),
          result;

      if (string.indexOf('(') == -1) {
        result = string.match(/[A-Z]{3,4}/)[0];
      }
      else {
        result = string.match(/\((.+)\)(?:\s|$)/)[1]
      }

      if (result == "GMT" && /(GMT\W*\d{4})/.test(string)) {
        return RegExp.$1;
      }
      else {
        return result;
      }
    
    }, $Time_zone$27.$$arity = 0);
    
    Opal.def(self, '$getgm', $Time_getgm$28 = function $$getgm() {
      var self = this;

      
      var result = new Date(self.getTime());
      result.is_utc = true;
      return result;
    
    }, $Time_getgm$28.$$arity = 0);
    $alias(self, "getutc", "getgm");
    
    Opal.def(self, '$gmtime', $Time_gmtime$29 = function $$gmtime() {
      var self = this;

      
      self.is_utc = true;
      return self;
    
    }, $Time_gmtime$29.$$arity = 0);
    $alias(self, "utc", "gmtime");
    
    Opal.def(self, '$gmt?', $Time_gmt$ques$30 = function() {
      var self = this;

      return self.is_utc === true;
    }, $Time_gmt$ques$30.$$arity = 0);
    
    Opal.def(self, '$gmt_offset', $Time_gmt_offset$31 = function $$gmt_offset() {
      var self = this;

      return self.is_utc ? 0 : -self.getTimezoneOffset() * 60;
    }, $Time_gmt_offset$31.$$arity = 0);
    
    Opal.def(self, '$strftime', $Time_strftime$32 = function $$strftime(format) {
      var self = this;

      
      return format.replace(/%([\-_#^0]*:{0,2})(\d+)?([EO]*)(.)/g, function(full, flags, width, _, conv) {
        var result = "",
            zero   = flags.indexOf('0') !== -1,
            pad    = flags.indexOf('-') === -1,
            blank  = flags.indexOf('_') !== -1,
            upcase = flags.indexOf('^') !== -1,
            invert = flags.indexOf('#') !== -1,
            colons = (flags.match(':') || []).length;

        width = parseInt(width, 10);

        if (zero && blank) {
          if (flags.indexOf('0') < flags.indexOf('_')) {
            zero = false;
          }
          else {
            blank = false;
          }
        }

        switch (conv) {
          case 'Y':
            result += self.$year();
            break;

          case 'C':
            zero    = !blank;
            result += Math.round(self.$year() / 100);
            break;

          case 'y':
            zero    = !blank;
            result += (self.$year() % 100);
            break;

          case 'm':
            zero    = !blank;
            result += self.$mon();
            break;

          case 'B':
            result += long_months[self.$mon() - 1];
            break;

          case 'b':
          case 'h':
            blank   = !zero;
            result += short_months[self.$mon() - 1];
            break;

          case 'd':
            zero    = !blank
            result += self.$day();
            break;

          case 'e':
            blank   = !zero
            result += self.$day();
            break;

          case 'j':
            zero    = !blank;
            width   = isNaN(width) ? 3 : width;
            result += self.$yday();
            break;

          case 'H':
            zero    = !blank;
            result += self.$hour();
            break;

          case 'k':
            blank   = !zero;
            result += self.$hour();
            break;

          case 'I':
            zero    = !blank;
            result += (self.$hour() % 12 || 12);
            break;

          case 'l':
            blank   = !zero;
            result += (self.$hour() % 12 || 12);
            break;

          case 'P':
            result += (self.$hour() >= 12 ? "pm" : "am");
            break;

          case 'p':
            result += (self.$hour() >= 12 ? "PM" : "AM");
            break;

          case 'M':
            zero    = !blank;
            result += self.$min();
            break;

          case 'S':
            zero    = !blank;
            result += self.$sec()
            break;

          case 'L':
            zero    = !blank;
            width   = isNaN(width) ? 3 : width;
            result += self.getMilliseconds();
            break;

          case 'N':
            width   = isNaN(width) ? 9 : width;
            result += (self.getMilliseconds().toString()).$rjust(3, "0");
            result  = (result).$ljust(width, "0");
            break;

          case 'z':
            var offset  = self.getTimezoneOffset(),
                hours   = Math.floor(Math.abs(offset) / 60),
                minutes = Math.abs(offset) % 60;

            result += offset < 0 ? "+" : "-";
            result += hours < 10 ? "0" : "";
            result += hours;

            if (colons > 0) {
              result += ":";
            }

            result += minutes < 10 ? "0" : "";
            result += minutes;

            if (colons > 1) {
              result += ":00";
            }

            break;

          case 'Z':
            result += self.$zone();
            break;

          case 'A':
            result += days_of_week[self.$wday()];
            break;

          case 'a':
            result += short_days[self.$wday()];
            break;

          case 'u':
            result += (self.$wday() + 1);
            break;

          case 'w':
            result += self.$wday();
            break;

          case 'V':
            result += self.$cweek_cyear()['$[]'](0).$to_s().$rjust(2, "0");
            break;

          case 'G':
            result += self.$cweek_cyear()['$[]'](1);
            break;

          case 'g':
            result += self.$cweek_cyear()['$[]'](1)['$[]']($range(-2, -1, false));
            break;

          case 's':
            result += self.$to_i();
            break;

          case 'n':
            result += "\n";
            break;

          case 't':
            result += "\t";
            break;

          case '%':
            result += "%";
            break;

          case 'c':
            result += self.$strftime("%a %b %e %T %Y");
            break;

          case 'D':
          case 'x':
            result += self.$strftime("%m/%d/%y");
            break;

          case 'F':
            result += self.$strftime("%Y-%m-%d");
            break;

          case 'v':
            result += self.$strftime("%e-%^b-%4Y");
            break;

          case 'r':
            result += self.$strftime("%I:%M:%S %p");
            break;

          case 'R':
            result += self.$strftime("%H:%M");
            break;

          case 'T':
          case 'X':
            result += self.$strftime("%H:%M:%S");
            break;

          default:
            return full;
        }

        if (upcase) {
          result = result.toUpperCase();
        }

        if (invert) {
          result = result.replace(/[A-Z]/, function(c) { c.toLowerCase() }).
                          replace(/[a-z]/, function(c) { c.toUpperCase() });
        }

        if (pad && (zero || blank)) {
          result = (result).$rjust(isNaN(width) ? 2 : width, blank ? " " : "0");
        }

        return result;
      });
    
    }, $Time_strftime$32.$$arity = 1);
    
    Opal.def(self, '$sunday?', $Time_sunday$ques$33 = function() {
      var self = this;

      return self.$wday() == 0
    }, $Time_sunday$ques$33.$$arity = 0);
    
    Opal.def(self, '$thursday?', $Time_thursday$ques$34 = function() {
      var self = this;

      return self.$wday() == 4
    }, $Time_thursday$ques$34.$$arity = 0);
    
    Opal.def(self, '$to_a', $Time_to_a$35 = function $$to_a() {
      var self = this;

      return [self.$sec(), self.$min(), self.$hour(), self.$day(), self.$month(), self.$year(), self.$wday(), self.$yday(), self.$isdst(), self.$zone()]
    }, $Time_to_a$35.$$arity = 0);
    
    Opal.def(self, '$to_f', $Time_to_f$36 = function $$to_f() {
      var self = this;

      return self.getTime() / 1000;
    }, $Time_to_f$36.$$arity = 0);
    
    Opal.def(self, '$to_i', $Time_to_i$37 = function $$to_i() {
      var self = this;

      return parseInt(self.getTime() / 1000, 10);
    }, $Time_to_i$37.$$arity = 0);
    $alias(self, "to_s", "inspect");
    
    Opal.def(self, '$tuesday?', $Time_tuesday$ques$38 = function() {
      var self = this;

      return self.$wday() == 2
    }, $Time_tuesday$ques$38.$$arity = 0);
    $alias(self, "tv_sec", "to_i");
    $alias(self, "tv_usec", "usec");
    $alias(self, "utc?", "gmt?");
    $alias(self, "gmtoff", "gmt_offset");
    $alias(self, "utc_offset", "gmt_offset");
    
    Opal.def(self, '$wday', $Time_wday$39 = function $$wday() {
      var self = this;

      return self.is_utc ? self.getUTCDay() : self.getDay();
    }, $Time_wday$39.$$arity = 0);
    
    Opal.def(self, '$wednesday?', $Time_wednesday$ques$40 = function() {
      var self = this;

      return self.$wday() == 3
    }, $Time_wednesday$ques$40.$$arity = 0);
    
    Opal.def(self, '$year', $Time_year$41 = function $$year() {
      var self = this;

      return self.is_utc ? self.getUTCFullYear() : self.getFullYear();
    }, $Time_year$41.$$arity = 0);
    return (Opal.def(self, '$cweek_cyear', $Time_cweek_cyear$42 = function $$cweek_cyear() {
      var self = this, jan01 = nil, jan01_wday = nil, first_monday = nil, year = nil, $ret_or_3 = nil, offset = nil, week = nil, dec31 = nil, dec31_wday = nil, $ret_or_4 = nil;

      
      jan01 = $$($nesting, 'Time').$new(self.$year(), 1, 1);
      jan01_wday = jan01.$wday();
      first_monday = 0;
      year = self.$year();
      if ($truthy((function() {if ($truthy(($ret_or_3 = $rb_le(jan01_wday, 4)))) {
        return jan01_wday['$!='](0)
      } else {
        return $ret_or_3
      }; return nil; })())) {
        offset = $rb_minus(jan01_wday, 1)
      } else {
        
        offset = $rb_minus($rb_minus(jan01_wday, 7), 1);
        if (offset['$=='](-8)) {
          offset = -1};
      };
      week = $rb_divide($rb_plus(self.$yday(), offset), 7.0).$ceil();
      if ($truthy($rb_le(week, 0))) {
        return $$($nesting, 'Time').$new($rb_minus(self.$year(), 1), 12, 31).$cweek_cyear()
      } else if (week['$=='](53)) {
        
        dec31 = $$($nesting, 'Time').$new(self.$year(), 12, 31);
        dec31_wday = dec31.$wday();
        if ($truthy((function() {if ($truthy(($ret_or_4 = $rb_le(dec31_wday, 3)))) {
          return dec31_wday['$!='](0)
        } else {
          return $ret_or_4
        }; return nil; })())) {
          
          week = 1;
          year = $rb_plus(year, 1);};};
      return [week, year];
    }, $Time_cweek_cyear$42.$$arity = 0), nil) && 'cweek_cyear';
  })($nesting[0], Date, $nesting);
};

Opal.modules["corelib/struct"] = function(Opal) {/* Generated by Opal 1.3.0 */
  function $rb_gt(lhs, rhs) {
    return (typeof(lhs) === 'number' && typeof(rhs) === 'number') ? lhs > rhs : lhs['$>'](rhs);
  }
  function $rb_minus(lhs, rhs) {
    return (typeof(lhs) === 'number' && typeof(rhs) === 'number') ? lhs - rhs : lhs['$-'](rhs);
  }
  function $rb_lt(lhs, rhs) {
    return (typeof(lhs) === 'number' && typeof(rhs) === 'number') ? lhs < rhs : lhs['$<'](rhs);
  }
  function $rb_ge(lhs, rhs) {
    return (typeof(lhs) === 'number' && typeof(rhs) === 'number') ? lhs >= rhs : lhs['$>='](rhs);
  }
  function $rb_plus(lhs, rhs) {
    return (typeof(lhs) === 'number' && typeof(rhs) === 'number') ? lhs + rhs : lhs['$+'](rhs);
  }
  var self = Opal.top, $nesting = [], nil = Opal.nil, $$$ = Opal.$$$, $$ = Opal.$$, $klass = Opal.klass, $hash2 = Opal.hash2, $truthy = Opal.truthy, $send = Opal.send, $alias = Opal.alias;

  Opal.add_stubs(['$require', '$include', '$==', '$class', '$!=', '$upcase', '$[]', '$unshift', '$const_name!', '$map', '$coerce_to!', '$new', '$each', '$define_struct_attribute', '$allocate', '$initialize', '$alias_method', '$module_eval', '$to_proc', '$const_set', '$raise', '$<<', '$members', '$define_method', '$instance_eval', '$last', '$>', '$length', '$-', '$keys', '$any?', '$join', '$[]=', '$each_with_index', '$hash', '$===', '$<', '$-@', '$size', '$>=', '$include?', '$to_sym', '$instance_of?', '$__id__', '$eql?', '$enum_for', '$name', '$+', '$each_pair', '$inspect', '$to_h', '$args', '$each_with_object', '$flatten', '$to_a', '$respond_to?', '$dig']);
  
  self.$require("corelib/enumerable");
  return (function($base, $super, $parent_nesting) {
    var self = $klass($base, $super, 'Struct');

    var $nesting = [self].concat($parent_nesting), $Struct_new$1, $Struct_define_struct_attribute$6, $Struct_members$9, $Struct_inherited$10, $Struct_initialize$12, $Struct_initialize_copy$15, $Struct_members$16, $Struct_hash$17, $Struct_$$$18, $Struct_$$$eq$19, $Struct_$eq_eq$20, $Struct_eql$ques$21, $Struct_each$22, $Struct_each_pair$25, $Struct_length$28, $Struct_to_a$29, $Struct_inspect$31, $Struct_to_h$33, $Struct_values_at$35, $Struct_dig$37;

    
    self.$include($$($nesting, 'Enumerable'));
    Opal.defs(self, '$new', $Struct_new$1 = function(const_name, $a, $b) {
      var $iter = $Struct_new$1.$$p, block = $iter || nil, $post_args, $kwargs, args, keyword_init, $$2, $$3, self = this, $ret_or_1 = nil, klass = nil;

      if ($iter) $Struct_new$1.$$p = null;
      
      
      if ($iter) $Struct_new$1.$$p = null;;
      
      $post_args = Opal.slice.call(arguments, 1, arguments.length);
      
      $kwargs = Opal.extract_kwargs($post_args);
      
      if ($kwargs == null) {
        $kwargs = $hash2([], {});
      } else if (!$kwargs.$$is_hash) {
        throw Opal.ArgumentError.$new('expected kwargs');
      };
      
      args = $post_args;;
      
      keyword_init = $kwargs.$$smap["keyword_init"];
      if (keyword_init == null) {
        keyword_init = false
      };
      if ($truthy(const_name)) {
        if ($truthy((function() {if ($truthy(($ret_or_1 = const_name.$class()['$==']($$($nesting, 'String'))))) {
          return const_name['$[]'](0).$upcase()['$!='](const_name['$[]'](0))
        } else {
          return $ret_or_1
        }; return nil; })())) {
          
          args.$unshift(const_name);
          const_name = nil;
        } else {
          
          try {
            const_name = $$($nesting, 'Opal')['$const_name!'](const_name)
          } catch ($err) {
            if (Opal.rescue($err, [$$($nesting, 'TypeError'), $$($nesting, 'NameError')])) {
              try {
                
                args.$unshift(const_name);
                const_name = nil;
              } finally { Opal.pop_exception(); }
            } else { throw $err; }
          };
        }};
      $send(args, 'map', [], ($$2 = function(arg){var self = $$2.$$s == null ? this : $$2.$$s;

        
        
        if (arg == null) {
          arg = nil;
        };
        return $$($nesting, 'Opal')['$coerce_to!'](arg, $$($nesting, 'String'), "to_str");}, $$2.$$s = self, $$2.$$arity = 1, $$2));
      klass = $send($$($nesting, 'Class'), 'new', [self], ($$3 = function(){var self = $$3.$$s == null ? this : $$3.$$s, $$4;

        
        $send(args, 'each', [], ($$4 = function(arg){var self = $$4.$$s == null ? this : $$4.$$s;

          
          
          if (arg == null) {
            arg = nil;
          };
          return self.$define_struct_attribute(arg);}, $$4.$$s = self, $$4.$$arity = 1, $$4));
        return (function(self, $parent_nesting) {
          var $nesting = [self].concat($parent_nesting), $new$5;

          
          
          Opal.def(self, '$new', $new$5 = function($a) {
            var $post_args, args, self = this, instance = nil;

            
            
            $post_args = Opal.slice.call(arguments, 0, arguments.length);
            
            args = $post_args;;
            instance = self.$allocate();
            instance.$$data = {};
            $send(instance, 'initialize', Opal.to_a(args));
            return instance;
          }, $new$5.$$arity = -1);
          return self.$alias_method("[]", "new");
        })(Opal.get_singleton_class(self), $nesting);}, $$3.$$s = self, $$3.$$arity = 0, $$3));
      if ($truthy(block)) {
        $send(klass, 'module_eval', [], block.$to_proc())};
      klass.$$keyword_init = keyword_init;
      if ($truthy(const_name)) {
        $$($nesting, 'Struct').$const_set(const_name, klass)};
      return klass;
    }, $Struct_new$1.$$arity = -2);
    Opal.defs(self, '$define_struct_attribute', $Struct_define_struct_attribute$6 = function $$define_struct_attribute(name) {
      var $$7, $$8, self = this;

      
      if (self['$==']($$($nesting, 'Struct'))) {
        self.$raise($$($nesting, 'ArgumentError'), "you cannot define attributes to the Struct class")};
      self.$members()['$<<'](name);
      $send(self, 'define_method', [name], ($$7 = function(){var self = $$7.$$s == null ? this : $$7.$$s;

        return self.$$data[name];}, $$7.$$s = self, $$7.$$arity = 0, $$7));
      return $send(self, 'define_method', ["" + (name) + "="], ($$8 = function(value){var self = $$8.$$s == null ? this : $$8.$$s;

        
        
        if (value == null) {
          value = nil;
        };
        return self.$$data[name] = value;;}, $$8.$$s = self, $$8.$$arity = 1, $$8));
    }, $Struct_define_struct_attribute$6.$$arity = 1);
    Opal.defs(self, '$members', $Struct_members$9 = function $$members() {
      var self = this, $ret_or_2 = nil;
      if (self.members == null) self.members = nil;

      
      if (self['$==']($$($nesting, 'Struct'))) {
        self.$raise($$($nesting, 'ArgumentError'), "the Struct class has no members")};
      return (self.members = (function() {if ($truthy(($ret_or_2 = self.members))) {
        return $ret_or_2
      } else {
        return []
      }; return nil; })());
    }, $Struct_members$9.$$arity = 0);
    Opal.defs(self, '$inherited', $Struct_inherited$10 = function $$inherited(klass) {
      var $$11, self = this, members = nil;
      if (self.members == null) self.members = nil;

      
      members = self.members;
      return $send(klass, 'instance_eval', [], ($$11 = function(){var self = $$11.$$s == null ? this : $$11.$$s;

        return (self.members = members)}, $$11.$$s = self, $$11.$$arity = 0, $$11));
    }, $Struct_inherited$10.$$arity = 1);
    
    Opal.def(self, '$initialize', $Struct_initialize$12 = function $$initialize($a) {
      var $post_args, args, $$13, $$14, self = this, kwargs = nil, $ret_or_3 = nil, $ret_or_4 = nil, extra = nil;

      
      
      $post_args = Opal.slice.call(arguments, 0, arguments.length);
      
      args = $post_args;;
      if ($truthy(self.$class().$$keyword_init)) {
        
        kwargs = (function() {if ($truthy(($ret_or_3 = args.$last()))) {
          return $ret_or_3
        } else {
          return $hash2([], {})
        }; return nil; })();
        if ($truthy((function() {if ($truthy(($ret_or_4 = $rb_gt(args.$length(), 1)))) {
          return $ret_or_4
        } else {
          return (args.length === 1 && !kwargs.$$is_hash);
        }; return nil; })())) {
          self.$raise($$($nesting, 'ArgumentError'), "" + "wrong number of arguments (given " + (args.$length()) + ", expected 0)")};
        extra = $rb_minus(kwargs.$keys(), self.$class().$members());
        if ($truthy(extra['$any?']())) {
          self.$raise($$($nesting, 'ArgumentError'), "" + "unknown keywords: " + (extra.$join(", ")))};
        return $send(self.$class().$members(), 'each', [], ($$13 = function(name){var self = $$13.$$s == null ? this : $$13.$$s, $writer = nil;

          
          
          if (name == null) {
            name = nil;
          };
          $writer = [name, kwargs['$[]'](name)];
          $send(self, '[]=', Opal.to_a($writer));
          return $writer[$rb_minus($writer["length"], 1)];}, $$13.$$s = self, $$13.$$arity = 1, $$13));
      } else {
        
        if ($truthy($rb_gt(args.$length(), self.$class().$members().$length()))) {
          self.$raise($$($nesting, 'ArgumentError'), "struct size differs")};
        return $send(self.$class().$members(), 'each_with_index', [], ($$14 = function(name, index){var self = $$14.$$s == null ? this : $$14.$$s, $writer = nil;

          
          
          if (name == null) {
            name = nil;
          };
          
          if (index == null) {
            index = nil;
          };
          $writer = [name, args['$[]'](index)];
          $send(self, '[]=', Opal.to_a($writer));
          return $writer[$rb_minus($writer["length"], 1)];}, $$14.$$s = self, $$14.$$arity = 2, $$14));
      };
    }, $Struct_initialize$12.$$arity = -1);
    
    Opal.def(self, '$initialize_copy', $Struct_initialize_copy$15 = function $$initialize_copy(from) {
      var self = this;

      
      self.$$data = {}
      var keys = Object.keys(from.$$data), i, max, name;
      for (i = 0, max = keys.length; i < max; i++) {
        name = keys[i];
        self.$$data[name] = from.$$data[name];
      }
    
    }, $Struct_initialize_copy$15.$$arity = 1);
    
    Opal.def(self, '$members', $Struct_members$16 = function $$members() {
      var self = this;

      return self.$class().$members()
    }, $Struct_members$16.$$arity = 0);
    
    Opal.def(self, '$hash', $Struct_hash$17 = function $$hash() {
      var self = this;

      return $$($nesting, 'Hash').$new(self.$$data).$hash()
    }, $Struct_hash$17.$$arity = 0);
    
    Opal.def(self, '$[]', $Struct_$$$18 = function(name) {
      var self = this;

      
      if ($truthy($$($nesting, 'Integer')['$==='](name))) {
        
        if ($truthy($rb_lt(name, self.$class().$members().$size()['$-@']()))) {
          self.$raise($$($nesting, 'IndexError'), "" + "offset " + (name) + " too small for struct(size:" + (self.$class().$members().$size()) + ")")};
        if ($truthy($rb_ge(name, self.$class().$members().$size()))) {
          self.$raise($$($nesting, 'IndexError'), "" + "offset " + (name) + " too large for struct(size:" + (self.$class().$members().$size()) + ")")};
        name = self.$class().$members()['$[]'](name);
      } else if ($truthy($$($nesting, 'String')['$==='](name))) {
        
        if(!self.$$data.hasOwnProperty(name)) {
          self.$raise($$($nesting, 'NameError').$new("" + "no member '" + (name) + "' in struct", name))
        }
      
      } else {
        self.$raise($$($nesting, 'TypeError'), "" + "no implicit conversion of " + (name.$class()) + " into Integer")
      };
      name = $$($nesting, 'Opal')['$coerce_to!'](name, $$($nesting, 'String'), "to_str");
      return self.$$data[name];;
    }, $Struct_$$$18.$$arity = 1);
    
    Opal.def(self, '$[]=', $Struct_$$$eq$19 = function(name, value) {
      var self = this;

      
      if ($truthy($$($nesting, 'Integer')['$==='](name))) {
        
        if ($truthy($rb_lt(name, self.$class().$members().$size()['$-@']()))) {
          self.$raise($$($nesting, 'IndexError'), "" + "offset " + (name) + " too small for struct(size:" + (self.$class().$members().$size()) + ")")};
        if ($truthy($rb_ge(name, self.$class().$members().$size()))) {
          self.$raise($$($nesting, 'IndexError'), "" + "offset " + (name) + " too large for struct(size:" + (self.$class().$members().$size()) + ")")};
        name = self.$class().$members()['$[]'](name);
      } else if ($truthy($$($nesting, 'String')['$==='](name))) {
        if ($truthy(self.$class().$members()['$include?'](name.$to_sym()))) {
        } else {
          self.$raise($$($nesting, 'NameError').$new("" + "no member '" + (name) + "' in struct", name))
        }
      } else {
        self.$raise($$($nesting, 'TypeError'), "" + "no implicit conversion of " + (name.$class()) + " into Integer")
      };
      name = $$($nesting, 'Opal')['$coerce_to!'](name, $$($nesting, 'String'), "to_str");
      return self.$$data[name] = value;;
    }, $Struct_$$$eq$19.$$arity = 2);
    
    Opal.def(self, '$==', $Struct_$eq_eq$20 = function(other) {
      var self = this;

      
      if ($truthy(other['$instance_of?'](self.$class()))) {
      } else {
        return false
      };
      
      var recursed1 = {}, recursed2 = {};

      function _eqeq(struct, other) {
        var key, a, b;

        recursed1[(struct).$__id__()] = true;
        recursed2[(other).$__id__()] = true;

        for (key in struct.$$data) {
          a = struct.$$data[key];
          b = other.$$data[key];

          if ($$($nesting, 'Struct')['$==='](a)) {
            if (!recursed1.hasOwnProperty((a).$__id__()) || !recursed2.hasOwnProperty((b).$__id__())) {
              if (!_eqeq(a, b)) {
                return false;
              }
            }
          } else {
            if (!(a)['$=='](b)) {
              return false;
            }
          }
        }

        return true;
      }

      return _eqeq(self, other);
    ;
    }, $Struct_$eq_eq$20.$$arity = 1);
    
    Opal.def(self, '$eql?', $Struct_eql$ques$21 = function(other) {
      var self = this;

      
      if ($truthy(other['$instance_of?'](self.$class()))) {
      } else {
        return false
      };
      
      var recursed1 = {}, recursed2 = {};

      function _eqeq(struct, other) {
        var key, a, b;

        recursed1[(struct).$__id__()] = true;
        recursed2[(other).$__id__()] = true;

        for (key in struct.$$data) {
          a = struct.$$data[key];
          b = other.$$data[key];

          if ($$($nesting, 'Struct')['$==='](a)) {
            if (!recursed1.hasOwnProperty((a).$__id__()) || !recursed2.hasOwnProperty((b).$__id__())) {
              if (!_eqeq(a, b)) {
                return false;
              }
            }
          } else {
            if (!(a)['$eql?'](b)) {
              return false;
            }
          }
        }

        return true;
      }

      return _eqeq(self, other);
    ;
    }, $Struct_eql$ques$21.$$arity = 1);
    
    Opal.def(self, '$each', $Struct_each$22 = function $$each() {
      var $$23, $$24, $iter = $Struct_each$22.$$p, $yield = $iter || nil, self = this;

      if ($iter) $Struct_each$22.$$p = null;
      
      if (($yield !== nil)) {
      } else {
        return $send(self, 'enum_for', ["each"], ($$23 = function(){var self = $$23.$$s == null ? this : $$23.$$s;

          return self.$size()}, $$23.$$s = self, $$23.$$arity = 0, $$23))
      };
      $send(self.$class().$members(), 'each', [], ($$24 = function(name){var self = $$24.$$s == null ? this : $$24.$$s;

        
        
        if (name == null) {
          name = nil;
        };
        return Opal.yield1($yield, self['$[]'](name));;}, $$24.$$s = self, $$24.$$arity = 1, $$24));
      return self;
    }, $Struct_each$22.$$arity = 0);
    
    Opal.def(self, '$each_pair', $Struct_each_pair$25 = function $$each_pair() {
      var $$26, $$27, $iter = $Struct_each_pair$25.$$p, $yield = $iter || nil, self = this;

      if ($iter) $Struct_each_pair$25.$$p = null;
      
      if (($yield !== nil)) {
      } else {
        return $send(self, 'enum_for', ["each_pair"], ($$26 = function(){var self = $$26.$$s == null ? this : $$26.$$s;

          return self.$size()}, $$26.$$s = self, $$26.$$arity = 0, $$26))
      };
      $send(self.$class().$members(), 'each', [], ($$27 = function(name){var self = $$27.$$s == null ? this : $$27.$$s;

        
        
        if (name == null) {
          name = nil;
        };
        return Opal.yield1($yield, [name, self['$[]'](name)]);;}, $$27.$$s = self, $$27.$$arity = 1, $$27));
      return self;
    }, $Struct_each_pair$25.$$arity = 0);
    
    Opal.def(self, '$length', $Struct_length$28 = function $$length() {
      var self = this;

      return self.$class().$members().$length()
    }, $Struct_length$28.$$arity = 0);
    $alias(self, "size", "length");
    
    Opal.def(self, '$to_a', $Struct_to_a$29 = function $$to_a() {
      var $$30, self = this;

      return $send(self.$class().$members(), 'map', [], ($$30 = function(name){var self = $$30.$$s == null ? this : $$30.$$s;

        
        
        if (name == null) {
          name = nil;
        };
        return self['$[]'](name);}, $$30.$$s = self, $$30.$$arity = 1, $$30))
    }, $Struct_to_a$29.$$arity = 0);
    $alias(self, "values", "to_a");
    
    Opal.def(self, '$inspect', $Struct_inspect$31 = function $$inspect() {
      var $$32, self = this, result = nil, $ret_or_5 = nil;

      
      result = "#<struct ";
      if ($truthy((function() {if ($truthy(($ret_or_5 = $$($nesting, 'Struct')['$==='](self)))) {
        return self.$class().$name()
      } else {
        return $ret_or_5
      }; return nil; })())) {
        result = $rb_plus(result, "" + (self.$class()) + " ")};
      result = $rb_plus(result, $send(self.$each_pair(), 'map', [], ($$32 = function(name, value){var self = $$32.$$s == null ? this : $$32.$$s;

        
        
        if (name == null) {
          name = nil;
        };
        
        if (value == null) {
          value = nil;
        };
        return "" + (name) + "=" + (value.$inspect());}, $$32.$$s = self, $$32.$$arity = 2, $$32)).$join(", "));
      result = $rb_plus(result, ">");
      return result;
    }, $Struct_inspect$31.$$arity = 0);
    $alias(self, "to_s", "inspect");
    
    Opal.def(self, '$to_h', $Struct_to_h$33 = function $$to_h() {
      var $iter = $Struct_to_h$33.$$p, block = $iter || nil, $$34, self = this;

      if ($iter) $Struct_to_h$33.$$p = null;
      
      
      if ($iter) $Struct_to_h$33.$$p = null;;
      if ((block !== nil)) {
        return $send($send(self, 'map', [], block.$to_proc()), 'to_h', Opal.to_a(self.$args()))};
      return $send(self.$class().$members(), 'each_with_object', [$hash2([], {})], ($$34 = function(name, h){var self = $$34.$$s == null ? this : $$34.$$s, $writer = nil;

        
        
        if (name == null) {
          name = nil;
        };
        
        if (h == null) {
          h = nil;
        };
        $writer = [name, self['$[]'](name)];
        $send(h, '[]=', Opal.to_a($writer));
        return $writer[$rb_minus($writer["length"], 1)];}, $$34.$$s = self, $$34.$$arity = 2, $$34));
    }, $Struct_to_h$33.$$arity = 0);
    
    Opal.def(self, '$values_at', $Struct_values_at$35 = function $$values_at($a) {
      var $post_args, args, $$36, self = this;

      
      
      $post_args = Opal.slice.call(arguments, 0, arguments.length);
      
      args = $post_args;;
      args = $send(args, 'map', [], ($$36 = function(arg){var self = $$36.$$s == null ? this : $$36.$$s;

        
        
        if (arg == null) {
          arg = nil;
        };
        return arg.$$is_range ? arg.$to_a() : arg;}, $$36.$$s = self, $$36.$$arity = 1, $$36)).$flatten();
      
      var result = [];
      for (var i = 0, len = args.length; i < len; i++) {
        if (!args[i].$$is_number) {
          self.$raise($$($nesting, 'TypeError'), "" + "no implicit conversion of " + ((args[i]).$class()) + " into Integer")
        }
        result.push(self['$[]'](args[i]));
      }
      return result;
    ;
    }, $Struct_values_at$35.$$arity = -1);
    return (Opal.def(self, '$dig', $Struct_dig$37 = function $$dig(key, $a) {
      var $post_args, keys, self = this, item = nil;

      
      
      $post_args = Opal.slice.call(arguments, 1, arguments.length);
      
      keys = $post_args;;
      item = (function() {if ($truthy(key.$$is_string && self.$$data.hasOwnProperty(key))) {
        return self.$$data[key] || nil;
      } else {
        return nil
      }; return nil; })();
      
      if (item === nil || keys.length === 0) {
        return item;
      }
    ;
      if ($truthy(item['$respond_to?']("dig"))) {
      } else {
        self.$raise($$($nesting, 'TypeError'), "" + (item.$class()) + " does not have #dig method")
      };
      return $send(item, 'dig', Opal.to_a(keys));
    }, $Struct_dig$37.$$arity = -2), nil) && 'dig';
  })($nesting[0], null, $nesting);
};

Opal.modules["corelib/dir"] = function(Opal) {/* Generated by Opal 1.3.0 */
  var self = Opal.top, $nesting = [], nil = Opal.nil, $$$ = Opal.$$$, $$ = Opal.$$, $klass = Opal.klass, $alias = Opal.alias, $truthy = Opal.truthy;

  Opal.add_stubs(['$[]']);
  return (function($base, $super, $parent_nesting) {
    var self = $klass($base, $super, 'Dir');

    var $nesting = [self].concat($parent_nesting);

    return (function(self, $parent_nesting) {
      var $nesting = [self].concat($parent_nesting), $chdir$1, $pwd$2, $home$3;

      
      
      Opal.def(self, '$chdir', $chdir$1 = function $$chdir(dir) {
        var $iter = $chdir$1.$$p, $yield = $iter || nil, self = this, prev_cwd = nil;

        if ($iter) $chdir$1.$$p = null;
        return (function() { try {
        
        prev_cwd = Opal.current_dir;
        Opal.current_dir = dir;
        return Opal.yieldX($yield, []);;
        } finally {
          Opal.current_dir = prev_cwd
        }; })()
      }, $chdir$1.$$arity = 1);
      
      Opal.def(self, '$pwd', $pwd$2 = function $$pwd() {
        var self = this;

        return Opal.current_dir || '.';
      }, $pwd$2.$$arity = 0);
      $alias(self, "getwd", "pwd");
      return (Opal.def(self, '$home', $home$3 = function $$home() {
        var self = this, $ret_or_1 = nil;

        if ($truthy(($ret_or_1 = $$($nesting, 'ENV')['$[]']("HOME")))) {
          return $ret_or_1
        } else {
          return "."
        }
      }, $home$3.$$arity = 0), nil) && 'home';
    })(Opal.get_singleton_class(self), $nesting)
  })($nesting[0], null, $nesting)
};

Opal.modules["corelib/file"] = function(Opal) {/* Generated by Opal 1.3.0 */
  function $rb_plus(lhs, rhs) {
    return (typeof(lhs) === 'number' && typeof(rhs) === 'number') ? lhs + rhs : lhs['$+'](rhs);
  }
  function $rb_minus(lhs, rhs) {
    return (typeof(lhs) === 'number' && typeof(rhs) === 'number') ? lhs - rhs : lhs['$-'](rhs);
  }
  var self = Opal.top, $nesting = [], nil = Opal.nil, $$$ = Opal.$$$, $$ = Opal.$$, $truthy = Opal.truthy, $klass = Opal.klass, $alias = Opal.alias, $range = Opal.range, $send = Opal.send;

  Opal.add_stubs(['$respond_to?', '$to_path', '$pwd', '$split', '$sub', '$+', '$unshift', '$join', '$home', '$raise', '$start_with?', '$absolute_path', '$coerce_to!', '$basename', '$empty?', '$rindex', '$[]', '$nil?', '$==', '$-', '$length', '$gsub', '$find', '$=~', '$map', '$each_with_index', '$flatten', '$reject', '$to_proc', '$end_with?']);
  return (function($base, $super, $parent_nesting) {
    var self = $klass($base, $super, 'File');

    var $nesting = [self].concat($parent_nesting), windows_root_rx = nil;

    
    Opal.const_set($nesting[0], 'Separator', Opal.const_set($nesting[0], 'SEPARATOR', "/"));
    Opal.const_set($nesting[0], 'ALT_SEPARATOR', nil);
    Opal.const_set($nesting[0], 'PATH_SEPARATOR', ":");
    Opal.const_set($nesting[0], 'FNM_SYSCASE', 0);
    windows_root_rx = /^[a-zA-Z]:(?:\\|\/)/;
    return (function(self, $parent_nesting) {
      var $nesting = [self].concat($parent_nesting), $absolute_path$1, $expand_path$2, $dirname$3, $basename$4, $extname$5, $exist$ques$6, $directory$ques$7, $join$9, $split$12;

      
      
      Opal.def(self, '$absolute_path', $absolute_path$1 = function $$absolute_path(path, basedir) {
        var self = this, sep = nil, sep_chars = nil, new_parts = nil, $ret_or_1 = nil, path_abs = nil, basedir_abs = nil, parts = nil, leading_sep = nil, abs = nil, new_path = nil;

        
        
        if (basedir == null) {
          basedir = nil;
        };
        sep = $$($nesting, 'SEPARATOR');
        sep_chars = $sep_chars();
        new_parts = [];
        path = (function() {if ($truthy(path['$respond_to?']("to_path"))) {
          return path.$to_path()
        } else {
          return path
        }; return nil; })();
        basedir = (function() {if ($truthy(($ret_or_1 = basedir))) {
          return $ret_or_1
        } else {
          return $$($nesting, 'Dir').$pwd()
        }; return nil; })();
        path_abs = path.substr(0, sep.length) === sep || windows_root_rx.test(path);
        basedir_abs = basedir.substr(0, sep.length) === sep || windows_root_rx.test(basedir);
        if ($truthy(path_abs)) {
          
          parts = path.$split(Opal.regexp(["[", sep_chars, "]"]));
          leading_sep = windows_root_rx.test(path) ? '' : path.$sub(Opal.regexp(["^([", sep_chars, "]+).*$"]), "\\1");
          abs = true;
        } else {
          
          parts = $rb_plus(basedir.$split(Opal.regexp(["[", sep_chars, "]"])), path.$split(Opal.regexp(["[", sep_chars, "]"])));
          leading_sep = windows_root_rx.test(basedir) ? '' : basedir.$sub(Opal.regexp(["^([", sep_chars, "]+).*$"]), "\\1");
          abs = basedir_abs;
        };
        
        var part;
        for (var i = 0, ii = parts.length; i < ii; i++) {
          part = parts[i];

          if (
            (part === nil) ||
            (part === ''  && ((new_parts.length === 0) || abs)) ||
            (part === '.' && ((new_parts.length === 0) || abs))
          ) {
            continue;
          }
          if (part === '..') {
            new_parts.pop();
          } else {
            new_parts.push(part);
          }
        }

        if (!abs && parts[0] !== '.') {
          new_parts.$unshift(".")
        }
      ;
        new_path = new_parts.$join(sep);
        if ($truthy(abs)) {
          new_path = $rb_plus(leading_sep, new_path)};
        return new_path;
      }, $absolute_path$1.$$arity = -2);
      
      Opal.def(self, '$expand_path', $expand_path$2 = function $$expand_path(path, basedir) {
        var self = this, sep = nil, sep_chars = nil, home = nil, leading_sep = nil, home_path_regexp = nil;

        
        
        if (basedir == null) {
          basedir = nil;
        };
        sep = $$($nesting, 'SEPARATOR');
        sep_chars = $sep_chars();
        if ($truthy(path[0] === '~' || (basedir && basedir[0] === '~'))) {
          
          home = $$($nesting, 'Dir').$home();
          if ($truthy(home)) {
          } else {
            self.$raise($$($nesting, 'ArgumentError'), "couldn't find HOME environment -- expanding `~'")
          };
          leading_sep = windows_root_rx.test(home) ? '' : home.$sub(Opal.regexp(["^([", sep_chars, "]+).*$"]), "\\1");
          if ($truthy(home['$start_with?'](leading_sep))) {
          } else {
            self.$raise($$($nesting, 'ArgumentError'), "non-absolute home")
          };
          home = $rb_plus(home, sep);
          home_path_regexp = Opal.regexp(["^\\~(?:", sep, "|$)"]);
          path = path.$sub(home_path_regexp, home);
          if ($truthy(basedir)) {
            basedir = basedir.$sub(home_path_regexp, home)};};
        return self.$absolute_path(path, basedir);
      }, $expand_path$2.$$arity = -2);
      $alias(self, "realpath", "expand_path");
      
      // Coerce a given path to a path string using #to_path and #to_str
      function $coerce_to_path(path) {
        if ($truthy((path)['$respond_to?']("to_path"))) {
          path = path.$to_path();
        }

        path = $$($nesting, 'Opal')['$coerce_to!'](path, $$($nesting, 'String'), "to_str");

        return path;
      }

      // Return a RegExp compatible char class
      function $sep_chars() {
        if ($$($nesting, 'ALT_SEPARATOR') === nil) {
          return Opal.escape_regexp($$($nesting, 'SEPARATOR'));
        } else {
          return Opal.escape_regexp($rb_plus($$($nesting, 'SEPARATOR'), $$($nesting, 'ALT_SEPARATOR')));
        }
      }
    ;
      
      Opal.def(self, '$dirname', $dirname$3 = function $$dirname(path) {
        var self = this, sep_chars = nil;

        
        sep_chars = $sep_chars();
        path = $coerce_to_path(path);
        
        var absolute = path.match(new RegExp("" + "^[" + (sep_chars) + "]"));

        path = path.replace(new RegExp("" + "[" + (sep_chars) + "]+$"), ''); // remove trailing separators
        path = path.replace(new RegExp("" + "[^" + (sep_chars) + "]+$"), ''); // remove trailing basename
        path = path.replace(new RegExp("" + "[" + (sep_chars) + "]+$"), ''); // remove final trailing separators

        if (path === '') {
          return absolute ? '/' : '.';
        }

        return path;
      ;
      }, $dirname$3.$$arity = 1);
      
      Opal.def(self, '$basename', $basename$4 = function $$basename(name, suffix) {
        var self = this, sep_chars = nil;

        
        
        if (suffix == null) {
          suffix = nil;
        };
        sep_chars = $sep_chars();
        name = $coerce_to_path(name);
        
        if (name.length == 0) {
          return name;
        }

        if (suffix !== nil) {
          suffix = $$($nesting, 'Opal')['$coerce_to!'](suffix, $$($nesting, 'String'), "to_str")
        } else {
          suffix = null;
        }

        name = name.replace(new RegExp("" + "(.)[" + (sep_chars) + "]*$"), '$1');
        name = name.replace(new RegExp("" + "^(?:.*[" + (sep_chars) + "])?([^" + (sep_chars) + "]+)$"), '$1');

        if (suffix === ".*") {
          name = name.replace(/\.[^\.]+$/, '');
        } else if(suffix !== null) {
          suffix = Opal.escape_regexp(suffix);
          name = name.replace(new RegExp("" + (suffix) + "$"), '');
        }

        return name;
      ;
      }, $basename$4.$$arity = -2);
      
      Opal.def(self, '$extname', $extname$5 = function $$extname(path) {
        var self = this, filename = nil, last_dot_idx = nil, $ret_or_2 = nil;

        
        path = $coerce_to_path(path);
        filename = self.$basename(path);
        if ($truthy(filename['$empty?']())) {
          return ""};
        last_dot_idx = filename['$[]']($range(1, -1, false)).$rindex(".");
        if ($truthy((function() {if ($truthy(($ret_or_2 = last_dot_idx['$nil?']()))) {
          return $ret_or_2
        } else {
          return $rb_plus(last_dot_idx, 1)['$==']($rb_minus(filename.$length(), 1))
        }; return nil; })())) {
          return ""
        } else {
          return filename['$[]'](Opal.Range.$new($rb_plus(last_dot_idx, 1), -1, false))
        };
      }, $extname$5.$$arity = 1);
      
      Opal.def(self, '$exist?', $exist$ques$6 = function(path) {
        var self = this;

        return Opal.modules[path] != null
      }, $exist$ques$6.$$arity = 1);
      $alias(self, "exists?", "exist?");
      
      Opal.def(self, '$directory?', $directory$ques$7 = function(path) {
        var $$8, self = this, files = nil, file = nil;

        
        files = [];
        
        for (var key in Opal.modules) {
          files.push(key)
        }
      ;
        path = path.$gsub(Opal.regexp(["(^.", $$($nesting, 'SEPARATOR'), "+|", $$($nesting, 'SEPARATOR'), "+$)"]));
        file = $send(files, 'find', [], ($$8 = function(f){var self = $$8.$$s == null ? this : $$8.$$s;

          
          
          if (f == null) {
            f = nil;
          };
          return f['$=~'](Opal.regexp(["^", path]));}, $$8.$$s = self, $$8.$$arity = 1, $$8));
        return file;
      }, $directory$ques$7.$$arity = 1);
      
      Opal.def(self, '$join', $join$9 = function $$join($a) {
        var $post_args, paths, $$10, $$11, self = this, result = nil;

        
        
        $post_args = Opal.slice.call(arguments, 0, arguments.length);
        
        paths = $post_args;;
        if ($truthy(paths['$empty?']())) {
          return ""};
        result = "";
        paths = $send(paths.$flatten().$each_with_index(), 'map', [], ($$10 = function(item, index){var self = $$10.$$s == null ? this : $$10.$$s, $ret_or_3 = nil, $ret_or_4 = nil;

          
          
          if (item == null) {
            item = nil;
          };
          
          if (index == null) {
            index = nil;
          };
          if ($truthy((function() {if ($truthy(($ret_or_3 = index['$=='](0)))) {
            return item['$empty?']()
          } else {
            return $ret_or_3
          }; return nil; })())) {
            return $$($nesting, 'SEPARATOR')
          } else if ($truthy((function() {if ($truthy(($ret_or_4 = paths.$length()['$==']($rb_plus(index, 1))))) {
            return item['$empty?']()
          } else {
            return $ret_or_4
          }; return nil; })())) {
            return $$($nesting, 'SEPARATOR')
          } else {
            return item
          };}, $$10.$$s = self, $$10.$$arity = 2, $$10));
        paths = $send(paths, 'reject', [], "empty?".$to_proc());
        $send(paths, 'each_with_index', [], ($$11 = function(item, index){var self = $$11.$$s == null ? this : $$11.$$s, next_item = nil, $ret_or_5 = nil, $ret_or_6 = nil;

          
          
          if (item == null) {
            item = nil;
          };
          
          if (index == null) {
            index = nil;
          };
          next_item = paths['$[]']($rb_plus(index, 1));
          if ($truthy(next_item['$nil?']())) {
            return (result = "" + (result) + (item))
          } else {
            
            if ($truthy((function() {if ($truthy(($ret_or_5 = item['$end_with?']($$($nesting, 'SEPARATOR'))))) {
              return next_item['$start_with?']($$($nesting, 'SEPARATOR'))
            } else {
              return $ret_or_5
            }; return nil; })())) {
              item = item.$sub(Opal.regexp([$$($nesting, 'SEPARATOR'), "+$"]), "")};
            return (result = (function() {if ($truthy((function() {if ($truthy(($ret_or_6 = item['$end_with?']($$($nesting, 'SEPARATOR'))))) {
              return $ret_or_6
            } else {
              return next_item['$start_with?']($$($nesting, 'SEPARATOR'))
            }; return nil; })())) {
              return "" + (result) + (item)
            } else {
              return "" + (result) + (item) + ($$($nesting, 'SEPARATOR'))
            }; return nil; })());
          };}, $$11.$$s = self, $$11.$$arity = 2, $$11));
        return result;
      }, $join$9.$$arity = -1);
      return (Opal.def(self, '$split', $split$12 = function $$split(path) {
        var self = this;

        return path.$split($$($nesting, 'SEPARATOR'))
      }, $split$12.$$arity = 1), nil) && 'split';
    })(Opal.get_singleton_class(self), $nesting);
  })($nesting[0], $$($nesting, 'IO'), $nesting)
};

Opal.modules["corelib/process/base"] = function(Opal) {/* Generated by Opal 1.3.0 */
  var self = Opal.top, $nesting = [], nil = Opal.nil, $$$ = Opal.$$$, $$ = Opal.$$, $klass = Opal.klass;

  
  (function($base, $super, $parent_nesting) {
    var self = $klass($base, $super, 'Signal');

    var $nesting = [self].concat($parent_nesting), $Signal_trap$1;

    return (Opal.defs(self, '$trap', $Signal_trap$1 = function $$trap($a) {
      var $post_args, $rest_arg, self = this;

      
      
      $post_args = Opal.slice.call(arguments, 0, arguments.length);
      
      $rest_arg = $post_args;;
      return nil;
    }, $Signal_trap$1.$$arity = -1), nil) && 'trap'
  })($nesting[0], null, $nesting);
  return (function($base, $super, $parent_nesting) {
    var self = $klass($base, $super, 'GC');

    var $nesting = [self].concat($parent_nesting), $GC_start$2;

    return (Opal.defs(self, '$start', $GC_start$2 = function $$start() {
      var self = this;

      return nil
    }, $GC_start$2.$$arity = 0), nil) && 'start'
  })($nesting[0], null, $nesting);
};

Opal.modules["corelib/process"] = function(Opal) {/* Generated by Opal 1.3.0 */
  var self = Opal.top, $nesting = [], nil = Opal.nil, $$$ = Opal.$$$, $$ = Opal.$$, $module = Opal.module, $truthy = Opal.truthy;

  Opal.add_stubs(['$const_set', '$size', '$<<', '$__register_clock__', '$to_f', '$now', '$new', '$[]', '$raise']);
  return (function($base, $parent_nesting) {
    var self = $module($base, 'Process');

    var $nesting = [self].concat($parent_nesting), $Process___register_clock__$1, $Process_pid$2, $Process_times$3, $Process_clock_gettime$4, monotonic = nil;

    
    self.__clocks__ = [];
    Opal.defs(self, '$__register_clock__', $Process___register_clock__$1 = function $$__register_clock__(name, func) {
      var self = this;
      if (self.__clocks__ == null) self.__clocks__ = nil;

      
      self.$const_set(name, self.__clocks__.$size());
      return self.__clocks__['$<<'](func);
    }, $Process___register_clock__$1.$$arity = 2);
    self.$__register_clock__("CLOCK_REALTIME", function() { return Date.now() });
    monotonic = false;
    
    if (Opal.global.performance) {
      monotonic = function() {
        return performance.now()
      };
    }
    else if (Opal.global.process && process.hrtime) {
      // let now be the base to get smaller numbers
      var hrtime_base = process.hrtime();

      monotonic = function() {
        var hrtime = process.hrtime(hrtime_base);
        var us = (hrtime[1] / 1000) | 0; // cut below microsecs;
        return ((hrtime[0] * 1000) + (us / 1000));
      };
    }
  ;
    if ($truthy(monotonic)) {
      self.$__register_clock__("CLOCK_MONOTONIC", monotonic)};
    Opal.defs(self, '$pid', $Process_pid$2 = function $$pid() {
      var self = this;

      return 0
    }, $Process_pid$2.$$arity = 0);
    Opal.defs(self, '$times', $Process_times$3 = function $$times() {
      var self = this, t = nil;

      
      t = $$($nesting, 'Time').$now().$to_f();
      return $$$($$($nesting, 'Benchmark'), 'Tms').$new(t, t, t, t, t);
    }, $Process_times$3.$$arity = 0);
    return (Opal.defs(self, '$clock_gettime', $Process_clock_gettime$4 = function $$clock_gettime(clock_id, unit) {
      var self = this, $ret_or_1 = nil, clock = nil;
      if (self.__clocks__ == null) self.__clocks__ = nil;

      
      
      if (unit == null) {
        unit = "float_second";
      };
      if ($truthy(($ret_or_1 = (clock = self.__clocks__['$[]'](clock_id))))) {
        $ret_or_1
      } else {
        self.$raise($$$($$($nesting, 'Errno'), 'EINVAL'), "" + "clock_gettime(" + (clock_id) + ") " + (self.__clocks__['$[]'](clock_id)))
      };
      
      var ms = clock();
      switch (unit) {
        case 'float_second':      return  (ms / 1000);         // number of seconds as a float (default)
        case 'float_millisecond': return  (ms / 1);            // number of milliseconds as a float
        case 'float_microsecond': return  (ms * 1000);         // number of microseconds as a float
        case 'second':            return ((ms / 1000)    | 0); // number of seconds as an integer
        case 'millisecond':       return ((ms / 1)       | 0); // number of milliseconds as an integer
        case 'microsecond':       return ((ms * 1000)    | 0); // number of microseconds as an integer
        case 'nanosecond':        return ((ms * 1000000) | 0); // number of nanoseconds as an integer
        default: self.$raise($$($nesting, 'ArgumentError'), "" + "unexpected unit: " + (unit))
      }
    ;
    }, $Process_clock_gettime$4.$$arity = -2), nil) && 'clock_gettime';
  })($nesting[0], $nesting)
};

Opal.modules["corelib/random/formatter"] = function(Opal) {/* Generated by Opal 1.3.0 */
  function $rb_minus(lhs, rhs) {
    return (typeof(lhs) === 'number' && typeof(rhs) === 'number') ? lhs - rhs : lhs['$-'](rhs);
  }
  function $rb_divide(lhs, rhs) {
    return (typeof(lhs) === 'number' && typeof(rhs) === 'number') ? lhs / rhs : lhs['$/'](rhs);
  }
  var self = Opal.top, $nesting = [], nil = Opal.nil, $$$ = Opal.$$$, $$ = Opal.$$, $klass = Opal.klass, $module = Opal.module, $send = Opal.send, $range = Opal.range;

  Opal.add_stubs(['$_verify_count', '$bytes', '$encode', '$strict_encode64', '$random_bytes', '$urlsafe_encode64', '$split', '$hex', '$[]=', '$-', '$[]', '$map', '$to_proc', '$join', '$times', '$<<', '$|', '$ord', '$/', '$abs', '$random_float', '$raise', '$coerce_to!', '$flatten', '$new', '$random_number', '$length', '$include', '$extend']);
  return (function($base, $super, $parent_nesting) {
    var self = $klass($base, $super, 'Random');

    var $nesting = [self].concat($parent_nesting);

    
    (function($base, $parent_nesting) {
      var self = $module($base, 'Formatter');

      var $nesting = [self].concat($parent_nesting), $Formatter_hex$1, $Formatter_random_bytes$2, $Formatter_base64$3, $Formatter_urlsafe_base64$4, $Formatter_uuid$5, $Formatter_random_float$6, $Formatter_random_number$8, $Formatter_alphanumeric$9;

      
      
      Opal.def(self, '$hex', $Formatter_hex$1 = function $$hex(count) {
        var self = this;

        
        
        if (count == null) {
          count = nil;
        };
        count = $$($nesting, 'Random').$_verify_count(count);
        
        var bytes = self.$bytes(count);
        var out = "";
        for (var i = 0; i < count; i++) {
          out += bytes.charCodeAt(i).toString(16).padStart(2, '0');
        }
        return (out).$encode("US-ASCII");
      ;
      }, $Formatter_hex$1.$$arity = -1);
      
      Opal.def(self, '$random_bytes', $Formatter_random_bytes$2 = function $$random_bytes(count) {
        var self = this;

        
        
        if (count == null) {
          count = nil;
        };
        return self.$bytes(count);
      }, $Formatter_random_bytes$2.$$arity = -1);
      
      Opal.def(self, '$base64', $Formatter_base64$3 = function $$base64(count) {
        var self = this;

        
        
        if (count == null) {
          count = nil;
        };
        return $$($nesting, 'Base64').$strict_encode64(self.$random_bytes(count)).$encode("US-ASCII");
      }, $Formatter_base64$3.$$arity = -1);
      
      Opal.def(self, '$urlsafe_base64', $Formatter_urlsafe_base64$4 = function $$urlsafe_base64(count, padding) {
        var self = this;

        
        
        if (count == null) {
          count = nil;
        };
        
        if (padding == null) {
          padding = false;
        };
        return $$($nesting, 'Base64').$urlsafe_encode64(self.$random_bytes(count), padding).$encode("US-ASCII");
      }, $Formatter_urlsafe_base64$4.$$arity = -1);
      
      Opal.def(self, '$uuid', $Formatter_uuid$5 = function $$uuid() {
        var self = this, str = nil, $writer = nil;

        
        str = self.$hex(16).$split("");
        
        $writer = [12, "4"];
        $send(str, '[]=', Opal.to_a($writer));
        $writer[$rb_minus($writer["length"], 1)];;
        
        $writer = [16, (parseInt(str['$[]'](16), 16) & 3 | 8).toString(16)];
        $send(str, '[]=', Opal.to_a($writer));
        $writer[$rb_minus($writer["length"], 1)];;
        str = [str['$[]']($range(0, 8, true)), str['$[]']($range(8, 12, true)), str['$[]']($range(12, 16, true)), str['$[]']($range(16, 20, true)), str['$[]']($range(20, 32, true))];
        str = $send(str, 'map', [], "join".$to_proc());
        return str.$join("-");
      }, $Formatter_uuid$5.$$arity = 0);
      
      Opal.def(self, '$random_float', $Formatter_random_float$6 = function $$random_float() {
        var $$7, self = this, bs = nil, num = nil;

        
        bs = self.$bytes(4);
        num = 0;
        $send((4), 'times', [], ($$7 = function(i){var self = $$7.$$s == null ? this : $$7.$$s;

          
          
          if (i == null) {
            i = nil;
          };
          num = num['$<<'](8);
          return (num = num['$|'](bs['$[]'](i).$ord()));}, $$7.$$s = self, $$7.$$arity = 1, $$7));
        return $rb_divide(num.$abs(), 2147483647);
      }, $Formatter_random_float$6.$$arity = 0);
      
      Opal.def(self, '$random_number', $Formatter_random_number$8 = function $$random_number(limit) {
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
            self.$raise($$($nesting, 'ArgumentError'), "" + "invalid argument - " + (limit))
          }

          if (limit % 1 === 0) {
            // integer
            return randomInt(limit);
          } else {
            return randomFloat() * limit;
          }
        } else {
          limit = $$($nesting, 'Opal')['$coerce_to!'](limit, $$($nesting, 'Integer'), "to_int");

          if (limit <= 0) {
            self.$raise($$($nesting, 'ArgumentError'), "" + "invalid argument - " + (limit))
          }

          return randomInt(limit);
        }
      ;
      }, $Formatter_random_number$8.$$arity = -1);
      return (Opal.def(self, '$alphanumeric', $Formatter_alphanumeric$9 = function $$alphanumeric(count) {
        var $$10, self = this, map = nil;

        
        
        if (count == null) {
          count = nil;
        };
        count = $$($nesting, 'Random').$_verify_count(count);
        map = $send([$range("0", "9", false), $range("a", "z", false), $range("A", "Z", false)], 'map', [], "to_a".$to_proc()).$flatten();
        return $send($$($nesting, 'Array'), 'new', [count], ($$10 = function(i){var self = $$10.$$s == null ? this : $$10.$$s;

          
          
          if (i == null) {
            i = nil;
          };
          return map['$[]'](self.$random_number(map.$length()));}, $$10.$$s = self, $$10.$$arity = 1, $$10)).$join();
      }, $Formatter_alphanumeric$9.$$arity = -1), nil) && 'alphanumeric';
    })($nesting[0], $nesting);
    self.$include($$$($$($nesting, 'Random'), 'Formatter'));
    return self.$extend($$$($$($nesting, 'Random'), 'Formatter'));
  })($nesting[0], null, $nesting)
};

Opal.modules["corelib/random/mersenne_twister"] = function(Opal) {/* Generated by Opal 1.3.0 */
  function $rb_minus(lhs, rhs) {
    return (typeof(lhs) === 'number' && typeof(rhs) === 'number') ? lhs - rhs : lhs['$-'](rhs);
  }
  var self = Opal.top, $nesting = [], nil = Opal.nil, $$$ = Opal.$$$, $$ = Opal.$$, $klass = Opal.klass, $send = Opal.send, mersenne_twister = nil;

  Opal.add_stubs(['$generator=', '$-']);
  
  mersenne_twister = (function() {
  /* Period parameters */
  var N = 624;
  var M = 397;
  var MATRIX_A = 0x9908b0df;      /* constant vector a */
  var UMASK = 0x80000000;         /* most significant w-r bits */
  var LMASK = 0x7fffffff;         /* least significant r bits */
  var MIXBITS = function(u,v) { return ( ((u) & UMASK) | ((v) & LMASK) ); };
  var TWIST = function(u,v) { return (MIXBITS((u),(v)) >>> 1) ^ ((v & 0x1) ? MATRIX_A : 0x0); };

  function init(s) {
    var mt = {left: 0, next: N, state: new Array(N)};
    init_genrand(mt, s);
    return mt;
  }

  /* initializes mt[N] with a seed */
  function init_genrand(mt, s) {
    var j, i;
    mt.state[0] = s >>> 0;
    for (j=1; j<N; j++) {
      mt.state[j] = (1812433253 * ((mt.state[j-1] ^ (mt.state[j-1] >> 30) >>> 0)) + j);
      /* See Knuth TAOCP Vol2. 3rd Ed. P.106 for multiplier. */
      /* In the previous versions, MSBs of the seed affect   */
      /* only MSBs of the array state[].                     */
      /* 2002/01/09 modified by Makoto Matsumoto             */
      mt.state[j] &= 0xffffffff;  /* for >32 bit machines */
    }
    mt.left = 1;
    mt.next = N;
  }

  /* generate N words at one time */
  function next_state(mt) {
    var p = 0, _p = mt.state;
    var j;

    mt.left = N;
    mt.next = 0;

    for (j=N-M+1; --j; p++)
      _p[p] = _p[p+(M)] ^ TWIST(_p[p+(0)], _p[p+(1)]);

    for (j=M; --j; p++)
      _p[p] = _p[p+(M-N)] ^ TWIST(_p[p+(0)], _p[p+(1)]);

    _p[p] = _p[p+(M-N)] ^ TWIST(_p[p+(0)], _p[0]);
  }

  /* generates a random number on [0,0xffffffff]-interval */
  function genrand_int32(mt) {
    /* mt must be initialized */
    var y;

    if (--mt.left <= 0) next_state(mt);
    y = mt.state[mt.next++];

    /* Tempering */
    y ^= (y >>> 11);
    y ^= (y << 7) & 0x9d2c5680;
    y ^= (y << 15) & 0xefc60000;
    y ^= (y >>> 18);

    return y >>> 0;
  }

  function int_pair_to_real_exclusive(a, b) {
    a >>>= 5;
    b >>>= 6;
    return(a*67108864.0+b)*(1.0/9007199254740992.0);
  }

  // generates a random number on [0,1) with 53-bit resolution
  function genrand_real(mt) {
    /* mt must be initialized */
    var a = genrand_int32(mt), b = genrand_int32(mt);
    return int_pair_to_real_exclusive(a, b);
  }

  return { genrand_real: genrand_real, init: init };
})();
  return (function($base, $super, $parent_nesting) {
    var self = $klass($base, $super, 'Random');

    var $nesting = [self].concat($parent_nesting), $writer = nil;

    
    var MAX_INT = Number.MAX_SAFE_INTEGER || Math.pow(2, 53) - 1;
    Opal.const_set($nesting[0], 'MERSENNE_TWISTER_GENERATOR', {
    new_seed: function() { return Math.round(Math.random() * MAX_INT); },
    reseed: function(seed) { return mersenne_twister.init(seed); },
    rand: function(mt) { return mersenne_twister.genrand_real(mt); }
  });
    
    $writer = [$$($nesting, 'MERSENNE_TWISTER_GENERATOR')];
    $send(self, 'generator=', Opal.to_a($writer));
    return $writer[$rb_minus($writer["length"], 1)];;
  })($nesting[0], null, $nesting);
};

Opal.modules["corelib/random"] = function(Opal) {/* Generated by Opal 1.3.0 */
  var self = Opal.top, $nesting = [], nil = Opal.nil, $$$ = Opal.$$$, $$ = Opal.$$, $falsy = Opal.falsy, $klass = Opal.klass, $truthy = Opal.truthy, $send = Opal.send;

  Opal.add_stubs(['$require', '$attr_reader', '$to_int', '$raise', '$new_seed', '$coerce_to!', '$reseed', '$rand', '$seed', '$bytes', '$===', '$==', '$state', '$_verify_count', '$encode', '$join', '$new', '$chr', '$random_number', '$random_float', '$const_defined?', '$const_set']);
  
  self.$require("corelib/random/formatter");
  (function($base, $super, $parent_nesting) {
    var self = $klass($base, $super, 'Random');

    var $nesting = [self].concat($parent_nesting), $Random__verify_count$1, $Random_initialize$2, $Random_reseed$3, $Random_new_seed$4, $Random_rand$5, $Random_srand$6, $Random_urandom$7, $Random_$eq_eq$8, $Random_bytes$9, $Random_bytes$11, $Random_rand$12, $Random_random_float$13, $Random_random_float$14, $Random_generator$eq$15;

    
    self.$attr_reader("seed", "state");
    Opal.defs(self, '$_verify_count', $Random__verify_count$1 = function $$_verify_count(count) {
      var self = this;

      
      if ($falsy(count)) count = 16;
      if (typeof count !== "number") count = (count).$to_int();
      if (count < 0) self.$raise($$($nesting, 'ArgumentError'), "negative string size (or size too big)");
      count = Math.floor(count);
      return count;
    
    }, $Random__verify_count$1.$$arity = 1);
    
    Opal.def(self, '$initialize', $Random_initialize$2 = function $$initialize(seed) {
      var self = this;

      
      
      if (seed == null) {
        seed = $$($nesting, 'Random').$new_seed();
      };
      seed = $$($nesting, 'Opal')['$coerce_to!'](seed, $$($nesting, 'Integer'), "to_int");
      self.state = seed;
      return self.$reseed(seed);
    }, $Random_initialize$2.$$arity = -1);
    
    Opal.def(self, '$reseed', $Random_reseed$3 = function $$reseed(seed) {
      var self = this;

      
      self.seed = seed;
      return self.$rng = Opal.$$rand.reseed(seed);;
    }, $Random_reseed$3.$$arity = 1);
    Opal.defs(self, '$new_seed', $Random_new_seed$4 = function $$new_seed() {
      var self = this;

      return Opal.$$rand.new_seed();
    }, $Random_new_seed$4.$$arity = 0);
    Opal.defs(self, '$rand', $Random_rand$5 = function $$rand(limit) {
      var self = this;

      
      ;
      return $$($nesting, 'DEFAULT').$rand(limit);
    }, $Random_rand$5.$$arity = -1);
    Opal.defs(self, '$srand', $Random_srand$6 = function $$srand(n) {
      var self = this, previous_seed = nil;

      
      
      if (n == null) {
        n = $$($nesting, 'Random').$new_seed();
      };
      n = $$($nesting, 'Opal')['$coerce_to!'](n, $$($nesting, 'Integer'), "to_int");
      previous_seed = $$($nesting, 'DEFAULT').$seed();
      $$($nesting, 'DEFAULT').$reseed(n);
      return previous_seed;
    }, $Random_srand$6.$$arity = -1);
    Opal.defs(self, '$urandom', $Random_urandom$7 = function $$urandom(size) {
      var self = this;

      return $$$('::', 'SecureRandom').$bytes(size)
    }, $Random_urandom$7.$$arity = 1);
    
    Opal.def(self, '$==', $Random_$eq_eq$8 = function(other) {
      var self = this, $ret_or_1 = nil;

      
      if ($truthy($$($nesting, 'Random')['$==='](other))) {
      } else {
        return false
      };
      if ($truthy(($ret_or_1 = self.$seed()['$=='](other.$seed())))) {
        return self.$state()['$=='](other.$state())
      } else {
        return $ret_or_1
      };
    }, $Random_$eq_eq$8.$$arity = 1);
    
    Opal.def(self, '$bytes', $Random_bytes$9 = function $$bytes(length) {
      var $$10, self = this;

      
      length = $$($nesting, 'Random').$_verify_count(length);
      return $send($$($nesting, 'Array'), 'new', [length], ($$10 = function(){var self = $$10.$$s == null ? this : $$10.$$s;

        return self.$rand(255).$chr()}, $$10.$$s = self, $$10.$$arity = 0, $$10)).$join().$encode("ASCII-8BIT");
    }, $Random_bytes$9.$$arity = 1);
    Opal.defs(self, '$bytes', $Random_bytes$11 = function $$bytes(length) {
      var self = this;

      return $$($nesting, 'DEFAULT').$bytes(length)
    }, $Random_bytes$11.$$arity = 1);
    
    Opal.def(self, '$rand', $Random_rand$12 = function $$rand(limit) {
      var self = this;

      
      ;
      return self.$random_number(limit);
    }, $Random_rand$12.$$arity = -1);
    
    Opal.def(self, '$random_float', $Random_random_float$13 = function $$random_float() {
      var self = this;

      
      self.state++;
      return Opal.$$rand.rand(self.$rng);
    
    }, $Random_random_float$13.$$arity = 0);
    Opal.defs(self, '$random_float', $Random_random_float$14 = function $$random_float() {
      var self = this;

      return $$($nesting, 'DEFAULT').$random_float()
    }, $Random_random_float$14.$$arity = 0);
    return (Opal.defs(self, '$generator=', $Random_generator$eq$15 = function(generator) {
      var self = this;

      
      Opal.$$rand = generator;
      if ($truthy(self['$const_defined?']("DEFAULT"))) {
        return $$($nesting, 'DEFAULT').$reseed()
      } else {
        return self.$const_set("DEFAULT", self.$new(self.$new_seed()))
      };
    }, $Random_generator$eq$15.$$arity = 1), nil) && 'generator=';
  })($nesting[0], null, $nesting);
  return self.$require("corelib/random/mersenne_twister");
};

Opal.modules["corelib/unsupported"] = function(Opal) {/* Generated by Opal 1.3.0 */
  var $public$35, $private$36, self = Opal.top, $nesting = [], nil = Opal.nil, $$$ = Opal.$$$, $$ = Opal.$$, $klass = Opal.klass, $module = Opal.module, $alias = Opal.alias;

  Opal.add_stubs(['$raise', '$warn', '$%']);
  
  
  var warnings = {};

  function handle_unsupported_feature(message) {
    switch (Opal.config.unsupported_features_severity) {
    case 'error':
      $$($nesting, 'Kernel').$raise($$($nesting, 'NotImplementedError'), message)
      break;
    case 'warning':
      warn(message)
      break;
    default: // ignore
      // noop
    }
  }

  function warn(string) {
    if (warnings[string]) {
      return;
    }

    warnings[string] = true;
    self.$warn(string);
  }
;
  (function($base, $super, $parent_nesting) {
    var self = $klass($base, $super, 'String');

    var $nesting = [self].concat($parent_nesting), $String_$lt$lt$1, $String_capitalize$excl$2, $String_chomp$excl$3, $String_chop$excl$4, $String_downcase$excl$5, $String_gsub$excl$6, $String_lstrip$excl$7, $String_next$excl$8, $String_reverse$excl$9, $String_slice$excl$10, $String_squeeze$excl$11, $String_strip$excl$12, $String_sub$excl$13, $String_succ$excl$14, $String_swapcase$excl$15, $String_tr$excl$16, $String_tr_s$excl$17, $String_upcase$excl$18, $String_prepend$19, $String_$$$eq$20, $String_clear$21, $String_encode$excl$22, $String_unicode_normalize$excl$23;

    
    var ERROR = "String#%s not supported. Mutable String methods are not supported in Opal.";
    
    Opal.def(self, '$<<', $String_$lt$lt$1 = function($a) {
      var $post_args, $rest_arg, self = this;

      
      
      $post_args = Opal.slice.call(arguments, 0, arguments.length);
      
      $rest_arg = $post_args;;
      return self.$raise($$($nesting, 'NotImplementedError'), (ERROR)['$%']("<<"));
    }, $String_$lt$lt$1.$$arity = -1);
    
    Opal.def(self, '$capitalize!', $String_capitalize$excl$2 = function($a) {
      var $post_args, $rest_arg, self = this;

      
      
      $post_args = Opal.slice.call(arguments, 0, arguments.length);
      
      $rest_arg = $post_args;;
      return self.$raise($$($nesting, 'NotImplementedError'), (ERROR)['$%']("capitalize!"));
    }, $String_capitalize$excl$2.$$arity = -1);
    
    Opal.def(self, '$chomp!', $String_chomp$excl$3 = function($a) {
      var $post_args, $rest_arg, self = this;

      
      
      $post_args = Opal.slice.call(arguments, 0, arguments.length);
      
      $rest_arg = $post_args;;
      return self.$raise($$($nesting, 'NotImplementedError'), (ERROR)['$%']("chomp!"));
    }, $String_chomp$excl$3.$$arity = -1);
    
    Opal.def(self, '$chop!', $String_chop$excl$4 = function($a) {
      var $post_args, $rest_arg, self = this;

      
      
      $post_args = Opal.slice.call(arguments, 0, arguments.length);
      
      $rest_arg = $post_args;;
      return self.$raise($$($nesting, 'NotImplementedError'), (ERROR)['$%']("chop!"));
    }, $String_chop$excl$4.$$arity = -1);
    
    Opal.def(self, '$downcase!', $String_downcase$excl$5 = function($a) {
      var $post_args, $rest_arg, self = this;

      
      
      $post_args = Opal.slice.call(arguments, 0, arguments.length);
      
      $rest_arg = $post_args;;
      return self.$raise($$($nesting, 'NotImplementedError'), (ERROR)['$%']("downcase!"));
    }, $String_downcase$excl$5.$$arity = -1);
    
    Opal.def(self, '$gsub!', $String_gsub$excl$6 = function($a) {
      var $post_args, $rest_arg, self = this;

      
      
      $post_args = Opal.slice.call(arguments, 0, arguments.length);
      
      $rest_arg = $post_args;;
      return self.$raise($$($nesting, 'NotImplementedError'), (ERROR)['$%']("gsub!"));
    }, $String_gsub$excl$6.$$arity = -1);
    
    Opal.def(self, '$lstrip!', $String_lstrip$excl$7 = function($a) {
      var $post_args, $rest_arg, self = this;

      
      
      $post_args = Opal.slice.call(arguments, 0, arguments.length);
      
      $rest_arg = $post_args;;
      return self.$raise($$($nesting, 'NotImplementedError'), (ERROR)['$%']("lstrip!"));
    }, $String_lstrip$excl$7.$$arity = -1);
    
    Opal.def(self, '$next!', $String_next$excl$8 = function($a) {
      var $post_args, $rest_arg, self = this;

      
      
      $post_args = Opal.slice.call(arguments, 0, arguments.length);
      
      $rest_arg = $post_args;;
      return self.$raise($$($nesting, 'NotImplementedError'), (ERROR)['$%']("next!"));
    }, $String_next$excl$8.$$arity = -1);
    
    Opal.def(self, '$reverse!', $String_reverse$excl$9 = function($a) {
      var $post_args, $rest_arg, self = this;

      
      
      $post_args = Opal.slice.call(arguments, 0, arguments.length);
      
      $rest_arg = $post_args;;
      return self.$raise($$($nesting, 'NotImplementedError'), (ERROR)['$%']("reverse!"));
    }, $String_reverse$excl$9.$$arity = -1);
    
    Opal.def(self, '$slice!', $String_slice$excl$10 = function($a) {
      var $post_args, $rest_arg, self = this;

      
      
      $post_args = Opal.slice.call(arguments, 0, arguments.length);
      
      $rest_arg = $post_args;;
      return self.$raise($$($nesting, 'NotImplementedError'), (ERROR)['$%']("slice!"));
    }, $String_slice$excl$10.$$arity = -1);
    
    Opal.def(self, '$squeeze!', $String_squeeze$excl$11 = function($a) {
      var $post_args, $rest_arg, self = this;

      
      
      $post_args = Opal.slice.call(arguments, 0, arguments.length);
      
      $rest_arg = $post_args;;
      return self.$raise($$($nesting, 'NotImplementedError'), (ERROR)['$%']("squeeze!"));
    }, $String_squeeze$excl$11.$$arity = -1);
    
    Opal.def(self, '$strip!', $String_strip$excl$12 = function($a) {
      var $post_args, $rest_arg, self = this;

      
      
      $post_args = Opal.slice.call(arguments, 0, arguments.length);
      
      $rest_arg = $post_args;;
      return self.$raise($$($nesting, 'NotImplementedError'), (ERROR)['$%']("strip!"));
    }, $String_strip$excl$12.$$arity = -1);
    
    Opal.def(self, '$sub!', $String_sub$excl$13 = function($a) {
      var $post_args, $rest_arg, self = this;

      
      
      $post_args = Opal.slice.call(arguments, 0, arguments.length);
      
      $rest_arg = $post_args;;
      return self.$raise($$($nesting, 'NotImplementedError'), (ERROR)['$%']("sub!"));
    }, $String_sub$excl$13.$$arity = -1);
    
    Opal.def(self, '$succ!', $String_succ$excl$14 = function($a) {
      var $post_args, $rest_arg, self = this;

      
      
      $post_args = Opal.slice.call(arguments, 0, arguments.length);
      
      $rest_arg = $post_args;;
      return self.$raise($$($nesting, 'NotImplementedError'), (ERROR)['$%']("succ!"));
    }, $String_succ$excl$14.$$arity = -1);
    
    Opal.def(self, '$swapcase!', $String_swapcase$excl$15 = function($a) {
      var $post_args, $rest_arg, self = this;

      
      
      $post_args = Opal.slice.call(arguments, 0, arguments.length);
      
      $rest_arg = $post_args;;
      return self.$raise($$($nesting, 'NotImplementedError'), (ERROR)['$%']("swapcase!"));
    }, $String_swapcase$excl$15.$$arity = -1);
    
    Opal.def(self, '$tr!', $String_tr$excl$16 = function($a) {
      var $post_args, $rest_arg, self = this;

      
      
      $post_args = Opal.slice.call(arguments, 0, arguments.length);
      
      $rest_arg = $post_args;;
      return self.$raise($$($nesting, 'NotImplementedError'), (ERROR)['$%']("tr!"));
    }, $String_tr$excl$16.$$arity = -1);
    
    Opal.def(self, '$tr_s!', $String_tr_s$excl$17 = function($a) {
      var $post_args, $rest_arg, self = this;

      
      
      $post_args = Opal.slice.call(arguments, 0, arguments.length);
      
      $rest_arg = $post_args;;
      return self.$raise($$($nesting, 'NotImplementedError'), (ERROR)['$%']("tr_s!"));
    }, $String_tr_s$excl$17.$$arity = -1);
    
    Opal.def(self, '$upcase!', $String_upcase$excl$18 = function($a) {
      var $post_args, $rest_arg, self = this;

      
      
      $post_args = Opal.slice.call(arguments, 0, arguments.length);
      
      $rest_arg = $post_args;;
      return self.$raise($$($nesting, 'NotImplementedError'), (ERROR)['$%']("upcase!"));
    }, $String_upcase$excl$18.$$arity = -1);
    
    Opal.def(self, '$prepend', $String_prepend$19 = function $$prepend($a) {
      var $post_args, $rest_arg, self = this;

      
      
      $post_args = Opal.slice.call(arguments, 0, arguments.length);
      
      $rest_arg = $post_args;;
      return self.$raise($$($nesting, 'NotImplementedError'), (ERROR)['$%']("prepend"));
    }, $String_prepend$19.$$arity = -1);
    
    Opal.def(self, '$[]=', $String_$$$eq$20 = function($a) {
      var $post_args, $rest_arg, self = this;

      
      
      $post_args = Opal.slice.call(arguments, 0, arguments.length);
      
      $rest_arg = $post_args;;
      return self.$raise($$($nesting, 'NotImplementedError'), (ERROR)['$%']("[]="));
    }, $String_$$$eq$20.$$arity = -1);
    
    Opal.def(self, '$clear', $String_clear$21 = function $$clear($a) {
      var $post_args, $rest_arg, self = this;

      
      
      $post_args = Opal.slice.call(arguments, 0, arguments.length);
      
      $rest_arg = $post_args;;
      return self.$raise($$($nesting, 'NotImplementedError'), (ERROR)['$%']("clear"));
    }, $String_clear$21.$$arity = -1);
    
    Opal.def(self, '$encode!', $String_encode$excl$22 = function($a) {
      var $post_args, $rest_arg, self = this;

      
      
      $post_args = Opal.slice.call(arguments, 0, arguments.length);
      
      $rest_arg = $post_args;;
      return self.$raise($$($nesting, 'NotImplementedError'), (ERROR)['$%']("encode!"));
    }, $String_encode$excl$22.$$arity = -1);
    return (Opal.def(self, '$unicode_normalize!', $String_unicode_normalize$excl$23 = function($a) {
      var $post_args, $rest_arg, self = this;

      
      
      $post_args = Opal.slice.call(arguments, 0, arguments.length);
      
      $rest_arg = $post_args;;
      return self.$raise($$($nesting, 'NotImplementedError'), (ERROR)['$%']("unicode_normalize!"));
    }, $String_unicode_normalize$excl$23.$$arity = -1), nil) && 'unicode_normalize!';
  })($nesting[0], null, $nesting);
  (function($base, $parent_nesting) {
    var self = $module($base, 'Kernel');

    var $nesting = [self].concat($parent_nesting), $Kernel_freeze$24, $Kernel_frozen$ques$25;

    
    var ERROR = "Object freezing is not supported by Opal";
    
    Opal.def(self, '$freeze', $Kernel_freeze$24 = function $$freeze() {
      var self = this;

      
      handle_unsupported_feature(ERROR);
      return self;
    }, $Kernel_freeze$24.$$arity = 0);
    return (Opal.def(self, '$frozen?', $Kernel_frozen$ques$25 = function() {
      var self = this;

      
      handle_unsupported_feature(ERROR);
      return false;
    }, $Kernel_frozen$ques$25.$$arity = 0), nil) && 'frozen?';
  })($nesting[0], $nesting);
  (function($base, $parent_nesting) {
    var self = $module($base, 'Kernel');

    var $nesting = [self].concat($parent_nesting), $Kernel_taint$26, $Kernel_untaint$27, $Kernel_tainted$ques$28;

    
    var ERROR = "Object tainting is not supported by Opal";
    
    Opal.def(self, '$taint', $Kernel_taint$26 = function $$taint() {
      var self = this;

      
      handle_unsupported_feature(ERROR);
      return self;
    }, $Kernel_taint$26.$$arity = 0);
    
    Opal.def(self, '$untaint', $Kernel_untaint$27 = function $$untaint() {
      var self = this;

      
      handle_unsupported_feature(ERROR);
      return self;
    }, $Kernel_untaint$27.$$arity = 0);
    return (Opal.def(self, '$tainted?', $Kernel_tainted$ques$28 = function() {
      var self = this;

      
      handle_unsupported_feature(ERROR);
      return false;
    }, $Kernel_tainted$ques$28.$$arity = 0), nil) && 'tainted?';
  })($nesting[0], $nesting);
  (function($base, $super, $parent_nesting) {
    var self = $klass($base, $super, 'Module');

    var $nesting = [self].concat($parent_nesting), $Module_public$29, $Module_private_class_method$30, $Module_private_method_defined$ques$31, $Module_private_constant$32;

    
    
    Opal.def(self, '$public', $Module_public$29 = function($a) {
      var $post_args, methods, self = this;

      
      
      $post_args = Opal.slice.call(arguments, 0, arguments.length);
      
      methods = $post_args;;
      
      if (methods.length === 0) {
        self.$$module_function = false;
      }

      return nil;
    ;
    }, $Module_public$29.$$arity = -1);
    $alias(self, "private", "public");
    $alias(self, "protected", "public");
    $alias(self, "nesting", "public");
    
    Opal.def(self, '$private_class_method', $Module_private_class_method$30 = function $$private_class_method($a) {
      var $post_args, $rest_arg, self = this;

      
      
      $post_args = Opal.slice.call(arguments, 0, arguments.length);
      
      $rest_arg = $post_args;;
      return self;
    }, $Module_private_class_method$30.$$arity = -1);
    $alias(self, "public_class_method", "private_class_method");
    
    Opal.def(self, '$private_method_defined?', $Module_private_method_defined$ques$31 = function(obj) {
      var self = this;

      return false
    }, $Module_private_method_defined$ques$31.$$arity = 1);
    
    Opal.def(self, '$private_constant', $Module_private_constant$32 = function $$private_constant($a) {
      var $post_args, $rest_arg, self = this;

      
      
      $post_args = Opal.slice.call(arguments, 0, arguments.length);
      
      $rest_arg = $post_args;;
      return nil;
    }, $Module_private_constant$32.$$arity = -1);
    $alias(self, "protected_method_defined?", "private_method_defined?");
    $alias(self, "public_instance_methods", "instance_methods");
    $alias(self, "public_instance_method", "instance_method");
    return $alias(self, "public_method_defined?", "method_defined?");
  })($nesting[0], null, $nesting);
  (function($base, $parent_nesting) {
    var self = $module($base, 'Kernel');

    var $nesting = [self].concat($parent_nesting), $Kernel_private_methods$33;

    
    
    Opal.def(self, '$private_methods', $Kernel_private_methods$33 = function $$private_methods($a) {
      var $post_args, $rest_arg, self = this;

      
      
      $post_args = Opal.slice.call(arguments, 0, arguments.length);
      
      $rest_arg = $post_args;;
      return [];
    }, $Kernel_private_methods$33.$$arity = -1);
    return $alias(self, "private_instance_methods", "private_methods");
  })($nesting[0], $nesting);
  (function($base, $parent_nesting) {
    var self = $module($base, 'Kernel');

    var $nesting = [self].concat($parent_nesting), $Kernel_eval$34;

    return (Opal.def(self, '$eval', $Kernel_eval$34 = function($a) {
      var $post_args, $rest_arg, self = this;

      
      
      $post_args = Opal.slice.call(arguments, 0, arguments.length);
      
      $rest_arg = $post_args;;
      return self.$raise($$($nesting, 'NotImplementedError'), "" + "To use Kernel#eval, you must first require 'opal-parser'. " + ("" + "See https://github.com/opal/opal/blob/" + ($$($nesting, 'RUBY_ENGINE_VERSION')) + "/docs/opal_parser.md for details."));
    }, $Kernel_eval$34.$$arity = -1), nil) && 'eval'
  })($nesting[0], $nesting);
  Opal.defs(self, '$public', $public$35 = function($a) {
    var $post_args, $rest_arg, self = this;

    
    
    $post_args = Opal.slice.call(arguments, 0, arguments.length);
    
    $rest_arg = $post_args;;
    return nil;
  }, $public$35.$$arity = -1);
  return (Opal.defs(self, '$private', $private$36 = function($a) {
    var $post_args, $rest_arg, self = this;

    
    
    $post_args = Opal.slice.call(arguments, 0, arguments.length);
    
    $rest_arg = $post_args;;
    return nil;
  }, $private$36.$$arity = -1), nil) && 'private';
};

Opal.queue(function(Opal) {/* Generated by Opal 1.3.0 */
  var self = Opal.top, $nesting = [], nil = Opal.nil, $$$ = Opal.$$$, $$ = Opal.$$;

  Opal.add_stubs(['$require', '$autoload']);
  
  self.$require("opal/base");
  self.$require("opal/mini");
  self.$require("corelib/main");
  self.$require("corelib/kernel/format");
  self.$require("corelib/string/encoding");
  self.$autoload("Math", "corelib/math");
  self.$require("corelib/complex/base");
  self.$autoload("Complex", "corelib/complex");
  self.$require("corelib/rational/base");
  self.$autoload("Rational", "corelib/rational");
  self.$require("corelib/time");
  self.$autoload("Struct", "corelib/struct");
  self.$require("corelib/dir");
  self.$autoload("File", "corelib/file");
  self.$require("corelib/process/base");
  self.$autoload("Process", "corelib/process");
  self.$autoload("Random", "corelib/random");
  return self.$require("corelib/unsupported");
});
