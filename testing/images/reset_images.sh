BUCKET='images.pisspricer.co.nz'

# remove files
gsutil -m rm -r gs://$BUCKET/brands
gsutil -m rm -r gs://$BUCKET/items

# transfer correct files back
gsutil -m cp -r gs://$BUCKET/bucket-state/* gs://$BUCKET
