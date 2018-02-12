context("read_lexicon")

test_that("can read mini French lexicon", {
    check_df  <- tibble(
        line = 1:5,
        data = c("\\lx bonjour", "\\de hello", "", "\\lx au revoir", "\\de goodbye")
    )
    
    test_file <- system.file("extdata", "mini-french.txt", package = "tidylex")
    
    expect_identical(
        read_lexicon(file = test_file),
        check_df
    )
})
