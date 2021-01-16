const gc = require('../../config/cloud');
const bucketName = process.env.IMAGE_BUCKET;
const bucket = gc.bucket(bucketName); // should be your bucket name

/**
 *
 * @param { File } object file object that will be uploaded
 * @description - This function does the following
 * - It uploads a file to the image bucket on Google Cloud
 * - It accepts an object as an argument with the
 *   "originalname" and "buffer" as keys
 */

exports.uploadImage = (file, folderPath) => new Promise((resolve, reject) => {
    const { originalname, buffer } = file

    const blob = bucket.file(`${folderPath}${originalname}.jpeg`);
    const blobStream = blob.createWriteStream({
        resumable: false
    });
    blobStream.on('finish', () => {
        const publicUrl = `https://storage.googleapis.com/${bucket.name}/${blob.name}`;
        resolve(publicUrl)
    })
        .on('error', () => {
            reject(`Unable to upload image, something went wrong`)
        })
        .end(buffer)
});

exports.deleteImage = (sku, ignoreNotFound=false) => new Promise((resolve, reject) => {
    const file = bucket.file(`items/${sku}.jpeg`);
    file.delete({ignoreNotFound: ignoreNotFound})
        .then(function(data) {
            const apiResponse = data[0];
            resolve(apiResponse)
        })
        .catch((err) => {
            if (err.code === 404 && ignoreNotFound) {
                resolve()
            }
            reject(err)
        });
});

// TODO Add delete method, then add to delete items and brands methods
