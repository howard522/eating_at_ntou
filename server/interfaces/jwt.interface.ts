import type { UserRole } from "@server/interfaces/user.interface";

export interface JwtPayload {
    id: string;
    role?: UserRole;
    iat?: number;
    exp?: number;
}
