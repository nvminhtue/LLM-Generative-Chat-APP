import { findCheapestHotel } from "../../../api/hotel-workflow";
import { ChatMessage } from "../../../api/types";

const NEWLINE = "$NEWLINE$";

// should be declared (!)
export const dynamic = "force-dynamic";

export const POST = async (request: Request) => {
  const responseStream = new TransformStream();
  const writer = responseStream.writable.getWriter();
  const encoder = new TextEncoder();

  try {
    const body = await request.json();
    const userQuery = body.query || "Find me a cheap hotel for tomorrow";
    const conversationHistory: ChatMessage[] = body.conversationHistory || [];

    // Start the workflow execution
    (async () => {
      try {
        await writer.write(
          encoder.encode(`event: token\ndata: 🔍 Processing your request...${NEWLINE}${NEWLINE}\n\n`)
        );

        const result = await findCheapestHotel(userQuery, conversationHistory);

        // Send conversation history as metadata
        await writer.write(
          encoder.encode(`event: conversation\ndata: ${JSON.stringify(result.conversationHistory)}\n\n`)
        );

        // Send workflow state as metadata
        await writer.write(
          encoder.encode(`event: state\ndata: ${JSON.stringify({ 
            needsUserInput: result.needsUserInput, 
            conversationComplete: result.conversationComplete,
            hasResults: !!result.cheapestOption 
          })}\n\n`)
        );

        if (result.error) {
          await writer.write(
            encoder.encode(`event: token\ndata: ${result.error}${NEWLINE}\n\n`)
          );
        } else {
          // Stream the analysis
          const analysisLines = result.analysis.split('\n');
          for (const line of analysisLines) {
            if (line.trim()) {
              await writer.write(
                encoder.encode(`event: token\ndata: ${line.replace(/\n/g, NEWLINE)}${NEWLINE}\n\n`)
              );
              // Small delay for better streaming effect
              await new Promise(resolve => setTimeout(resolve, 100));
            }
          }

          // Add cheapest option details if available
          if (result.cheapestOption) {
            await writer.write(
              encoder.encode(`event: token\ndata: ${NEWLINE}## 🏆 Recommended Option${NEWLINE}${NEWLINE}\n\n`)
            );
            
            const details = [
              `**${result.cheapestOption.hotelName}**`,
              `Room Type: ${result.cheapestOption.roomType}`,
              `💰 Price: $${result.cheapestOption.price} per night`,
              `📍 Location: ${result.cheapestOption.location}`,
              `⭐ Rating: ${result.cheapestOption.rating}/5`,
              `🏢 Provider: ${result.cheapestOption.provider}`,
              ``,
              `**Amenities:**`,
              ...result.cheapestOption.amenities.map(amenity => `- ${amenity}`),
              ``,
              `*${result.cheapestOption.description}*`
            ];

            for (const detail of details) {
              await writer.write(
                encoder.encode(`event: token\ndata: ${detail}${NEWLINE}\n\n`)
              );
              await new Promise(resolve => setTimeout(resolve, 50));
            }
          }
        }

        await writer.write(encoder.encode(`event: finished\ndata: true\n\n`));
        await writer.close();
      } catch (error) {
        console.error('Workflow execution error:', error);
        await writer.write(
          encoder.encode(`event: token\ndata: ❌ An error occurred while processing your request. Please try again.${NEWLINE}\n\n`)
        );
        await writer.write(encoder.encode(`event: finished\ndata: true\n\n`));
        await writer.close();
      }
    })();

    return new Response(responseStream.readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  } catch (error) {
    console.error('API error:', error);
    return new Response(
      JSON.stringify({ error: "Failed to process request" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
