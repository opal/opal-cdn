# NOTE: run bin/format-filters after changing this file
opal_unsupported_filter "Hash" do
  fails "Hash#[]= duplicates and freezes string keys"
  fails "Hash#[]= duplicates string keys using dup semantics" # TypeError: can't define singleton
  fails "Hash#[]= raises a RuntimeError if called on a frozen instance"
  fails "Hash#assoc only returns the first matching key-value pair for identity hashes"
  fails "Hash#clear raises a RuntimeError if called on a frozen instance"
  fails "Hash#compare_by_identity raises a RuntimeError on frozen hashes"
  fails "Hash#default= raises a RuntimeError if called on a frozen instance"
  fails "Hash#default_proc= raises a RuntimeError if self is frozen"
  fails "Hash#delete raises a RuntimeError if called on a frozen instance"
  fails "Hash#delete_if raises a RuntimeError if called on a frozen instance"
  fails "Hash#initialize is private"
  fails "Hash#initialize raises a RuntimeError if called on a frozen instance"
  fails "Hash#inspect does not raise if inspected result is not default external encoding" # Mock 'utf_16be' expected to receive 'inspect' exactly 1 times but received it 0 times
  fails "Hash#inspect returns a tainted string if self is tainted and not empty"
  fails "Hash#inspect returns an untrusted string if self is untrusted and not empty"
  fails "Hash#keep_if raises a RuntimeError if called on a frozen instance"
  fails "Hash#merge! checks frozen status before coercing an object with #to_hash"
  fails "Hash#merge! raises a RuntimeError on a frozen instance that is modified"
  fails "Hash#merge! raises a RuntimeError on a frozen instance that would not be modified"
  fails "Hash#rehash raises a RuntimeError if called on a frozen instance"
  fails "Hash#reject! raises a RuntimeError if called on a frozen instance that is modified"
  fails "Hash#reject! raises a RuntimeError if called on a frozen instance that would not be modified"
  fails "Hash#reject! returns an Enumerator if called on a frozen instance"
  fails "Hash#replace raises a RuntimeError if called on a frozen instance that is modified"
  fails "Hash#replace raises a RuntimeError if called on a frozen instance that would not be modified"
  fails "Hash#select! raises a RuntimeError if called on a frozen instance that would not be modified"
  fails "Hash#select! raises a RuntimeError if called on an empty frozen instance"
  fails "Hash#shift raises a RuntimeError if called on a frozen instance"
  fails "Hash#store duplicates and freezes string keys"
  fails "Hash#store duplicates string keys using dup semantics" # TypeError: can't define singleton
  fails "Hash#store raises a RuntimeError if called on a frozen instance"
  fails "Hash#to_a returns a tainted array if self is tainted"
  fails "Hash#to_a returns an untrusted array if self is untrusted"
  fails "Hash#to_proc the returned proc passed as a block to instance_exec always retrieves the original hash's values"
  fails "Hash#to_proc the returned proc raises ArgumentError if not passed exactly one argument"
  fails "Hash#to_s does not raise if inspected result is not default external encoding" # Mock 'utf_16be' expected to receive 'inspect' exactly 1 times but received it 0 times
  fails "Hash#to_s returns a tainted string if self is tainted and not empty"
  fails "Hash#to_s returns an untrusted string if self is untrusted and not empty"
  fails "Hash#update checks frozen status before coercing an object with #to_hash"
  fails "Hash#update raises a RuntimeError on a frozen instance that is modified"
  fails "Hash#update raises a RuntimeError on a frozen instance that would not be modified"
end