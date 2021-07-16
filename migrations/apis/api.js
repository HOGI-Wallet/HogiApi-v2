// eslint-disable-next-line @typescript-eslint/no-var-requires
const axios = require('axios');
// eslint-disable-next-line @typescript-eslint/no-var-requires
require('dotenv').config();

const getEthereumNetworkPrices = async () => {
  const response = await axios.get(
    'https://ethgasstation.info/json/ethgasAPI.json',
  );
  const prices = {
    low: response.data.safeLow / 10,
    medium: response.data.average / 10,
    high: response.data.fast / 10,
  };
  return prices;
};

const erc20NetworkFee = async () => {
  const gasPrices = await getEthereumNetworkPrices();

  const networkFeeMin = parseFloat(((21000 * gasPrices.low) / 1e9).toFixed(8));
  const networkFeeAvg = parseFloat(
    ((21000 * gasPrices.medium) / 1e9).toFixed(8),
  );
  const networkFeeMax = parseFloat(((21000 * gasPrices.high) / 1e9).toFixed(8));

  return { networkFeeMin, networkFeeMax, networkFeeAvg };
};

/**
 * if the coin is not erc20, the we have to h=get prices from blockcypher
 * @param coin
 */
const getPriceFromBC = async (coin) => {
  const url = buildApiUrl(coin, '');
  const response = await axios.get(url);
  if (response && response.data) {
    const data = response.data;
    const appendZeros = Math.pow(10, 8);
    const networkFeeMin = data.low_fee_per_kb / appendZeros;
    const networkFeeAvg = data.medium_fee_per_kb / appendZeros;
    const networkFeeMax = data.high_fee_per_kb / appendZeros;
    return { networkFeeAvg, networkFeeMax, networkFeeMin };
  }
};

const buildApiUrl = (coin, endpoint) => {
  const url =
    process.env.BLOCKCYPHER_URL +
    '/' +
    process.env.BLOCKCYPHER_API_VERSION +
    '/' +
    coin +
    '/' +
    process.env.BLOCKCYPHER_API_ENV +
    '/' +
    endpoint +
    '?token=' +
    process.env.BLOCKCYPHER_API_TOKEN;
  return url;
};

module.exports = {
  buildApiUrl,
  erc20NetworkFee,
  getEthereumNetworkPrices,
  getPriceFromBC,
};
