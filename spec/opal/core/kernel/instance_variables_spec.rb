describe "Kernel#instance_variables" do
  context 'for nil' do
    it 'returns blank array' do
      expect(nil.instance_variables).to eq([])
    end
  end

  context 'for string' do
    it 'returns blank array' do
      expect(''.instance_variables).to eq([])
    end
  end

  context 'for non-empty string' do
    it 'returns blank array' do
      expect('test'.instance_variables).to eq([])
    end
  end

  context 'for hash' do
    it 'returns blank array' do
      expect({}.instance_variables).to eq([])
    end

    context 'for a hash with a default value' do
      it 'returns a blank array' do
        hash = Hash.new(0)
        expect(hash.instance_variables).to eq([])
      end
    end

    context 'for a hash with a default proc' do
      it 'returns a blank array' do
        hash = Hash.new { 0 }
        expect(hash.instance_variables).to eq([])
      end
    end
  end

  context 'for non-empty hash' do
    it 'returns blank array' do
      expect({ 1 => 2 }.instance_variables).to eq([])
    end
  end

  context 'for array' do
    it 'returns blank array' do
      expect([].instance_variables).to eq([])
    end
  end

  context 'for non-empty array' do
    it 'returns blank array' do
      expect((1..20).to_a.instance_variables).to eq([])
    end
  end

  context 'for object' do
    it 'returns blank array' do
      expect(Object.new.instance_variables).to eq([])
    end
  end

  context 'cloned object' do
    it 'returns same vars as source object' do
      object = Object.new
      expect(object.clone.instance_variables).to eq(object.instance_variables)
    end
  end

  context 'for object with js keyword as instance variables' do
    reserved_keywords = %w(
      @constructor
      @displayName
      @__proto__
      @__parent__
      @__noSuchMethod__
      @__count__
      @hasOwnProperty
      @valueOf
    )

    reserved_keywords.each do |ivar|
      context "#{ivar} as instance variable name" do
        it "returns non-escaped #{ivar} in instance_variables list" do
          obj = Object.new
          obj.instance_variable_set(ivar, 'value')

          expect(obj.instance_variables).to eq([ivar])
        end
      end
    end
  end

  context 'for a class' do
    it 'returns blank array' do
      expect(Class.new.instance_variables).to eq([])
    end
  end

  context 'for a class with nested constant' do
    class ClassWithConstantWithoutIvar
      A = 1
    end

    it 'returns blank array' do
      expect(ClassWithConstantWithoutIvar.instance_variables).to eq([])
    end
  end
end
