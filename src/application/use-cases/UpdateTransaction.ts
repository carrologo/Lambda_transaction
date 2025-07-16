import { Transaction } from "../../domain/entities/Transaction";
import { TransactionRepository } from "../../infrastructure/database/SupabaseTransactionRepository";
import { TransactionDetailDto } from "../../infrastructure/dto/TransactionDetailDto";

export class UpdateTransaction {
  constructor(private transactionRepository: TransactionRepository) {}

  async execute(id: number, data: Partial<Transaction>): Promise<TransactionDetailDto> {
    
    const existing = await this.transactionRepository.getDetailById(id);
    if (!existing) {
      throw new Error(`Transaction with ID ${id} not found.`);
    }
    
    return this.transactionRepository.update(id, data);
  }
} 