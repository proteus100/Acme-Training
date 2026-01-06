interface LiveAchievementFeedProps {
  tenantId: string
  primaryColor: string
  areaName: string
}

export function LiveAchievementFeed({ tenantId, primaryColor, areaName }: LiveAchievementFeedProps) {
  return (
    <div className="text-center p-8">
      <h3 className="text-2xl font-bold mb-4" style={{ color: primaryColor }}>
        🏆 Student Achievements in {areaName}
      </h3>
      <p className="text-gray-600">Live achievement feed coming soon...</p>
    </div>
  )
}