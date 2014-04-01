var htmlparser = require('htmlparser2');
var Transform = require('stream').Transform;
var util = require('util');

util.inherits(Transformer, Transform);

var emptyTags = {
  area: true,
  base: true,
  basefont: true,
  br: true,
  col: true,
  frame: true,
  hr: true,
  img: true,
  input: true,
  isindex: true,
  link: true,
  meta: true,
  param: true,
  embed: true
};

//boolean attributes without a value (taken from MatthewMueller/cheerio)
var booleanAttribs = {
  __proto__: null,
  async: true,
  autofocus: true,
  autoplay: true,
  checked: true,
  controls: true,
  defer: true,
  disabled: true,
  hidden: true,
  loop: true,
  multiple: true,
  open: true,
  readonly: true,
  required: true,
  scoped: true,
  selected: true
};

function Transformer(options) {

  if (!(this instanceof Transformer)) {
    return new Transformer(options);
  }

  Transform.call(this, options);
  this._preSelectors = [];
  this._openSelectors = [];
  this._closeSelectors = [];
  this._postSelectors = [];
  this._skip = 0;

  var match = function(selectors, name, attribs) {
    var self = this;

    selectors.forEach(function(selector) {
      if (!self._skip && selector.cb && selector.match(name, attribs)) {
        selector.cb(self, name, attribs);
      }
    });
  };

  var matchPreSelectors = match.bind(this, this._preSelectors);
  var matchOpenSelectors = match.bind(this, this._openSelectors);
  var matchCloseSelectors = match.bind(this, this._closeSelectors);
  var matchPostSelectors = match.bind(this, this._postSelectors);

  var self = this;
  this._parser = new htmlparser.Parser({
    onopentag: function(name, attribs) {
      if (self._skip > 0) {
        return ++self._skip;
      }

      matchPreSelectors(name, attribs);

      if (self._skip > 0) {
        // one of the pre selectors could have marked this node for removal
        return;
      }

      self.push('<' + name);
      if(attribs) {
        for(var attr in attribs) {
          if(attribs.hasOwnProperty(attr)) {
            self.push(' ' + attr);
            var value = attribs[attr];
            if(value == null){
              if( !(attr in booleanAttribs) ) {
                self.push('=""');
              }
            } 
            else {
              self.push('="' + value + '"');
            }
          }
        }
      }

      if (emptyTags.hasOwnProperty(name)) {
        self.push(' />');
      }
      else {
        self.push('>');
      }

      matchOpenSelectors(name, attribs);
    },
    onclosetag: function(name) {
      if (self._skip > 0) {
        --self._skip;

        if (this._skipContnet && self._skip === 0) {
          delete this._skipContnet;
        }
        else {    
          if (self._skip === 0) matchPostSelectors(name);
          return;
        }
      }

      matchCloseSelectors(name);

      if (!emptyTags.hasOwnProperty(name)) {
        self.push('</' + name + '>');
      }

      matchPostSelectors(name);
    },
    ontext: function(value) {
      if (self._skip > 0) return;

      self.push(value);
    },
    oncomment: function (value) {
      self.push('<!--' + value + '-->');
    }
  }); 

  this.once('end', function() {
    this._parser.end();
  });
};

var removeElement = function(e) {
  var i = this.indexOf(e);
  if (i !== -1) {
    this.splice(i, 1);
  }
};

Transformer.prototype._transform = function(chunk, encoding, cb) {
  this._parser.write(chunk);
  return cb();
};

Transformer.prototype.skipNext = function() {
  this._skip++;
};

Transformer.prototype.skipNextContent = function() {
  this._skip++;
  this._skipContnet = true;
};

Transformer.prototype.remove = function(selector) {
  this._preSelectors.push({match: selector, cb: function() { this.skipNext(); }});
};

Transformer.prototype.replace = function(selector, html) {
  var self = this;

  var preSelector = {
    match: selector, 
    cb: function(stream) { 
      self.skipNext(); 
      self.push(html);
    }
  };
  this._preSelectors.push(preSelector);

  return removeElement.bind(this._preSelectors, preSelector);
};

Transformer.prototype.replaceContent = function(selector, html) {
  var self = this;

  var openSelector = {
    match: selector, 
    cb: function(stream) { 
      self.skipNextContent(); 
      self.push(html);
    }
  };
  this._openSelectors.push(openSelector);

  return removeElement.bind(this._openSelectors, openSelector);
};

Transformer.prototype.prepend = function(selector, cb) {
  var openSelector = {match: selector, cb: cb};
  this._openSelectors.push(openSelector);
  
  return removeElement.bind(this._openSelectors, openSelector);
};

Transformer.prototype.append = function(selector, cb) {
  var closeSelector = {match: selector, cb: cb};
  this._closeSelectors.push(closeSelector);
 
  return removeElement.bind(this._closeSelectors, closeSelector);
};

Transformer.prototype.before = function(selector, cb) {
  var preSelector = {match: selector, cb: cb};
  this._preSelectors.push(preSelector);

  return removeElement.bind(this._preSelectors, preSelector);
};

Transformer.prototype.after = function(selector, cb) {
  var postSelector = {match: selector, cb: cb};
 this._postSelectors.push(postSelector);

  return removeElement.bind(this._postSelectors, postSelector);
};

exports.Transformer = Transformer;
