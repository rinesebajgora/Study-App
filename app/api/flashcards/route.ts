import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";
import { createClient } from "@supabase/supabase-js";
import { consumeAiRateLimit } from "../../lib/ai-rate-limit";

type FlashcardPayload = {
  front: string;
  back: string;
};

function normalizeCards(value: unknown): FlashcardPayload[] {
  if (!Array.isArray(value)) return [];
  const usedFronts = new Set<string>();

  return value
    .map((item) => {
      if (!item || typeof item !== "object") return null;

      const front = "front" in item ? String(item.front).trim() : "";
      const back = "back" in item ? String(item.back).trim() : "";

      if (!front || !back) return null;

      return {
        front: front.endsWith("?") ? front : `${front}?`,
        back,
      };
    })
    .filter((item): item is FlashcardPayload => Boolean(item))
    .filter((item) => {
      const normalizedFront = item.front.toLowerCase().replace(/\s+/g, " ").trim();
      if (usedFronts.has(normalizedFront)) return false;
      usedFronts.add(normalizedFront);
      return true;
    })
    .slice(0, 8);
}

function parseCards(reply: string): FlashcardPayload[] {
  const trimmed = reply.trim();

  try {
    const parsed = JSON.parse(trimmed) as unknown;
    if (Array.isArray(parsed)) return normalizeCards(parsed);

    if (parsed && typeof parsed === "object" && "cards" in parsed) {
      return normalizeCards(parsed.cards);
    }
  } catch {
    // Fall through to text parsing.
  }

  const cards: FlashcardPayload[] = [];
  const blocks = trimmed
    .replaceAll("\r\n", "\n")
    .split(/\n\s*(?:-{3,}|\d+[\).\:-])\s*\n?/)
    .map((block) => block.trim())
    .filter(Boolean);

  for (const block of blocks) {
    const front =
      block.match(/(?:front|question|q)\s*:\s*([\s\S]*?)(?:\n\s*(?:back|answer|a)\s*:|$)/i)?.[1]?.trim() ?? "";
    const back = block.match(/(?:back|answer|a)\s*:\s*([\s\S]*)/i)?.[1]?.trim() ?? "";

    if (front && back) {
      cards.push({
        front: front.endsWith("?") ? front : `${front}?`,
        back,
      });
    }
  }

  return cards.slice(0, 8);
}

function createFallbackCards(params: {
  question: string;
  answer: string;
  subject: string;
  existingQuestions?: string[];
}): FlashcardPayload[] {
  const sentences = params.answer
    .replaceAll("\r\n", "\n")
    .split(/(?<=[.!?])\s+|\n+/)
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length > 30)
    .slice(0, 4);

  const usedFronts = new Set(
    (params.existingQuestions ?? []).map((item) =>
      item.toLowerCase().replace(/\s+/g, " ").trim()
    )
  );

  return [
    {
      front: `What question does this ${params.subject} note answer?`,
      back: params.question,
    },
    ...sentences.map((sentence, index) => ({
      front: `What is important fact ${index + 1} from this note?`,
      back: sentence,
    })),
  ].filter((card) => {
    const normalizedFront = card.front.toLowerCase().replace(/\s+/g, " ").trim();
    if (usedFronts.has(normalizedFront)) return false;
    usedFronts.add(normalizedFront);
    return true;
  }).slice(0, 5);
}

async function createAiCards(client: Groq, params: {
  question: string;
  answer: string;
  subject: string;
  existingQuestions: string[];
}) {
  const existingQuestionsText =
    params.existingQuestions.length > 0
      ? `Existing flashcard questions for this same note. Do not repeat these questions or ask the same idea in different words:\n${params.existingQuestions.map((item, index) => `${index + 1}. ${item}`).join("\n")}\n\n`
      : "";

  const completion = await client.chat.completions.create({
    model: "openai/gpt-oss-20b",
    messages: [
      {
        role: "system",
        content:
          "You generate study flashcards. Return only valid JSON with this shape: {\"cards\":[{\"front\":\"direct quiz question?\",\"back\":\"short answer\"}]}. Every front must be a direct question ending with a question mark.",
      },
      {
        role: "user",
        content: `Subject: ${params.subject}
Note question: ${params.question}
Note answer: ${params.answer}

${existingQuestionsText}Create 5 new useful flashcards for active recall. Focus on different facts, definitions, examples, steps, or practice angles than the existing questions. Do not include markdown or commentary.`,
      },
    ],
    max_tokens: 900,
  });

  return completion.choices[0]?.message?.content?.trim() ?? "";
}

export async function POST(request: NextRequest) {
  try {
    const authorization = request.headers.get("authorization");

    if (!authorization?.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "You must be logged in to generate flashcards." },
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

    const body = await request.json();
    const question = typeof body.question === "string" ? body.question.trim() : "";
    const answer = typeof body.answer === "string" ? body.answer.trim() : "";
    const subject = typeof body.subject === "string" && body.subject.trim() ? body.subject.trim() : "General";
    const existingQuestions = Array.isArray(body.existingQuestions)
      ? body.existingQuestions
          .map((item: unknown) => String(item ?? "").trim())
          .filter(Boolean)
          .slice(0, 30)
      : [];

    if (!question || !answer) {
      return NextResponse.json(
        { error: "A saved note question and answer are required." },
        { status: 400 }
      );
    }

    if (process.env.GROQ_API_KEY) {
      const allowed = await consumeAiRateLimit(supabase, "flashcards");
      if (!allowed) {
        return NextResponse.json(
          { error: "You've reached the AI request limit. Please wait a minute and try again." },
          { status: 429 }
        );
      }
    }

    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json(
        { cards: createFallbackCards({ question, answer, subject, existingQuestions }) },
        { status: 200 }
      );
    }

    let cards: FlashcardPayload[] = [];

    try {
      const client = new Groq({
        apiKey: process.env.GROQ_API_KEY,
      });

      const firstReply = await createAiCards(client, { question, answer, subject, existingQuestions });
      cards = parseCards(firstReply);

      if (cards.length === 0) {
        const repairCompletion = await client.chat.completions.create({
          model: "openai/gpt-oss-20b",
          messages: [
            {
              role: "system",
              content:
                "Fix malformed flashcard output. Return only valid JSON: {\"cards\":[{\"front\":\"direct quiz question?\",\"back\":\"short answer\"}]}.",
            },
            {
              role: "user",
              content: firstReply,
            },
          ],
          max_tokens: 900,
        });

        cards = parseCards(repairCompletion.choices[0]?.message?.content?.trim() ?? "");
      }
    } catch (error) {
      console.error("Flashcards AI fallback used:", error);
    }

    return NextResponse.json({
      cards: cards.length > 0 ? cards : createFallbackCards({ question, answer, subject, existingQuestions }),
    });
  } catch (error) {
    console.error("Flashcards API error:", error);

    return NextResponse.json(
      { error: "We could not generate flashcards right now. Please try again." },
      { status: 500 }
    );
  }
}
