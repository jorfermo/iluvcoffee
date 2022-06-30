import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaginationQueryDto } from '../comon/dto/pagination-query.dto';
import { CreateCoffeeDto } from './dto';
import { UpdateCoffeeDto } from './dto/update-coffee.dto';
import { Coffee, Flavor } from './entities';

@Injectable()
export class CoffeesService {
  constructor(
    @InjectRepository(Flavor)
    private readonly flavorRepository: Repository<Flavor>,
    @InjectRepository(Coffee)
    private readonly coffeeReepository: Repository<Coffee>,
  ) {
    this.preloadFlavorByName = this.preloadFlavorByName.bind(this);
  }

  findAll(paginationQuery: PaginationQueryDto): Promise<Coffee[]> {
    const { limit, offset } = paginationQuery;
    return this.coffeeReepository.find({
      relations: ['flavors'],
      skip: offset,
      take: limit,
    });
  }

  async findOne(id: number): Promise<Coffee> {
    const coffee = await this.coffeeReepository.findOne({
      where: { id },
      relations: ['flavors'],
    });
    if (!coffee) {
      throw new NotFoundException(`Coffee ${id} Not found`);
    }
    return coffee;
  }

  async create(createCoffeeDto: CreateCoffeeDto): Promise<Coffee> {
    const flavors = await Promise.all(
      createCoffeeDto.flavors.map(this.preloadFlavorByName),
    );
    const coffee = this.coffeeReepository.create({
      ...createCoffeeDto,
      flavors,
    });
    this.coffeeReepository.save(coffee);
    return coffee;
  }

  async update(id: number, updateCoffeeDto: UpdateCoffeeDto) {
    const flavors =
      updateCoffeeDto.flavors &&
      (await Promise.all(
        updateCoffeeDto.flavors.map(this.preloadFlavorByName),
      ));
    const coffee = await this.coffeeReepository.preload({
      id,
      ...updateCoffeeDto,
      flavors,
    });
    if (!coffee) {
      throw new NotFoundException(`Coffee ${id} Not found`);
    }
    return this.coffeeReepository.save(coffee);
  }

  async remove(id: number) {
    const coffee = await this.findOne(id);
    return this.coffeeReepository.remove(coffee);
  }

  private async preloadFlavorByName(name: string): Promise<Flavor> {
    console.log(this);
    console.log(this.flavorRepository);
    console.log(this.coffeeReepository);
    const flavor = await this.flavorRepository.findOne({ where: { name } });
    if (!flavor) {
      return this.flavorRepository.create({ name });
    }
    return flavor;
  }
}
