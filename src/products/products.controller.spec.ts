import {
  NestjsShopifyModule,
  NestjsShopifyOptions,
} from 'nestjs-shopify-wrapper';

import { ConfigModule, ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';

import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';

describe('ProductsController', () => {
  let controller: ProductsController;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot(),
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
    }).compile();

    controller = module.get<ProductsController>(ProductsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
