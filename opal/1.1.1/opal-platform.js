/* Generated by Opal 1.1.1 */
Opal.modules["opal-platform"] = function(Opal) {
  var self = Opal.top, $nesting = [], nil = Opal.nil, $$$ = Opal.$$$, $$ = Opal.$$, $truthy = Opal.truthy, browser = nil, node = nil, nashorn = nil, headless_chrome = nil;

  
  browser = typeof(document) !== "undefined";
  node = typeof(process) !== "undefined" && process.versions && process.versions.node;
  nashorn = typeof(Java) !== "undefined" && Java.type;
  headless_chrome = typeof(navigator) !== "undefined" && /\bHeadlessChrome\//.test(navigator.userAgent);
  return Opal.const_set($nesting[0], 'OPAL_PLATFORM', (function() {if ($truthy(nashorn)) {
    return "nashorn"
  } else if ($truthy(node)) {
    return "nodejs"
  } else if ($truthy(headless_chrome)) {
    return "headless-chrome"
  } else {
    return nil
  }; return nil; })());
};
