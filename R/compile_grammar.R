#' Compile a Nearley grammar string and return parser function
#'
#' @param nearley_string character string of a Nearley grammar or a path to a .ne file
#'
#' @import V8
#' @importFrom readr read_file
#'
#' @export
#'
#' @examples
#' # 'Hello world' demo:
#' parse_string <- compile_grammar('sequence -> "x" "y" "z"')
#' parse_string("xyz")
#'
#' # A more complete demo:
#' # 1. Read a lexicon and group lines using zoo:na.locf0()
#' lexicon_df <-
#'     system.file("extdata", "error-french.txt", package = "tidylex") %>%
#'     read_lexicon(regex = "\\\\([a-z]+)\\s(.*)", into  = c("code", "value")) %>%
#'     mutate(lx_line = ifelse(code == "lx", line, NA) %>% zoo::na.locf0())
#'
#' # 2. Define and compile a Nearley grammar to test code sequences
#' headword_parser <-  compile_grammar('
#'     headword -> "lx" _ "ps" _ "de" _:? examples:?
#'
#'     examples -> ("xv" _ "xe" _:?):+
#'
#'     _ -> " "
#' ')
#'
#' # 3. Form the code sequence strings and test them against the grammar
#' lexicon_df %>%
#'     filter(!is.na(code)) %>%
#'     group_by(lx_line) %>%
#'     summarise(code_sequence = paste0(code, collapse = " ")) %>%
#'     rowwise() %>%
#'     mutate(parsed_sequence  = headword_parser(code_sequence, stop_on_error = FALSE)) %>%
#'     # Remove successful parse trees (which are lists, and retain only error message strings)
#'     filter(!is.list(parsed_sequence)) %>%
#'     mutate(parsed_sequence = unlist(parsed_sequence))

compile_grammar <- function(nearley_string) {
    stopifnot(is.character(nearley_string))

    nearley_string <- ifelse(grepl(".ne$", nearley_string), read_file(nearley_string), nearley_string)

    # Source Browserified bundle.js to get nearley
    # See /inst/nearley/in.js for original node.js code
    ctx <- v8(global = "window")
    ctx$source(system.file("nearley", "bundle.js", package = "tidylex"))

    ctx$assign("nearley_string", nearley_string)
    ctx$assign("grammar", JS('compileGrammar(nearley_string)'))

    grammar <- ctx$get("grammar")

    if("error" %in% names(grammar)) { stop(grammar$error) }

    function(test_string, stop_on_error = TRUE) {

        stop_or_report <- function(error) {
            if(stop_on_error) {
                stop(error)
            } else {
                return(list(error = error$message))
            }
        }

        ctx$assign("test_string", test_string)
        ctx$assign("parser", JS('new nearley.Parser(nearley.Grammar.fromCompiled(grammar), { keepHistory: true })'))

        parse_result <- tryCatch({
            ctx$eval(JS('parser.feed(test_string)'))
        },
            error = stop_or_report
        )

        if("error" %in% names(parse_result)) {
            parse_result # This will be an error message returned from tryCatch code
        } else {
            parse_tree <- ctx$get("parser.results")

            if(length(parse_tree) == 0) {
                stop_or_report(list(message = paste0("Error: Parse incomplete, expecting more text at end of string: '", test_string, "'")))
            } else {
                parse_tree
            }
        }

    }
}
