  const swaggerJsdoc = require('swagger-jsdoc');

  const swaggerOptions = {
    definition: {
      openapi: '3.0.0',
      info: {
        title: 'Mon API SaaS',
        version: '1.0.0',
        description: 'API REST de gestion des utilisateurs'
      },
      servers: [
        { url: 'http://localhost:3000', description: 'Serveur local' }
      ],
      components: {
        securitySchemes: {            // ✅ Bonne syntaxe
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT'
          }
        }
      },
      security: [                      // ✅ Activer l'auth globalement
        {
          bearerAuth: []
        }
      ]
    },
    apis: ['./src/routes/*.js']
  };

  const swaggerDocs = swaggerJsdoc(swaggerOptions);

  module.exports = { swaggerDocs };