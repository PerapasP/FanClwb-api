import { Injectable, type ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    // เรียก JWT strategy ตามปกติ
    return super.canActivate(context);
  }

  handleRequest<TUser>(_err: Error | null, user: TUser | false): TUser | null {
    // ถ้าไม่มี token หรือ token ไม่ valid → return null แทนที่จะ throw 401
    if (!user) {
      return null as TUser;
    }

    return user;
  }
}
