## Populate container with previous data

Export data: `mysqldump -u root -p --databases pisspricer > dump.sql`

Move the dump.sql into the ./populate-data directory.

Start the docker container: `sudo docker-compose up -d`

Connect to the containers shell: `sudo docker exec -it api_db_1 bash`

Populate the data (takes 20 seconds): `mysql -p < populate-data/dump.sql`



## Environment

A `.env` needs to be created in the Docker directroy.

A gcloud json key needs to be provided in the ./keys and specified in the .env file.