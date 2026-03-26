import { MovieForm } from '@/components/admin/MovieForm'

export default function CreateMoviePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Create Movie</h1>
        <p className="text-gray-600 mt-2">Add a new movie to your catalog</p>
      </div>

      <MovieForm mode="create" />
    </div>
  )
}