import { NextRequest, NextResponse } from 'next/server'
import { uploadFileToB2 } from '@/lib/backblaze/b2'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// ✅ New Next.js 14 way to set config
export const maxDuration = 300 // 5 minutes timeout for large files
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const folder = formData.get('folder') as 'videos' | 'subtitles'
    const keepOriginalName = formData.get('keepOriginalName') === 'true'

    if (!file || !folder) {
      return NextResponse.json(
        { error: 'File and folder are required' },
        { status: 400 }
      )
    }

    if (folder !== 'videos' && folder !== 'subtitles') {
      return NextResponse.json(
        { error: 'Folder must be either "videos" or "subtitles"' },
        { status: 400 }
      )
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Determine filename
    let finalFileName: string

    if (keepOriginalName) {
      // Keep original filename but encode it properly
      finalFileName = encodeURIComponent(file.name)
    } else {
      // Generate unique filename
      const timestamp = Date.now()
      const randomString = Math.random().toString(36).substring(2, 15)
      const extension = file.name.split('.').pop()
      finalFileName = `${timestamp}-${randomString}.${extension}`
    }

    console.log(`Uploading ${file.name} to ${folder}/ as ${finalFileName}`)

    // Upload to Backblaze B2
    const result = await uploadFileToB2(
      buffer,
      finalFileName,
      file.type,
      folder
    )

    console.log(`Upload successful: ${result.fileName}`)

    return NextResponse.json({
      success: true,
      fileName: result.fileName,
      fileId: result.fileId,
      publicUrl: result.publicUrl,
      contentType: result.contentType,
      size: result.contentLength,
      uploadedAt: new Date(result.uploadTimestamp).toISOString(),
    })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to upload file to Backblaze B2',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}