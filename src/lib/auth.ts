// src/lib/auth.ts

import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

// ============================================
// TYPES - Mendefinisikan struktur data
// ============================================

// Data yang akan disimpan di dalam JWT token
export interface JWTPayload {
  userId: number;
  email: string;
  name: string;
  roles: string[]; // User bisa punya multiple roles
}

// Hasil setelah verify token
export interface VerifyTokenResult {
  valid: boolean;
  payload?: JWTPayload;
  error?: string;
}

// ============================================
// CONFIGURATION
// ============================================

// Ambil secret dari environment variable
// Tanda seru (!) artinya kita yakin nilai ini pasti ada
const JWT_SECRET = process.env.JWT_SECRET!;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

// ============================================
// PASSWORD FUNCTIONS
// ============================================

/**
 * Hash password sebelum disimpan ke database
 *
 * @param password - Password plain text dari user
 * @returns Password yang sudah di-hash
 *
 * Contoh:
 * hashPassword("admin123")
 * => "$2a$10$N9qo8uLOickgx2ZMRZoMy..."
 *
 * Angka 10 adalah "salt rounds" - semakin tinggi semakin aman
 * tapi semakin lambat. 10 adalah standar yang bagus.
 */
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 10;
  return bcrypt.hash(password, saltRounds);
}

/**
 * Verifikasi password saat login
 *
 * @param password - Password plain text yang diinput user
 * @param hashedPassword - Password hash dari database
 * @returns true jika cocok, false jika tidak
 *
 * Contoh:
 * verifyPassword("admin123", "$2a$10$N9qo8uLOickgx2ZMRZoMy...")
 * => true (jika cocok)
 */
export async function verifyPassword(
  password: string,
  hashedPassword: string,
): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

// ============================================
// JWT FUNCTIONS
// ============================================

/**
 * Generate JWT token setelah login berhasil
 *
 * @param payload - Data user yang mau disimpan di token
 * @returns JWT token string
 *
 * Token ini akan dikirim ke client dan disimpan di cookie.
 * Setiap request ke protected route, token ini harus dikirim.
 */
export function generateToken(payload: JWTPayload): string {
  // Cast expiresIn ke type yang benar
  const options: jwt.SignOptions = {
    expiresIn: JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"],
  };

  return jwt.sign(payload, JWT_SECRET, options);
}

/**
 * Verify dan decode JWT token
 *
 * @param token - JWT token dari client
 * @returns Object berisi valid status dan payload (jika valid)
 *
 * Fungsi ini dipanggil di middleware untuk cek apakah
 * user sudah login dan tokennya masih valid.
 */
export function verifyToken(token: string): VerifyTokenResult {
  try {
    // jwt.verify akan throw error jika token invalid/expired
    const payload = jwt.verify(token, JWT_SECRET) as JWTPayload;

    return {
      valid: true,
      payload,
    };
  } catch (error) {
    // Token invalid, expired, atau tampered
    return {
      valid: false,
      error: error instanceof Error ? error.message : "Invalid token",
    };
  }
}

// ============================================
// COOKIE HELPER
// ============================================

// Nama cookie yang akan digunakan untuk menyimpan token
export const AUTH_COOKIE_NAME = "auth_token";

/**
 * Cookie options untuk keamanan
 *
 * - httpOnly: Cookie tidak bisa diakses via JavaScript (prevent XSS)
 * - secure: Hanya dikirim via HTTPS (di production)
 * - sameSite: Prevent CSRF attacks
 * - maxAge: Berapa lama cookie valid (dalam detik)
 * - path: Cookie berlaku untuk semua routes
 */
export const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  maxAge: 1 * 24 * 60 * 60, // 1 hari dalam detik
  path: "/",
};
