# IPFS Deployment Action

This GitHub Action automatically deploys your built application to IPFS using Pinata.

## Setup Instructions

### 1. Get Pinata Credentials

1. Go to [Pinata Cloud](https://pinata.cloud) and create a free account
2. Navigate to [API Keys](https://app.pinata.cloud/developers/api-keys)
3. Create a new API key with **Files read and write** permissions
4. Copy your JWT token

### 2. Add GitHub Secret

1. Go to your GitHub repository
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Name: `PINATA_JWT`
5. Value: Your Pinata JWT token
6. Click **Add secret**

### 3. Manual Deployment

1. Go to your repository's **Actions** tab
2. Select **Deploy to IPFS** workflow
3. Click **Run workflow**
4. Choose the branch you want to deploy
5. Optionally provide a custom pin name
6. Click **Run workflow**

## Features

- ✅ Manual trigger only (no automatic deployments)
- ✅ Branch selection input
- ✅ Custom pin naming
- ✅ Automatic old version cleanup
- ✅ Detailed deployment summary
- ✅ IPFS hash and gateway URL outputs

## Outputs

After successful deployment, you'll get:
- **IPFS Hash**: The content-addressed hash of your deployment
- **Gateway URL**: Direct link to access your content via IPFS
- **Deployment Summary**: Detailed information about the upload

## Troubleshooting

- Ensure your `PINATA_JWT` secret is correctly set
- Check that your build process creates a `dist/` directory
- Verify the branch you're trying to deploy exists
- Review the Actions logs for detailed error messages
