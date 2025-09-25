const core = require('@actions/core');
const fs = require('fs');
const path = require('path');
const { PinataSDK } = require('pinata');

async function run() {
  try {
    // Get inputs
    const pinataJwt = core.getInput('pinata-jwt');
    const sourceDir = core.getInput('source-dir');
    const pinName = core.getInput('pin-name');
    const updateExisting = core.getInput('update-existing') === 'true';

    // Initialize Pinata SDK
    const pinata = new PinataSDK({
      pinataJwt: pinataJwt
    });

    // Test authentication
    await pinata.testAuthentication();
    console.log('✅ Pinata authentication successful');

    // Check if source directory exists
    if (!fs.existsSync(sourceDir)) {
      throw new Error(`Source directory ${sourceDir} does not exist`);
    }

    // If updating existing, try to find and remove old version
    if (updateExisting) {
      try {
        const existingFiles = await pinata.data.pinList({
          name: pinName,
          limit: 1
        });

        if (existingFiles.rows && existingFiles.rows.length > 0) {
          const oldFile = existingFiles.rows[0];
          console.log(`🗑️ Removing old version: ${oldFile.ipfs_pin_hash}`);
          await pinata.data.unpin(oldFile.ipfs_pin_hash);
        }
      } catch (error) {
        console.log('⚠️ Could not remove old version:', error.message);
      }
    }

    // Create a zip-like structure by reading all files
    const files = await getAllFiles(sourceDir);
    console.log(`📁 Found ${files.length} files to upload`);

    // Upload directory to IPFS
    console.log('🚀 Uploading to IPFS...');

    const result = await pinata.data.uploadFiles(files, {
      pinataMetadata: {
        name: pinName,
        keyvalues: {
          'deployment': 'github-actions',
          'repository': process.env.GITHUB_REPOSITORY,
          'commit': process.env.GITHUB_SHA,
          'branch': process.env.GITHUB_REF_NAME,
          'timestamp': new Date().toISOString()
        }
      }
    });

    console.log('✅ Upload successful!');
    console.log(`📍 IPFS Hash: ${result.IpfsHash}`);
    console.log(`🌍 Gateway URL: https://gateway.pinata.cloud/ipfs/${result.IpfsHash}`);

    // Set outputs
    core.setOutput('ipfs-hash', result.IpfsHash);
    core.setOutput('gateway-url', `https://gateway.pinata.cloud/ipfs/${result.IpfsHash}`);

    // Create a summary
    await core.summary
      .addHeading('IPFS Deployment Successful! 🎉')
      .addTable([
        ['Property', 'Value'],
        ['IPFS Hash', result.IpfsHash],
        ['Gateway URL', `https://gateway.pinata.cloud/ipfs/${result.IpfsHash}`],
        ['Pin Name', pinName],
        ['Files Uploaded', files.length.toString()],
        ['Upload Size', formatBytes(result.PinSize)]
      ])
      .write();

  } catch (error) {
    core.setFailed(`Action failed: ${error.message}`);
  }
}

async function getAllFiles(dirPath, arrayOfFiles = []) {
  const files = fs.readdirSync(dirPath);

  for (const file of files) {
    const fullPath = path.join(dirPath, file);

    if (fs.statSync(fullPath).isDirectory()) {
      arrayOfFiles = await getAllFiles(fullPath, arrayOfFiles);
    } else {
      // Read file and create File object
      const fileContent = fs.readFileSync(fullPath);
      const blob = new Blob([fileContent]);
      const relativePath = path.relative(process.cwd(), fullPath);

      // Create File object with correct path
      const fileObj = new File([blob], relativePath, {
        type: getMimeType(file)
      });

      arrayOfFiles.push(fileObj);
    }
  }

  return arrayOfFiles;
}

function getMimeType(filename) {
  const ext = path.extname(filename).toLowerCase();
  const mimeTypes = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.pdf': 'application/pdf',
    '.txt': 'text/plain',
    '.md': 'text/markdown'
  };

  return mimeTypes[ext] || 'application/octet-stream';
}

function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

run();
