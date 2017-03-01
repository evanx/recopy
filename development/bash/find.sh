
  ls -l `find data | grep json`
  for json in `find data | grep json$`
  do
    echo $json
    cat $json
    echo
  done
  for gz in `find data | grep json.gz$`
  do
    echo $gz
    zcat $gz
    echo
  done
