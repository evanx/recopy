
  user=`
    docker info 2>/dev/null | 
    grep ^Username | 
    sed 's/Username: \(.*\)/\1/'
  `
  docker build -t refile https://github.com/evanx/refile.git
  docker tag refile $user/refile
  docker push $user/refile
