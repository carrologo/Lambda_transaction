import { Transaction } from "../../domain/entities/Transaction";
import { ITransactionRepository } from "../../domain/repositories/TransactionRepository";

export class CreateTransaction {
  constructor(private transactionRepository: ITransactionRepository) {}

  async execute(transactionData: Transaction): Promise<String> {
    try {
      await this.transactionRepository.save(transactionData);
      return "La transacción fue ingresada correctamente.";
    } catch (error) {
      throw new Error(`Failed to create transaction: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }
}