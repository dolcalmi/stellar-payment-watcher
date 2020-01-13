describe('Stellar Payment Watcher', () => {

  it('Should have valid default values', () => {
    const opts = testUtils.getLibraryInstance().options;
    expect(opts.allowHttp).to.equal(false);
    expect(opts.appName).to.equal(null);
    expect(opts.appVersion).to.equal(null);
    expect(opts.horizonServerURL).to.equal('https://horizon.stellar.org');
    expect(opts.limit).to.equal(100);
    expect(opts.reconnectTimeout).to.equal(15000);
    expect(opts.useTestNet).to.equal(false);
    expect(opts.network).to.equal(StellarSdk.Networks.PUBLIC);
  });

});
