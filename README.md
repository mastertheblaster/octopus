# Install

Get a working version here:
```bash
git clone git@github.com:mastertheblaster/octopus.git
cd octopus
npm install
```

That's it!
```bash
npm start
```

## Alternate approach
```bash
git clone git@github.com:mastertheblaster/octopus.git
cd octopus
npm i -g

octopus cache dir         # Show the temporary cache location
octopus cache list        # List files in a cache
octopus cache clean       # Clean, clean, clean a cache

octopus projects          # List all projects
octopus projects blah     # List projects containing a blah text in description
octopus builds-types      # List all builds
octopus builds-types blah # List all builds containg a blah text in description
```
