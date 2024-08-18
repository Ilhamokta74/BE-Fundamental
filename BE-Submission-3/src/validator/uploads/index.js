const InvariantError = require('../../ErrorHandling/InvariantError');
const { CoverImageHeadersSchema } = require('./schema');

const UploadsValidator = {
  validateCoverImageHeaders: (headers) => {
    const validationResult = CoverImageHeadersSchema.validate(headers);

    if (validationResult.error) {
      throw new InvariantError(validationResult.error.message);
    }
  },
};

module.exports = UploadsValidator;
