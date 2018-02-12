
<!-- README.md is generated from README.Rmd. Please edit that file -->
tidylex
=======

The goal of tidylex is to help foster collaboration between programmers and lexicographers who are interested in cleaning/transforming dictionary data stored as Toolbox-style backslash-coded data (example taken from NLTK's [`rotokas.dic`](https://github.com/nltk/nltk/blob/8eb3803cb88a6e75d18d4f740678b218b3d8f4fd/nltk/toolbox.py#L154)):

    \lx kaa
    \ps V.A
    \ge gag
    \gp nek i pas

    \lx kaa
    \ps V.B
    \ge strangle
    \gp pasim nek

We follow David Robinson's educational philosophy of "<a href="http://varianceexplained.org/r/teach-tidyverse/#get-students-doing-powerful-things-quickly" target="_blank">Get students doing powerful things quickly</a>" and provide a set of convenience functions and accompanying walkthroughs to help teams get started *quickly* on processing their dictionary data within the [tidyverse](https://www.tidyverse.org/) framework.

Why is tidylex needed?
----------------------

-   Toolbox-style files are commonly used in description of under-resourced languages
-   Almost always hand-edited, so have lots of inconsistencies, so data must be cleaned
-   We introduce a step-by-step walkthrough on using modern data engineering tools to clean and maintain cleanliness of lexicon file
-   Stepping stone for
    -   programmers for working with lexicographical data
    -   lexicographers for working with Git(Hub)/Travis CI, etc.

Installation
------------

You can install tidylex from github with:

``` r
# install.packages("devtools")
devtools::install_github("CoEDL/tidylex")
```

Example
-------

### Verify all headwords are unique

Suppose you require that all headwords (`\lx` items) be unique, and all homographs be explicitly marked (e.g. `\lx kaa#1`, `\lx kaa#2`). The example below shows how we can read a lexicon file, keeping only the `lx` lines (using the `filter` command), and create a tally for the various values of the `lx` field (notice `\lx kaa` occurs twice).

``` r
library(tidylex)

lexicon <-
'\\lx kaa
\\ps V.A
\\ge gag
\\gp nek i pas

\\lx kaa
\\ps V.B
\\ge strangle
\\gp pasim nek'

read_lexicon(file  = lexicon,
             regex = "\\\\([a-z]+)\\s(.*)",
             into  = c("code", "value")) %>%
    filter(code == "lx") %>%
    group_by(value) %>% 
    tally()
#> # A tibble: 1 x 2
#>   value     n
#>   <chr> <int>
#> 1 kaa       2
```
