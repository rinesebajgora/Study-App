import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";
import { createClient } from "@supabase/supabase-js";

type DocumentChunk = {
  content: string;
  source_name: string;
  page_number: number | null;
};

function findRelevantChunks(message: string, chunks: DocumentChunk[]) {
  const ignored = new Set(["about", "after", "again", "also", "answer", "could", "explain", "from", "have", "into", "please", "should", "study", "that", "the", "these", "this", "what", "with", "would", "your"]);
  const terms = [...new Set(message.toLowerCase().match(/[\p{L}\p{N}]{3,}/gu)?.filter((term) => !ignored.has(term)) ?? [])];
  if (terms.length === 0) return [];

  return chunks
    .map((chunk) => {
      const text = chunk.content.toLowerCase();
      const score = terms.reduce((total, term) => total + (text.includes(term) ? 1 : 0), 0);
      return { ...chunk, score };
    })
    .filter((chunk) => chunk.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);
}

export async function POST(request: NextRequest) {
  try {
    const authorization = request.headers.get("authorization");

    if (!authorization?.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "You must be logged in to use the AI assistant." },
        { status: 401 }
      );
    }

    if (
      !process.env.NEXT_PUBLIC_SUPABASE_URL ||
      !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    ) {
      return NextResponse.json(
        { error: "Supabase is not configured yet." },
        { status: 500 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        global: {
          headers: {
            Authorization: authorization,
          },
        },
      }
    );

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Your session expired. Please log in again." },
        { status: 401 }
      );
    }

    const { message } = await request.json();
    const trimmedMessage = typeof message === "string" ? message.trim() : "";

    if (!trimmedMessage) {
      return NextResponse.json(
        { error: "Message is empty" },
        { status: 400 }
      );
    }

    const { data: documentRows } = await supabase
      .from("document_chunks")
      .select("content, source_name, page_number")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(500);
    const relevantChunks = findRelevantChunks(trimmedMessage, (documentRows ?? []) as DocumentChunk[]);
    const documentContext = relevantChunks.length === 0
      ? "No relevant student document excerpts were found."
      : relevantChunks.map((chunk, index) => `[${index + 1}] ${chunk.source_name}${chunk.page_number ? `, page ${chunk.page_number}` : ""}\n${chunk.content}`).join("\n\n");

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
      model: "openai/gpt-oss-20b",
      messages: [
        {
          role: "system",
          content:
            "You are an AI Study Assistant for students of any subject. Explain concepts in simple language, give short examples when helpful, and guide students step by step. Keep answers clear, friendly, and focused on learning instead of only giving final answers. When document excerpts are provided, use them as the primary source. Do not invent facts that are claimed to come from a document. Refer to excerpt numbers such as [1] when you rely on them.",
        },
        {
          role: "user",
          content: `Student question:\n${trimmedMessage}\n\nRelevant excerpts from the student's documents:\n${documentContext}`
        }
      ],
      // Reserve enough space for a complete plan while keeping responses bounded.
      max_completion_tokens: 2400,
      reasoning_effort: "low",
    });

    const reply = completion.choices[0]?.message?.content?.trim();

    if (!reply) {
      return NextResponse.json(
        { error: "The AI returned an empty response. Please try again." },
        { status: 502 }
      );
    }

    const sources = [...new Set(relevantChunks.map((chunk) => `${chunk.source_name}${chunk.page_number ? `, page ${chunk.page_number}` : ""}`))];
    const replyWithSources = sources.length > 0
      ? `${reply}\n\nSources:\n${sources.map((source) => `- ${source}`).join("\n")}`
      : reply;

    return NextResponse.json({ reply: replyWithSources, sources });

  } catch (error) {
    console.error("Groq API error:", error);

    return NextResponse.json(
      { error: "We could not get a response from the AI right now. Please try again in a moment." },
      { status: 500 }
    );
  }
}
