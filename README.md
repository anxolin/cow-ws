# Run
```bash
yarn
yarn start
```

Visit:
* http://localhost:3000


# Config
You can specify the environment between development or production. This mainly choose which API endpoint to use (`production` by default):

```bash
NODE_ENV=development yarn start
```

Additionally, you can provide the network among one of these ones: `mainnet` (default), `goerli`, `xdai`.

```bash
NETWORK=goerli yarn start
```

