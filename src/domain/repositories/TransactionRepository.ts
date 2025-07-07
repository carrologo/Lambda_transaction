import { Transaction } from "../entities/Transaction";

export interface ITransactionRepository {
    /**
     * Save a new transaction to the database
     * @param transaction - The transaction to save
     * @returns Promise<Transaction> - The saved transaction with generated ID
     */
    save(transaction: Transaction): Promise<Transaction>;

}