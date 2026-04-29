import { Request, Response } from 'express';
import { supabaseAdmin } from '../config/supabase';
import { User } from '../types';
import { getIO } from '../config/socket';

/**
 * @desc    Create a therapy session
 * @route   POST /api/sessions
 * @access  Private (Doctor only)
 */
export const createSession = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const {
      child_id,
      scheduled_at,
      duration_minutes,
      session_type,
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

    if (!scheduled_at) {
      res.status(400).json({
        success: false,
        error: 'scheduled_at maydoni majburiy',
      });
      return;
    }

    if (!duration_minutes) {
      res.status(400).json({
        success: false,
        error: 'duration_minutes maydoni majburiy',
      });
      return;
    }

    // Validation: scheduled_at must be in the future
    const scheduledDate = new Date(scheduled_at);
    const now = new Date();
    if (scheduledDate <= now) {
      res.status(400).json({
        success: false,
        error: 'scheduled_at kelajakda bo\'lishi shart',
      });
      return;
    }

    // Validation: duration must be one of [30, 45, 60, 90]
    const validDurations = [30, 45, 60, 90];
    if (!validDurations.includes(duration_minutes)) {
      res.status(400).json({
        success: false,
        error: 'duration_minutes faqat 30, 45, 60 yoki 90 bo\'lishi mumkin',
      });
      return;
    }

    // Validation: child exists and belongs to doctor
    const { data: childData, error: childError } = await supabaseAdmin
      .from('children')
      .select('id, full_name')
      .eq('id', child_id)
      .eq('doctor_id', user.id)
      .eq('is_active', true)
      .single();

    if (childError || !childData) {
      res.status(404).json({
        success: false,
        error: 'Bola topilmadi yoki doktorga tegishli emas',
      });
      return;
    }

    // Get parent info for notification
    const { data: parentData, error: parentError } = await supabaseAdmin
      .from('parents')
      .select('user_id, users:user_id(full_name, email)')
      .eq('child_id', child_id)
      .single();

    // 1. Create session
    const { data: sessionData, error: sessionError } = await supabaseAdmin
      .from('sessions')
      .insert({
        child_id,
        doctor_id: user.id,
        scheduled_at: scheduledDate.toISOString(),
        duration_minutes,
        session_type: session_type || 'motor',
        notes: notes || null,
        status: 'scheduled',
        is_active: true,
      })
      .select(
        `
        *,
        child:children(
          id,
          full_name
        ),
        doctor:users!sessions_doctor_id_fkey(
          id,
          full_name
        )
      `
      )
      .single();

    if (sessionError) {
      throw sessionError;
    }

    // 2. Send notification to parent
    if (parentData?.user_id) {
      const sessionDate = scheduledDate.toLocaleDateString('uz-UZ');
      const sessionTime = scheduledDate.toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' });
      const sessionTypeLabel = session_type || 'motor';

      await supabaseAdmin.from('notifications').insert({
        user_id: parentData.user_id,
        title: 'Yangi sessiya belgilandi',
        body: `${sessionTypeLabel} — ${sessionDate} soat ${sessionTime}`,
        type: 'session',
        is_read: false,
      });
    }

    // 3. Emit via Socket.IO
    try {
      const io = getIO();
      const roomName = `child_${child_id}`;
      io.to(roomName).emit('session_scheduled', sessionData);
      console.log(`Socket.IO: Session scheduled emitted to room ${roomName}`);
    } catch (socketError) {
      console.warn('Socket.IO not available');
    }

    res.status(201).json({
      success: true,
      message: 'Sessiya muvaffaqiyatli belgilandi',
      data: {
        session: sessionData,
      },
    });
  } catch (error) {
    console.error('Create session error:', error);
    res.status(500).json({
      success: false,
      error: 'Sessiya belgilashda xatolik yuz berdi',
    });
  }
};

/**
 * @desc    Get sessions
 * @route   GET /api/sessions
 * @access  Private
 */
export const getSessions = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const user = (req as any).user as User;
    const {
      child_id,
      status,
      from,
      to,
      limit = 20,
    } = req.query;

    let query = supabaseAdmin
      .from('sessions')
      .select(
        `
        *,
        child:children(
          id,
          full_name
        ),
        doctor:users!sessions_doctor_id_fkey(
          id,
          full_name
        )
      `,
        { count: 'exact' }
      )
      .eq('is_active', true)
      .order('scheduled_at', { ascending: false });

    // Filter by child if provided
    if (child_id) {
      query = query.eq('child_id', child_id);
    }

    // Filter by status if provided
    if (status) {
      query = query.eq('status', status);
    }

    // Filter by date range if provided
    if (from) {
      query = query.gte('scheduled_at', from as string);
    }
    if (to) {
      query = query.lte('scheduled_at', to as string);
    }

    // Apply user-specific filters
    if (user.role === 'doctor') {
      query = query.eq('doctor_id', user.id);
    } else if (user.role === 'parent') {
      // Get children of this parent
      const { data: parentChildren, error: parentError } = await supabaseAdmin
        .from('parents')
        .select('child_id')
        .eq('user_id', user.id);

      if (parentError) {
        throw parentError;
      }

      const childIds = (parentChildren || []).map((pc) => pc.child_id);
      if (childIds.length === 0) {
        res.status(200).json({
          success: true,
          data: {
            sessions: [],
            total: 0,
          },
        });
        return;
      }

      query = query.in('child_id', childIds);
    }

    const { data: sessions, error, count } = await query.limit(Number(limit));

    if (error) {
      throw error;
    }

    res.status(200).json({
      success: true,
      data: {
        sessions: sessions || [],
        total: count || 0,
      },
    });
  } catch (error) {
    console.error('Get sessions error:', error);
    res.status(500).json({
      success: false,
      error: 'Sessiyalarni olishda xatolik yuz berdi',
    });
  }
};

/**
 * @desc    Get session by ID
 * @route   GET /api/sessions/:id
 * @access  Private
 */
export const getSessionById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const user = (req as any).user as User;

    // Get session
    const { data: session, error: sessionError } = await supabaseAdmin
      .from('sessions')
      .select(
        `
        *,
        child:children(
          id,
          full_name
        ),
        doctor:users!sessions_doctor_id_fkey(
          id,
          full_name
        )
      `
      )
      .eq('id', id)
      .eq('is_active', true)
      .single();

    if (sessionError || !session) {
      res.status(404).json({
        success: false,
        error: 'Sessiya topilmadi',
      });
      return;
    }

    // Check access
    let hasAccess = false;

    if (user.role === 'doctor') {
      hasAccess = session.doctor_id === user.id;
    } else if (user.role === 'parent') {
      const { data: parentData, error: parentError } = await supabaseAdmin
        .from('parents')
        .select('child_id')
        .eq('user_id', user.id)
        .eq('child_id', session.child_id)
        .single();

      if (!parentError && parentData) {
        hasAccess = true;
      }
    }

    if (!hasAccess) {
      res.status(403).json({
        success: false,
        error: 'Ruxsat yo\'q',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: {
        session,
      },
    });
  } catch (error) {
    console.error('Get session by ID error:', error);
    res.status(500).json({
      success: false,
      error: 'Sessiyani olishda xatolik yuz berdi',
    });
  }
};

/**
 * @desc    Update session
 * @route   PUT /api/sessions/:id
 * @access  Private (Doctor only)
 */
export const updateSession = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const {
      scheduled_at,
      duration_minutes,
      status,
      notes,
      session_notes,
    } = req.body;

    const user = (req as any).user as User;

    // Get existing session
    const { data: existingSession, error: checkError } = await supabaseAdmin
      .from('sessions')
      .select('*')
      .eq('id', id)
      .eq('is_active', true)
      .single();

    if (checkError || !existingSession) {
      res.status(404).json({
        success: false,
        error: 'Sessiya topilmadi',
      });
      return;
    }

    // Check if doctor owns this session
    if (existingSession.doctor_id !== user.id) {
      res.status(403).json({
        success: false,
        error: 'Ruxsat yo\'q',
      });
      return;
    }

    // Validate scheduled_at if provided
    if (scheduled_at) {
      const scheduledDate = new Date(scheduled_at);
      if (scheduledDate <= new Date()) {
        res.status(400).json({
          success: false,
          error: 'scheduled_at kelajakda bo\'lishi shart',
        });
        return;
      }
    }

    // Validate duration if provided
    if (duration_minutes) {
      const validDurations = [30, 45, 60, 90];
      if (!validDurations.includes(duration_minutes)) {
        res.status(400).json({
          success: false,
          error: 'duration_minutes faqat 30, 45, 60 yoki 90 bo\'lishi mumkin',
        });
        return;
      }
    }

    // Build update data
    const updateData: any = {};

    if (scheduled_at !== undefined) {
      updateData.scheduled_at = new Date(scheduled_at).toISOString();
    }
    if (duration_minutes !== undefined) {
      updateData.duration_minutes = duration_minutes;
    }
    if (status !== undefined) {
      updateData.status = status;
    }
    if (notes !== undefined) {
      updateData.notes = notes;
    }
    if (session_notes !== undefined) {
      updateData.session_notes = session_notes;
    }

    // Handle status changes
    if (status === 'completed') {
      updateData.completed_at = new Date().toISOString();

      // Send notification to parent
      const { data: parentData } = await supabaseAdmin
        .from('parents')
        .select('user_id')
        .eq('child_id', existingSession.child_id)
        .single();

      if (parentData?.user_id) {
        await supabaseAdmin.from('notifications').insert({
          user_id: parentData.user_id,
          title: 'Sessiya yakunlandi',
          body: 'Terapiya sessiyasi muvaffaqiyatli yakunlandi',
          type: 'session',
          is_read: false,
        });
      }

      // Emit via Socket.IO
      try {
        const io = getIO();
        const roomName = `child_${existingSession.child_id}`;
        io.to(roomName).emit('session_completed', {
          sessionId: id,
          completedAt: updateData.completed_at,
        });
      } catch (socketError) {
        console.warn('Socket.IO not available');
      }
    } else if (status === 'cancelled') {
      // Send notification to parent
      const { data: parentData } = await supabaseAdmin
        .from('parents')
        .select('user_id')
        .eq('child_id', existingSession.child_id)
        .single();

      if (parentData?.user_id) {
        await supabaseAdmin.from('notifications').insert({
          user_id: parentData.user_id,
          title: 'Sessiya bekor qilindi',
          body: 'Terapiya sessiyasi bekor qilindi',
          type: 'session',
          is_read: false,
        });
      }

      // Emit via Socket.IO
      try {
        const io = getIO();
        const roomName = `child_${existingSession.child_id}`;
        io.to(roomName).emit('session_cancelled', {
          sessionId: id,
        });
      } catch (socketError) {
        console.warn('Socket.IO not available');
      }
    }

    updateData.updated_at = new Date().toISOString();

    // Update session
    const { data: updatedSession, error: updateError } = await supabaseAdmin
      .from('sessions')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      throw updateError;
    }

    res.status(200).json({
      success: true,
      message: 'Sessiya muvaffaqiyatli yangilandi',
      data: {
        session: updatedSession,
      },
    });
  } catch (error) {
    console.error('Update session error:', error);
    res.status(500).json({
      success: false,
      error: 'Sessiyani yangilashda xatolik yuz berdi',
    });
  }
};

/**
 * @desc    Get upcoming sessions
 * @route   GET /api/sessions/upcoming
 * @access  Private
 */
export const getUpcomingSessions = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const user = (req as any).user as User;

    const now = new Date();
    const sevenDaysLater = new Date();
    sevenDaysLater.setDate(sevenDaysLater.getDate() + 7);

    let query = supabaseAdmin
      .from('sessions')
      .select(
        `
        *,
        child:children(
          id,
          full_name
        ),
        doctor:users!sessions_doctor_id_fkey(
          id,
          full_name
        )
      `
      )
      .eq('is_active', true)
      .eq('status', 'scheduled')
      .gte('scheduled_at', now.toISOString())
      .lte('scheduled_at', sevenDaysLater.toISOString())
      .order('scheduled_at', { ascending: true });

    // Apply user-specific filters
    if (user.role === 'doctor') {
      query = query.eq('doctor_id', user.id);
    } else if (user.role === 'parent') {
      const { data: parentChildren, error: parentError } = await supabaseAdmin
        .from('parents')
        .select('child_id')
        .eq('user_id', user.id);

      if (parentError) {
        throw parentError;
      }

      const childIds = (parentChildren || []).map((pc) => pc.child_id);
      if (childIds.length === 0) {
        res.status(200).json({
          success: true,
          data: {
            sessions: [],
            count: 0,
            next_session: null,
          },
        });
        return;
      }

      query = query.in('child_id', childIds);
    }

    const { data: sessions, error } = await query;

    if (error) {
      throw error;
    }

    const nextSession = (sessions && sessions.length > 0) ? sessions[0] : null;

    res.status(200).json({
      success: true,
      data: {
        sessions: sessions || [],
        count: sessions ? sessions.length : 0,
        next_session: nextSession,
      },
    });
  } catch (error) {
    console.error('Get upcoming sessions error:', error);
    res.status(500).json({
      success: false,
      error: 'Kelajakdagi sessiyalarni olishda xatolik yuz berdi',
    });
  }
};

/**
 * @desc    Get session statistics
 * @route   GET /api/sessions/stats/:childId
 * @access  Private (Doctor only)
 */
export const getSessionStats = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { childId } = req.params;
    const user = (req as any).user as User;

    // Check if doctor has access to this child
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

    // Get all sessions for this child
    const { data: sessions, error: sessionsError } = await supabaseAdmin
      .from('sessions')
      .select('*')
      .eq('child_id', childId);

    if (sessionsError) {
      throw sessionsError;
    }

    const sessionList = sessions || [];
    const totalSessions = sessionList.length;

    // Calculate statistics
    const completedSessions = sessionList.filter((s) => s.status === 'completed').length;
    const cancelledSessions = sessionList.filter((s) => s.status === 'cancelled').length;
    const completionRate = totalSessions > 0 ? Math.round((completedSessions / totalSessions) * 100) : 0;

    // Calculate average duration
    const totalDuration = sessionList.reduce((sum, s) => sum + (s.duration_minutes || 0), 0);
    const avgDuration = totalSessions > 0 ? Math.round(totalDuration / totalSessions) : 0;

    // This month sessions
    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const thisMonthSessions = sessionList.filter((s) => new Date(s.scheduled_at) >= thisMonthStart).length;

    // Last month sessions
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthSessions = sessionList.filter(
      (s) => new Date(s.scheduled_at) >= lastMonthStart && new Date(s.scheduled_at) < lastMonthEnd
    ).length;

    // Determine trend
    let trend: 'up' | 'down' | 'same' = 'same';
    if (thisMonthSessions > lastMonthSessions) {
      trend = 'up';
    } else if (thisMonthSessions < lastMonthSessions) {
      trend = 'down';
    }

    res.status(200).json({
      success: true,
      data: {
        total_sessions: totalSessions,
        completed_sessions: completedSessions,
        cancelled_sessions: cancelledSessions,
        completion_rate: completionRate,
        avg_duration: avgDuration,
        sessions_this_month: thisMonthSessions,
        sessions_last_month: lastMonthSessions,
        trend,
      },
    });
  } catch (error) {
    console.error('Get session stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Statistikani olishda xatolik yuz berdi',
    });
  }
};