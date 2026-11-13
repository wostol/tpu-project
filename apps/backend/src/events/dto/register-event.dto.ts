import { IsString, IsIn, IsOptional } from 'class-validator'

export class RegisterEventDto {
  @IsOptional()
  eventId?: number | string

  @IsString()
  @IsIn(['participant', 'fan'])
  registrationType!: 'participant' | 'fan'
}