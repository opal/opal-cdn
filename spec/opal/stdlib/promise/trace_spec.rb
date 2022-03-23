require 'promise'

describe 'Promise#trace' do
  it 'calls the block with all the previous results' do
    x = 42

    Promise.value(1).then { 2 }.then { 3 }.trace {|a, b, c|
      x = a + b + c
    }

    x.should == 6
  end

  it 'calls the then after the trace' do
    x = 42

    Promise.value(1).then { 2 }.then { 3 }.trace {|a, b, c|
      a + b + c
    }.then { |v| x = v }

    x.should == 6
  end

  it 'includes the first value' do
    x = 42

    Promise.value(1).trace { |a| x = a }

    x.should == 1
  end

  it 'works after a when' do
    x = 42

    Promise.value(1).then {
      Promise.when Promise.value(2), Promise.value(3)
    }.trace {|a, b|
      x = a + b[0] + b[1]
    }

    x.should == 6
  end

  it 'raises with trace! if a promise has already been chained' do
    p = Promise.new

    p.then! {}

    proc { p.trace! {} }.should raise_error(ArgumentError)
  end
end
