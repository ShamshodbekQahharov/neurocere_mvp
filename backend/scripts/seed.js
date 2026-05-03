// Seed test data for NeuroCare MVP
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function seed() {
  console.log('🌱 Starting seed...');

  try {
    // 1. Ensure parent-child relationship exists
    let parentProfileId = null;

    // Get parent user
    const { data: parentUser, error: parentUserError } = await supabase
      .from('users')
      .select('id')
      .eq('email', 'parent@test.com')
      .single();

    if (parentUserError || !parentUser) {
      console.error('Parent user not found:', parentUserError?.message);
      console.log('Please ensure parent@test.com exists in Supabase auth users.');
      return;
    } else {
      console.log('✅ Found parent user:', parentUser.id);
    }

    // Get child (Shaxriyor)
    const { data: child, error: childError } = await supabase
      .from('children')
      .select('*')
      .eq('full_name', 'Shaxriyor')
      .single();

    if (childError || !child) {
      console.error('Child "Shaxriyor" not found:', childError?.message);
      return;
    } else {
      console.log('✅ Found child:', child.full_name, child.id);
    }

    // Check if parent profile exists
    let { data: parentProfile, error: profileError } = await supabase
      .from('parents')
      .select('*')
      .eq('user_id', parentUser.id)
      .single();

    if (parentProfile) {
      // Update to link to child if not already
      if (parentProfile.child_id !== child.id) {
        const { error: updateError } = await supabase
          .from('parents')
          .update({ child_id: child.id })
          .eq('id', parentProfile.id);
        if (updateError) {
          console.error('Failed to update parent profile:', updateError.message);
        } else {
          console.log('✅ Updated parent profile to link with child');
        }
      } else {
        console.log('✅ Parent already linked to child');
      }
      parentProfileId = parentProfile.id;
    } else {
      // Create parent profile
      const { data: newProfile, error: insertError } = await supabase
        .from('parents')
        .insert({
          user_id: parentUser.id,
          child_id: child.id,
          relation: 'mother',
        })
        .select('id')
        .single();
      if (insertError) {
        console.error('Failed to create parent profile:', insertError.message);
        return;
      }
      console.log('✅ Created parent profile linked to child');
      parentProfileId = newProfile.id;
    }

    // 2. Insert a sample report for the child (parent's view)
    if (child) {
      // Check if any report exists for this child
      const { count } = await supabase
        .from('reports')
        .select('*', { count: 'exact', head: true })
        .eq('child_id', child.id);

      if (count === 0 && parentProfileId) {
        const { error: reportError } = await supabase
          .from('reports')
          .insert({
            child_id: child.id,
            parent_id: parentProfileId,
            report_date: new Date().toISOString().split('T')[0],
            mood_score: 8,
            speech_notes: 'Bugun 3 ta yangi so\'z aytdi',
            behavior_notes: 'Xulq-atvor yaxshi',
            sleep_hours: 9.5,
            appetite: 'good',
            tasks_completed: 75,
            notes: 'Juda yaxshi kun bo\'ldi',
          });

        if (reportError) {
          console.error('Failed to insert report:', reportError.message);
        } else {
          console.log('✅ Inserted sample report for child');
        }
      } else {
        console.log('✅ Reports already exist or missing parent profile');
      }
    }

    // 3. Insert a sample game session for the child
    if (child) {
      const { count: sessCount } = await supabase
        .from('game_sessions')
        .select('*', { count: 'exact', head: true })
        .eq('child_id', child.id);

      if (sessCount === 0) {
        const { error: sessError } = await supabase
          .from('game_sessions')
          .insert({
            child_id: child.id,
            game_id: 'word-match',
            score: 80,
            correct_answers: 8,
            total_questions: 10,
            difficulty_level: 1,
            started_at: new Date().toISOString(),
            ended_at: new Date().toISOString(),
          });

        if (sessError) {
          console.error('Failed to insert game session:', sessError.message);
        } else {
          console.log('✅ Inserted sample game session');
        }
      } else {
        console.log('✅ Game sessions already exist');
      }
    }

    console.log('🎉 Seed completed!');
  } catch (err) {
    console.error('Seed error:', err);
  }
}

seed();
