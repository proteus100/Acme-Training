interface BookingCalendarPreviewProps {
  tenantId?: string
  primaryColor?: string
}

export function BookingCalendarPreview({ tenantId, primaryColor }: BookingCalendarPreviewProps) {
  return (
    <div className="bg-gray-50 p-6 rounded-lg">
      <h4 className="text-lg font-semibold mb-4" style={{ color: primaryColor }}>
        📅 Available Sessions
      </h4>
      <p className="text-gray-600">Calendar preview coming soon...</p>
    </div>
  )
}