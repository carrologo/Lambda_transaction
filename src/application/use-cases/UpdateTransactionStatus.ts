import { Transaction } from "../../domain/entities/Transaction";
import { ITransactionRepository } from "../../domain/repositories/TransactionRepository";
import { StatusRepository } from "../../domain/repositories/StatusRepository";

export class UpdateTransactionStatus {
  constructor(
    private transactionRepository: ITransactionRepository,
    private statusRepository: StatusRepository
  ) {}

  async execute(id_transaction: number, id_status: number): Promise<Transaction | null> {
    // Verify that the status exists
    const status = await this.statusRepository.getStatusById(id_status);
    if (!status) {
      throw new Error(`Status with ID ${id_status} not found`);
    }

    // Get the transaction
    const transaction = await this.transactionRepository.findById(id_transaction);
    if (!transaction) {
      return null;
    }

    // Check if the status is "COMPLETED" (assuming status with name "COMPLETED")
    const isCompleted = status.name.toUpperCase() === 'COMPLETED';
    
    // Update the transaction status
    transaction.updateStatus(id_status, isCompleted);

    // Save the updated transaction
    return await this.transactionRepository.update(transaction);
  }
}
