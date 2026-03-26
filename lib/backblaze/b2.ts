import B2 from 'backblaze-b2'
import crypto from 'crypto'

let b2Instance: B2 | null = null

/**
 * Get or create B2 instance
 */
export async function getB2Client() {
  if (b2Instance) {
    return b2Instance
  }

  b2Instance = new B2({
    applicationKeyId: process.env.BACKBLAZE_APPLICATION_KEY_ID!,
    applicationKey: process.env.BACKBLAZE_APPLICATION_KEY!,
  })

  try {
    await b2Instance.authorize()
    return b2Instance
  } catch (error) {
    console.error('Error authorizing B2:', error)
    throw new Error('Failed to authorize Backblaze B2')
  }
}

/**
 * Calculate SHA1 hash of buffer
 */
function calculateSHA1(buffer: Buffer): string {
  return crypto.createHash('sha1').update(buffer).digest('hex')
}

/**
 * URL encode filename for Backblaze
 */
function encodeFileName(fileName: string): string {
  // B2 requires specific encoding
  return encodeURIComponent(fileName).replace(/%2F/g, '/')
}

/**
 * Upload file to B2
 */
export async function uploadFileToB2(
  file: Buffer,
  fileName: string,
  contentType: string,
  folder: 'videos' | 'subtitles'
): Promise<{
  fileName: string
  fileId: string
  contentType: string
  contentLength: number
  uploadTimestamp: number
  publicUrl: string
}> {
  const b2 = await getB2Client()
  const bucketId = process.env.BACKBLAZE_BUCKET_ID!
  const bucketName = process.env.BACKBLAZE_BUCKET_NAME!
  const endpoint = process.env.BACKBLAZE_ENDPOINT!

  try {
    // Calculate SHA1 hash
    const sha1Hash = calculateSHA1(file)
    console.log(`Calculated SHA1: ${sha1Hash}`)

    // Get upload URL
    const uploadUrlResponse = await b2.getUploadUrl({
      bucketId: bucketId,
    })

    const { uploadUrl, authorizationToken } = uploadUrlResponse.data

    // Prepare file path with folder
    const filePath = `${folder}/${fileName}`
    const encodedFilePath = encodeFileName(filePath)

    console.log(`Uploading to path: ${filePath}`)
    console.log(`Encoded path: ${encodedFilePath}`)
    console.log(`File size: ${file.length} bytes`)

    // Upload file with proper parameters
    const uploadResponse = await b2.uploadFile({
      uploadUrl: uploadUrl,
      uploadAuthToken: authorizationToken,
      fileName: encodedFilePath,
      data: file,
      mime: contentType || 'application/octet-stream',
      hash: sha1Hash,
      info: {
        folder: folder,
      },
      onUploadProgress: null,
    })

    console.log('Upload response:', uploadResponse.data)

    // Generate public URL
    const publicUrl = `${endpoint}/file/${bucketName}/${filePath}`

    return {
      fileName: filePath,
      fileId: uploadResponse.data.fileId,
      contentType: uploadResponse.data.contentType,
      contentLength: uploadResponse.data.contentLength,
      uploadTimestamp: uploadResponse.data.uploadTimestamp,
      publicUrl: publicUrl,
    }
  } catch (error: any) {
    console.error('Error uploading to B2:', error)
    
    // Log detailed error information
    if (error.response) {
      console.error('B2 Error Response:', {
        status: error.response.status,
        data: error.response.data,
        headers: error.response.headers,
      })
    }
    
    throw new Error(`Failed to upload file to Backblaze B2: ${error.message || 'Unknown error'}`)
  }
}

/**
 * Delete file from B2
 */
export async function deleteFromDrive(fileId: string, fileName: string) {
  const b2 = await getB2Client()

  try {
    await b2.deleteFileVersion({
      fileId: fileId,
      fileName: fileName,
    })
  } catch (error) {
    console.error('Error deleting from B2:', error)
    throw new Error('Failed to delete file from Backblaze B2')
  }
}

/**
 * Get file metadata from B2
 */
export async function getFileMetadata(fileId: string) {
  const b2 = await getB2Client()

  try {
    const response = await b2.getFileInfo({
      fileId: fileId,
    })

    return response.data
  } catch (error) {
    console.error('Error fetching file metadata:', error)
    throw new Error('Failed to fetch file metadata')
  }
}

/**
 * List files in a folder
 */
export async function listFilesInFolder(folder: 'videos' | 'subtitles', maxFileCount = 100) {
  const b2 = await getB2Client()
  const bucketId = process.env.BACKBLAZE_BUCKET_ID!

  try {
    const response = await b2.listFileNames({
      bucketId: bucketId,
      startFileName: `${folder}/`,
      maxFileCount: maxFileCount,
      prefix: `${folder}/`,
      delimiter: ''
    })

    return response.data.files
  } catch (error) {
    console.error('Error listing files:', error)
    throw new Error('Failed to list files')
  }
}