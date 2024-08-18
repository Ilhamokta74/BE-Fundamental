const UploadImageHandler = require('./handler');
const routes = require('./routes');

module.exports = {
  name: 'uploads',
  version: '1.0.0',
  register: async (server, { storageService, albumsService, validator }) => {
    const uploadImageHandler = new UploadImageHandler(storageService, albumsService, validator);
    server.route(routes(uploadImageHandler));
  },
};
