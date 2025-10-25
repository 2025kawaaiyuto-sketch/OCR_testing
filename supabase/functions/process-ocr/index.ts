import { createClient } from 'npm:@supabase/supabase-js@2';
import { Hono } from 'npm:hono@4.4.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

const app = new Hono();

app.options('/*', (c) => {
  return c.json(null, {
    status: 200,
    headers: corsHeaders,
  });
});

app.post('/process-ocr', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    if (!authHeader) {
      return c.json({ error: 'Missing authorization header' }, {
        status: 401,
        headers: corsHeaders,
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: {
        headers: { Authorization: authHeader },
      },
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return c.json({ error: 'Unauthorized' }, {
        status: 401,
        headers: corsHeaders,
      });
    }

    const body = await c.req.json();
    const { imageData, resultId } = body;

    if (!imageData || !resultId) {
      return c.json({ error: 'Missing imageData or resultId' }, {
        status: 400,
        headers: corsHeaders,
      });
    }

    // Use Tesseract OCR via external API (OCR.space free tier)
    const formData = new FormData();
    formData.append('base64Image', imageData);
    formData.append('language', 'eng');
    formData.append('isOverlayRequired', 'false');
    formData.append('detectOrientation', 'true');
    formData.append('scale', 'true');

    const ocrResponse = await fetch('https://api.ocr.space/parse/image', {
      method: 'POST',
      headers: {
        'apikey': 'K87899142388957', // Free tier API key
      },
      body: formData,
    });

    const ocrResult = await ocrResponse.json();

    if (ocrResult.IsErroredOnProcessing) {
      await supabase
        .from('ocr_results')
        .update({
          status: 'failed',
          error_message: ocrResult.ErrorMessage?.[0] || 'OCR processing failed',
          processed_at: new Date().toISOString(),
        })
        .eq('id', resultId)
        .eq('user_id', user.id);

      return c.json({
        error: ocrResult.ErrorMessage?.[0] || 'OCR processing failed',
      }, {
        status: 500,
        headers: corsHeaders,
      });
    }

    const extractedText = ocrResult.ParsedResults?.[0]?.ParsedText || '';
    const confidence = ocrResult.ParsedResults?.[0]?.FileParseExitCode === 1 ? 0.95 : 0.5;

    await supabase
      .from('ocr_results')
      .update({
        extracted_text: extractedText,
        confidence,
        status: 'completed',
        processed_at: new Date().toISOString(),
      })
      .eq('id', resultId)
      .eq('user_id', user.id);

    return c.json({
      success: true,
      text: extractedText,
      confidence,
    }, {
      headers: corsHeaders,
    });
  } catch (error) {
    console.error('OCR processing error:', error);
    return c.json({
      error: 'Internal server error',
      details: error.message,
    }, {
      status: 500,
      headers: corsHeaders,
    });
  }
});

export default {
  fetch: app.fetch,
};