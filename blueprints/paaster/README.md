# Paaster - Secure Encrypted Pastebin

[Paaster](https://github.com/WardPearce/paaster) is a secure, privacy-focused pastebin application with client-side end-to-end encryption. All paste content is encrypted in the browser before transmission to the server.

## Features

- **End-to-end encryption**: Pastes are encrypted client-side using libsodium (XChaCha20-Poly1305)
- **Zero-knowledge server**: Server never sees plaintext content
- **Paste history**: Client-side IndexedDB storage for local history
- **Syntax highlighting**: Code highlighting for various programming languages
- **Self-hostable**: Full control over your data
- **Cloudflare R2 storage**: Cost-effective S3-compatible storage with zero egress fees

## Architecture

This template deploys 2 services:

| Service | Image | Purpose |
|---------|-------|---------|
| paaster | wardpearce/paaster:3.1.7 | Main application (Svelte frontend + Node.js backend) |
| mongodb | mongo:7 | Metadata storage and server configuration |

Encrypted paste data is stored in Cloudflare R2 (configured separately).

## DNS Requirements

This template requires 1 DNS record pointing to your Dokploy server:

| Record | Purpose |
|--------|---------|
| `paaster.example.com` | Main application |

## Cloudflare R2 Setup

Before deploying, you must configure Cloudflare R2:

### 1. Create R2 Bucket

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com) > R2
2. Click **Create bucket**
3. Name it (e.g., `paaster`)
4. Note the bucket name for configuration

### 2. Create R2 API Token

1. Go to R2 > **Manage R2 API Tokens**
2. Click **Create API Token**
3. Set permissions: **Object Read & Write** for your bucket
4. Copy the **Access Key ID** and **Secret Access Key**

### 3. Get Account ID

Your R2 endpoint is: `https://<ACCOUNT_ID>.r2.cloudflarestorage.com`

Find your Account ID in the Cloudflare Dashboard URL or R2 overview page.

### 4. Configure CORS

1. Go to R2 > your bucket > **Settings** > **CORS Policy**
2. Add this policy:

```json
[
  {
    "AllowedOrigins": ["https://paaster.example.com"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
    "AllowedHeaders": ["*"],
    "MaxAgeSeconds": 86400
  }
]
```

Replace `paaster.example.com` with your actual domain.

## Configuration Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PAASTER_DOMAIN` | Primary domain for the application | Required |
| `COOKIE_SECRET` | Secure random session secret | Auto-generated (64 chars) |
| `MONGO_DB` | MongoDB database name | `paasterv3` |
| `S3_ENDPOINT` | R2 endpoint URL | Required |
| `S3_ACCESS_KEY_ID` | R2 API access key | Required |
| `S3_SECRET_ACCESS_KEY` | R2 API secret key | Required |
| `S3_BUCKET` | R2 bucket name | Required |
| `S3_REGION` | S3 region identifier | `auto` |

## Resource Requirements

**Minimum (Home Lab):**
- CPU: 0.5 cores
- RAM: 512 MB
- Storage: 5 GB (MongoDB only)

**Recommended:**
- CPU: 1 core
- RAM: 1 GB
- Storage: 20 GB

Storage requirements are minimal since paste data is stored in Cloudflare R2.

## Post-Deployment Steps

1. **Configure R2** following the setup instructions above
2. **Set environment variables** in Dokploy with your R2 credentials
3. **Deploy the application**
4. **Access the application** at `https://your-domain.com`
5. **Create your first paste** to verify encryption and R2 storage is working

## Security Notes

- All encryption keys are generated and stored client-side (browser IndexedDB)
- Server never has access to decryption keys
- Pastes are encrypted before leaving the browser
- HTTPS is enforced via Traefik
- R2 bucket should have no public access (API tokens only)

## Troubleshooting

### Pastes fail to save

- Verify R2 credentials are correct
- Check CORS policy in R2 bucket settings
- Ensure bucket exists and is accessible
- Check browser console for specific error messages

### CORS errors in browser console

- Verify CORS policy is configured in Cloudflare R2
- Ensure your domain matches the AllowedOrigins exactly (including https://)
- Check that all required methods are allowed

### MongoDB connection issues

- Verify MongoDB is running: `docker logs <mongodb-container>`
- Check network connectivity between services

### R2 connection errors

- Verify endpoint format: `https://<ACCOUNT_ID>.r2.cloudflarestorage.com`
- Check API token permissions include Object Read & Write
- Ensure S3_REGION is set to `auto`

## Backup

**MongoDB data:**
```bash
docker exec <mongodb-container> mongodump --out /dump
docker cp <mongodb-container>:/dump ./backup/mongodb
```

**R2 data:**
Use Cloudflare's R2 dashboard or `rclone` to backup bucket contents:
```bash
rclone sync r2:paaster ./backup/r2
```

## Cost Considerations

Cloudflare R2 pricing (as of 2024):
- **Storage**: $0.015/GB/month
- **Class A operations** (writes): $4.50/million
- **Class B operations** (reads): $0.36/million
- **Egress**: Free (no bandwidth charges)

For a typical self-hosted pastebin, expect minimal costs (<$1/month).

## Alternative S3 Providers

This template is configured for Cloudflare R2, but can be adapted for other S3-compatible providers:

| Provider | Endpoint Format | Notes |
|----------|----------------|-------|
| AWS S3 | `https://s3.<region>.amazonaws.com` | Set proper region |
| Wasabi | `https://s3.<region>.wasabisys.com` | No egress fees |
| Backblaze B2 | `https://s3.<region>.backblazeb2.com` | Affordable storage |
| Storj | `https://gateway.storjshare.io` | 25GB free tier |

For MinIO or other self-hosted S3, set `S3_FORCE_PATH_STYLE: "true"` in docker-compose.yml.

## References

- [Paaster GitHub](https://github.com/WardPearce/paaster)
- [Cloudflare R2 Documentation](https://developers.cloudflare.com/r2/)
- [R2 S3 API Compatibility](https://developers.cloudflare.com/r2/api/s3/api/)
- [MongoDB Documentation](https://docs.mongodb.com/)
