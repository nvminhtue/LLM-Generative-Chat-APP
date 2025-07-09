import { GoogleGenAI } from "@google/genai";

const NEWLINE = "$NEWLINE$";
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });


// should be declared (!)
export const dynamic = "force-dynamic";

export const GET = async (request: Request) => {
  let responseStream = new TransformStream();
  const writer = responseStream.writable.getWriter();
  const encoder = new TextEncoder();

  // const completion = await ai.chat.completions.create({
  //   model: "gpt-3.5-turbo",
  //   messages: [
  //     { role: "system", content: "You are a helpful assistant." },
  //     {
  //       role: "user",
  //       content: MARKDOWN_PROMPT,
  //     },
  //   ],
  //   stream: true,
  // });
  const completion = await ai.models.generateContentStream({
    model: 'gemini-2.0-flash-001',
    // contents: [
    //   {
    //     role: 'system',
    //     parts: [
    //       {
    //         text: 'You are a helpful assistant.'
    //       }
    //     ]
    //   },
    //   {
    //     role: "user",
    //     parts: [
    //       {
    //         text: MARKDOWN_PROMPT
    //       }
    //     ]
    //   }
    // ]
    contents: 'give me some well known hotel booking platforms'
  });

  (async () => {
    for await (const chunk of completion) {
      const content = chunk.text;
      if (content !== undefined && content !== null) {
        // avoid newlines getting messed up
        const contentWithNewlines = content.replace(/\n/g, NEWLINE);
        await writer.write(
          encoder.encode(`event: token\ndata: ${contentWithNewlines}\n\n`)
        );
      }
    }

    await writer.write(encoder.encode(`event: finished\ndata: true\n\n`));
    await writer.close();
  })();
  return new Response(responseStream.readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
    },
  });
};
