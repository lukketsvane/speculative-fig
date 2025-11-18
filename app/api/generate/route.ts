import { NextResponse } from 'next/server';

const REFERENCE_IMAGES = [
  'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/speculative-drawing_02-eijlN71qxSPxLFWqByu0lFXX8KuUO6.jpg',
  'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/speculative-drawing_07-Pbb9R8neSEAw1DDnOEqO2ubNmNywF6.jpg',
  'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/speculative-drawing_14-w4neAJG3jlW7h6bqR11YC93rUEHVhp.jpg',
];

const STYLE_GUIDE = `You MUST create artwork in this EXACT style:

VISUAL STYLE (CRITICAL):
- Pure black continuous lines on white background - NO shading, NO fills, NO gray tones
- Hand-drawn aesthetic with slightly wobbly, organic lines (not computer-perfect)
- Minimalist line art using single continuous strokes where possible
- Surreal, abstracted human figures with distorted proportions and impossible geometries
- Layered/repeated line motifs creating motion or philosophical depth
- Clean white background with high contrast black lines

CONCEPTUAL APPROACH:
- Philosophical commentary on technology, algorithms, time, and human consciousness
- Transform literal subjects into speculative, metaphorical interpretations
- Satirical/critical perspective on digital life and modern existence
- Surreal visual metaphors (e.g., elongated limbs, multiplied forms, merged bodies)

COMPOSITION:
- Simple, centered compositions with lots of white space
- Include handwritten lowercase text caption that provides ironic/philosophical commentary
- Text should be integrated naturally, appearing hand-lettered in a casual style
- Caption format: brief phrase about technology, time, or speculative futures

FORBIDDEN:
- NO photorealistic details
- NO shading or gradients
- NO fills or solid black areas (except small accents)
- NO color
- NO typed/digital fonts

Think: "What would this look like as a New Yorker-style philosophical cartoon about technology and time?"`;

export async function POST(request: Request) {
  try {
    const { imageData, mimeType } = await request.json();
    console.log('[v0] Received request with mimeType:', mimeType);

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: 'GEMINI_API_KEY environment variable not set' },
        { status: 500 }
      );
    }

    console.log('[v0] Starting image analysis with gemini-flash-latest');
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
                  text: 'Describe the KEY SUBJECT and MOOD of this image in 2-3 sentences. Focus on what could be transformed into a philosophical metaphor about technology, time, or human existence. Be conceptual, not literal.',
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
    
    const description = analyzeData.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!description) {
      console.error('[v0] No description in response');
      return NextResponse.json(
        { error: 'Failed to get image description' },
        { status: 500 }
      );
    }

    console.log('[v0] Image concept:', description);

    const imagePrompt = `${STYLE_GUIDE}

REFERENCE STYLE: Study these exact reference images to match the style perfectly:
${REFERENCE_IMAGES.map((url, i) => `Reference ${i + 1}: ${url}`).join('\n')}

SOURCE CONCEPT: ${description}

YOUR TASK:
Transform the above concept into a speculative line drawing that looks EXACTLY like the reference images. The uploaded image is your composition reference - use its subject and mood, but render it as a philosophical, surreal line drawing with a critical commentary caption about technology or time.

Example caption styles:
- "problems getting used to living in a speculative time"
- "the preemptive personality is one step ahead"
- "we are now post-everything (in the age of wire)"
- "there is no outside"

Create a thought-provoking visual metaphor with handwritten text.`;

    console.log('[v0] Starting image generation with gemini-2.5-flash-image');
    
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
      console.log('[v0] Successfully generated image');
      
      if (!process.env.IMGBB_API_KEY) {
        console.error('[v0] IMGBB_API_KEY not set, returning base64');
        return NextResponse.json({ 
          imageData: imageDataGenerated 
        });
      }

      console.log('[v0] Uploading image to ImgBB');
      const formData = new URLSearchParams();
      formData.append('key', process.env.IMGBB_API_KEY);
      formData.append('image', imageDataGenerated);

      const imgbbResponse = await fetch('https://api.imgbb.com/1/upload', {
        method: 'POST',
        body: formData,
      });

      if (!imgbbResponse.ok) {
        const errorText = await imgbbResponse.text();
        console.error('[v0] ImgBB upload error:', errorText);
        return NextResponse.json({ 
          imageData: imageDataGenerated 
        });
      }

      const imgbbData = await imgbbResponse.json();
      console.log('[v0] ImgBB upload success:', imgbbData.data?.url);

      return NextResponse.json({ 
        imageUrl: imgbbData.data?.display_url || imgbbData.data?.url,
        imageData: imageDataGenerated
      });
    }

    console.error('[v0] No image data found in response');
    return NextResponse.json(
      { error: 'No image was generated by the API' },
      { status: 500 }
    );
  } catch (error) {
    console.error('[v0] Error generating image:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
