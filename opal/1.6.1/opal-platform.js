Opal.queue(function(Opal) {/* Generated by Opal 1.6.1 */
  var $const_set = Opal.const_set, $truthy = Opal.truthy, $nesting = [], nil = Opal.nil, browser = nil, node = nil, nashorn = nil, headless_chrome = nil, gjs = nil, quickjs = nil, opal_miniracer = nil;

  
  /* global Java, GjsFileImporter */;
  browser = typeof(document) !== "undefined";
  node = typeof(process) !== "undefined" && process.versions && process.versions.node;
  nashorn = typeof(Java) !== "undefined" && Java.type;
  headless_chrome = typeof(opalheadlesschrome) !== 'undefined';
  gjs = typeof(window) !== "undefined" && typeof(GjsFileImporter) !== 'undefined';
  quickjs = typeof(window) === "undefined" && typeof(__loadScript) !== 'undefined';
  opal_miniracer = typeof(opalminiracer) !== 'undefined';
  return $const_set($nesting[0], 'OPAL_PLATFORM', ($truthy(nashorn) ? ("nashorn") : ($truthy(node) ? ("nodejs") : ($truthy(headless_chrome) ? ("headless-chrome") : ($truthy(gjs) ? ("gjs") : ($truthy(quickjs) ? ("quickjs") : ($truthy(opal_miniracer) ? ("opal-miniracer") : nil)))))));
});
