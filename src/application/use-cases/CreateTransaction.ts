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
    let savedTransaction: any = null;
    
    try {
      // Paso 1: Guardar la transacción
      savedTransaction = await this.transactionRepository.save(TransactionEntityMapper.toEntity(transactionData));
      
      // Paso 2: Si hay documentos, procesarlos
      if (transactionData.documents && transactionData.documents.length > 0) {
        try {
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
        } catch (documentError) {
          // Rollback: Eliminar la transacción si falló la subida de documentos
          if (savedTransaction?.id_transaction) {
            console.warn(`Rolling back transaction ${savedTransaction.id_transaction} due to document upload failure`);
            await this.transactionRepository.delete(savedTransaction.id_transaction);
          }
          throw new Error(`Error al procesar documentos: ${documentError instanceof Error ? documentError.message : "Error desconocido"}`);
        }
      }

      return "La transacción fue ingresada correctamente.";
    } catch (error) {
      // Si el error ocurrió antes de crear la transacción o es un error de validación, no hacer rollback
      if (error instanceof RelatedEntityError || error instanceof ValidationError) {
        throw error;
      }
      
      // Si ya se realizó el rollback arriba, no intentar hacerlo de nuevo
      if (error instanceof Error && error.message.includes("Error al procesar documentos")) {
        throw error;
      }
      
      throw new Error(`Failed to create transaction: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }
}