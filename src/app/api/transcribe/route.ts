import { NextRequest, NextResponse } from "next/server";
import ZAI from "z-ai-web-dev-sdk";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface TranscribeResponse {
  text: string;
  confidence: number;
  language: string;
  duration: number;
}

// ---------------------------------------------------------------------------
// ZAI singleton – create once, reuse across requests
// ---------------------------------------------------------------------------

let zaiInstance: ZAI | null = null;

async function getZAI(): Promise<ZAI> {
  if (!zaiInstance) {
    zaiInstance = await ZAI.create();
  }
  return zaiInstance;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Convert an ArrayBuffer to a base64 string */
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// ---------------------------------------------------------------------------
// POST handler
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    const contentType = request.headers.get("content-type") || "";
    let base64Audio: string;

    // ------------------------------------------------------------------
    // Case 1: multipart/form-data — read the `audio` file field
    // ------------------------------------------------------------------
    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const audioFile = formData.get("audio");

      if (!audioFile || !(audioFile instanceof File)) {
        return NextResponse.json(
          { error: "No audio file found in 'audio' field of multipart form data" },
          { status: 400 },
        );
      }

      // Validate file size (max 25 MB)
      if (audioFile.size > 25 * 1024 * 1024) {
        return NextResponse.json(
          { error: "Audio file too large. Maximum size is 25 MB" },
          { status: 400 },
        );
      }

      // Validate file type
      const validTypes = [
        "audio/wav",
        "audio/wave",
        "audio/x-wav",
        "audio/webm",
        "audio/mp3",
        "audio/mpeg",
        "audio/ogg",
      ];
      if (audioFile.type && !validTypes.includes(audioFile.type)) {
        return NextResponse.json(
          {
            error: `Unsupported audio format: ${audioFile.type}. Supported formats: WAV, WebM, MP3, OGG`,
          },
          { status: 400 },
        );
      }

      const arrayBuffer = await audioFile.arrayBuffer();
      base64Audio = arrayBufferToBase64(arrayBuffer);
    }
    // ------------------------------------------------------------------
    // Case 2: JSON body with base64-encoded audio
    // ------------------------------------------------------------------
    else if (contentType.includes("application/json")) {
      let body: { audioBase64?: string; format?: string };

      try {
        body = await request.json();
      } catch {
        return NextResponse.json(
          { error: "Invalid JSON in request body" },
          { status: 400 },
        );
      }

      const { audioBase64, format } = body;

      if (
        !audioBase64 ||
        typeof audioBase64 !== "string" ||
        audioBase64.trim().length === 0
      ) {
        return NextResponse.json(
          { error: "A non-empty 'audioBase64' field is required in JSON body" },
          { status: 400 },
        );
      }

      // Validate format if provided
      if (format) {
        const validFormats = ["wav", "webm", "mp3", "ogg"];
        if (!validFormats.includes(format.toLowerCase())) {
          return NextResponse.json(
            {
              error: `Unsupported format: ${format}. Supported formats: wav, webm, mp3, ogg`,
            },
            { status: 400 },
          );
        }
      }

      base64Audio = audioBase64;
    }
    // ------------------------------------------------------------------
    // Case 3: Unsupported content type
    // ------------------------------------------------------------------
    else {
      return NextResponse.json(
        {
          error:
            "Unsupported Content-Type. Use multipart/form-data with 'audio' field or application/json with 'audioBase64' field",
        },
        { status: 400 },
      );
    }

    // ------------------------------------------------------------------
    // Validate that we have audio data
    // ------------------------------------------------------------------
    if (!base64Audio || base64Audio.length === 0) {
      return NextResponse.json(
        { error: "No audio data provided" },
        { status: 400 },
      );
    }

    // ------------------------------------------------------------------
    // Call ASR via z-ai-web-dev-sdk
    // ------------------------------------------------------------------
    const zai = await getZAI();

    const asrResult = await zai.audio.asr.create({
      file_base64: base64Audio,
    });

    const processingTime = Date.now() - startTime;

    // ------------------------------------------------------------------
    // Parse ASR response
    // ------------------------------------------------------------------
    let transcribedText = "";
    let confidence = 0.9;
    let detectedLanguage = "hi-IN";
    let duration = 0;

    if (typeof asrResult === "string") {
      transcribedText = asrResult;
    } else if (asrResult && typeof asrResult === "object") {
      // Handle various response shapes from the SDK
      transcribedText =
        asrResult.text ??
        asrResult.transcription ??
        asrResult.content ??
        "";

      confidence = asrResult.confidence ?? asrResult.score ?? 0.9;

      detectedLanguage =
        asrResult.language ??
        asrResult.detected_language ??
        asrResult.locale ??
        "hi-IN";

      duration =
        asrResult.duration ??
        asrResult.audio_duration ??
        processingTime / 1000; // Fallback: use processing time as approximate
    }

    // Ensure confidence is within 0-1 range
    if (confidence > 1) confidence = confidence / 100;
    confidence = Math.max(0, Math.min(1, confidence));

    const response: TranscribeResponse = {
      text: transcribedText,
      confidence: Math.round(confidence * 100) / 100,
      language: detectedLanguage,
      duration: Math.round(duration * 100) / 100,
    };

    return NextResponse.json(response);
  } catch (error) {
    const processingTime = Date.now() - startTime;
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";

    console.error(
      `[ArthSathi ASR] Transcription failed after ${processingTime}ms:`,
      errorMessage,
    );

    // Return 400 for known client-caused errors (e.g. audio too long/short, bad format)
    const isClientError =
      errorMessage.includes("0-30") ||
      errorMessage.includes("duration") ||
      errorMessage.includes("format") ||
      errorMessage.includes("too large") ||
      errorMessage.includes("invalid");

    return NextResponse.json(
      {
        error: isClientError
          ? "Audio could not be transcribed. Please ensure your recording is between 1-30 seconds with clear speech."
          : "Failed to transcribe audio. Please try again.",
        details: errorMessage,
      },
      { status: isClientError ? 400 : 500 },
    );
  }
}
