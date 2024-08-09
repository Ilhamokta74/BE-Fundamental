require('dotenv').config();

const Hapi = require('@hapi/hapi');
const Jwt = require('@hapi/jwt');
const ClientError = require('./ErrorHandling/ClientError');

// Services
const AlbumService = require('./services/postgres/AlbumService');
const SongService = require('./services/postgres/SongService');
const UserService = require('./services/postgres/UserService');
const AuthenticationService = require('./services/postgres/AuthenticationService');
const PlaylistService = require('./services/postgres/PlaylistServices');
const PlaylistSongActivitiesService = require('./services/postgres/PlaylistSongActivitiesService');
const CollaborationService = require('./services/postgres/CollaborationService');

// Validators
const AlbumsValidator = require('./validator/albums');
const SongsValidator = require('./validator/songs');
const UsersValidator = require('./validator/users');
const AuthenticationsValidator = require('./validator/authentications');
const PlaylistsValidator = require('./validator/playlist');
const CollaborationsValidator = require('./validator/collaborations');

// APIs
const albums = require('./api/albums');
const songs = require('./api/songs');
const users = require('./api/users');
const authentications = require('./api/authentications');
const playlists = require('./api/playlists');
const activities = require('./api/activities');
const collaborations = require('./api/collaborations');

// Token Manager
const TokenManager = require('./tokenManager/tokenManager');

const init = async () => {
  const services = {
    albumsService: new AlbumService(),
    songsService: new SongService(),
    usersService: new UserService(),
    authenticationsService: new AuthenticationService(),
    collaborationsService: new CollaborationService(),
    playlistsService: new PlaylistService(this.collaborationsService),
    activitiesService: new PlaylistSongActivitiesService(),
  };

  const server = Hapi.server({
    port: process.env.PORT || 5000, // Default port to 5000 if not set
    host: process.env.HOST || 'localhost', // Default host to 'localhost' if not set
    routes: {
      cors: {
        origin: ['*'],
      },
    },
  });

  await server.register([{ plugin: Jwt }]);

  server.auth.strategy('openmusic_jwt', 'jwt', {
    keys: process.env.ACCESS_TOKEN_KEY,
    verify: {
      aud: false,
      iss: false,
      sub: false,
      maxAgeSec: process.env.ACCESS_TOKEN_AGE,
    },
    validate: (artifacts) => ({
      isValid: true,
      credentials: { id: artifacts.decoded.payload.id },
    }),
  });

  const plugins = [
    { plugin: albums, options: { service: services.albumsService, validator: AlbumsValidator } },
    { plugin: songs, options: { service: services.songsService, validator: SongsValidator } },
    { plugin: users, options: { service: services.usersService, validator: UsersValidator } },
    {
      plugin: authentications,
      options: {
        authenticationsService: services.authenticationsService,
        usersService: services.usersService,
        tokenManager: TokenManager,
        validator: AuthenticationsValidator,
      },
    },
    {
      plugin: playlists,
      options: {
        playlistsService: services.playlistsService,
        songsService: services.songsService,
        activitiesService: services.activitiesService,
        validator: PlaylistsValidator,
      },
    },
    {
      plugin: activities,
      options: {
        playlistsService: services.playlistsService,
        activitiesService: services.activitiesService,
      },
    },
    {
      plugin: collaborations,
      options: {
        collaborationsService: services.collaborationsService,
        playlistsService: services.playlistsService,
        usersService: services.usersService,
        validator: CollaborationsValidator,
      },
    },
  ];

  await server.register(plugins);

  server.ext('onPreResponse', (request, h) => {
    const { response } = request;
    if (response instanceof Error) {
      if (response instanceof ClientError) {
        return h.response({
          status: 'fail',
          message: response.message,
        }).code(response.statusCode);
      }

      if (!response.isServer) return h.continue;

      return h.response({
        status: 'error',
        message: 'Internal server error',
      }).code(500);
    }
    return h.continue;
  });

  await server.start();
  console.log(`Server running at ${server.info.uri}`);
};

init();
