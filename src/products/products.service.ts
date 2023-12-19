import { BadRequestException, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Product } from './entities/product.entity';
import { DataSource, Repository } from 'typeorm';
import { PaginationDto } from '../common/dtos/pagination.dto';
import { isUUID } from 'class-validator';
import { ProductImage } from './entities';

@Injectable()
export class ProductsService {

  private readonly logger = new Logger('ProductService')
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,

    @InjectRepository(ProductImage)
    private readonly productImageRepository: Repository<ProductImage>,

    private readonly dataSource: DataSource
  ) { }

  async create(createProductDto: CreateProductDto) {
    try {
      const { images = [], ...productDetails } = createProductDto
      const product = await this.productRepository.create({
        ...productDetails,
        images: images.map(image => this.productImageRepository.create({ url: image }))
      })
      await this.productRepository.save(product)

      return { ...product, images }

    } catch (error) {
      this.handleDBException(error)
    }

  }

  async findAll(paginationDto: PaginationDto) {
    try {
      const { limit = 10, offset = 1 } = paginationDto

      const products = await this.productRepository.find({
        take: limit,
        skip: offset,
        relations: {
          images: true
        }
      })

      if (!products)
        throw new NotFoundException(`Not found records`)

      // return products // podriamos retornalos de esta forma pero la respuesta entonces seria que las imagenes nos traen el id, y solo queremos el url, para eso lo aplanamos de esta forma

      return products.map(product => ({
        ...product,
        images: product.images.map(images => images.url)
      }))

    } catch (error) {
      this.handleDBException(error)
    }
  }

  async findOne(term: string) {

      let product: Product;

      if (isUUID(term)) {
        product = await this.productRepository.findOneBy({ id: term })
      } else {

        // Con el codigo de abajo podemos crear un query mas amplio o flexible adaptado a nuestras necesidades
        // Aqui decimos que queremos buscar el titulo o por el slug y ambos por el mismo termino
        // en este caso puede que consiga 1 o mas registros tanto por title o slug y como solo queremos uno no improta por cual consiga.
        // entonces tenemos que aplicar el getOne() para obtener un solo registro.
        const queryBuilder = this.productRepository.createQueryBuilder('prod')

        product = await queryBuilder.where('UPPER(title) =:title or slug =:slug', {
          title: term.toLocaleUpperCase(),
          slug: term
        })
          .leftJoinAndSelect('prod.images', 'prodImages')
          .getOne();

        // product = await this.productRepository.findOneBy({ slug: term }) // Nos servia solo si queriamos buscar por el slug
      }
      // const product = await this.productRepository.findOneBy({ id: term })
      if (!product)
        throw new NotFoundException(`Product with this criterial ${term}, not exist`)

      return product

  }

  async findOnePlain(term: string) {
    const product = await this.findOne(term)
    return { ...product, images: product.images.map(image => image.url) }
  }

  async update(id: string, updateProductDto: UpdateProductDto) {
    const { images, ...toUpdate } = updateProductDto // aqui saco las imagenes que viene de toUpdate, y el resto "..." lo representamos con el rest operator que son esos 3 puntitos, lo llamaremos toUpdate
    const product = await this.productRepository.preload({
      id: id, // Con la funcion preload lo que hacemos es que va a buscar con la primera propiedad, es decir por id en este caso
      ...toUpdate, // Con esto vamos a decir que prepare el objeto que consiga y lo pongamos tal cual como lo que nos viene por el body
    });

    if (!product) throw new NotFoundException(`Not found records with this param ${id}`)

    // Create query runner
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {

      if (images) {
        // si trae imagenes, voy a borrar las que ya tiene el producto ya que colocaremos las nuevas imagenes que nos vienen
        await queryRunner.manager.delete(ProductImage, { product: { id } });
        // se crea un nuevo array con la instancia de productImage para luego guardarlo en BD
        product.images = images.map(
          image => this.productImageRepository.create({ url: image })
        )
      }
      await queryRunner.manager.save(product)

      // Si no ha dado error hasta este punto entonces podemos hacer commit
      await queryRunner.commitTransaction();
      // Y en este punto ya no necesito mas el queryRunner
      // Y de esta forma ya no funciona mas el queryRunner, y papra eso deberiamos teenr que hacer la conexion nuevamente.
      await queryRunner.release();

      // await this.productRepository.save(product);

      // De esta manera retornamos con su relacion gracias al metodo que cree. findOnePlain(term)
      return this.findOnePlain(id);

    } catch (error) {

      await queryRunner.rollbackTransaction();
      await queryRunner.release();
      this.handleDBException(error)
    }

  }

  async remove(id: string) {
      const product = await this.findOne(id)
      await this.productRepository.remove(product);

  }

  private handleDBException(error: any) {
    if (error.code === '23505')
      throw new BadRequestException(error.detail);

    this.logger.error(error) // El logger nos ayuda a obtener una mejor definicion de nuestro error en los logs
    throw new InternalServerErrorException(`Unexpected error, check server logs`)
  }

  async deleteAllProducts() {
    const query = this.productRepository.createQueryBuilder('product');

    try {
      return await query
        .delete()
        .where({})
        .execute();

    } catch (error) {
      this.handleDBException(error);
    }

  }
}
