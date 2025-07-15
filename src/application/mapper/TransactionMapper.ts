import { Transaction } from "../../domain/entities/Transaction";

export class TransactionMapper {
  static toDomain(data: any): Transaction {
    return new Transaction({
      id_buyer: data.id_buyer,
      id_seller: data.id_seller,
      id_vehicle: data.id_vehicle,
      amount: data.amount,
      start_date: data.start_date,
      close_date: data.close_date,
      description: data.description,
      documents: data.documents,
      url_documents: data.url_documents,
      allDocuments: data.allDocuments,
      id_status: data.id_status,
    });
  }
}
