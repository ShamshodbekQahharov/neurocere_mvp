import Anthropic from '@anthropic-ai/sdk';

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

/**
 * Trigger AI analysis for a report (internal function)
 */
export async function triggerAIAnalysis(
  reportId: string,
  childId: string,
  reportData: {
    full_name: string;
    diagnosis: string;
    mood_score: number;
    speech_notes?: string | null;
    behavior_notes?: string | null;
    sleep_hours?: number | null;
    appetite?: 'poor' | 'fair' | 'good' | 'excellent' | null;
    tasks_completed?: number | null;
    notes?: string | null;
  }
): Promise<void> {
  // Skip if API key not configured
  if (!process.env.ANTHROPIC_API_KEY) {
    console.log('ANTHROPIC_API_KEY not configured, skipping AI analysis');
    return;
  }

  try {
    // Build prompt for AI
    const prompt = `Sen tibbiy yordamchi AI san. 
Bolani rivojlanish hisobotini tahlil qilasiz. 
Faqat kuzatuv va tavsiyalar berasan. 
Hech qachon rasmiy tashxis qo'ymaysan.

Bola: ${reportData.full_name}
Tashxis: ${reportData.diagnosis}

Bugungi hisobot:
- Kayfiyat: ${reportData.mood_score}/10
- Uyqu: ${reportData.sleep_hours || 'kiritilmagan'} soat
- Ishtaha: ${reportData.appetite || 'kiritilmagan'}
- Nutq: ${reportData.speech_notes || 'kiritilmagan'}
- Xulq: ${reportData.behavior_notes || 'kiritilmagan'}
- Vazifalar bajarilgan: ${reportData.tasks_completed || 0}%
- Izohlar: ${reportData.notes || 'kiritilmagan'}

Qisqacha kuzatuv va doktorga 2-3 tavsiya ber.
Javobni o'zbek tilida yoz.`;

    // Call Claude API
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 500,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const aiResponse = message.content[0].type === 'text' ? message.content[0].text : 'AI javobi mavjud emas';

    // Save AI analysis to database
    await supabaseAdmin
      .from('ai_analyses')
      .insert({
        child_id: childId,
        analysis_type: 'report',
        input_data: reportData,
        result: aiResponse,
        confidence: 0.85,
      });

    // Update report with AI summary
    await supabaseAdmin
      .from('reports')
      .update({ ai_summary: aiResponse })
      .eq('id', reportId);

    console.log(`AI analysis completed for report ${reportId}`);
  } catch (error) {
    console.error('AI analysis error:', error);
    // Don't throw - this is a non-critical operation
  }
}

/**
 * Analyze report (public function)
 * @returns AI analysis result or null on error
 */
export async function analyzeReport(reportData: object): Promise<string | null> {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.log('ANTHROPIC_API_KEY not configured');
    return null;
  }

  try {
    console.log('Calling Claude API for report analysis...');

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 500,
      messages: [
        {
          role: 'user',
          content: `Sen tibbiy yordamchi AI san. 
Bolani rivojlanish hisobotini tahlil qilasiz. 
Faqat kuzatuv va tavsiyalar berasan. 
Hech qachon rasmiy tashxis qo'ymaysan.

${JSON.stringify(reportData, null, 2)}`,
        },
      ],
    });

    const response = message.content[0].type === 'text' ? message.content[0].text : null;
    return response;
  } catch (error) {
    console.error('Claude API error in analyzeReport:', error);
    return null;
  }
}

/**
 * Parent chatbot function
 * @returns Chatbot response or null on error
 */
export async function parentChatbot(
  question: string,
  childInfo: object
): Promise<string | null> {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.log('ANTHROPIC_API_KEY not configured');
    return null;
  }

  try {
    console.log('Calling Claude API for parent chatbot...');

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 300,
      system: `Sen NeuroCare tibbiy platformasining yordamchi chatbotisan. 
Ota-onalarga bolalarining rivojlanishi haqida maslahat berasan. 
Doim oxirida "Bu haqida doktoringiz bilan maslahatlashing" deb qo'sh. 
Javobni o'zbek tilida yoz.`,
      messages: [
        {
          role: 'user',
          content: question,
        },
      ],
    });

    const response = message.content[0].type === 'text' ? message.content[0].text : null;
    return response;
  } catch (error) {
    console.error('Claude API error in parentChatbot:', error);
    return null;
  }
}