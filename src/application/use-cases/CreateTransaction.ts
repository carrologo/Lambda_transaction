import { Transaction } from "../../domain/entities/Transaction";
import { ITransactionRepository } from "../../domain/repositories/TransactionRepository";
import { RelatedEntityError } from "../../domain/entities/errors/RelatedEntityError";
import { ValidationError } from "../../domain/entities/errors/ValidationError";

export class CreateTransaction {
  constructor(private transactionRepository: ITransactionRepository) {}

  async execute(transactionData: Transaction): Promise<String> {
    try {
      await this.transactionRepository.save(transactionData);
      return "La transacción fue ingresada correctamente.";
    } catch (error) {
      if (error instanceof RelatedEntityError || error instanceof ValidationError) {
        throw error;
      }
      
      throw new Error(`Failed to create transaction: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }
}