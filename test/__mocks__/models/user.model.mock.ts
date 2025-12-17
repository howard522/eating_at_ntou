// test/__mocks__/models/user.model.mock.ts

import { vi } from "vitest";

const userMocks = vi.hoisted(() => ({
    find: vi.fn(),
    findById: vi.fn(),
    findByIdAndUpdate: vi.fn(),
    findOne: vi.fn(),
    userInstances: [] as any[],
    UserMock: undefined as any,
}));

export const mockUserModel = () => {
    vi.mock("@server/models/user.model", () => {
        class UserMock {
            constructor(data: any) {
                Object.assign(this, data);
                userMocks.userInstances.push(this);
            }

            password?: string;

            comparePassword = vi.fn((pwd: string) => this.password === pwd);

            save = vi.fn(async () => {
                // 模擬 pre-save hook 進行密碼雜湊
                if (this.password) {
                    this.password = `hashed_${this.password}`;
                }
            });

            static find = userMocks.find;
            static findById = userMocks.findById;
            static findByIdAndUpdate = userMocks.findByIdAndUpdate;
            static findOne = userMocks.findOne;
        }

        userMocks.UserMock = UserMock;

        return { default: UserMock };
    });
};

export { userMocks };
