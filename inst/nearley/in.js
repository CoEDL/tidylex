// Node.js code taken from https://nearley.js.org/docs/using-in-frontend
// This file is used to generate bundle.js via Browserify
// which is then sourced into R using the R V8 package

global.nearley        = require('nearley');
global.compile        = require("nearley/lib/compile");
global.generate       = require("nearley/lib/generate");
global.nearleyGrammar = require("nearley/lib/nearley-language-bootstrapped");

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

    return module.exports;
}
