# Stellar payment watcher
[![Version](https://img.shields.io/npm/v/stellar-payment-watcher.svg)](https://www.npmjs.org/package/stellar-payment-watcher)
[![Build Status](https://api.travis-ci.com/dolcalmi/stellar-payment-watcher.svg?branch=master)](https://travis-ci.com/github/dolcalmi/stellar-payment-watcher)
[![Coverage Status](https://coveralls.io/repos/github/dolcalmi/stellar-payment-watcher/badge.svg?branch=master)](https://coveralls.io/github/dolcalmi/stellar-payment-watcher?branch=master)
[![David](https://img.shields.io/david/dolcalmi/stellar-payment-watcher.svg)](https://david-dm.org/dolcalmi/stellar-payment-watcher)
[![David](https://img.shields.io/david/dev/dolcalmi/stellar-payment-watcher.svg)](https://david-dm.org/dolcalmi/stellar-payment-watcher?type=dev)
[![Try on RunKit](https://badge.runkitcdn.com/stellar-payment-watcher.svg)](https://runkit.com/npm/stellar-payment-watcher)

Stellar payment watcher library for nodejs.

## Installation

Install the package with:

    npm i stellar-payment-watcher

## Usage

### Initialization

``` js
import PaymentWatcher from 'stellar-payment-watcher';

// optional params
const options = {
  allowHttp: false, // Horizon server param
  appName: null, // Horizon server param
  appVersion: null, // Horizon server param
  horizonServerURL: 'https://horizon.stellar.org',
  limit: 100, // amount of transactions to load from given cursor
  reconnectTimeout: 15 * 1000, // Time in milliseconds before restart the watcher
  useTestNet: false, // only required to parse transaction object
}

const watcher = new PaymentWatcher(options);
```
### Watch all payments

Watch all payments using Horizon payments stream.

``` js
// optional params
const options = {
  onmessage: (payment) => console.log(payment),
  onerror: (error) => console.error(error),
}

watcher.start(options);
```

### Watch all payments from cursor

Watch all payments from given cursor and then use  Horizon payments stream.

``` js
// optional params
const options = {
  cursor: '118556627971530752',
  onmessage: (payment) => console.log(payment),
  onerror: (error) => console.error(error),
}

watcher.start(options);
```

### Watch all payments for given accounts

Watch all payments for given accounts using Horizon payments stream.

``` js
// optional params
const options = {
  accounts: ['GCBRK7UAKYJ2MG3NNPGHLW6P7LXM5YHB5G4UZA3YTWJ7PTCH6F4VJDH6', 'GDI47LBSD65TNLLH3R36SKLRTSEM4T7OMCZIHHMN2FEQPVSIBBKUNZMY'],
  onmessage: (payment) => console.log(payment),
  onerror: (error) => console.error(error),
}

watcher.start(options);
```

### Watch all payments for given accounts from cursor

Watch all payments for given accounts using Horizon payments stream.

``` js
// optional params
const options = {
  cursor: '118556627971530752',
  accounts: ['GCBRK7UAKYJ2MG3NNPGHLW6P7LXM5YHB5G4UZA3YTWJ7PTCH6F4VJDH6', 'GDI47LBSD65TNLLH3R36SKLRTSEM4T7OMCZIHHMN2FEQPVSIBBKUNZMY'],
  onmessage: (payment) => console.log(payment),
  onerror: (error) => console.error(error),
}

watcher.start(options);
```
## Development

Run all tests:

```bash
$ npm i
$ npm test
```

Run a single test suite:

```bash
$ npm run mocha -- test/lib/watcher.spec.js
```

Run a single test (case sensitive):

```bash
$ npm run mocha -- test/lib/watcher.spec.js --grep 'allowHttp'
```
<sub><sup>Library based on [Stellar Notifier](https://github.com/orbitlens/stellar-notifier)</sup></sub>
