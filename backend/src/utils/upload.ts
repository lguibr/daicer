import { PassThrough } from 'stream';

/**
 * Helper to upload a base64 image to Strapi Media Library
 */
export async function uploadBase64Image(
  base64Data: string,
  filename: string,
  folder?: string
): Promise<{ id: number; url: string } | null> {
  try {
    // 1. Parse base64
    const matches = base64Data.match(/^data:([A-Za-z-+/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      return null;
    }

    const mimeType = matches[1];
    const buffer = Buffer.from(matches[2], 'base64');

    // 2. Prepare file data for Strapi
    // Strapi expects a specific structure for programmatic uploads
    const file = {
      name: filename,
      hash: filename + '_' + Date.now(),
      ext: mimeType === 'image/png' ? '.png' : '.jpg', // Simplified
      mime: mimeType,
      size: buffer.length,
      buffer: buffer,
      path: buffer, // Strapi might use path or buffer depending on version
      getStream: () => {
        const stream = new PassThrough();
        stream.end(buffer);
        return stream;
      },
    };

    // 3. Upload
    // Strapi 4/5 syntax
    // We upload to the media library
    const uploadedFiles = await strapi.plugin('upload').service('upload').upload({
      files: file,
      data: {}, // No specific relation binding here, we just want the file
    });

    if (!uploadedFiles || uploadedFiles.length === 0) {
      return null;
    }

    const uploaded = uploadedFiles[0];
    return {
      id: uploaded.id,
      url: uploaded.url,
    };
  } catch (err) {
    strapi.log.error('Failed to upload image:', err);
    return null;
  }
}
