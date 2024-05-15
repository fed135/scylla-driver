/**
 * Default configs
 */

export default {
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
  // cassandraProtocol: (auto pick from server, supports v4 and v5) // https://docs.datastax.com/en/developer/java-driver/4.0/manual/core/native_protocol/index.html 
  maxPrepared: 5000,
  /*refreshSchemaDelay: 1000,
  isMetadataSyncEnabled: true
  baseReconnectTime = 100;
  maxRetryAttempts = 10;
  */
}
