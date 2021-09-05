## Populate container with previous data

Export data: `mysqldump -u root -p --databases pisspricer > dump.sql`

Move the dump.sql into the ./populate-data directory.

Start the docker container: `sudo docker-compose up -d`

Populate the data (takes 20 seconds): `mysql -p < populate-data/dump.sql`

Set so the user can be logged in with password:

`ALTER USER 'root' IDENTIFIED BY 'password';`

`FLUSH privileges;`

