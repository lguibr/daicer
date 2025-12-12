export default [
  'strapi::logger',
  'strapi::errors',
  'strapi::security',
  'strapi::cors',
  'strapi::poweredBy',
  'strapi::query',
  {
    name: 'strapi::body',
    config: {
      formLimit: '50mb', // increase limit
      jsonLimit: '50mb',
      textLimit: '50mb',
      formidable: {
        maxFileSize: 50 * 1024 * 1024, // 50MB
      },
    },
  },
  'strapi::session',
  'strapi::favicon',
  'strapi::public',
];
