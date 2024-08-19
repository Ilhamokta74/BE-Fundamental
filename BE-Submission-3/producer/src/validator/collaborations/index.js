const { CollaborationPayloadSchema } = require('./schema');
const InvariantError = require('../../errorHandling/InvariantError');

const CollaborationValidator = {
  validateCollaborationPayload: (payload) => {
    const validationResult = CollaborationPayloadSchema.validate(payload);
    if (validationResult.error) {
      throw new InvariantError(validationResult.error.message);
    }
  },
};

module.exports = CollaborationValidator;
