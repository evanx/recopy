
  rm -rf data
  echo '{"twitter": "@evanxsummers"}' | jq '.' | redis-cli -x set user:evanxsummers
  redis-cli lpush refile:key:q user:evanxsummers
  echo '[1, 2]' | jq '.' | redis-cli -x set test123
  redis-cli lpush refile:key:q test123
  echo '[1, 2, 3]' | jq '.' | redis-cli -x set test123
  echo '[1, 2, 3, 4, 5]' | jq '.' | redis-cli -x set test12345
  echo '[1, 2, 3, 4, 5, 6]' | jq '.' | redis-cli -x set test123456
  redis-cli lpush refile:key:q test123
  redis-cli lpush refile:key:q test12345
  redis-cli lpush refile:key:q test12345
  redis-cli lpush refile:key:q test123456
  node --harmony lib/index.js
