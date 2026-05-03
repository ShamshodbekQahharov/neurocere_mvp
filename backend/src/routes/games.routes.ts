import { Router } from 'express'
import { authenticate } from '../middleware/auth.middleware'
import { supabaseAdmin } from '../config/supabase'

const router = Router()

// GET /api/games — o'yinlar katalogi
router.get('/', authenticate, async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('games')
      .select('*')
      .eq('is_active', true)

    if (error) {
      return res.status(500).json({
        success: false,
        error: error.message
      })
    }

    res.json({
      success: true,
      data: { games: data || [] }
    })
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: err.message
    })
  }
})

// POST /api/games/session — natija saqlash
router.post('/session', authenticate, async (req, res) => {
  try {
    const {
      child_id,
      game_id,
      score,
      correct_answers,
      total_questions,
      difficulty_level
    } = req.body

    if (!child_id) {
      return res.status(400).json({
        success: false,
        error: 'child_id majburiy'
      })
    }

    const { data, error } = await supabaseAdmin
      .from('game_sessions')
      .insert({
        child_id,
        game_id: game_id || null,
        score: score || 0,
        correct_answers: correct_answers || 0,
        total_questions: total_questions || 0,
        difficulty_level: difficulty_level || 1,
        started_at: new Date().toISOString(),
        ended_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      return res.status(500).json({
        success: false,
        error: error.message
      })
    }

    res.json({
      success: true,
      message: "Natija saqlandi",
      data: { session: data }
    })
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: err.message
    })
  }
})

// GET /api/games/sessions — bola sessiyalari
router.get('/sessions', authenticate, async (req, res) => {
  try {
    const child_id = req.query.child_id as string | undefined
    const user = (req as any).user

    let query = supabaseAdmin
      .from('game_sessions')
      .select('*')
      .order('started_at', { ascending: false })
      .limit(20)

    if (child_id) {
      query = query.eq('child_id', child_id)
    }

    const { data, error } = await query

    if (error) {
      return res.status(500).json({
        success: false,
        error: error.message
      })
    }

    res.json({
      success: true,
      data: {
        sessions: data || [],
        total: data?.length || 0
      }
    })
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: err.message
    })
  }
})

// GET /api/games/child/:childId — bola statistika
router.get('/child/:childId', authenticate, async (req, res) => {
  try {
    const { childId } = req.params

    const { data, error } = await supabaseAdmin
      .from('game_sessions')
      .select('*')
      .eq('child_id', childId)
      .order('started_at', { ascending: false })

    if (error) {
      return res.status(500).json({
        success: false,
        error: error.message
      })
    }

    const sessions = data || []
    const total = sessions.length
    const avgScore = total > 0
      ? Math.round(sessions.reduce((s, g) => s + (g.score || 0), 0) / total)
      : 0

    res.json({
      success: true,
      data: {
        sessions,
        stats: {
          total_games: total,
          avg_score: avgScore
        }
      }
    })
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: err.message
    })
  }
})

export default router