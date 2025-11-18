import { NextResponse } from 'next/server';

const REFERENCE_IMAGES = [
  'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/speculative-drawing_02-eijlN71qxSPxLFWqByu0lFXX8KuUO6.jpg',
  'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/speculative-drawing_07-Pbb9R8neSEAw1DDnOEqO2ubNmNywF6.jpg',
  'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/speculative-drawing_14-w4neAJG3jlW7h6bqR11YC93rUEHVhp.jpg',
];

const STYLE_FOUNDATION = `Pure minimalist line drawing illustration in the style of speculative philosophy diagrams. Single continuous black contour lines only, consistent medium line weight throughout. Absolute white background with no texture, grain, or shading. NO cross-hatching, NO fill, NO gradients, NO shadows. Clean vector-like quality with subtle organic hand-drawn imperfections. Centered composition with generous negative space. Philosophical and metaphorical visualization style similar to Graham Harman's object-oriented ontology illustrations and Dunne & Raby speculative design drawings.`;

const TECHNICAL_SPECS = `Technical execution: Pure black (#000000) ink lines on pure white (#FFFFFF) background. No pencil marks, no eraser marks, no construction lines visible. Lines should flow smoothly like a single pen stroke. Minimal detail, maximum conceptual clarity. Objects and figures should have organic, slightly irregular edges (not perfect geometric shapes).`;

const NEGATIVE_PROMPT = `FORBIDDEN ELEMENTS (DO NOT INCLUDE): color, shading, gradient, fill, texture, sketchy lines, multiple line weights, gray tones, pencil sketch, rough draft, background elements, photo-realistic, 3D rendering, hatching, cross-hatching, stippling, watercolor, painting, colored pencil, chalk, pastel, detailed rendering, realistic textures, shadows, highlights, depth, perspective lines, construction lines, multiple objects, cluttered composition, busy background, illustration style, cartoon, manga, comic book`;

export async function POST(request: Request) {
  try {
    const { imageData, mimeType, includeText = false } = await request.json();

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: 'GEMINI_API_KEY environment variable not set' },
        { status: 500 }
      );
    }

    const analyzeResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `Analyze this image and extract a PHILOSOPHICAL METAPHOR concept for a speculative drawing.

Format your response as:
[entity/figure] + [action/transformation] + [metaphorical element related to technology/time/consciousness]

Examples:
- "person dissolving into scattered coins" (commodification)
- "figure emerging from tangled wires" (digital entanglement)
- "body fragmenting into repeated layers" (time-complex identity)

Focus on: transformation, technology critique, temporal concepts, or human-machine relationships.
Keep it to ONE clear metaphor in 1-2 sentences.`,
                },
                {
                  inline_data: {
                    mime_type: mimeType,
                    data: imageData,
                  },
                },
              ],
            },
          ],
        }),
      }
    );

    if (!analyzeResponse.ok) {
      const errorText = await analyzeResponse.text();
      console.error('[v0] Gemini analysis error:', errorText);
      return NextResponse.json(
        { error: 'Failed to analyze image' },
        { status: analyzeResponse.status }
      );
    }

    const analyzeData = await analyzeResponse.json();
    const conceptMetaphor = analyzeData.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!conceptMetaphor) {
      return NextResponse.json(
        { error: 'Failed to extract concept' },
        { status: 500 }
      );
    }

    const captionInstructions = includeText 
      ? `- Include handwritten lowercase caption at bottom
- Caption should provide ironic philosophical commentary on technology/time

CAPTION STYLE EXAMPLES:
"problems getting used to living in a speculative time"
"the preemptive personality is one step ahead"  
"we are now post-everything (in the age of wire)"
"there is no outside"

Create a caption that relates to: ${conceptMetaphor}`
      : `- DO NOT include any text, captions, or writing
- Pure visual illustration only`;

    const imagePrompt = `${STYLE_FOUNDATION}

${TECHNICAL_SPECS}

STYLE REFERENCES (Match these EXACTLY):
${REFERENCE_IMAGES.map((url, i) => `- Reference ${i + 1}: ${url}`).join('\n')}

SUBJECT METAPHOR:
${conceptMetaphor}

COMPOSITION GUIDANCE:
- Center the metaphorical subject in the middle third
- Minimum 40% white space around subject
- Single focal point with flowing transformation lines
${captionInstructions}

${NEGATIVE_PROMPT}`;

    console.log('[v0] Generating with concept:', conceptMetaphor);
    console.log('[v0] Include text:', includeText);
    
    const generateResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: imagePrompt,
                },
                {
                  inline_data: {
                    mime_type: mimeType,
                    data: imageData,
                  },
                },
              ],
            },
          ],
        }),
      }
    );

    if (!generateResponse.ok) {
      const errorText = await generateResponse.text();
      console.error('[v0] Image generation error:', errorText);
      return NextResponse.json(
        { error: 'Failed to generate image' },
        { status: generateResponse.status }
      );
    }

    const generateData = await generateResponse.json();
    
    const imagePart = generateData.candidates?.[0]?.content?.parts?.find(
      (part: any) => part.inlineData || part.inline_data
    );

    const imageDataGenerated = imagePart?.inlineData?.data || imagePart?.inline_data?.data;

    if (imageDataGenerated) {
      if (!process.env.IMGBB_API_KEY) {
        console.error('[v0] IMGBB_API_KEY not set, returning base64 only');
        return NextResponse.json({ 
          imageData: imageDataGenerated 
        });
      }

      const formData = new URLSearchParams();
      formData.append('key', process.env.IMGBB_API_KEY);
      formData.append('image', imageDataGenerated);

      const imgbbResponse = await fetch('https://api.imgbb.com/1/upload', {
        method: 'POST',
        body: formData,
      });

      if (!imgbbResponse.ok) {
        console.error('[v0] ImgBB upload failed, returning base64');
        return NextResponse.json({ 
          imageData: imageDataGenerated 
        });
      }

      const imgbbData = await imgbbResponse.json();
      const imageUrl = imgbbData.data?.display_url || imgbbData.data?.url;

      // Save to gallery
      try {
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 
                       (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000');
        await fetch(`${baseUrl}/api/gallery`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: imageUrl }),
        });
      } catch (error) {
        console.error('[v0] Gallery save failed:', error);
      }

      return NextResponse.json({ 
        imageUrl,
        imageData: imageDataGenerated
      });
    }

    return NextResponse.json(
      { error: 'No image data in response' },
      { status: 500 }
    );
  } catch (error) {
    console.error('[v0] Generation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
