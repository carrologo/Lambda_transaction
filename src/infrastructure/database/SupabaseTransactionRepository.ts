import { createClient } from "@supabase/supabase-js";
import { Transaction } from "../../domain/entities/Transaction";
import { ITransactionRepository } from "../../domain/repositories/ITransactionRepository";
import { RelatedEntityError } from "../../domain/entities/errors/RelatedEntityError";
import { TransactionEntity } from "./entities/TransactionEntity";

export class TransactionRepository implements ITransactionRepository {
  private supabase = createClient(
    process.env.SUPABASE_URL || "",
    process.env.SUPABASE_KEY || ""
  );

  async save(transactionEntity: TransactionEntity): Promise<TransactionEntity> {
    await this.validateRelatedEntities(transactionEntity);

    const { data, error } = await this.supabase
      .from("transaction")
      .insert(transactionEntity)
      .select()
      .single();

    if (error) {
      console.error("Error inserting transaction:", error);
      throw new Error(error.message);
    }

    // Retornar la entidad con el ID generado por la base de datos
    return new TransactionEntity(
      data.id_transaction,
      data.id_buyer,
      data.id_seller,
      data.id_vehicle,
      data.amount,
      data.start_date,
      data.close_date,
      data.description,
      data.url_documents,
      data.id_status
    );
  }

  async getAll(queryParams: {
    findBy?: string;
    value?: any;
    orderBy?: string;
    isAsc: boolean;
    page?: number;
    limit?: number;
  }): Promise<{
    data: TransactionEntity[];
    pagination: {
      page: number;
      total: number;
    };
  }> {
    const { findBy, value, orderBy = 'id_transaction', isAsc = true, page = 1, limit = 10 } = queryParams;
    
    const offset = (page - 1) * limit;
    
    let query = this.supabase.from("transaction").select("*", { count: "exact" });
    
    if (findBy && value !== undefined) {
      query = query.eq(findBy, value);
    }
    
    query = query.order(orderBy, { ascending: isAsc });
    
    query = query.range(offset, offset + limit - 1);
    
    const { data, error, count } = await query;
    
    if (error) {
      console.error("Error fetching transactions:", error);
      throw new Error(error.message);
    }
    
    const transactions = (data || []).map(item => new TransactionEntity(
      item.id_transaction,
      item.id_buyer,
      item.id_seller,
      item.id_vehicle,
      item.amount,
      item.start_date || new Date(),
      item.close_date,
      item.description,
      item.url_documents,
      item.id_status || 1
    ));
    
    return {
      data: transactions,
      pagination: {
        page: page,
        total: count || 0,
      },
    };
  }

  async updateDocumentsUrl(id_transaction: number, url: string): Promise<TransactionEntity> {
    
    const { data, error } = await this.supabase
      .from("transaction")
      .update({ url_documents: url })
      .eq("id_transaction", id_transaction)
      .select()
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        throw new Error(`Transaction with ID ${id_transaction} not found`);
      }
      console.error("Error updating transaction:", error);
      throw new Error("Failed to update transaction");
    }
    
    return new TransactionEntity(
      data.id_transaction,
      data.id_buyer,
      data.id_seller,
      data.id_vehicle,
      data.amount,
      data.start_date,
      data.close_date,
      data.description,
      data.url_documents,
      data.id_status
    );
  }

  private async validateRelatedEntities(transaction: TransactionEntity): Promise<void> {
    const errors: string[] = [];

    try {
      // Validar status
      if (transaction.id_status) {
        const statusExists = await this.validateEntityExists("status", "id_status", transaction.id_status);
        if (!statusExists) {
          errors.push(`Status with ID ${transaction.id_status} does not exist.`);
        }
      }

      // Validar buyer (cliente)
      if (transaction.id_buyer) {
        const buyerExists = await this.validateEntityExists("client", "id", transaction.id_buyer);
        if (!buyerExists) {
          errors.push(`Buyer (client) with ID ${transaction.id_buyer} does not exist.`);
        }
      }

      // Validar seller (cliente)
      if (transaction.id_seller) {
        const sellerExists = await this.validateEntityExists("client", "id", transaction.id_seller);
        if (!sellerExists) {
          errors.push(`Seller (client) with ID ${transaction.id_seller} does not exist.`);
        }
      }

      // Validar vehicle
      if (transaction.id_vehicle) {
        const vehicleExists = await this.validateEntityExists("vehicle", "id", transaction.id_vehicle);
        if (!vehicleExists) {
          errors.push(`Vehicle with ID ${transaction.id_vehicle} does not exist.`);
        } else {
          // Validar que el vehículo no esté ya registrado en otra transacción
          const vehicleAlreadyUsed = await this.validateVehicleNotInUse(transaction.id_vehicle);
          if (vehicleAlreadyUsed) {
            errors.push(`Vehicle with ID ${transaction.id_vehicle} is already registered in another transaction.`);
          }
        }
      }
      
      if (errors.length > 0) {
        throw new RelatedEntityError("Related entities validation failed.", errors);
      }
    } catch (error) {
      if (error instanceof RelatedEntityError) {
        throw error;
      }
      console.error("Unexpected error during validation:", error);
      throw new Error(`Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async validateVehicleNotInUse(vehicleId: number): Promise<boolean> {
    try {
      const { data, error } = await this.supabase
        .from("transaction")
        .select("id_vehicle")
        .eq("id_vehicle", vehicleId)
        .limit(1);

      if (error) {
        console.error(`Error checking vehicle usage:`, error.message);
        throw new Error(`Database error while checking vehicle usage: ${error.message}`);
      }

      // Si data tiene registros, significa que el vehículo ya está en uso
      return data && data.length > 0;
    } catch (error) {
      if (error instanceof Error && error.message.includes('Database error')) {
        throw error;
      }
      console.error(`Exception checking vehicle usage for ID ${vehicleId}:`, error);
      return false; // En caso de error, asumir que no está en uso para no bloquear
    }
  }

  private async validateEntityExists(table: string, idColumn: string, id: number): Promise<boolean> {
    try {
      const { data, error } = await this.supabase
        .from(table)
        .select(idColumn)
        .eq(idColumn, id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return false;
        }
        console.error(`Error validating ${table}:`, error.message);
        throw new Error(`Database error while validating ${table}: ${error.message}`);
      }

      return !!data;
    } catch (error) {
      if (error instanceof Error && error.message.includes('Database error')) {
        throw error;
      }
      console.error(`Exception validating entity ${table} with ID ${id}:`, error);
      return false; 
    }
  }
}