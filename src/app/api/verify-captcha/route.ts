// app/api/verify-captcha/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token } = body;
    
    if (!token) {
      return NextResponse.json(
        { success: false, message: 'CAPTCHA token is required' },
        { status: 400 }
      );
    }
    
    // Get reCAPTCHA secret key from environment variable
    const secretKey = process.env.RECAPTCHA_SECRET_KEY;
    
    if (!secretKey) {
      console.error('RECAPTCHA_SECRET_KEY environment variable is not set');
      return NextResponse.json(
        { success: false, message: 'Server configuration error' },
        { status: 500 }
      );
    }
    
    // Verify the token with Google's reCAPTCHA API
    const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `secret=${secretKey}&response=${token}`,
    });
    
    const data = await response.json();
    
    if (data.success) {
      // Token is valid
      // Optional: Check score for reCAPTCHA v3
      if (data.score !== undefined) {
        // reCAPTCHA v3 returns a score from 0.0 to 1.0
        // 1.0 is very likely a good interaction, 0.0 is very likely a bot
        const score = data.score;
        
        // Store this score in your database for analytics and to adjust thresholds
        // Here we reject scores below 0.3, but you can adjust based on your risk tolerance
        if (score < 0.3) {
          return NextResponse.json(
            { 
              success: false, 
              message: 'Failed CAPTCHA verification',
              score 
            },
            { status: 403 }
          );
        }
        
        // Return success with score for the client to potentially use
        return NextResponse.json({ 
          success: true, 
          message: 'CAPTCHA verification successful',
          score 
        });
      }
      
      // Regular reCAPTCHA v2 success
      return NextResponse.json({ 
        success: true, 
        message: 'CAPTCHA verification successful' 
      });
    } else {
      // Token is invalid
      return NextResponse.json(
        { 
          success: false, 
          message: 'Failed CAPTCHA verification',
          errors: data['error-codes']
        },
        { status: 403 }
      );
    }
  } catch (error) {
    console.error('Error verifying CAPTCHA:', error);
    
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}