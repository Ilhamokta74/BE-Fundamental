const { Pool } = require('pg');
const { nanoid } = require('nanoid');
const InvariantError = require('../../ErrorHandling/InvariantError');
const NotFoundError = require('../../ErrorHandling/NotFoundError');
const AuthorizationError = require('../../ErrorHandling/AuthorizationError');

class PlaylistService {
  constructor(collaborationsService) {
    this._pool = new Pool();
    this._collaborationsService = collaborationsService;
  }

  async addPlaylist({ name, owner }) {
    const id = `playlist-${nanoid(16)}`;
    const query = {
      text: 'INSERT INTO playlists(id, name, owner) VALUES ($1, $2, $3) RETURNING id',
      values: [id, name, owner],
    };

    const result = await this._pool.query(query);

    if (!result.rowCount) {
      throw new InvariantError('Failed to add playlist.');
    }

    return result.rows[0].id;
  }

  async getPlaylists(owner) {
    const query = {
      text: `SELECT playlists.id, playlists.name, users.username 
             FROM playlists
             LEFT JOIN users ON users.id = playlists.owner
             LEFT JOIN collaborations ON collaborations.playlist_id = playlists.id
             WHERE playlists.owner = $1 OR collaborations.user_id = $1
             GROUP BY playlists.id, playlists.name, users.username
             ORDER BY playlists.id`,
      values: [owner],
    };

    const result = await this._pool.query(query);
    return result.rows;
  }

  async deletePlaylistById(id) {
    const query = {
      text: 'DELETE FROM playlists WHERE id = $1 RETURNING id',
      values: [id],
    };

    const result = await this._pool.query(query);

    if (!result.rowCount) {
      throw new NotFoundError('Failed to delete playlist. Id not found.');
    }
  }

  async addPlaylistSong(playlistId, songId) {
    const id = `playlist-song-${nanoid(16)}`;
    const query = {
      text: 'INSERT INTO playlist_songs(id, playlist_id, song_id) VALUES ($1, $2, $3) RETURNING id',
      values: [id, playlistId, songId],
    };

    const result = await this._pool.query(query);

    if (!result.rowCount) {
      throw new InvariantError('Failed to add song to playlist.');
    }
  }

  async getPlaylistSongById(playlistId) {
    const query = {
      text: `SELECT playlists.id, playlists.name, users.username 
             FROM playlists
             LEFT JOIN users ON playlists.owner = users.id 
             WHERE playlists.id = $1`,
      values: [playlistId],
    };

    const songQuery = {
      text: `SELECT songs.id, songs.title, songs.performer 
             FROM playlist_songs 
             JOIN songs ON songs.id = playlist_songs.song_id 
             WHERE playlist_songs.playlist_id = $1`,
      values: [playlistId],
    };

    const playlistResult = await this._pool.query(query);
    const songsResult = await this._pool.query(songQuery);

    if (!playlistResult.rowCount) {
      throw new NotFoundError('Playlist not found.');
    }

    const playlist = playlistResult.rows[0];
    return {
      id: playlist.id,
      name: playlist.name,
      username: playlist.username,
      songs: songsResult.rows,
    };
  }

  async deletePlaylistSong(playlistId, songId) {
    const query = {
      text: 'DELETE FROM playlist_songs WHERE playlist_id = $1 AND song_id = $2 RETURNING id',
      values: [playlistId, songId],
    };

    const result = await this._pool.query(query);

    if (!result.rowCount) {
      throw new InvariantError('Failed to remove song from playlist.');
    }
  }

  async verifyPlaylistOwner(playlistId, userId) {
    const query = {
      text: 'SELECT owner FROM playlists WHERE id = $1',
      values: [playlistId],
    };

    const result = await this._pool.query(query);

    if (!result.rowCount) {
      throw new NotFoundError('Playlist not found.');
    }

    const { owner } = result.rows[0];
    if (owner !== userId) {
      throw new AuthorizationError('You do not have access to this playlist.');
    }
  }

  async verifyPlaylistAccess(playlistId, userId) {
    try {
      await this.verifyPlaylistOwner(playlistId, userId);
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      try {
        await this._collaborationsService.verifyCollaborator(playlistId, userId);
      } catch {
        throw new AuthorizationError('You do not have access to this playlist.');
      }
    }
  }
}

module.exports = PlaylistService;
