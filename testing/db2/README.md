# Database Testing Environment
A testing environment for Pisspricer database.
Most of this code is slightly modified the docker mysql source code, to set lower_case_table_names=1 when initialising.
Each time the container is built, the database backup is copied into the image.

## Setup
Before the db can be started, the docker image must be built.
```bash
docker-compose build
```

## Usage / Workflow
1. Start the database
    ```bash
    ./start.sh
    ```
2. Do any testing ...
3. Reset the database state
   ```bash
   ./restart.sh
   ```
4. Repeat steps 2 & 3 until testing is finished. 
Then stop the database instance.
    ```bash
    ./stop.sh
   ```

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
4. Build the container
    ```bash
    docker-compose build
    ```
