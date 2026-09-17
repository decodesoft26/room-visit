import { v2 as cloudinary } from "cloudinary"

cloudinary.config({ secure: true })

export type UploadedImage = { url: string; publicId: string }
const visitFolder = process.env.UPLOAD_PRESET || "roomvisit"

export async function uploadVisitImage(file: File): Promise<UploadedImage> {
  const buffer = Buffer.from(await file.arrayBuffer())
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream({ folder: visitFolder }, (error, result) => {
      if (error || !result) return reject(error)
      resolve({ url: result.secure_url, publicId: result.public_id })
    }).end(buffer)
  })
}
