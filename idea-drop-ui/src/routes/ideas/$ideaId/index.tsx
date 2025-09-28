import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'

import {
  queryOptions,
  useSuspenseQuery,
  useMutation,
} from '@tanstack/react-query'
import { fetchIdea, deleteIdea } from '@/api/ideas'
import { useAuth } from '@/context/AuthContext'
import { use } from 'react'

const ideaQueryOptions = (ideaId: string) =>
  queryOptions({
    queryKey: ['idea', ideaId],
    queryFn: () => fetchIdea(ideaId),
  })

export const Route = createFileRoute('/ideas/$ideaId/')({
  component: IdeaDetailsPage,
  loader: async ({ params, context: { queryClient } }) => {
    return queryClient.ensureQueryData(ideaQueryOptions(params.ideaId))
  },
})

function IdeaDetailsPage() {
  const { ideaId } = Route.useParams()
  const { data: idea } = useSuspenseQuery(ideaQueryOptions(ideaId))

  const navigate = useNavigate()

  const { user } = useAuth()

  const { mutateAsync: deleteMutate, isPending } = useMutation({
    mutationFn: () => deleteIdea(ideaId),
    onSuccess: () => {
      navigate({ to: '/ideas' })
    },
  })

  const handleDelete = async () => {
    const conformDelete = window.confirm(
      'Are you sure you want to delete this idea?',
    )
    if (conformDelete) {
      await deleteMutate()
    }
  }
  return (
    <div className="p-4">
      <Link to="/ideas" className="text-blue-500">
        Back to ideas
      </Link>
      <h2 className="text-2xl font-bold">{idea.title}</h2>
      <p className="mt-2">{idea.description}</p>
      {user && user.id === idea.user && (
        <>
          {/* Edit Link */}
          <Link
            to="/ideas/$ideaId/edit"
            params={{ ideaId }}
            className=" mt-4 inline-block bg-yellow-500 text-white px-4 py-2 rounded-md transition mr-2"
          >
            Edit Idea
          </Link>

          {/* Delete Button */}
          <button
            disabled={isPending}
            className="text-sm bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 mt-4 rounded-md transition disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleDelete}
          >
            {isPending ? 'Deleting...' : 'Delete Idea'}
          </button>
        </>
      )}
    </div>
  )
}
