# RXD RPC Explorer

[![npm version][npm-ver-img]][npm-ver-url] [![NPM downloads][npm-dl-img]][npm-dl-url]


Simple, database-free Radiant blockchain explorer, via RPC. Built with Node.js, express, bootstrap-v4.

This tool is intended to be a simple, self-hosted explorer for the Bitcoin blockchain, driven by RPC calls to your own bitcoind node. This tool is easy to run but currently lacks features compared to database-backed explorers.

Whatever reasons one might have for running a full node (trustlessness, technical curiosity, supporting the network, etc) it's helpful to appreciate the "fullness" of your node. With this explorer, you can not only explore the blockchain (in the traditional sense of the term "explorer"), but also explore the functional capabilities of your own node.

Live demo available at: [https://explorer.bitcoinunlimited.info](https://explorer.bitcoinunlimited.info)

# Features

* Network Summary "dashboard"
* View details of blocks, transactions, and addresses
* Analysis tools for viewing stats on blocks, transactions, and miner activity
* View JSON content used to generate most pages
* Search by transaction ID, block hash/height, and address
* Optional transaction history for addresses by querying from ElectrumX.
* Mempool summary, with fee, size, and age breakdowns

# Changelog / Release notes

See [CHANGELOG.md](/CHANGELOG.md).

# Getting started

The below instructions are geared toward RXD, but can be adapted easily to other coins.

## Prerequisites

1. Install and run a full, archiving node - [instructions](https://github.com/RadiantBlockchain/radiant-node). Ensure that your Radiant node has full transaction indexing enabled (`txindex=1`) and the RPC server enabled (`server=1`) adding the flags into the radiantd executable.
2. Synchronize your node with the Radiant network.
3. Run rxd-rpc-explorer passing the cookie route based on the defined path to store files download with RXD-Unlimited. (Check cli arguments section)
4. "Recent" version of Node.js (8+ recommended).
5. You could also run an [Electrumx](https://github.com/RadiantBlockchain-Community/electrumx) and configure the explorer to received data from it (optional)
6. You need to use nodejs version 12.9 or higher due to the use of [Promise.allSettled()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/allSettled) method

## Instructions

```bash
npm install -g rxd-rpc-explorer
bch-rpc-explorer
```

If you're running on mainnet with the default datadir and port, this Should Just Work.
Open [http://127.0.0.1:3002/](http://127.0.0.1:3002/) to view the explorer.

You may set configuration options in a `.env` file or using CLI args.
See [configuration](#configuration) for details.

### Configuration

Configuration options may be passed as environment variables
or by creating an env file at `~/.config/rxd-rpc-explorer.env`
or at `.env` in the working directory.
See [.env-sample](.env-sample) for a list of the options and details for formatting `.env`.

You may also pass options as CLI arguments, for example:

```bash
UNIX
rxd-rpc-explorer --port 8080 --bradiantd-port 18443 --bradiantd-cookie ~/.radiant/regtest/.cookie

WINDOWS
rxd-rpc-explorer --bitcoind-cookie C:\your-radiant-path\.cookie
```

See `rxd-rpc-explorer --help` for the full list of CLI options.

## Run via Docker

1. `docker build -t rxd-rpc-explorer .`
2. `docker run -p 3002:3002 -it rxd-rpc-explorer`

[npm-ver-img]: https://img.shields.io/npm/v/bch-rpc-explorer.svg?style=flat
[npm-ver-url]: https://www.npmjs.com/package/bch-rpc-explorer
[npm-dl-img]: http://img.shields.io/npm/dm/bch-rpc-explorer.svg?style=flat
[npm-dl-url]: https://npmcharts.com/compare/bch-rpc-explorer?minimal=true

