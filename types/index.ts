export interface Quality {
  quality: '480p' | '720p' | '1080p'
  fileId: string  // Changed from 'url' to 'fileId'
}

export interface Subtitle {
  language: 'sinhala' | 'english'
  label: string
  fileId: string  // Changed from 'url' to 'fileId'
}

export interface Episode {
  id: string
  episodeNumber: number
  title: string
  titleSinhala?: string
  description?: string
  descriptionSinhala?: string
  duration: number
  thumbnailFileId?: string
  videoFileId_480p?: string  // e.g., "videos/12345-abc.mp4"
  videoFileId_720p?: string
  videoFileId_1080p?: string
  subtitles: Subtitle[]
  createdAt: string
  updatedAt: string
}

export interface Movie {
  id: string
  title: string
  titleSinhala?: string
  description: string
  descriptionSinhala?: string
  year: number
  rating: number
  genres: string[]
  trending: boolean
  new: boolean
  type: 'movie'
  thumbnailFileId: string
  bannerFileId: string
  duration: number
  views: number
  videoFileId_480p: string
  videoFileId_720p: string
  videoFileId_1080p: string
  trailerUrl?: string
  subtitles: Subtitle[]
  createdAt: string
  updatedAt: string
}

export interface Drama {
  id: string
  title: string
  titleSinhala?: string
  description: string
  descriptionSinhala?: string
  year: number
  rating: number
  genres: string[]
  trending: boolean
  new: boolean
  completed: boolean
  type: 'drama'
  thumbnailFileId: string
  bannerFileId: string
  totalEpisodes: number
  views: number
  // episodes: Episode[]
  trailerUrl?: string
  createdAt: string
  updatedAt: string
}

export interface DriveFile {
  fileId: string
  name: string
  mimeType: string
  size: number
  createdTime: string
  downloadUrl: string
  previewUrl: string
}

export interface UploadProgress {
  fileName: string
  progress: number
  status: 'uploading' | 'completed' | 'error'
  fileId?: string
}
