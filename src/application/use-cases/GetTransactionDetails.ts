import { TransactionRepository } from "../../infrastructure/database/SupabaseTransactionRepository";
import { TransactionDetailDto } from "../../infrastructure/dto/TransactionDetailDto";

export class GetTransactionDetails {
  constructor(private transactionRepository: TransactionRepository) {}

  async execute(id: number): Promise<TransactionDetailDto | null> {
    return this.transactionRepository.getDetailById(id);
  }
}
