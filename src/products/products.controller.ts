import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  Body,
  DefaultValuePipe,
  ParseBoolPipe,
} from '@nestjs/common';
import { ProductsService } from './products.service';

import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiConsumes } from '@nestjs/swagger';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post('upload')
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
        purge: {
          type: 'boolean',
          default: false,
          title: 'Purge old products data before upload',
        },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  uploadFile(
    @UploadedFile()
    file: Express.Multer.File,
    @Body('purge', new DefaultValuePipe(false), ParseBoolPipe)
    purge: boolean,
  ) {
    return this.productsService.upload(file?.buffer, purge);
  }
}
