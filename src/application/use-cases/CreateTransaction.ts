import { Transaction } from "../../domain/entities/Transaction";
import { ITransactionRepository } from "../../domain/repositories/ITransactionRepository";
import { RelatedEntityError } from "../../domain/entities/errors/RelatedEntityError";
import { ValidationError } from "../../domain/entities/errors/ValidationError";
import { UploadDocumentsRepository } from '../../infrastructure/google/UploadDocumentsRepository';
import { TransactionEntityMapper } from "../../infrastructure/database/mapper/TransactionEntityMapper";

export class CreateTransaction {
  constructor(
    private transactionRepository: ITransactionRepository,
    private uploadDocumentsRepository: UploadDocumentsRepository,
  ) {}

  async execute(transactionData: Transaction): Promise<String> {
    try {
      
      const savedTransaction = await this.transactionRepository.save(TransactionEntityMapper.toEntity(transactionData));
      
      if (transactionData.documents && transactionData.documents.length > 0) {
        const urlDocuments = await this.uploadDocumentsRepository.uploadDocuments(
          transactionData.documents,
          `transaction/${savedTransaction.id_transaction}`
        );

        if (!urlDocuments) {
          throw new Error("No se pudieron subir los documentos.");
        }

        if (typeof savedTransaction.id_transaction === "number") {
          await this.transactionRepository.updateDocumentsUrl(savedTransaction.id_transaction, urlDocuments);
        } else {
          throw new Error("El ID de la transacción guardada no está definido.");
        }
      }

      return "La transacción fue ingresada correctamente.";
    } catch (error) {
      if (error instanceof RelatedEntityError || error instanceof ValidationError) {
        throw error;
      }
      
      throw new Error(`Failed to create transaction: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }
}