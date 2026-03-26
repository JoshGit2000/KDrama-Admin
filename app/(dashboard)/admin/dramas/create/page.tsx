import { DramaForm } from '@/components/admin/DramaForm'

export default function CreateDramaPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Create Drama</h1>
        <p className="text-gray-600 mt-2">Add a new drama to your catalog</p>
      </div>

      <DramaForm mode="create" />
    </div>
  )
}