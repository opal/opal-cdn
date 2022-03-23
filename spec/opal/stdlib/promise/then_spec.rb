require 'promise'

describe 'Promise#then' do
  it 'calls the block when the promise has already been resolved' do
    x = 42
    Promise.value(23).then { |v| x = v }
    x.should == 23
  end

  it 'calls the block when the promise is resolved' do
    a = Promise.new
    x = 42

    a.then { |v| x = v }
    a.resolve(23)

    x.should == 23
  end

  it 'works with multiple chains' do
    x = 42
    Promise.value(2).then { |v| v * 2 }.then { |v| v * 4 }.then { |v| x = v }
    x.should == 16
  end

  it 'works when a block returns a promise' do
    a = Promise.new
    b = Promise.new

    x = 42
    a.then { b }.then { |v| x = v }

    a.resolve(42)
    b.resolve(23)

    x.should == 23
  end

  it 'sends raised exceptions as rejections' do
    x = nil

    Promise.value(2).then { raise "hue" }.rescue { |v| x = v }

    x.should be_kind_of(RuntimeError)
  end

  it 'sends raised exceptions inside rescue blocks as next errors' do
    x = nil

    Promise.value(2).then { raise "hue" }.rescue { raise "omg" }.rescue { |v| x = v }

    x.should be_kind_of(RuntimeError)
  end

  it 'allows then to be called multiple times' do
    p = Promise.value(2)
    x = 1
    p.then { x += 1 }
    p.then { x += 1 }

    x.should == 3
  end

  it 'raises with then! if a promise has already been chained' do
    p = Promise.new

    p.then! {}

    proc { p.then! {} }.should raise_error(ArgumentError)
  end

  it 'should pass a delayed falsy value' do
    p = Promise.new.resolve(5).then { nil }

    p.then do |value|
      expect(value).to eq(nil)
    end
  end
end
