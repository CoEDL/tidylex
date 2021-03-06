
<!-- README.md is generated from README.Rmd. Please edit that file -->

# tidylex <img src="man/figures/tidylex-logo.png" align="right" />

[![Travis-CI Build
Status](https://travis-ci.org/CoEDL/tidylex.svg?branch=master)](https://travis-ci.org/CoEDL/tidylex)
[![CRAN\_Status\_Badge](http://www.r-pkg.org/badges/version/tidylex)](https://cran.r-project.org/package=tidylex)
[![Coverage
Status](https://img.shields.io/codecov/c/github/CoEDL/tidylex/master.svg)](https://codecov.io/github/CoEDL/tidylex?branch=master)

## Overview

The purpose of tidylex is to provide a collaborative, open-source,
cross-platform tool for tidying dictionary data stored as Toolbox-style
backslash-coded data (a broad convention for serializing lexicographic
data in a human-readable and -editable manner). This format is commonly
used in the description of under-documented languages, many of which are
also highly endangered.

The example below shows a toy French-to-English dictionary with 3
entries *rouge*, *bonjour*, and *parler* with various lexicographic
information about these 3 entries (`lx`: lexeme, `ps`: part of speech,
`de`: definition, `xv`: example, vernacular in source language, `xe`:
translation, English). Tidylex makes it easy to make assertions of how
these entries *should* be structured, test whether or not they are
well-structured ([examples](#examples) provided below), and, most
importantly, communicate the results of these tests with relevant
parties.

<pre style="background:#f1f1f1">
<span class="bscode">\lx</span> <span class="bsval">rouge</span>
<span class="bscode">\ps</span> <span class="bsval">adjective</span>
<span class="bscode">\de</span> <span class="bsval">red</span>
<span class="bscode">\xv</span> <span class="bsval">La chaise est rouge</span>
<span class="bscode">\xe</span> <span class="bsval">The chair is red</span>

<span class="bscode">\lx</span> <span class="bsval">bonjour</span>
<span class="bscode">\de</span> <span class="bsval">hello</span>
<span class="bscode">\ps</span> <span class="bsval">exclamation</span>

<span class="bscode">\lx</span> <span class="bsval">parler</span>
<span class="bscode">\ps</span> <span class="bsval">verb</span>
<span class="bscode">\de</span> <span class="bsval">speak</span>
<span class="bscode">\xv</span> <span class="bsval">Parlez-vous français?</span>
</pre>

## Why is tidylex needed?

Owing to the dictionary data having been hand-edited over many years,
often by multiple contributors, there is often a lot of structural
inconsistency in these plain-text files. Given the structural variation,
the knowledge about these languages are effectively ‘locked up’ in terms
of machine-processability. Tidylex provides a set of functions to
iteratively work towards a well-structured, or ‘tidy’, lexicon, and
maintain the tidiness of the lexicon when used within a Continuous
Testing setting (e.g. with Travis CI, or GitLab pipelines).

## Installation

You can install tidylex from github with:

``` r
# install.packages("devtools")
devtools::install_github("CoEDL/tidylex")
```

## Examples

### Read a lexicon line-by-line into a data frame

As there is project-to-project variation in coding convention (for
`\lx`, some others use `\me` for main entry, or ‘`.`’ in place of
backslashes, e.g. `.i bonjour`), the `read_lexicon` function provides a
quick way to specify a regular expression to parse each line in the
dictionary into its various components.

``` r
library(tidylex)

# The path to the 'rouge, bonjour, parler' dictionary shown in the example above
lexicon_file <- system.file("extdata", "error-french.txt", package = "tidylex")

lexicon_df  <- read_lexicon(
    file  = lexicon_file,
    regex = "\\\\?([a-z]*)\\s?(.*)",   # Note two capture groups, in parentheses
    into  = c("code", "value")         # Captured data placed, respectively, in 'code' and 'value' columns
)

lexicon_df
#> # A tibble: 14 x 4
#>     line data                         code  value                
#>    <int> <chr>                        <chr> <chr>                
#>  1     1 "\\lx rouge"                 lx    rouge                
#>  2     2 "\\ps adjective"             ps    adjective            
#>  3     3 "\\de red"                   de    red                  
#>  4     4 "\\xv La chaise est rouge"   xv    La chaise est rouge  
#>  5     5 "\\xe The chair is red"      xe    The chair is red     
#>  6     6 ""                           ""    ""                   
#>  7     7 "\\lx bonjour"               lx    bonjour              
#>  8     8 "\\de hello"                 de    hello                
#>  9     9 "\\ps exclamation"           ps    exclamation          
#> 10    10 ""                           ""    ""                   
#> 11    11 "\\lx parler"                lx    parler               
#> 12    12 "\\ps verb"                  ps    verb                 
#> 13    13 "\\de speak"                 de    speak                
#> 14    14 "\\xv Parlez-vous français?" xv    Parlez-vous français?
```

### Assign groups to rows based on properties of the rows

A common pre-processing routine that must be done is to group the lines
into various subgroups, e.g. within some given entry, or within some
given sense of the entry, etc. We can easily do this with the
`add_group_col` function.

``` r
grouped_lxdf <-
    lexicon_df %>%
    add_group_col(
        name  = lx_group,                 # Name of the new grouping column
        where = code == "lx",             # When to fill with a value, i.e. when *not* to inherit value
        value = paste0(line, ": ", value) # What the value should be when above condition is true
    )

grouped_lxdf
#> # A tibble: 14 x 5
#> # Groups:   lx_group [3]
#>     line data                         code  value                 lx_group
#>    <int> <chr>                        <chr> <chr>                 <chr>   
#>  1     1 "\\lx rouge"                 lx    rouge                 1: rouge
#>  2     2 "\\ps adjective"             ps    adjective             1: rouge
#>  3     3 "\\de red"                   de    red                   1: rouge
#>  4     4 "\\xv La chaise est rouge"   xv    La chaise est rouge   1: rouge
#>  5     5 "\\xe The chair is red"      xe    The chair is red      1: rouge
#>  6     6 ""                           ""    ""                    1: rouge
#>  7     7 "\\lx bonjour"               lx    bonjour               7: bonj…
#>  8     8 "\\de hello"                 de    hello                 7: bonj…
#>  9     9 "\\ps exclamation"           ps    exclamation           7: bonj…
#> 10    10 ""                           ""    ""                    7: bonj…
#> 11    11 "\\lx parler"                lx    parler                11: par…
#> 12    12 "\\ps verb"                  ps    verb                  11: par…
#> 13    13 "\\de speak"                 de    speak                 11: par…
#> 14    14 "\\xv Parlez-vous français?" xv    Parlez-vous français? 11: par…
```

### Formally define a well-formed entry and test entries against definition

Tidylex lets you define and use basic [Nearley](https://nearley.js.org/)
grammars within R to test for well-formedness of strings
\[[1](#nearley)\]. We begin by forming a set of strings to test. In the
example below, we simple concatenate all the codes within the 3 entry
groups into a single string:

``` r
entry_strs <-
    grouped_lxdf %>%
    summarise(code_sequence = paste0(code, collapse = " "))

entry_strs
#> # A tibble: 3 x 2
#>   lx_group   code_sequence    
#>   <chr>      <chr>            
#> 1 1: rouge   "lx ps de xv xe "
#> 2 11: parler lx ps de xv      
#> 3 7: bonjour "lx de ps "
```

For such sequences above, we can define a context-free grammar
(equivalent to phrase structure rules) within the Nearley notation below
(`:?`, `:+` are quantifiers indicating, respectively, ‘zero or one’ and
‘one or more’ of the preceding entity). We use the `compile_grammar`
function to generate code that can be used to test strings as to whether
or not they are well-formed.

``` r
entry_parser <-  compile_grammar('
    headword -> "lx" _ "ps" _ "de" _ examples:?

    examples -> ("xv" _ "xe" _):+

    _ -> " "
')

parsed_entries <-
    entry_strs %>%
    rowwise() %>%
    mutate(parsed_sequence = entry_parser(code_sequence, stop_on_error = FALSE))

# Remove successful parse trees (which are lists, and retain only error message strings)
parsed_entries %>% 
    filter(!is.list(parsed_sequence)) %>%
    mutate(parsed_sequence = unlist(parsed_sequence))
#> Source: local data frame [2 x 3]
#> Groups: <by row>
#> 
#> # A tibble: 2 x 3
#>   lx_group   code_sequence parsed_sequence                                
#>   <chr>      <chr>         <chr>                                          
#> 1 11: parler lx ps de xv   Error: Parse incomplete, expecting more text a…
#> 2 7: bonjour "lx de ps "   "Error: invalid syntax at line 1 col 4:\n\n  l…
```

As we can see from the errors, the *parler* entry is missing an
obligatory `xe` (English translation) for the `xv` code, while the
*bonjour* entry is invalid because the `de` and `ps` codes have been
reversed (relative to the order required by the grammar above `headword
-> "lx" _ "ps" _ "de" ...`).

<hr>

<b>Footnotes</b>

1.  <a name="nearley"></a> At the moment tidylex can’t work with *all*
    Nearley grammars since the R V8 package which uses an older version
    of the V8 engine for cross-compatibility requirements. So, Nearley
    grammars that make use of ES6 features won’t compile in V8 3.14.
