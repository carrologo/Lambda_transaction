import { Transaction } from "../../../domain/entities/Transaction";
import { TransactionEntity } from "../entities/TransactionEntity";

export class TransactionEntityMapper {
    static toEntity(transaction: Transaction): TransactionEntity {
        return new TransactionEntity(
            transaction.id_transaction,
            transaction.id_buyer,
            transaction.id_seller,
            transaction.id_vehicle,
            transaction.amount,
            transaction.start_date,
            transaction.close_date,
            transaction.description,
            transaction.url_documents,
            transaction.id_status
        );
    }
}