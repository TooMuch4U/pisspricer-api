# Database Testing Environment
A testing environment for Pisspricer database.
Most of this code is slightly modified the docker mysql source code, to set lower_case_table_names=1 when initialising.
Each time the container is built, the database backup is copied into the image.

## Setup
```bash
docker-compose build```

## Updating Data
The container data can be updated with the following.
1. Start the container as above, and modify the data to the desired state.
    ```bash
    ./start.sh
    ```
2. Create an archive of the database
    ```bash
    docker exec -it pisspricer-db tar czvf /mysql_data.tar.gz /var/lib/mysql
    ```
3. Copy the backup back to the host machine
    ```bash
    docker cp pisspricer-db:/mysql_data.tar.gz .
    ```
