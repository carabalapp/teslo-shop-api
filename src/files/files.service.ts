import { BadRequestException, Injectable } from '@nestjs/common';
import { existsSync } from 'fs';
import { join } from 'path';

@Injectable()
export class FilesService {

  getStaticProductImage( imageName ){
    const path = join(__dirname, '../../static/uploads', imageName);

    if ( !existsSync(path))
      throw new BadRequestException(`No product found with image ${imageName}`)
    
    return path;  
  }
}
