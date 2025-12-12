/**
 * Assets controller
 */

import { Core } from '@strapi/strapi';

export default ({ strapi }: { strapi: Core.Strapi }) => ({
  async generatePortrait(ctx) {
    try {
      const data = await strapi.service('api::assets.assets').generatePortrait(ctx.request.body);
      ctx.body = { success: true, data };
    } catch (err) {
      ctx.badRequest('Portrait generation failed', { error: err });
    }
  },

  async generateUpperBody(ctx) {
    try {
      const data = await strapi.service('api::assets.assets').generateUpperBody(ctx.request.body);
      ctx.body = { success: true, data };
    } catch (err) {
      ctx.badRequest('Upper body generation failed', { error: err });
    }
  },

  async generateFullBody(ctx) {
    try {
      const data = await strapi.service('api::assets.assets').generateFullBody(ctx.request.body);
      ctx.body = { success: true, data };
    } catch (err) {
      ctx.badRequest('Full body generation failed', { error: err });
    }
  },
});
