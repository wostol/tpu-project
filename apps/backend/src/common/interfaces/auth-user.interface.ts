/**
 * AuthUser — данные о пользователе, извлечённые из JWT.
 * Это то, что возвращается из JwtStrategy.validate() и вкладывается в request.user.
 */
export interface AuthUser {
  id: number
  email: string
  role: 'USER' | 'ADMIN'
}

/**
 * UserRole — типобезопасный enum для ролей.
 * Хранится строкой в БД (SQLite не поддерживает enum),
 * но в коде используем этот union-тип.
 */
export type UserRole = 'USER' | 'ADMIN'
