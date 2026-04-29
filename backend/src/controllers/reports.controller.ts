import { Request, Response } from 'express';
import { supabaseAdmin, supabaseClient } from '../config/supabase';
import { User } from '../types';
import { triggerAIAnalysis } from '../services/ai.service';

/**
 * @desc    Create a new report
 * @route   POST /api/reports
 * @access  Private (Parent only)
 */
export const createReport = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const {
      child_id,
      mood_score,
      speech_notes,
      behavior_notes,
      sleep_hours,
      appetite,
      tasks_completed,
      notes,
    } = req.body;

    const user = (req as any).user as User;

    // Validation: required fields
    if (!child_id) {
      res.status(400).json({
        success: false,
        error: 'child_id maydoni majburiy',
      });
      return;
    }

    if (mood_score === undefined || mood_score === null) {
      res.status(400).json({
        success: false,
        error: 'mood_score maydoni majburiy',
      });
      return;
    }

    // Validation: mood_score range 1-10
    if (mood_score < 1 || mood_score > 10) {
      res.status(400).json({
        success: false,
        error: 'mood_score 1 dan 10 gacha bo\'lishi shart',
      });
      return;
    }

    // Validation: child belongs to parent
    const { data: parentData, error: parentError } = await supabaseAdmin
      .from('parents')
      .select('id')
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

    // Validation: sleep_hours range 0-24
    if (sleep_hours !== undefined && (sleep_hours < 0 || sleep_hours > 24)) {
      res.status(400).json({
        success: false,
        error: 'sleep_hours 0 dan 24 gacha bo\'lishi shart',
      });
      return;
    }

    // Validation: tasks_completed range 0-100
    if (tasks_completed !== undefined && (tasks_completed < 0 || tasks_completed > 100)) {
      res.status(400).json({
        success: false,
        error: 'tasks_completed 0 dan 100 gacha bo\'lishi shart',
      });
      return;
    }

    // Validation: appetite value
    const validAppetites = ['poor', 'fair', 'good', 'excellent'];
    if (appetite && !validAppetites.includes(appetite)) {
      res.status(400).json({
        success: false,
        error: "appetite faqat 'poor', 'fair', 'good' yoki 'excellent' bo'lishi mumkin",
      });
      return;
    }

    // Validation: child exists
    const { data: childData, error: childError } = await supabaseAdmin
      .from('children')
      .select('full_name, diagnosis')
      .eq('id', child_id)
      .eq('is_active', true)
      .single();

    if (childError || !childData) {
      res.status(404).json({
        success: false,
        error: 'Bola topilmadi yoki aktiv emas',
      });
      return;
    }

    // 1. Create report
    const { data: reportData, error: reportError } = await supabaseAdmin
      .from('reports')
      .insert({
        child_id,
        parent_id: parentData.id,
        report_date: new Date().toISOString().split('T')[0],
        mood_score,
        speech_notes: speech_notes || null,
        behavior_notes: behavior_notes || null,
        sleep_hours: sleep_hours || null,
        appetite: appetite || null,
        tasks_completed: tasks_completed || 0,
        ai_summary: null,
        is_active: true,
      })
      .select()
      .single();

    if (reportError) {
      throw reportError;
    }

    // 2. Trigger AI analysis (async, don't wait)
    triggerAIAnalysis(reportData.id, child_id, {
      full_name: childData.full_name,
      diagnosis: childData.diagnosis,
      mood_score,
      speech_notes,
      behavior_notes,
      sleep_hours,
      appetite,
      tasks_completed,
      notes,
    }).catch((err) => {
      console.error('AI Analysis trigger failed:', err);
    });

    // 3. Send notification to doctor (async, don't wait)
    sendDoctorNotification(child_id, reportData.id).catch((err) => {
      console.error('Notification send failed:', err);
    });

    res.status(201).json({
      success: true,
      message: 'Hisobot muvaffaqiyatli yuborildi',
      data: {
        report: reportData,
      },
    });
  } catch (error) {
    console.error('Create report error:', error);
    res.status(500).json({
      success: false,
      error: 'Hisobot yuborishda xatolik yuz berdi',
    });
  }
};

/**
 * @desc    Get reports by child
 * @route   GET /api/reports/child/:childId
 * @access  Private (Doctor or Parent with access)
 */
export const getReportsByChild = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { childId } = req.params;
    const user = (req as any).user as User;

    // Parse query params
    const limit = Math.min(parseInt(req.query.limit as string) || 10, 100);
    const offset = parseInt(req.query.offset as string) || 0;
    const from = req.query.from as string;
    const to = req.query.to as string;

    // Check access
    let hasAccess = false;

    if (user.role === 'doctor') {
      const { data: childData } = await supabaseAdmin
        .from('children')
        .select('id')
        .eq('id', childId)
        .eq('doctor_id', user.id)
        .eq('is_active', true)
        .single();
      hasAccess = !!childData;
    } else if (user.role === 'parent') {
      const { data: parentData } = await supabaseAdmin
        .from('parents')
        .select('child_id')
        .eq('user_id', user.id)
        .eq('child_id', childId)
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

    // Build query
    let query = supabaseAdmin
      .from('reports')
      .select('*', { count: 'exact' })
      .eq('child_id', childId)
      .eq('is_active', true)
      .order('report_date', { ascending: false });

    if (from) {
      query = query.gte('report_date', from);
    }
    if (to) {
      query = query.lte('report_date', to);
    }

    const { data, error, count } = await query.range(offset, offset + limit - 1);

    if (error) {
      throw error;
    }

    res.status(200).json({
      success: true,
      data: {
        reports: data || [],
        total: count || 0,
        limit,
        offset,
      },
    });
  } catch (error) {
    console.error('Get reports by child error:', error);
    res.status(500).json({
      success: false,
      error: 'Hisobotlarni olishda xatolik yuz berdi',
    });
  }
};

/**
 * @desc    Get report by ID
 * @route   GET /api/reports/:id
 * @access  Private (Doctor or Parent with access)
 */
export const getReportById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const user = (req as any).user as User;

    // Get report
    const { data: report, error: reportError } = await supabaseAdmin
      .from('reports')
      .select('*')
      .eq('id', id)
      .eq('is_active', true)
      .single();

    if (reportError || !report) {
      res.status(404).json({
        success: false,
        error: 'Hisobot topilmadi',
      });
      return;
    }

    // Check access
    let hasAccess = false;

    if (user.role === 'doctor') {
      const { data: childData } = await supabaseAdmin
        .from('children')
        .select('doctor_id')
        .eq('id', report.child_id)
        .eq('is_active', true)
        .single();
      hasAccess = childData?.doctor_id === user.id;
    } else if (user.role === 'parent') {
      const { data: parentData } = await supabaseAdmin
        .from('parents')
        .select('child_id')
        .eq('user_id', user.id)
        .eq('child_id', report.child_id)
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

    // Get AI analysis
    const { data: aiAnalysis, error: aiError } = await supabaseAdmin
      .from('ai_analyses')
      .select('*')
      .eq('analysis_type', 'report')
      .order('created_at', { ascending: false })
      .limit(1);

    res.status(200).json({
      success: true,
      data: {
        report,
        ai_analysis: aiAnalysis?.[0] || null,
      },
    });
  } catch (error) {
    console.error('Get report by ID error:', error);
    res.status(500).json({
      success: false,
      error: 'Hisobotni olishda xatolik yuz berdi',
    });
  }
};

/**
 * @desc    Get report statistics for child
 * @route   GET /api/reports/child/:childId/stats
 * @access  Private (Doctor only)
 */
export const getReportStats = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { childId } = req.params;
    const user = (req as any).user as User;

    // Check if doctor owns this child
    const { data: childData, error: childError } = await supabaseAdmin
      .from('children')
      .select('id')
      .eq('id', childId)
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

    // Calculate 30 days ago
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const fromDate = thirtyDaysAgo.toISOString().split('T')[0];

    // Get all reports for this child in last 30 days
    const { data: reports, error: reportsError } = await supabaseAdmin
      .from('reports')
      .select('*')
      .eq('child_id', childId)
      .eq('is_active', true)
      .gte('report_date', fromDate)
      .order('report_date', { ascending: true });

    if (reportsError) {
      throw reportsError;
    }

    const reportList = reports || [];
    const totalReports = reportList.length;

    // Calculate statistics
    let avgMood = 0;
    let avgSleep = 0;
    const appetiteCounts: Record<string, number> = { poor: 0, fair: 0, good: 0, excellent: 0 };
    let prevTasksCompleted: number | null = null;
    let tasksTrend = 'stable';

    if (totalReports > 0) {
      const moodSum = reportList.reduce((sum, r) => sum + (r.mood_score || 0), 0);
      avgMood = Math.round((moodSum / totalReports) * 10) / 10;

      const sleepSum = reportList.reduce((sum, r) => sum + (r.sleep_hours || 0), 0);
      avgSleep = Math.round((sleepSum / totalReports) * 10) / 10;

      reportList.forEach((r) => {
        if (r.appetite) {
          appetiteCounts[r.appetite] = (appetiteCounts[r.appetite] || 0) + 1;
        }
      });

      // Determine tasks trend (compare first and last)
      if (reportList.length >= 2) {
        const first = reportList[0].tasks_completed || 0;
        const last = reportList[reportList.length - 1].tasks_completed || 0;
        if (last > first) {
          tasksTrend = 'up';
        } else if (last < first) {
          tasksTrend = 'down';
        }
      }
    }

    // Find most common appetite
    let mostCommonAppetite = 'N/A';
    let maxCount = 0;
    Object.entries(appetiteCounts).forEach(([key, count]) => {
      if (count > maxCount) {
        maxCount = count;
        mostCommonAppetite = key;
      }
    });

    res.status(200).json({
      success: true,
      data: {
        child_id: childId,
        period_days: 30,
        from_date: fromDate,
        to_date: new Date().toISOString().split('T')[0],
        stats: {
          reports_count: totalReports,
          avg_mood: avgMood,
          avg_sleep_hours: avgSleep,
          most_common_appetite: mostCommonAppetite,
          appetite_distribution: appetiteCounts,
          tasks_trend: tasksTrend,
        },
      },
    });
  } catch (error) {
    console.error('Get report stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Statistikani olishda xatolik yuz berdi',
    });
  }
};

/**
 * Send notification to doctor about new report (internal function)
 */
async function sendDoctorNotification(childId: string, reportId: string): Promise<void> {
  try {
    // Get child to find doctor
    const { data: childData } = await supabaseAdmin
      .from('children')
      .select('doctor_id, full_name')
      .eq('id', childId)
      .single();

    if (!childData?.doctor_id) return;

    // Create notification for doctor
    await supabaseAdmin.from('notifications').insert({
      user_id: childData.doctor_id,
      title: 'Yangi hisobot yuborildi',
      body: `${childData.full_name} uchun yangi kunlik hisobot jo'natildi`,
      type: 'report',
      is_read: false,
    });
  } catch (err) {
    console.error('Send notification error:', err);
  }
}
