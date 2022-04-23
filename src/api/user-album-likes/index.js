const UserAlbumLikesHandler = require("./handler");
const routes = require("./routes");

module.exports = {
  name: "userAlbumLikes",
  version: "1.0.0",
  register: async (server, { service, albumService }) => {
    const userAlbumLikesHandler = new UserAlbumLikesHandler(
      service,
      albumService
    );
    server.route(routes(userAlbumLikesHandler));
  },
};
