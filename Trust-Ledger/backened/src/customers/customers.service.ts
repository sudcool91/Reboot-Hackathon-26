import { Injectable } from '@nestjs/common';
import { CreateCustomerDto } from './dto/create-customer.dto';

@Injectable()
export class CustomersService {
  private readonly customers: Array<CreateCustomerDto & { id: number }> = [];

  create(createCustomerDto: CreateCustomerDto) {
    const newCustomer = { id: Date.now(), ...createCustomerDto };
    this.customers.push(newCustomer);
    return newCustomer;
  }
}
