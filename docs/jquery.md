# JQuery

`opal-jquery` offers a nicer ruby-like syntax for JQuery. It is useful for projects which cannot use `opal-browser` due to a reliance on jquery for plugins or other libraries.

```ruby
foos = Element.find('.foo')
# => [<div class="foo">, ...]

foos.class
# => JQuery

foos.on(:click) do
  alert "element was clicked"
end
```

### Getting Started

#### Installation

`opal-jquery` is distributed as a gem, and needs to be added to your `Gemfile`:

```ruby
# Gemfile
gem 'opal'
gem 'opal-jquery'
```

#### Usage

`opal-jquery` can now be easily added to your opal application sources:

```ruby
# app/application.rb

# Remember to compile opal-jquery with your javascript application.
# See "Compiling" below for an example on compiling dependencies.
require 'opal/jquery'

alert "Hello from jquery + opal"
```

The `#alert` method is provided by `opal-jquery`. If the message displays, then
`jquery` support should be working.


#### Compiling

When compiling your application to javascript, you must be sure to include both
Opal and Opal-JQuery so they'll be available to your application:

```ruby
require 'opal'
require 'opal-jquery'

builder = Opal::Builder.new
builder.build('opal')
builder.build('opal-jquery')
builder.build('./app/application.rb')

File.write('application.js', builder.to_s)
```

then simply load the compiled file in your html:

```html
<!DOCTYPE html>
<html>
  <head>
    <script src='https://code.jquery.com/jquery-3.3.1.min.js' integrity='sha256-FgpCb/KJQlLNfOu91ta32o/NMZxltwRo8QtmkMRdAu8=' crossorigin='anonymous'></script> 
    <script type='text/javascript' src='./application.js'></script>
  </head>
  <body></body>
</html>
```

NOTE: opal-jquery expects a jquery library to be loaded. This example loads it
remotely from jquery.com, but a locally downloaded copy works just as well, or- 
if you're using rails- jquery may be included automatically.

This example builds opal, opal-jquery and the application into a single `.js` file, 
but you may build them separately, if you so choose. Just remember to include 
each respective script in your html!

### How does opal-jquery work

`opal-jquery` provides an `Element` class, whose instances are toll-free
bridged instances of jquery objects. Just like ruby arrays are just javascript
arrays, `Element` instances are just jquery objects. This makes interaction
with jquery plugins much easier.

### Interacting with the DOM

#### Finding Elements

opal-jquery provides the `Element` class, which can be used to find elements in
the current document:

```ruby
Element.find('#header')
```

`Element.find` is aliased to `Element[]`:

```ruby
Element['.my-class']
```

These methods acts just like `$('selector')`, and can use any jQuery
compatible selector:

```ruby
Element.find('#navigation li:last')
```

The result is just a jQuery instance, which is toll-free bridged to
instances of the `Element` class in ruby:

```ruby
Element.find('.foo').class
# => Element
```

Instances of `Element` also have the `#find` method available for
finding elements within the scope of each DOM node represented by
the instance:

```ruby
el = Element.find('#header')
el.find '.foo'
# => #<Element .... >
```

#### Running code on document ready

Just like jQuery, opal-jquery requires the document to be ready to
be able to fully interact with the page. Any top level access should
use the `ready?` method:

```ruby
Document.ready? do
  alert "document is ready to go!"
end
```

The `Kernel#alert` method is shown above too.

#### Event handling

The `Element#on` method is used to attach event handlers to elements:

```ruby
Element.find('#header').on :click do
  puts "The header was clicked!"
end
```

Selectors can also be passed as a second argument to handle events
on certain children:

```ruby
Element.find('#header').on(:click, '.foo') do
  puts "An element with a 'foo' class was clicked"
end
```

An `Event` instance is optionally passed to block handlers as well,
which is toll-free bridged to jquery events:

```ruby
Element.find('#my_link').on(:click) do |evt|
  evt.stop_propagation
  puts "stopped the event!"
end
```

You can access the element which triggered the event by `#current_target`.

```ruby
Document.on :click do |evt|
  puts "clicked on: #{evt.current_target}"
end
```

#### CSS styles and classnames

The various jQuery methods are available on `Element` instances:

```ruby
foo = Element.find('.foo')

foo.add_class 'blue'
foo.remove_class 'foo'
foo.toggle_class 'selected'
```

There are also added convenience methods for opal-jquery:

```ruby
foo = Element.find('#header')

foo.class_name
# => 'red lorry'

foo.class_name = 'yellow house'

foo.class_name
# => 'yellow house'
```

`Element#css` also exists for getting/setting css styles:

```ruby
el = Element.find('#container')
el.css 'color', 'blue'
el.css 'color'
# => 'blue'
```

### HTTP/AJAX requests

jQuery's Ajax implementation is also wrapped in the top level HTTP
class.

```ruby
HTTP.get("/users/1.json") do |response|
  puts response.body
  # => "{\"name\": \"Adam Beynon\"}"
end
```

The block passed to this method is used as the handler when the request
succeeds, as well as when it fails. To determine whether the request
was successful, use the `ok?` method:

```ruby
HTTP.get("/users/2.json") do |response|
  if response.ok?
    alert "successful!"
  else
    alert "request failed :("
  end
end
```

It is also possible to use a different handler for each case:

```ruby
request = HTTP.get("/users/3.json")

request.callback {
  puts "Request worked!"
}

request.errback {
  puts "Request didn't work :("
}
```

The request is actually triggered inside the `HTTP.get` method, but due
to the async nature of the request, the callback and errback handlers can
be added anytime before the request returns.

#### Handling responses

Web apps deal with JSON responses quite frequently, so there is a useful
`#json` helper method to get the JSON content from a request:

```ruby
HTTP.get("/users.json") do |response|
  puts response.body
  puts response.json
end

# => "[{\"name\": \"Adam\"},{\"name\": \"Ben\"}]"
# => [{"name" => "Adam"}, {"name" => "Ben"}]
```

The `#body` method will always return the raw response string.

If an error is encountered, then the `#status_code` method will hold the
specific error code from the underlying request:

```ruby
request = HTTP.get("/users/3.json")

request.callback { puts "it worked!" }

request.errback { |response|
  puts "failed with status #{response.status_code}"
}
```
