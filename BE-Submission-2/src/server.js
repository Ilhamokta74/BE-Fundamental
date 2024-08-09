require('dotenv').config();

const Hapi = require('@hapi/hapi');
const Jwt = require('@hapi/jwt');
const ClientError = require('./exceptions/ClientError');

const albums = require('./api/albums');
const AlbumsValidator = require('./validator/albums');
const AlbumService = require('./services/postgres/AlbumService');

const songs = require('./api/songs');
const SongsValidator = require('./validator/songs');
const SongService = require('./services/postgres/SongService');

const users = require('./api/users');
const UsersValidator = require('./validator/users');
const UserService = require('./services/postgres/UserService');

const authentications = require('./api/authentications');
const AuthenticationsValidator = require('./validator/authentications');
const TokenManager = require('./tokenize/TokenManager');
const AuthenticationService = require('./services/postgres/AuthenticationService');

const playlists = require('./api/playlists');
const PlaylistsValidator = require('./validator/playlist');
const PlaylistService = require('./services/postgres/PlaylistServices');

const activities = require('./api/activities');
const PlaylistSongActivitiesService = require('./services/postgres/PlaylistSongActivitiesService');

const collaborations = require('./api/collaborations');
const CollaborationsValidator = require('./validator/collaborations');
const CollaborationService = require('./services/postgres/CollaborationService');

const init = async () => {
  const albumsService = new AlbumService();
  const songsService = new SongService();
  const usersService = new UserService();
  const authenticationsService = new AuthenticationService();
  const collaborationsService = new CollaborationService();
  const playlistsService = new PlaylistService(collaborationsService);
  const activitiesService = new PlaylistSongActivitiesService();

  const server = Hapi.server({
    port: process.env.PORT || 5000, // Default port to 5000 if not set
    host: process.env.HOST || 'localhost', // Default host to 'localhost' if not set
    routes: {
      cors: {
        origin: ['*'],
      },
    },
  });

  await server.register([
    {
      plugin: Jwt,
    },
  ]);

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
      credentials: {
        id: artifacts.decoded.payload.id,
      },
    }),
  });

  await server.register([
    {
      plugin: albums,
      options: {
        service: albumsService,
        validator: AlbumsValidator,
      },
    },
    {
      plugin: songs,
      options: {
        service: songsService,
        validator: SongsValidator,
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
      plugin: playlists,
      options: {
        playlistsService,
        songsService,
        activitiesService,
        validator: PlaylistsValidator,
      },
    },
    {
      plugin: activities,
      options: {
        playlistsService,
        activitiesService,
      },
    },
    {
      plugin: collaborations,
      options: {
        collaborationsService,
        playlistsService,
        usersService,
        validator: CollaborationsValidator,
      },
    },
  ]);

  server.ext('onPreResponse', (request, h) => {
    const { response } = request;
    if (response instanceof Error) {
      if (response instanceof ClientError) {
        const newResponse = h.response({
          status: 'fail',
          message: response.message,
        });
        newResponse.code(response.statusCode);
        return newResponse;
      }
      if (!response.isServer) {
        return h.continue;
      }
      const newResponse = h.response({
        status: 'error',
        message: 'Internal server error',
      });
      newResponse.code(500);
      return newResponse;
    }
    return h.continue;
  });

  await server.start();
  console.log(`Server running at ${server.info.uri}`);
};

init();
