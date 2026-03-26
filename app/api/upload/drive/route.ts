import { NextRequest, NextResponse } from 'next/server'
import { uploadToDrive } from '@/lib/google/drive'

export const runtime = 'nodejs' // Important: Force Node.js runtime

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const accessToken = formData.get('accessToken') as string

    if (!file || !accessToken) {
      return NextResponse.json(
        { error: 'File and access token are required' },
        { status: 400 }
      )
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    console.log(`Uploading file: ${file.name} (${buffer.length} bytes)`)

    // Upload to Drive
    const result = await uploadToDrive(
      buffer,
      file.name,
      file.type,
      accessToken
    )

    console.log(`Upload successful: ${result.fileId}`)

    return NextResponse.json(result)
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to upload file to Google Drive',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

