import { TransactionRepository } from "../../infrastructure/database/SupabaseTransactionRepository";
import { TransactionDetailDto } from "../../infrastructure/dto/TransactionDetailDto";

export class GetAllTransactions {
  constructor(private transactionRepository: TransactionRepository) {}

  async execute(queryParams: {
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
  }> {
    const { data, pagination } = await this.transactionRepository.getAll(queryParams);
    return {
      data: data,
      pagination: pagination,
    };
  }
}