const autoBind = require('auto-bind');

class AlbumLikeHandler {
  constructor(service, albumsService) {
    this._service = service;
    this._albumsService = albumsService;
    autoBind(this);
  }

  async postAlbumLikeHandler(request, h) {
    const { id } = request.params;
    const { id: credentialId } = request.auth.credentials;

    await this._albumsService.getAlbumById(id);
    await this._service.verifyAlbumLiked(id, credentialId);
    await this._service.addLike(id, credentialId);

    const response = h.response({
      status: 'success',
      message: 'Album disukai',
    });
    response.code(201);
    return response;
  }

  async getAlbumLikeByIdHandler(request, h) {
    const { id } = request.params;

    await this._albumsService.getAlbumById(id);
    const { likes, cached } = await this._service.getLike(id);

    const response = h.response({
      status: 'success',
      data: {
        likes,
      },
    });
    response.code(200);
    if (cached) {
      response.header('X-Data-Source', 'cache');
    }
    return response;
  }

  async deleteAlbumLikeByIdHandler(request, h) {
    const { id } = request.params;
    const { id: credentialId } = request.auth.credentials;

    await this._service.deleteLike(id, credentialId);

    const response = h.response({
      status: 'success',
      message: 'Batal menyukai album',
    });
    response.code(200);
    return response;
  }
}

module.exports = AlbumLikeHandler;
