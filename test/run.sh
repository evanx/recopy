
(
  set -u -e -x
  mkdir -p tmp
  mkdir -p $HOME/volumes/refile/
  for name in refile-redis refile-app refile-decipher refile-encipher
  do
    if docker ps -a -q -f "name=/$name" | grep '\w'
    then
      docker rm -f `docker ps -a -q -f "name=/$name"`
    fi
  done
  sleep 1
  if docker network ls -q -f name=^refile-network | grep '\w'
  then
    docker network rm refile-network
  fi
  docker network create -d bridge refile-network
  redisContainer=`docker run --network=refile-network \
      --name refile-redis -d redis`
  redisHost=`docker inspect $redisContainer |
      grep '"IPAddress":' | tail -1 | sed 's/.*"\([0-9\.]*\)",/\1/'`
  dd if=/dev/urandom bs=32 count=1 > $HOME/volumes/refile/spiped-keyfile
  decipherContainer=`docker run --network=refile-network \
    --name refile-decipher -v $HOME/volumes/refile/spiped-keyfile:/spiped/key:ro \
    -d spiped \
    -d -s "[0.0.0.0]:6444" -t "[$redisHost]:6379"`
  decipherHost=`docker inspect $decipherContainer |
    grep '"IPAddress":' | tail -1 | sed 's/.*"\([0-9\.]*\)",/\1/'`
  encipherContainer=`docker run --network=refile-network \
    --name refile-encipher -v $HOME/volumes/refile/spiped-keyfile:/spiped/key:ro \
    -d spiped \
    -e -s "[0.0.0.0]:6333" -t "[$decipherHost]:6444"`
  encipherHost=`docker inspect $encipherContainer |
    grep '"IPAddress":' | tail -1 | sed 's/.*"\([0-9\.]*\)",/\1/'`
  redis-cli -h $encipherHost -p 6333 set user:evanxsummers '{"twitter":"evanxsummers"}'
  redis-cli -h $encipherHost -p 6333 lpush refile:key:q user:evanxsummers
  redis-cli -h $encipherHost -p 6333 llen refile:key:q
  appContainer=`docker run --name refile-app -d \
    --network=refile-network \
    -v $HOME/tmp/volumes/refile/data:/data \
    -e host=$encipherHost \
    -e port=6333 \
    evanxsummers/refile`
  sleep 2
  redis-cli -h $encipherHost -p 6333 llen refile:key:q
  docker logs $appContainer
  find ~/volumes/refile/data | grep '.gz$'
  zcat `find ~/volumes/refile/data | grep '.gz$' | tail -1` | jq
  docker rm -f refile-redis refile-app refile-decipher refile-encipher
  docker network rm refile-network
)
