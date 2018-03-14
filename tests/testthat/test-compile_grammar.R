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

    expect_identical(
        # Correct parse
        compile_grammar(basic_grammar)("Charles sleeps while thinking about snakes."),
        list(
            list(                       # MAIN
                list(                       # SENTENCE
                    "Charles",                  # SUB
                    " ",                        # _
                    "sleeps",                   # VERB
                    " ",                        # _
                    list(                       # MOD
                        "while thinking about", #    "while thinking about"
                        " ",                    #    _
                        "snakes"                #    OBJ
                    )
                ),
            ".")                            # "."
        )
    )

    expect_error(
        # Incomplete parse
        compile_grammar(basic_grammar)("Charles sleeps while thinking about ")
    )

    expect_error(
        # Invalid parse
        compile_grammar(basic_grammar)("This test doesn't match :(")
    )

    # As above, but error messages returned when told not to stop script
    expect_true(
        "error" %in% names(compile_grammar(basic_grammar)("Charles sleeps while thinking about ", stop_on_error = FALSE))
    )

    expect_true(
        "error" %in% names(compile_grammar(basic_grammar)("This test doesn't match :(", stop_on_error = FALSE))
    )

})
