require('dotenv').config();

const Hapi = require('@hapi/hapi');

const albums = require('./api/albums');
const AlbumsService = require('./services/postgres/AlbumService');
const AlbumsValidator = require('./validator/albums');

const songs = require('./api/songs');
const SongsService = require('./services/postgres/SongService');
const SongsValidator = require('./validator/songs');

const ClientError = require('./ErrorHandling/ClientError');

const init = async () => {
  const albumsService = new AlbumsService();
  const songsService = new SongsService();

  const server = Hapi.server({
    port: process.env.PORT || 9000, // Default port to 5000 if not set
    host: process.env.HOST || 'localhost', // Default host to 'localhost' if not set
    routes: {
      cors: {
        origin: ['*'],
      },
    },
  });

  try {
    await server.register([
      {
        plugin: albums,
        options: {
          service: albumsService,
          validator: AlbumsValidator,
          service2: songsService,
        },
      },
      {
        plugin: songs,
        options: {
          service: songsService,
          validator: SongsValidator,
        },
      },
    ]);

    server.ext('onPreResponse', (request, h) => {
      const { response } = request;

      if (response instanceof ClientError) {
        const newResponse = h.response({
          status: 'fail',
          message: response.message,
        });
        newResponse.code(response.statusCode);
        return newResponse;
      }

      return h.continue;
    });

    await server.start();
    console.log(`Server berjalan pada ${server.info.uri}`);
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1); // Exit with a failure code
  }

  process.on('unhandledRejection', (err) => {
    console.error(err);
    process.exit(1); // Exit with a failure code
  });
};

init();
