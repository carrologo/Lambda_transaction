import { ValidationError } from "./errors/ValidationError";
import { Status } from "./Status";

export interface ITransaction {
  id_transaction?: number;
  id_buyer?: number;
  id_seller?: number;
  id_vehicle?: number;
  amount: number;
  start_date: Date;
  close_date?: Date;
  description?: string;
  documents?: string;
  id_status: number;
}



export class Transaction implements ITransaction {
  id_transaction?: number;
  id_buyer?: number;
  id_seller?: number;
  id_vehicle?: number;
  amount: number;
  start_date: Date;
  close_date?: Date;
  description?: string;
  documents?: string;
  id_status: number;
  
  constructor(data: ITransaction) {
    this.validateTransactionData(data);
    this.id_transaction = data.id_transaction;
    this.id_buyer = data.id_buyer;
    this.id_seller = data.id_seller;
    this.id_vehicle = data.id_vehicle;
    this.amount = data.amount;
    this.start_date = data.start_date || new Date();
    this.close_date = data.close_date;
    this.description = data.description;
    this.documents = data.documents;
    this.id_status = data.id_status || 1; 
  }

  

  private validateTransactionData(data: ITransaction): void {
    const errors: { field: string; message: string }[] = [];

    this.validateSequentially(errors, "amount", [
      { isValid: !!data.amount, message: "Este campo es obligatorio." },
      { isValid: Number.isFinite(data.amount), message: "El monto debe ser un número válido." },
      { isValid: data.amount > 0, message: "El monto debe ser mayor a 0." }
    ]);

    this.validateSequentially(errors, "id_buyer/id_seller", [
      { isValid: !!(data.id_buyer || data.id_seller), message: "Al menos uno de los id del vendedor o del comprador debe ser proporcionado." }
    ]);

   
    if (data.id_buyer && !data.id_seller) {
      this.validateSequentially(errors, "id_buyer/description", [
        { isValid: !!data.description, message: "La descripción es obligatoria cuando solo se proporciona el ID del comprador." }
      ]);
    }

    if (data.id_seller) {
      this.validateSequentially(errors, "id_seller/id_vehicle", [
        { isValid: !!data.id_vehicle, message: "El ID del vehículo es obligatorio cuando se proporciona el ID del vendedor." }
      ]);
    }

    const otherRules = [
      { field: "documents", isValid: !data.documents || this.isValidUrl(data.documents), message: "Los documentos deben ser una URL válida." }
    ];

    otherRules.forEach((rule) => {
      if (!rule.isValid) {
        errors.push({ field: rule.field, message: rule.message });
      }
    });

    if (errors.length > 0) {
      throw new ValidationError("Validation failed.", errors);
    }
  }

  private validateSequentially(
    errors: { field: string; message: string }[], 
    field: string, 
    validations: { isValid: boolean; message: string }[]
  ): void {
    for (const validation of validations) {
      if (!validation.isValid) {
        errors.push({ field, message: validation.message });
        break;
      }
    }
  }

  private isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }
}