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
  
  // Хэшируем с солью из env (или дефолтной)
  const salt = process.env.PHONE_HASH_SALT || 'connect2kehilla_default_salt'
  
  return crypto
    .createHash('sha256')
    .update(normalized + salt)
    .digest('hex')
}

// ============================================
// Получить или создать пользователя
// ============================================
export async function getOrCreateUser(phone: string) {
  const phoneHash = hashPhone(phone)
  
  let user = await prisma.user.findUnique({
    where: { phoneHash }
  })
  
  if (!user) {
    user = await prisma.user.create({
      data: { phoneHash }
    })
  } else {
    // Обновляем lastActiveAt
    await prisma.user.update({
      where: { id: user.id },
      data: { lastActiveAt: new Date() }
    })
  }
  
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
