# Google Cloud Images Testing Env
Provides a way to set and reset images in a bucket for testing purposes.
## Setup
Google credentials must be set in environment variables.
## Usage
The images on the development image bucket can be restored to the default test set by running the reset_images script.
```bash
./reset_images.sh
```
