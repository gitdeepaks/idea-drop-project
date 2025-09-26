import type { Idea } from '@/types'
import { Link } from '@tanstack/react-router'
import clsx from 'clsx'

interface IdeaCardProps {
  idea: Idea
  button?: boolean
}

const IdeaCard = ({ idea, button = true }: IdeaCardProps) => {
  const linkClasses = clsx({
    'text-blue-600 hover:underline mt-3': !button,
    'text-center mt-4 inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition':
      button,
  })
  return (
    <div className="border border-gray-300 rounded-lg shadow p-4 bg-white">
      <h3 className="text-lg font-bold text-gray-900">{idea.title}</h3>
      <p className="text-gray-600 mb-2">{idea.summary}</p>
      <Link
        to="/ideas/$ideaId"
        params={{ ideaId: idea._id.toString() }}
        className={linkClasses}
      >
        {button ? 'View Details' : 'Read more →'}
      </Link>
    </div>
  )
}

export default IdeaCard
