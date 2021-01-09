docker rm $(docker stop $(docker ps -a -q --filter ancestor=my-data-image --format="{{.ID}}"))
./start.sh
