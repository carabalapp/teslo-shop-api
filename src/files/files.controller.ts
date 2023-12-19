import { Controller, Get, Post, Param, UseInterceptors, UploadedFile, BadRequestException, Res } from '@nestjs/common';
import { FilesService } from './files.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { fileFilter, fileNamer } from './helpers';
import { diskStorage } from 'multer';
import { Response } from 'express';

@Controller('files')
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Post('product')
  @UseInterceptors(FileInterceptor('file', {
    fileFilter: fileFilter,
    storage: diskStorage({
      destination: './static/uploads',
      filename: fileNamer
    })
  }))
  uploapFiles(@UploadedFile() file: Express.Multer.File) {
    
    if (!file) {
      return new BadRequestException(`Not file upload`)
    }

    const secureUrl = file.filename
   
    return { secureUrl }
  }

  @Get('product/:imageName')
  findPropductImage(
    @Res() res: Response,
    @Param('imageName') imageName: string
  ){
    const path = this. filesService.getStaticProductImage( imageName )

    return res.sendFile( path ) ;
  }

}
