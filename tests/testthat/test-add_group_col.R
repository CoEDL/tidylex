context("add_group_col")

lexicon_df <-
    tibble(
        code  = c("lx", "sn", "de", "sn", "de",
                  "",
                  "lx", "sn", "de", "sn", "de"),
        value = c("bureau", "1", "desk", "2", "office",
                  "",
                  "langue", "1", "language", "2", "tongue")
    )

grouped_lxdf <- lexicon_df %>%
    add_group_col(name = lx_group, where = code == "lx", value = value) %>%
    add_group_col(name = sense_group, where = code == "sn", value = value)

test_that("function result is a grouped_df", {

    expect_true(is_grouped_df(grouped_lxdf))

    # 2 lexemes x "3" senses (NA, 1, 2)
    expect_equal(n_groups(grouped_lxdf), 2 * 3)

})

test_that("added group columns were filled appropriately", {

    lexicon_df %>%
    bind_cols(
        list(
            lx_group    = c(rep("bureau", 6), rep("langue", 5)),
            sense_group = c(c(NA, rep("1", 2), rep("2", 3)), c(NA, rep("1", 2), rep("2", 2)))
        )
    ) %>%
    group_by(lx_group, sense_group) %>%
    expect_equal(grouped_lxdf)

})
