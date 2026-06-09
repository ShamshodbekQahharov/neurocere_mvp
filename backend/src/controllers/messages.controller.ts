import { Request, Response } from 'express';
import { supabaseAdmin } from '../config/supabase';
import { User } from '../types';
import { getIO } from '../config/socket';

/**
 * GET /api/messages?child_id=:id
 */
export const getMessages = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const child_id = req.query.child_id as string;
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
    const user = (req as any).user as User;

    if (!child_id) {
      res.status(400).json({ success: false, error: 'child_id parametri kerak' });
      return;
    }

    // Access check
    let hasAccess = false;
    if (user.role === 'doctor') {
      const { data } = await supabaseAdmin
        .from('children').select('id')
        .eq('id', child_id).eq('doctor_id', user.id).eq('is_active', true).single();
      hasAccess = !!data;
    } else if (user.role === 'parent') {
      const { data: pr } = await supabaseAdmin
        .from('parents').select('child_id')
        .eq('user_id', user.id).eq('child_id', child_id).single();
      if (pr) {
        hasAccess = true;
      } else {
        const { data: cr } = await supabaseAdmin
          .from('children').select('id')
          .eq('id', child_id).eq('parent_user_id', user.id).single();
        hasAccess = !!cr;
      }
    }

    if (!hasAccess) {
      res.status(403).json({ success: false, error: "Ruxsat yo'q" });
      return;
    }

    // Fetch messages — no JOIN
    const { data: rawMessages, error } = await supabaseAdmin
      .from('messages')
      .select('*')
      .eq('child_id', child_id)
      .order('created_at', { ascending: true })
      .limit(limit);

    if (error) {
      console.error('getMessages DB error:', JSON.stringify(error));
      res.status(500).json({ success: false, error: error.message });
      return;
    }

    if (!rawMessages || rawMessages.length === 0) {
      res.json({ success: true, data: { messages: [], has_more: false } });
      return;
    }

    // Enrich with user info
    const userIds = [...new Set(
      rawMessages.flatMap((m: any) => [m.sender_id, m.receiver_id]).filter(Boolean)
    )];

    const { data: usersData } = await supabaseAdmin
      .from('users').select('id, full_name, role').in('id', userIds);

    const usersMap: Record<string, any> = {};
    (usersData || []).forEach((u: any) => { usersMap[u.id] = u; });

    const messages = rawMessages.map((m: any) => ({
      ...m,
      sender: usersMap[m.sender_id] || null,
      receiver: usersMap[m.receiver_id] || null,
    }));

    res.json({
      success: true,
      data: { messages, has_more: rawMessages.length >= limit },
    });
  } catch (error: any) {
    console.error('getMessages error:', error);
    res.status(500).json({ success: false, error: error.message || 'Xabarlarni olishda xatolik' });
  }
};

/**
 * POST /api/messages
 */
export const sendMessage = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { child_id, receiver_id, content } = req.body;
    const user = (req as any).user as User;

    if (!child_id || !receiver_id || !content?.trim()) {
      res.status(400).json({ success: false, error: 'child_id, receiver_id va content kerak' });
      return;
    }

    if (content.length > 2000) {
      res.status(400).json({ success: false, error: 'Xabar 2000 belgidan oshmasligi kerak' });
      return;
    }

    // Receiver mavjudligini tekshir
    const { data: receiver, error: receiverErr } = await supabaseAdmin
      .from('users').select('id, full_name, role').eq('id', receiver_id).single();

    if (receiverErr || !receiver) {
      res.status(404).json({ success: false, error: 'Qabul qiluvchi topilmadi' });
      return;
    }

    // Sender access check
    let userHasAccess = false;
    if (user.role === 'doctor') {
      const { data } = await supabaseAdmin
        .from('children').select('id')
        .eq('id', child_id).eq('doctor_id', user.id).eq('is_active', true).single();
      userHasAccess = !!data;
    } else if (user.role === 'parent') {
      const { data: pr } = await supabaseAdmin
        .from('parents').select('child_id')
        .eq('user_id', user.id).eq('child_id', child_id).single();
      if (pr) {
        userHasAccess = true;
      } else {
        const { data: cr } = await supabaseAdmin
          .from('children').select('id')
          .eq('id', child_id).eq('parent_user_id', user.id).single();
        userHasAccess = !!cr;
      }
    }

    if (!userHasAccess) {
      res.status(403).json({ success: false, error: "Ruxsat yo'q" });
      return;
    }

    // Receiver access check
    let receiverHasAccess = false;
    if (receiver.role === 'doctor') {
      const { data } = await supabaseAdmin
        .from('children').select('id')
        .eq('id', child_id).eq('doctor_id', receiver_id).single();
      receiverHasAccess = !!data;
    } else if (receiver.role === 'parent') {
      const { data: pr } = await supabaseAdmin
        .from('parents').select('child_id')
        .eq('user_id', receiver_id).eq('child_id', child_id).single();
      if (pr) {
        receiverHasAccess = true;
      } else {
        const { data: cr } = await supabaseAdmin
          .from('children').select('id')
          .eq('id', child_id).eq('parent_user_id', receiver_id).single();
        receiverHasAccess = !!cr;
      }
    }

    if (!receiverHasAccess) {
      res.status(403).json({ success: false, error: "Qabul qiluvchi bu bolaga ruxsat yo'q" });
      return;
    }

    // Insert message — no JOIN
    const { data: inserted, error: msgError } = await supabaseAdmin
      .from('messages')
      .insert({
        sender_id: user.id,
        receiver_id,
        child_id,
        content: content.trim(),
        is_read: false,
        is_active: true,
      })
      .select()
      .single();

    if (msgError) {
      console.error('Message insert error:', JSON.stringify(msgError));
      res.status(500).json({ success: false, error: msgError.message });
      return;
    }

    // Sender info
    const { data: sender } = await supabaseAdmin
      .from('users').select('id, full_name, role').eq('id', user.id).single();

    const fullMessage = { ...inserted, sender: sender || { id: user.id }, receiver };

    // Notification
    await supabaseAdmin.from('notifications').insert({
      user_id: receiver_id,
      title: 'Yangi xabar',
      body: `${sender?.full_name || user.full_name}: ${content.substring(0, 60)}`,
      type: 'message',
      is_read: false,
    });

    // Socket.IO
    try {
      const io = getIO();
      io.to(`child_${child_id}`).emit('new_message', fullMessage);
    } catch {
      console.warn('Socket.IO not available');
    }

    res.status(201).json({ success: true, message: 'Xabar yuborildi', data: { message: fullMessage } });
  } catch (error: any) {
    console.error('sendMessage error:', error);
    res.status(500).json({ success: false, error: error.message || 'Xabar yuborishda xatolik' });
  }
};

/**
 * PUT /api/messages/:id/read
 */
export const markAsRead = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const user = (req as any).user as User;

    const { data: msg, error: fetchErr } = await supabaseAdmin
      .from('messages').select('*').eq('id', id).single();

    if (fetchErr || !msg) {
      res.status(404).json({ success: false, error: 'Xabar topilmadi' });
      return;
    }

    if (msg.receiver_id !== user.id) {
      res.status(403).json({ success: false, error: "Ruxsat yo'q" });
      return;
    }

    if (msg.is_read) {
      res.status(200).json({ success: true, message: "Xabar allaqachon o'qilgan" });
      return;
    }

    const { error: updateErr } = await supabaseAdmin
      .from('messages').update({ is_read: true }).eq('id', id);

    if (updateErr) throw updateErr;

    try {
      const io = getIO();
      io.to(`child_${msg.child_id}`).emit('message_read', {
        messageId: id,
        readAt: new Date().toISOString(),
      });
    } catch {
      console.warn('Socket.IO not available');
    }

    res.status(200).json({ success: true, message: "Xabar o'qilgan deb belgilandi" });
  } catch (error: any) {
    console.error('markAsRead error:', error);
    res.status(500).json({ success: false, error: error.message || 'Xatolik yuz berdi' });
  }
};

/**
 * GET /api/messages/unread-count
 */
export const getUnreadCount = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const user = (req as any).user as User;

    // No JOIN — fetch plain messages
    const { data: messages, error } = await supabaseAdmin
      .from('messages')
      .select('id, child_id')
      .eq('receiver_id', user.id)
      .eq('is_read', false);

    if (error) throw error;

    // Get unique child IDs
    const childIds = [...new Set((messages || []).map((m: any) => m.child_id).filter(Boolean))];

    let childNames: Record<string, string> = {};
    if (childIds.length > 0) {
      const { data: children } = await supabaseAdmin
        .from('children').select('id, full_name').in('id', childIds);
      (children || []).forEach((c: any) => { childNames[c.id] = c.full_name; });
    }

    const countsByChild: Record<string, any> = {};
    (messages || []).forEach((m: any) => {
      if (!countsByChild[m.child_id]) {
        countsByChild[m.child_id] = {
          child_id: m.child_id,
          child_name: childNames[m.child_id] || 'Unknown',
          unread_count: 0,
        };
      }
      countsByChild[m.child_id].unread_count += 1;
    });

    res.status(200).json({
      success: true,
      data: {
        total_unread: (messages || []).length,
        by_child: Object.values(countsByChild),
      },
    });
  } catch (error: any) {
    console.error('getUnreadCount error:', error);
    res.status(500).json({ success: false, error: error.message || 'Unread count xatolik' });
  }
};
