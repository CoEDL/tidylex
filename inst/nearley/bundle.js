(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
(function (global){
// Node.js code taken from https://nearley.js.org/docs/using-in-frontend
// This file is used to generate bundle.js via Browserify
// which is then sourced into R using the R V8 package

global.nearley        = require('nearley');
global.compile        = require("nearley/lib/compile");
global.generate       = require("nearley/lib/generate");
global.nearleyGrammar = require("nearley/lib/nearley-language-bootstrapped");
global.rr             = require("railroad-diagrams")

global.compileGrammar = function (sourceCode) {
    // Parse the grammar source into an AST
    const grammarParser = new nearley.Parser(nearleyGrammar, { "keepHistory" : true });

    // if parse failed
    try {
        
        grammarParser.feed(sourceCode);

    } catch(parse_error) {
        // slice(0, 6) omits source code location, e.g. "at nearley.js on line 1234"
        error_msg = parse_error.stack.split(/\n/).slice(0, 6).join("\\n")

        return { error: error_msg }
    }

    // if parse incomplete
    if (grammarParser.results.length == 0) {

        return { error: "Parse incomplete, expecting more at end of grammar input" }

    }

    const grammarAst = grammarParser.results[0];

    // Compile the AST into a set of rules
    const grammarInfoObject = compile(grammarAst, {});
    // Generate JavaScript code from the rules
    const grammarJs = generate(grammarInfoObject, "grammar");

    // Pretend this is a CommonJS environment to catch exports from the grammar.
    const module = { exports: {} };
    eval(grammarJs);

    module.exports.railroad = railroad(grammarAst);

    return module.exports;
}

global.railroad = function(grm) {

    var rules = {};
    grm.forEach(function(instr) {
        if (instr.rules) {
            if (!rules[instr.name]) {
                rules[instr.name] = [];
            }
            rules[instr.name] = rules[instr.name].concat(instr.rules);
        }
    });

    var diagrams = Object.keys(rules).map(function(r) {
        return [
          '<h1><code>' + r + '</code></h1>',
          '<div>',
            diagram(r).toString(),
          '</div>'
        ].join('\n');
    });

    function diagram(name) {
        var selectedrules = rules[name];
        var outer = {subexpression: selectedrules};

        function renderTok(tok) {
            // ctx translated to correct position already
            if (tok.subexpression) {
                return new rr.Choice(0, tok.subexpression.map(renderTok));
            } else if (tok.ebnf) {
                switch (tok.modifier) {
                case ":+":
                    return new rr.OneOrMore(renderTok(tok.ebnf));
                    break;
                case ":*":
                    return new rr.ZeroOrMore(renderTok(tok.ebnf));
                    break;
                case ":?":
                    return new rr.Optional(renderTok(tok.ebnf));
                    break;
                }
            } else if (tok.literal) {
                return new rr.Terminal(JSON.stringify(tok.literal));
            } else if (tok.mixin) {
                return new rr.Comment("Not implemented.");
            } else if (tok.macrocall) {
                return new rr.Comment("Not implemented.");
            } else if (tok.tokens) {
                return new rr.Sequence(tok.tokens.map(renderTok));
            } else if (typeof(tok) === 'string') {
                return new rr.NonTerminal(tok);
            } else if (tok.constructor === RegExp) {
                return new rr.Terminal(tok.toString());
            } else if (tok.token) {
                return new rr.Terminal(tok.token);
            } else {
                return new rr.Comment("[Unimplemented]");
            }
        }

        return new rr.Diagram([renderTok(outer)]);
    }

    return [
      '<!DOCTYPE html>',
      '<html>',
        '<head>',
          '<meta charset="UTF-8">',
          '<style type="text/css">',
            'svg.railroad-diagram { background-color: hsl(30,20%,95%); }',
            'svg.railroad-diagram path {',
                'stroke-width: 3;',
                'stroke: black;',
                'fill: rgba(0,0,0,0);',
            '}',
                'svg.railroad-diagram text {',
                'font: bold 14px monospace;',
                'text-anchor: middle;',
            '}',
                'svg.railroad-diagram text.label {',
                'text-anchor: start;',
            '}',
                'svg.railroad-diagram text.comment {',
                'font: italic 12px monospace;',
            '}',
                'svg.railroad-diagram rect {',
                'stroke-width: 3;',
                'stroke: black;',
                'fill: hsl(120,100%,90%);',
            '}',
          '</style>',
        '</head>',
        '<body>',
          diagrams.join('\n'),
        '</body>',
      '</html>'
    ].join('\n');

}

global.parseArray = function(string_array, compiled_grammar) {

    const parser = new nearley.Parser(compiled_grammar, { "keepHistory" : true });

    for(i = 0; i < string_array.length; i++) {

        try {           
            
            parser.feed(string_array[i]);

        } catch(parse_error) {

            error_msg = parse_error.stack.split(/\n/).slice(0, 6).join("\n")

            // early return of parseArray function if parse fails
            // also i + 1 since R indexes from 1, not 0
            return JSON.stringify({ "index": i + 1, "error": error_msg })

        }
    }

    // assume early return didn't occur if you got to here
    if(parser.results.length == 0) {

        return JSON.stringify({ "index": i, "error": "Incomplete parse, expecting more data at end of input." })

    } else {

        return JSON.stringify({ "parse_trees": parser.results })

    }

}

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"nearley":9,"nearley/lib/compile":5,"nearley/lib/generate":6,"nearley/lib/nearley-language-bootstrapped":8,"railroad-diagrams":10}],2:[function(require,module,exports){

},{}],3:[function(require,module,exports){
(function (process){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

// resolves . and .. elements in a path array with directory names there
// must be no slashes, empty elements, or device names (c:\) in the array
// (so also no leading and trailing slashes - it does not distinguish
// relative and absolute paths)
function normalizeArray(parts, allowAboveRoot) {
  // if the path tries to go above the root, `up` ends up > 0
  var up = 0;
  for (var i = parts.length - 1; i >= 0; i--) {
    var last = parts[i];
    if (last === '.') {
      parts.splice(i, 1);
    } else if (last === '..') {
      parts.splice(i, 1);
      up++;
    } else if (up) {
      parts.splice(i, 1);
      up--;
    }
  }

  // if the path is allowed to go above the root, restore leading ..s
  if (allowAboveRoot) {
    for (; up--; up) {
      parts.unshift('..');
    }
  }

  return parts;
}

// Split a filename into [root, dir, basename, ext], unix version
// 'root' is just a slash, or nothing.
var splitPathRe =
    /^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/;
var splitPath = function(filename) {
  return splitPathRe.exec(filename).slice(1);
};

// path.resolve([from ...], to)
// posix version
exports.resolve = function() {
  var resolvedPath = '',
      resolvedAbsolute = false;

  for (var i = arguments.length - 1; i >= -1 && !resolvedAbsolute; i--) {
    var path = (i >= 0) ? arguments[i] : process.cwd();

    // Skip empty and invalid entries
    if (typeof path !== 'string') {
      throw new TypeError('Arguments to path.resolve must be strings');
    } else if (!path) {
      continue;
    }

    resolvedPath = path + '/' + resolvedPath;
    resolvedAbsolute = path.charAt(0) === '/';
  }

  // At this point the path should be resolved to a full absolute path, but
  // handle relative paths to be safe (might happen when process.cwd() fails)

  // Normalize the path
  resolvedPath = normalizeArray(filter(resolvedPath.split('/'), function(p) {
    return !!p;
  }), !resolvedAbsolute).join('/');

  return ((resolvedAbsolute ? '/' : '') + resolvedPath) || '.';
};

// path.normalize(path)
// posix version
exports.normalize = function(path) {
  var isAbsolute = exports.isAbsolute(path),
      trailingSlash = substr(path, -1) === '/';

  // Normalize the path
  path = normalizeArray(filter(path.split('/'), function(p) {
    return !!p;
  }), !isAbsolute).join('/');

  if (!path && !isAbsolute) {
    path = '.';
  }
  if (path && trailingSlash) {
    path += '/';
  }

  return (isAbsolute ? '/' : '') + path;
};

// posix version
exports.isAbsolute = function(path) {
  return path.charAt(0) === '/';
};

// posix version
exports.join = function() {
  var paths = Array.prototype.slice.call(arguments, 0);
  return exports.normalize(filter(paths, function(p, index) {
    if (typeof p !== 'string') {
      throw new TypeError('Arguments to path.join must be strings');
    }
    return p;
  }).join('/'));
};


// path.relative(from, to)
// posix version
exports.relative = function(from, to) {
  from = exports.resolve(from).substr(1);
  to = exports.resolve(to).substr(1);

  function trim(arr) {
    var start = 0;
    for (; start < arr.length; start++) {
      if (arr[start] !== '') break;
    }

    var end = arr.length - 1;
    for (; end >= 0; end--) {
      if (arr[end] !== '') break;
    }

    if (start > end) return [];
    return arr.slice(start, end - start + 1);
  }

  var fromParts = trim(from.split('/'));
  var toParts = trim(to.split('/'));

  var length = Math.min(fromParts.length, toParts.length);
  var samePartsLength = length;
  for (var i = 0; i < length; i++) {
    if (fromParts[i] !== toParts[i]) {
      samePartsLength = i;
      break;
    }
  }

  var outputParts = [];
  for (var i = samePartsLength; i < fromParts.length; i++) {
    outputParts.push('..');
  }

  outputParts = outputParts.concat(toParts.slice(samePartsLength));

  return outputParts.join('/');
};

exports.sep = '/';
exports.delimiter = ':';

exports.dirname = function(path) {
  var result = splitPath(path),
      root = result[0],
      dir = result[1];

  if (!root && !dir) {
    // No dirname whatsoever
    return '.';
  }

  if (dir) {
    // It has a dirname, strip trailing slash
    dir = dir.substr(0, dir.length - 1);
  }

  return root + dir;
};


exports.basename = function(path, ext) {
  var f = splitPath(path)[2];
  // TODO: make this comparison case-insensitive on windows?
  if (ext && f.substr(-1 * ext.length) === ext) {
    f = f.substr(0, f.length - ext.length);
  }
  return f;
};


exports.extname = function(path) {
  return splitPath(path)[3];
};

function filter (xs, f) {
    if (xs.filter) return xs.filter(f);
    var res = [];
    for (var i = 0; i < xs.length; i++) {
        if (f(xs[i], i, xs)) res.push(xs[i]);
    }
    return res;
}

// String.prototype.substr - negative index don't work in IE8
var substr = 'ab'.substr(-1) === 'b'
    ? function (str, start, len) { return str.substr(start, len) }
    : function (str, start, len) {
        if (start < 0) start = str.length + start;
        return str.substr(start, len);
    }
;

}).call(this,require('_process'))
},{"_process":4}],4:[function(require,module,exports){
// shim for using process in browser
var process = module.exports = {};

// cached from whatever global is present so that test runners that stub it
// don't break things.  But we need to wrap it in a try catch in case it is
// wrapped in strict mode code which doesn't define any globals.  It's inside a
// function because try/catches deoptimize in certain engines.

var cachedSetTimeout;
var cachedClearTimeout;

function defaultSetTimout() {
    throw new Error('setTimeout has not been defined');
}
function defaultClearTimeout () {
    throw new Error('clearTimeout has not been defined');
}
(function () {
    try {
        if (typeof setTimeout === 'function') {
            cachedSetTimeout = setTimeout;
        } else {
            cachedSetTimeout = defaultSetTimout;
        }
    } catch (e) {
        cachedSetTimeout = defaultSetTimout;
    }
    try {
        if (typeof clearTimeout === 'function') {
            cachedClearTimeout = clearTimeout;
        } else {
            cachedClearTimeout = defaultClearTimeout;
        }
    } catch (e) {
        cachedClearTimeout = defaultClearTimeout;
    }
} ())
function runTimeout(fun) {
    if (cachedSetTimeout === setTimeout) {
        //normal enviroments in sane situations
        return setTimeout(fun, 0);
    }
    // if setTimeout wasn't available but was latter defined
    if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
        cachedSetTimeout = setTimeout;
        return setTimeout(fun, 0);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedSetTimeout(fun, 0);
    } catch(e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally
            return cachedSetTimeout.call(null, fun, 0);
        } catch(e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error
            return cachedSetTimeout.call(this, fun, 0);
        }
    }


}
function runClearTimeout(marker) {
    if (cachedClearTimeout === clearTimeout) {
        //normal enviroments in sane situations
        return clearTimeout(marker);
    }
    // if clearTimeout wasn't available but was latter defined
    if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
        cachedClearTimeout = clearTimeout;
        return clearTimeout(marker);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedClearTimeout(marker);
    } catch (e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally
            return cachedClearTimeout.call(null, marker);
        } catch (e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error.
            // Some versions of I.E. have different rules for clearTimeout vs setTimeout
            return cachedClearTimeout.call(this, marker);
        }
    }



}
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    if (!draining || !currentQueue) {
        return;
    }
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = runTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    runClearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        runTimeout(drainQueue);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;
process.prependListener = noop;
process.prependOnceListener = noop;

process.listeners = function (name) { return [] }

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}],5:[function(require,module,exports){
(function (process,__dirname){
(function(root, factory) {
    if (typeof module === 'object' && module.exports) {
        module.exports = factory(require('./nearley'));
    } else {
        root.Compile = factory(root.nearley);
    }
}(this, function(nearley) {

function Compile(structure, opts) {
    var unique = uniquer();
    if (!opts.alreadycompiled) {
        opts.alreadycompiled = [];
    }

    var result = {
        rules: [],
        body: [], // @directives list
        customTokens: [], // %tokens
        config: {}, // @config value
        macros: {},
        start: ''
    };

    for (var i = 0; i < structure.length; i++) {
        var productionRule = structure[i];
        if (productionRule.body) {
            // This isn't a rule, it's an @directive.
            if (!opts.nojs) {
                result.body.push(productionRule.body);
            }
        } else if (productionRule.include) {
            // Include file
            var path;
            if (!productionRule.builtin) {
                path = require('path').resolve(
                    opts.file ? require('path').dirname(opts.file) : process.cwd(),
                    productionRule.include
                );
            } else {
                path = require('path').resolve(
                    __dirname,
                    '../builtin/',
                    productionRule.include
                );
            }
            if (opts.alreadycompiled.indexOf(path) === -1) {
                opts.alreadycompiled.push(path);
                f = require('fs').readFileSync(path).toString();
                var parserGrammar = new require('./nearley-language-bootstrapped.js');
                var parser = new nearley.Parser(parserGrammar.ParserRules, parserGrammar.ParserStart);
                parser.feed(f);
                var c = Compile(parser.results[0], {path: path, __proto__:opts});
                require('./lint.js')(c, {out: process.stderr});
                result.rules = result.rules.concat(c.rules);
                result.body  = result.body.concat(c.body);
                result.customTokens = result.customTokens.concat(c.customTokens);
                Object.keys(c.config).forEach(function(k) {
                    result.config[k] = c.config[k];
                });
                Object.keys(c.macros).forEach(function(k) {
                    result.macros[k] = c.macros[k];
                });
            }
        } else if (productionRule.macro) {
            result.macros[productionRule.macro] = {
                'args': productionRule.args,
                'exprs': productionRule.exprs
            };
        } else if (productionRule.config) {
            // This isn't a rule, it's an @config.
            result.config[productionRule.config] = productionRule.value
        } else {
            produceRules(productionRule.name, productionRule.rules, {});
            if (!result.start) {
                result.start = productionRule.name;
            }
        }
    }

    return result;

    function produceRules(name, rules, env) {
        for (var i = 0; i < rules.length; i++) {
            var rule = buildRule(name, rules[i], env);
            if (opts.nojs) {
                rule.postprocess = null;
            }
            result.rules.push(rule);
        }
    }

    function buildRule(ruleName, rule, env) {
        var tokens = [];
        for (var i = 0; i < rule.tokens.length; i++) {
            var token = buildToken(ruleName, rule.tokens[i], env);
            if (token !== null) {
                tokens.push(token);
            }
        }
        return new nearley.Rule(
            ruleName,
            tokens,
            rule.postprocess
        );
    }

    function buildToken(ruleName, token, env) {
        if (typeof token === 'string') {
            if (token === 'null') {
                return null;
            }
            return token;
        }

        if (token instanceof RegExp) {
            return token;
        }

        if (token.literal) {
            if (!token.literal.length) {
                return null;
            }
            if (token.literal.length === 1 || result.config.lexer) {
                return token;
            }
            return buildStringToken(ruleName, token, env);
        }
        if (token.token) {
            if (result.config.lexer) {
                var name = token.token;
                if (result.customTokens.indexOf(name) === -1) {
                    result.customTokens.push(name);
                }
                var expr = result.config.lexer + ".has(" + JSON.stringify(name) + ") ? {type: " + JSON.stringify(name) + "} : " + name;
                return {token: "(" + expr + ")"};
            }
            return token;
        }

        if (token.subexpression) {
            return buildSubExpressionToken(ruleName, token, env);
        }

        if (token.ebnf) {
            return buildEBNFToken(ruleName, token, env);
        }

        if (token.macrocall) {
            return buildMacroCallToken(ruleName, token, env);
        }

        if (token.mixin) {
            if (env[token.mixin]) {
                return buildToken(ruleName, env[token.mixin], env);
            } else {
                throw new Error("Unbound variable: " + token.mixin);
            }
        }

        throw new Error("unrecognized token: " + JSON.stringify(token));
    }

    function buildStringToken(ruleName, token, env) {
        var newname = unique(ruleName + "$string");
        produceRules(newname, [
            {
                tokens: token.literal.split("").map(function charLiteral(d) {
                    return {
                        literal: d
                    };
                }),
                postprocess: {builtin: "joiner"}
            }
        ], env);
        return newname;
    }

    function buildSubExpressionToken(ruleName, token, env) {
        var data = token.subexpression;
        var name = unique(ruleName + "$subexpression");
        //structure.push({"name": name, "rules": data});
        produceRules(name, data, env);
        return name;
    }

    function buildEBNFToken(ruleName, token, env) {
        switch (token.modifier) {
            case ":+":
                return buildEBNFPlus(ruleName, token, env);
            case ":*":
                return buildEBNFStar(ruleName, token, env);
            case ":?":
                return buildEBNFOpt(ruleName, token, env);
        }
    }

    function buildEBNFPlus(ruleName, token, env) {
        var name = unique(ruleName + "$ebnf");
        /*
        structure.push({
            name: name,
            rules: [{
                tokens: [token.ebnf],
            }, {
                tokens: [token.ebnf, name],
                postprocess: {builtin: "arrconcat"}
            }]
        });
        */
        produceRules(name,
            [{
                tokens: [token.ebnf],
            }, {
                tokens: [name, token.ebnf],
                postprocess: {builtin: "arrpush"}
            }],
            env
        );
        return name;
    }

    function buildEBNFStar(ruleName, token, env) {
        var name = unique(ruleName + "$ebnf");
        /*
        structure.push({
            name: name,
            rules: [{
                tokens: [],
            }, {
                tokens: [token.ebnf, name],
                postprocess: {builtin: "arrconcat"}
            }]
        });
        */
        produceRules(name,
            [{
                tokens: [],
            }, {
                tokens: [name, token.ebnf],
                postprocess: {builtin: "arrpush"}
            }],
            env
        );
        return name;
    }

    function buildEBNFOpt(ruleName, token, env) {
        var name = unique(ruleName + "$ebnf");
        /*
        structure.push({
            name: name,
            rules: [{
                tokens: [token.ebnf],
                postprocess: {builtin: "id"}
            }, {
                tokens: [],
                postprocess: {builtin: "nuller"}
            }]
        });
        */
        produceRules(name,
            [{
                tokens: [token.ebnf],
                postprocess: {builtin: "id"}
            }, {
                tokens: [],
                postprocess: {builtin: "nuller"}
            }],
            env
        );
        return name;
    }

    function buildMacroCallToken(ruleName, token, env) {
        var name = unique(ruleName + "$macrocall");
        var macro = result.macros[token.macrocall];
        if (!macro) {
            throw new Error("Unkown macro: "+token.macrocall);
        }
        if (macro.args.length !== token.args.length) {
            throw new Error("Argument count mismatch.");
        }
        var newenv = {__proto__: env};
        for (var i=0; i<macro.args.length; i++) {
            var argrulename = unique(ruleName + "$macrocall");
            newenv[macro.args[i]] = argrulename;
            produceRules(argrulename, [token.args[i]], env);
            //structure.push({"name": argrulename, "rules":[token.args[i]]});
            //buildRule(name, token.args[i], env);
        }
        produceRules(name, macro.exprs, newenv);
        return name;
    }
}

function uniquer() {
    var uns = {};
    return unique;
    function unique(name) {
        var un = uns[name] = (uns[name] || 0) + 1;
        return name + '$' + un;
    }
}

return Compile;

}));

}).call(this,require('_process'),"/node_modules/nearley/lib")
},{"./lint.js":7,"./nearley":9,"_process":4,"fs":2,"path":3}],6:[function(require,module,exports){
(function(root, factory) {
    if (typeof module === 'object' && module.exports) {
        module.exports = factory(require('./nearley'));
    } else {
        root.generate = factory(root.nearley);
    }
}(this, function(nearley) {

function serializeRules(rules, builtinPostprocessors) {
    return "[\n    " + rules.map(function(rule) {
      return serializeRule(rule, builtinPostprocessors);
    }).join(",\n    ") + "\n]";
}

function dedentFunc(func) {
    var lines = func.toString().split(/\n/);

    if (lines.length === 1) {
        return [lines[0].replace(/^\s+|\s+$/g, '')];
    }

    var indent = null;
    var tail = lines.slice(1);
    for (var i = 0; i < tail.length; i++) {
        var match = /^\s*/.exec(tail[i]);
        if (match && match[0].length !== tail[i].length) {
            if (indent === null ||
                match[0].length < indent.length) {
                indent = match[0];
            }
        }
    }

    if (indent === null) {
        return lines;
    }

    return lines.map(function dedent(line) {
        if (line.slice(0, indent.length) === indent) {
            return line.slice(indent.length);
        }
        return line;
    });
}

function tabulateString(string, indent, options) {
    var lines;
    if(Array.isArray(string)) {
      lines = string;
    } else {
      lines = string.toString().split('\n');
    }

    options = options || {};
    tabulated = lines.map(function addIndent(line, i) {
        var shouldIndent = true;

        if(i == 0 && !options.indentFirst) {
          shouldIndent = false;
        }

        if(shouldIndent) {
            return indent + line;
        } else {
            return line;
        }
    }).join('\n');

    return tabulated;
}

function serializeSymbol(s) {
    if (s instanceof RegExp) {
        return s.toString();
    } else if (s.token) {
        return s.token;
    } else {
        return JSON.stringify(s);
    }
}

function serializeRule(rule, builtinPostprocessors) {
    var ret = '{';
    ret += '"name": ' + JSON.stringify(rule.name);
    ret += ', "symbols": [' + rule.symbols.map(serializeSymbol).join(', ') + ']';
    if (rule.postprocess) {
        if(rule.postprocess.builtin) {
            rule.postprocess = builtinPostprocessors[rule.postprocess.builtin];
        }
        ret += ', "postprocess": ' + tabulateString(dedentFunc(rule.postprocess), '        ', {indentFirst: false});
    }
    ret += '}';
    return ret;
}

var generate = function (parser, exportName) {
    if(!parser.config.preprocessor) {
        parser.config.preprocessor = "_default";
    }

    if(!generate[parser.config.preprocessor]) {
        throw new Error("No such preprocessor: " + parser.config.preprocessor)
    }

    return generate[parser.config.preprocessor](parser, exportName);
};

generate.js = generate._default = generate.javascript = function (parser, exportName) {
    var output = "// Generated automatically by nearley\n";
    output +=  "// http://github.com/Hardmath123/nearley\n";
    output += "(function () {\n";
    output += "function id(x) {return x[0]; }\n";
    output += parser.body.join('\n');
    output += "var grammar = {\n";
    output += "    Lexer: " + parser.config.lexer + ",\n";
    output += "    ParserRules: " +
        serializeRules(parser.rules, generate.javascript.builtinPostprocessors)
        + "\n";
    output += "  , ParserStart: " + JSON.stringify(parser.start) + "\n";
    output += "}\n";
    output += "if (typeof module !== 'undefined'"
        + "&& typeof module.exports !== 'undefined') {\n";
    output += "   module.exports = grammar;\n";
    output += "} else {\n";
    output += "   window." + exportName + " = grammar;\n";
    output += "}\n";
    output += "})();\n";
    return output;
};
generate.javascript.builtinPostprocessors = {
    "joiner": "function joiner(d) {return d.join('');}",
    "arrconcat": "function arrconcat(d) {return [d[0]].concat(d[1]);}",
    "arrpush": "function arrpush(d) {return d[0].concat([d[1]]);}",
    "nuller": "function(d) {return null;}",
    "id": "id"
}

generate.cs = generate.coffee = generate.coffeescript = function (parser, exportName) {
    var output = "# Generated automatically by nearley\n";
    output +=  "# http://github.com/Hardmath123/nearley\n";
    output += "do ->\n";
    output += "  id = (d)->d[0]\n";
    output += tabulateString(dedentFunc(parser.body.join('\n')), '  ') + '\n';
    output += "  grammar = {\n";
    output += "    Lexer: " + parser.config.lexer + ",\n";
    output += "    ParserRules: " +
        tabulateString(
                serializeRules(parser.rules, generate.coffeescript.builtinPostprocessors),
                '      ',
                {indentFirst: false})
    + ",\n";
    output += "    ParserStart: " + JSON.stringify(parser.start) + "\n";
    output += "  }\n";
    output += "  if typeof module != 'undefined' "
        + "&& typeof module.exports != 'undefined'\n";
    output += "    module.exports = grammar;\n";
    output += "  else\n";
    output += "    window." + exportName + " = grammar;\n";
    return output;
};
generate.coffeescript.builtinPostprocessors = {
    "joiner": "(d) -> d.join('')",
    "arrconcat": "(d) -> [d[0]].concat(d[1])",
    "arrpush": "(d) -> d[0].concat([d[1]])",
    "nuller": "() -> null",
    "id": "id"
};

generate.ts = generate.typescript = function (parser, exportName) {
    var output = "// Generated automatically by nearley\n";
    output +=  "// http://github.com/Hardmath123/nearley\n";
    output += "function id(d:any[]):any {return d[0];}\n";
    output += parser.customTokens.map(function (token) { return "declare var " + token + ":any;\n" }).join("")
    output += parser.body.join('\n');
    output += "export interface Token {value:any; [key: string]:any};\n";
    output += "export interface Lexer {reset:(chunk:string, info:any) => void; next:() => Token | undefined; save:() => any; formatError:(token:Token) => string; has:(tokenType:string) => boolean};\n";
    output += "export interface NearleyRule {name:string; symbols:NearleySymbol[]; postprocess?:(d:any[],loc?:number,reject?:{})=>any};\n";
    output += "export type NearleySymbol = string | {literal:any} | {test:(token:any) => boolean};\n";
    output += "export var Lexer:Lexer|undefined = " + parser.config.lexer + ";\n";
    output += "export var ParserRules:NearleyRule[] = " + serializeRules(parser.rules, generate.typescript.builtinPostprocessors) + ";\n";
    output += "export var ParserStart:string = " + JSON.stringify(parser.start) + ";\n";
    return output;
};
generate.typescript.builtinPostprocessors = {
    "joiner": "(d) => d.join('')",
    "arrconcat": "(d) => [d[0]].concat(d[1])",
    "arrpush": "(d) => d[0].concat([d[1]])",
    "nuller": "() => null",
    "id": "id"
};


return generate;

}));

},{"./nearley":9}],7:[function(require,module,exports){
(function (process){
// Node-only

var warn = function (opts, str) {
    opts.out.write("WARN"+"\t" + str + "\n");
}

function lintNames(grm, opts) {
    var all = [];
    grm.rules.forEach(function(rule) {
        all.push(rule.name);
    });
    grm.rules.forEach(function(rule) {
        rule.symbols.forEach(function(symbol) {
            if (!symbol.literal && !symbol.token && symbol.constructor !== RegExp) {
                if (all.indexOf(symbol) === -1) {
                    warn(opts,"Undefined symbol `" + symbol + "` used.");
                }
            }
        });
    });
}
function lint(grm, opts) {
    if (!opts.out) opts.out = process.stderr;
    lintNames(grm, opts);
}

module.exports = lint;

}).call(this,require('_process'))
},{"_process":4}],8:[function(require,module,exports){
// Generated automatically by nearley
// http://github.com/Hardmath123/nearley
(function () {
function id(x) {return x[0]; }


function insensitive(sl) {
    var s = sl.literal;
    result = [];
    for (var i=0; i<s.length; i++) {
        var c = s.charAt(i);
        if (c.toUpperCase() !== c || c.toLowerCase() !== c) {
            result.push(new RegExp("[" + c.toLowerCase() + c.toUpperCase() + "]"));
        } else {
            result.push({literal: c});
        }
    }
    return {subexpression: [{tokens: result, postprocess: function(d) {return d.join(""); }}]};
}

var grammar = {
    Lexer: undefined,
    ParserRules: [
    {"name": "dqstring$ebnf$1", "symbols": []},
    {"name": "dqstring$ebnf$1", "symbols": ["dqstring$ebnf$1", "dstrchar"], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "dqstring", "symbols": [{"literal":"\""}, "dqstring$ebnf$1", {"literal":"\""}], "postprocess": function(d) {return d[1].join(""); }},
    {"name": "sqstring$ebnf$1", "symbols": []},
    {"name": "sqstring$ebnf$1", "symbols": ["sqstring$ebnf$1", "sstrchar"], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "sqstring", "symbols": [{"literal":"'"}, "sqstring$ebnf$1", {"literal":"'"}], "postprocess": function(d) {return d[1].join(""); }},
    {"name": "btstring$ebnf$1", "symbols": []},
    {"name": "btstring$ebnf$1", "symbols": ["btstring$ebnf$1", /[^`]/], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "btstring", "symbols": [{"literal":"`"}, "btstring$ebnf$1", {"literal":"`"}], "postprocess": function(d) {return d[1].join(""); }},
    {"name": "dstrchar", "symbols": [/[^\\"\n]/], "postprocess": id},
    {"name": "dstrchar", "symbols": [{"literal":"\\"}, "strescape"], "postprocess": 
        function(d) {
            return JSON.parse("\""+d.join("")+"\"");
        }
        },
    {"name": "sstrchar", "symbols": [/[^\\'\n]/], "postprocess": id},
    {"name": "sstrchar", "symbols": [{"literal":"\\"}, "strescape"], "postprocess": function(d) { return JSON.parse("\""+d.join("")+"\""); }},
    {"name": "sstrchar$string$1", "symbols": [{"literal":"\\"}, {"literal":"'"}], "postprocess": function joiner(d) {return d.join('');}},
    {"name": "sstrchar", "symbols": ["sstrchar$string$1"], "postprocess": function(d) {return "'"; }},
    {"name": "strescape", "symbols": [/["\\\/bfnrt]/], "postprocess": id},
    {"name": "strescape", "symbols": [{"literal":"u"}, /[a-fA-F0-9]/, /[a-fA-F0-9]/, /[a-fA-F0-9]/, /[a-fA-F0-9]/], "postprocess": 
        function(d) {
            return d.join("");
        }
        },
    {"name": "final", "symbols": ["whit?", "prog", "whit?"], "postprocess": function(d) { return d[1]; }},
    {"name": "prog", "symbols": ["prod"], "postprocess": function(d) { return [d[0]]; }},
    {"name": "prog", "symbols": ["prod", "whit", "prog"], "postprocess": function(d) { return [d[0]].concat(d[2]); }},
    {"name": "prod$ebnf$1$subexpression$1", "symbols": [{"literal":"-"}]},
    {"name": "prod$ebnf$1$subexpression$1", "symbols": [{"literal":"="}]},
    {"name": "prod$ebnf$1", "symbols": ["prod$ebnf$1$subexpression$1"]},
    {"name": "prod$ebnf$1$subexpression$2", "symbols": [{"literal":"-"}]},
    {"name": "prod$ebnf$1$subexpression$2", "symbols": [{"literal":"="}]},
    {"name": "prod$ebnf$1", "symbols": ["prod$ebnf$1", "prod$ebnf$1$subexpression$2"], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "prod", "symbols": ["word", "whit?", "prod$ebnf$1", {"literal":">"}, "whit?", "expression+"], "postprocess": function(d) { return {name: d[0], rules: d[5]}; }},
    {"name": "prod$ebnf$2$subexpression$1", "symbols": [{"literal":"-"}]},
    {"name": "prod$ebnf$2$subexpression$1", "symbols": [{"literal":"="}]},
    {"name": "prod$ebnf$2", "symbols": ["prod$ebnf$2$subexpression$1"]},
    {"name": "prod$ebnf$2$subexpression$2", "symbols": [{"literal":"-"}]},
    {"name": "prod$ebnf$2$subexpression$2", "symbols": [{"literal":"="}]},
    {"name": "prod$ebnf$2", "symbols": ["prod$ebnf$2", "prod$ebnf$2$subexpression$2"], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "prod", "symbols": ["word", {"literal":"["}, "wordlist", {"literal":"]"}, "whit?", "prod$ebnf$2", {"literal":">"}, "whit?", "expression+"], "postprocess": function(d) {return {macro: d[0], args: d[2], exprs: d[8]}}},
    {"name": "prod", "symbols": [{"literal":"@"}, "whit?", "js"], "postprocess": function(d) { return {body: d[2]}; }},
    {"name": "prod", "symbols": [{"literal":"@"}, "word", "whit", "word"], "postprocess": function(d) { return {config: d[1], value: d[3]}; }},
    {"name": "prod$string$1", "symbols": [{"literal":"@"}, {"literal":"i"}, {"literal":"n"}, {"literal":"c"}, {"literal":"l"}, {"literal":"u"}, {"literal":"d"}, {"literal":"e"}], "postprocess": function joiner(d) {return d.join('');}},
    {"name": "prod", "symbols": ["prod$string$1", "whit?", "string"], "postprocess": function(d) {return {include: d[2].literal, builtin: false}}},
    {"name": "prod$string$2", "symbols": [{"literal":"@"}, {"literal":"b"}, {"literal":"u"}, {"literal":"i"}, {"literal":"l"}, {"literal":"t"}, {"literal":"i"}, {"literal":"n"}], "postprocess": function joiner(d) {return d.join('');}},
    {"name": "prod", "symbols": ["prod$string$2", "whit?", "string"], "postprocess": function(d) {return {include: d[2].literal, builtin: true }}},
    {"name": "expression+", "symbols": ["completeexpression"]},
    {"name": "expression+", "symbols": ["expression+", "whit?", {"literal":"|"}, "whit?", "completeexpression"], "postprocess": function(d) { return d[0].concat([d[4]]); }},
    {"name": "expressionlist", "symbols": ["completeexpression"]},
    {"name": "expressionlist", "symbols": ["expressionlist", "whit?", {"literal":","}, "whit?", "completeexpression"], "postprocess": function(d) { return d[0].concat([d[4]]); }},
    {"name": "wordlist", "symbols": ["word"]},
    {"name": "wordlist", "symbols": ["wordlist", "whit?", {"literal":","}, "whit?", "word"], "postprocess": function(d) { return d[0].concat([d[4]]); }},
    {"name": "completeexpression", "symbols": ["expr"], "postprocess": function(d) { return {tokens: d[0]}; }},
    {"name": "completeexpression", "symbols": ["expr", "whit?", "js"], "postprocess": function(d) { return {tokens: d[0], postprocess: d[2]}; }},
    {"name": "expr_member", "symbols": ["word"], "postprocess": id},
    {"name": "expr_member", "symbols": [{"literal":"$"}, "word"], "postprocess": function(d) {return {mixin: d[1]}}},
    {"name": "expr_member", "symbols": ["word", {"literal":"["}, "expressionlist", {"literal":"]"}], "postprocess": function(d) {return {macrocall: d[0], args: d[2]}}},
    {"name": "expr_member$ebnf$1", "symbols": [{"literal":"i"}], "postprocess": id},
    {"name": "expr_member$ebnf$1", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "expr_member", "symbols": ["string", "expr_member$ebnf$1"], "postprocess": function(d) { if (d[1]) {return insensitive(d[0]); } else {return d[0]; } }},
    {"name": "expr_member", "symbols": [{"literal":"%"}, "word"], "postprocess": function(d) {return {token: d[1]}}},
    {"name": "expr_member", "symbols": ["charclass"], "postprocess": id},
    {"name": "expr_member", "symbols": [{"literal":"("}, "whit?", "expression+", "whit?", {"literal":")"}], "postprocess": function(d) {return {'subexpression': d[2]} ;}},
    {"name": "expr_member", "symbols": ["expr_member", "whit?", "ebnf_modifier"], "postprocess": function(d) {return {'ebnf': d[0], 'modifier': d[2]}; }},
    {"name": "ebnf_modifier$string$1", "symbols": [{"literal":":"}, {"literal":"+"}], "postprocess": function joiner(d) {return d.join('');}},
    {"name": "ebnf_modifier", "symbols": ["ebnf_modifier$string$1"], "postprocess": id},
    {"name": "ebnf_modifier$string$2", "symbols": [{"literal":":"}, {"literal":"*"}], "postprocess": function joiner(d) {return d.join('');}},
    {"name": "ebnf_modifier", "symbols": ["ebnf_modifier$string$2"], "postprocess": id},
    {"name": "ebnf_modifier$string$3", "symbols": [{"literal":":"}, {"literal":"?"}], "postprocess": function joiner(d) {return d.join('');}},
    {"name": "ebnf_modifier", "symbols": ["ebnf_modifier$string$3"], "postprocess": id},
    {"name": "expr", "symbols": ["expr_member"]},
    {"name": "expr", "symbols": ["expr", "whit", "expr_member"], "postprocess": function(d){ return d[0].concat([d[2]]); }},
    {"name": "word", "symbols": [/[\w\?\+]/], "postprocess": function(d){ return d[0]; }},
    {"name": "word", "symbols": ["word", /[\w\?\+]/], "postprocess": function(d){ return d[0]+d[1]; }},
    {"name": "string", "symbols": ["dqstring"], "postprocess": function(d) {return { literal: d[0] }; }},
    {"name": "charclass", "symbols": [{"literal":"."}], "postprocess": function(d) { return new RegExp("."); }},
    {"name": "charclass", "symbols": [{"literal":"["}, "charclassmembers", {"literal":"]"}], "postprocess": function(d) { return new RegExp("[" + d[1].join('') + "]"); }},
    {"name": "charclassmembers", "symbols": []},
    {"name": "charclassmembers", "symbols": ["charclassmembers", "charclassmember"], "postprocess": function(d) { return d[0].concat([d[1]]); }},
    {"name": "charclassmember", "symbols": [/[^\\\]]/], "postprocess": function(d) { return d[0]; }},
    {"name": "charclassmember", "symbols": [{"literal":"\\"}, /./], "postprocess": function(d) { return d[0] + d[1]; }},
    {"name": "js", "symbols": [{"literal":"{"}, {"literal":"%"}, "jscode", {"literal":"%"}, {"literal":"}"}], "postprocess": function(d) { return d[2]; }},
    {"name": "jscode", "symbols": [], "postprocess": function() {return "";}},
    {"name": "jscode", "symbols": ["jscode", /[^%]/], "postprocess": function(d) {return d[0] + d[1];}},
    {"name": "jscode", "symbols": ["jscode", {"literal":"%"}, /[^}]/], "postprocess": function(d) {return d[0] + d[1] + d[2]; }},
    {"name": "whit", "symbols": ["whitraw"]},
    {"name": "whit", "symbols": ["whitraw?", "comment", "whit?"]},
    {"name": "whit?", "symbols": []},
    {"name": "whit?", "symbols": ["whit"]},
    {"name": "whitraw", "symbols": [/[\s]/]},
    {"name": "whitraw", "symbols": ["whitraw", /[\s]/]},
    {"name": "whitraw?", "symbols": []},
    {"name": "whitraw?", "symbols": ["whitraw"]},
    {"name": "comment", "symbols": [{"literal":"#"}, "commentchars", {"literal":"\n"}]},
    {"name": "commentchars", "symbols": []},
    {"name": "commentchars", "symbols": ["commentchars", /[^\n]/]}
]
  , ParserStart: "final"
}
if (typeof module !== 'undefined'&& typeof module.exports !== 'undefined') {
   module.exports = grammar;
} else {
   window.grammar = grammar;
}
})();

},{}],9:[function(require,module,exports){
(function(root, factory) {
    if (typeof module === 'object' && module.exports) {
        module.exports = factory();
    } else {
        root.nearley = factory();
    }
}(this, function() {

function Rule(name, symbols, postprocess) {
    this.id = ++Rule.highestId;
    this.name = name;
    this.symbols = symbols;        // a list of literal | regex class | nonterminal
    this.postprocess = postprocess;
    return this;
}
Rule.highestId = 0;

Rule.prototype.toString = function(withCursorAt) {
    function stringifySymbolSequence (e) {
        return e.literal ? JSON.stringify(e.literal) :
               e.type ? '%' + e.type : e.toString();
    }
    var symbolSequence = (typeof withCursorAt === "undefined")
                         ? this.symbols.map(stringifySymbolSequence).join(' ')
                         : (   this.symbols.slice(0, withCursorAt).map(stringifySymbolSequence).join(' ')
                             + " ● "
                             + this.symbols.slice(withCursorAt).map(stringifySymbolSequence).join(' ')     );
    return this.name + " → " + symbolSequence;
}


// a State is a rule at a position from a given starting point in the input stream (reference)
function State(rule, dot, reference, wantedBy) {
    this.rule = rule;
    this.dot = dot;
    this.reference = reference;
    this.data = [];
    this.wantedBy = wantedBy;
    this.isComplete = this.dot === rule.symbols.length;
}

State.prototype.toString = function() {
    return "{" + this.rule.toString(this.dot) + "}, from: " + (this.reference || 0);
};

State.prototype.nextState = function(child) {
    var state = new State(this.rule, this.dot + 1, this.reference, this.wantedBy);
    state.left = this;
    state.right = child;
    if (state.isComplete) {
        state.data = state.build();
    }
    return state;
};

State.prototype.build = function() {
    var children = [];
    var node = this;
    do {
        children.push(node.right.data);
        node = node.left;
    } while (node.left);
    children.reverse();
    return children;
};

State.prototype.finish = function() {
    if (this.rule.postprocess) {
        this.data = this.rule.postprocess(this.data, this.reference, Parser.fail);
    }
};


function Column(grammar, index) {
    this.grammar = grammar;
    this.index = index;
    this.states = [];
    this.wants = {}; // states indexed by the non-terminal they expect
    this.scannable = []; // list of states that expect a token
    this.completed = {}; // states that are nullable
}


Column.prototype.process = function(nextColumn) {
    var states = this.states;
    var wants = this.wants;
    var completed = this.completed;

    for (var w = 0; w < states.length; w++) { // nb. we push() during iteration
        var state = states[w];

        if (state.isComplete) {
            state.finish();
            if (state.data !== Parser.fail) {
                // complete
                var wantedBy = state.wantedBy;
                for (var i = wantedBy.length; i--; ) { // this line is hot
                    var left = wantedBy[i];
                    this.complete(left, state);
                }

                // special-case nullables
                if (state.reference === this.index) {
                    // make sure future predictors of this rule get completed.
                    var exp = state.rule.name;
                    (this.completed[exp] = this.completed[exp] || []).push(state);
                }
            }

        } else {
            // queue scannable states
            var exp = state.rule.symbols[state.dot];
            if (typeof exp !== 'string') {
                this.scannable.push(state);
                continue;
            }

            // predict
            if (wants[exp]) {
                wants[exp].push(state);

                if (completed.hasOwnProperty(exp)) {
                    var nulls = completed[exp];
                    for (var i = 0; i < nulls.length; i++) {
                        var right = nulls[i];
                        this.complete(state, right);
                    }
                }
            } else {
                wants[exp] = [state];
                this.predict(exp);
            }
        }
    }
}

Column.prototype.predict = function(exp) {
    var rules = this.grammar.byName[exp] || [];

    for (var i = 0; i < rules.length; i++) {
        var r = rules[i];
        var wantedBy = this.wants[exp];
        var s = new State(r, 0, this.index, wantedBy);
        this.states.push(s);
    }
}

Column.prototype.complete = function(left, right) {
    var inp = right.rule.name;
    if (left.rule.symbols[left.dot] === inp) {
        var copy = left.nextState(right);
        this.states.push(copy);
    }
}


function Grammar(rules, start) {
    this.rules = rules;
    this.start = start || this.rules[0].name;
    var byName = this.byName = {};
    this.rules.forEach(function(rule) {
        if (!byName.hasOwnProperty(rule.name)) {
            byName[rule.name] = [];
        }
        byName[rule.name].push(rule);
    });
}

// So we can allow passing (rules, start) directly to Parser for backwards compatibility
Grammar.fromCompiled = function(rules, start) {
    var lexer = rules.Lexer;
    if (rules.ParserStart) {
      start = rules.ParserStart;
      rules = rules.ParserRules;
    }
    var rules = rules.map(function (r) { return (new Rule(r.name, r.symbols, r.postprocess)); });
    var g = new Grammar(rules, start);
    g.lexer = lexer; // nb. storing lexer on Grammar is iffy, but unavoidable
    return g;
}


function StreamLexer() {
  this.reset("");
}

StreamLexer.prototype.reset = function(data, state) {
    this.buffer = data;
    this.index = 0;
    this.line = state ? state.line : 1;
    this.lastLineBreak = state ? -state.col : 0;
}

StreamLexer.prototype.next = function() {
    if (this.index < this.buffer.length) {
        var ch = this.buffer[this.index++];
        if (ch === '\n') {
          this.line += 1;
          this.lastLineBreak = this.index;
        }
        return {value: ch};
    }
}

StreamLexer.prototype.save = function() {
  return {
    line: this.line,
    col: this.index - this.lastLineBreak,
  }
}

StreamLexer.prototype.formatError = function(token, message) {
    // nb. this gets called after consuming the offending token,
    // so the culprit is index-1
    var buffer = this.buffer;
    if (typeof buffer === 'string') {
        var nextLineBreak = buffer.indexOf('\n', this.index);
        if (nextLineBreak === -1) nextLineBreak = buffer.length;
        var line = buffer.substring(this.lastLineBreak, nextLineBreak)
        var col = this.index - this.lastLineBreak;
        message += " at line " + this.line + " col " + col + ":\n\n";
        message += "  " + line + "\n"
        message += "  " + Array(col).join(" ") + "^"
        return message;
    } else {
        return message + " at index " + (this.index - 1);
    }
}


function Parser(rules, start, options) {
    if (rules instanceof Grammar) {
        var grammar = rules;
        var options = start;
    } else {
        var grammar = Grammar.fromCompiled(rules, start);
    }
    this.grammar = grammar;

    // Read options
    this.options = {
        keepHistory: false,
        lexer: grammar.lexer || new StreamLexer,
    };
    for (var key in (options || {})) {
        this.options[key] = options[key];
    }

    // Setup lexer
    this.lexer = this.options.lexer;
    this.lexerState = undefined;

    // Setup a table
    var column = new Column(grammar, 0);
    var table = this.table = [column];

    // I could be expecting anything.
    column.wants[grammar.start] = [];
    column.predict(grammar.start);
    // TODO what if start rule is nullable?
    column.process();
    this.current = 0; // token index
}

// create a reserved token for indicating a parse fail
Parser.fail = {};

Parser.prototype.feed = function(chunk) {
    var lexer = this.lexer;
    lexer.reset(chunk, this.lexerState);

    var token;
    while (token = lexer.next()) {
        // We add new states to table[current+1]
        var column = this.table[this.current];

        // GC unused states
        if (!this.options.keepHistory) {
            delete this.table[this.current - 1];
        }

        var n = this.current + 1;
        var nextColumn = new Column(this.grammar, n);
        this.table.push(nextColumn);

        // Advance all tokens that expect the symbol
        var literal = token.value;
        var value = lexer.constructor === StreamLexer ? token.value : token;
        var scannable = column.scannable;
        for (var w = scannable.length; w--; ) {
            var state = scannable[w];
            var expect = state.rule.symbols[state.dot];
            // Try to consume the token
            // either regex or literal
            if (expect.test ? expect.test(value) :
                expect.type ? expect.type === token.type
                            : expect.literal === literal) {
                // Add it
                var next = state.nextState({data: value, token: token, isToken: true, reference: n - 1});
                nextColumn.states.push(next);
            }
        }

        // Next, for each of the rules, we either
        // (a) complete it, and try to see if the reference row expected that
        //     rule
        // (b) predict the next nonterminal it expects by adding that
        //     nonterminal's start state
        // To prevent duplication, we also keep track of rules we have already
        // added

        nextColumn.process();

        // If needed, throw an error:
        if (nextColumn.states.length === 0) {
            // No states at all! This is not good.
            var message = this.lexer.formatError(token, "invalid syntax") + "\n";
            message += "Unexpected " + (token.type ? token.type + " token: " : "");
            message += JSON.stringify(token.value !== undefined ? token.value : token) + "\n";
            var err = new Error(message);
            err.offset = this.current;
            err.token = token;
            throw err;
        }

        // maybe save lexer state
        if (this.options.keepHistory) {
          column.lexerState = lexer.save()
        }

        this.current++;
    }
    if (column) {
      this.lexerState = lexer.save()
    }

    // Incrementally keep track of results
    this.results = this.finish();

    // Allow chaining, for whatever it's worth
    return this;
};

Parser.prototype.save = function() {
    var column = this.table[this.current];
    column.lexerState = this.lexerState;
    return column;
};

Parser.prototype.restore = function(column) {
    var index = column.index;
    this.current = index;
    this.table[index] = column;
    this.table.splice(index + 1);
    this.lexerState = column.lexerState;

    // Incrementally keep track of results
    this.results = this.finish();
};

// nb. deprecated: use save/restore instead!
Parser.prototype.rewind = function(index) {
    if (!this.options.keepHistory) {
        throw new Error('set option `keepHistory` to enable rewinding')
    }
    // nb. recall column (table) indicies fall between token indicies.
    //        col 0   --   token 0   --   col 1
    this.restore(this.table[index]);
};

Parser.prototype.finish = function() {
    // Return the possible parsings
    var considerations = [];
    var start = this.grammar.start;
    var column = this.table[this.table.length - 1]
    column.states.forEach(function (t) {
        if (t.rule.name === start
                && t.dot === t.rule.symbols.length
                && t.reference === 0
                && t.data !== Parser.fail) {
            considerations.push(t);
        }
    });
    return considerations.map(function(c) {return c.data; });
};

return {
    Parser: Parser,
    Grammar: Grammar,
    Rule: Rule,
};

}));

},{}],10:[function(require,module,exports){
/*
Railroad Diagrams
by Tab Atkins Jr. (and others)
http://xanthir.com
http://twitter.com/tabatkins
http://github.com/tabatkins/railroad-diagrams

This document and all associated files in the github project are licensed under CC0: http://creativecommons.org/publicdomain/zero/1.0/
This means you can reuse, remix, or otherwise appropriate this project for your own use WITHOUT RESTRICTION.
(The actual legal meaning can be found at the above link.)
Don't ask me for permission to use any part of this project, JUST USE IT.
I would appreciate attribution, but that is not required by the license.
*/

/*
This file uses a module pattern to avoid leaking names into the global scope.
The only accidental leakage is the name "temp".
The exported names can be found at the bottom of this file;
simply change the names in the array of strings to change what they are called in your application.

As well, several configuration constants are passed into the module function at the bottom of this file.
At runtime, these constants can be found on the Diagram class.
*/

(function(options) {
	function subclassOf(baseClass, superClass) {
		baseClass.prototype = Object.create(superClass.prototype);
		baseClass.prototype.$super = superClass.prototype;
	}

	function unnull(/* children */) {
		return [].slice.call(arguments).reduce(function(sofar, x) { return sofar !== undefined ? sofar : x; });
	}

	function determineGaps(outer, inner) {
		var diff = outer - inner;
		switch(Diagram.INTERNAL_ALIGNMENT) {
			case 'left': return [0, diff]; break;
			case 'right': return [diff, 0]; break;
			case 'center':
			default: return [diff/2, diff/2]; break;
		}
	}

	function wrapString(value) {
		return ((typeof value) == 'string') ? new Terminal(value) : value;
	}


	function SVG(name, attrs, text) {
		attrs = attrs || {};
		text = text || '';
		var el = document.createElementNS("http://www.w3.org/2000/svg",name);
		for(var attr in attrs) {
			el.setAttribute(attr, attrs[attr]);
		}
		el.textContent = text;
		return el;
	}

	function FakeSVG(tagName, attrs, text){
		if(!(this instanceof FakeSVG)) return new FakeSVG(tagName, attrs, text);
		if(text) this.children = text;
		else this.children = [];
		this.tagName = tagName;
		this.attrs = unnull(attrs, {});
		return this;
	};
	FakeSVG.prototype.format = function(x, y, width) {
		// Virtual
	};
	FakeSVG.prototype.addTo = function(parent) {
		if(parent instanceof FakeSVG) {
			parent.children.push(this);
			return this;
		} else {
			var svg = this.toSVG();
			parent.appendChild(svg);
			return svg;
		}
	};
	FakeSVG.prototype.escapeString = function(string) {
                // Escape markdown and HTML special characters
		return string.replace(/[*_\`\[\]<&]/g, function(charString) {
			return '&#' + charString.charCodeAt(0) + ';';
		});
	};
	FakeSVG.prototype.toSVG = function() {
		var el = SVG(this.tagName, this.attrs);
		if(typeof this.children == 'string') {
			el.innerHTML = FakeSVG.prototype.escapeString(this.children);
		} else {
			this.children.forEach(function(e) {
				el.appendChild(e.toSVG());
			});
		}
		return el;
	};
	FakeSVG.prototype.toString = function() {
		var str = '<' + this.tagName;
		var group = this.tagName == "g" || this.tagName == "svg";
		for(var attr in this.attrs) {
			str += ' ' + attr + '="' + (this.attrs[attr]+'').replace(/&/g, '&amp;').replace(/"/g, '&quot;') + '"';
		}
		str += '>';
		if(group) str += "\n";
		if(typeof this.children == 'string') {
			str += FakeSVG.prototype.escapeString(this.children);
		} else {
			this.children.forEach(function(e) {
				str += e;
			});
		}
		str += '</' + this.tagName + '>\n';
		return str;
	}

	function Path(x,y) {
		if(!(this instanceof Path)) return new Path(x,y);
		FakeSVG.call(this, 'path');
		this.attrs.d = "M"+x+' '+y;
	}
	subclassOf(Path, FakeSVG);
	Path.prototype.m = function(x,y) {
		this.attrs.d += 'm'+x+' '+y;
		return this;
	}
	Path.prototype.h = function(val) {
		this.attrs.d += 'h'+val;
		return this;
	}
	Path.prototype.right = Path.prototype.h;
	Path.prototype.left = function(val) { return this.h(-val); }
	Path.prototype.v = function(val) {
		this.attrs.d += 'v'+val;
		return this;
	}
	Path.prototype.down = Path.prototype.v;
	Path.prototype.up = function(val) { return this.v(-val); }
	Path.prototype.arc = function(sweep){
		var x = Diagram.ARC_RADIUS;
		var y = Diagram.ARC_RADIUS;
		if(sweep[0] == 'e' || sweep[1] == 'w') {
			x *= -1;
		}
		if(sweep[0] == 's' || sweep[1] == 'n') {
			y *= -1;
		}
		if(sweep == 'ne' || sweep == 'es' || sweep == 'sw' || sweep == 'wn') {
			var cw = 1;
		} else {
			var cw = 0;
		}
		this.attrs.d += "a"+Diagram.ARC_RADIUS+" "+Diagram.ARC_RADIUS+" 0 0 "+cw+' '+x+' '+y;
		return this;
	}
	Path.prototype.format = function() {
		// All paths in this library start/end horizontally.
		// The extra .5 ensures a minor overlap, so there's no seams in bad rasterizers.
		this.attrs.d += 'h.5';
		return this;
	}

	function Diagram(items) {
		if(!(this instanceof Diagram)) return new Diagram([].slice.call(arguments));
		FakeSVG.call(this, 'svg', {class: Diagram.DIAGRAM_CLASS});
		this.items = items.map(wrapString);
		this.items.unshift(new Start);
		this.items.push(new End);
		this.width = this.items.reduce(function(sofar, el) { return sofar + el.width + (el.needsSpace?20:0)}, 0)+1;
		this.up = Math.max.apply(null, this.items.map(function (x) { return x.up; }));
		this.down = Math.max.apply(null, this.items.map(function (x) { return x.down; }));
		this.formatted = false;
	}
	subclassOf(Diagram, FakeSVG);
	for(var option in options) {
		Diagram[option] = options[option];
	}
	Diagram.prototype.format = function(paddingt, paddingr, paddingb, paddingl) {
		paddingt = unnull(paddingt, 20);
		paddingr = unnull(paddingr, paddingt, 20);
		paddingb = unnull(paddingb, paddingt, 20);
		paddingl = unnull(paddingl, paddingr, 20);
		var x = paddingl;
		var y = paddingt;
		y += this.up;
		var g = FakeSVG('g', Diagram.STROKE_ODD_PIXEL_LENGTH ? {transform:'translate(.5 .5)'} : {});
		for(var i = 0; i < this.items.length; i++) {
			var item = this.items[i];
			if(item.needsSpace) {
				Path(x,y).h(10).addTo(g);
				x += 10;
			}
			item.format(x, y, item.width).addTo(g);
			x += item.width;
			if(item.needsSpace) {
				Path(x,y).h(10).addTo(g);
				x += 10;
			}
		}
		this.attrs.width = this.width + paddingl + paddingr;
		this.attrs.height = this.up + this.down + paddingt + paddingb;
		this.attrs.viewBox = "0 0 "  + this.attrs.width + " " + this.attrs.height;
		g.addTo(this);
		this.formatted = true;
		return this;
	}
	Diagram.prototype.addTo = function(parent) {
		var scriptTag = document.getElementsByTagName('script');
		scriptTag = scriptTag[scriptTag.length - 1];
		var parentTag = scriptTag.parentNode;
		parent = parent || parentTag;
		return this.$super.addTo.call(this, parent);
	}
	Diagram.prototype.toSVG = function() {
		if (!this.formatted) {
			this.format();
		}
		return this.$super.toSVG.call(this);
	}
	Diagram.prototype.toString = function() {
		if (!this.formatted) {
			this.format();
		}
		return this.$super.toString.call(this);
	}

	function ComplexDiagram() {
		var diagram = new Diagram([].slice.call(arguments));
                var items = diagram.items;
		items.shift();
		items.pop();
		items.unshift(new Start(false));
		items.push(new End(false));
		diagram.items = items;
		return diagram;
        }

	function Sequence(items) {
		if(!(this instanceof Sequence)) return new Sequence([].slice.call(arguments));
		FakeSVG.call(this, 'g');
		this.items = items.map(wrapString);
		this.width = this.items.reduce(function(sofar, el) { return sofar + el.width + (el.needsSpace?20:0)}, 0);
		this.up = this.items.reduce(function(sofar,el) { return Math.max(sofar, el.up)}, 0);
		this.down = this.items.reduce(function(sofar,el) { return Math.max(sofar, el.down)}, 0);
	}
	subclassOf(Sequence, FakeSVG);
	Sequence.prototype.format = function(x,y,width) {
		// Hook up the two sides if this is narrower than its stated width.
		var gaps = determineGaps(width, this.width);
		Path(x,y).h(gaps[0]).addTo(this);
		Path(x+gaps[0]+this.width,y).h(gaps[1]).addTo(this);
		x += gaps[0];

		for(var i = 0; i < this.items.length; i++) {
			var item = this.items[i];
			if(item.needsSpace) {
				Path(x,y).h(10).addTo(this);
				x += 10;
			}
			item.format(x, y, item.width).addTo(this);
			x += item.width;
			if(item.needsSpace) {
				Path(x,y).h(10).addTo(this);
				x += 10;
			}
		}
		return this;
	}

	function Choice(normal, items) {
		if(!(this instanceof Choice)) return new Choice(normal, [].slice.call(arguments,1));
		FakeSVG.call(this, 'g');
		if( typeof normal !== "number" || normal !== Math.floor(normal) ) {
			throw new TypeError("The first argument of Choice() must be an integer.");
		} else if(normal < 0 || normal >= items.length) {
			throw new RangeError("The first argument of Choice() must be an index for one of the items.");
		} else {
			this.normal = normal;
		}
		this.items = items.map(wrapString);
		this.width = this.items.reduce(function(sofar, el){return Math.max(sofar, el.width)},0) + Diagram.ARC_RADIUS*4;
		this.up = this.down = 0;
		for(var i = 0; i < this.items.length; i++) {
			var item = this.items[i];
			if(i < normal) { this.up += Math.max(Diagram.ARC_RADIUS,item.up + item.down + Diagram.VERTICAL_SEPARATION); }
			if(i == normal) { this.up += Math.max(Diagram.ARC_RADIUS, item.up); this.down += Math.max(Diagram.ARC_RADIUS, item.down); }
			if(i > normal) { this.down += Math.max(Diagram.ARC_RADIUS,Diagram.VERTICAL_SEPARATION + item.up + item.down); }
		}
	}
	subclassOf(Choice, FakeSVG);
	Choice.prototype.format = function(x,y,width) {
		// Hook up the two sides if this is narrower than its stated width.
		var gaps = determineGaps(width, this.width);
		Path(x,y).h(gaps[0]).addTo(this);
		Path(x+gaps[0]+this.width,y).h(gaps[1]).addTo(this);
		x += gaps[0];

		var last = this.items.length -1;
		var innerWidth = this.width - Diagram.ARC_RADIUS*4;

		// Do the elements that curve above
		for(var i = this.normal - 1; i >= 0; i--) {
			var item = this.items[i];
			if( i == this.normal - 1 ) {
				var distanceFromY = Math.max(Diagram.ARC_RADIUS*2, this.items[i+1].up + Diagram.VERTICAL_SEPARATION + item.down);
			}
			Path(x,y).arc('se').up(distanceFromY - Diagram.ARC_RADIUS*2).arc('wn').addTo(this);
			item.format(x+Diagram.ARC_RADIUS*2,y - distanceFromY,innerWidth).addTo(this);
			Path(x+Diagram.ARC_RADIUS*2+innerWidth, y-distanceFromY).arc('ne').down(distanceFromY - Diagram.ARC_RADIUS*2).arc('ws').addTo(this);
			distanceFromY += Math.max(Diagram.ARC_RADIUS, item.up + Diagram.VERTICAL_SEPARATION + (i == 0 ? 0 : this.items[i-1].down));
		}

		// Do the straight-line path.
		Path(x,y).right(Diagram.ARC_RADIUS*2).addTo(this);
		this.items[this.normal].format(x+Diagram.ARC_RADIUS*2, y, innerWidth).addTo(this);
		Path(x+Diagram.ARC_RADIUS*2+innerWidth, y).right(Diagram.ARC_RADIUS*2).addTo(this);

		// Do the elements that curve below
		for(var i = this.normal+1; i <= last; i++) {
			var item = this.items[i];
			if( i == this.normal + 1 ) {
				var distanceFromY = Math.max(Diagram.ARC_RADIUS*2, this.items[i-1].down + Diagram.VERTICAL_SEPARATION + item.up);
			}
			Path(x,y).arc('ne').down(distanceFromY - Diagram.ARC_RADIUS*2).arc('ws').addTo(this);
			item.format(x+Diagram.ARC_RADIUS*2, y+distanceFromY, innerWidth).addTo(this);
			Path(x+Diagram.ARC_RADIUS*2+innerWidth, y+distanceFromY).arc('se').up(distanceFromY - Diagram.ARC_RADIUS*2).arc('wn').addTo(this);
			distanceFromY += Math.max(Diagram.ARC_RADIUS, item.down + Diagram.VERTICAL_SEPARATION + (i == last ? 0 : this.items[i+1].up));
		}

		return this;
	}

	function Optional(item, skip) {
		if( skip === undefined )
			return Choice(1, Skip(), item);
		else if ( skip === "skip" )
			return Choice(0, Skip(), item);
		else
			throw "Unknown value for Optional()'s 'skip' argument.";
	}

	function OneOrMore(item, rep) {
		if(!(this instanceof OneOrMore)) return new OneOrMore(item, rep);
		FakeSVG.call(this, 'g');
		rep = rep || (new Skip);
		this.item = wrapString(item);
		this.rep = wrapString(rep);
		this.width = Math.max(this.item.width, this.rep.width) + Diagram.ARC_RADIUS*2;
		this.up = this.item.up;
		this.down = Math.max(Diagram.ARC_RADIUS*2, this.item.down + Diagram.VERTICAL_SEPARATION + this.rep.up + this.rep.down);
	}
	subclassOf(OneOrMore, FakeSVG);
	OneOrMore.prototype.needsSpace = true;
	OneOrMore.prototype.format = function(x,y,width) {
		// Hook up the two sides if this is narrower than its stated width.
		var gaps = determineGaps(width, this.width);
		Path(x,y).h(gaps[0]).addTo(this);
		Path(x+gaps[0]+this.width,y).h(gaps[1]).addTo(this);
		x += gaps[0];

		// Draw item
		Path(x,y).right(Diagram.ARC_RADIUS).addTo(this);
		this.item.format(x+Diagram.ARC_RADIUS,y,this.width-Diagram.ARC_RADIUS*2).addTo(this);
		Path(x+this.width-Diagram.ARC_RADIUS,y).right(Diagram.ARC_RADIUS).addTo(this);

		// Draw repeat arc
		var distanceFromY = Math.max(Diagram.ARC_RADIUS*2, this.item.down+Diagram.VERTICAL_SEPARATION+this.rep.up);
		Path(x+Diagram.ARC_RADIUS,y).arc('nw').down(distanceFromY-Diagram.ARC_RADIUS*2).arc('ws').addTo(this);
		this.rep.format(x+Diagram.ARC_RADIUS, y+distanceFromY, this.width - Diagram.ARC_RADIUS*2).addTo(this);
		Path(x+this.width-Diagram.ARC_RADIUS, y+distanceFromY).arc('se').up(distanceFromY-Diagram.ARC_RADIUS*2).arc('en').addTo(this);

		return this;
	}

	function ZeroOrMore(item, rep, skip) {
		return Optional(OneOrMore(item, rep), skip);
	}

	function Start(simpleType) {
		if(!(this instanceof Start)) return new Start();
		FakeSVG.call(this, 'path');
		this.width = 20;
		this.up = 10;
		this.down = 10;
		this.simpleType = simpleType;
	}
	subclassOf(Start, FakeSVG);
	Start.prototype.format = function(x,y) {
		if (this.simpleType === false) {
			this.attrs.d = 'M '+x+' '+(y-10)+' v 20 m 0 -10 h 20.5';
		} else {
			this.attrs.d = 'M '+x+' '+(y-10)+' v 20 m 10 -20 v 20 m -10 -10 h 20.5';
		}
		return this;
	}

	function End(simpleType) {
		if(!(this instanceof End)) return new End();
		FakeSVG.call(this, 'path');
		this.width = 20;
		this.up = 10;
		this.down = 10;
		this.simpleType = simpleType;
	}
	subclassOf(End, FakeSVG);
	End.prototype.format = function(x,y) {
		if (this.simpleType === false) {
			this.attrs.d = 'M '+x+' '+y+' h 20 m 0 -10 v 20';
		} else {
			this.attrs.d = 'M '+x+' '+y+' h 20 m -10 -10 v 20 m 10 -20 v 20';
		}
		return this;
	}

	function Terminal(text) {
		if(!(this instanceof Terminal)) return new Terminal(text);
		FakeSVG.call(this, 'g');
		this.text = text;
		this.width = text.length * 8 + 20; /* Assume that each char is .5em, and that the em is 16px */
		this.up = 11;
		this.down = 11;
	}
	subclassOf(Terminal, FakeSVG);
	Terminal.prototype.needsSpace = true;
	Terminal.prototype.format = function(x, y, width) {
		// Hook up the two sides if this is narrower than its stated width.
		var gaps = determineGaps(width, this.width);
		Path(x,y).h(gaps[0]).addTo(this);
		Path(x+gaps[0]+this.width,y).h(gaps[1]).addTo(this);
		x += gaps[0];

		FakeSVG('rect', {x:x, y:y-11, width:this.width, height:this.up+this.down, rx:10, ry:10}).addTo(this);
		FakeSVG('text', {x:x+this.width/2, y:y+4}, this.text).addTo(this);
		return this;
	}

	function NonTerminal(text) {
		if(!(this instanceof NonTerminal)) return new NonTerminal(text);
		FakeSVG.call(this, 'g');
		this.text = text;
		this.width = text.length * 8 + 20;
		this.up = 11;
		this.down = 11;
	}
	subclassOf(NonTerminal, FakeSVG);
	NonTerminal.prototype.needsSpace = true;
	NonTerminal.prototype.format = function(x, y, width) {
		// Hook up the two sides if this is narrower than its stated width.
		var gaps = determineGaps(width, this.width);
		Path(x,y).h(gaps[0]).addTo(this);
		Path(x+gaps[0]+this.width,y).h(gaps[1]).addTo(this);
		x += gaps[0];

		FakeSVG('rect', {x:x, y:y-11, width:this.width, height:this.up+this.down}).addTo(this);
		FakeSVG('text', {x:x+this.width/2, y:y+4}, this.text).addTo(this);
		return this;
	}

	function Comment(text) {
		if(!(this instanceof Comment)) return new Comment(text);
		FakeSVG.call(this, 'g');
		this.text = text;
		this.width = text.length * 7 + 10;
		this.up = 11;
		this.down = 11;
	}
	subclassOf(Comment, FakeSVG);
	Comment.prototype.needsSpace = true;
	Comment.prototype.format = function(x, y, width) {
		// Hook up the two sides if this is narrower than its stated width.
		var gaps = determineGaps(width, this.width);
		Path(x,y).h(gaps[0]).addTo(this);
		Path(x+gaps[0]+this.width,y).h(gaps[1]).addTo(this);
		x += gaps[0];

		FakeSVG('text', {x:x+this.width/2, y:y+5, class:'comment'}, this.text).addTo(this);
		return this;
	}

	function Skip() {
		if(!(this instanceof Skip)) return new Skip();
		FakeSVG.call(this, 'g');
		this.width = 0;
		this.up = 0;
		this.down = 0;
	}
	subclassOf(Skip, FakeSVG);
	Skip.prototype.format = function(x, y, width) {
		Path(x,y).right(width).addTo(this);
		return this;
	}
	
	var root;
	if (typeof define === 'function' && define.amd) {
		// AMD. Register as an anonymous module.
		root = {};
		define([], function() {
			return root;
		});
	} else if (typeof exports === 'object') {
		// CommonJS for node
		root = exports;
	} else {
		// Browser globals (root is window)
		root = this;
	}

	var temp = [Diagram, ComplexDiagram, Sequence, Choice, Optional, OneOrMore, ZeroOrMore, Terminal, NonTerminal, Comment, Skip];
	/*
	These are the names that the internal classes are exported as.
	If you would like different names, adjust them here.
	*/
	['Diagram', 'ComplexDiagram', 'Sequence', 'Choice', 'Optional', 'OneOrMore', 'ZeroOrMore', 'Terminal', 'NonTerminal', 'Comment', 'Skip']
		.forEach(function(e,i) { root[e] = temp[i]; });
}).call(this,
	{
	VERTICAL_SEPARATION: 8,
	ARC_RADIUS: 10,
	DIAGRAM_CLASS: 'railroad-diagram',
	STROKE_ODD_PIXEL_LENGTH: true,
	INTERNAL_ALIGNMENT: 'center',
	}
);

},{}]},{},[1]);
