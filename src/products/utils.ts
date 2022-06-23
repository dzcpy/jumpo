import { isNil } from 'lodash';
import type {
  IProductVariant,
  ProductVariantInventoryPolicy,
  ProductVariantWeightUnit,
} from 'shopify-api-node';

export type IFormatVariantInput = {
  variantImageId?: number;
  variantPrice?: string;
  variantCompareAtPrice?: string;
  variantGrams?: string;
  variantSku?: string;
  variantBarcode?: string;
  variantFulfillmentService?: string;
  variantInventoryPolicy?: string;
  variantRequiresShipping?: boolean | string;
  variantTaxable?: boolean | string;
  variantTaxCode?: string;
  variantWeightUnit?: string;
  optionValue1?: string;
  optionValue2?: string;
  optionValue3?: string;
};

export const formatVariantInput = ({
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
}: IFormatVariantInput): Partial<IProductVariant> => ({
  image_id: variantImageId,
  price: variantPrice,
  compare_at_price: variantCompareAtPrice || undefined,

  grams: isNil(variantGrams) ? undefined : Number(variantGrams),
  sku: variantSku || undefined,
  barcode: variantBarcode || undefined,
  fulfillment_service: variantFulfillmentService || undefined,
  inventory_management: 'shopify',
  inventory_policy:
    (variantInventoryPolicy as ProductVariantInventoryPolicy) || undefined,
  requires_shipping:
    typeof variantRequiresShipping === 'boolean'
      ? variantRequiresShipping
      : (variantRequiresShipping ?? '').toUpperCase() === 'TRUE',
  taxable:
    typeof variantTaxable === 'boolean'
      ? variantTaxable
      : (variantTaxable ?? '').toUpperCase() === 'TRUE',
  tax_code: variantTaxCode,
  weight_unit: (
    variantWeightUnit ?? ''
  ).toLowerCase() as ProductVariantWeightUnit,
  option1: optionValue1 || undefined,
  option2: optionValue2 || undefined,
  option3: optionValue3 || undefined,
});
