const Cloud = require('@google-cloud/storage');
const path = require('path');
const serviceKey = process.env.BUCKET_KEY_PATH;
// const serviceKey = path.join(__dirname, `../${keyPath}`);
// const serviceKey = process.env.BUCKET_KEY;

const { Storage } = Cloud;
const storage = new Storage({
    keyFilename: serviceKey,
    projectId: 'pisspricer',
});

module.exports = storage;
