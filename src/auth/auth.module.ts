import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtStrategy } from './strategies/jwt.strategies';

@Module({
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([User]),
    PassportModule.register({ defaultStrategy: 'jwt'}),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        
        if(configService.get('JWT_SECRET') === undefined) {
          throw new Error('JWT_SECRET is undefined');
        }
        if(configService.get('JWT_EXPIRES_IN') === undefined) {
          throw new Error('JWT_EXPIRES_IN is undefined');
        }
        return {
          secret: configService.get('JWT_SECRET'), // hacer esto es lo mismo que trabajar con process.env.NOMBRE_DE_LA_VARIABLE
          signOptions: {expiresIn: configService.get('JWT_EXPIRES_IN')}
        }
      }
    })
    // Haciendiolo de esta manera no lo hacemos asincrono y si dependieramos de una configuracion en la nube, entonces fallaria.
    // JwtModule.register({
    //   secret: process.env.JWT_SECRET,
    //   signOptions: {
    //     expiresIn: process.env.JWT_EXPIRES_IN
    //   }
    // })

  ],
  exports: [TypeOrmModule, JwtStrategy, PassportModule, JwtModule]
})
export class AuthModule {}
