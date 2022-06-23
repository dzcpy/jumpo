import { escapeRegExp, omit } from 'lodash';
import {
  NestjsShopifyModule,
  NestjsShopifyOptions,
} from 'nestjs-shopify-wrapper';
import { parse } from 'path';

import { ConfigModule, ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';

import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';

import type { IProduct } from 'shopify-api-node';
const productInputFixture = {
  title: 'Test product',
  body_html: 'This is a test',
};

const productImageUrlFixture1 =
  'https://burst.shopifycdn.com/photos/7-chakra-bracelet_925x.jpg';
const productImageUrlFixture2 =
  'https://burst.shopifycdn.com/photos/navy-blue-chakra-bracelet_925x.jpg';

describe('ProductsService', () => {
  let service: ProductsService;

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

    service = module.get<ProductsService>(ProductsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('crud', () => {
    jest.setTimeout(15000);

    it('#list should return an array', async () => {
      expect(service.list()).resolves.toBeArray();
    });

    let product: IProduct;
    it('#create should create a product', async () => {
      product = await service.create(productInputFixture);
      expect(product).toContainKey('id');
    });

    it('#get should get a product', async () => {
      const product1 = await service.get(product.id);
      expect(product1).toBeObject();
      expect(product1?.id).toBeNumber();
      expect(product1.id).toEqual(product.id);
    });

    it('#delete should delete a product', async () => {
      const product1 = await service.get(product.id);
      expect(product1?.id).toBeNumber();
      await service.delete(product1.id);
      expect(service.get(product.id)).toReject();
    });

    it('#deleteAll should delete all products', async () => {
      const product1 = await service.create(productInputFixture);
      expect(product1?.id).toBeNumber();
      const product2 = await service.create(productInputFixture);
      expect(product2?.id).toBeNumber();
      const product3 = await service.create(productInputFixture);
      expect(product3?.id).toBeNumber();
      await service.deleteAll();
      expect(service.list()).resolves.toBeArrayOfSize(0);
    });

    it('#createImage should create a new image for a specific product', async () => {
      let product1 = await service.create(productInputFixture);
      expect(product1?.id).toBeNumber();
      expect(product1?.images).toBeArrayOfSize(0);
      const image1 = await service.createImage(product1.id, {
        src: productImageUrlFixture1,
        position: 2,
      });
      expect(image1).toBeObject();
      product1 = await service.get(product1.id);
      expect(product1?.images).toBeArrayOfSize(1);
      expect(product1.images[0].src).toMatch(
        new RegExp(
          escapeRegExp(parse(new URL(productImageUrlFixture1).pathname).name),
        ),
      );
      expect(product1.images[0].position).toBe(1);
      const image2 = await service.createImage(product1.id, {
        src: productImageUrlFixture2,
        position: 1,
      });
      expect(image2).toBeObject();
      product1 = await service.get(product1.id);
      expect(product1?.images).toBeArrayOfSize(2);
      expect(product1.images[0].src).toMatch(
        new RegExp(
          escapeRegExp(parse(new URL(productImageUrlFixture2).pathname).name),
        ),
      );
      expect(product1.images[0].position).toBe(1);
      await service.delete(product1.id);
    });
  });
});
