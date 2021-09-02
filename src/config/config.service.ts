import * as dotenv from 'dotenv';
import * as Joi from '@hapi/joi';
import { ConfigInterface } from './interfaces/config.interface';

export class ConfigService {
  private readonly envConfig: ConfigInterface;

  constructor() {
    dotenv.config();
    const config: { [name: string]: string } = process.env;
    const parsedConfig = JSON.parse(JSON.stringify(config));
    this.envConfig = this.validateInput(parsedConfig);
  }

  /**
   * Ensures all needed variables are set, and returns the validated JavaScript object
   * including the applied default values.
   */
  private validateInput = (envConfig): ConfigInterface => {
    const envVarsSchema: Joi.ObjectSchema = Joi.object({
      NODE_ENV: Joi.string()
        .required()
        .valid(
          'development',
          'production',
          'staging',
          'provision',
          'inspection',
        )
        .default('development'),
      PORT: Joi.number().required(),
      MONGO_URI: Joi.string().required(),
      JWT_SECRET: Joi.string().required(),

      BLOCKCYPHER_URL: Joi.string().required(),
      BLOCKCYPHER_API_VERSION: Joi.string().required(),
      BLOCKCYPHER_API_ENV: Joi.string().required(),
      BLOCKCYPHER_API_TOKEN: Joi.string().required(),

      INFURA_NETWORK: Joi.string().required(),
      INFURA_WS: Joi.string().required(),
      chainID: Joi.number().required(),
      ETHERSCAN_EXPLORER_URL: Joi.string().required(),
      ETHERSCAN_API_URL: Joi.string().required(),
      ETHERSCAN_API_KEY: Joi.string().required(),

      BSCSCAN_EXPLORER_URL: Joi.string().required(),
      BSCSCAN_API_URL: Joi.string().required(),
      BSCSCAN_API_KEY: Joi.string().required(),

      WEBHOOK_CALL_BACK_BASE_URL: Joi.string().required(),

      AWS_ACCESS_KEY: Joi.string().required(),
      AWS_SECRET_KEY: Joi.string().required(),
      AWS_BUCKET: Joi.string().required(),
      AWS_REGION: Joi.string().required(),
    });

    const { error, value: validatedEnvConfig } = envVarsSchema.validate(
      envConfig,
      {
        abortEarly: false,
        allowUnknown: true,
      },
    );
    if (error) {
      throw new Error(`Config validation error: ${error.message}`);
    }
    return validatedEnvConfig;
  };

  get nodeEnv(): string {
    return this.envConfig.NODE_ENV;
  }

  get port(): string {
    return this.envConfig.PORT;
  }

  get jwtSecret(): string {
    return this.envConfig.JWT_SECRET;
  }

  get mongoUri(): string {
    return this.envConfig.MONGO_URI;
  }

  get blockCypherUrl(): string {
    return this.envConfig.BLOCKCYPHER_URL;
  }

  get blockCypherApiEnv(): string {
    return this.envConfig.BLOCKCYPHER_API_ENV;
  }

  get blockCypherApiVersion(): string {
    return this.envConfig.BLOCKCYPHER_API_VERSION;
  }

  get infuraNetwork(): string {
    return this.envConfig.INFURA_NETWORK;
  }
  get infuraWS(): string {
    return this.envConfig.INFURA_WS;
  }

  get chainId(): number {
    return this.envConfig.chainID;
  }
  get etherScanApiUrl(): string {
    return this.envConfig.ETHERSCAN_API_URL;
  }

  get etherScanApiKey(): string {
    return this.envConfig.ETHERSCAN_API_KEY;
  }

  get etherScanExplorerUrl(): string {
    return this.envConfig.ETHERSCAN_EXPLORER_URL;
  }

  get bscScanApiUrl(): string {
    return this.envConfig.BSCSCAN_API_URL;
  }

  get bscScanApiKey(): string {
    return this.envConfig.BSCSCAN_API_KEY;
  }

  get bscScanExplorerUrl(): string {
    return this.envConfig.BSCSCAN_EXPLORER_URL;
  }

  get webhookCallbackBaseUrl(): string {
    return this.envConfig.WEBHOOK_CALL_BACK_BASE_URL;
  }

  get awsAccessKey(): string {
    return this.envConfig.AWS_ACCESS_KEY;
  }

  get awsSeceretKey(): string {
    return this.envConfig.AWS_SECRET_KEY;
  }

  get awsRegion(): string {
    return this.envConfig.AWS_REGION;
  }

  get awsBucket(): string {
    return this.envConfig.AWS_BUCKET;
  }
}
