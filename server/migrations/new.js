'use strict';

async function hasColumn(qi, table, column) {
  const d = await qi.describeTable(table);
  return !!d[column];
}

module.exports = {
  async up(queryInterface) {
    if (await hasColumn(queryInterface, 'identity_links', 'createdAt')) {
      await queryInterface.renameColumn('identity_links', 'createdAt', 'created_at');
    }
    if (await hasColumn(queryInterface, 'identity_links', 'updatedAt')) {
      await queryInterface.renameColumn('identity_links', 'updatedAt', 'updated_at');
    }
  },
  async down(queryInterface) {
    if (await hasColumn(queryInterface, 'identity_links', 'created_at')) {
      await queryInterface.renameColumn('identity_links', 'created_at', 'createdAt');
    }
    if (await hasColumn(queryInterface, 'identity_links', 'updated_at')) {
      await queryInterface.renameColumn('identity_links', 'updated_at', 'updatedAt');
    }
  },
};
