#' Read a backslash-coded lexicon file into a tibble
#'
#' @param file either a path to a file, a connection, or literal data
#' @param col_names names for line number and data columns (defaults to "line" and "data")
#' @param ... Further arguments passed to tidyr::extract
#'
#' @import magrittr
#'
#' @export
#'
#' @examples
#' # Demo: Two literal backslash-coded lexemes
#' read_lexicon("\\lx bonjour\n\\de hello\n\n\\lx au revoir\n\\de goodbye")
#'
#' # Demo: Extract backslash code and line value from data
#' read_lexicon("\\lx bonjour\n\\de hello\n\n\\lx au revoir\n\\de goodbye",
#'              regex = "\\\\([a-z]+)\\s(.*)", into = c("code", "value"))
#'
#' # More typical usage (where file path to a lexicon is known):
#' lexicon_file <- system.file("extdata", "mini-french.txt", package = "tidylex")
#' read_lexicon(file = lexicon_file, regex = "\\\\([a-z]+)\\s(.*)", into = c("code", "value"))

read_lexicon <- function(file, col_names = c("line", "data"), remove = FALSE, ...) {
    stopifnot(length(col_names) == 2)

    lx_df <-
        readr::read_lines(file) %>%
        dplyr::tibble(1:length(.), .) %>%
        setNames(col_names)

    if(hasArg(regex) & hasArg(into)) {
        tidyr::extract(lx_df, col = col_names[2], remove, ...)
    } else {
        lx_df
    }
}
