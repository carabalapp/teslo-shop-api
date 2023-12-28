import { BadRequestException, Injectable, InternalServerErrorException, Logger, UnauthorizedException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt'
import { LoginUserDto } from './dto/login-user.dto';
import { jwtPayload } from './interfaces/jwt-payload.interface';
import { JwtService } from '@nestjs/jwt';


@Injectable()
export class AuthService {
  private readonly logger = new Logger('AuthService')
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService
  ) { }

  async create(createUserDto: CreateUserDto) {
    try {
      const { password, ...userData } = createUserDto
      // const user = this.userRepository.create(createUserDto) // De esta manera creamos un usuario sin encriptar su contraseña

      // Aca se crea la contraseña encriptada
      const user = this.userRepository.create({
        ...userData,
        password: bcrypt.hashSync(password, 10)
      })
      await this.userRepository.save(user)

      // En este punto ya se guardo todos los datos en BD, asi que no impiorta si borramos la password del objeto
      // No nos interesa regresar la password en la respuesta ya que cualquier persona podria verla.
      delete user.password
      return {
        ...user,
        token: this.getJwtToken({ id: user.id })
      };
    } catch (error) {
      this.handleDBErrors(error)
    }
  }

  async login(loginUserDto: LoginUserDto) {
    const { password, email } = loginUserDto

    const user = await this.userRepository.findOne(
      {
        where: { email },
        select: { email: true, password: true, id: true }
      })

    if (!user)
      throw new UnauthorizedException('Credentials are not valid (email)')

    if (!bcrypt.compareSync(password, user.password))
      throw new UnauthorizedException('Credentials are not valid (password)')

    return {
      ...user,
      token: this.getJwtToken({ id: user.id })
    };
  }

  private getJwtToken(payload: jwtPayload) {
    try {
      const token = this.jwtService.sign(payload)
      return token
      
    } catch (error) {
      this.logger.error(error)
    }
  }

  private handleDBErrors(error: any): never {

    if (error.code === '23505')
      throw new BadRequestException(error.detail)

    this.logger.error(error)

    throw new InternalServerErrorException(`please check server logs`)
  }
}
