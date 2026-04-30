import { Request, Response } from 'express';
import { supabaseAdmin, supabaseClient } from '../config/supabase';
import { User } from '../types';

/**
 * @desc    Create a new child profile
 * @route   POST /api/children
 * @access  Private (Doctor only)
 */
export const createChild = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const {
      full_name,
      birth_date,
      diagnosis,
      icd_code,
      notes,
      parent_email,
    } = req.body;

    const doctorId = (req as any).user.id;

    // Validation: required fields
    if (!full_name || !birth_date) {
      res.status(400).json({
        success: false,
        error: 'full_name va birth_date maydonlari majburiy',
      });
      return;
    }

    // Validate birth_date format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(birth_date)) {
      res.status(400).json({
        success: false,
        error: 'birth_date formati YYYY-MM-DD bo\'lishi shart',
      });
      return;
    }

    // 1. Create child in children table
    const { data: childData, error: childError } = await supabaseAdmin
      .from('children')
      .insert({
        doctor_id: doctorId,
        full_name,
        birth_date,
        diagnosis: diagnosis || null,
        icd_code: icd_code || null,
        notes: notes || null,
        is_active: true,
      })
      .select()
      .single();

    if (childError) {
      console.error('Create child error:', childError);
      res.status(400).json({
        success: false,
        error: 'Bola profili yaratishda xatolik',
      });
      return;
    }

    // 2. Link parent if parent_email provided
    if (parent_email) {
      // Find parent user by email
      const { data: parentUserData, error: parentError } = await supabaseAdmin
        .from('users')
        .select('id, role')
        .eq('email', parent_email)
        .eq('role', 'parent')
        .single();

      if (parentUserData) {
        // Check if parent profile exists
        const { data: parentProfile, error: profileError } = await supabaseAdmin
          .from('parents')
          .select('id')
          .eq('user_id', parentUserData.id)
          .single();

        if (parentProfile) {
          // Link parent to child
          await supabaseAdmin.from('parents').update({
            child_id: childData.id,
          }).eq('id', parentProfile.id);
        }
      }
      // If parent not found, silently continue (not an error)
    }

    res.status(201).json({
      success: true,
      message: 'Bola profili yaratildi',
      data: {
        child: childData,
      },
    });
  } catch (error) {
    console.error('Create child controller error:', error);
    res.status(500).json({
      success: false,
      error: 'Bola profili yaratishda xatolik yuz berdi',
    });
  }
};

/**
 * @desc    Get all children
 * @route   GET /api/children
 * @access  Private
 */
export const getAllChildren = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const user = (req as any).user as User;
    let childrenData: any[] = [];

    if (user.role === 'doctor') {
      // Doctor sees only their children
      const { data, error, count } = await supabaseAdmin
        .from('children')
        .select('*', { count: 'exact' })
        .eq('doctor_id', user.id)
        .eq('is_active', true);

      if (error) throw error;
      childrenData = data || [];
    } else if (user.role === 'parent') {
      // Parent sees only their linked child
      const { data: parentData, error: parentError } = await supabaseAdmin
        .from('parents')
        .select('child_id')
        .eq('user_id', user.id)
        .single();

      if (parentError && parentError.code !== 'PGRST116') {
        throw parentError;
      }

      if (parentData?.child_id) {
        const { data: childData, error: childError } = await supabaseAdmin
          .from('children')
          .select('*')
          .eq('id', parentData.child_id)
          .eq('is_active', true)
          .single();

        if (childError && childError.code !== 'PGRST116') {
          throw childError;
        }

        if (childData) {
          childrenData = [childData];
        }
      }
    } else {
      // Other roles - no access
      res.status(403).json({
        success: false,
        error: 'Ruxsat yo\'q',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: {
        children: childrenData,
        total: childrenData.length,
      },
    });
  } catch (error) {
    console.error('Get all children error:', error);
    res.status(500).json({
      success: false,
      error: 'Bolalar ro\'yxatini olishda xatolik yuz berdi',
    });
  }
};

/**
 * @desc    Get child by ID
 * @route   GET /api/children/:id
 * @access  Private
 */
export const getChildById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const user = (req as any).user as User;

    // Get child
    const { data: child, error: childError } = await supabaseAdmin
      .from('children')
      .select('*')
      .eq('id', id)
      .eq('is_active', true)
      .single();

    if (childError || !child) {
      res.status(404).json({
        success: false,
        error: 'Bola topilmadi',
      });
      return;
    }

    // Check access
    let hasAccess = false;

    if (user.role === 'doctor') {
      hasAccess = child.doctor_id === user.id;
    } else if (user.role === 'parent') {
      const { data: parentData, error: parentError } = await supabaseAdmin
        .from('parents')
        .select('child_id')
        .eq('user_id', user.id)
        .eq('child_id', id)
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

    // Get linked parent info
    let parentInfo = null;
    const { data: parentData, error: parentError } = await supabaseAdmin
      .from('parents')
      .select(`
        user_id,
        relation,
        users:user_id (
          full_name,
          email
        )
      `)
      .eq('child_id', id)
      .single();

    if (!parentError && parentData && parentData.users) {
      const pData = parentData as any;
      parentInfo = {
        user_id: pData.user_id,
        relation: pData.relation,
        full_name: pData.users[0].full_name,
        email: pData.users[0].email,
      };
    }

    res.status(200).json({
      success: true,
      data: {
        child,
        parent: parentInfo,
      },
    });
  } catch (error) {
    console.error('Get child by ID error:', error);
    res.status(500).json({
      success: false,
      error: 'Bola ma\'lumotlarini olishda xatolik',
    });
  }
};

/**
 * @desc    Update child
 * @route   PUT /api/children/:id
 * @access  Private (Doctor only)
 */
export const updateChild = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const {
      full_name,
      birth_date,
      diagnosis,
      icd_code,
      notes,
    } = req.body;

    const user = (req as any).user as User;

    // Check if child exists and belongs to doctor
    const { data: existingChild, error: checkError } = await supabaseAdmin
      .from('children')
      .select('*')
      .eq('id', id)
      .eq('is_active', true)
      .single();

    if (checkError || !existingChild) {
      res.status(404).json({
        success: false,
        error: 'Bola topilmadi',
      });
      return;
    }

    if (existingChild.doctor_id !== user.id) {
      res.status(403).json({
        success: false,
        error: 'Ruxsat yo\'q',
      });
      return;
    }

    // Validate birth_date if provided
    if (birth_date) {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(birth_date)) {
        res.status(400).json({
          success: false,
          error: 'birth_date formati YYYY-MM-DD bo\'lishi shart',
        });
        return;
      }
    }

    // Update child
    const { data: updatedChild, error: updateError } = await supabaseAdmin
      .from('children')
      .update({
        full_name: full_name || existingChild.full_name,
        birth_date: birth_date || existingChild.birth_date,
        diagnosis: diagnosis ?? existingChild.diagnosis,
        icd_code: icd_code ?? existingChild.icd_code,
        notes: notes ?? existingChild.notes,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      throw updateError;
    }

    res.status(200).json({
      success: true,
      message: 'Bola ma\'lumotlari yangilandi',
      data: {
        child: updatedChild,
      },
    });
  } catch (error) {
    console.error('Update child error:', error);
    res.status(500).json({
      success: false,
      error: 'Bola ma\'lumotlarini yangilashda xatolik',
    });
  }
};

/**
 * @desc    Delete child (soft delete)
 * @route   DELETE /api/children/:id
 * @access  Private (Doctor only)
 */
export const deleteChild = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const user = (req as any).user as User;

    // Check if child exists and belongs to doctor
    const { data: existingChild, error: checkError } = await supabaseAdmin
      .from('children')
      .select('*')
      .eq('id', id)
      .eq('is_active', true)
      .single();

    if (checkError || !existingChild) {
      res.status(404).json({
        success: false,
        error: 'Bola topilmadi',
      });
      return;
    }

    if (existingChild.doctor_id !== user.id) {
      res.status(403).json({
        success: false,
        error: 'Ruxsat yo\'q',
      });
      return;
    }

    // Soft delete
    const { error: deleteError } = await supabaseAdmin
      .from('children')
      .update({
        is_active: false,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (deleteError) {
      throw deleteError;
    }

    res.status(200).json({
      success: true,
      message: 'Bola profili o\'chirildi',
    });
  } catch (error) {
    console.error('Delete child error:', error);
    res.status(500).json({
      success: false,
      error: 'Bola profilini o\'chirishda xatolik',
    });
  }
};

/**
 * @desc    Get child progress statistics
 * @route   GET /api/children/:id/progress
 * @access  Private
 */
export const getChildProgress = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const user = (req as any).user as User;

    // Check if child exists and user has access
    const { data: child, error: childError } = await supabaseAdmin
      .from('children')
      .select('*')
      .eq('id', id)
      .eq('is_active', true)
      .single();

    if (childError || !child) {
      res.status(404).json({
        success: false,
        error: 'Bola topilmadi',
      });
      return;
    }

    let hasAccess = false;
    if (user.role === 'doctor') {
      hasAccess = child.doctor_id === user.id;
    } else if (user.role === 'parent') {
      const { data: parentData } = await supabaseAdmin
        .from('parents')
        .select('child_id')
        .eq('user_id', user.id)
        .eq('child_id', id)
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

    // Calculate 30 days ago
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Get reports count and averages for last 30 days
    const { data: reportsData, error: reportsError } = await supabaseAdmin
      .from('reports')
      .select('*', { count: 'exact' })
      .eq('child_id', id)
      .gte('report_date', thirtyDaysAgo.toISOString().split('T')[0]);

    if (reportsError) {
      throw reportsError;
    }

    const reports = reportsData || [];
    const reportsCount = reports.length;

    // Calculate averages
    const avgMood = reports.length > 0
      ? Number((reports.reduce((sum, r) => sum + (r.mood_score || 0), 0) /
          reports.length).toFixed(1))
      : 0;

    const avgSleep = reports.length > 0
      ? Number((reports.reduce((sum, r) => sum + (r.sleep_hours || 0), 0) /
          reports.length).toFixed(1))
      : 0;

    // Get games sessions stats
    const { data: gamesData, error: gamesError } = await supabaseAdmin
      .from('game_sessions')
      .select('score')
      .eq('child_id', id);

    if (gamesError) {
      throw gamesError;
    }

    const games = gamesData || [];
    const gamesPlayed = games.length;

    const avgGameScore = games.length > 0
      ? Number((games.reduce((sum, g) => sum + (g.score || 0), 0) / games.length).toFixed(1))
      : 0;

    res.status(200).json({
      success: true,
      data: {
        child: {
          id: child.id,
          full_name: child.full_name,
        },
        stats: {
          reports_count: reportsCount,
          avg_mood: avgMood,
          avg_sleep: avgSleep,
          games_played: gamesPlayed,
          avg_game_score: avgGameScore,
        },
      },
    });
  } catch (error) {
    console.error('Get child progress error:', error);
    res.status(500).json({
      success: false,
      error: 'Progress ma\'lumotlarini olishda xatolik',
    });
  }
};