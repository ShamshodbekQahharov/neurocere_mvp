import { Request, Response } from 'express'
import { supabaseAdmin } from '../config/supabase'

const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

interface CreateChildBody {
  child_full_name: string
  birth_date: string
  diagnosis: string
  icd_code?: string
  notes?: string
  parent_full_name: string
  parent_email: string
  parent_phone?: string
  parent_password: string
  child_email: string
  child_password: string
  child_display_name: string
}

interface ResetPasswordBody {
  user_id: string
  new_password: string
}

interface AuthenticatedRequest extends Request {
  user: { id: string; role: string }
}

export const createChildWithAccounts = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  const createdUsers: string[] = []
  const body = req.body as CreateChildBody

  try {
    const {
      child_full_name,
      birth_date,
      diagnosis,
      icd_code,
      notes,
      parent_full_name,
      parent_email,
      parent_phone,
      parent_password,
      child_email,
      child_password,
      child_display_name
    } = body

    if (!child_full_name || !birth_date || !diagnosis ||
        !parent_full_name || !parent_email || !parent_password ||
        !child_email || !child_password || !child_display_name) {
      res.status(400).json({
        success: false,
        error: 'Barcha majburiy maydonlar to\'ldirilishi shart'
      })
      return
    }

    if (!isValidEmail(parent_email) || !isValidEmail(child_email)) {
      res.status(400).json({
        success: false,
        error: 'Email format noto\'g\'ri'
      })
      return
    }

    if (parent_password.length < 6 || child_password.length < 6) {
      res.status(400).json({
        success: false,
        error: 'Parol kamida 6 ta belgidan iborat bo\'lishi shart'
      })
      return
    }

    if (parent_email === child_email) {
      res.status(400).json({
        success: false,
        error: 'Parent email va child email bir xil bo\'lishi mumkin emas'
      })
      return
    }

    const { data: parentAuth, error: parentAuthErr } =
      await supabaseAdmin.auth.admin.createUser({
        email: parent_email,
        password: parent_password,
        email_confirm: true,
        user_metadata: {
          full_name: parent_full_name,
          role: 'parent'
        }
      })

    if (parentAuthErr) throw new Error('Ota-ona akkaunti: ' + parentAuthErr.message)
    createdUsers.push(parentAuth.user.id)

    const { error: parentUserErr } = await supabaseAdmin
      .from('users')
      .insert({
        id: parentAuth.user.id,
        email: parent_email,
        full_name: parent_full_name,
        role: 'parent',
        phone: parent_phone || null
      })

    if (parentUserErr) throw new Error('Parent user: ' + parentUserErr.message)

    const { data: childAuth, error: childAuthErr } =
      await supabaseAdmin.auth.admin.createUser({
        email: child_email,
        password: child_password,
        email_confirm: true,
        user_metadata: {
          full_name: child_display_name,
          role: 'child'
        }
      })

    if (childAuthErr) throw new Error('Bola akkaunti: ' + childAuthErr.message)
    createdUsers.push(childAuth.user.id)

    const { error: childUserErr } = await supabaseAdmin
      .from('users')
      .insert({
        id: childAuth.user.id,
        email: child_email,
        full_name: child_display_name,
        role: 'child'
      })

    if (childUserErr) throw new Error('Child user: ' + childUserErr.message)

    const { data: child, error: childErr } =
      await supabaseAdmin
        .from('children')
        .insert({
          doctor_id: req.user.id,
          child_user_id: childAuth.user.id,
          parent_user_id: parentAuth.user.id,
          full_name: child_full_name,
          birth_date: birth_date,
          diagnosis: diagnosis,
          icd_code: icd_code || null,
          notes: notes || null
        })
        .select()
        .single()

    if (childErr) throw new Error('Children profili: ' + childErr.message)

    await supabaseAdmin.from('parents').insert({
      user_id: parentAuth.user.id,
      child_id: child.id,
      phone: parent_phone || null,
      relation: 'parent'
    })

    await supabaseAdmin.from('invitations').insert([
      {
        doctor_id: req.user.id,
        child_id: child.id,
        type: 'parent',
        email: parent_email,
        temp_password: parent_password,
        status: 'accepted'
      },
      {
        doctor_id: req.user.id,
        child_id: child.id,
        type: 'child',
        email: child_email,
        temp_password: child_password,
        status: 'accepted'
      }
    ])

    await supabaseAdmin.from('notifications').insert({
      user_id: req.user.id,
      title: "Yangi bemor qo'shildi",
      body: `${child_full_name} profili yaratildi. ` +
            `Ota-ona: ${parent_email}`,
      type: 'success'
    })

    res.status(201).json({
      success: true,
      message: 'Bemor va akkauntlar yaratildi',
      data: {
        child: {
          id: child.id,
          full_name: child_full_name,
          diagnosis: diagnosis
        },
        parent_credentials: {
          email: parent_email,
          password: parent_password
        },
        child_credentials: {
          email: child_email,
          password: child_password
        },
        login_url: process.env.FRONTEND_URL + '/login'
      }
    })

  } catch (error: any) {
    for (const userId of createdUsers) {
      try {
        await supabaseAdmin.auth.admin.deleteUser(userId)
        await supabaseAdmin
          .from('users')
          .delete()
          .eq('id', userId)
      } catch {
        // Rollback failed silently
      }
    }

    res.status(500).json({
      success: false,
      error: error.message || 'Akkaunt yaratishda xatolik'
    })
  }
}

export const getInvitations = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { data, error } = await supabaseAdmin
      .from('invitations')
      .select(`
        *,
        child:children(id, full_name, diagnosis)
      `)
      .eq('doctor_id', req.user.id)
      .order('created_at', { ascending: false })

    if (error) {
      res.status(500).json({
        success: false,
        error: error.message
      })
      return
    }

    res.json({
      success: true,
      data: { invitations: data || [] }
    })
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
}

export const resetPassword = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const body = req.body as ResetPasswordBody
    const { user_id, new_password } = body

    if (!user_id) {
      res.status(400).json({
        success: false,
        error: 'user_id majburiy'
      })
      return
    }

    if (!new_password || new_password.length < 6) {
      res.status(400).json({
        success: false,
        error: 'Parol kamida 6 ta belgidan iborat bo\'lishi shart'
      })
      return
    }

    const { error } = await supabaseAdmin
      .auth.admin.updateUserById(
        user_id,
        { password: new_password }
      )

    if (error) {
      res.status(500).json({
        success: false,
        error: error.message
      })
      return
    }

    await supabaseAdmin
      .from('invitations')
      .update({ temp_password: new_password })
      .eq('doctor_id', req.user.id)
      .eq('email', (
        await supabaseAdmin
          .from('users')
          .select('email')
          .eq('id', user_id)
          .single()
      ).data?.email || '')

    res.json({
      success: true,
      message: 'Parol muvaffaqiyatli yangilandi'
    })
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
}