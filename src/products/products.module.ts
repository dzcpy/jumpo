import {
  NestjsShopifyModule,
  NestjsShopifyOptions,
} from 'nestjs-shopify-wrapper';

import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';

@Module({
  imports: [
    NestjsShopifyModule.registerAsync({
      useFactory: (config: ConfigService) =>
        ({
          shopName: config.get('SHOPIFY_STORE'),
          accessToken: config.get('SHOPIFY_ACCESS_TOKEN'),
          // Module's type definition is not right when using accessToken, here below is a workaround
        } as unknown as NestjsShopifyOptions),
      inject: [ConfigService],
    }),
  ],
  controllers: [ProductsController],
  providers: [ProductsService, ConfigService],
})
export class ProductsModule {}
