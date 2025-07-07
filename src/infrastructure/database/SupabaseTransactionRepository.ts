import { createClient } from "@supabase/supabase-js";
import { Transaction } from "../../domain/entities/Transaction";
import { ITransactionRepository } from "../../domain/repositories/TransactionRepository";
import { RelatedEntityError } from "../../domain/entities/errors/RelatedEntityError";

export class TransactionRepository implements ITransactionRepository {
  private supabase = createClient(
    process.env.SUPABASE_URL || "",
    process.env.SUPABASE_KEY || ""
  );

  async save(transaction: Transaction): Promise<Transaction> {
    // Validar que las entidades relacionadas existan
    await this.validateRelatedEntities(transaction);

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

  private async validateRelatedEntities(transaction: Transaction): Promise<void> {
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