import * as scylla from '../';

const db = scylla.createClient({
  hosts: ['172.17.0.2'],
  workers: 2,
  keyspace: 'test'
});

// TODO: DPL: At some point setup & clean test state automatically
// language=GenericSQL
// console.log('Cleaning state');
// db.execute("DROP TABLE IF EXISTS test.users;");
// db.execute("DROP KEYSPACE IF EXISTS test;");

// console.log('Initialize state');
// db.execute("CREATE KEYSPACE test WITH replication = {'class':'SimpleStrategy', 'replication_factor': 1};");
// db.execute("CREATE TABLE test.users ( id text PRIMARY KEY, first_name text, last_name text, age int); ");

//db.execute('SELECT * FROM test.users WHERE id = 2f4c6796-9152-4881-83f0-488e23f502c2');
//client.execute('INSERT INTO test.users (id, fisrt_name, last_name, age) VALUES (' + uuid() + ', \'tom\', \'sawyer\', 99)');


const repeatCount = 2;
const loadTest = async (repeatCount: number) => {
  console.log(`Load test starting with ${repeatCount} queries...`);
  const start = Date.now();
  for (let i = 0; i <= repeatCount; i++) {
    await db.execute('SELECT * FROM test.users');
  }
  console.log(`Load test took ${Date.now() - start}ms for ${repeatCount} queries!`);

  process.exit(0);
};

loadTest(repeatCount);
