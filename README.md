## Install

```bash
git clone git@github.com:mastertheblaster/octopus.git
cd octopus
npm i -g
```

## Use
```bash
octopus --help            # Obvious, show the help

octopus cache dir         # Show the temporary cache location
octopus cache list        # List files in a cache
octopus cache clean       # Clean, clean, clean a cache

octopus projects          # List all projects
octopus projects blah     # List projects containing a blah text in description

octopus builds-types      # List all build types
octopus builds-types blah # List all builds types containg a blah text in description

octopus vcs-roots         # List all VCS urls

octopus report-templates  # Show build template report
```
