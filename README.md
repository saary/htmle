htmle
=====

Streaming html transformer. Just the pipe the html through a `Transformer`, register transformations with selectors for manipulating the html content and out goes the new transformed html.

##Supported tranformations

 * `before` - Add html text before nodes that match the selector criteria.
 * `after` - Add html text after nodes that match the selector criteria.
 * `prepend` - Add html text after the open tag of nodes that match the selector criteria.
 * `append` - Add html text before the close tag of nodes that match the selector criteria.
 * `replace` - Replace nodes that match the selector criteria with the given html text.
 * `replaceContent` - Replace the content of nodes that match the selector criteria with the given html text.
 * `remove` - Remove nodes that match the selector criteria. 
 
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
