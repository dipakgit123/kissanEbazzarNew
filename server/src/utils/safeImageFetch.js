'use strict';
const dns = require('node:dns').promises;
const https = require('node:https');
const { BlockList, isIP } = require('node:net');
const axios = require('axios');
const blocked = new BlockList();
for (const [address, prefix] of [['0.0.0.0', 8], ['10.0.0.0', 8], ['127.0.0.0', 8], ['169.254.0.0', 16], ['172.16.0.0', 12], ['192.168.0.0', 16], ['100.64.0.0', 10], ['224.0.0.0', 4], ['240.0.0.0', 4]]) {
  blocked.addSubnet(address, prefix, 'ipv4');
}
for (const [address, prefix] of [['::', 128], ['::1', 128], ['fc00::', 7], ['fe80::', 10], ['ff00::', 8], ['::ffff:0:0', 96]]) {
  blocked.addSubnet(address, prefix, 'ipv6');
}
const invalidImage = (message) => Object.assign(new Error(message), { status: 400 });
const fetchImage = async (value) => {
  let url;
  try { url = new URL(value); } catch { throw invalidImage('Invalid image URL'); }
  const allowedHosts = new Set();
  for (const base of [process.env.AWS_S3_PUBLIC_BASE_URL, process.env.AI_IMAGE_BASE_URL]) {
    if (base) {
      try { allowedHosts.add(new URL(base).hostname.toLowerCase()); } catch { /* Invalid configuration is not trusted. */ }
    }
  }
  if (process.env.AWS_S3_BUCKET && process.env.AWS_REGION) {
    allowedHosts.add(`${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com`);
    allowedHosts.add(`${process.env.AWS_S3_BUCKET}.s3.amazonaws.com`);
  }
  if (process.env.CLOUDINARY_CLOUD_NAME) allowedHosts.add('res.cloudinary.com');
  if (url.protocol !== 'https:' || url.username || url.password || (url.port && url.port !== '443') || !allowedHosts.has(url.hostname.toLowerCase())) {
    throw invalidImage('Use an image uploaded to this application');
  }
  const addresses = await dns.lookup(url.hostname, { all: true });
  if (!addresses.length || addresses.some(({ address }) => blocked.check(address, isIP(address) === 6 ? 'ipv6' : 'ipv4'))) {
    throw invalidImage('Image host is not publicly accessible');
  }
  const agent = new https.Agent({
    lookup: (_hostname, options, callback) => {
      if (options?.all) callback(null, addresses);
      else callback(null, addresses[0].address, addresses[0].family);
    },
  });
  try {
    const response = await axios.get(url.toString(), {
      httpsAgent: agent, proxy: false, responseType: 'arraybuffer',
      timeout: 10000, maxRedirects: 0, maxContentLength: 8 * 1024 * 1024,
    });
    const mimeType = String(response.headers['content-type'] || '').split(';')[0].trim();
    if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(mimeType)) throw invalidImage('URL must contain a supported image');
    return { base64: Buffer.from(response.data).toString('base64'), mimeType };
  } finally { agent.destroy(); }
};
module.exports = { fetchImage };
