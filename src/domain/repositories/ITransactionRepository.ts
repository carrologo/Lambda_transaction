import { TransactionEntity } from "../../infrastructure/database/entities/TransactionEntity";
import { TransactionDetailDto } from "../../infrastructure/dto/TransactionDetailDto";

export interface ITransactionRepository {
    /**
     * Save a new transaction to the database
     * @param transaction - The transaction to save
     * @returns Promise<Transaction> - The saved transaction with generated ID
     */
    save(transaction: TransactionEntity): Promise<TransactionEntity>;


    updateDocumentsUrl(id_transaction: number, url: string): Promise<TransactionEntity>;

    /**
     * Get all transactions with optional filtering, ordering, and pagination
     * @param queryParams - Query parameters for filtering, ordering, and pagination
     * @returns Promise with data array and pagination info
     */
    getAll(queryParams: {
        findBy?: string;
        value?: any;
        orderBy?: string;
        isAsc: boolean;
        page?: number;
        limit?: number;
    }): Promise<{
        data: TransactionDetailDto[];
        pagination: {
            page: number;
            total: number;
        };
    }>;

}