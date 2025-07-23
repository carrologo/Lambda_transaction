import { Transaction } from "../../../domain/entities/Transaction";
import { TransactionEntity } from "../entities/TransactionEntity";
import { TransactionDetailDto, ClientInfoDto, StatusInfoDto, VehicleInfoDto } from "../../dto/TransactionDetailDto";

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
            transaction.id_status || 1
        );
    }

    static toTransactionDetailDto(
        supabaseData: any
    ): TransactionDetailDto {
        const dto: TransactionDetailDto = {
            id_transaction: supabaseData.id_transaction,
            amount: supabaseData.amount,
            start_date: supabaseData.start_date,
            close_date: supabaseData.close_date,
            description: supabaseData.description,
            url_documents: supabaseData.url_documents
        };

        // Mapear información del buyer si existe
        if (supabaseData.buyer) {
            dto.buyerInfo = {
                id: supabaseData.buyer.id,
                name: supabaseData.buyer.name,
                email: supabaseData.buyer.email
            };
        }

        // Mapear información del seller si existe
        if (supabaseData.seller) {
            dto.sellerInfo = {
                id: supabaseData.seller.id,
                name: supabaseData.seller.name,
                email: supabaseData.seller.email
            };
        }

        // Mapear información del status si existe
        if (supabaseData.status) {
            dto.statusInfo = {
                id_status: supabaseData.status.id_status,
                name: supabaseData.status.name
            };
        }

        // Mapear información del vehicle si existe
        if (supabaseData.vehicle) {
            dto.vehicleInfo = {
                id: supabaseData.vehicle.id,
                description: `${supabaseData.vehicle.brand} ${supabaseData.vehicle.line}`,
                plate: supabaseData.vehicle.plate,
                url_images: supabaseData.vehicle.url_images
            };
        }

        return dto;
    }
}