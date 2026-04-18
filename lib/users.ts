// lib/users.ts
// Управление пользователями (анонимизация и хранение)

import crypto from 'crypto'
import prisma from './db'

// ============================================
// Хэширование телефона (SHA-256)
// ============================================
export function hashPhone(phone: string): string {
  // Нормализуем номер (убираем всё кроме цифр)
  const normalized = phone.replace(/\D/g, '')
  
  // Хэшируем с солью из env (обязательна)
  const salt = process.env.PHONE_HASH_SALT
  if (!salt) {
    throw new Error('PHONE_HASH_SALT environment variable is required')
  }
  
  return crypto
    .createHash('sha256')
    .update(normalized + salt)
    .digest('hex')
}

// ============================================
// Нормализация телефона в E.164 (+1XXXXXXXXXX)
// ============================================
function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  if (digits.length === 10) return '+1' + digits
  if (digits.length === 11 && digits.startsWith('1')) return '+' + digits
  if (phone.startsWith('+')) return phone
  return '+' + digits
}

// ============================================
// Получить или создать пользователя
// Сохраняет raw phone для последующих broadcast-рассылок
// (пользователь уже opt-in тем что обратился к сервису)
// ============================================
export async function getOrCreateUser(phone: string) {
  const phoneHash = hashPhone(phone)
  const rawPhone = normalizePhone(phone)

  const user = await prisma.user.upsert({
    where: { phoneHash },
    create: { phoneHash, phone: rawPhone },
    update: { lastActiveAt: new Date(), phone: rawPhone },  // backfill phone on every interaction
  })

  return user
}

// ============================================
// Проверить, заблокирован ли пользователь (STOP)
// ============================================
export async function isUserBlocked(phone: string): Promise<boolean> {
  const phoneHash = hashPhone(phone)
  
  const user = await prisma.user.findUnique({
    where: { phoneHash },
    select: { isBlocked: true }
  })
  
  return user?.isBlocked ?? false
}

// ============================================
// Заблокировать пользователя (STOP команда)
// ============================================
export async function blockUser(phone: string): Promise<void> {
  const phoneHash = hashPhone(phone)
  
  await prisma.user.upsert({
    where: { phoneHash },
    update: { isBlocked: true },
    create: { phoneHash, isBlocked: true }
  })
}

// ============================================
// Разблокировать пользователя (START команда)
// ============================================
export async function unblockUser(phone: string): Promise<void> {
  const phoneHash = hashPhone(phone)
  
  await prisma.user.update({
    where: { phoneHash },
    data: { isBlocked: false }
  })
}

// ============================================
// Сохранить дефолтный ZIP пользователя
// ============================================
export async function setUserDefaultZip(phone: string, zipCode: string): Promise<void> {
  const phoneHash = hashPhone(phone)
  
  await prisma.user.update({
    where: { phoneHash },
    data: { defaultZip: zipCode }
  })
}

// ============================================
// Получить дефолтный ZIP пользователя
// ============================================
export async function getUserDefaultZip(phone: string): Promise<string | null> {
  const phoneHash = hashPhone(phone)
  
  const user = await prisma.user.findUnique({
    where: { phoneHash },
    select: { defaultZip: true }
  })
  
  return user?.defaultZip ?? null
}
