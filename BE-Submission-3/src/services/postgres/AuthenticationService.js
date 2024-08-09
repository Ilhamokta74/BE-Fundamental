const { Pool } = require('pg');
const InvariantError = require('../../ErrorHandling/InvariantError');

class AuthenticationService {
  constructor() {
    this._pool = new Pool();
  }

  async addRefreshToken(token) {
    const query = {
      text: 'INSERT INTO authentications(token) VALUES ($1)',
      values: [token],
    };

    try {
      await this._pool.query(query);
    } catch (error) {
      throw new InvariantError('Failed to add refresh token.');
    }
  }

  async verifyRefreshToken(token) {
    const query = {
      text: 'SELECT token FROM authentications WHERE token = $1',
      values: [token],
    };

    const result = await this._pool.query(query);

    if (!result.rowCount) {
      throw new InvariantError('Invalid refresh token.');
    }
  }

  async deleteRefreshToken(token) {
    const query = {
      text: 'DELETE FROM authentications WHERE token = $1',
      values: [token],
    };

    try {
      await this._pool.query(query);
    } catch (error) {
      throw new InvariantError('Failed to delete refresh token.');
    }
  }
}

module.exports = AuthenticationService;
