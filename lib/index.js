import BigNumber from 'bignumber.js';
import Debugger from 'debug'
// import stellarHorizon from './stellar-connector';
// import parseTransaction from './parse-transaction';

const log = Debugger('StellarPaymentWatcher:watcher');

/**
* Tracks payments using event streaming from Horizon server
*/
export default class PaymentWatcher {
  constructor(config) {
    log(config)
    console.log(config);
  }
}
