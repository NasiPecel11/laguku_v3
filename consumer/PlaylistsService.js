const { Pool } = require("pg");

class PlaylistsService {
  constructor() {
    this._pool = new Pool();
  }

  async getPlaylist(id) {
    const query = {
      text: `SELECT playlists.id, playlists.name, JSON_AGG(JSON_BUILD_OBJECT('id', songs.id, 'title', songs.title, 'performer', songs.performer)) as songs FROM playlists 
      LEFT JOIN collaborations ON collaborations.playlist_id = $1
      LEFT JOIN playlist_songs ON playlist_songs.playlist_id = $1
      LEFT JOIN songs ON playlist_songs.song_id = songs.id
      WHERE playlists.id = $1
      OR collaborations.playlist_id = playlists.id
      OR playlist_songs.playlist_id = playlists.id
      GROUP BY playlists.id`,
      values: [id],
    };
    const result = await this._pool.query(query);
    return result.rows[0];
  }
}

module.exports = PlaylistsService;
