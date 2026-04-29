import Anthropic from '@anthropic-ai/sdk';

// Singleton Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

// Interfaces
interface ChildInfo {
  full_name: string;
  birth_date: string;
  diagnosis: string;
}

interface ReportData {
  mood_score: number;
  speech_notes?: string | null;
  behavior_notes?: string | null;
  sleep_hours?: number | null;
  appetite?: 'poor' | 'fair' | 'good' | 'excellent' | null;
  tasks_completed?: number | null;
  notes?: string | null;
}

interface PreviousReport {
  report_date: string;
  mood_score: number;
  tasks_completed: number;
}

interface AnalyzeReportInput {
  child: ChildInfo;
  report: ReportData;
  previousReports?: PreviousReport[];
}

interface AnalyzeReportOutput {
  summary: string;
  timestamp: Date;
}

interface ChatbotInput {
  full_name: string;
  diagnosis: string;
  age: number;
}

interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatbotOutput {
  answer: string;
  timestamp: Date;
}

interface GameStats {
  child_id: string;
  game_id: string;
  current_level: number;
  recent_sessions: {
    score: number;
    correct_answers: number;
    total_questions: number;
    difficulty_level: number;
  }[];
}

interface GameAdjustmentOutput {
  new_level: number;
  reason: string;
  motivational_message: string;
  avg_score: number;
}

/**
 * 1) Analyze Report - AI bilan hisobotni tahlil qilish
 */
export async function analyzeReport(
  input: AnalyzeReportInput
): Promise<AnalyzeReportOutput | null> {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.log('ANTHROPIC_API_KEY not configured, skipping AI analysis');
    return null;
  }

  try {
    const { child, report, previousReports } = input;

    // Calculate age
    const birthDate = new Date(child.birth_date);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    // Build previous reports text
    let previousText = '';
    if (previousReports && previousReports.length > 0) {
      previousText = 'So\'nggi 3 kun dinamikasi:\n' +
        previousReports.map(r =>
          `${r.report_date} - Kayfiyat: ${r.mood_score}/10 - Vazifalar: ${r.tasks_completed}%`
        ).join('\n') + '\n\n';
    }

    // Build prompt
    const prompt = `Bola: ${child.full_name}, ${age} yoshli, tashxis: ${child.diagnosis}

Bugungi hisobot:
Kayfiyat: ${report.mood_score}/10
Uyqu: ${report.sleep_hours || 'kiritilmagan'} soat
Ishtaha: ${report.appetite || 'kiritilmagan'}
Nutq kuzatuvi: ${report.speech_notes || 'kiritilmagan'}
Xulq-atvor: ${report.behavior_notes || 'kiritilmagan'}
Vazifalar: ${report.tasks_completed || 0}% bajarildi
Qo'shimcha: ${report.notes || 'yo'q'}

${previousText}Iltimos, qisqacha tahlil va doktorga tavsiyalar ber.`;

    // Call Claude API
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 600,
      temperature: 0.3,
      system: `Sen NeuroCare tibbiy platformasining AI yordamchisisans. 
Sening vazifang: bolalar rivojlanish hisobotlarini tahlil qilish va 
doktorlarga qisqacha, amaliy xulosa berish.

QOIDALAR:
- Hech qachon rasmiy tashxis qo'ymay
- Faqat kuzatuv va tavsiyalar ber
- O'zbek tilida javob ber
- Qisqa va aniq bo'l (max 200 so'z)
- Har doim oxirida 2-3 ta amaliy tavsiya ber`,      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const response = message.content[0].type === 'text' ? message.content[0].text : '';

    return {
      summary: response,
      timestamp: new Date(),
    };
  } catch (error) {
    console.error('Claude API error in analyzeReport:', error);
    return null;
  }
}

/**
 * 2) Parent Chatbot - Ota-onalar uchun 24/7 yordamchi
 */
export async function parentChatbot(
  question: string,
  childInfo: ChatbotInput,
  conversationHistory?: ConversationMessage[]
): Promise<ChatbotOutput> {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.log('ANTHROPIC_API_KEY not configured');
    return {
      answer: 'Hozircha javob bera olmayapman. Doktoringiz bilan bog\'laning.',
      timestamp: new Date(),
    };
  }

  try {
    // Build system message
    const systemMessage = `Sen NeuroCare platformasining ota-onalar uchun 24/7 yordamchi chatbotisan.

VAZIFANG:
- Bolalar rivojlanishi haqida savollarga javob berish
- Uy mashqlari va metodikalar haqida maslahat
- Ota-onalarni emotsional qo'llab-quvvatlash
- O'zbek tilida samimiy va tushunarli gapirish

CHEGARALAR:
- Rasmiy tashxis qo'ymay
- Dori buyurmaydi
- Har doim oxirida doktor bilan maslahatlashishni eslat (1 jumlada)

Bola haqida: ${childInfo.full_name}, ${childInfo.age} yoshli, tashxis: ${childInfo.diagnosis}`;

    // Build messages
    const messages: Array<{ role: 'user' | 'assistant'; content: string }> = [];

    if (conversationHistory && conversationHistory.length > 0) {
      // Limit to last 5 messages
      const recentHistory = conversationHistory.slice(-5);
      messages.push(...recentHistory);
    }

    messages.push({ role: 'user', content: question });

    // Call Claude API
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 400,
      temperature: 0.7,
      system: systemMessage,
      messages: messages,
    });

    const response = message.content[0].type === 'text' ? message.content[0].text : '';

    return {
      answer: response || 'Xatolik yuz berdi. Iltimos, qaytadan urinib ko\'ring.',
      timestamp: new Date(),
    };
  } catch (error) {
    console.error('Claude API error in parentChatbot:', error);
    return {
      answer: 'Hozircha javob bera olmayapman. Doktoringiz bilan bog\'laning.',
      timestamp: new Date(),
    };
  }
}

/**
 * 3) Adapt Game Difficulty - O'yin darajasini moslashtirish
 */
export function adaptGameLevel(
  gameStats: GameStats
): GameAdjustmentOutput {
  const { current_level, recent_sessions } = gameStats;

  if (!recent_sessions || recent_sessions.length === 0) {
    return {
      new_level: current_level,
      reason: 'Yetarli ma\'lumot yo\'q. Shu darajada davom eting.',
      motivational_message: 'Davom et! Ko\'rib chiqaylik keyingi mashqlarda.',
      avg_score: 0,
    };
  }

  // Calculate average success rate
  const totalScore = recent_sessions.reduce((sum, session) => {
    const accuracy = session.total_questions > 0
      ? (session.correct_answers / session.total_questions) * 100
      : 0;
    return sum + accuracy;
  }, 0);

  const avgScore = Math.round(totalScore / recent_sessions.length);

  let newLevel: number;
  let reason: string;

  if (avgScore >= 80) {
    newLevel = Math.min(current_level + 1, 10);
    reason = 'Ajoyib natijalar! Qiyinroq darajaga o\'tish mumkin.';
  } else if (avgScore >= 50) {
    newLevel = current_level;
    reason = 'Yaxshi natija! Shu darajada davom eting.';
  } else {
    newLevel = Math.max(current_level - 1, 1);
    reason = 'Biroz qiyinroq ekan. Biroz osonroq mashq qiling.';
  }

  // Generate motivational message
  const motivationalMessages = [
    'Zo'r! Bundan keyingisi esa ancha qiziqarliroq!',
    'Davom et! Seni kuchliligini ko'rib turaman!',
    'Ajoyib! Shunchaki tushunmayotgan narsalarni endi o'zlashtirasan!',
    'Bunda davom et! Eng qiziqishi oxirida kutiladi!',
    'Tabriklaymiz! Har kuni rivojlanayapsan!',
  ];

  const motivational_message = motivationalMessages[Math.floor(Math.random() * motivationalMessages.length)];

  return {
    new_level: newLevel,
    reason,
    motivational_message,
    avg_score: avgScore,
  };
}

/**
 * Helper: Analyze report and save to database
 */
export async function analyzeAndSaveReport(
  reportId: string,
  childId: string,
  input: AnalyzeReportInput
): Promise<{ success: boolean; error?: string }> {
  try {
    const result = await analyzeReport(input);

    if (!result) {
      return { success: false, error: 'AI analysis failed' };
    }

    // Save AI analysis to database
    const { supabaseAdmin } = await import('../config/supabase');
    
    await supabaseAdmin.from('ai_analyses').insert({
      child_id: childId,
      analysis_type: 'report',
      input_data: input,
      result: result.summary,
      confidence: 0.85,
    });

    // Update report with AI summary
    await supabaseAdmin
      .from('reports')
      .update({ ai_summary: result.summary })
      .eq('id', reportId);

    return { success: true };
  } catch (error) {
    console.error('Error in analyzeAndSaveReport:', error);
    return { success: false, error: 'Analysis failed' };
  }
}
