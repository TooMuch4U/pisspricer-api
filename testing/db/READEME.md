# Testing Database
A msql docker container used for api testing, to provide and easy way to setup a know set of mysql.

## Setup
The tricky part here is creating that mysql_data.tar.gz file (which is just a tar.gz backup of /var/lib/mysql). We can do it like this:

1. Run your container (I'll just use mysql:latest here) with an empty database. Note that we're using a named volume and we're forwarding port 3306.

```bash
$ docker run -d --name my-mysql -v my-mysql-data:/var/lib/mysql -p 3306:3306 -e MYSQL_ROOT_PASSWORD=password mysql:latest
```

2. Set up your database. Build the schema and insert all of your test data. Let's say you have a database backup, backup.sql.

```bash
$ cat backup.sql | mysql -u root -ppassword -h 127.0.0.1
```

3. Stop the container. We don't want MySQL running. The data will remain in the named volume.
```bash
$ docker stop my-mysql
```

4. Create the backup of /var/lib/mysql. Note that we're using the same named volume.
```bash
$ docker run --rm -v my-mysql-data:/var/lib/mysql -v $(pwd):/backup mysql:latest tar czvf /backup/mysql_data.tar.gz /var/lib/mysql
```
5. Now that you have the gzipped data from /var/lib/mysql, use that in your Dockerfile. Note that we need to copy it at / because of the way we zipped it:
```bash
ADD mysql_data.tar.gz /
```
6. (See it working) Build your Dockerfile into a container image that has your data. Then run the container.

```bash
$ docker build -t my-data-image:latest .
```

## Usage

```bash
$ docker run -d -p 3306:3306 my-data-image:latest
```

Docker will automatically extract the file as part of the build. You're done. The container from the Dockerfile will always have your clean data in it. To "reset" the container, just stop it & delete the volume it was using for /var/lib/mysql.

To edit the data, repeat the process, but substitute your existing container in step 1. For step 2, make your changes. You'll produce a new mysql_data.tar.gz, which you can version control if you like. After rebuilding the Dockerfile, you can publish it under a new tag if you like.
