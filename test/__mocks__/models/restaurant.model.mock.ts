// test/__mocks__/models/restaurant.model.mock.ts

import { createDocumentMock } from "@mocks/document.mock";
import { vi } from "vitest";

const restaurantMocks = vi.hoisted(() => ({
    aggregate: vi.fn(),
    find: vi.fn(),
    findById: vi.fn(),
    findByIdAndDelete: vi.fn(),
    findByIdAndUpdate: vi.fn(),
    restaurantInstances: [] as any[],
    RestaurantMock: undefined as any,
}));

export const mockRestaurantModel = () => {
    vi.mock("$models/restaurant.model", () => {
        class RestaurantMock {
            constructor(data: any) {
                data = createDocumentMock(data);
                Object.assign(this, data);
                restaurantMocks.restaurantInstances.push(this);
            }

            static aggregate = restaurantMocks.aggregate;
            static find = restaurantMocks.find;
            static findById = restaurantMocks.findById;
            static findByIdAndDelete = restaurantMocks.findByIdAndDelete;
            static findByIdAndUpdate = restaurantMocks.findByIdAndUpdate;
        }

        restaurantMocks.RestaurantMock = RestaurantMock;

        return { default: RestaurantMock };
    });
};

export { restaurantMocks };
