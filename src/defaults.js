/**
 * Default configs
 */

/* Exports -------------------------------------------------------------------*/

module.exports = {
  hosts: [],
  port: 9042,
  workers: 10,
  policies: {
    loadBalancing: 'DCAwareRoundRobinPolicy',
    reconnection: 'ExponantialReconnect',
  },
  queryOptions: {
    consistency: 'LocalOne',
    limit: 5000,
    prepare: false
  },
  authProvider: null,
  maxPrepared: 50000,
  refreshSchemaDelay: 1000,
  isMetadataSyncEnabled: true
};