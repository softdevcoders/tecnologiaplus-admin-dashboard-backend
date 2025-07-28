import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-jwt';
import { jwtConstants } from './constants';

interface JwtPayload {
  sub: string;
  username: string;
  role: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    // Custom extractor to avoid any-typed call from passport-jwt helpers
    const jwtExtractor = (req: import('express').Request): string | null => {
      const auth = req.headers?.authorization;
      if (auth && auth.startsWith('Bearer ')) {
        return auth.slice(7);
      }
      return null;
    };

    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    super({
      jwtFromRequest: jwtExtractor,
      ignoreExpiration: false,
      secretOrKey: jwtConstants.secret,
    });
  }

  validate(payload: JwtPayload) {
    return { userId: payload.sub, email: payload.username, role: payload.role };
  }
}
