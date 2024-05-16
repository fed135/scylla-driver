# ScyllaDB Node.js Driver

## Work in progress - do not use!

---

**Disclaimer** I am not associated in any way with [ScyllaDB](https://github.com/scylladb) or [Datastax](https://github.com/datastax).

Loosely based on the current [datastax cassandra driver](https://github.com/datastax/nodejs-driver), it focuses on performance and a clean interface.

---

## Install

```bash
$ npm install scylladb
```


## Usage

### Connecting

```javascript
const scylladb = require('scylladb');
const client = scylladb.createClient({
  hosts: ['0.0.0.0', '0.0.0.1'],
  keyspace: 'ks1'
});
```

**Options**

Fields | Description
--- | ---
hosts | List of hosts to connect to. Can be an IP, a fqdn or a unix socket (required)
keyspace | The keyspace to select (required)

### Querying

Querying has been streamlined to now only return a Promise.

```javascript
// Simple statements
client.query('SELECT * FROM users')
  .then(result => console.log(`User with email ${result.rows[0].email}`));

// Automatically detects prepared steatements
client.query('SELECT name, email FROM users WHERE key = ?', [ 'someone' ])
  .then(result => console.log(`User with email ${result.rows[0].email}`));
```

### Row streaming

It can be **piped** downstream and provides automatic pause/resume logic (it buffers when not read).

```javascript
const stream = client.stream('SELECT time, val FROM temperature WHERE station_id=', [ 'abc' ]);

stream.on('row', (row) => {
  stream.pause();
  console.log(`time ${row.time} and value ${row.value}`);
  stream.resume();
});

stream.on('end', () => console.log('stream ended')); 
stream.on('error', err => console.log(`Error: ${err}`));
```


## Logging

ScyllaDB driver uses [debug](https://github.com/visionmedia/debug)

```
DEBUG=scylladb:<level>
```

The `level` being passed to debug can be `verbose`, `info`, `warning` or `error`. If no level is specified, the default setting is `warning`.


## Contribute

I am always looking for maintainers. Reach out to me to get involved. 

## Tests

### Requirements
Once you have a database setup with a keyspace named "test" and a table "users".  
Help can be found in the [wiki](https://github.com/fed135/scylla-driver/wiki).

### Usage
Tests can be run with:

```bash
npm run test
```

## License 

[Apache 2.0](LICENSE) (c) 2017-2024 Frederic Charette
