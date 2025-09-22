const AWS = require("aws-sdk");

const s3 = new AWS.S3({
  endpoint: process.env.MINIO_ENDPOINT || "http://minio:9000",
  accessKeyId: process.env.MINIO_ACCESS_KEY || "minioadmin",
  secretAccessKey: process.env.MINIO_SECRET_KEY || "minioadmin",
  s3ForcePathStyle: true,
  signatureVersion: "v4",
});

const bucketName = process.env.MINIO_BUCKET || "mybucket";

async function ensureBucketExists() {
  try {
    const buckets = await s3.listBuckets().promise();
    const exists = buckets.Buckets.some((b) => b.Name === bucketName);

    if (!exists) {
      await s3.createBucket({ Bucket: bucketName }).promise();
      console.log(`✅ Bucket "${bucketName}" created.`);
    } else {
      console.log(`ℹ️ Bucket "${bucketName}" already exists.`);
    }
  } catch (err) {
    console.error("❌ Failed to check/create bucket:", err);
  }
}

ensureBucketExists();


app.get("/s3/upload-url", async (req, res) => {
  const { filename } = req.query;

  const url = await s3.getSignedUrlPromise("putObject", {
    Bucket: bucketName,
    Key: filename,
    Expires: 60, // 1 min
  });

  res.json({ url });
});


app.get("/s3/download-url", async (req, res) => {
  const { filename } = req.query;

  const url = await s3.getSignedUrlPromise("getObject", {
    Bucket: bucketName,
    Key: filename,
    Expires: 60, // 1 min
  });

  res.json({ url });
});

// react
async function uploadFile(file) {
  const res = await fetch(`/s3/upload-url?filename=${file.name}`);
  const { url } = await res.json();

  await fetch(url, {
    method: "PUT",
    headers: { "Content-Type": file.type },
    body: file,
  });

  alert("Upload successful!");
}

async function downloadFile(filename) {
  const res = await fetch(`/s3/download-url?filename=${filename}`);
  const { url } = await res.json();

  window.open(url, "_blank");
}
