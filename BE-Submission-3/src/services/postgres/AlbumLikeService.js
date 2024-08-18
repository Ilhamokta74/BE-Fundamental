const { Pool } = require('pg');
const { nanoid } = require('nanoid');
const autoBind = require('auto-bind');
const InvariantError = require('../../ErrorHandling/InvariantError');
const NotFoundError = require('../../ErrorHandling/NotFoundError');
const ClientError = require('../../ErrorHandling/ClientError');

class AlbumLikeService {
  constructor(cacheService) {
    this._pool = new Pool();
    this._cacheService = cacheService;
    autoBind(this);
  }

  async addLike(albumId, userId) {
    const id = `like-${nanoid(16)}`;

    const query = {
      text: 'INSERT INTO album_likes VALUES ($1, $2, $3) RETURNING id',
      values: [id, userId, albumId],
    };

    const result = await this._pool.query(query);

    if (!result.rows[0].id) {
      throw new InvariantError('Gagal menyukai album');
    }

    await this._cacheService.delete(`likes:${albumId}`);
    return result.rows[0].id;
  }

  async getLike(albumId) {
    try {
      const result = await this._cacheService.get(`likes:${albumId}`);
      return {
        likes: JSON.parse(result),
        cached: true,
      };
    } catch (error) {
      const query = {
        text: 'SELECT * FROM album_likes WHERE album_id = $1',
        values: [albumId],
      };

      const result = await this._pool.query(query);

      if (!result.rowCount) {
        throw new NotFoundError('Album tidak ditemukan');
      }

      await this._cacheService.set(
        `likes:${albumId}`,
        JSON.stringify(result.rowCount),
      );

      return {
        likes: result.rowCount,
        cached: false,
      };
    }
  }

  async deleteLike(albumId, userId) {
    const query = {
      text: 'DELETE FROM album_likes WHERE album_id = $1 AND user_id = $2',
      values: [albumId, userId],
    };

    const result = await this._pool.query(query);

    if (!result.rowCount) {
      throw new NotFoundError('Gagal batal menyukai album. Id tidak ditemukan');
    }

    await this._cacheService.delete(`likes:${albumId}`);
  }

  async verifyAlbumLiked(albumId, userId) {
    const query = {
      text: 'SELECT * FROM album_likes WHERE album_id = $1 AND user_id = $2',
      values: [albumId, userId],
    };

    const result = await this._pool.query(query);

    if (result.rowCount > 0) {
      throw new ClientError('Anda sudah menyukai album ini');
    }
  }
}

module.exports = AlbumLikeService;
