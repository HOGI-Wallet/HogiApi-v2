// eslint-disable-next-line @typescript-eslint/no-var-requires
const DefaultCurrenciesMigration = require('./json-migrations/default-currencies-migration');

module.exports = {
  async up(db, client) {
    for (const currency of DefaultCurrenciesMigration) {
      await db
        .collection('currencyentities')
        .update({ code: currency.code }, currency, {
          new: true,
          upsert: true,
        });
    }
  },

  async down(db, client) {
    await db.collection('currencyentities').remove();
  },
};
