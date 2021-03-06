#' Read a backslash-coded lexicon file into a tibble
#'
#' @param file either a path to a file, a connection, or literal data
#' @param col_names names for line number and data columns (defaults to "line" and "data")
#' @param remove Whether tidyr::extract should remove the "data" column
#' @param ... Further arguments passed to tidyr::extract
#'
#' @import dplyr
#' @importFrom readr read_lines
#' @importFrom tidyr extract
#' @importFrom magrittr "%>%"
#' @importFrom stats setNames
#' @importFrom methods hasArg
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
        read_lines(file) %>%
        tibble(1:length(.), .) %>%
        setNames(col_names)

    if(hasArg(regex) & hasArg(into)) {
        extract(lx_df, col = col_names[2], remove, ...)
    } else {
        lx_df
    }
}

## quiets concerns of R CMD check re: the .'s that appear in pipelines
## See Jenny Bryan's solution https://github.com/STAT545-UBC/Discussion/issues/451#issuecomment-264598618
if(getRversion() >= "2.15.1")  utils::globalVariables(c(".", "regex", "into"))
