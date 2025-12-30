module.exports = {
  async up(knex) {
    // Check if we are using postgres
    if (knex.client.driver.name === 'postgres') {
      await knex.raw('CREATE EXTENSION IF NOT EXISTS vector');
    }
  },
  async down(knex) {
    if (knex.client.driver.name === 'postgres') {
      // We generally don't want to drop extensions in down migrations as it might break other things
      // await knex.raw('DROP EXTENSION IF EXISTS vector');
    }
  },
};
