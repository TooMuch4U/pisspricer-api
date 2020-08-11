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

// TODO Add delete method, then add to delete items and brands methods