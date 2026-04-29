import { Request, Response } from 'express';
import { supabaseAdmin } from '../config/supabase';
import { User } from '../types';

/**
 * @desc    Get notifications
 * @route   GET /api/notifications
 * @access  Private
 */
export const getNotifications = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const user = (req as any).user as User;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);

    // Get notifications
    const { data: notifications, error, count } = await supabaseAdmin
      .from('notifications')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      throw error;
    }

    // Get unread count
    const { count: unreadCount, error: countError } = await supabaseAdmin
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('is_read', false);

    if (countError) {
      throw countError;
    }

    res.status(200).json({
      success: true,
      data: {
        notifications: notifications || [],
        unread_count: unreadCount || 0,
        total_count: count || 0,
      },
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({
      success: false,
      error: 'Bildirishnomalarni olishda xatolik yuz berdi',
    });
  }
};

/**
 * @desc    Mark notification as read
 * @route   PUT /api/notifications/:id/read
 * @access  Private (only owner)
 */
export const markNotificationRead = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const user = (req as any).user as User;

    if (!id) {
      res.status(400).json({
        success: false,
        error: 'notification_id kiritilishi shart',
      });
      return;
    }

    // Get notification
    const { data: notification, error: notifError } = await supabaseAdmin
      .from('notifications')
      .select('*')
      .eq('id', id)
      .single();

    if (notifError || !notification) {
      res.status(404).json({
        success: false,
        error: 'Bildirishnoma topilmadi',
      });
      return;
    }

    // Check ownership
    if (notification.user_id !== user.id) {
      res.status(403).json({
        success: false,
        error: 'Ruxsat yo\'q',
      });
      return;
    }

    // Already read
    if (notification.is_read) {
      res.status(200).json({
        success: true,
        message: 'Bildirishnoma allaqachon o\'qilgan',
      });
      return;
    }

    // Mark as read
    const { data: updatedData, error: updateError } = await supabaseAdmin
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      throw updateError;
    }

    res.status(200).json({
      success: true,
      message: 'Bildirishnoma o\'qilgan deb belgilandi',
      data: {
        notification: updatedData,
      },
    });
  } catch (error) {
    console.error('Mark notification read error:', error);
    res.status(500).json({
      success: false,
      error: 'Bildirishnomani o\'qishda xatolik yuz berdi',
    });
  }
};