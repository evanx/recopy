
set -u -e

[ $# -eq 1 ]
home=$1

docker build -t refile https://github.com/evanx/refile.git

docker ps -q -f name=refile | xargs -r -n 1 docker rm -f

docker run --name refile -d \
  --restart unless-stopped \
  --network=host \
  -v $home/volumes/refile/data:/data \
  -e NODE_ENV=$NODE_ENV \
  -e host=localhost \
  -e expire=8 \
  -e mode=minimal \
  refile
