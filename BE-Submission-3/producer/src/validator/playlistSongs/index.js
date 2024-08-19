const { PostPlaylistSongPayloadSchema } = require('./schema');
const InvariantError = require('../../errorHandling/InvariantError');

const PlaylistSongsValidator = {
  validatePostPlaylistSongPayload: (payload) => {
    const validationResult = PostPlaylistSongPayloadSchema.validate(payload);
    if (validationResult.error) {
      throw new InvariantError(validationResult.error.message);
    }
  },
};

module.exports = PlaylistSongsValidator;
