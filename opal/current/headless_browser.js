Opal.modules["headless_browser/base"] = function(Opal) {/* Generated by Opal 1.8.0 */
  var nil = Opal.nil;

  
  // Inhibit the default exit behavior
  window.OPAL_EXIT_CODE = "noexit";

  Opal.exit = function(code) {
    // The first call to Opal.exit should save an exit code.
    // All next invocations must be ignored.
    // Then we send an event to Chrome CDP Interface that we are finished

    if (window.OPAL_EXIT_CODE === "noexit") {
      window.OPAL_EXIT_CODE = code;
      window.alert("opalheadlessbrowserexit");
    }
  }

};

Opal.modules["headless_browser/file"] = function(Opal) {/* Generated by Opal 1.8.0 */
  var $klass = Opal.klass, $defs = Opal.defs, $nesting = [], nil = Opal.nil;

  Opal.add_stubs('length');
  return (function($base, $super) {
    var self = $klass($base, $super, 'File');

    
    return $defs(self, '$write', function $$write(path, data) {
      
      
      
      var http = new XMLHttpRequest();
      http.open("POST", "/File.write");
      http.setRequestHeader("Content-Type", "application/json");
      // Failure is not an option
      http.send(JSON.stringify({filename: path, data: data, secret: window.OPAL_CDP_SHARED_SECRET}));
    ;
      return data.$length();
    })
  })($nesting[0], null)
};

Opal.modules["headless_browser"] = function(Opal) {/* Generated by Opal 1.8.0 */
  var self = Opal.top, nil = Opal.nil;

  Opal.add_stubs('require');
  
  self.$require("headless_browser/base");
  return self.$require("headless_browser/file");
};
