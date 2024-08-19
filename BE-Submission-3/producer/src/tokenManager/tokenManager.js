const Jwt = require('@hapi/jwt');
const InvariantError = require('../errorHandling/InvariantError');
const config = require('../utils/config');

const TokenManager = {
  generateAccessToken: (payload) => Jwt.token.generate(payload, config.jwt.access_token_key),
  generateRefreshToken: (payload) => Jwt.token.generate(payload, config.jwt.refresh_token_key),
  verifyRefreshToken: (refreshToken) => {
    try {
      const artifacts = Jwt.token.decode(refreshToken);
      Jwt.token.verifySignature(artifacts, config.jwt.refresh_token_key);
      const { payload } = artifacts.decoded;
      return payload;
    } catch (error) {
      throw new InvariantError('Refresh token tidak valid');
    }
  },
};

module.exports = TokenManager;
