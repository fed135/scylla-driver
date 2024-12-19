echo "Shutting down existing containers"

docker rm -f scylla-node1
docker rm -f scylla-node2
docker rm -f scylla-node3

echo "Spinning up new containers"

docker run --name scylla-node1 --hostname scylla-node1 -p 9042:9042 -d scylladb/scylla --reactor-backend=epoll
docker run --name scylla-node2  --hostname scylla-node2 -p 9043:9042 -d scylladb/scylla --reactor-backend=epoll --seeds="$(docker inspect --format='{{ .NetworkSettings.IPAddress }}' scylla-node1)"
docker run --name scylla-node3  --hostname scylla-node3 -p 9044:9042 -d scylladb/scylla --reactor-backend=epoll --seeds="$(docker inspect --format='{{ .NetworkSettings.IPAddress }}' scylla-node1)"

echo "Waiting for database cluster to be ready"

sleep 10

echo "Initializing cluster"

node test/init-db.js