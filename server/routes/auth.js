const { Router } = require('express');
const { createClient } = require('@supabase/supabase-js');
const nodemailer = require('nodemailer');
const crypto = require('crypto');

const router = Router();
const supabaseUrl = process.env.SUPABASE_URL ?? '';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY ?? '';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';

const send = (res, body, status) => res.status(status).json(body);

const OTP_EXPIRY_MINUTES = 15;
const OTP_LENGTH = 6;
const OTP_MAX_ATTEMPTS = 5;

function normalizeEmail(email) {
  return String(email ?? '').trim().toLowerCase();
}

function hashOtp(otp) {
  return crypto.createHash('sha256').update(String(otp)).digest('hex');
}

function generateOtp() {
  const digits = '0123456789';
  let otp = '';
  for (let i = 0; i < OTP_LENGTH; i++) {
    otp += digits[Math.floor(Math.random() * 10)];
  }
  return otp;
}

function getTransporter() {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!host || !port || !user || !pass) return null;
  return nodemailer.createTransport({
    host,
    port: parseInt(port, 10),
    secure: port === '465',
    auth: { user, pass },
  });
}

async function sendOtpEmail(to, otp, options = {}) {
  const { subject = 'Your NourishNet verification code', context = 'signup' } = options;
  const transporter = getTransporter();
  if (!transporter) {
    console.warn('[auth] SMTP not configured; skipping OTP email');
    return {};
  }
  const from = process.env.SMTP_FROM ?? process.env.SMTP_USER ?? 'noreply@nourishnet.com';
  try {
    await transporter.sendMail({
      from,
      to,
      subject,
      text: `Your verification code is: ${otp}. It expires in ${OTP_EXPIRY_MINUTES} minutes.`,
      html: `<p>Your verification code is: <strong>${otp}</strong></p><p>It expires in ${OTP_EXPIRY_MINUTES} minutes.</p>`,
    });
    return {};
  } catch (e) {
    return { error: String(e) };
  }
}

async function findUserByEmail(admin, email) {
  const normalized = normalizeEmail(email);
  let page = 1;
  const perPage = 100;
  while (true) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
    if (error || !data?.users) return null;
    const user = data.users.find((u) => (u.email || '').toLowerCase() === normalized);
    if (user) return { id: user.id };
    if (data.users.length < perPage) return null;
    page++;
  }
}

// ---------- Recipient signup (no OTP) ----------
router.post('/signup-recipient', async (req, res) => {
  try {
    console.log('[signup-recipient] Request received:', { email: req.body?.email });
    const email = normalizeEmail(req.body?.email);
    const password = typeof req.body?.password === 'string' ? req.body.password : '';
    
    if (!email) {
      console.log('[signup-recipient] Email missing');
      return send(res, { error: 'Email is required' }, 400);
    }
    if (password.length < 6) {
      console.log('[signup-recipient] Password too short');
      return send(res, { error: 'Password must be at least 6 characters' }, 400);
    }
    
    console.log('[signup-recipient] Creating Supabase admin client...');
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);
    
    console.log('[signup-recipient] Checking if user exists...');
    const user = await findUserByEmail(supabaseAdmin, email);
    if (user) {
      console.log('[signup-recipient] User already exists');
      return send(res, { error: 'An account with this email already exists.' }, 400);
    }
    
    // Create user directly without OTP verification
    console.log('[signup-recipient] Creating user account...');
    const { data: createdAuth, error: createAuthError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    
    if (createAuthError || !createdAuth?.user?.id) {
      console.error('[signup-recipient] Failed to create user:', createAuthError);
      return send(res, { error: createAuthError?.message ?? 'Failed to create account.' }, 400);
    }
    
    console.log('[signup-recipient] User created:', createdAuth.user.id);
    
    // Wait for the trigger to create the profile row (trigger runs AFTER INSERT)
    console.log('[signup-recipient] Waiting for profile trigger to complete...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Verify profile exists
    const { data: existingProfile, error: checkError } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('id', createdAuth.user.id)
      .single();
    
    if (checkError || !existingProfile) {
      console.error('[signup-recipient] Profile not found after trigger:', checkError);
      await supabaseAdmin.auth.admin.deleteUser(createdAuth.user.id);
      return send(res, { error: 'Failed to create profile. Please try again.' }, 500);
    }
    
    console.log('[signup-recipient] Profile exists, proceeding with update...');
    
    // Generate anonymous username: AnonymousUser + 4 random digits
    const randomDigits = Math.floor(1000 + Math.random() * 9000); // Generates 1000-9999
    const anonymousName = `AnonymousUser${randomDigits}`;
    
    // Set role to recipient and anonymous username
    console.log('[signup-recipient] Setting role to recipient and username:', anonymousName);
    const { data: updateData, error: profileRoleError } = await supabaseAdmin
      .from('profiles')
      .update({
        role: 'recipient',
        full_name: anonymousName,
        updated_at: new Date().toISOString(),
      })
      .eq('id', createdAuth.user.id)
      .select();
      
    console.log('[signup-recipient] Update result:', { updateData, profileRoleError });
      
    if (profileRoleError) {
      console.error('[signup-recipient] Failed to set role:', profileRoleError);
      await supabaseAdmin.auth.admin.deleteUser(createdAuth.user.id);
      return send(res, { error: 'Failed to finish signup. Please try again.' }, 500);
    }
    
    if (!updateData || updateData.length === 0) {
      console.error('[signup-recipient] No rows updated - profile might not exist yet');
      await supabaseAdmin.auth.admin.deleteUser(createdAuth.user.id);
      return send(res, { error: 'Failed to finish signup. Please try again.' }, 500);
    }
    
    console.log('[signup-recipient] Signup successful');
    return send(res, { success: true }, 200);
  } catch (e) {
    console.error('[signup-recipient] Unexpected error:', e);
    return send(res, { error: 'Something went wrong' }, 500);
  }
});

// ---------- Signup OTP ----------
router.post('/start-signup', async (req, res) => {
  try {
    const email = normalizeEmail(req.body?.email);
    const role = req.body?.role === 'provider' ? 'provider' : 'recipient';
    if (!email) {
      return send(res, { error: 'Email is required' }, 400);
    }
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);
    const user = await findUserByEmail(supabaseAdmin, email);
    if (user) {
      return send(res, { error: 'An account with this email already exists.' }, 400);
    }
    const otp = generateOtp();
    const otpHash = hashOtp(otp);
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000).toISOString();
    const { error: updateError } = await supabaseAdmin
      .from('pending_signups')
      .upsert({
        email,
        role,
        signup_otp_hash: otpHash,
        signup_otp_expires_at: expiresAt,
        otp_attempts: 0,
        last_sent_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'email',
      });
    if (updateError) {
      console.error('[start-signup] Pending signup update failed', updateError);
      return send(res, { error: 'Failed to send code. Please try again.' }, 500);
    }
    const mailResult = await sendOtpEmail(email, otp, { subject: 'Your NourishNet verification code' });
    if (mailResult.error) {
      console.error('[start-signup] Send OTP email failed', mailResult.error);
      return send(res, { error: 'Failed to send email. Please try again.' }, 500);
    }
    return send(res, { success: true }, 200);
  } catch (e) {
    console.error('[start-signup]', e);
    return send(res, { error: 'Something went wrong' }, 500);
  }
});

router.post('/resend-signup-otp', async (req, res) => {
  try {
    const email = normalizeEmail(req.body?.email);
    if (!email) {
      return send(res, { error: 'Email is required' }, 400);
    }
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);
    const { data: pending, error: pendingError } = await supabaseAdmin
      .from('pending_signups')
      .select('email')
      .eq('email', email)
      .single();
    if (pendingError || !pending) {
      return send(res, { error: 'Please start signup again.' }, 400);
    }
    const otp = generateOtp();
    const otpHash = hashOtp(otp);
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000).toISOString();
    const { error: updateError } = await supabaseAdmin
      .from('pending_signups')
      .update({
        signup_otp_hash: otpHash,
        signup_otp_expires_at: expiresAt,
        otp_attempts: 0,
        last_sent_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('email', email);
    if (updateError) {
      console.error('[resend-signup-otp] Pending signup update failed', updateError);
      return send(res, { error: 'Failed to send code. Please try again.' }, 500);
    }
    const mailResult = await sendOtpEmail(email, otp, { subject: 'Your NourishNet verification code' });
    if (mailResult.error) {
      console.error('[resend-signup-otp] Send OTP email failed', mailResult.error);
      return send(res, { error: 'Failed to send email. Please try again.' }, 500);
    }
    return send(res, { success: true }, 200);
  } catch (e) {
    console.error('[resend-signup-otp]', e);
    return send(res, { error: 'Something went wrong' }, 500);
  }
});

router.post('/verify-signup-otp', async (req, res) => {
  try {
    const email = normalizeEmail(req.body?.email);
    const otp = typeof req.body?.otp === 'string' ? req.body.otp.trim() : '';
    const password = typeof req.body?.password === 'string' ? req.body.password : '';
    if (!email || !otp) {
      return send(res, { error: 'Email and code are required' }, 400);
    }
    if (password.length < 6) {
      return send(res, { error: 'Password must be at least 6 characters' }, 400);
    }
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);
    const user = await findUserByEmail(supabaseAdmin, email);
    if (user) {
      return send(res, { error: 'An account with this email already exists.' }, 400);
    }
    const { data: pending, error: pendingError } = await supabaseAdmin
      .from('pending_signups')
      .select('signup_otp_hash, signup_otp_expires_at, otp_attempts, role')
      .eq('email', email)
      .single();
    if (pendingError || !pending) {
      return send(res, { error: 'Invalid or expired code. Please request a new one.' }, 400);
    }
    if ((pending.otp_attempts ?? 0) >= OTP_MAX_ATTEMPTS) {
      return send(res, { error: 'Too many attempts. Please request a new code.' }, 400);
    }
    if (
      !pending.signup_otp_hash ||
      !pending.signup_otp_expires_at ||
      new Date(pending.signup_otp_expires_at) < new Date()
    ) {
      return send(res, { error: 'Invalid or expired code. Please request a new one.' }, 400);
    }
    if (pending.signup_otp_hash !== hashOtp(otp)) {
      await supabaseAdmin
        .from('pending_signups')
        .update({
          otp_attempts: (pending.otp_attempts ?? 0) + 1,
          updated_at: new Date().toISOString(),
        })
        .eq('email', email);
      return send(res, { error: 'Invalid or expired code. Please request a new one.' }, 400);
    }
    const { data: createdAuth, error: createAuthError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    if (createAuthError || !createdAuth?.user?.id) {
      return send(res, { error: createAuthError?.message ?? 'Failed to verify.' }, 400);
    }
    const { error: profileRoleError } = await supabaseAdmin
      .from('profiles')
      .update({
        role: pending.role === 'provider' ? 'provider' : 'recipient',
        updated_at: new Date().toISOString(),
      })
      .eq('id', createdAuth.user.id);
    if (profileRoleError) {
      await supabaseAdmin.auth.admin.deleteUser(createdAuth.user.id);
      return send(res, { error: 'Failed to finish signup. Please try again.' }, 500);
    }
    await supabaseAdmin.from('pending_signups').delete().eq('email', email);
    return send(res, { success: true }, 200);
  } catch (e) {
    console.error('[verify-signup-otp]', e);
    return send(res, { error: 'Something went wrong' }, 500);
  }
});

// Backward-compatible alias for old clients
router.post('/send-signup-otp', async (req, res) => {
  try {
    const email = normalizeEmail(req.body?.email);
    if (!email) {
      return send(res, { error: 'Email is required' }, 400);
    }
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);
    const { data: pending, error: pendingError } = await supabaseAdmin
      .from('pending_signups')
      .select('email')
      .eq('email', email)
      .single();
    if (pendingError || !pending) {
      return send(res, { error: 'Please start signup again.' }, 400);
    }
    const otp = generateOtp();
    const otpHash = hashOtp(otp);
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000).toISOString();
    const { error: updateError } = await supabaseAdmin
      .from('pending_signups')
      .update({
        signup_otp_hash: otpHash,
        signup_otp_expires_at: expiresAt,
        otp_attempts: 0,
        last_sent_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('email', email);
    if (updateError) {
      console.error('[send-signup-otp] Pending signup update failed', updateError);
      return send(res, { error: 'Failed to send code. Please try again.' }, 500);
    }
    const mailResult = await sendOtpEmail(email, otp, { subject: 'Your NourishNet verification code' });
    if (mailResult.error) {
      console.error('[send-signup-otp] Send OTP email failed', mailResult.error);
      return send(res, { error: 'Failed to send email. Please try again.' }, 500);
    }
    return send(res, { success: true }, 200);
  } catch (e) {
    console.error('[send-signup-otp]', e);
    return send(res, { error: 'Something went wrong' }, 500);
  }
});

// ---------- Forgot password ----------
router.post('/forgot-password', async (req, res) => {
  try {
    const email = typeof req.body?.email === 'string' ? req.body.email.trim() : '';
    if (!email) {
      return send(res, { error: 'Email is required' }, 400);
    }
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);
    const user = await findUserByEmail(supabaseAdmin, email);
    if (!user) {
      return send(res, { success: true }, 200);
    }
    const otp = generateOtp();
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000).toISOString();
    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({
        password_reset_otp: otp,
        password_reset_otp_expires_at: expiresAt,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);
    if (updateError) {
      console.error('[forgot-password] Profile update failed', updateError);
      return send(res, { success: true }, 200);
    }
    const mailResult = await sendOtpEmail(email, otp, {
      subject: 'Your NourishNet password reset code',
    });
    if (mailResult.error) {
      console.error('[forgot-password] Send OTP email failed', mailResult.error);
      return send(res, { error: 'Failed to send email. Please try again.' }, 500);
    }
    return send(res, { success: true }, 200);
  } catch (e) {
    console.error('[forgot-password]', e);
    return send(res, { error: 'Something went wrong' }, 500);
  }
});

router.post('/verify-reset-otp', async (req, res) => {
  try {
    const email = typeof req.body?.email === 'string' ? req.body.email.trim() : '';
    const otp = typeof req.body?.otp === 'string' ? req.body.otp.trim() : '';
    if (!email || !otp) {
      return send(res, { error: 'Email and code are required' }, 400);
    }
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);
    const user = await findUserByEmail(supabaseAdmin, email);
    if (!user) {
      return send(res, { error: 'Invalid or expired code. Please request a new one.' }, 400);
    }
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('password_reset_otp, password_reset_otp_expires_at')
      .eq('id', user.id)
      .single();
    if (profileError || !profile) {
      return send(res, { error: 'Invalid or expired code. Please request a new one.' }, 400);
    }
    const storedOtp = profile.password_reset_otp;
    const expiresAt = profile.password_reset_otp_expires_at;
    if (!storedOtp || !expiresAt || new Date(expiresAt) < new Date()) {
      return send(res, { error: 'Invalid or expired code. Please request a new one.' }, 400);
    }
    if (storedOtp !== otp) {
      return send(res, { error: 'Invalid or expired code. Please request a new one.' }, 400);
    }
    return send(res, { success: true }, 200);
  } catch (e) {
    console.error('[verify-reset-otp]', e);
    return send(res, { error: 'Something went wrong' }, 500);
  }
});

router.post('/verify-reset-otp-and-set-password', async (req, res) => {
  try {
    const email = typeof req.body?.email === 'string' ? req.body.email.trim() : '';
    const otp = typeof req.body?.otp === 'string' ? req.body.otp.trim() : '';
    const newPassword = typeof req.body?.newPassword === 'string' ? req.body.newPassword : '';
    if (!email || !otp) {
      return send(res, { error: 'Email and code are required' }, 400);
    }
    if (newPassword.length < 6) {
      return send(res, { error: 'Password must be at least 6 characters' }, 400);
    }
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);
    const user = await findUserByEmail(supabaseAdmin, email);
    if (!user) {
      return send(res, { error: 'Invalid or expired code. Please request a new one.' }, 400);
    }
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('password_reset_otp, password_reset_otp_expires_at')
      .eq('id', user.id)
      .single();
    if (profileError || !profile) {
      return send(res, { error: 'Invalid or expired code. Please request a new one.' }, 400);
    }
    const storedOtp = profile.password_reset_otp;
    const expiresAt = profile.password_reset_otp_expires_at;
    if (!storedOtp || !expiresAt || new Date(expiresAt) < new Date()) {
      return send(res, { error: 'Invalid or expired code. Please request a new one.' }, 400);
    }
    if (storedOtp !== otp) {
      return send(res, { error: 'Invalid or expired code. Please request a new one.' }, 400);
    }
    const { error: updateAuthError } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
      password: newPassword,
    });
    if (updateAuthError) {
      return send(res, { error: updateAuthError.message ?? 'Failed to update password' }, 400);
    }
    await supabaseAdmin
      .from('profiles')
      .update({
        password_reset_otp: null,
        password_reset_otp_expires_at: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);
    return send(res, { success: true }, 200);
  } catch (e) {
    console.error('[verify-reset-otp-and-set-password]', e);
    return send(res, { error: 'Something went wrong' }, 500);
  }
});

// ---------- Change password (authenticated) ----------
router.post('/change-password', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return send(res, { error: 'Missing or invalid Authorization header' }, 401);
    }
    const currentPassword = typeof req.body?.currentPassword === 'string' ? req.body.currentPassword : '';
    const newPassword = typeof req.body?.newPassword === 'string' ? req.body.newPassword : '';
    if (!currentPassword) {
      return send(res, { error: 'Current password is required' }, 400);
    }
    if (newPassword.length < 6) {
      return send(res, { error: 'New password must be at least 6 characters' }, 400);
    }
    const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userError } = await supabaseAnon.auth.getUser();
    if (userError || !user?.email) {
      return send(res, { error: userError?.message ?? 'Invalid token or user not found' }, 401);
    }
    const supabaseVerify = createClient(supabaseUrl, supabaseAnonKey);
    const { error: signInError } = await supabaseVerify.auth.signInWithPassword({
      email: user.email,
      password: currentPassword,
    });
    if (signInError) {
      return send(res, { error: 'Current password is incorrect' }, 400);
    }
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
      password: newPassword,
    });
    if (updateError) {
      return send(res, { error: updateError.message ?? 'Failed to update password' }, 400);
    }
    return send(res, { success: true }, 200);
  } catch (e) {
    console.error('[change-password]', e);
    return send(res, { error: 'Something went wrong' }, 500);
  }
});

// ---------- Delete user (authenticated) ----------
router.post('/delete-user', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return send(res, { error: 'Missing or invalid Authorization header' }, 200);
    }
    const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userError } = await supabaseAnon.auth.getUser();
    if (userError || !user) {
      return send(res, { error: userError?.message ?? 'Invalid token or user not found' }, 200);
    }
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);
    const { error: profileError } = await supabaseAdmin.from('profiles').delete().eq('id', user.id);
    if (profileError) {
      return send(res, { error: profileError.message ?? 'Failed to remove profile' }, 200);
    }
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(user.id);
    if (deleteError) {
      return send(res, { error: deleteError.message }, 200);
    }
    return send(res, { success: true }, 200);
  } catch (e) {
    console.error('[delete-user]', e);
    return send(res, { error: String(e) }, 200);
  }
});

module.exports = router;
