const PlaylistSongHandler = require("./handler");
const routes = require("./routes");

module.exports = {
  name: "playlistSong",
  version: "1.0.0",
  register: async (server, { service, playlistsService,songService, validator }) => {
    const playlistSongHandler = new PlaylistSongHandler(
      service,
      playlistsService,
      songService,
      validator
    );
    server.route(routes(playlistSongHandler));
  },
};
