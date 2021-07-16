import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '../config/config.module';
import { ConfigService } from '../config/config.service';
// import fs from 'fs';

export const MongodbDatabaseProvider = [
  MongooseModule.forRootAsync({
    imports: [ConfigModule],
    inject: [ConfigService],
    useFactory: async (configService: ConfigService) => ({
      uri: configService.mongoUri,
      useCreateIndex: true,
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useFindAndModify: false,
      poolSize: 20,
      // ssl: true,
      // sslValidate: false,
      // sslCA: fs.readFileSync('./rds-combined-ca-bundle.pem')
    }),
  }),
];
