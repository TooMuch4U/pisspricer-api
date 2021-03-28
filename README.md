# Pisspricer Web API
![Deploy to Production](https://github.com/TooMuch4U/pisspricer-api/workflows/Deploy%20to%20production/badge.svg)

A Node.js Express web api used for Pisspricer. 
The api is currently deployed at [api.pisspricer.co.nz](https://api.pisspricer.co.nz).

# Requirements
- Node.js
- npm

# Install / Setup
1. Clone the repository.
	```bash
	git clone https://github.com/TooMuch4U/pisspricer-api
	```
2. Install npm dependencies.
    ```bash
    # Change into the src directory
    cd api
    
    # Install npm dependencies
    npm install
	```
3. Set the following environment variables.
    ```
    MYSQL_HOST=
    MYSQL_USER=
    MYSQL_PASSWORD=
    MYSQL_DATABASE=
    MYSQL_PORT=
    IMAGE_BUCKET=
    BUCKET_KEY_PATH=
    OPEN_PORT=
    EMAIL_HOST=
    EMAIL_USER=
    EMAIL_PASSWORD=
    EMAIL_ADDRESS=
	```
### HTTPS
To enable https aswell as http...
1. Set an `OPEN_PORT_HTTPS` environment variable to the desired https port.
2. Place the ssl certificate named `cert.pem` and the key named `key.pem` in the directory (/api).

# Usage
Start the api server with
```bash
npm start
```

