interface StarRatingProps {
  rating: number
  maxRating?: number
  showNumber?: boolean
  className?: string
}

export function StarRating({ rating, maxRating = 5, showNumber = true, className = "" }: StarRatingProps) {
  const stars = []
  
  for (let i = 1; i <= maxRating; i++) {
    if (i <= rating) {
      stars.push('★')
    } else {
      stars.push('☆')
    }
  }

  return (
    <div className={`flex items-center ${className}`}>
      <span className="text-yellow-400 text-lg">
        {stars.join('')}
      </span>
      {showNumber && (
        <span className="ml-2 text-sm text-gray-600">
          {rating}/{maxRating}
        </span>
      )}
    </div>
  )
}