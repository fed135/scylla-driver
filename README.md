# ScyllaDB Node.js Driver

## Work in progress - do not use!

---

**Disclaimer** I am not associated in any way with [ScyllaDB](https://github.com/scylladb) or [Datastax](https://github.com/datastax).

---

## Install

```bash
$ npm install scylladb
```


## Usage

- [API documentation](https://github.com/fed135/scylla-driver/wiki/API-Documentation)

### Connecting

```typescript
import {createClient} from 'scylladb';

const client = createClient({
  hosts: ['0.0.0.0', '0.0.0.1'],
  keyspace: 'ks1'
});
```

### Querying

Query methods return a **Promise**.

```typescript
// Simple statements
client.query('SELECT * FROM users')
  .then(result => console.log(`User with email ${result.rows[0].email}`));

// Automatically detects prepared steatements
client.query('SELECT name, email FROM users WHERE key = ?', [ 'someone' ])
  .then(result => console.log(`User with email ${result.rows[0].email}`));
```

### Row streaming

It can be **piped** downstream and provides automatic pause/resume logic (it buffers when not read).

```typescript
const stream = client.stream('SELECT time, val FROM temperature WHERE station_id=', [ 'abc' ]);

stream.on('readable', function () {
    // readable is emitted as soon a row is received and parsed
    let row;
    while (row = this.read()) {
      stream.pause();
      console.log(`time ${row.time} and value ${row.value}`);
      stream.resume();
    }
  })
  .on('end', function () {
    // emitted when all rows have been retrieved and read
  })
  .on('error', function (err) {
    console.log(`Error: ${err}`)
  });
```


## Logging

ScyllaDB driver uses the `NODE_DEBUG` environment variable.

```
NODE_DEBUG=scylladb:<priority>
```

The `priority` being passed to debug can be `info`, `warn` or `error`. If no level is specified, the default setting is `warn`.


## Tests

Once you have a database setup with a keyspace named "test" and a table "users".  

Help can be found in the [wiki](https://github.com/fed135/scylla-driver/wiki).


```bash
npm run test
```

## TODO (1.0)

- [x] Zero-copy stream reading
- [x] Refactor (figure best paradigm to reduce instantiation and complexity while preventing end-user access to internals)
- [ ] Query options (Consistency level, etc)
- [ ] Query stats / timeouts
- [ ] Cassandra types marshalling
- [x] Prepared statements
- [ ] Streaming queries/ Async iterators design
- [ ] Transactions (Batch queries)
- [x] Connection pooling and load balancing
- [ ] Host selection and sharding (Import Cassandra custom Murmur3 algo, Which scylla also uses)
- [ ] Authentication flows
- [ ] Symbol.dispose, Symbol.asyncDispose
- [ ] TLS/SSL
- [ ] User-defined functions and aggregates
- [ ] Unit tests
- [ ] Integration tests
- [ ] Benchmark comparisons with Datastax driver


## Wishlist

- [ ] Schema loading
- [ ] Dynamic types
- [ ] Query warnings (server) and static statement validation (client)
- [ ] Geospatial points


## Features from the Datastax driver that will **not** be supported

In order to keep the driver performant and reduce complexity a few choices were made to strip or replace some of the features present in the Datastax Cassandra driver.

- Address resolution
  - Must be handled in app config
- Concurrent execution
  - QueryContext can be used to bundle requests and limit bandwidth
- Datastax astra
  - This driver focuses on Scylladb, might instead develop helpers for their DBAAS
- Execution profiles
  - Must be handled in app design
- Mappers
  - Must be handled in app design
  - The library provides deep Typescript definitions and helpers to facilitate development 
- Speculative query executions
  - This introduces a lot of complexity and unecessary load (queries cannot be aborted)
  - Scylla generally has fewer and shorter gc cycles
- Query retrying
  - Must be handled in app design
- Legacy support
  - Only the 2 latest Binary protocols will be supported (4,5)

## Contribute

I am always looking for help. Reach out to get involved!

## License 

[Apache 2.0](LICENSE) (c) 2017-2026 Frederic Charette
