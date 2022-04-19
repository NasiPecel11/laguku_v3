const mapDBToModel = ({
  id,
  name,
  year,
  cover,
  songs,
  created_at,
  updated_at,
}) => ({
  id,
  name,
  year,
  coverUrl: cover ? cover : null,
  songs,
  createdAt: created_at,
  updatedAt: updated_at,
});

module.exports = { mapDBToModel };
