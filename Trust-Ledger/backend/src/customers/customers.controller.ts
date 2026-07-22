import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { CustomersService } from './customers.service';
import { CreateCustomerDto } from './dto/create-customer.dto';

interface ConsentBody {
  bank: string;
}

@Controller('customers')
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Get()
  findAll() {
    return this.customersService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.customersService.findOne(id);
  }

  @Post()
  create(@Body() createCustomerDto: CreateCustomerDto) {
    return this.customersService.create(createCustomerDto);
  }

  @Patch(':id/approve')
  approve(@Param('id') id: string) {
    return this.customersService.approve(id);
  }

  @Patch(':id/reject')
  reject(@Param('id') id: string) {
    return this.customersService.reject(id);
  }

  @Post(':id/consent')
  shareConsent(@Param('id') id: string, @Body() body: ConsentBody) {
    return this.customersService.shareConsent(id, body.bank);
  }

  @Delete(':id/consent')
  revokeConsent(@Param('id') id: string, @Body() body: ConsentBody) {
    return this.customersService.revokeConsent(id, body.bank);
  }
}
