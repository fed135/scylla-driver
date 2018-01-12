/*
 * Root
 */

/* Requires ------------------------------------------------------------------*/

const defaults = require('./src/defaults');
const client = require('./src/client');

/* Methods -------------------------------------------------------------------*/

/**
 * Creates a database client 
 * @param {{ hosts: 'array', workers: 'number', keyspace: 'string' }} options The configuration for the client
 */
function createClient(options) {
  return client(options).init();
}

/* Exports -------------------------------------------------------------------*/

module.exports = {
  createClient
};
