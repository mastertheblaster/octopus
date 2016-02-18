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

    cache [command]               Cache manipulation
    projects [options]            List all projects
    builds [options]              List all the builds
    repos [options]               List all repos (vcs-roots)
    report:builds [options]       Show build summary report
    report:repos [options]        Show repository summary report
    analyze [options] <template>  Show analytics for a given build type (template)

  Tool for querying TeamCity (CI) and GITHUB

  Options:

    -h, --help     output usage information
    -V, --version  output the version number
```

### Cache
```bash
octopus cache       # List files inside a cache directory
octopus cache dir   # Show path of a cache directory
octopus cache clean # Clean the cache directory
```

### Samples
Get build statics in CSV format
```bash
octopus report:builds -f csv -a templateId,count
```
Analyze the packages and print out response in CSV format 
```bash
octopus analyze TEMPLATE_ID -f csv -a projectName,name,repo.url,repo.isOnGitHub,repo.downloaded,repo.scripts.build,repo.scripts.release,repo.scripts.test,repo.scripts.start > result.csv
```
