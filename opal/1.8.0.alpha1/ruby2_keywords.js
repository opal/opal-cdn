Opal.modules["ruby2_keywords"] = function(Opal) {/* Generated by Opal 1.8.0.alpha1 */
  var $klass = Opal.klass, $truthy = Opal.truthy, $slice = Opal.slice, $def = Opal.def, $defs = Opal.defs, $return_self = Opal.return_self, $return_val = Opal.return_val, $nesting = [], $$ = Opal.$r($nesting), nil = Opal.nil, main = nil;

  Opal.add_stubs('private_method_defined?,private,eval,respond_to?,method_defined?,dup');
  
  (function($base, $super) {
    var self = $klass($base, $super, 'Module');

    
    if ($truthy(self['$private_method_defined?']("ruby2_keywords"))) {
      return nil
    } else {
      
      self.$private();
      return $def(self, '$ruby2_keywords', function $$ruby2_keywords(name, $a) {
        var $post_args, $fwd_rest;

        
        $post_args = $slice(arguments, 1);
        $fwd_rest = $post_args;
        return nil;
      }, -2);
    }
  })($nesting[0], null);
  main = $$('TOPLEVEL_BINDING').$eval("self");
  if (!$truthy(main['$respond_to?']("ruby2_keywords", true))) {
    $defs(main, '$ruby2_keywords', function $$ruby2_keywords(name, $a) {
      var $post_args, $fwd_rest;

      
      $post_args = $slice(arguments, 1);
      $fwd_rest = $post_args;
      return nil;
    }, -2)
  };
  (function($base, $super) {
    var self = $klass($base, $super, 'Proc');

    
    if ($truthy(self['$method_defined?']("ruby2_keywords"))) {
      return nil
    } else {
      return $def(self, '$ruby2_keywords', $return_self)
    }
  })($nesting[0], null);
  return (function(self, $parent_nesting) {
    
    
    if (!$truthy(self['$method_defined?']("ruby2_keywords_hash?"))) {
      
      $def(self, '$ruby2_keywords_hash?', $return_val(false))
    };
    if ($truthy(self['$method_defined?']("ruby2_keywords_hash"))) {
      return nil
    } else {
      return $def(self, '$ruby2_keywords_hash', function $$ruby2_keywords_hash(hash) {
        
        return hash.$dup()
      })
    };
  })(Opal.get_singleton_class($$('Hash')), $nesting);
};
