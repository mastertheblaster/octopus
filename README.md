## Install

```bash
git clone git@github.com:mastertheblaster/octopus.git
cd octopus
npm i -g
```

## Use
```bash

  Usage: octopus [options] [command]


  Commands:

    cache [command]                       Cache manipulation
    projects [query]                      List the projects on CI
    builds [query]                        List all build types on CI
    repos [query]                         List all repos (vcs-roots) on CI
    report:builds                         Show build summary report
    report:repos                          Show repository summary report
    report:repos-for-template [template]  Show repositories of given build template
    report:package [template]             Show report on package.json for a given build type

  Tool for querying TeamCity (CI) and GITHUB

  Options:

    -h, --help     output usage information
    -V, --version  output the version number
```
