# ScyllaDB Node.js Driver

[![Kalm](https://img.shields.io/npm/v/kalm.svg)](https://www.npmjs.com/package/kalm)
[![Node](https://img.shields.io/badge/node->%3D4.0-blue.svg)](https://nodejs.org)
[![Build Status](https://travis-ci.org/fed135/scylladb.svg?branch=master)](https://travis-ci.org/fed135/scylladb)

---

**Disclaimer** I am not associated in any way with [ScyllaDB](https://github.com/scylladb) or [Datastax](https://github.com/datastax).
Just a guy in need of a good solution to his problems.

Loosely based on the current [datastax cassandra driver](https://github.com/datastax/nodejs-driver), it focuses on performance and a cleaner interface.

---

## Install

```bash
$ npm install scylladb
```


## Usage

### Connecting

Creating a client will spawn multiple forks to allow for more paralel work.

```javascript
const scylladb = require('scylladb');
const client = scylladb.createClient({
  hosts: ['0.0.0.0', '/tmp/scylla.socket'],
  keyspace: 'ks1'
});
```

**Options**

Fields | Description
--- | ---
hosts | List of hosts to connect to. Can be an IP, a fqdn or a unix socket (required)
keyspace | The keyspace to select (required)
forks | The number of workers to spawn (default: 10) 

### Querying

Querying has been streamlined to now only return a Promise or a Stream.

```javascript
client.execute('SELECT name, email FROM users WHERE key = ?', [ 'someone' ], { prepare: true })
  .then(result => console.log(`User with email ${result.rows[0].email}`));
```

### Row streaming

It can be **piped** downstream and provides automatic pause/resume logic (it buffers when not read).

```javascript
client.stream('SELECT time, val FROM temperature WHERE station_id=', [ 'abc' ])
  .on('readable', (rows) {
    rows.forEach(row => console.log(`time ${row.time} and value ${row.value}`));
  })
  .on('end', () => console.log('stream ended')); 
  .on('error', err => console.log(`Error: ${err}`));
```


## Logging

ScyllaDB driver uses [debug](https://github.com/visionmedia/debug)

```
DEBUG=scylladb:* 
```

The `level` being passed to debug can be `verbose`, `info`, `warning` or `error`.


## Contribute

I am always looking for maintainers. Reach out to me to get involved. 


## License 

[Apache 2.0](LICENSE) (c) 2017 Frederic Charette
