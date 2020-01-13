import BigNumber from 'bignumber.js';
import StellarSdk from 'stellar-sdk';
import Debugger from 'debug';
import { parseTransaction, parsePayment } from './parser.js';

const debug = Debugger('watcher:info');
const error = Debugger('watcher:error');
const HORIZON_SERVER_URL = 'https://horizon.stellar.org';

/**
* Tracks payments using event streaming from Horizon server
* @constructor
* @param {string} horizonServerURL Horizon Server URL, default:`https://horizon.stellar.org`.
* @param {object} [opts] Options object
* @param {boolean} [opts.allowHttp] - Allow connecting to http servers, default: `false`.
* @param {string} [opts.appName] - Allow set custom header `X-App-Name`, default: `null`.
* @param {string} [opts.appVersion] - Allow set custom header `X-App-Version`, default: `null`.
*/
export default class Watcher {

  constructor(opts = {}) {
    this.options = Object.assign({
      allowHttp: false,
      appName: null,
      appVersion: null,
      horizonServerURL: HORIZON_SERVER_URL,
      limit: 100,
      network: StellarSdk.Networks.PUBLIC,
      reconnectTimeout: 15 * 1000,
      useTestNet: false,
    }, opts)
    this.server = new StellarSdk.Server(this.options.horizonServerURL);
    this.queue = [];
    this.processing = false;
    this.restartTimeout = null;
    this.watcherOptions = {
      cursor: '0',
      accounts: [],
      onmessage: (payment) => debug(payment),
      onerror: (error) => error(error),
    };

    if (this.options.useTestNet) {
      this.options.network = StellarSdk.Networks.TESTNET;
    }

    this.options.limit = this.options.limit > 200 ? 200 : this.options.limit;

    debug('initialize watcher with %o', this.options);
  }

  /**
  * start - Start watching for payments
  *
  * @param {object} [options] EventSource options.
  * @param {string} [options.cursor] Cursor to beging to load previous payments, default: `0`
  * @param {array} [options.accounts] Array of accounts public keys, if not set will track all payments
  * @param {function} [options.onmessage] Callback function to handle incoming messages.
  * @param {function} [options.onerror] Callback function to handle errors.
  */
  start(options = { }) {
    Object.assign(this.watcherOptions, options)

    if (this.closeStream) return;

    // debug('start watching payments');
    // clear restart timeout if it exists
    clearTimeout(this.restartTimeout);

    const isGreaterThan = new BigNumber(this.cursor || '0')
    .isGreaterThan(new BigNumber(options.cursor || '0'));

    this.cursor = isGreaterThan ? this.cursor : options.cursor;
    this._trackPayments();
  }

  /**
  * Terminates watching stream
  */
  stop() {
    debug('stopping watcher');
    if (this.closeStream) {
      this.closeStream();
      this.closeStream = null;
    }

    // clear restart timeout if it exists
    clearTimeout(this.restartTimeout);
  }

  /**
  * Terminates watching stream and watch again after reconnect timeout
  */
  _restart() {
    this.stop();
    debug(`restarting watcher in ${this.options.reconnectTimeout}ms`);
    this.restartTimeout = setTimeout(() => {
      this.start();
    }, this.options.reconnectTimeout);
  }

  _trackPayments() {
    if (!this.cursor || this.cursor === '0') {
      this._trackLiveStream();
      return;
    }

    debug('Loading payments from cursor %s', this.cursor);
    const { accounts } = this.watcherOptions;
    let transactions = this.server.transactions();
    if (accounts && accounts.length === 1) {
      debug('with account %s', accounts[0]);
      transactions = transactions.forAccount(accounts[0]);
    }

    // check previously set cursor
    transactions
    .cursor(this.cursor)
    .order('asc')
    .limit(this.options.limit)
    .call()
    .then((transactions) => {
      if (!transactions.records || !transactions.records.length) {
        this._trackLiveStream();
        return;
      }
      this._enqueue(transactions.records);
      setImmediate(() => this.start());
    })
    .catch((err) => {
      error(err);
      this._restart();
    });
  }

  /**
  * Track live transactions stream from the Horizon server
  */
  _trackLiveStream() {
    debug('subscribing to payments live stream');
    const { accounts } = this.watcherOptions;
    let transactions = this.server.transactions();
    if (accounts && accounts.length === 1) {
      debug('with account %s', accounts[0]);
      transactions = transactions.forAccount(accounts[0]);
    }

    // subscribe to transactions live stream
    this.closeStream = transactions
      .order('asc')
      .cursor('now')
      .stream({
        reconnectTimeout: this.options.reconnectTimeout,
        onmessage: (rawTx) => {
          // debug(`transaction received from horizon ${rawTx.hash}`);
          this._enqueue([rawTx]);
        },
        onerror: (err) => {
          if (this.watcherOptions.onerror) {
            this.watcherOptions.onerror(err);
          }
          this._restart();
        },
      });
  }

  /**
  * Add transactions to the processing queue
  * @param {Array<Payment>}transactions
  */
  _enqueue(transactions) {
    if (!transactions || !transactions.length) return;
    Array.prototype.push.apply(this.queue, transactions);
    this._processQueue();
  }

  /**
  * Pick the entry from the queue and process it
  */
  _processQueue() {
    if (!this.queue.length || this.processing) return;
    this.processing = true;
    const transaction = this.queue.pop();
    const payments = parseTransaction(transaction, this.options.network);

    if (payments && payments.length > 0) {
      const { accounts, onmessage } = this.watcherOptions;
      let isValidAccount = () => true;
      if (accounts && accounts.length > 0) {
        isValidAccount = (account) => accounts.includes(account);
      }

      payments.forEach((payment) => {
        const p = parsePayment(payment);
        if (p && onmessage && isValidAccount(p.to)) {
          onmessage(p);
        }
      });
    }

    const count = transaction.operations.length;
    this.cursor = new BigNumber(transaction.paging_token).plus(count - 1).toString();
    this.processing = false;
    setImmediate(() => this._processQueue());
  }
}
