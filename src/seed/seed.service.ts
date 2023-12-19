import { Injectable } from '@nestjs/common';
import { ProductsService } from '../products/products.service';
import { initialData } from './data/product-data.seed';

@Injectable()
export class SeedService {
  constructor(
    private readonly productService: ProductsService
  ) { }

  async runSeed() {

    this.insertNewProducts();
    return `Seed executed`;
  }

  private async insertNewProducts() {
    await this.productService.deleteAllProducts()

    const products = initialData.products;

    const insertPromises = [];

    products.forEach(product => {
      insertPromises.push(this.productService.create(product)) // Puede parecer que inserta de una vez, pero es una promesa no resuelta lo que retorna
    });

    await Promise.all(insertPromises); // Aqui si resuelve todas las promesas y empieza a insertar y si almenos una falla entonces no se cumplen todas.

    return true

  }
}
