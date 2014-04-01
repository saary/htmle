var assert = require("assert");
var Transformer = require('../index.js');
var PassThrough = require('stream').PassThrough;

var html = '<html><head><title>Test</title><script>// <![CDATA[\nvar i=1;\n// ]]></script></head><body><link href="a" /><div id="a">Some lines<p>A paragraph</p></div></body></html>';

describe('Transformer', function(){
  describe('#pipe', function(){
    it('should produce the same html string', function(done) {
      var transformer = Transformer();
      pipeTextThrough(html, transformer, function(transformedHtml) {
        assert.equal(transformedHtml, html);
        done();
      });
    });
  })

  describe('#replace', function(){
    it('should replace the title with BOOM!', function(done) {
      var transformer = Transformer();
      transformer.replace(function(name) { return name === 'title'; }, '<title>BOOM!</title>');
      var exptectedHtml = html.replace('<title>Test</title>', '<title>BOOM!</title>');

      pipeTextThrough(html, transformer, function(transformedHtml) {
        assert.equal(transformedHtml, exptectedHtml);
        done();
      });
    });
  })

  describe('#replaceContent', function(){
    it('should replace the div content with BOOM!', function(done) {
      var transformer = Transformer();
      transformer.replaceContent(function(name) { return name === 'div'; }, 'BOOM!');
      var exptectedHtml = html.replace('<div id="a">Some lines<p>A paragraph</p></div>', '<div id="a">BOOM!</div>');

      pipeTextThrough(html, transformer, function(transformedHtml) {
        assert.equal(transformedHtml, exptectedHtml);
        done();
      });
    });
  })

  describe('#prepend', function(){
    it('should prepend a link node to the div', function(done) {
      var transformer = Transformer();

      var linkNode = '<link href="bla" />';
      transformer.prepend(
        function(name, attribs) { 
          return name === 'div' && attribs.id === 'a'; 
        }, 
        function(stream) {
          stream.push(linkNode);
        });


      var exptectedHtml = html.replace('<div id="a">Some lines<p>A paragraph</p></div>', '<div id="a">' + linkNode + 'Some lines<p>A paragraph</p></div>');

      pipeTextThrough(html, transformer, function(transformedHtml) {
        assert.equal(transformedHtml, exptectedHtml);
        done();
      });
    });
  })

  describe('#append', function(){
    it('should append a link node to the div', function(done) {
      var transformer = Transformer();

      var linkNode = '<link href="bla" />';
      transformer.append(
        function(name, attribs) { 
          return name === 'div'; 
        }, 
        function(stream) {
          stream.push(linkNode);
        });

      var exptectedHtml = html.replace('<div id="a">Some lines<p>A paragraph</p></div>', '<div id="a">Some lines<p>A paragraph</p>' + linkNode + '</div>');

      pipeTextThrough(html, transformer, function(transformedHtml) {
        assert.equal(transformedHtml, exptectedHtml);
        done();
      });
    });
  })

  describe('#before', function(){
    it('should insert a link node before the div', function(done) {
      var transformer = Transformer();

      var linkNode = '<link href="bla" />';
      transformer.before(
        function(name, attribs) { 
          return name === 'div'; 
        }, 
        function(stream) {
          stream.push(linkNode);
        });

      var exptectedHtml = html.replace('<div id="a">Some lines<p>A paragraph</p></div>', linkNode + '<div id="a">Some lines<p>A paragraph</p></div>');

      pipeTextThrough(html, transformer, function(transformedHtml) {
        assert.equal(transformedHtml, exptectedHtml);
        done();
      });
    });
  })

  describe('#after', function(){
    it('should insert a link node after the div', function(done) {
      var transformer = Transformer();

      var linkNode = '<link href="bla" />';
      transformer.after(
        function(name, attribs) { 
          return name === 'div'; 
        }, 
        function(stream) {
          stream.push(linkNode);
        });

      var exptectedHtml = html.replace('<div id="a">Some lines<p>A paragraph</p></div>', '<div id="a">Some lines<p>A paragraph</p></div>' + linkNode);

      pipeTextThrough(html, transformer, function(transformedHtml) {
        assert.equal(transformedHtml, exptectedHtml);
        done();
      });
    });
  })
});

function pipeTextThrough(text, transformer, cb) {
  var stream = PassThrough();
  stream.pipe(transformer);
  
  var buffers = [];
  transformer.on('data', function(data) {
    buffers.push(data);
  });

  transformer.on('end', function(data) {
    var data = Buffer.concat(buffers);
    var transformedHtml = data.toString();

    cb(transformedHtml);
  });

  stream.end(html);
}