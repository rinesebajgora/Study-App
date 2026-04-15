import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";

export async function POST(request: NextRequest) {
  try {
    const { message } = await request.json();
    const trimmedMessage = typeof message === "string" ? message.trim() : "";

    if (!trimmedMessage) {
      return NextResponse.json(
        { error: "Message is empty" },
        { status: 400 }
      );
    }

    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json(
        { error: "The AI service is not configured yet. Add GROQ_API_KEY to your environment." },
        { status: 500 }
      );
    }

    const client = new Groq({
      apiKey: process.env.GROQ_API_KEY
    });

    const completion = await client.chat.completions.create({
      model: "llama-3.1-8b-instant", 
      messages: [
        {
          role: "system",
          content: "You are an AI Study Assistant for students of any subject." 
        },
        {
          role: "user",
          content: trimmedMessage
        }
      ],
      max_tokens: 1000
    });

    const reply = completion.choices[0]?.message?.content?.trim();

    if (!reply) {
      return NextResponse.json(
        { error: "The AI returned an empty response. Please try again." },
        { status: 502 }
      );
    }

    return NextResponse.json({ reply });

  } catch (error) {
    console.error("Groq API error:", error);

    return NextResponse.json(
      { error: "We could not get a response from the AI right now. Please try again in a moment." },
      { status: 500 }
    );
  }
}
