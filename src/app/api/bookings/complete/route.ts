import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { updateStudentAchievements } from '@/lib/achievements'

export async function POST(request: NextRequest) {
  try {
    const { bookingId } = await request.json()

    if (!bookingId) {
      return NextResponse.json(
        { error: 'Booking ID is required' },
        { status: 400 }
      )
    }

    // Update booking status to completed
    const booking = await prisma.booking.update({
      where: { id: bookingId },
      data: { status: 'COMPLETED' }
    })

    // Update student achievements
    await updateStudentAchievements(booking.customerId)

    return NextResponse.json({ 
      success: true,
      message: 'Booking completed and achievements updated'
    })

  } catch (error) {
    console.error('Error completing booking:', error)
    return NextResponse.json(
      { error: 'Failed to complete booking' },
      { status: 500 }
    )
  }
}