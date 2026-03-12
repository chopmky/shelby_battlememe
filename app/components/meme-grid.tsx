'use client'

import { getBlobUrl } from '@/lib/shelby-client'

interface BlobItem {
  object_address: string
  owner_address: string
  blob_name?: string
}

interface MemeGridProps {
  blobs: BlobItem[]
  ownerAddress: string
  selectedBlobId: string | null
  onSelect: (blobId: string, blobName: string) => void
}

// Filter to image-like blob names
const IMAGE_EXTS = ['.jpg', '.jpeg', '.png', '.webp', '.gif']
function isImageBlob(name: string) {
  return IMAGE_EXTS.some((ext) => name.toLowerCase().endsWith(ext))
}

export default function MemeGrid({ blobs, ownerAddress, selectedBlobId, onSelect }: MemeGridProps) {
  const imageBlobs = blobs.filter((b) => b.blob_name && isImageBlob(b.blob_name))

  if (imageBlobs.length === 0) {
    return (
      <p className="text-center text-zinc-500 py-8">
        No image memes found on Shelby for this wallet.
      </p>
    )
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
      {imageBlobs.map((blob) => {
        const blobName = blob.blob_name!
        const blobId = blob.object_address
        const isSelected = selectedBlobId === blobId
        return (
          <button
            key={blobId}
            onClick={() => onSelect(blobId, blobName)}
            className={`relative overflow-hidden rounded-lg border-2 transition-all ${
              isSelected
                ? 'border-blue-500 ring-2 ring-blue-500/50'
                : 'border-zinc-700 hover:border-zinc-500'
            }`}
          >
            <img
              src={getBlobUrl(ownerAddress, blobName)}
              alt={blobName}
              className="aspect-square w-full object-cover"
            />
            <span className="absolute bottom-0 left-0 right-0 bg-black/60 px-2 py-1 text-xs text-white truncate">
              {blobName}
            </span>
          </button>
        )
      })}
    </div>
  )
}
