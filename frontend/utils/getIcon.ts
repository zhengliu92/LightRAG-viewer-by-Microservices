import {
    FileText,
    FileJson,
    FileCode,
    FileImage,
    FileVideo,
    FileAudio,
    File,
    type LucideIcon
  } from 'lucide-react'
  
  export function getIconByExt(fileExt: string): LucideIcon {
    const ext = fileExt.toLowerCase()
  
    // Common text files
    if (['txt', 'md', 'doc', 'docx', 'pdf'].includes(ext)) {
      return FileText
    }
  
    // Code files
    if (['js', 'ts', 'jsx', 'tsx', 'html', 'css', 'py', 'java', 'cpp', 'c'].includes(ext)) {
      return FileCode
    }
  
    // JSON files
    if (['json'].includes(ext)) {
      return FileJson
    }
  
    // Image files
    if (['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'].includes(ext)) {
      return FileImage
    }
  
    // Video files
    if (['mp4', 'mov', 'avi', 'webm'].includes(ext)) {
      return FileVideo
    }
  
    // Audio files
    if (['mp3', 'wav', 'ogg', 'm4a'].includes(ext)) {
      return FileAudio
    }
  
    // Default file icon for unknown extensions
    return File
  }