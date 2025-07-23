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

    if (existing.statusInfo && (existing.statusInfo.id_status === 5 || existing.statusInfo.id_status === 3)) {
      throw new Error("Cannot update a transaction that is already closed or cancelled.");
    }

    if(data.id_status && (data.id_status === 5 || data.id_status === 3)) {
      data.close_date = new Date();
    }
    
    return this.transactionRepository.update(id, data);
  }
} 