export interface ConfigInterface {
  NODE_ENV: string;
  JWT_SECRET: string;
  PORT: string;
  MONGO_URI: string;

  BLOCKCYPHER_URL: string;
  BLOCKCYPHER_API_VERSION: string;
  BLOCKCYPHER_API_ENV: string;
  BLOCKCYPHER_API_TOKEN: string;

  INFURA_NETWORK: string;
  INFURA_WS: string;
  chainID: number;
  ETHERSCAN_EXPLORER_URL: string;
  ETHERSCAN_API_URL: string;
  ETHERSCAN_API_KEY: string;

  WEBHOOK_CALL_BACK_BASE_URL: string;
}
