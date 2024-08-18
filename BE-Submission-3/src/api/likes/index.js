const AlbumLikeHandler = require('./handler');
const routes = require('./routes');

module.exports = {
  name: 'albumLikes',
  version: '1.0.0',
  register: async (server, { service, albumsService }) => {
    const albumLikesHandler = new AlbumLikeHandler(service, albumsService);
    server.route(routes(albumLikesHandler));
  },
};
