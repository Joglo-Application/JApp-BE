import { commonResponses, idPathParam } from '../components';

const okMember = {
  description: 'Member',
  content: {
    'application/json': {
      schema: {
        allOf: [
          { $ref: '#/components/schemas/SuccessResponse' },
          { type: 'object', properties: { data: { $ref: '#/components/schemas/Member' } } },
        ],
      },
    },
  },
};

export const memberPaths = {
  '/member': {
    get: {
      tags: ['Member'],
      summary: 'List / cari member',
      parameters: [
        { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
        { name: 'limit', in: 'query', schema: { type: 'integer', default: 10 } },
        { name: 'q', in: 'query', schema: { type: 'string' }, description: 'Cari nama / no telp' },
      ],
      responses: {
        '200': {
          description: 'List member',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/PaginatedResponse' } } },
        },
        '401': commonResponses.Unauthorized,
      },
    },
    post: {
      tags: ['Member'],
      summary: 'Daftarkan member baru',
      description: '**Admin & Kasir.**',
      requestBody: {
        required: true,
        content: { 'application/json': { schema: { $ref: '#/components/schemas/CreateMemberInput' } } },
      },
      responses: {
        '201': okMember,
        '401': commonResponses.Unauthorized,
        '403': commonResponses.Forbidden,
        '409': commonResponses.Conflict,
        '422': commonResponses.ValidationError,
      },
    },
  },
  '/member/{id}': {
    get: {
      tags: ['Member'],
      summary: 'Get member by ID (+ riwayat poin)',
      parameters: [idPathParam],
      responses: {
        '200': {
          description: 'Detail member',
          content: {
            'application/json': {
              schema: {
                allOf: [
                  { $ref: '#/components/schemas/SuccessResponse' },
                  { type: 'object', properties: { data: { $ref: '#/components/schemas/MemberDetail' } } },
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
      tags: ['Member'],
      summary: 'Update member',
      description: '**Admin only.**',
      parameters: [idPathParam],
      requestBody: {
        required: true,
        content: { 'application/json': { schema: { $ref: '#/components/schemas/CreateMemberInput' } } },
      },
      responses: {
        '200': okMember,
        '401': commonResponses.Unauthorized,
        '403': commonResponses.Forbidden,
        '404': commonResponses.NotFound,
        '409': commonResponses.Conflict,
        '422': commonResponses.ValidationError,
      },
    },
    delete: {
      tags: ['Member'],
      summary: 'Delete member',
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
  '/member/{id}/poin': {
    post: {
      tags: ['Member'],
      summary: 'Tambah/kurangi poin member',
      description: '**Admin & Kasir.** `earn` menambah, `redeem` mengurangi (divalidasi cukup), `adjustment` koreksi.',
      parameters: [idPathParam],
      requestBody: {
        required: true,
        content: { 'application/json': { schema: { $ref: '#/components/schemas/AdjustPoinInput' } } },
      },
      responses: {
        '200': {
          description: 'Poin diperbarui',
          content: {
            'application/json': {
              schema: {
                allOf: [
                  { $ref: '#/components/schemas/SuccessResponse' },
                  { type: 'object', properties: { data: { $ref: '#/components/schemas/MemberDetail' } } },
                ],
              },
            },
          },
        },
        '400': commonResponses.ValidationError,
        '401': commonResponses.Unauthorized,
        '403': commonResponses.Forbidden,
        '404': commonResponses.NotFound,
        '422': commonResponses.ValidationError,
      },
    },
  },
};
