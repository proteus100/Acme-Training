import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    
    const courses = await prisma.course.findMany({
      where: category ? { category: category as any } : {},
      include: {
        sessions: {
          where: {
            isActive: true,
            startDate: {
              gte: new Date()
            }
          },
          orderBy: {
            startDate: 'asc'
          }
        }
      },
      orderBy: {
        title: 'asc'
      }
    })
    
    return NextResponse.json(courses)
  } catch (error) {
    console.error('Error fetching courses:', error)
    return NextResponse.json({ error: 'Failed to fetch courses' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    
    const course = await prisma.course.create({
      data: {
        title: data.title,
        description: data.description,
        category: data.category,
        duration: data.duration,
        price: data.price,
        maxStudents: data.maxStudents || 12
      }
    })
    
    return NextResponse.json(course, { status: 201 })
  } catch (error) {
    console.error('Error creating course:', error)
    return NextResponse.json({ error: 'Failed to create course' }, { status: 500 })
  }
}