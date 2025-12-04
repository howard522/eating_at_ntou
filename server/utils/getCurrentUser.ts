// server/utils/getCurrentUser.ts

import type { IUser } from "@server/interfaces/user.interface";
import type { H3Event } from "h3";

export function getCurrentUser(event: H3Event): IUser {
    return event.context.user;
}
