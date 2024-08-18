const { Pool } = require('pg');
const { nanoid } = require('nanoid');
const InvariantError = require('../../ErrorHandling/InvariantError');

class CollaborationService {
  constructor() {
    this._pool = new Pool();
  }

  async addCollaboration(playlistId, userId) {
    const id = `collab-${nanoid(16)}`;
    const query = {
      text: 'INSERT INTO collaborations(id, playlist_id, user_id) VALUES($1, $2, $3) RETURNING id',
      values: [id, playlistId, userId],
    };

    try {
      const result = await this._pool.query(query);
      if (!result.rows[0].id) {
        throw new InvariantError('Failed to add collaboration.');
      }
      return result.rows[0].id;
    } catch (error) {
      throw new InvariantError(`Failed to add collaboration: ${error.message}`);
    }
  }

  async deleteCollaboration(playlistId, userId) {
    const query = {
      text: 'DELETE FROM collaborations WHERE playlist_id = $1 AND user_id = $2 RETURNING id',
      values: [playlistId, userId],
    };

    try {
      const result = await this._pool.query(query);
      if (!result.rowCount) {
        throw new InvariantError('Failed to delete collaboration.');
      }
    } catch (error) {
      throw new InvariantError(`Failed to delete collaboration: ${error.message}`);
    }
  }

  async verifyCollaborator(playlistId, userId) {
    const query = {
      text: 'SELECT id FROM collaborations WHERE playlist_id = $1 AND user_id = $2',
      values: [playlistId, userId],
    };

    try {
      const result = await this._pool.query(query);
      if (!result.rowCount) {
        throw new InvariantError('Collaboration verification failed.');
      }
    } catch (error) {
      throw new InvariantError(`Collaboration verification failed: ${error.message}`);
    }
  }
}

module.exports = CollaborationService;
