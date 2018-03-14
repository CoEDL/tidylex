context("read_lexicon")

check_df  <- tibble(
    line  = 1:5,
    data  = c("\\lx bonjour", "\\de hello", "", "\\lx au revoir", "\\de goodbye"),
    code  = c("lx", "de", NA, "lx", "de"),
    value = c("bonjour", "hello", NA, "au revoir", "goodbye")
)

test_file <- system.file("extdata", "mini-french.txt", package = "tidylex")

test_that("can read mini French lexicon", {

    expect_identical(
        read_lexicon(file = test_file),
        check_df[, 1:2]
    )

})

test_that("codes and values are extracted correctly from mini French lexicon", {

    expect_identical(
        read_lexicon(file = test_file, regex = "\\\\([a-z]+)\\s(.*)", into = c("code", "value")),
        check_df
    )

})
