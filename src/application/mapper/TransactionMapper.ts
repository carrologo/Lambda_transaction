import { Transaction } from "../../domain/entities/Transaction";

export class TransactionMapper {
    static toDomain(data: any): Transaction {
        return new Transaction({
            id_buyer: data.id_buyer,
            id_seller: data.id_seller,
            id_vehicle: data.id_vehicle,
            amount: data.amount,
            description: data.description,
            documents: data.documents,
            id_status: data.id_status,
            // id_transaction is auto-generated, only include if it exists (for updates)
            ...(data.id_transaction && { id_transaction: data.id_transaction }),
            start_date: data.start_date ? new Date(data.start_date) : undefined,
            close_date: data.close_date ? new Date(data.close_date) : undefined
        });
    }

    static toDTO(transaction: Transaction): any {
        return {
            id_transaction: transaction.id_transaction,
            id_buyer: transaction.id_buyer,
            id_seller: transaction.id_seller,
            id_vehicle: transaction.id_vehicle,
            amount: transaction.amount,
            description: transaction.description,
            start_date: transaction.start_date.toISOString(),
            close_date: transaction.close_date?.toISOString(),
            documents: transaction.documents,
            id_status: transaction.id_status
        };
    }
}