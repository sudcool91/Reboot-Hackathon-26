export class CreateCustomerDto {
  name!: string;
  email!: string;
  phone?: string;
  dob?: string;
  address?: string;
  documents?: string[];
}
