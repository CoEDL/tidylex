context("compile_grammar")

basic_grammar <-
'# Default basic grammar from Nearley playground:
# https://omrelli.ug/nearley-playground/
MAIN -> SENTENCE "."
SENTENCE -> SUB _ VERB _ MOD
SUB -> "My dog" | "Charles" | "A typical Reddit user"
VERB -> "sleeps" | "thinks" | "cries" | "tweets" | "believes in ponies"
MOD -> "with" _ OBJ | "while thinking about" _ OBJ | "better than" _ OBJ _ "can" | "agressively" | "but" _ SENTENCE
OBJ -> "a hammer" | "nobody" | "snakes"
_ -> " "
'

test_that("non-string input values rejected by function", {
    expect_error(compile_grammar(TRUE))
    expect_error(compile_grammar(154))
    expect_error(compile_grammar(mtcars))
})

test_that("Invalid Nearley grammar throws syntax error", {
    expect_error(compile_grammar("MAIN <- SENTENCE"))
})

test_that("Nearley .ne grammar files are read in properly", {

    # Can't expect identical since bytecode will be equal but
    # will be in different environments
    expect_equal(
        compile_grammar(basic_grammar),
        compile_grammar(system.file("extdata", "basic-nearley-grammar.ne", package = "tidylex"))
    )

})

test_that("tests against basic nearley grammar return as expected", {

    parser <- compile_grammar(basic_grammar)

    expect_equal(
        names(parser),
        c("view_railroads", "parse_str")
    )

    expect_true(
        all(lapply(parser, typeof) == "closure")
    )

    parse_result <- parser$parse_str("Charles sleeps while thinking about snakes.")$parse_trees

    # There shouldn't be an ambiguous parse (i.e. length >= 2)
    expect_length(parse_result, 1)

    expect_identical(
        # Correct parse
        parse_result,
        list(                         # First (and only parse)
            list(                       # MAIN
                list(                       # SENTENCE
                    list("Charles"),                  # SUB
                    list(" "),                        # _
                    list("sleeps"),                   # VERB
                    list(" "),                        # _
                    list(                       # MOD
                        "while thinking about", #    "while thinking about"
                        list(" "),                    #    _
                        list("snakes")                #    OBJ
                    )
                ),
            ".")                            # "."
        )
    )

    expect_equal(
        # Incomplete parse
        parser$parse_str("Charles sleeps while thinking about ")$error,
        "Incomplete parse, expecting more data at end of input."
    )

    expect_equal(
        # Invalid parse
        parser$parse_str("This test doesn't match :(")$error,
        "Error: invalid syntax at line 1 col 1:\n\n  T\n  ^\nUnexpected \"T\"\n"
    )

})

test_that("vector labelling function returns expected labels", {

    parser <- compile_grammar('word -> "one" "two" "three"')$parse_str

    expect_identical(
        parser(c("one", "two", "three"), return_labels = TRUE),
        c(TRUE, TRUE, TRUE)
    )

    expect_identical(
        parser(c("one", "three", "two"), return_labels = TRUE),
        c(TRUE, FALSE, NA)
    )

    expect_identical(
        parser(c("one", "two", NA), return_labels = TRUE),
        c(TRUE, TRUE, NA)
    )

})

test_that("railroad diagram HTML generated as expected", {

    railroad_html <- compile_grammar("x -> y")$view_railroads()$x

    expect_equal(
        railroad_html,
        "<div class=\"railroad_wrapper\"><p class=\"production_rule\">x</p>\n<div class=\"svg_div\">\n<svg class=\"railroad-diagram\" width=\"169\" height=\"62\" viewBox=\"0 0 169 62\">\n<g transform=\"translate(.5 .5)\">\n<path d=\"M 20 21 v 20 m 10 -20 v 20 m -10 -10 h 20.5\"></path>\n<g>\n<path d=\"M40 31h0\"></path>\n<path d=\"M128 31h0\"></path>\n<path d=\"M40 31h20\"></path>\n<g>\n<path d=\"M60 31h0\"></path>\n<path d=\"M108 31h0\"></path>\n<path d=\"M60 31h10\"></path>\n<g>\n<path d=\"M70 31h0\"></path>\n<path d=\"M98 31h0\"></path>\n<rect x=\"70\" y=\"20\" width=\"28\" height=\"22\"></rect>\n<text x=\"84\" y=\"35\">y</text>\n</g>\n<path d=\"M98 31h10\"></path>\n</g>\n<path d=\"M108 31h20\"></path>\n</g>\n<path d=\"M 128 31 h 20 m -10 -10 v 20 m 10 -20 v 20\"></path>\n</g>\n</svg>\n\n</div></div>"
    )

})

