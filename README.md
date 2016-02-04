# Install

Get a working version here:
```bash
git clone git@github.com:mastertheblaster/octopus.git
cd octopus
npm install
```

Open the index.js file and change the TeamCity url:
```js
let ciClient = ci.client({
  host: 'http://myserver:212323',
  auth: ciCreds
});
```

That's it!
```bash
npm start
```
