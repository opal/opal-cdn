require 'test/unit'
require 'promise/v2'

class TestPromiseThen < Test::Unit::TestCase
  def test_calls_the_block_when_the_promise_has_already_been_resolved
    x = 42
    PromiseV2.value(23)
      .then { |v| x = v }
      .always { assert_equal(x, 23) }
  end

  def test_calls_the_block_when_the_promise_is_resolved
    a = PromiseV2.new
    x = 42

    p = a.then { |v| x = v }
    a.resolve(23)

    p.always { assert_equal(x, 23) }
  end

  def test_works_with_multiple_chains
    x = 42
    PromiseV2.value(2)
      .then { |v| v * 2 }
      .then { |v| v * 4 }
      .then { |v| x = v }
      .always { assert_equal(x, 16) }
  end

  def test_works_when_a_block_returns_a_promise
    a = PromiseV2.new
    b = PromiseV2.new

    x = 42
    p = a.then { b }.then { |v| x = v }

    a.resolve(42)
    b.resolve(23)

    p.always { assert_equal(x, 23) }
  end

  def test_sends_raised_exceptions_as_rejections
    x = nil

    PromiseV2.value(2)
      .then { raise "hue" }
      .rescue { |v| x = v }
      .always { assert_equal(x.class, RuntimeError) }
  end

  def test_sends_raised_exceptions_inside_rescue_blocks_as_next_errors
    x = nil

    PromiseV2.value(2)
      .then { raise "hue" }
      .rescue { raise "omg" }
      .rescue { |v| x = v }
      .always { assert_equal(x.class, RuntimeError) }
  end

  def test_allows_then_to_be_called_multiple_times
    pr = PromiseV2.value(2)
    x = 1

    ps = []

    ps << pr.then { x += 1 }
    ps << pr.then { x += 1 }

    PromiseV2.when(ps).always { assert_equal(x, 3) }
  end

  def test_raises_with_thenB_if_a_promise_has_already_been_chained
    pr = PromiseV2.new

    pr.then! {}

    assert_raise(ArgumentError) { pr.then! {} }
  end

  def test_should_pass_a_delayed_falsy_value
    pr = PromiseV2.new.resolve(5).then { nil }

    pr.always do |value|
      assert_equal(value, nil)
    end
  end
end
