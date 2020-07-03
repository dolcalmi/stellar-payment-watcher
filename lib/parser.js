import { Transaction } from 'stellar-base';
import BigNumber from 'bignumber.js';
import Debugger from 'debug';
const error = Debugger('watcher:parser:error');

/**
* Retrieve an object with unified parameter names from operation.
* @param {StellarBase.Operation} operation
* @returns {*}
*/
function normalizeOperation(operation) {
  switch (operation.type) {
    case 'payment':
      return {
        to: operation.destination,
        asset_code: operation.asset.code,
        asset_issuer: operation.asset.issuer,
        amount: operation.amount,
      };
    case 'pathPayment':
    case 'path_payment_strict_receive':
    case 'path_payment_strict_send':
      return {
        to: operation.destination,
        asset_code: operation.destAsset.code,
        asset_issuer: operation.destAsset.issuer,
        amount: operation.destAmount,
      };
    default:
      return null;
  }
}

function processOperation(operation, txDetails, applicationOrder) {
  const normalized = normalizeOperation(operation, txDetails.source);
  if (normalized) {
    // assign operation generic ID
    // see https://github.com/stellar/go/blob/6a367049e8f9ad52798f5c8f69df8b875fde4a1a/services/horizon/internal/toid/main.go
    normalized.id = new BigNumber(txDetails.paging_token)
      .plus(new BigNumber(applicationOrder + 1)).toString();
    normalized.from = operation.source || txDetails.source;
    normalized.transaction_hash = txDetails.hash;
    normalized.memo = txDetails.memo;
    normalized.created_at = txDetails.created_at;

    return normalized;
  }
  return null;
}

/**
* Normalize transaction memo
* @param {StellarBase.Memo} rawMemo - raw XDR memo
* @returns {*}
*/
function processMemo(rawMemo) {
  switch (rawMemo._type) {
    case 'id':
    case 'text':
      return rawMemo._value.toString('UTF-8');
    case 'hash':
    case 'return':
      return rawMemo._value.toString('base64');
    default:
      return '';
  }
}

/**
* Retrieve extended information from transaction object.
* @param {StellarBase.Transaction} transaction
* @returns {Object}
*/
export const parseTransaction = (transaction, network) => {
  let xdrTx;
  try {
    xdrTx = new Transaction(transaction.envelope_xdr, network);
  } catch (e) {
    error(e);
    error(`Tx envelope: ${transaction.envelope_xdr}`);
    return null;
  }

  const txDetails = {
    hash: transaction.hash,
    source: xdrTx.source,
    paging_token: transaction.paging_token,
    memo: processMemo(xdrTx.memo),
    created_at: transaction.created_at,
  };

  return xdrTx.operations.map((op, i) => processOperation(op, txDetails, i)).filter(Boolean);
}

export const parsePayment = (payment) => {
  if (payment) {
    return {
      id: payment.id,
      from: payment.from,
      to: payment.to,
      amount: payment.amount,
      asset_code: payment.asset_code,
      asset_issuer: payment.asset_issuer,
      memo: payment.memo || '',
      transaction_hash: payment.transaction_hash || '',
      created_at: payment.created_at,
    };
  }
  return null;
}
