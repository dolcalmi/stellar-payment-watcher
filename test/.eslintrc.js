module.exports = {
  env: {
    mocha: true
  },
  globals: {
    StellarPaymentWatcher: true,
    StellarSdk: true,
    axios: true,
    chai: true,
    expect: true
  },
  rules: {
    'no-unused-vars': 0
  },
  parserOptions: {
    ecmaVersion: 2017
  }
};
