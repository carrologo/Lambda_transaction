import { APIGatewayProxyHandler } from "aws-lambda";
import swaggerJsDoc from "swagger-jsdoc";
import { corsResponse } from './CorsResponse';

const isLocal = process.env.IS_OFFLINE === "true";

const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Lambda Vehicle Transaction API",
      version: "1.0.0",
      description: "API documentation for Vehicle Transaction Lambda Service",
    },
    servers: [
      {
        url: isLocal
          ? "http://localhost:3000"
          : `https://${process.env.API_GATEWAY_ID}.execute-api.${process.env.AWS_REGION}.amazonaws.com/${process.env.STAGE}`,
        description: isLocal ? "Local development server" : "Production server"
      },
    ],
  },
  apis: ["./src/infrastructure/lambdas/*.ts"],
};

const swaggerSpec = swaggerJsDoc(swaggerOptions);

export const handler: APIGatewayProxyHandler = async () => {
  try {
    return corsResponse(200, swaggerSpec);
  } catch (error) {
    console.error("Error generating Swagger spec:", error);
    return corsResponse(500, {
      error: "Failed to generate API documentation"
    });
  }
};