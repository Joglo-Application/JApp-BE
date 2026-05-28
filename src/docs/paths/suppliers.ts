import { commonResponses, idPathParam, paginationParams } from '../components';

export const suppliersPaths = {
  '/suppliers': {
    get: {
      tags: ['Suppliers'],
      summary: 'List suppliers',
      parameters: [...paginationParams],
      responses: {
        '200': {
          description: 'List suppliers',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/PaginatedResponse' } } },
        },
        '401': commonResponses.Unauthorized,
      },
    },
    post: {
      tags: ['Suppliers'],
      summary: 'Create supplier',
      description: '**Admin only.**',
      requestBody: {
        required: true,
        content: { 'application/json': { schema: { $ref: '#/components/schemas/CreateSupplierInput' } } },
      },
      responses: {
        '201': {
          description: 'Created',
          content: {
            'application/json': {
              schema: {
                allOf: [
                  { $ref: '#/components/schemas/SuccessResponse' },
                  { type: 'object', properties: { data: { $ref: '#/components/schemas/Supplier' } } },
                ],
              },
            },
          },
        },
        '401': commonResponses.Unauthorized,
        '403': commonResponses.Forbidden,
        '422': commonResponses.ValidationError,
      },
    },
  },
  '/suppliers/{id}': {
    get: {
      tags: ['Suppliers'],
      summary: 'Get supplier by ID',
      parameters: [idPathParam],
      responses: {
        '200': {
          description: 'Supplier detail',
          content: {
            'application/json': {
              schema: {
                allOf: [
                  { $ref: '#/components/schemas/SuccessResponse' },
                  { type: 'object', properties: { data: { $ref: '#/components/schemas/Supplier' } } },
                ],
              },
            },
          },
        },
        '401': commonResponses.Unauthorized,
        '404': commonResponses.NotFound,
      },
    },
    patch: {
      tags: ['Suppliers'],
      summary: 'Update supplier',
      description: '**Admin only.**',
      parameters: [idPathParam],
      requestBody: {
        required: true,
        content: { 'application/json': { schema: { $ref: '#/components/schemas/UpdateSupplierInput' } } },
      },
      responses: {
        '200': {
          description: 'Updated',
          content: {
            'application/json': {
              schema: {
                allOf: [
                  { $ref: '#/components/schemas/SuccessResponse' },
                  { type: 'object', properties: { data: { $ref: '#/components/schemas/Supplier' } } },
                ],
              },
            },
          },
        },
        '401': commonResponses.Unauthorized,
        '403': commonResponses.Forbidden,
        '404': commonResponses.NotFound,
        '422': commonResponses.ValidationError,
      },
    },
    delete: {
      tags: ['Suppliers'],
      summary: 'Delete supplier',
      description: '**Admin only.** Akan gagal jika supplier masih terkait dengan PO/transaksi.',
      parameters: [idPathParam],
      responses: {
        '200': {
          description: 'Deleted',
          content: { 'application/json': { example: { success: true, data: { deleted: true } } } },
        },
        '401': commonResponses.Unauthorized,
        '403': commonResponses.Forbidden,
        '404': commonResponses.NotFound,
      },
    },
  },
};
