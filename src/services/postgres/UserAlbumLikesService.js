const { Pool } = require("pg");
const { nanoid } = require("nanoid");
const InvariantError = require("../../exceptions/InvariantError");
const NotFoundError = require("../../exceptions/NotFoundError");

class UserAlbumLikesService {
  constructor(cacheService) {
    this._pool = new Pool();
    this._cacheService = cacheService;
  }

  async addUserAlbumLikes(userId, albumId) {
    const id = `likes-${nanoid(16)}`;

    const query = {
      text: "INSERT INTO user_album_likes VALUES($1, $2, $3) RETURNING id",
      values: [id, userId, albumId],
    };
    const result = await this._pool.query(query);
    if (!result.rows[0].id) {
      throw new NotFoundError("Likes gagal ditambahkan");
    }

    return result.rows[0].id;
  }

  async deleteUserAlbumLikes(userId, albumId) {
    const query = {
      text: "DELETE FROM user_album_likes WHERE user_id = $1 AND album_id = $2 RETURNING id",
      values: [userId, albumId],
    };
    const result = await this._pool.query(query);
    if (!result.rows[0].id) {
      throw new NotFoundError("Gagal hapus like");
    }

    await this._cacheService.delete(`album-id-likes:${albumId}`);

    return result.rows[0].id;
  }

  async verifyLikes(userId, albumId) {
    const query = {
      text: 'SELECT user_id FROM user_album_likes WHERE user_id = $1 AND album_id = $2',
      values: [userId, albumId],
    };

    const result = await this._pool.query(query);

    return result.rowCount ? true : false;
  }

  async getUserAlbumLikesById(id) {
    try {
      const likes = await this._cacheService.get(`album-id-likes:${id}`);
      return { likes: JSON.parse(likes), cache: true };
    } catch (error) {
      const query = {
        text: "SELECT COUNT(*)::int as likes FROM user_album_likes WHERE album_id = $1",
        values: [id],
      };

      const result = await this._pool.query(query);

      if (!result.rows.length) {
        throw new InvariantError("Likes tidak ada");
      }

      await this._cacheService.set(
        `album-id-likes:${id}`,
        JSON.stringify(result.rows[0])
      );

      return { likes: result.rows[0], cache: false };
    }
  }
}

module.exports = UserAlbumLikesService;
