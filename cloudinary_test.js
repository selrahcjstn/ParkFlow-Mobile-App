const cloudinary = require('cloudinary').v2;

// 1. Configure Cloudinary
cloudinary.config({
  cloud_name: 'dp5p5kba8',
  api_key: '562653769987651',
  api_secret: '6s56bPSIkIMWinIobrc0Aq14uIM'
});

async function run() {
  try {
    console.log("Starting Cloudinary Onboarding Script...");

    // 2. Upload an image
    const sampleImageUrl = 'https://res.cloudinary.com/demo/image/upload/sample.jpg';
    console.log(`Uploading sample image from: ${sampleImageUrl}`);
    
    const uploadResult = await cloudinary.uploader.upload(sampleImageUrl, {
      public_id: 'cloudinary_onboarding_sample'
    });

    console.log("\n--- Upload Successful ---");
    console.log(`Secure URL: ${uploadResult.secure_url}`);
    console.log(`Public ID: ${uploadResult.public_id}`);

    // 3. Get image details
    console.log("\n--- Fetching Image Details ---");
    const details = await cloudinary.api.resource(uploadResult.public_id);
    console.log(`Width: ${details.width}px`);
    console.log(`Height: ${details.height}px`);
    console.log(`Format: ${details.format}`);
    console.log(`File Size: ${details.bytes} bytes`);

    // 4. Transform the image
    // Generating transformed URL using:
    // - f_auto: Automatic format selection (delivers the best format based on the browser, e.g. WebP/AVIF)
    // - q_auto: Automatic quality selection (compresses the image optimized for visual quality and file size)
    const transformedUrl = cloudinary.url(uploadResult.public_id, {
      secure: true,
      fetch_format: 'auto', // f_auto: Automatically selects the best image format for the requesting browser
      quality: 'auto'       // q_auto: Automatically determines the optimal quality compression level
    });

    console.log("\n--- Transformation Result ---");
    console.log("Done! Click link below to see optimized version of the image. Check the size and the format.");
    console.log(transformedUrl);

  } catch (error) {
    console.error("\nError occurred during execution:", error.message);
  }
}

run();
