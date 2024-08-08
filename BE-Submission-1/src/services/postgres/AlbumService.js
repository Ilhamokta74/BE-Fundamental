const { Pool } = require('pg');
const { nanoid } = require('nanoid');
const InvariantError = require('../../ErrorHandling/InvariantError');
const NotFoundError = require('../../ErrorHandling/NotFoundError');

class AlbumsService {
  constructor() {
    this._pool = new Pool();
  }

  async addAlbum({ name, year }) {
    const id = nanoid(16);
    const query = {
      text: 'INSERT INTO albums (id, name, year) VALUES($1, $2, $3) RETURNING id',
      values: [id, name, year],
    };

    try {
      const result = await this._pool.query(query);
      if (!result.rows[0].id) {
        throw new InvariantError('Album gagal ditambahkan');
      }
      return result.rows[0].id;
    } catch (error) {
      throw new InvariantError(`Album gagal ditambahkan: ${error.message}`);
    }
  }

  async getAlbumById(id) {
    const query = {
      text: 'SELECT * FROM albums WHERE id = $1',
      values: [id],
    };

    const songQuery = {
      text: 'SELECT id, title, performer FROM songs WHERE "albumId" = $1',
      values: [id],
    };

    try {
      const result = await this._pool.query(query);
      const resultSongs = await this._pool.query(songQuery);

      if (!result.rowCount) {
        throw new NotFoundError('Album tidak ditemukan');
      }

      const album = result.rows[0];
      return {
        id: album.id,
        name: album.name,
        year: album.year,
        songs: resultSongs.rows,
      };
    } catch (error) {
      throw new NotFoundError(`Gagal mendapatkan album: ${error.message}`);
    }
  }

  async editAlbumById(id, { name, year }) {
    const query = {
      text: 'UPDATE albums SET name = $1, year = $2 WHERE id = $3 RETURNING id',
      values: [name, year, id],
    };

    try {
      const result = await this._pool.query(query);
      if (!result.rowCount) {
        throw new NotFoundError('Gagal memperbarui Album. Id tidak ditemukan');
      }
      return result.rows[0].id;
    } catch (error) {
      throw new NotFoundError(`Gagal memperbarui album: ${error.message}`);
    }
  }

  async deleteAlbumById(id) {
    const query = {
      text: 'DELETE FROM albums WHERE id = $1 RETURNING id',
      values: [id],
    };

    try {
      const result = await this._pool.query(query);
      if (!result.rowCount) {
        throw new NotFoundError('Album gagal dihapus. Id tidak ditemukan');
      }
    } catch (error) {
      throw new NotFoundError(`Gagal menghapus album: ${error.message}`);
    }
  }

  async closePool() {
    await this._pool.end();
  }
}

module.exports = AlbumsService;
