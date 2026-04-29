import { supabaseAdmin } from './supabase';
import { getIO } from './socket';

/**
 * Check upcoming sessions and send reminders to parents
 * Runs every 6 hours via setInterval
 */
export async function checkUpcomingSessions(): Promise<void> {
  try {
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    // Find sessions in the next 24 hours that are scheduled
    const { data: sessions, error } = await supabaseAdmin
      .from('sessions')
      .select(
        `
        *,
        child:children(
          id,
          full_name
        ),
        parents:child_id(
          parents:user_id(
            id,
            full_name
          )
        )
      `
      )
      .eq('status', 'scheduled')
      .gte('scheduled_at', now.toISOString())
      .lt('scheduled_at', tomorrow.toISOString())
      .order('scheduled_at', { ascending: true });

    if (error) {
      throw error;
    }

    if (!sessions || sessions.length === 0) {
      console.log('No upcoming sessions found for reminders');
      return;
    }

    console.log(`Found ${sessions.length} upcoming session(s) for reminders`);

    for (const session of sessions) {
      // Get parents of the child
      const { data: parentLinks, error: parentLinkError } = await supabaseAdmin
        .from('parents')
        .select('user_id')
        .eq('child_id', session.child_id);

      if (parentLinkError || !parentLinks || parentLinks.length === 0) {
        console.log(`No parents found for child ${session.child_id}`);
        continue;
      }

      const sessionDate = new Date(session.scheduled_at);
      const formattedDate = sessionDate.toLocaleDateString('uz-UZ', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
      const formattedTime = sessionDate.toLocaleTimeString('uz-UZ', {
        hour: '2-digit',
        minute: '2-digit',
      });
      const sessionTypeLabel = session.session_type || 'terapiya';

      for (const link of parentLinks) {
        // Check if reminder already sent (avoid duplicates within 24 hours)
        const { data: existingReminder, error: reminderError } = await supabaseAdmin
          .from('notifications')
          .select('*')
          .eq('user_id', link.user_id)
          .eq('type', 'session_reminder')
          .gte('created_at', now.toISOString().split('T')[0])
          .like('title', 'Ertaga sessiya%')
          .limit(1)
          .maybeSingle();

        if (reminderError) {
          console.error('Error checking existing reminder:', reminderError);
          continue;
        }

        // Skip if reminder was already sent today for this session
        if (existingReminder) {
          console.log(`Reminder already sent to parent ${link.user_id} for this session`);
          continue;
        }

        // Send reminder notification
        await supabaseAdmin.from('notifications').insert({
          user_id: link.user_id,
          title: `Ertaga sessiya bor!`,
          body: `${sessionTypeLabel} — ${formattedDate} soat ${formattedTime}`, // "Tomorrow at 10:00"
          type: 'session_reminder',
          is_read: false,
        });

        console.log(`Reminder sent to parent ${link.user_id} for session ${session.id}`);

        // Emit real-time notification via Socket.IO
        try {
          const io = getIO();
          const parentSockets = await io.in(`user_${link.user_id}`).fetchSockets();
          
          if (parentSockets.length > 0) {
            io.to(`user_${link.user_id}`).emit('notification', {
              title: `Ertaga sessiya bor!`,
              body: `${sessionTypeLabel} — ${formattedTime}`,
              type: 'session_reminder',
            });
          }
        } catch (socketError) {
          console.warn('Socket.IO not available for real-time notification');
        }
      }
    }
  } catch (error) {
    console.error('Error in checkUpcomingSessions:', error);
  }
}

/**
 * Start session reminder scheduler
 * Runs every 6 hours
 */
export function startSessionReminderScheduler(): void {
  // Run immediately on startup
  checkUpcomingSessions().catch((err) => {
    console.error('Error running initial session reminder check:', err);
  });

  // Schedule to run every 6 hours (6 * 60 * 60 * 1000 = 21600000 ms)
  const intervalMs = 6 * 60 * 60 * 1000;
  
  setInterval(() => {
    console.log('Running scheduled session reminder check...');
    checkUpcomingSessions().catch((err) => {
      console.error('Error in scheduled session reminder check:', err);
    });
  }, intervalMs);

  console.log(`Session reminder scheduler started (every 6 hours)`);
}