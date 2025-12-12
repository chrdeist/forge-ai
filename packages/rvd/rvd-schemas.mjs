// JSON Schemas for RVD and its sections (minimal, generic)
export const rvdSchema = {
  type: 'object',
  properties: {
    version: { type: 'string' },
    created: { type: 'string' },
    lastUpdated: { type: 'string' },
    project: {
      type: 'object',
      properties: {
        name: { type: 'string', minLength: 1 },
        path: { type: 'string' }
      },
      required: ['name'],
      additionalProperties: true
    },
    functional: { $ref: '#/definitions/functionalSection' },
    technical: { $ref: '#/definitions/genericSection' },
    architecture: { $ref: '#/definitions/genericSection' },
    testing: { $ref: '#/definitions/genericSection' },
    implementation: { $ref: '#/definitions/genericSection' },
    review: { $ref: '#/definitions/genericSection' },
    documentation: { $ref: '#/definitions/genericSection' },
    deployment: { $ref: '#/definitions/genericSection' },
    agents: { type: 'array' },
    executionLog: { type: 'array' },
    kpis: {
      type: 'object',
      properties: {
        timings: { type: 'object' },
        counts: { type: 'object' },
        orchestration: { type: 'object' },
        tokensUsed: { type: 'number' }
      },
      additionalProperties: true
    }
  },
  required: ['version', 'created', 'project'],
  additionalProperties: true,
  definitions: {
    functionalSection: {
      type: 'object',
      properties: {
        timestamp: { type: 'string' },
        sourceFile: { type: 'string' },
        extractedBy: { type: 'string' },
        data: {
          type: 'object',
          properties: {
            metadata: { type: 'object' },
            sections: { type: 'object' },
            requirements: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  text: { type: 'string' },
                  type: { type: 'string' },
                  section: { type: 'string' }
                },
                required: ['text'],
                additionalProperties: true
              }
            }
          },
          required: ['requirements'],
          additionalProperties: true
        }
      },
      required: ['timestamp', 'sourceFile', 'extractedBy', 'data'],
      additionalProperties: true
    },
    genericSection: {
      type: 'object',
      properties: {
        timestamp: { type: 'string' },
        generatedBy: { type: 'string' },
        data: { type: 'object' }
      },
      required: ['timestamp', 'data'],
      additionalProperties: true
    }
  }
};

export const sectionSchemas = {
  functional: rvdSchema.definitions.functionalSection,
  technical: rvdSchema.definitions.genericSection,
  architecture: rvdSchema.definitions.genericSection,
  testing: rvdSchema.definitions.genericSection,
  implementation: rvdSchema.definitions.genericSection,
  review: rvdSchema.definitions.genericSection,
  documentation: rvdSchema.definitions.genericSection,
  deployment: rvdSchema.definitions.genericSection
};
