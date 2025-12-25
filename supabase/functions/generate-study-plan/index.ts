import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { inputData, inputType, gradeLevel, region, days, maxDailyMinutes, language, fileUrl, fileType } = await req.json();
    
    console.log('[generate-study-plan] Received request:', { 
      inputType, 
      gradeLevel, 
      days, 
      maxDailyMinutes, 
      language, 
      inputDataLength: inputData?.length,
      hasFileUrl: !!fileUrl,
      fileType
    });
    
    const planDays = typeof days === 'number' && days > 0 ? Math.min(30, Math.max(1, days)) : undefined;
    const perDayLimit = typeof maxDailyMinutes === 'number' && maxDailyMinutes > 0 ? Math.min(180, Math.max(10, maxDailyMinutes)) : undefined;
    
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!lovableApiKey) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    // Process file if provided
    let extractedContent = '';
    let imageBase64: string | null = null;
    let imageMimeType: string | null = null;

    if (inputType === 'file' && fileUrl) {
      console.log(`[generate-study-plan] Downloading file from URL, type: ${fileType}`);
      
      try {
        const fileResponse = await fetch(fileUrl);
        if (!fileResponse.ok) {
          console.error(`[generate-study-plan] Failed to download file: ${fileResponse.status}`);
          return new Response(JSON.stringify({ 
            error: 'Failed to access the uploaded file. Please try uploading again.',
            errorCode: 'STORAGE_ERROR'
          }), {
            status: 422,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        
        const arrayBuffer = await fileResponse.arrayBuffer();
        const fileSize = arrayBuffer.byteLength;
        console.log(`[generate-study-plan] File downloaded, size: ${fileSize} bytes`);
        
        // Check file size (50MB limit for processing)
        if (fileSize > 50 * 1024 * 1024) {
          return new Response(JSON.stringify({ 
            error: 'File is too large to process. Please try a smaller file (under 50MB).',
            errorCode: 'FILE_TOO_LARGE'
          }), {
            status: 422,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        switch (fileType) {
          case 'pdf':
            // For PDFs, we'll convert to base64 and use vision API
            // The Gemini model can handle PDFs directly
            const pdfBytes = new Uint8Array(arrayBuffer);
            let pdfBinary = '';
            for (let i = 0; i < pdfBytes.length; i++) {
              pdfBinary += String.fromCharCode(pdfBytes[i]);
            }
            imageBase64 = btoa(pdfBinary);
            imageMimeType = 'application/pdf';
            console.log(`[generate-study-plan] PDF prepared for vision API, base64 length: ${imageBase64.length}`);
            break;
            
          case 'image':
            // Convert image to base64 for vision API
            const imgBytes = new Uint8Array(arrayBuffer);
            let imgBinary = '';
            for (let i = 0; i < imgBytes.length; i++) {
              imgBinary += String.fromCharCode(imgBytes[i]);
            }
            imageBase64 = btoa(imgBinary);
            // Determine MIME type from file extension
            const ext = inputData.toLowerCase().split('.').pop() || '';
            imageMimeType = ext === 'png' ? 'image/png' : 
                           ext === 'gif' ? 'image/gif' : 
                           ext === 'webp' ? 'image/webp' : 'image/jpeg';
            console.log(`[generate-study-plan] Image prepared for vision API, mime: ${imageMimeType}`);
            break;
            
          case 'docx':
            // Extract text from DOCX (which is a ZIP containing XML files)
            try {
              // Import JSZip for DOCX extraction
              const JSZip = (await import('https://esm.sh/jszip@3.10.1')).default;
              const zip = await JSZip.loadAsync(arrayBuffer);
              
              // DOCX stores content in word/document.xml
              const docXml = await zip.file('word/document.xml')?.async('text');
              if (docXml) {
                // Extract text from XML, removing tags
                extractedContent = docXml
                  .replace(/<w:p[^>]*>/g, '\n') // Paragraphs become newlines
                  .replace(/<w:tab[^>]*\/>/g, '\t') // Tabs
                  .replace(/<w:br[^>]*\/>/g, '\n') // Line breaks
                  .replace(/<[^>]+>/g, '') // Remove all XML tags
                  .replace(/&lt;/g, '<')
                  .replace(/&gt;/g, '>')
                  .replace(/&amp;/g, '&')
                  .replace(/&quot;/g, '"')
                  .replace(/&apos;/g, "'")
                  .replace(/\n{3,}/g, '\n\n') // Normalize multiple newlines
                  .trim();
                console.log(`[generate-study-plan] DOCX text extracted, length: ${extractedContent.length} chars`);
              } else {
                throw new Error('Could not find document content in DOCX');
              }
            } catch (docxError: any) {
              console.error('[generate-study-plan] DOCX extraction failed:', docxError.message);
              return new Response(JSON.stringify({ 
                error: 'Could not extract text from DOCX file. Please try a different file or copy/paste the content.',
                errorCode: 'DOCX_EXTRACTION_FAILED'
              }), {
                status: 422,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              });
            }
            break;
            
          case 'text':
            // Plain text files - extract content directly
            const decoder = new TextDecoder('utf-8');
            extractedContent = decoder.decode(arrayBuffer);
            console.log(`[generate-study-plan] Text extracted, length: ${extractedContent.length} chars`);
            break;
            
          default:
            return new Response(JSON.stringify({ 
              error: 'This file type is not supported. Please upload a PDF, image, DOCX, or text file.',
              errorCode: 'UNSUPPORTED_FILE'
            }), {
              status: 422,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }
      } catch (fileError: any) {
        console.error('[generate-study-plan] File processing error:', fileError);
        return new Response(JSON.stringify({ 
          error: `Failed to process file: ${fileError.message}`,
          errorCode: 'FILE_PROCESSING_ERROR'
        }), {
          status: 422,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    function getLanguageName(code: string): string {
      const languages: Record<string, string> = {
        'en': 'English', 'es': 'Spanish', 'fr': 'French', 'de': 'German', 'it': 'Italian',
        'pt': 'Portuguese', 'ru': 'Russian', 'ja': 'Japanese', 'ko': 'Korean', 'zh': 'Chinese',
        'ar': 'Arabic', 'hi': 'Hindi', 'tr': 'Turkish', 'pl': 'Polish', 'nl': 'Dutch'
      };
      return languages[code] || 'English';
    }

    const targetLanguage = language && language !== 'en' ? getLanguageName(language) : null;
    const languageInstruction = targetLanguage 
      ? `\n\n🔴 CRITICAL LANGUAGE REQUIREMENT: Generate ALL content (title, description, topics, activities, questions, solutions) in ${targetLanguage}. Every single word must be in ${targetLanguage}.`
      : '';

    // Create different prompts based on input type
    let prompt = '';
    let titleTemplate = '';
    let descriptionTemplate = '';
    let topicTemplate = '';
    
    // Use extracted content if available, otherwise use inputData
    const contentToAnalyze = extractedContent || inputData;
    
    switch (inputType) {
      case 'file':
        prompt = `🔴 CRITICAL: ANALYZE THIS EXACT DOCUMENT - NOT GENERIC CONCEPTS 🔴

${extractedContent ? `DOCUMENT TEXT CONTENT:\n"${contentToAnalyze.slice(0, 15000)}"\n\n` : 'DOCUMENT: See the attached file.\n\n'}
YOUR JOB: Create a study plan that teaches students about THIS SPECIFIC DOCUMENT'S content.

✅ CORRECT APPROACH:
- Reference specific passages, quotes, or arguments from THIS document
- "Day 1: Understanding [specific concept from the document]"
- "Day 2: Analyzing [specific section/chapter from the document]"

❌ WRONG APPROACH (DO NOT DO THIS):
- "Day 1: Understanding themes and messages in texts"
- Generic lessons about "how to analyze documents"

MANDATORY REQUIREMENTS:
1. Every lesson must reference SPECIFIC content from THIS document
2. Use direct quotes when possible
3. Discuss the ACTUAL concepts found in THIS document`;
        titleTemplate = inputData || 'the provided document';
        descriptionTemplate = 'Comprehensive study plan for analyzing and understanding the provided document';
        topicTemplate = 'Introduction and Key Concepts from the Document';
        break;
      case 'chat':
        prompt = `Based on the student's described difficulties: "${contentToAnalyze}", create a personalized study plan.`;
        titleTemplate = inputData;
        descriptionTemplate = `Comprehensive ${gradeLevel || ''} level study plan for mastering ${inputData}`;
        topicTemplate = `Core Concepts in ${inputData}`;
        break;
      case 'topic':
        prompt = `Create a comprehensive study plan for mastering the advanced topic: "${contentToAnalyze}".`;
        titleTemplate = inputData;
        descriptionTemplate = `Comprehensive ${gradeLevel || ''} level study plan for mastering ${inputData}`;
        topicTemplate = `Core Concepts in ${inputData}`;
        break;
      default:
        prompt = `Create a study plan based on: "${contentToAnalyze}".`;
        titleTemplate = inputData;
        descriptionTemplate = `Comprehensive study plan for ${inputData}`;
        topicTemplate = `Core Concepts in ${inputData}`;
    }

    const contextLine = `${gradeLevel ? `Grade level: ${gradeLevel}. ` : ''}${region ? `Curriculum/Country: ${region}. ` : ''}`;

    const actualDays = planDays ?? 14;
    const baseConstraints = [
      `YOU MUST CREATE EXACTLY ${actualDays} DAILY LESSONS - NO MORE, NO LESS.`,
      `The dailyLessons array MUST contain exactly ${actualDays} lesson objects.`,
      perDayLimit ? `Each lesson estimatedTime must be <= ${perDayLimit} minutes.` : 'Estimate realistic time commitments (30-60 minutes per day).',
      'Progress logically in a structured progression.',
      'Each day should build on the previous day\'s concepts.',
      'CRITICAL: Each lesson MUST include 2-3 example questions with detailed solutions.',
      'Keep each solution concise (3-5 short steps).'
    ];

    const constraints = baseConstraints.join('\n- ');

    const gradeContext = gradeLevel ? `\n\nCRITICAL: This is for a ${gradeLevel} student. Content must be appropriate for this grade level.` : '';

    const fullPrompt = `${contextLine}${prompt}${gradeContext}${languageInstruction}

    🔴 CRITICAL REQUIREMENT: You MUST generate EXACTLY ${actualDays} daily lessons. Count them carefully.

    Generate a detailed study plan. Use the return_study_plan function to return the result.
    
    Requirements:
    - ${constraints}
    - MANDATORY: Every lesson must have 2-3 example questions minimum
    - Each day should build progressively`;

    // Build messages array
    let userContent: any;
    if (imageBase64 && imageMimeType) {
      // Use vision API with the file
      userContent = [
        { 
          type: 'text', 
          text: `Analyze this uploaded document (filename: ${inputData}) and ${fullPrompt}` 
        },
        { 
          type: 'image_url', 
          image_url: { 
            url: `data:${imageMimeType};base64,${imageBase64}` 
          } 
        }
      ];
      console.log('[generate-study-plan] Using vision API with file');
    } else {
      userContent = fullPrompt;
      console.log('[generate-study-plan] Using text-only API');
    }

    const systemMessage = inputType === 'file' 
      ? `You are an expert educator analyzing a specific document. Your job is to discuss the ACTUAL content of the document provided - the specific themes, passages, arguments, and concepts. Create lessons about what the content ACTUALLY teaches. Every lesson must reference specific content from the provided document. Always respond using the return_study_plan function.`
      : `You are an expert educational consultant who creates comprehensive, grade-appropriate study plans. Build knowledge progressively. For math content, format solutions with clear numbered steps and LaTeX notation. Always respond using the return_study_plan function.`;

    async function callAIWithRetry(retries = 2, delayMs = 2000): Promise<Response> {
      for (let attempt = 0; attempt <= retries; attempt++) {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 90000); // 90 second timeout
        try {
          console.log(`[generate-study-plan] AI call attempt ${attempt + 1}/${retries + 1}`);
          
          const resp = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${lovableApiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: 'google/gemini-2.5-flash',
              messages: [
                { role: 'system', content: systemMessage },
                { role: 'user', content: userContent }
              ],
              tools: [
                {
                  type: 'function',
                  function: {
                    name: 'return_study_plan',
                    description: 'Return the generated study plan as structured JSON',
                    parameters: {
                      type: 'object',
                      additionalProperties: false,
                      required: ['id','title','description','weakAreas','estimatedDuration','difficultyLevel','dailyLessons'],
                      properties: {
                        id: { type: 'string' },
                        title: { type: 'string' },
                        description: { type: 'string' },
                        weakAreas: { type: 'array', items: { type: 'string' }, minItems: 1 },
                        estimatedDuration: { type: 'number' },
                        difficultyLevel: { type: 'string', enum: ['easy','medium','hard'] },
                        dailyLessons: {
                          type: 'array',
                          items: {
                            type: 'object',
                            additionalProperties: false,
                            required: ['day','topic','description','activities','estimatedTime'],
                            properties: {
                              day: { type: 'number' },
                              topic: { type: 'string' },
                              description: { type: 'string' },
                              activities: { type: 'array', items: { type: 'string' } },
                              estimatedTime: { type: 'number' },
                              exampleQuestions: {
                                type: 'array',
                                items: {
                                  type: 'object',
                                  additionalProperties: false,
                                  required: ['question','solution'],
                                  properties: {
                                    question: { type: 'string' },
                                    solution: { type: 'string' }
                                  }
                                }
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              ],
              tool_choice: { type: 'function', function: { name: 'return_study_plan' } },
              max_tokens: 8192,
            }),
            signal: controller.signal,
          });
          
          clearTimeout(timer);
          
          if (resp.ok) return resp;
          
          if (resp.status === 429 && attempt < retries) {
            console.log(`[generate-study-plan] Rate limited, waiting ${delayMs}ms before retry`);
            await new Promise(r => setTimeout(r, delayMs * (attempt + 1)));
            continue;
          }
          
          return resp;
        } catch (e) {
          clearTimeout(timer);
          if ((e as Error).name === 'AbortError') {
            console.log('[generate-study-plan] Request timed out');
            if (attempt < retries) {
              continue;
            }
            throw new Error('AI request timed out after multiple attempts');
          }
          throw e;
        }
      }
      return new Response(null, { status: 500 });
    }

    console.log('[generate-study-plan] Calling Lovable AI');
    const response = await callAIWithRetry();

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[generate-study-plan] AI error - Status:', response.status, 'Response:', errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limits exceeded, please try again later.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'Payment required, please add funds to your Lovable AI workspace.' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      return new Response(JSON.stringify({ 
        error: 'AI service temporarily unavailable. Please try again.',
        details: errorText,
        status: response.status 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('[generate-study-plan] AI request successful, parsing response...');

    const data = await response.json();

    // Parse study plan from tool call
    let studyPlan: any | null = null;
    const rawToolArgs = data.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
    
    function repairJsonString(s: string): string {
      let repaired = s;
      repaired = repaired.replace(/\\(?!["\\\/bfnrtu])/g, "\\\\");
      repaired = repaired.replace(/,(\s*[}\]])/g, '$1');
      return repaired;
    }
    
    if (rawToolArgs) {
      try {
        studyPlan = typeof rawToolArgs === 'string' ? JSON.parse(rawToolArgs) : rawToolArgs;
        console.log('[generate-study-plan] Successfully parsed tool args');
      } catch (e) {
        console.error('[generate-study-plan] Tool args JSON parse failed, attempting repair...');
        try {
          const repaired = repairJsonString(String(rawToolArgs));
          studyPlan = JSON.parse(repaired);
          console.log('[generate-study-plan] Tool args successfully repaired and parsed');
        } catch (e2) {
          console.error('[generate-study-plan] Tool args repair failed');
          studyPlan = null;
        }
      }
    }

    if (!studyPlan) {
      let planContent = data.choices?.[0]?.message?.content ?? '';
      if (typeof planContent !== 'string') {
        return new Response(JSON.stringify(planContent), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      planContent = planContent.trim().replace(/^```json\n?|\n?```$/g, '');

      function extractFirstJsonObject(text: string): string | null {
        let cleaned = text.replace(/^```json[\s\r\n]*/i, '').replace(/```$/i, '').trim();
        const start = cleaned.indexOf('{');
        const end = cleaned.lastIndexOf('}');
        if (start !== -1 && end !== -1 && end > start) {
          return cleaned.slice(start, end + 1);
        }
        return null;
      }

      const jsonStr = extractFirstJsonObject(planContent);
      try {
        const toParse = jsonStr ?? planContent;
        try {
          studyPlan = JSON.parse(toParse);
        } catch (_) {
          const repaired = repairJsonString(toParse);
          studyPlan = JSON.parse(repaired);
        }
      } catch (parseError) {
        console.error('[generate-study-plan] Failed to parse study plan JSON');
        return new Response(JSON.stringify({ error: 'Failed to generate valid study plan format' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    if (!studyPlan.id) {
      studyPlan.id = crypto.randomUUID();
    }

    // Normalize and enforce exact number of days
    const targetDays = actualDays;

    let lessons: any[] = Array.isArray(studyPlan.dailyLessons)
      ? studyPlan.dailyLessons
      : (studyPlan.dailyLessons && typeof studyPlan.dailyLessons === 'object')
        ? Object.values(studyPlan.dailyLessons)
        : [];

    lessons = lessons
      .filter((l) => l && typeof l === 'object')
      .map((l, idx) => ({
        day: Number.isFinite(Number(l.day)) ? Number(l.day) : idx + 1,
        topic: String(l.topic || `Day ${idx + 1} Topic`),
        description: String(l.description || 'Lesson details to be refined.'),
        activities: Array.isArray(l.activities) ? l.activities.map(String) : ['Study key concepts', 'Practice problems'],
        estimatedTime: Number.isFinite(Number(l.estimatedTime)) ? Number(l.estimatedTime) : (perDayLimit ?? 45),
        exampleQuestions: Array.isArray(l.exampleQuestions) ? l.exampleQuestions.map((q: any) => ({
          question: String(q?.question || 'Example question'),
          solution: String(q?.solution || 'Solution outline')
        })) : []
      }))
      .sort((a, b) => a.day - b.day);

    lessons = lessons.map((l, i) => ({
      ...l,
      day: i + 1,
      estimatedTime: perDayLimit ? Math.min(perDayLimit, Math.max(10, l.estimatedTime)) : l.estimatedTime,
    }));

    if (lessons.length > targetDays) {
      lessons = lessons.slice(0, targetDays);
      lessons = lessons.map((l, i) => ({ ...l, day: i + 1 }));
    }

    if (lessons.length < targetDays) {
      for (let i = lessons.length + 1; i <= targetDays; i++) {
        lessons.push({
          day: i,
          topic: `Day ${i}: Continue Building Mastery`,
          description: 'Focus on consolidating previous concepts and applying them to new problems.',
          activities: ['Review prior day\'s concepts', 'Apply to 2–3 new problems', 'Reflect and summarize learnings'],
          estimatedTime: perDayLimit ?? 45,
          exampleQuestions: []
        });
      }
    }

    studyPlan.dailyLessons = lessons;
    studyPlan.estimatedDuration = targetDays;

    console.log(`[generate-study-plan] Successfully generated plan with ${lessons.length} lessons`);

    return new Response(JSON.stringify(studyPlan), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[generate-study-plan] Error:', error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
