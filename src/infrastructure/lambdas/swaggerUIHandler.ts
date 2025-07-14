import { APIGatewayProxyHandler } from "aws-lambda";
import swaggerUi from "swagger-ui-express";
import swaggerJsDoc from "swagger-jsdoc";
import { createServer, proxy } from "aws-serverless-express";
import express from "express";

const app = express();

const isLocal = process.env.IS_OFFLINE === "true";

// Configuración de Swagger
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

// Configurar Swagger UI
app.use("/swagger-ui", swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: "Vehicle Transaction API Documentation"
}));

// Redirigir la raíz a /swagger-ui
app.get("/", (req, res) => {
  res.redirect("/swagger-ui");
});

const server = createServer(app);

export const handler: APIGatewayProxyHandler = (event, context) => {
  return proxy(server, event, context);
};
