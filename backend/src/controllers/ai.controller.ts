import { Request, Response } from 'express';
import { supabaseAdmin } from '../config/supabase';
import { User } from '../types';
import {
  parentChatbot,
  adaptGameLevel,
  analyzeAndSaveReport,
  type ChatbotInput,
  type GameStats,
} from './../services/ai.service';

/**
 * @desc    Chatbot message handler
 * @route   POST /api/ai/chatbot
 * @access  Private (Parent only)
 */
export const chatbotMessage = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { question, child_id, history } = req.body;
    const user = (req as any).user as User;

    // Validation: question is required
    if (!question || typeof question !== 'string') {
      res.status(400).json({
        success: false,
        error: 'Savol matni kiritilishi shart (max 500 belgi)',
      });
      return;
    }

    if (question.length > 500) {
      res.status(400).json({
        success: false,
        error: 'Savol 500 belgidan uzun bo\'lmasligi kerak',
      });
      return;
    }

    // Validate history if provided
    if (history && !Array.isArray(history)) {
      res.status(400).json({
        success: false,
        error: 'History xato formatda',
      });
      return;
    }

    let childInfo: ChatbotInput | null = null;

    // If child_id is provided, fetch child info
    if (child_id) {
      // Check if parent has access to this child
      const { data: parentData, error: parentError } = await supabaseAdmin
        .from('parents')
        .select('child_id')
        .eq('user_id', user.id)
        .eq('child_id', child_id)
        .single();

      if (parentError || !parentData) {
        res.status(403).json({
          success: false,
          error: 'Bu bolaga ruxsat yo\'q',
        });
        return;
      }

      // Get child details
      const { data: childData, error: childError } = await supabaseAdmin
        .from('children')
        .select('full_name, diagnosis, birth_date')
        .eq('id', child_id)
        .single();

      if (childError || !childData) {
        res.status(404).json({
          success: false,
          error: 'Bola topilmadi',
        });
        return;
      }

      // Calculate age
      const birthDate = new Date(childData.birth_date);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }

      childInfo = {
        full_name: childData.full_name,
        diagnosis: childData.diagnosis,
        age: age,
      };
    }

    // Call parentChatbot service
    const result = await parentChatbot(
      question,
      childInfo || {
        full_name: 'Bolangiz',
        diagnosis: 'Tashklangan',
        age: 3,
      },
      history
    );

    // Save chatbot interaction to ai_analyses (async, don't wait)
    if (child_id) {
      analyzeAndSaveReport('chatbot-000', child_id, {
        child: {
          full_name: childInfo?.full_name || 'Bolangiz',
          birth_date: '',
          diagnosis: childInfo?.diagnosis || '',
        },
        report: {
          mood_score: 5,
          speech_notes: '',
          behavior_notes: '',
          sleep_hours: 0,
          appetite: null,
          tasks_completed: 0,
          notes: question,
        },
      }).catch((err) => {
        console.error('Failed to save chatbot interaction:', err);
      });
    }

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Chatbot message error:', error);
    res.status(500).json({
      success: false,
      error: 'Chatbot xatosi yuz berdi',
    });
  }
};

/**
 * @desc    Get AI analyses by child
 * @route   GET /api/ai/analyses
 * @access  Private (Doctor only)
 */
export const getAnalyses = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { child_id, analysis_type } = req.query;
    const user = (req as any).user as User;

    if (!child_id) {
      res.status(400).json({
        success: false,
        error: 'child_id kiritilishi shart',
      });
      return;
    }

    // Check if doctor has access to this child
    const { data: childData, error: childError } = await supabaseAdmin
      .from('children')
      .select('id')
      .eq('id', child_id as string)
      .eq('doctor_id', user.id)
      .eq('is_active', true)
      .single();

    if (childError || !childData) {
      res.status(403).json({
        success: false,
        error: 'Ruxsat yo\'q',
      });
      return;
    }

    // Build query
    let query = supabaseAdmin
      .from('ai_analyses')
      .select('*', { count: 'exact' })
      .eq('child_id', child_id)
      .order('created_at', { ascending: false });

    if (analysis_type) {
      query = query.eq('analysis_type', analysis_type as string);
    }

    const { data: analyses, error, count } = await query;

    if (error) {
      throw error;
    }

    res.status(200).json({
      success: true,
      data: {
        analyses: analyses || [],
        total: count || 0,
      },
    });
  } catch (error) {
    console.error('Get analyses error:', error);
    res.status(500).json({
      success: false,
      error: 'Analizlarni olishda xatolik yuz berdi',
    });
  }
};

/**
 * @desc    Get recent game sessions and adjust difficulty
 * @route   POST /api/ai/game-adjust
 * @access  Private (Doctor or Parent with access)
 */
export const adjustGameLevel = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { child_id, game_id, current_level } = req.body;
    const user = (req as any).user as User;

    // Validation
    if (!child_id || !game_id || current_level === undefined) {
      res.status(400).json({
        success: false,
        error: 'child_id, game_id va current_level majburiy',
      });
      return;
    }

    if (current_level < 1 || current_level > 10) {
      res.status(400).json({
        success: false,
        error: 'current_level 1 dan 10 gacha bo\'lishi shart',
      });
      return;
    }

    // Check access
    let hasAccess = false;

    if (user.role === 'doctor') {
      const { data: childData } = await supabaseAdmin
        .from('children')
        .select('id')
        .eq('id', child_id)
        .eq('doctor_id', user.id)
        .eq('is_active', true)
        .single();
      hasAccess = !!childData;
    } else if (user.role === 'parent') {
      const { data: parentData } = await supabaseAdmin
        .from('parents')
        .select('child_id')
        .eq('user_id', user.id)
        .eq('child_id', child_id)
        .single();
      hasAccess = !!parentData;
    }

    if (!hasAccess) {
      res.status(403).json({
        success: false,
        error: 'Ruxsat yo\'q',
      });
      return;
    }

    // Get recent game sessions (last 5)
    const { data: sessions, error: sessionsError } = await supabaseAdmin
      .from('game_sessions')
      .select('*')
      .eq('child_id', child_id)
      .eq('game_id', game_id)
      .order('created_at', { ascending: false })
      .limit(5);

    if (sessionsError) {
      throw sessionsError;
    }

    // Prepare game stats
    const gameStats: GameStats = {
      child_id,
      game_id,
      current_level,
      recent_sessions: (sessions || []).map((s) => ({
        score: s.score,
        correct_answers: s.correct_answers,
        total_questions: Math.max(s.correct_answers, 1), // Avoid division by zero
        difficulty_level: s.difficulty_level,
      })),
    };

    // Adjust difficulty using AI service
    const adjustment = adaptGameLevel(gameStats);

    res.status(200).json({
      success: true,
      data: adjustment,
    });
  } catch (error) {
    console.error('Adjust game level error:', error);
    res.status(500).json({
      success: false,
      error: 'O\'yin darajasini moslashda xatolik yuz berdi',
    });
  }
};