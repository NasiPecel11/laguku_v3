const ClientError = require("../../exceptions/ClientError");

class UserAlbumLikesHandler {
  constructor(service, albumService) {
    this._service = service;
    this._albumService = albumService;

    this.postAlbumLikesHandler = this.postAlbumLikesHandler.bind(this);
    this.getAlbumLikesByIdHandler = this.getAlbumLikesByIdHandler.bind(this);
  }

  async postAlbumLikesHandler(request, h) {
    try {
      const { id } = request.params;
      const { id: credentialId } = request.auth.credentials;

      var message = "";
      if (await this._service.verifyLikes(credentialId, id)) {
        await this._albumService.verifyAlbum(id);
        await this._service.deleteUserAlbumLikes(credentialId, id);
        message = "Likes berhasil dihapus";
      } else {
        await this._albumService.verifyAlbum(id);
        await this._service.addUserAlbumLikes(credentialId, id);
        message = "Likes berhasil ditambahkan";
      }

      const response = h.response({
        status: "success",
        message: message,
      });
      response.code(201);
      return response;
    } catch (error) {
      if (error instanceof ClientError) {
        const response = h.response({
          status: "fail",
          message: error.message,
        });
        response.code(error.statusCode);
        return response;
      }

      // Server ERROR!
      const response = h.response({
        status: "error",
        message: "Maaf, terjadi kegagalan pada server kami.",
      });
      response.code(500);
      console.error(error);
      return response;
    }
  }

  async getAlbumLikesByIdHandler(request, h) {
    try {
      const { id } = request.params;

      await this._albumService.verifyAlbum(id);

      const data = await this._service.getUserAlbumLikesById(id);

      const response = h.response({
        status: "success",
        data: data.likes,
      });
      if (data.cache === true) {
        response.header("X-Data-Source", "cache");
      }
      return response;
    } catch (error) {
      if (error instanceof ClientError) {
        const response = h.response({
          status: "fail",
          message: error.message,
        });
        response.code(error.statusCode);
        return response;
      }

      // Server ERROR!
      const response = h.response({
        status: "error",
        message: "Maaf, terjadi kegagalan pada server kami.",
      });
      response.code(500);
      console.error(error);
      return response;
    }
  }
}

module.exports = UserAlbumLikesHandler;
