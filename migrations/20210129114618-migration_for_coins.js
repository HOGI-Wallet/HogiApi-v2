// eslint-disable-next-line @typescript-eslint/no-var-requires
const DefaultCoinMigration = require('./json-migrations/default-coin-migration');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { getPriceFromBC, erc20NetworkFee } = require('./apis/api');

module.exports = {
  async up(db, client) {
    let result;
    for (const coin of DefaultCoinMigration) {
      if (coin.isErc20 || coin.coinSymbol.toLowerCase() === 'eth') {
        result = await erc20NetworkFee();
      } else {
        result = await getPriceFromBC(coin.coinSymbol.toLowerCase());
      }
      await db.collection('coinentities').update(
        { coinSymbol: coin.coinSymbol },
        {
          networkFeeMin: result.networkFeeMin,
          networkFeeMax: result.networkFeeMax,
          networkFeeAverage: result.networkFeeAvg,
          coinSymbol: coin.coinSymbol,
          name: coin.name,
          blockchain: coin.blockchain,
          masterWallet: coin.masterWallet,
          isErc20: coin.isErc20,
          contractAddress: coin.contractAddress,
          contractAbi: coin.contractAbi,
          coingeckoId: coin.coingeckoId,
        },
        {
          new: true,
          upsert: true,
        },
      );
    }
  },

  async down(db, client) {
    await db.collection('coinentities').remove();
  },
};
