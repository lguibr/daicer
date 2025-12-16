import fs from 'fs';
import path from 'path';
import os from 'os';

/**
 * Helper to upload a base64 image to Strapi Media Library
 */
export async function uploadBase64Image(
  base64Data: string,
  filename: string,
  folder?: string
): Promise<{ id: number; url: string } | null> {
  let tempFilePath = null;
  try {
    // 1. Parse base64
    const matches = base64Data.match(/^data:([A-Za-z-+/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      return null;
    }

    const mimeType = matches[1];
    const buffer = Buffer.from(matches[2], 'base64');
    const ext = `.${mimeType.split('/')[1].replace('jpeg', 'jpg')}`;

    // 2. Write to temp file
    // Strapi's upload service often requires a valid path for file processing/optimization plugins
    // Ensure temp file path has extension so tools/Strapi can detect it from path if needed
    const tempFileName = filename.endsWith(ext) ? filename : filename + ext;
    tempFilePath = path.join(os.tmpdir(), tempFileName);
    fs.writeFileSync(tempFilePath, buffer);

    // 3. Prepare file data for Strapi
    const stats = fs.statSync(tempFilePath);

    // Structure expected by Strapi upload service
    // Ensure name has extension for detection
    // const fileNameWithExt = filename.endsWith(ext) ? filename : filename + ext; // Already handled by tempFileName

    const file = {
      name: tempFileName, // Use the proper name with extension
      hash: filename + '_' + Date.now(),
      ext: ext, // e.g. '.png'
      mime: mimeType,
      type: mimeType,
      size: stats.size,
      path: tempFilePath,
      filepath: tempFilePath,
      originalFilename: tempFileName, // Critical for extension detection in older/strict parsers
      mimetype: mimeType, // Alias for type/mime
      newFilename: tempFileName,
      getStream: () => fs.createReadStream(tempFilePath),
    };

    strapi.log.info(`[uploadBase64Image] Uploading file: ${file.name} (${file.mime}, ${file.size} bytes)`);

    // 4. Upload
    // Strapi 5 syntax
    const uploadedFiles = await strapi
      .plugin('upload')
      .service('upload')
      .upload({
        files: [file], // Wrap in array
        data: {
          fileInfo: {
            name: tempFileName,
            caption: 'Character Avatar',
            alternativeText: filename,
          },
        },
      });

    if (!uploadedFiles || uploadedFiles.length === 0) {
      strapi.log.warn('[uploadBase64Image] No files returned from upload service');
      return null;
    }

    const uploaded = uploadedFiles[0];
    return {
      id: uploaded.id,
      url: uploaded.url,
    };
  } catch (err) {
    strapi.log.error(`[uploadBase64Image] Failed to upload image: ${err.message}`);
    strapi.log.error(err.stack); // Log full stack trace
    return null;
  } finally {
    // 5. Cleanup temp file
    if (tempFilePath && fs.existsSync(tempFilePath)) {
      try {
        fs.unlinkSync(tempFilePath);
      } catch (cleanupErr) {
        strapi.log.warn('Failed to cleanup temp file:', cleanupErr);
      }
    }
  }
}
