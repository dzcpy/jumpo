import { groupBy, isNil } from 'lodash';
import { NestjsShopifyService } from 'nestjs-shopify-wrapper';
import xlsx from 'node-xlsx';
import * as ShopifyClient from 'shopify-api-node';

import { Injectable, Logger } from '@nestjs/common';

import type {
  IProduct,
  IProductImage,
  IProductVariant,
  IProductOption,
} from 'shopify-api-node';
import { ConfigService } from '@nestjs/config';
import { formatVariantInput } from './utils';

@Injectable()
export class ProductsService {
  private shopifyClient: ShopifyClient;
  private readonly logger = new Logger(ProductsService.name);
  private collectionId: number;
  private locationId: number;

  constructor(
    private shopifyService: NestjsShopifyService,
    private configService: ConfigService,
  ) {
    this.shopifyClient = this.shopifyService.getShopify();
    this.collectionId = Number(
      this.configService.get<number>('SHOPIFY_COLLECTION_ID'),
    );
    this.locationId = Number(
      this.configService.get<number>('SHOPIFY_LOCATION_ID'),
    );
  }

  list(params?: any) {
    return this.shopifyClient.product.list(params);
  }

  get(productId: number) {
    return this.shopifyClient.product.get(productId);
  }

  delete(id: number) {
    return this.shopifyClient.product.delete(id);
  }

  async deleteAll() {
    const products = await this.list();
    return Promise.all(
      products.map(({ id }) => this.shopifyClient.product.delete(id)),
    );
  }

  create(params: Partial<IProduct>) {
    return this.shopifyClient.product.create(params);
  }

  createImage(productId: number, params: Partial<IProductImage>) {
    return this.shopifyClient.productImage.create(productId, params);
  }

  listVariants(productId: number) {
    return this.shopifyClient.productVariant.list(productId);
  }

  createVariant(productId: number, params: Partial<IProductVariant>) {
    return this.shopifyClient.productVariant.create(productId, params);
  }

  updateVariant(variantId: number, params: Partial<IProductVariant>) {
    return this.shopifyClient.productVariant.update(variantId, params);
  }

  updateVariantQuantity(inventoryItemId: number, quantity: number) {
    return this.shopifyClient.inventoryLevel.set({
      available: quantity,
      inventory_item_id: inventoryItemId,
      location_id: this.locationId,
    });
  }

  deleteVariant(productId: number, variantId: number) {
    return this.shopifyClient.productVariant.delete(productId, variantId);
  }

  collect(productId: number) {
    return this.shopifyClient.collect.create({
      product_id: productId,
      collection_id: this.collectionId,
    });
  }

  async upload(file: Buffer, purge: boolean) {
    if (!file) {
      return { success: false, message: 'File is empty' };
    }
    if (purge) {
      this.logger.log('Deleting products');
      await this.deleteAll();
      this.logger.log('Products were deleted successfully');
    }
    const worksheets = xlsx.parse(file);
    this.shopifyClient.product.delete;
    for (const { data } of worksheets) {
      // Skip table header
      data.shift();

      // Loop through rows grouped by handle
      const rowsByHandle = Object.values(groupBy(data, 0)) as string[][][];
      let i = 1;
      for (const rowsByVariant of rowsByHandle) {
        let product: IProduct | undefined = undefined;

        this.logger.log('Importing row #' + i++);

        for (const variantIndex of rowsByVariant.keys()) {
          const [
            handle,
            title,
            bodyHtml,
            vendor,
            productType,
            tags,
            published,
            optionName1,
            optionValue1,
            optionName2,
            optionValue2,
            optionName3,
            optionValue3,
            variantSku,
            variantGrams,
            variantInventoryTrack,
            variantInventoryQuantity,
            variantInventoryPolicy,
            variantFulfillmentService,
            variantPrice,
            variantCompareAtPrice,
            variantRequiresShipping,
            variantTaxable,
            variantBarcode,
            imageSrc,
            imagePosition,
            imageAltText,
            giftCard,
            variantImageSrc,
            variantWeightUnit,
            variantTaxCode,
          ] = rowsByVariant[variantIndex];

          switch (true) {
            // First variant
            case variantIndex === 0:
              // Publish status, it's tricky that this field is read as boolean `true`, but string should be also checked
              const status: 'active' | 'draft' = (
                typeof published === 'boolean'
                  ? published
                  : (published ?? '').trim().toUpperCase() === 'TRUE'
              )
                ? 'active'
                : 'draft';

              // Construct options
              const options: IProductOption[] = [];
              if ((optionName1 ?? '').trim()) {
                const optionValuePos = 8;
                options.push({
                  name: optionName1,
                  values: rowsByVariant.reduce(
                    (prev, row) =>
                      row[optionValuePos] && !prev.includes(row[optionValuePos])
                        ? [...prev, row[optionValuePos]]
                        : prev,
                    [],
                  ),
                } as IProductOption);
              }

              if ((optionName2 ?? '').trim()) {
                const optionValuePos = 10;
                options.push({
                  name: optionName2,
                  values: rowsByVariant.reduce(
                    (prev, row) =>
                      row[optionValuePos] && !prev.includes(row[optionValuePos])
                        ? [...prev, row[optionValuePos]]
                        : prev,
                    [],
                  ),
                } as IProductOption);
              }

              if ((optionName3 ?? '').trim()) {
                const optionValuePos = 12;
                options.push({
                  name: optionName3,
                  values: rowsByVariant.reduce(
                    (prev, row) =>
                      row[optionValuePos] && !prev.includes(row[optionValuePos])
                        ? [...prev, row[optionValuePos]]
                        : prev,
                    [],
                  ),
                } as IProductOption);
              }

              const productInput = {
                handle,
                title,
                body_html: bodyHtml,
                vendor,
                product_type: productType,
                tags,
                status,
                options,
              };
              try {
                product = await this.create(productInput);
                await this.collect(product.id);
                const image = await this.createImage(product.id, {
                  src: imageSrc,
                  position: Number(imagePosition),
                });
                if (product.variants?.[0]?.id) {
                  let variantImageId: number | undefined = undefined;
                  if (variantImageSrc === imageSrc) {
                    variantImageId = image.id;
                  } else if (variantImageSrc) {
                    const variantImage = await this.createImage(product.id, {
                      src: variantImageSrc,
                      position: Number(imagePosition),
                    });
                    variantImageId = variantImage.id;
                  }
                  const variant = await this.updateVariant(
                    product.variants[0].id,
                    formatVariantInput({
                      variantImageId,
                      variantPrice,
                      variantCompareAtPrice,
                      variantGrams,
                      variantSku,
                      variantBarcode,
                      variantFulfillmentService,
                      variantInventoryPolicy,
                      variantRequiresShipping,
                      variantTaxable,
                      variantTaxCode,
                      variantWeightUnit,
                      optionValue1,
                      optionValue2,
                      optionValue3,
                    }),
                  );
                  await this.updateVariantQuantity(
                    variant.inventory_item_id,
                    Number(variantInventoryQuantity),
                  );
                }
              } catch (error) {
                this.logger.error(error?.response?.body);
              }
              break;
            // Not a valid variant, but rather an image
            case imageSrc && isNil(variantInventoryQuantity):
              await this.createImage(product!.id, {
                src: imageSrc,
                position: Number(imagePosition),
              });
              break;
            case !isNil(variantInventoryQuantity) &&
              !isNil(variantPrice) &&
              (!isNil(optionValue1) ||
                !isNil(optionValue2) ||
                !isNil(optionValue3)):
              try {
                const image = await this.createImage(product!.id, {
                  src: imageSrc,
                  position: Number(imagePosition),
                });

                let variantImageId: number | undefined = undefined;
                if (variantImageSrc === imageSrc) {
                  variantImageId = image.id;
                } else if (variantImageSrc) {
                  const variantImage = await this.createImage(product!.id, {
                    src: variantImageSrc,
                    position: Number(imagePosition),
                  });
                  variantImageId = variantImage.id;
                }
                const variant = await this.createVariant(
                  product!.id,
                  formatVariantInput({
                    variantImageId,
                    variantPrice,
                    variantCompareAtPrice,
                    variantGrams,
                    variantSku,
                    variantBarcode,
                    variantFulfillmentService,
                    variantInventoryPolicy,
                    variantRequiresShipping,
                    variantTaxable,
                    variantTaxCode,
                    variantWeightUnit,
                    optionValue1,
                    optionValue2,
                    optionValue3,
                  }),
                );
                await this.updateVariantQuantity(
                  variant.inventory_item_id,
                  Number(variantInventoryQuantity),
                );
              } catch (error) {
                this.logger.error(error?.response?.body);
              }
              break;
            default:
              this.logger.error(
                'Invalid data row:' + rowsByVariant[variantIndex].join('\t'),
              );
          }
        }
      }
    }
    this.logger.log('Finished importing');

    return {
      success: true,
      message: 'File was uploaded and processed successfully',
    };
  }
}
