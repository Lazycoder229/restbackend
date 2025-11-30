import { Injectable } from "../decorators/injectable.decorator";
import {
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from "../common/interfaces";
import { SecurityService } from "./security.service";

/**
 * Built-in JWT Authentication Guard
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private securityService: SecurityService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.getRequest();
    const authHeader = request.headers["authorization"];

    if (!authHeader) {
      throw new UnauthorizedException("No authorization token provided");
    }

    try {
      // Extract token from "Bearer <token>"
      const token = authHeader.startsWith("Bearer ")
        ? authHeader.substring(7)
        : authHeader;

      // Verify token
      const payload = this.securityService.verifyToken(token);

      // Attach user to request
      request.user = payload;

      return true;
    } catch (error) {
      throw new UnauthorizedException("Invalid or expired token");
    }
  }
}
