bucket="hyper-text-production"
react-scripts build
aws s3 sync build/ s3://$bucket --acl public-read --region us-west-2 --profile hyper
aws cloudfront create-invalidation --distribution-id E2DWQAD1KK82OL --paths "/*" --profile hyper
