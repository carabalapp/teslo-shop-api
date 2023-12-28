import { UseGuards, applyDecorators } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { UserRoleGuard } from "../guards/user-role/user-role.guard";
import { RoleProtected } from "./role-protected.decorator";
import { ValidRoles } from "../interfaces";

export function Auth(...roles: ValidRoles[]) {
    return applyDecorators(
      UseGuards(AuthGuard(), UserRoleGuard ),
      RoleProtected(...roles)
    );
}


