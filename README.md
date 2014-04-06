htmle
=====

Streaming html transformer.

##Example

```javascript
$ = require('selazy').createCSSSelector;
Transformer = require('htmle').Transformer;

var transformer = new Transformer();

transformer.before($('html'),  function (stream) {
  stream.push('<!DOCTYPE html>');
});

var items = [ 'Bob', 'Joe', 'Rob', 'William']
transformer.prepend($('#names'), function (stream) {
  items.each(function(item) {
    stream.push('<li>' + item + '</li>');
  });
});
```
