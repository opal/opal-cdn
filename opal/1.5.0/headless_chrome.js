Opal.modules["headless_chrome"] = function(Opal) {/* Generated by Opal 1.5.0 */
  var nil = Opal.nil;

  
  Opal.exit = function(code) {
    // You can't exit from the browser.
    // The first call to Opal.exit should save an exit code.
    // All next invocations must be ignored.

    if (typeof(window.OPAL_EXIT_CODE) === "undefined") {
      window.OPAL_EXIT_CODE = code;
    }
  }

};