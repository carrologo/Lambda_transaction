import { Transaction } from "../../domain/entities/Transaction";
import { TransactionRepository } from "../../infrastructure/database/SupabaseTransactionRepository";
import { TransactionDetailDto } from "../../infrastructure/dto/TransactionDetailDto";

export class UpdateTransaction {
  constructor(private transactionRepository: TransactionRepository) {}

  async execute(id: number, data: Partial<Transaction>): Promise<TransactionDetailDto> {
    
    const existing = await this.transactionRepository.getDetailById(id);
    if (!existing) {
      throw new Error(`Transacción con ID ${id} no encontrada.`);
    }

    if (existing.statusInfo && (existing.statusInfo.id_status === 5 || existing.statusInfo.id_status === 3)) {
      throw new Error("No se puede actualizar una transacción que ya está cerrada o cancelada.");
    }

    if(data.id_status && (data.id_status === 5 || data.id_status === 3)) {
      data.close_date = new Date();
    }
    
    return this.transactionRepository.update(id, data);
  }
} 