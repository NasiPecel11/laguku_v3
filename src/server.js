require("dotenv").config();

const Hapi = require("@hapi/hapi");
const Jwt = require("@hapi/jwt");
const Inert = require("@hapi/inert");
const path = require("path");

// Album
const album = require("./api/album");
const AlbumService = require("./services/postgres/AlbumService");
const StorageService = require("./services/storage/StorageService");
const AlbumValidator = require("./validator/album");

// Song
const song = require("./api/song");
const SongService = require("./services/postgres/SongService");
const SongValidator = require("./validator/song");

// User
const users = require("./api/users");
const UsersService = require("./services/postgres/UsersService");
const UsersValidator = require("./validator/users");

// Authentications
const authentications = require("./api/authentications");
const AuthenticationsService = require("./services/postgres/AuthenticationsService");
const TokenManager = require("./tokenize/TokenManager");
const AuthenticationsValidator = require("./validator/authentications");

// Collaborations
const collaborations = require("./api/collaborations");
const CollaborationsService = require("./services/postgres/CollaborationsService");
const CollaborationsValidator = require("./validator/collaborations");

// Playlists
const playlists = require("./api/playlists");
const PlaylistsService = require("./services/postgres/PlaylistsService");
const PlaylistsValidator = require("./validator/playlists");

// Playlists Song
const playlistSong = require("./api/playlist-song");
const PlaylistSongService = require("./services/postgres/PlaylistSongService");
const PlaylistSongValidator = require("./validator/playlist-song");

// Likes
const likes = require("./api/user-album-likes");
const UserAlbumLikesService = require("./services/postgres/UserAlbumLikesService");

// Cache Redis
const CacheService = require("./services/redis/CacheService");

// Export with Rabbit MQ
const _exports = require("./api/exports");
const ExportsService = require("./services/rabbitmq/ExportsService");
const ExportsValidator = require("./validator/exports");

const init = async () => {
  const cacheService = new CacheService();
  const albumService = new AlbumService();
  const songService = new SongService();
  const usersService = new UsersService();
  const authenticationsService = new AuthenticationsService();
  const collaborationsService = new CollaborationsService();
  const playlistsService = new PlaylistsService(collaborationsService);
  const playlistSongService = new PlaylistSongService();
  const storageService = new StorageService(
    path.resolve(__dirname, "api/album/file/images")
  );
  const userAlbumLikesService = new UserAlbumLikesService(cacheService);

  const server = Hapi.server({
    port: process.env.PORT,
    host: process.env.HOST,
    routes: {
      cors: {
        origin: ["*"],
      },
    },
  });

  await server.register([
    {
      plugin: Jwt,
    },
    {
      plugin: Inert,
    },
  ]);

  server.auth.strategy("auth_jwt", "jwt", {
    keys: process.env.ACCESS_TOKEN_KEY,
    verify: {
      aud: false,
      iss: false,
      sub: false,
      maxAgeSec: process.env.ACCESS_TOKEN_AGE,
    },
    validate: (artifacts) => ({
      isValid: true,
      credentials: {
        id: artifacts.decoded.payload.id,
      },
    }),
  });

  await server.register([
    {
      plugin: album,
      options: {
        service: albumService,
        storageService,
        validator: AlbumValidator,
      },
    },
    {
      plugin: song,
      options: {
        service: songService,
        validator: SongValidator,
      },
    },
    {
      plugin: users,
      options: {
        service: usersService,
        validator: UsersValidator,
      },
    },
    {
      plugin: authentications,
      options: {
        authenticationsService,
        usersService,
        tokenManager: TokenManager,
        validator: AuthenticationsValidator,
      },
    },
    {
      plugin: collaborations,
      options: {
        collaborationsService,
        usersService,
        playlistsService,
        validator: CollaborationsValidator,
      },
    },
    {
      plugin: playlists,
      options: {
        service: playlistsService,
        validator: PlaylistsValidator,
      },
    },
    {
      plugin: playlistSong,
      options: {
        service: playlistSongService,
        playlistsService,
        songService,
        validator: PlaylistSongValidator,
      },
    },
    {
      plugin: likes,
      options: {
        service: userAlbumLikesService,
        albumService,
        cacheService,
      },
    },
    {
      plugin: _exports,
      options: {
        service: ExportsService,
        playlistsService,
        validator: ExportsValidator,
      },
    },
  ]);

  await server.start();
  console.log(`Server berjalan pada ${server.info.uri}`);
};

init();
