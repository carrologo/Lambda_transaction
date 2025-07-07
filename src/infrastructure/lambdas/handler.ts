import { APIGatewayProxyHandler } from "aws-lambda";
import { TransactionRepository } from '../../infrastructure/database/SupabaseTransactionRepository';
import { CreateTransaction } from '../../application/use-cases/CreateTransaction';
import { GetStatuses, GetStatusById } from '../../application/use-cases/GetStatuses';
import { SupabaseStatusRepository } from '../../infrastructure/database/SupabaseStatusRepository';
import { TransactionMapper } from '../../application/mapper/TransactionMapper';
import { corsResponse } from './CorsResponse';
import { ValidationError } from "../../domain/entities/errors/ValidationError";
import { RelatedEntityError } from "../../domain/entities/errors/RelatedEntityError";

/**
 * @swagger
 * components:
 *   schemas:
 *     TransactionRequest:
 *       type: object
 *       required:
 *         - type
 *         - id_vehicle
 *         - id_client
 *         - amount
 *       properties:
 *         type:
 *           type: string
 *           enum: [SALE, PURCHASE]
 *           description: Type of transaction
 *           example: SALE
 *         id_vehicle:
 *           type: integer
 *           description: Vehicle ID
 *           example: 123
 *         id_client:
 *           type: integer
 *           description: Client ID
 *           example: 456
 *         amount:
 *           type: number
 *           description: Transaction amount (must be greater than 0)
 *           example: 25000.50
 *         documents:
 *           type: string
 *           format: uri
 *           description: Optional URL to transaction documents
 *           example: "https://example.com/documents/transaction.pdf"
 *         status:
 *           type: string
 *           enum: [NEW, IN_PROGRESS, COMPLETED]
 *           description: Transaction status (defaults to NEW if not provided)
 *           example: NEW
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
 *     description: Creates a new vehicle transaction (sale or purchase)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/TransactionRequest'
 *           examples:
 *             sale_transaction:
 *               summary: Vehicle Sale Transaction
 *               value:
 *                 type: "SALE"
 *                 id_vehicle: 123
 *                 id_client: 456
 *                 amount: 25000.50
 *                 documents: "https://example.com/sale-documents.pdf"
 *                 status: "NEW"
 *             purchase_transaction:
 *               summary: Vehicle Purchase Transaction
 *               value:
 *                 type: "PURCHASE"
 *                 id_vehicle: 789
 *                 id_client: 321
 *                 amount: 30000.00
 *     responses:
 *       201:
 *         description: Transaction created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TransactionResponse'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationError'
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
 *                       - field: "type"
 *                         message: "This field is required."
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/InternalServerError'
 */

/**
 * @swagger
 * /transaction/status:
 *   get:
 *     tags:
 *       - Status
 *     summary: Get all transaction statuses
 *     description: Retrieves all available transaction statuses
 *     responses:
 *       200:
 *         description: List of all statuses retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id_status:
 *                         type: integer
 *                         example: 1
 *                       name:
 *                         type: string
 *                         example: "NEW"
 *                       description:
 *                         type: string
 *                         example: "New transaction"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/InternalServerError'
 */

/**
 * @swagger
 * /transaction/status/{id}:
 *   get:
 *     tags:
 *       - Status
 *     summary: Get status by ID
 *     description: Retrieves a specific transaction status by its ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Status ID
 *         example: 1
 *     responses:
 *       200:
 *         description: Status retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     id_status:
 *                       type: integer
 *                       example: 1
 *                     name:
 *                       type: string
 *                       example: "NEW"
 *                     description:
 *                       type: string
 *                       example: "New transaction"
 *       404:
 *         description: Status not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: object
 *                   properties:
 *                     code:
 *                       type: string
 *                       example: "NotFound"
 *                     message:
 *                       type: string
 *                       example: "Status not found."
 *       400:
 *         description: Invalid ID parameter
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: object
 *                   properties:
 *                     code:
 *                       type: string
 *                       example: "BadRequest"
 *                     message:
 *                       type: string
 *                       example: "Invalid status ID."
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/InternalServerError'
 */

const transactionRepository = new TransactionRepository();
const createTransaction = new CreateTransaction(transactionRepository);

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

const statusRepository = new SupabaseStatusRepository();
const getStatuses = new GetStatuses(statusRepository);
const getStatusById = new GetStatusById(statusRepository);

export const getAllStatusesHandler: APIGatewayProxyHandler = async (event) => {
  try {
    const statuses = await getStatuses.execute();
    return corsResponse(200, { data: statuses });
  } catch (error) {
    console.error('Error getting statuses:', error);
    return corsResponse(500, {
      error: {
        code: "InternalServerError",
        message: "An unexpected error occurred while retrieving statuses."
      }
    });
  }
};

export const getStatusByIdHandler: APIGatewayProxyHandler = async (event) => {
  try {
    const { id } = event.pathParameters || {};
    
    if (!id || isNaN(Number(id))) {
      return corsResponse(400, {
        error: {
          code: "BadRequest",
          message: "Invalid status ID."
        }
      });
    }

    const status = await getStatusById.execute(Number(id));
    
    if (!status) {
      return corsResponse(404, {
        error: {
          code: "NotFound",
          message: "Status not found."
        }
      });
    }

    return corsResponse(200, { data: status });
  } catch (error) {
    console.error('Error getting status by ID:', error);
    return corsResponse(500, {
      error: {
        code: "InternalServerError",
        message: "An unexpected error occurred while retrieving the status."
      }
    });
  }
};