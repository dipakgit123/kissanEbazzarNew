# AWS S3 Storage Setup

Use this when moving media uploads from Cloudinary to AWS S3.

## Required `.env` values

Add these in `server/.env`:

```env
AWS_REGION=ap-south-1
AWS_S3_BUCKET=your-public-bucket-name
AWS_ACCESS_KEY_ID=your_aws_access_key_id
AWS_SECRET_ACCESS_KEY=your_aws_secret_access_key
```

Optional:

```env
# If you use CloudFront or another CDN/custom domain
AWS_S3_PUBLIC_BASE_URL=https://cdn.example.com

# Only for S3-compatible providers or special endpoint setups
AWS_S3_ENDPOINT=
AWS_S3_FORCE_PATH_STYLE=false
```

## Recommended bucket access

For this app, uploaded media URLs are stored directly in the database and used by the frontend, so the bucket should be readable through a public URL or through a CDN URL.

Choose one:

1. Public bucket or public object path
2. Private bucket behind CloudFront with public asset delivery

## Current folder structure

New uploads now go into these S3 key prefixes:

- `users/account/profile-photos/`
- `content/blogs/featured-images/`
- `ai-health-check/uploads/images/`
- `listings/cows/images/`
- `listings/cows/videos/`
- `listings/buffalos/images/`
- `listings/buffalos/videos/`
- `listings/horses/images/`
- `listings/horses/videos/`
- `listings/goats/images/`
- `listings/goats/videos/`
- `listings/dogs/images/`
- `listings/dogs/videos/`
- `listings/cats/images/`
- `listings/cats/videos/`
- `listings/other-animals/images/front/`
- `listings/other-animals/images/side/`
- `listings/other-animals/images/additional/`
- `listings/other-animals/videos/`
- `veterinarians/account/profile-photos/`
- `veterinarians/registration/profile-photos/`
- `veterinarians/registration/license-documents/`
- `veterinarians/registration/degree-certificates/`
- `veterinarians/registration/aadhar-documents/`

## Test command

After adding real AWS values:

```bash
npm run storage:test-s3
```

This uploads a tiny test image to:

- `tests/s3/images/`

Then deletes it again.

## Cloudinary migration command

Dry run:

```bash
npm run storage:migrate-cloudinary-to-s3 -- --dry-run
```

One model only:

```bash
npm run storage:migrate-cloudinary-to-s3 -- --model=Blog
```

Run live migration:

```bash
npm run storage:migrate-cloudinary-to-s3
```

The migration script:

- finds DB records still using `res.cloudinary.com`
- downloads those files
- uploads them to S3 using the new folder structure
- updates the URL and stored key/public ID in the database

It does not delete the original Cloudinary files.
