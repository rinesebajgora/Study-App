import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";

const client = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

export async function POST(request: NextRequest) {
  try {
    const { message } = await request.json();

    if (!message) {
      return NextResponse.json(
        { error: "Message is empty" },
        { status: 400 }
      );
    }
    const completion = await client.chat.completions.create({
      model: "llama-3.1-8b-instant", 
      messages: [
        {
          role: "system",
          content: "You are an AI Study Assistant for students of any subject." 
        },
        {
          role: "user",
          content: message
        }
      ],
      max_tokens: 1000
    });

    const reply = completion.choices[0].message.content;

    return NextResponse.json({ reply });

  } catch (error) {
    console.error("Groq API error:", error);

    return NextResponse.json(
      { error: "Error while communicating with AI" },
      { status: 500 }
    );
  }
}