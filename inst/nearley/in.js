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

    module.exports.railroad_html = '<div class="railroad_wrapper">' + railroad(grammarAst) + '</div>';

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
          '<p class="production_rule">' + r + '</p>',
          '<div class="svg_div">',
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

    return diagrams.join('\n')

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
