## Installation

```bash
git clone https://github.com/dzcpy/jumpo
cd jumpo
echo "SHOPIFY_STORE=jumpo-test.myshopify.com" > .env
echo "SHOPIFY_ACCESS_TOKEN=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" >> .env
echo "SHOPIFY_COLLECTION_ID=301307429021" >> .env
echo "SHOPIFY_LOCATION_ID=66800156829" >> .env
yarn install
```

## Running the app

```bash
# development
yarn start

# watch mode
yarn start:dev

# production mode
yarn start:prod
```

## Test

```bash
# unit tests
$ npm run test
```

**Test file is located at:** [src/products/products.service.spec.ts](https://github.com/dzcpy/jumpo/blob/main/src/products/products.service.spec.ts)

## Online Test

This repo has github actions configured and is linked to Heroku. Any new commits will trigger a deployment action to Heroku using Dockerfile in the root directory.

**Here below is the heroku online URL:**

[https://jumpo-test.herokuapp.com/api/](https://jumpo-test.herokuapp.com/api/)

**Test upload:**
![image](https://user-images.githubusercontent.com/203980/175455981-d8ee6bd6-7ad8-42c4-99af-0843e7739bd9.png)
![image](https://user-images.githubusercontent.com/203980/175456452-64b1f221-bb97-47a7-b189-186326259a50.png)

There is an option `purge`, if set to `true` then before importing the file, it will delete all the old products in the store.

It may take a while to execute since Shopify's API is very slow (as long as several minutes if you are in China). I tried to make it parallel but it often fails because it's exceeded Shopify's request rate limit.

When it's finished you can see there is a response body returned like this:

```json
{
  "success": true,
  "message": "File was uploaded and processed successfully"
}
```

**Here is the Shopify store:**
[https://jumpo-test.myshopify.com/](https://jumpo-test.myshopify.com/)

**Store password:** `jumpo`

**Collection:**
[https://jumpo-test.myshopify.com/collections/jewelry](https://jumpo-test.myshopify.com/collections/jewelry)
