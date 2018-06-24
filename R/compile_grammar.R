#' Compile a Nearley grammar string and return parser and railroad functions
#'
#' @param nearley_string character string of a Nearley grammar or a path to a .ne file
#'
#' @import V8
#' @importFrom readr read_file
#' @importFrom jsonlite fromJSON
#' @importFrom htmlwidgets createWidget
#'
#' @export
#'
#' @examples
#' # 'Hello world' demo:
#' parser <- compile_grammar('sequence -> "x" "y" "z"')
#' parser$parse_str("xyz")
#'
#' # A more complete demo:
#' # 1. Read a lexicon and group lines using zoo:na.locf0()
#'
#' lexicon_df <-
#'       system.file("extdata", "error-french.txt", package = "tidylex") %>%
#'       read_lexicon(regex = "\\\\([a-z]+)", into  = "code") %>%
#'       mutate(lx_start = ifelse(code == "lx", line, NA) %>% zoo::na.locf0())
#'
#' # 2. Define and compile a Nearley grammar to test code sequences
#' headword_parser <-  compile_grammar('
#'    headword -> "lx" "ps" "de" example:?
#'
#'    example -> "xv" "xe"
#' ')
#'
#' # 3. For each 'lx_start' group, test the sequence of codes against grammar
#' lexicon_df %>%
#'     group_by(lx_start) %>%
#'     mutate(code_ok = headword_parser$parse_str(code, return_labels = TRUE))
#'

compile_grammar <- function(nearley_string) {
    stopifnot(is.character(nearley_string))

    nearley_string <- ifelse(grepl(".ne$", nearley_string), read_file(nearley_string), nearley_string)

    # Source Browserified bundle.js to get nearley
    # See /inst/nearley/in.js for original node.js code
    ctx <- v8(global = "window")
    ctx$source(system.file("nearley", "bundle.js", package = "tidylex"))

    ctx$assign("nearley_string", nearley_string)

    # compileGrammar Javascript function defined in inst/nearley/in.js
    ctx$assign("grammar", JS('compileGrammar(nearley_string)'))

    grammar <- ctx$get("grammar")

    if("error" %in% names(grammar)) { stop(grammar$error) }

    htmlFile <- file.path(tempfile(fileext = ".html"))
    writeLines(grammar$railroad_html, htmlFile)
    viewer <- getOption("viewer")

    list(
        view_railroads = function() {
            htmlwidgets::createWidget(
                     name = 'nearley-railroad',
                        x = grammar$railroad_html,
                    width = NULL,
                   height = NULL,
                  package = 'tidylex',
                elementId = NULL
                )
            },
        parse_str  = function(test_array, return_labels = FALSE, labels = c(TRUE, FALSE), skip = c(NA)) {
            # set skippable values as 0-length input for parser
            # by default, we just skip NA values
            test_array[test_array %in% skip] <- ""

            # Set test_array within the v8 Javascript env to input value
            ctx$assign("test_array", test_array)

            # Call parseArray function on the test_array object (within the v8 env)
            # parseArray Javascript function defined in inst/nearley/in.js
            parse_result <- fromJSON(
                txt = ctx$eval(JS('parseArray(test_array, grammar)')),
                simplifyVector = FALSE,
                simplifyMatrix = FALSE,
                simplifyDataFrame = FALSE
            )

            if(!return_labels) {
                # If user wants the parser output (i.e. a list)
                parse_result
            } else {
                # Otherwise, return 'labelled' input, default labels are TRUE and FALSE
                # c("a", "b", ...) -> c(TRUE, TRUE, ...), where TRUE if linear sequence is valid according to the parser
                if(!"error" %in% names(parse_result)) {
                    rep(labels[1], length(test_array))
                } else if(grepl("Incomplete", parse_result$error)) {
                    c(rep(labels[1], length(test_array) - 1), NA)
                } else {
                    c(rep(labels[1], parse_result$index - 1), labels[2], rep(NA, length(test_array) - parse_result$index))
                }
            }
        }
    )
}
