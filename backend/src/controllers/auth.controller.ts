import { Request, Response } from 'express';
import { AuthRequest } from '../types';
import { supabaseClient, supabaseAdmin } from '../config/supabase';
import jwt from 'jsonwebtoken';
import { User } from '../types';

// JWT Secret and Expiry
const JWT_SECRET = process.env.JWT_SECRET!;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

// Helper: Generate JWT Token
const generateToken = (user: {
  id: string;
  email: string;
  role: string;
}): string => {
  return jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
      },
      JWT_SECRET as any,
      {
        expiresIn: JWT_EXPIRES_IN as any,
      }
    );
};

// Helper: Validate Email
const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * @desc    Register a new user (doctor or parent)
 * @route   POST /api/auth/register
 */
export const register = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { email, password, full_name, role } = req.body;

    // Validation: All fields required
    if (!email || !password || !full_name || !role) {
      res.status(400).json({
        success: false,
        error: 'Barcha maydonlar to\'ldirilishi shart',
      });
      return;
    }

    // Validation: Email format
    if (!isValidEmail(email)) {
      res.status(400).json({
        success: false,
        error: 'Email format noto\'g\'ri',
      });
      return;
    }

    // Validation: Password length
    if (password.length < 6) {
      res.status(400).json({
        success: false,
        error: 'Parol kamida 6 ta belgidan iborat bo\'lishi shart',
      });
      return;
    }

    // Validation: Role
    if (role !== 'doctor' && role !== 'parent') {
      res.status(400).json({
        success: false,
        error: "Role faqat 'doctor' yoki 'parent' bo'lishi mumkin",
      });
      return;
    }

    // Check if email already exists in Supabase Auth
    const { data: existingAuthUser, error: authError } = await supabaseAdmin
      .from('users')
      .select('email')
      .eq('email', email)
      .single();

    if (existingAuthUser) {
      res.status(400).json({
        success: false,
        error: 'Ushbu email allaqachon ro\'yxatdan o\'tgan',
      });
      return;
    }

    // 1. Create user in Supabase Auth
    const { data: authData, error: signUpError } = await supabaseAdmin.auth.signUp(
      {
        email,
        password,
        options: {
          data: {
            full_name,
            role,
          },
        },
      }
    );

    if (signUpError || !authData.user) {
      console.error('Supabase signUp error:', signUpError);
      res.status(400).json({
        success: false,
        error: signUpError?.message || 'Ro\'yxatdan o\'tishda xatolik',
      });
      return;
    }

    // 2. Insert user into custom users table
    const { data: userData, error: insertError } = await supabaseAdmin
      .from('users')
      .insert({
        id: authData.user.id,
        email,
        full_name,
        role,
        is_active: true,
      })
      .select()
      .single();

    if (insertError || !userData) {
      console.error('Insert user error:', insertError);
      // Try to clean up auth user if table insert fails
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      res.status(500).json({
        success: false,
        error: 'Foydalanuvchi ma\'lumotlarini saqlashda xatolik',
      });
      return;
    }

    // 3. Generate JWT Token
    const token = generateToken({
      id: userData.id,
      email: userData.email,
      role: userData.role,
    });

    // 4. Send success response
    res.status(201).json({
      success: true,
      message: 'Muvaffaqiyatli ro\'yxatdan o\'tdingiz',
      data: {
        token,
        user: {
          id: userData.id,
          email: userData.email,
          full_name: userData.full_name,
          role: userData.role,
        },
      },
    });
  } catch (error) {
    console.error('Register controller error:', error);
    res.status(500).json({
      success: false,
      error: 'Ro\'yxatdan o\'tishda xatolik yuz berdi',
    });
  }
};

/**
 * @desc    Login user
 * @route   POST /api/auth/login
 */
export const login = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { email, password } = req.body;

    console.log('Login request:', { email })

    // Validation
    if (!email || !password) {
      res.status(400).json({
        success: false,
        error: 'Email va parolni kiriting',
      });
      return;
    }

    // 1. Sign in with Supabase Auth
    const { data: authData, error: signInError } = await supabaseAdmin.auth.signInWithPassword(
      {
        email,
        password,
      }
    );

    console.log('Supabase auth result:', {
      userId: authData?.user?.id,
      error: signInError?.message
    })

    if (signInError || !authData.user) {
      console.log('Auth error:', signInError)
      res.status(401).json({
        success: false,
        error: 'Email yoki parol noto\'g\'ri',
      });
      return;
    }

    // 2. Get user from custom users table
    const { data: userDataResult, error: userError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', authData.user.id)
      .single();

    console.log('User from DB:', {
      user: userDataResult,
      error: userError?.message
    })

    let userData = userDataResult

    if (!userData) {
      const { error: insertError } = await supabaseAdmin
        .from('users')
        .insert({
          id: authData.user.id,
          email: authData.user.email || '',
          full_name: authData.user.email?.split('@')[0] || 'User',
          role: 'parent'
        })

      if (insertError) {
        console.error('Auto-create user error:', insertError)
        res.status(401).json({
          success: false,
          error: 'Foydalanuvchi topilmadi',
        })
        return
      }

      const { data: newUser } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('id', authData.user.id)
        .single()

      userData = newUser
    }

    // 3. Generate JWT Token
    const token = generateToken({
      id: userData.id,
      email: userData.email,
      role: userData.role,
    });

    // 4. Send success response
    res.status(200).json({
      success: true,
      message: 'Xush kelibsiz!',
      data: {
        token,
        user: {
          id: userData.id,
          email: userData.email,
          full_name: userData.full_name,
          role: userData.role,
        },
      },
    });
  } catch (error) {
    console.error('Login controller error:', error);
    res.status(500).json({
      success: false,
      error: 'Kirishda xatolik yuz berdi',
    });
  }
};

/**
 * @desc    Logout user
 * @route   POST /api/auth/logout
 */
export const logout = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // Get access token from header
    const authHeader = req.headers.authorization;
    const token = authHeader?.split(' ')[1];

    if (token) {
      try {
        // Revoke refresh token via Supabase
        await supabaseAdmin.auth.signOut();
      } catch (err) {
        console.warn('Supabase signOut warning:', err);
      }
    }

    res.status(200).json({
      success: true,
      message: 'Chiqildi',
    });
  } catch (error) {
    console.error('Logout controller error:', error);
    res.status(500).json({
      success: false,
      error: 'Chiqishda xatolik yuz berdi',
    });
  }
};

/**
 * @desc    Get current user profile
 * @route   GET /api/auth/me
 */
export const getMe = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const user = (req as any).user as User;

    // Get fresh user data from database
    const { data: userData, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error || !userData) {
      res.status(404).json({
        success: false,
        error: 'Foydalanuvchi topilmadi',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: userData.id,
          email: userData.email,
          full_name: userData.full_name,
          role: userData.role,
          avatar_url: userData.avatar_url,
          phone: userData.phone,
          is_active: userData.is_active,
          created_at: userData.created_at,
          updated_at: userData.updated_at,
        },
      },
    });
  } catch (error) {
    console.error('GetMe controller error:', error);
    res.status(500).json({
      success: false,
      error: 'Profilni olishda xatolik yuz berdi',
    });
  }
};