import { createClient } from "@supabase/supabase-js";
import { Transaction } from "../../domain/entities/Transaction";
import { ITransactionRepository } from "../../domain/repositories/TransactionRepository";

export class TransactionRepository implements ITransactionRepository {
  private supabase = createClient(
    process.env.SUPABASE_URL || "",
    process.env.SUPABASE_KEY || ""
  );

  async save(transaction: Transaction): Promise<Transaction> {
    const { error } = await this.supabase
      .from("transaction")
      .insert(transaction)
      .select()
      .single();

    if (error) {
      console.error("Error inserting transaction:", error);
      throw new Error(error.message);
    }

    return transaction
  }
}