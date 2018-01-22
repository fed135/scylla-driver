/**
 * Default configs
 */

/* Exports -------------------------------------------------------------------*/

module.exports = {
  hosts: [],
  port: 9042,
  connections: {
    local: 10,
    remote: 0
  },
  queryOptions: {
    consistency: 'localOne',
    limit: 1000,
    prepare: false
  },
  compression: null,
  cqlVersion: '3.0.0',
  maxPrepared: 5000,
  /*refreshSchemaDelay: 1000,
  isMetadataSyncEnabled: true
  */
};