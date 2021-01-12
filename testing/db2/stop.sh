DOCKER_IMAGE_NAME="db"
PROCESSES=$(docker ps -a -q --filter ancestor=$DOCKER_IMAGE_NAME --format="{{.ID}}")

if ! ( [ -z "$PROCESSES" ] )
then
      docker rm $(docker stop $PROCESSES)
      echo "Stopped current MYSQL docker process"
fi
