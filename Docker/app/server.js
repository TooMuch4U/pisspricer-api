require('dotenv').config();
const db = require('./config/db');
const express = require('./config/express');
const http = require('http');
const https = require('https');
const fs = require('fs');

const app = express();

const port = process.env.OPEN_PORT || 8080;
const httpsPort = process.env.OPEN_PORT_HTTPS;

// Test connection to MySQL on start-up
async function testDbConnection() {
    try {
        await db.createPool();
        await db.getPool().getConnection();
    } catch (err) {
        console.error(`Unable to connect to MySQL: ${err.message}`);
        process.exit(1);
    }
}

// TEst connection then connect
testDbConnection()
    .then(function () {

        // Start http
        let server = http.createServer(app).listen(port, function() {
            console.log(`HTTP listening on port: ${port}`);
        });

        // Check if should start https
        if (httpsPort) {
            // Get cert files
            let sslOptions = {
                key: fs.readFileSync('key.pem'),
                cert: fs.readFileSync('cert.pem')
            };

            // Start https server
            let serverHttps = https.createServer(sslOptions, app).listen(httpsPort, function () {
                console.log(`HTTPS listening on port: ${httpsPort}`);
            });
        }

    });
