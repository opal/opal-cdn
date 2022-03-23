require 'promise'

describe 'Promise#rescue' do
  it 'calls the block when the promise has already been rejected' do
    x = 42
    Promise.error(23).rescue { |v| x = v }
    x.should == 23
  end

  it 'calls the block when the promise is rejected' do
    a = Promise.new
    x = 42

    a.rescue { |v| x = v }
    a.reject(23)

    x.should == 23
  end

  it 'does not call then blocks when the promise is rejected' do
    x = 42
    y = 23

    Promise.error(23).then { y = 42 }.rescue { |v| x = v }

    x.should == 23
    y.should == 23
  end

  it 'does not call subsequent rescue blocks' do
    x = 42
    Promise.error(23).rescue { |v| x = v }.rescue { x = 42 }
    x.should == 23
  end

  it 'can be called multiple times on the same promise' do
    p = Promise.error(2)
    x = 1
    p.then { x += 1 }
    p.rescue { x += 3 }
    p.rescue { x += 3 }

    x.should == 7
  end

  it 'raises with rescue! if a promise has already been chained' do
    p = Promise.new

    p.then! {}

    proc { p.rescue! {} }.should raise_error(ArgumentError)
  end
end
