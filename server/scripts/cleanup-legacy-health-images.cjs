// Explicit operator maintenance only; no dotenv loading or automatic deletion.
// node scripts/cleanup-legacy-health-images.cjs --bucket BUCKET --region REGION --before YYYY-MM-DD [--delete]
const { S3Client, ListObjectsV2Command, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const args = process.argv.slice(2);
const option = key => args[args.indexOf(key) + 1];
async function main() {
  if (!['--bucket', '--region', '--before'].every(key => args.includes(key))) throw new Error('Explicit --bucket, --region and --before are required. Defaults to dry run.');
  const before = new Date(option('--before'));
  if (!/^\d{4}-\d{2}-\d{2}$/.test(option('--before')) || !Number.isFinite(+before) || before > new Date(Date.now() - 30 * 86400000)) throw new Error('Cutoff must be a date at least 30 days ago.');
  const Bucket = option('--bucket'), Prefix = 'ai-health-check/uploads/images/';
  const client = new S3Client({ region: option('--region') });
  let ContinuationToken, count = 0;
  try {
    do {
      const page = await client.send(new ListObjectsV2Command({ Bucket, Prefix, ContinuationToken }));
      for (const object of page.Contents || []) {
        if (!object.Key.startsWith(Prefix) || !object.LastModified || object.LastModified >= before) continue;
        count++;
        if (args.includes('--delete')) await client.send(new DeleteObjectCommand({ Bucket, Key: object.Key }));
      }
      ContinuationToken = page.IsTruncated ? page.NextContinuationToken : undefined;
    } while (ContinuationToken);
    console.log(`${args.includes('--delete') ? 'Deleted' : 'Dry run: eligible'}: ${count} legacy health photos. Versioned buckets require a separate lifecycle policy to expire noncurrent versions.`);
  } finally { client.destroy(); }
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
