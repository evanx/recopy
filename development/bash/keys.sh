
  redis-cli keys 'refile:*'
  for key in `redis-cli keys 'refile:*:s'`
  do
    echo $key
    redis-cli smembers $key
    echo
  done
  for key in `redis-cli keys 'refile:*:h'`
  do
    echo $key
    redis-cli hgetall $key
    echo
  done
  for key in `redis-cli keys 'refile:*:z'`
  do
    echo $key
    redis-cli zrange $key 0 10 withscores
    echo
  done
