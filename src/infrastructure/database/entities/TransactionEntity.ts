export class  TransactionEntity {
  constructor(
    public id_transaction: number | undefined,
    public id_buyer: number | undefined,
    public id_seller: number | undefined,
    public id_vehicle: number | undefined,
    public amount: number,
    public start_date: Date,
    public close_date: Date | undefined,
    public description: string | undefined,
    public url_documents: string | undefined,
    public id_status: number
  ){};
}
