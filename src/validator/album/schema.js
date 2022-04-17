const Joi = require("joi");

const currentYear = new Date().getFullYear();

const AlbumPayloadSchema = Joi.object({
  name: Joi.string().required(),
  year: Joi.number().integer().min(1900).max(currentYear).required(),
});

const AlbumImagePayloadSchema = Joi.object({
  "content-type": Joi.string()
    .valid(
      "image/apng",
      "image/gif",
      "image/avif",
      "image/jpeg",
      "image/svg+xml",
      "image/png",
      "image/webp"
    )
    .required(),
}).unknown();

module.exports = { AlbumPayloadSchema, AlbumImagePayloadSchema };
