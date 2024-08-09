const mapDBToModelSong = ({
  id,
  title,
  performer,
}) => ({
  id,
  title,
  performer,
});

const mapDBToModelSongDetail = ({
  id,
  title,
  year,
  genre,
  performer,
  duration,
  album_id, // This is the key name from the database
}) => ({
  id,
  title,
  year,
  genre,
  performer,
  duration,
  albumId: album_id, // Convert to camelCase for consistency
});

module.exports = { mapDBToModelSong, mapDBToModelSongDetail };
