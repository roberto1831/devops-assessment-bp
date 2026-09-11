const { z } = require('zod');

const devopsSchema = z.object({
  message: z.string(),
  to: z.string(),
  from: z.string(),
  timeToLifeSec: z.number().int().positive(),
});

module.exports = devopsSchema;