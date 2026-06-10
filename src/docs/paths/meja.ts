import { commonResponses, idPathParam } from '../components';

const okMeja = {
  description: 'Meja',
  content: {
    'application/json': {
      schema: {
        allOf: [
          { $ref: '#/components/schemas/SuccessResponse' },
          { type: 'object', properties: { data: { $ref: '#/components/schemas/Meja' } } },
        ],
      },
    },
  },
};

export const mejaPaths = {
  '/meja': {
    get: {
      tags: ['Meja'],
      summary: 'List meja',
      parameters: [
        { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
        { name: 'limit', in: 'query', schema: { type: 'integer', default: 50 } },
        { name: 'zona', in: 'query', schema: { type: 'string' } },
        { name: 'status', in: 'query', schema: { type: 'string', enum: ['available', 'occupied', 'reserved'] } },
      ],
      responses: {
        '200': {
          description: 'List meja',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/PaginatedResponse' } } },
        },
        '401': commonResponses.Unauthorized,
      },
    },
    post: {
      tags: ['Meja'],
      summary: 'Create meja',
      description: '**Admin only.**',
      requestBody: {
        required: true,
        content: { 'application/json': { schema: { $ref: '#/components/schemas/CreateMejaInput' } } },
      },
      responses: {
        '201': okMeja,
        '401': commonResponses.Unauthorized,
        '403': commonResponses.Forbidden,
        '409': commonResponses.Conflict,
        '422': commonResponses.ValidationError,
      },
    },
  },
  '/meja/{id}': {
    get: {
      tags: ['Meja'],
      summary: 'Get meja by ID',
      parameters: [idPathParam],
      responses: { '200': okMeja, '401': commonResponses.Unauthorized, '404': commonResponses.NotFound },
    },
    patch: {
      tags: ['Meja'],
      summary: 'Update meja',
      description: '**Admin only.**',
      parameters: [idPathParam],
      requestBody: {
        required: true,
        content: { 'application/json': { schema: { $ref: '#/components/schemas/CreateMejaInput' } } },
      },
      responses: {
        '200': okMeja,
        '401': commonResponses.Unauthorized,
        '403': commonResponses.Forbidden,
        '404': commonResponses.NotFound,
        '422': commonResponses.ValidationError,
      },
    },
    delete: {
      tags: ['Meja'],
      summary: 'Delete meja',
      description: '**Admin only.**',
      parameters: [idPathParam],
      responses: {
        '200': { description: 'Deleted', content: { 'application/json': { example: { success: true, data: { deleted: true } } } } },
        '401': commonResponses.Unauthorized,
        '403': commonResponses.Forbidden,
        '404': commonResponses.NotFound,
      },
    },
  },
  '/meja/{id}/status': {
    patch: {
      tags: ['Meja'],
      summary: 'Update status meja',
      description: '**Admin & Kasir.** Mengubah status meja (available/occupied/reserved).',
      parameters: [idPathParam],
      requestBody: {
        required: true,
        content: { 'application/json': { schema: { $ref: '#/components/schemas/UpdateMejaStatusInput' } } },
      },
      responses: {
        '200': okMeja,
        '401': commonResponses.Unauthorized,
        '403': commonResponses.Forbidden,
        '404': commonResponses.NotFound,
        '422': commonResponses.ValidationError,
      },
    },
  },
};
