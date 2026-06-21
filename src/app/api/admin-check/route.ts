import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { password } = await request.json();
    
    if (!password || !process.env.ADMIN_PASSWORD) {
      return NextResponse.json(
        { valid: false, error: 'Invalid request' },
        { status: 401 }
      );
    }
    
    // Compare passwords (simple check - in production, use bcrypt hashing)
    const isValid = password === process.env.ADMIN_PASSWORD;
    
    return NextResponse.json({ 
      valid: isValid,
      error: isValid ? null : 'Invalid password'
    });
    
  } catch (error) {
    console.error('Admin authentication error:', error);
    return NextResponse.json(
      { valid: false, error: 'Server error' },
      { status: 500 }
    );
  }
}
