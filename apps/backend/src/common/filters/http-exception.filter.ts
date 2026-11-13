import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common'
import { Request, Response } from 'express'

/**
 * Глобальный exception filter — перехватывает все ошибки и возвращает
 * единый JSON-формат { statusCode, message, error, timestamp, path }.
 *
 * Это нужно, чтобы фронтенд всегда мог распарсить ошибку одним способом
 * и чтобы в логах был структурированный след.
 */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name)

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp()
    const response = ctx.getResponse<Response>()
    const request = ctx.getRequest<Request>()

    let status: number
    let message: string | string[]
    let error: string

    if (exception instanceof HttpException) {
      status = exception.getStatus()
      const res = exception.getResponse()
      if (typeof res === 'string') {
        message = res
        error = exception.name
      } else if (typeof res === 'object' && res !== null) {
        const r = res as Record<string, unknown>
        message = (r.message as string | string[]) ?? exception.message
        error = (r.error as string) ?? exception.name
      } else {
        message = exception.message
        error = exception.name
      }
    } else {
      // Не HttpException — внутренняя ошибка сервера
      status = HttpStatus.INTERNAL_SERVER_ERROR
      message = 'Внутренняя ошибка сервера'
      error = 'Internal Server Error'
      this.logger.error(
        `Unhandled exception: ${exception instanceof Error ? exception.stack : exception}`,
      )
    }

    const body = {
      statusCode: status,
      message,
      error,
      timestamp: new Date().toISOString(),
      path: request.url,
    }

    response.status(status).json(body)
  }
}
