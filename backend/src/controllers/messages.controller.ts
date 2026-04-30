import { Request, Response } from 'express';
import { supabaseAdmin } from '../config/supabase';
import { User } from '../types';
import { getIO } from '../config/socket';

/**
 * @desc    Get messages by child
 * @route   GET /api/messages?child_id=:childId
 * @access  Private (Doctor or Parent with access)
 */
export const getMessages = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { child_id } = req.query;
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
    const before = req.query.before as string;

    const user = (req as any).user as User;

    if (!child_id) {
      res.status(400).json({
        success: false,
        error: 'child_id kiritilishi shart',
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

    // Build query
    let query = supabaseAdmin
      .from('messages')
      .select(
        `
        id,
        sender_id,
        receiver_id,
        child_id,
        content,
        is_read,
        created_at,
        sender:users!messages_sender_id_fkey (
          id,
          full_name,
          role
        ),
        receiver:users!messages_receiver_id_fkey (
          id,
          full_name,
          role
        )
      `
      )
      .eq('child_id', child_id)
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (before) {
      query = query.lt('id', before);
    }

    const { data: messages, error, count } = await query;

    if (error) {
      throw error;
    }

    const hasMore = !before && count && count > limit;

    res.status(200).json({
      success: true,
      data: {
        messages: messages?.reverse() || [],
        has_more: hasMore,
      },
    });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({
      success: false,
      error: 'Xabarlarni olishda xatolik yuz berdi',
    });
  }
};

/**
 * @desc    Send message
 * @route   POST /api/messages
 * @access  Private (Doctor or Parent with access)
 */
export const sendMessage = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { child_id, receiver_id, content } = req.body;
    const user = (req as any).user as User;

    // Validation
    if (!child_id || !receiver_id || !content) {
      res.status(400).json({
        success: false,
        error: 'Barcha maydonlar to\'ldirilishi shart',
      });
      return;
    }

    if (content.trim().length === 0) {
      res.status(400).json({
        success: false,
        error: 'Xabar matni bo\'sh bo\'lmasligi kerak',
      });
      return;
    }

    if (content.length > 2000) {
      res.status(400).json({
        success: false,
        error: 'Xabar 2000 belgidan oshmasligi kerak',
      });
      return;
    }

    // Get receiver info for response
    const { data: receiverData, error: receiverError } = await supabaseAdmin
      .from('users')
      .select('id, full_name, role')
      .eq('id', receiver_id)
      .single();

    if (receiverError || !receiverData) {
      res.status(400).json({
        success: false,
        error: 'Qabul qiluvchi topilmadi',
      });
      return;
    }

    // Check if both users have access to this child
    let userHasAccess = false;
    let receiverHasAccess = false;

    if (user.role === 'doctor') {
      const { data: childData } = await supabaseAdmin
        .from('children')
        .select('id')
        .eq('id', child_id)
        .eq('doctor_id', user.id)
        .eq('is_active', true)
        .single();
      userHasAccess = !!childData;
    } else if (user.role === 'parent') {
      const { data: parentData } = await supabaseAdmin
        .from('parents')
        .select('child_id')
        .eq('user_id', user.id)
        .eq('child_id', child_id)
        .single();
      userHasAccess = !!parentData;
    }

    if (!userHasAccess) {
      res.status(403).json({
        success: false,
        error: 'Ruxsat yo\'q',
      });
      return;
    }

    // Check if receiver has access to this child
    if (receiverData.role === 'doctor') {
      const { data: childData } = await supabaseAdmin
        .from('children')
        .select('id')
        .eq('id', child_id)
        .eq('doctor_id', receiver_id)
        .single();
      receiverHasAccess = !!childData;
    } else if (receiverData.role === 'parent') {
      const { data: parentData } = await supabaseAdmin
        .from('parents')
        .select('child_id')
        .eq('user_id', receiver_id)
        .eq('child_id', child_id)
        .single();
      receiverHasAccess = !!parentData;
    }

    if (!receiverHasAccess) {
      res.status(403).json({
        success: false,
        error: 'Qabul qiluvchi bu bolaga ruxsat yo\'q',
      });
      return;
    }

    // Save message to database
    const { data: messageData, error: messageError } = await supabaseAdmin
      .from('messages')
      .insert({
        sender_id: user.id,
        receiver_id: receiver_id,
        child_id: child_id,
        content: content.trim(),
        is_read: false,
        is_active: true,
      })
      .select(
        `
        *,
        sender:sender_id (
          id,
          full_name,
          role
        ),
        receiver:receiver_id (
          id,
          full_name,
          role
        )
      `
      )
      .single();

    if (messageError) {
      throw messageError;
    }

    // Create notification for receiver
    await supabaseAdmin.from('notifications').insert({
      user_id: receiver_id,
      title: 'Yangi xabar',
      body: `${user.full_name} dan yangi xabar`,
      type: 'message',
      is_read: false,
    });

    // Emit via Socket.IO
    try {
      const io = getIO();
      const roomName = `child_${child_id}`;
      io.to(roomName).emit('new_message', messageData);
      console.log(`Socket.IO: Message emitted to room ${roomName}`);
    } catch (socketError) {
      console.warn('Socket.IO not available, message sent via API only');
    }

    res.status(201).json({
      success: true,
      message: 'Xabar yuborildi',
      data: {
        message: messageData,
      },
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({
      success: false,
      error: 'Xabar yuborishda xatolik yuz berdi',
    });
  }
};

/**
 * @desc    Mark message as read
 * @route   PUT /api/messages/:id/read
 * @access  Private (Only receiver)
 */
export const markAsRead = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const user = (req as any).user as User;

    if (!id) {
      res.status(400).json({
        success: false,
        error: 'message_id kiritilishi shart',
      });
      return;
    }

    // Get message
    const { data: messageData, error: messageError } = await supabaseAdmin
      .from('messages')
      .select('*')
      .eq('id', id)
      .single();

    if (messageError || !messageData) {
      res.status(404).json({
        success: false,
        error: 'Xabar topilmadi',
      });
      return;
    }

    // Check if user is the receiver
    if (messageData.receiver_id !== user.id) {
      res.status(403).json({
        success: false,
        error: 'Ruxsat yo\'q',
      });
      return;
    }

    // Already read
    if (messageData.is_read) {
      res.status(200).json({
        success: true,
        message: 'Xabar allaqachon o\'qilgan',
      });
      return;
    }

    // Mark as read
    const { data: updatedData, error: updateError } = await supabaseAdmin
      .from('messages')
      .update({ is_read: true })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      throw updateError;
    }

    // Emit to sender via Socket.IO
    try {
      const io = getIO();
      const roomName = `child_${messageData.child_id}`;
      io.to(roomName).emit('message_read', {
        messageId: id,
        readAt: new Date().toISOString(),
      });
      console.log(`Socket.IO: Marked message ${id} as read`);
    } catch (socketError) {
      console.warn('Socket.IO not available');
    }

    res.status(200).json({
      success: true,
      message: 'Xabar o\'qilgan deb belgilandi',
    });
  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({
      success: false,
      error: 'Xatolik yuz berdi',
    });
  }
};

/**
 * @desc    Get unread message count
 * @route   GET /api/messages/unread-count
 * @access  Private
 */
export const getUnreadCount = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const user = (req as any).user as User;

    // Get all unread messages for this user, grouped by child
    const { data: messages, error } = await supabaseAdmin
      .from('messages')
      .select(
        `
        id,
        child_id,
        child:child_id (
          id,
          full_name
        )
      `
      )
      .eq('receiver_id', user.id)
      .eq('is_read', false);

    if (error) {
      throw error;
    }

    const unreadByChild = messages?.reduce((acc: any, msg) => {
      const key = msg.child_id;
      if (!acc[key]) {
        acc[key] = {
          child_id: key,
          child_name: (msg.child as any)?.full_name || 'Unknown',
          unread_count: 0,
        };
      }
      acc[key].unread_count += 1;
      return acc;
    }, {});

    const byChild = Object.values(unreadByChild || {});
    const totalUnread = (messages || []).length;

    res.status(200).json({
      success: true,
      data: {
        total_unread: totalUnread,
        by_child: byChild,
      },
    });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({
      success: false,
      error: 'Unread countni olishda xatolik yuz berdi',
    });
  }
};