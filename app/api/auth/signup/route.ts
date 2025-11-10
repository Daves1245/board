import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { checkSignupLimit, getClientIP } from "@/lib/rate-limit"
import bcrypt from "bcryptjs"
import { z } from "zod"

const signupSchema = z.object({
  username: z.string().min(3).max(30),
  password: z.string().min(6),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    // Check rate limit by IP
    const clientIP = getClientIP(request)
    const { success } = await checkSignupLimit(clientIP)
    if (!success) {
      return NextResponse.json(
        { error: 'Daily signup limit reached' },
        { status: 429 }
      )
    }

    const body = await request.json()
    const { username, password, firstName, lastName } = signupSchema.parse(body)

    // Check if username already exists
    const existingUser = await prisma.user.findUnique({
      where: { username: username.toLowerCase() }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'Username already taken' },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Create user
    const user = await prisma.user.create({
      data: {
        username: username.toLowerCase(),
        password: hashedPassword,
        firstName: firstName || null,
        lastName: lastName || null,
      },
      select: {
        id: true,
        username: true,
        firstName: true,
        lastName: true,
        dateJoined: true,
      }
    })

    return NextResponse.json({
      message: 'Account created successfully',
      user: {
        id: user.id,
        username: user.username,
        displayName: user.firstName || user.username,
      }
    }, { status: 201 })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input data' },
        { status: 400 }
      )
    }
    
    console.error('Error creating user:', error)
    return NextResponse.json(
      { error: 'Failed to create account' },
      { status: 500 }
    )
  }
}