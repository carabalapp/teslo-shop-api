import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Headers, SetMetadata } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateUserDto, LoginUserDto } from './dto';
import { AuthGuard } from '@nestjs/passport';
import { User } from './entities/user.entity';
import { GetUser, GetRawHeaders } from './decorators';
import { IncomingHttpHeaders } from 'http';
import { UserRoleGuard } from './guards/user-role/user-role.guard';
import { META_ROLES, RoleProtected } from './decorators/role-protected.decorator';
import { ValidRoles } from './interfaces';
import { Auth } from './decorators/auth.decorator';



@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @Post('register')
  createUser(@Body() createUserDto: CreateUserDto) {
    return this.authService.create(createUserDto);
  }

  @Post('login')
  loginUser(@Body() loginUserDto: LoginUserDto) {
    return this.authService.login(loginUserDto);
  }

  @Get('private')
  @UseGuards(AuthGuard())
  testingPrivateRoute(
    @GetUser('') user: User,
    @GetUser('email') userEmail: User,
    @GetRawHeaders() rawHeaders: string[],
    @Headers() headers: IncomingHttpHeaders
  ) {
    console.log(user)
    return {
      ok: true,
      message: 'This route is private',
      user,
      userEmail,
      rawHeaders,
      headers
    }
  }

  @Get('private2')
  @RoleProtected(ValidRoles.admin, ValidRoles.superUser)
  @UseGuards(AuthGuard(), UserRoleGuard)
  privateRoute2(
    @GetUser('') user: User
  ) {
    return {
      ok: true,
      message: 'This route is private 2',
      user
    }
  }
  
  // Asi queda el endpoint definitivo con la ultima implementacion y las mas optimizada
  @Get('private3')
  @Auth(ValidRoles.admin, ValidRoles.superUser, ValidRoles.user)
  privateRoute3(
    @GetUser('') user: User
    ) {
      return {
        ok: true,
        message: 'This route is private 3',
        user
      }
    }
}
