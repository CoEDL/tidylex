#' Add a new variable based on some condition and group rows based on the new variable
#'
#' @param data a data frame
#' @param name the name of the new variable to be created
#' @param where the condition in which the new variable should have a value (NA otherwise)
#' @param value an expression for the content of the new variable when the condition is true
#' @param add when `add = TRUE` (default), the new variable will add to existing groups. Set to `FALSE` to override all existing groups (passed to `dplyr::group_by`)
#'
#' @import dplyr
#' @import rlang
#' @importFrom magrittr "%>%"
#' @importFrom zoo na.locf0
#'
#' @export
#'
#' @examples
#' lexicon_str <-
#' '\\lx bureau
#' \\sn 1
#' \\de desk
#' \\sn 2
#' \\de office
#'
#' \\lx langue
#' \\sn 1
#' \\de language
#' \\sn 2
#' \\de tongue
#' '
#'
#' read_lexicon(file = lexicon_str, regex = "\\\\?([a-z]*)\\s?(.*)", into = c("code", "value")) %>%
#'     add_group_col(name = lx_group, where = code == "lx", value = paste0(line, ": ", value)) %>%
#'     add_group_col(name = sense_no, where = code == "sn", value = value)
#'

add_group_col <- function(data, name, where, value, add = TRUE) {
    quo(data %>%
            mutate(
                !!quo_name(enquo(name)) := ifelse(!!enquo(where), !!enquo(value), NA) %>%
                    na.locf0()
            ) %>%
            group_by(!!enquo(name), add = add)
    ) %>%
    eval_tidy()
}
