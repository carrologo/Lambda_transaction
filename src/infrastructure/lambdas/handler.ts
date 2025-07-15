import { APIGatewayProxyHandler } from "aws-lambda";
import { TransactionRepository } from '../../infrastructure/database/SupabaseTransactionRepository';
import { CreateTransaction } from '../../application/use-cases/CreateTransaction';
import { GetAllTransactions } from '../../application/use-cases/GetAllTransactions';
import { TransactionMapper } from '../../application/mapper/TransactionMapper';
import { corsResponse } from './CorsResponse';
import { ValidationError } from "../../domain/entities/errors/ValidationError";
import { RelatedEntityError } from "../../domain/entities/errors/RelatedEntityError";
import { UploadDocumentsRepository } from '../google/UploadDocumentsRepository';

/**
 * @swagger
 * components:
 *   schemas:
 *     Transaction:
 *       type: object
 *       properties:
 *         id_transaction:
 *           type: integer
 *           description: Transaction ID
 *           example: 1
 *         id_buyer:
 *           type: integer
 *           description: Buyer ID
 *           example: 123
 *         id_seller:
 *           type: integer
 *           description: Seller ID
 *           example: 456
 *         id_vehicle:
 *           type: integer
 *           description: Vehicle ID
 *           example: 789
 *         amount:
 *           type: number
 *           description: Transaction amount
 *           example: 25000.50
 *         start_date:
 *           type: string
 *           format: date-time
 *           description: Transaction start date
 *           example: "2024-01-15T10:30:00Z"
 *         close_date:
 *           type: string
 *           format: date-time
 *           description: Transaction close date
 *           example: "2024-01-20T15:45:00Z"
 *         description:
 *           type: string
 *           description: Transaction description
 *           example: "Vehicle sale transaction"
 *         documents:
 *           type: string
 *           format: uri
 *           description: URL to transaction documents
 *           example: "https://example.com/documents/transaction.pdf"
 *         id_status:
 *           type: integer
 *           description: Transaction status ID
 *           example: 1
 *     
 *     TransactionListResponse:
 *       type: object
 *       properties:
 *         data:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Transaction'
 *         pagination:
 *           type: object
 *           properties:
 *             page:
 *               type: integer
 *               description: Current page number
 *               example: 1
 *             total:
 *               type: integer
 *               description: Total number of transactions
 *               example: 150
 *     
 *     TransactionRequest:
 *       type: object
 *       required:
 *         - amount
 *       properties:
 *         id_buyer:
 *           type: integer
 *           description: Buyer ID (at least one of id_buyer or id_seller is required)
 *           example: 123
 *         id_seller:
 *           type: integer
 *           description: Seller ID (at least one of id_buyer or id_seller is required)
 *           example: 456
 *         id_vehicle:
 *           type: integer
 *           description: Vehicle ID (required when id_seller is provided)
 *           example: 789
 *         amount:
 *           type: number
 *           description: Transaction amount (must be greater than 0)
 *           example: 25000.50
 *         description:
 *           type: string
 *           description: Transaction description (required when only id_buyer is provided)
 *           example: "Purchase of vehicle parts"
 *         documents:
 *           type: string
 *           format: uri
 *           description: Optional URL to transaction documents
 *           example: "https://example.com/documents/transaction.pdf"
 *         id_status:
 *           type: integer
 *           description: Transaction status ID (defaults to 1 if not provided)
 *           example: 1
 *         start_date:
 *           type: string
 *           format: date-time
 *           description: Transaction start date (defaults to current date if not provided)
 *           example: "2024-01-15T10:30:00Z"
 *         close_date:
 *           type: string
 *           format: date-time
 *           description: Optional transaction close date
 *           example: "2024-01-20T15:45:00Z"
 *     
 *     TransactionResponse:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *           description: Success message
 *           example: "Transaction created successfully"
 *     
 *     ValidationError:
 *       type: object
 *       properties:
 *         error:
 *           type: object
 *           properties:
 *             code:
 *               type: string
 *               example: "ValidationError"
 *             message:
 *               type: string
 *               example: "Validation failed."
 *             errors:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   field:
 *                     type: string
 *                     example: "amount"
 *                   message:
 *                     type: string
 *                     example: "Amount must be greater than 0."
 *     
 *     RelatedEntityError:
 *       type: object
 *       properties:
 *         error:
 *           type: object
 *           properties:
 *             code:
 *               type: string
 *               example: "RelatedEntityError"
 *             message:
 *               type: string
 *               example: "Related entity not found or invalid."
 *             errors:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   field:
 *                     type: string
 *                     example: "id_buyer"
 *                   message:
 *                     type: string
 *                     example: "Buyer with ID 123 not found."
 *     
 *     InternalServerError:
 *       type: object
 *       properties:
 *         error:
 *           type: object
 *           properties:
 *             code:
 *               type: string
 *               example: "InternalServerError"
 *             message:
 *               type: string
 *               example: "An unexpected error occurred."
 */

/**
 * @swagger
 * /transactions:
 *   post:
 *     tags:
 *       - Transactions
 *     summary: Create a new transaction
 *     description: Creates a new vehicle transaction. Supports different transaction types - can include buyer only (with description), seller with vehicle, or both buyer and seller.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/TransactionRequest'
 *           examples:
 *             vehicle_sale:
 *               summary: Vehicle Sale Transaction
 *               value:
 *                 id_seller: 456
 *                 id_vehicle: 789
 *                 amount: 25000.50
 *                 documents: "https://example.com/sale-documents.pdf"
 *                 id_status: 1
 *                 start_date: "2024-01-15T10:30:00Z"
 *             parts_purchase:
 *               summary: Parts Purchase Transaction
 *               value:
 *                 id_buyer: 123
 *                 amount: 1500.00
 *                 description: "Purchase of vehicle spare parts"
 *                 id_status: 1
 *             complete_transaction:
 *               summary: Complete Transaction with Buyer and Seller
 *               value:
 *                 id_buyer: 123
 *                 id_seller: 456
 *                 id_vehicle: 789
 *                 amount: 30000.00
 *                 description: "Vehicle sale transaction"
 *                 documents: "https://example.com/transaction-docs.pdf"
 *                 id_status: 1
 *                 start_date: "2024-01-15T10:30:00Z"
 *                 close_date: "2024-01-20T15:45:00Z"
 *     responses:
 *       201:
 *         description: Transaction created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TransactionResponse'
 *       400:
 *         description: Bad request - validation error or related entity error
 *         content:
 *           application/json:
 *             schema:
 *               oneOf:
 *                 - $ref: '#/components/schemas/ValidationError'
 *                 - $ref: '#/components/schemas/RelatedEntityError'
 *             examples:
 *               validation_error:
 *                 summary: Validation Failed
 *                 value:
 *                   error:
 *                     code: "ValidationError"
 *                     message: "Validation failed."
 *                     errors:
 *                       - field: "amount"
 *                         message: "Amount must be greater than 0."
 *                       - field: "id_buyer/id_seller"
 *                         message: "At least one of id_buyer or id_seller must be provided."
 *                       - field: "id_seller/id_vehicle"
 *                         message: "Vehicle ID is required when seller ID is provided."
 *               related_entity_error:
 *                 summary: Related Entity Not Found
 *                 value:
 *                   error:
 *                     code: "RelatedEntityError"
 *                     message: "Related entity not found or invalid."
 *                     errors:
 *                       - field: "id_vehicle"
 *                         message: "Vehicle with ID 789 not found."
 *                       - field: "id_buyer"
 *                         message: "Buyer with ID 123 not found."
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/InternalServerError'
 */

/**
 * @swagger
 * /transactions:
 *   get:
 *     tags:
 *       - Transactions
 *     summary: Get all transactions with pagination
 *     description: Retrieves a paginated list of all transactions with optional filtering and sorting
 *     parameters:
 *       - in: query
 *         name: findBy
 *         schema:
 *           type: string
 *         description: Field to filter by (e.g., id_buyer, id_seller, id_vehicle, id_status)
 *         example: id_status
 *       - in: query
 *         name: value
 *         schema:
 *           type: string
 *         description: Value to filter by (use with findBy parameter)
 *         example: 1
 *       - in: query
 *         name: orderBy
 *         schema:
 *           type: string
 *         description: Field to order by
 *         example: start_date
 *         default: id_transaction
 *       - in: query
 *         name: isAsc
 *         schema:
 *           type: boolean
 *         description: Sort order (true for ascending, false for descending)
 *         example: false
 *         default: true
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Page number for pagination
 *         example: 1
 *         default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *         description: Number of items per page
 *         example: 10
 *         default: 10
 *     responses:
 *       200:
 *         description: List of transactions retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TransactionListResponse'
 *             examples:
 *               success:
 *                 summary: Successful response
 *                 value:
 *                   data:
 *                     - id_transaction: 1
 *                       id_buyer: 123
 *                       id_seller: 456
 *                       id_vehicle: 789
 *                       amount: 25000.50
 *                       start_date: "2024-01-15T10:30:00Z"
 *                       close_date: "2024-01-20T15:45:00Z"
 *                       description: "Vehicle sale transaction"
 *                       documents: "https://example.com/documents/transaction.pdf"
 *                       id_status: 1
 *                     - id_transaction: 2
 *                       id_buyer: 789
 *                       amount: 1500.00
 *                       start_date: "2024-01-16T09:15:00Z"
 *                       description: "Purchase of vehicle spare parts"
 *                       id_status: 1
 *                   pagination:
 *                     page: 1
 *                     total: 25
 *       400:
 *         description: Bad request - invalid query parameters
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/InternalServerError'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/InternalServerError'
 */

const transactionRepository = new TransactionRepository();
const uploadDocumentsRepository = new UploadDocumentsRepository();
const createTransaction = new CreateTransaction(transactionRepository, uploadDocumentsRepository);
const getAllTransactions = new GetAllTransactions(transactionRepository);

export const createTransactionHandler: APIGatewayProxyHandler = async (event) => {
  try {
    const body = JSON.parse(event.body || '{}');
    const response = await createTransaction.execute(TransactionMapper.toDomain(body));
    return corsResponse(201, {message: response})
  } catch (error) {
    console.error("Transaction creation failed:", error instanceof Error ? error.message : 'Unknown error');
    
    if (error instanceof ValidationError) {
      return corsResponse(400, {
        error: {
          code: error.code,
          message: error.message,
          errors: error.details
        }
      });
    }
    
    if (error instanceof RelatedEntityError) {
      return corsResponse(400, {
        error: {
          code: error.code,
          message: error.message,
          errors: error.details
        }
      });
    }
    
    return corsResponse(500, {
      error: {
        code: "InternalServerError",
        message: "An unexpected error occurred."
      }
    });
  }
}

export const getAllTransactionsHandler: APIGatewayProxyHandler = async (event) => {
  try {
    // Extract query parameters with defaults
    const queryParams = event.queryStringParameters || {};
    
    const requestParams = {
      findBy: queryParams.findBy,
      value: queryParams.value,
      orderBy: queryParams.orderBy || 'id_transaction',
      isAsc: queryParams.isAsc !== 'false', // Default to true unless explicitly false
      page: queryParams.page ? parseInt(queryParams.page, 10) : 1,
      limit: queryParams.limit ? parseInt(queryParams.limit, 10) : 10
    };

    // Validate pagination parameters
    if (requestParams.page < 1) {
      return corsResponse(400, {
        error: {
          code: "BadRequest",
          message: "Page number must be greater than 0."
        }
      });
    }

    if (requestParams.limit < 1 || requestParams.limit > 100) {
      return corsResponse(400, {
        error: {
          code: "BadRequest",
          message: "Limit must be between 1 and 100."
        }
      });
    }

    const result = await getAllTransactions.execute(requestParams);
    
    return corsResponse(200, result);
    
  } catch (error) {
    console.error("Failed to retrieve transactions:", error instanceof Error ? error.message : 'Unknown error');
    
    return corsResponse(500, {
      error: {
        code: "InternalServerError",
        message: "An unexpected error occurred while retrieving transactions."
      }
    });
  }
}



