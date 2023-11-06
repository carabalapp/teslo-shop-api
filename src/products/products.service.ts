import { BadRequestException, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Product } from './entities/product.entity';
import { Repository } from 'typeorm';
import { PaginationDto } from '../common/dtos/pagination.dto';
import { isUUID } from 'class-validator';

@Injectable()
export class ProductsService {

  private readonly logger = new Logger('ProductService')
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>
  ) { }

  async create(createProductDto: CreateProductDto) {
    try {

      const product = await this.productRepository.create(createProductDto)
      await this.productRepository.save(product)

      return product

    } catch (error) {
      this.handleDBException(error)
    }

  }

  async findAll(paginationDto: PaginationDto) {
    try {
      const { limit = 10, offset = 1 } = paginationDto
      const products = await this.productRepository.find({
        take: limit,
        skip: offset
      })

      if (!products)
        throw new NotFoundException(`Not found records`)

      return products

    } catch (error) {
      this.handleDBException(error)
    }
  }

  async findOne(term: string) {
    try {

      let product: Product;

      if (isUUID(term)) {
        product = await this.productRepository.findOneBy({ id: term })
      } else {

        // Con el codigo de abajo podemos crear un query mas amplio o flexible adaptado a nuestras necesidades
        // Aqui decimos que queremos buscar el titulo o por el slug y ambos por el mismo termino
        // en este caso puede que consiga 1 o mas registros tanto por title o slug y como solo queremos uno no improta por cual consiga.
        // entonces tenemos que aplicar el getOne() para obtener un solo registro.
        const queryBuilder = this.productRepository.createQueryBuilder()

        product = await queryBuilder.where('UPPER(title) =:title or slug =:slug', {
          title: term.toLocaleUpperCase(),
          slug: term
        }).getOne();

        // product = await this.productRepository.findOneBy({ slug: term }) // Nos servia solo si queriamos buscar por el slug
      }
      // const product = await this.productRepository.findOneBy({ id: term })
      if (!product)
        throw new NotFoundException(`Product with this criterial ${term}, not exist`)

      return product

    } catch (error) {
      this.handleDBException(error)
    }
  }

  async update(id: string, updateProductDto: UpdateProductDto) {
    const product = await this.productRepository.preload({
      id: id, // Con la funcion preload lo que hacemos es que va a buscar con la primera propiedad, es decir por id en este caso
      ...updateProductDto // Con esto vamos a decir que prepare el objeto que consiga y lo pongamos tal cual como lo que nos viene por el body
    });

    if (!product) throw new NotFoundException(`Not found records with this param ${id}`)

    try {
      await this.productRepository.save(product);
      return product;

    } catch (error) {
      this.handleDBException(error)
    }

  }

  async remove(id: string) {
    try {
      const product = await this.findOne(id)

      if (!product)
        throw new NotFoundException(`Product with this criterial ${id}, not exist`)

      await this.productRepository.remove(product)

      return product;
    } catch (error) {
      this.handleDBException(error)
    }
  }

  private handleDBException(error: any) {
    if (error.code === '23505')
      throw new BadRequestException(error.detail);

    this.logger.error(error) // El logger nos ayuda a obtener una mejor definicion de nuestro error en los logs
    throw new InternalServerErrorException(`Unexpected error, check server logs`)
  }
}
