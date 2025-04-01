import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

// Create a more robust OpenAI client configuration
const getOpenAIInstance = () => {
  const apiKey = process.env.OPENAI_API_KEY;
  
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not defined in environment variables');
  }
  
  return new OpenAI({
    apiKey: apiKey,
  });
};

/**
 * API route for generating item descriptions using OpenAI
 */
export async function POST(request: NextRequest) {
  console.log('Generate description API route called');
  
  try {
    // Parse the request body
    const body = await request.json();
    const { name } = body;
    
    if (!name || typeof name !== 'string' || name.length < 3) {
      console.log('Invalid item name:', name);
      return NextResponse.json(
        { error: 'Invalid item name. Please provide a name with at least 3 characters.' },
        { status: 400 }
      );
    }

    try {
      // Get OpenAI instance
      const openai = getOpenAIInstance();
      console.log(`Generating description for: "${name}" using gpt-4o-mini`);

      // Call OpenAI API
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are a product description expert who creates extremely concise descriptions. Your descriptions must always be 40 words or less - this is a strict requirement."
          },
          {
            role: "user",
            content: `Generate a brief product description for "${name}". The description MUST:
            1. Be no more than 40 words total (this is a strict requirement)
            2. Be 1-2 sentences long
            3. Highlight key features or characteristics
            4. Be factual and objective
            5. Not use marketing language

            Return ONLY the description text with no additional commentary or formatting. Count the words carefully to ensure you don't exceed 40 words.`
          }
        ],
        temperature: 0.7,
        max_tokens: 100,
      });

      console.log("OpenAI API response status: success");
      
      // Extract the generated description from the response
      let generatedDescription = response.choices[0]?.message.content?.trim();
      
      if (!generatedDescription) {
        console.error("Received empty response from OpenAI");
        throw new Error("Received empty response from OpenAI");
      }

      // Additional safety check to ensure we stay under 40 words
      const wordCount = generatedDescription.split(/\s+/).length;
      if (wordCount > 40) {
        console.log(`Description exceeded 40 words (${wordCount}). Truncating...`);
        const words = generatedDescription.split(/\s+/).slice(0, 40);
        generatedDescription = words.join(' ');
        
        // Add ellipsis if we truncated and ensure the last sentence ends with punctuation
        if (!generatedDescription.match(/[.!?]$/)) {
          generatedDescription += '.';
        }
      }

      // Return the generated description
      return NextResponse.json({ description: generatedDescription });
      
    } catch (openaiError: any) {
      // Handle specific OpenAI errors
      console.error('OpenAI API error:', openaiError);
      
      // Check if it's an authentication error
      if (openaiError.status === 401) {
        return NextResponse.json(
          { error: 'OpenAI API authentication failed. Please check your API key.' },
          { status: 401 }
        );
      }
      
      // Check if it's a rate limit error
      if (openaiError.status === 429) {
        return NextResponse.json(
          { error: 'OpenAI API rate limit exceeded. Please try again later.' },
          { status: 429 }
        );
      }
      
      // Default error response
      return NextResponse.json(
        { error: 'Error generating description with OpenAI', details: openaiError.message },
        { status: 502 }
      );
    }
  } catch (error: any) {
    console.error('General error in generate-description API route:', error);
    return NextResponse.json(
      { error: 'Failed to process request', details: error.message },
      { status: 500 }
    );
  }
}