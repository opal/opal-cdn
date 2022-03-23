require 'native'

describe "Native.native_writer" do
  it "refers to an attribute on @native" do
    n = Class.new {
      include Native::Wrapper

      native_reader :a
      native_writer :a
    }.new(`{ a: 2 }`)

    n.a = 4
    n.a.should == 4
  end

  it "supports multiple names" do
    n = Class.new {
      include Native::Wrapper

      native_reader :a, :b
      native_writer :a, :b
    }.new(`{ a: 2, b: 3 }`)

    n.a = 4
    n.b = 5

    n.a.should == 4
    n.b.should == 5
  end
end
