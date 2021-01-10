# Google Cloud Images Testing Env
Provides a way to set and reset images in a bucket for testing purposes.
## Setup
Google credentials must be set in environment variables.
## Usage
The images on the development image bucket can be restored to the default test set by running the reset_images script.
```bash
./reset_images.sh
```
This deletes the *items* and *brands* directories in the bucket, then copies everything in *bucket-state* into the root directory.
## Updating restore state
The files that will be stored onto the bucket can be changed by updating the bucket-state folder.
```bash
gsutil -m cp -R bucket-state gs://images.pisspricer.co.nz
```
