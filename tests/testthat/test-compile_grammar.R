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
