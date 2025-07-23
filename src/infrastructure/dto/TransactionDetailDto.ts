// DTO para transacciones con información de entidades relacionadas
export interface TransactionDetailDto {
  id_transaction: number | undefined;
  amount: number;
  start_date: Date;
  close_date: Date | undefined;
  description: string | undefined;
  url_documents: string | undefined;
  
  // Información de entidades relacionadas
  buyerInfo?: ClientInfoDto;
  sellerInfo?: ClientInfoDto;
  statusInfo?: StatusInfoDto;
  vehicleInfo?: VehicleInfoDto;
}

// DTO para información del cliente (buyer/seller)
export interface ClientInfoDto {
  id: number;
  name: string;
  email: string;
}

// DTO para información del estado
export interface StatusInfoDto {
  id_status: number;
  name: string;
}

// DTO para información del vehículo
export interface VehicleInfoDto {
  id: number;
  description: string; // Template string con brand y line
  plate: string;
  url_images: string;
}
