const { Pool } = require('pg');
const { nanoid } = require('nanoid');
const InvariantError = require('../../ErrorHandling/InvariantError');
const { mapDBToModelSong, mapDBToModelSongDetail } = require('../../utils');
const NotFoundError = require('../../ErrorHandling/NotFoundError');

class SongsService {
  constructor() {
    this._pool = new Pool();
  }

  async addSong({
    title, year, genre, performer, duration, albumId,
  }) {
    const id = nanoid(16);
    const query = {
      text: 'INSERT INTO songs (id, title, year, genre, performer, duration, "albumId") VALUES($1, $2, $3, $4, $5, $6, $7) RETURNING id',
      values: [id, title, year, genre, performer, duration, albumId],
    };

    try {
      const result = await this._pool.query(query);
      if (!result.rows[0].id) {
        throw new InvariantError('Song gagal ditambahkan');
      }
      return result.rows[0].id;
    } catch (error) {
      throw new InvariantError(`Song gagal ditambahkan: ${error.message}`);
    }
  }

  async getSongs(title, performer) {
    let text = 'SELECT id, title, performer FROM songs';
    const values = [];
    const conditions = [];

    if (title) {
      conditions.push(`title ILIKE '%' || $${conditions.length + 1} || '%'`);
      values.push(title);
    }

    if (performer) {
      conditions.push(`performer ILIKE '%' || $${conditions.length + 1} || '%'`);
      values.push(performer);
    }

    if (conditions.length > 0) {
      text += ` WHERE ${conditions.join(' AND ')}`;
    }

    const query = {
      text,
      values,
    };

    try {
      const result = await this._pool.query(query);
      return result.rows.map(mapDBToModelSong);
    } catch (error) {
      throw new Error(`Gagal mendapatkan songs: ${error.message}`);
    }
  }

  async getSongById(id) {
    const query = {
      text: 'SELECT * FROM songs WHERE id = $1',
      values: [id],
    };

    try {
      const result = await this._pool.query(query);
      if (!result.rowCount) {
        throw new NotFoundError('Song tidak ditemukan');
      }
      return mapDBToModelSongDetail(result.rows[0]);
    } catch (error) {
      throw new NotFoundError(`Gagal mendapatkan song: ${error.message}`);
    }
  }

  async editSongById(id, {
    title, year, genre, performer, duration, albumId,
  }) {
    const query = {
      text: 'UPDATE songs SET title = $1, year = $2, genre = $3, performer = $4, duration = $5, "albumId" = $6 WHERE id = $7 RETURNING id',
      values: [title, year, genre, performer, duration, albumId, id],
    };

    try {
      const result = await this._pool.query(query);
      if (!result.rowCount) {
        throw new NotFoundError('Gagal memperbarui Song. Id tidak ditemukan');
      }
      return result.rows[0].id;
    } catch (error) {
      throw new NotFoundError(`Gagal memperbarui song: ${error.message}`);
    }
  }

  async deleteSongById(id) {
    const query = {
      text: 'DELETE FROM songs WHERE id = $1 RETURNING id',
      values: [id],
    };

    try {
      const result = await this._pool.query(query);
      if (!result.rowCount) {
        throw new NotFoundError('Song gagal dihapus. Id tidak ditemukan');
      }
    } catch (error) {
      throw new NotFoundError(`Gagal menghapus song: ${error.message}`);
    }
  }
}

module.exports = SongsService;
