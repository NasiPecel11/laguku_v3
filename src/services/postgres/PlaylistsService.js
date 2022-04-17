const { Pool } = require("pg");
const { nanoid } = require("nanoid");
const InvariantError = require("../../exceptions/InvariantError");
const NotFoundError = require("../../exceptions/NotFoundError");
const AuthorizationError = require("../../exceptions/AuthorizationError");
const { mapDBToModel } = require("../../utils/playlist");

class PlaylistsService {
  constructor(collaborationService) {
    this._pool = new Pool();
    this._collaborationService = collaborationService;
  }

  async addPlaylist(name, owner) {
    const id = `playlist-${nanoid(16)}`;

    const query = {
      text: "INSERT INTO playlists VALUES($1, $2, $3) RETURNING id",
      values: [id, name, owner],
    };

    const result = await this._pool.query(query);

    if (!result.rows[0].id) {
      throw new InvariantError("Playlist gagal ditambahkan");
    }

    return result.rows[0].id;
  }

  async getPlaylists(owner) {
    const query = {
      text: `SELECT playlists.id, playlists.name, users.username FROM playlists 
      LEFT JOIN users ON users.id = playlists.owner 
      LEFT JOIN collaborations ON collaborations.user_id = $1
      WHERE owner = $1
      OR collaborations.playlist_id = playlists.id
      GROUP BY playlists.id, users.username`,
      values: [owner],
    };

    const result = await this._pool.query(query);
    return result.rows.map(mapDBToModel);
  }

  async getPlaylistById(id) {
     const query = {
       text: `SELECT playlists.id, playlists.name, users.username, JSON_AGG(JSON_BUILD_OBJECT('id', songs.id, 'title', songs.title, 'performer', songs.performer)) as songs FROM playlists 
      LEFT JOIN users ON users.id = playlists.owner 
      LEFT JOIN collaborations ON collaborations.playlist_id = $1
      LEFT JOIN playlist_songs ON playlist_songs.playlist_id = $1
      LEFT JOIN songs ON playlist_songs.song_id = songs.id
      WHERE playlists.id = $1
      OR collaborations.playlist_id = playlists.id
      OR playlist_songs.playlist_id = playlists.id
      GROUP BY playlists.id, users.username`,
       values: [id],
     };

    const result = await this._pool.query(query);
    if (!result.rows[0].songs[0].id ) {
      throw new NotFoundError("Playlist tidak ditemukan");
    }
    return result.rows[0];
  }

  async deletePlaylistById(id) {
    const query = {
      text: "DELETE FROM playlists WHERE id = $1 RETURNING id",
      values: [id],
    };

    const result = await this._pool.query(query);

    if (!result.rows[0].id) {
      throw new InvariantError("Playlist gagal dihapus");
    }
  }

  async playlistIfExists(id) {
    const query = {
      text: `SELECT * FROM playlists
        WHERE playlists.id = $1 `,
      values: [id],
    };

    const result = await this._pool.query(query);
    if (!result.rows.length) {
      throw new NotFoundError("Playlist tidak ditemukan");
    }
  }

  async verifyPlaylistOwner(id, owner) {    
    await this.playlistIfExists(id);

    const query = {
      text: `SELECT playlists.* FROM playlists
      LEFT JOIN users ON playlists.owner = users.id  
      LEFT JOIN collaborations ON collaborations.playlist_id = playlists.id
      WHERE (playlists.owner = $2 OR collaborations.user_id = $2) AND 
      playlists.id = $1`,
      values: [id, owner],
    };
    const result = await this._pool.query(query);

    if (!result.rows[0]) {
      throw new AuthorizationError(
        "Anda bukan collaborator atau owner playlist"
      );
    }
  }

  async verifyPlaylistOwnerCollaboration(id, owner) {
    const query = {
      text: `SELECT playlists.* FROM playlists
      INNER JOIN users ON playlists.owner = users.id  
      LEFT JOIN collaborations ON collaborations.playlist_id = playlists.id
      WHERE (playlists.owner = $2 OR collaborations.user_id = $2) AND 
      playlists.id = $1`,
      values: [id, owner],
    };
    const result = await this._pool.query(query);

    if (!result.rows[0]) {
      throw new AuthorizationError(
        "Anda bukan collaborator atau owner playlist"
      );
    }
  }

  async verifyPlaylistAccess(id, userId) {
    try {
      await this.verifyPlaylistOwner(id, userId);
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      try {
        await this._collaborationService.verifyCollaborator(id, userId);
      } catch {
        throw error;
      }
    }
  }
}

module.exports = PlaylistsService;
