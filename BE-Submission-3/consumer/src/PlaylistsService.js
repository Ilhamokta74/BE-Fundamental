const { Pool } = require('pg');

class PlaylistsService {
  constructor() {
    this._pool = new Pool();
  }

  async getPlaylists(playlistId) {
    const query1 = {
      text: 'SELECT id, name FROM playlists WHERE id = $1',
      values: [playlistId],
    };
    const { rows: playlistInfo } = await this._pool.query(query1);

    const query2 = {
      text: 'SELECT song_id FROM playlist_songs WHERE playlist_id = $1',
      values: [playlistId],
    };
    const { rows: songIds } = await this._pool.query(query2);

    const playlistSongs = await Promise.all(Object.values(songIds).map(async (song) => {
      const query3 = {
        text: 'SELECT id, title, performer FROM songs WHERE id = $1',
        values: [song.song_id],
      };
      const result = await this._pool.query(query3);
      return {
        id: result.rows[0].id,
        title: result.rows[0].title,
        performer: result.rows[0].performer,
      };
    }));

    const finalResult = {
      playlist: {
        ...playlistInfo[0],
        songs: playlistSongs,
      },
    };

    return finalResult;
  }
}

module.exports = PlaylistsService;
