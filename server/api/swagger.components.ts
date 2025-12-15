// OpenAPI schema components for swagger-jsdoc
export const components = {
    components: {
        schemas: {
            MenuItem: {
                type: 'object',
                properties: {
                    name: { type: 'string' },
                    price: { type: 'number' },
                    image: { type: 'string' },
                    info: { type: 'string' }
                }
            },
            Restaurant: {
                type: 'object',
                properties: {
                    _id: { type: 'string' },
                    name: { type: 'string' },
                    address: { type: 'string' },
                    phone: { type: 'string' },
                    image: { type: 'string' },
                    info: { type: 'string' },
                    tags: { type: 'array', items: { type: 'string' } },
                    menu: { type: 'array', items: { $ref: '#/components/schemas/MenuItem' } }
                    ,
                    isActive: { type: 'boolean', description: '是否上架/營業（預設 true）', example: true, default: true },
                    locationGeo: {
                        type: 'object',
                        description: 'GeoJSON Point: { type: "Point", coordinates: [lon, lat] }',
                        properties: {
                            type: { type: 'string', enum: ['Point'] },
                            coordinates: {
                                type: 'array',
                                items: { type: 'number' },
                                description: '[lon, lat]'
                            }
                        }
                    }
                }
            }
            ,
            UserPublic: {
                type: 'object',
                properties: {
                    id: { type: 'string' },
                    name: { type: 'string' },
                    email: { type: 'string' },
                    role: { type: 'string', description: "'admin' or 'multi'" },
                    img: { type: 'string' },
                    address: { type: 'string' },
                    phone: { type: 'string' },
                    //: { type: 'string', nullable: true, enum: ['customer', 'delivery'] },
                    createdAt: { type: 'string', format: 'date-time' },
                    updatedAt: { type: 'string', format: 'date-time' }
                }
            },
            LoginRequest: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                    email: { type: 'string', format: 'email' },
                    password: { type: 'string' }
                }
            },
            LoginResponse: {
                type: 'object',
                properties: {
                    success: { type: 'boolean' },
                    token: { type: 'string' },
                    user: { $ref: '#/components/schemas/UserPublic' }
                }
            },
            RegisterRequest: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                    name: { type: 'string' },
                    email: { type: 'string', format: 'email' },
                    password: { type: 'string' }
                }
            }
            ,
            CartItem: {
                type: 'object',
                properties: {
                    restaurantId: { type: 'string' },
                    menuItemId: { type: 'string' },
                    name: { type: 'string' },
                    price: { type: 'number', description: 'price snapshot in cents' },
                    quantity: { type: 'integer' },
                    options: { type: 'object', additionalProperties: true }
                }
            },
            Cart: {
                type: 'object',
                properties: {
                    _id: { type: 'string' },
                    user: { type: 'string' },
                    items: { type: 'array', items: { $ref: '#/components/schemas/CartItem' } },
                    currency: { type: 'string' },
                    total: { type: 'number' },
                    status: { type: 'string' },
                    createdAt: { type: 'string', format: 'date-time' },
                    updatedAt: { type: 'string', format: 'date-time' }
                }
            },
            OrderItem: {
                type: 'object',
                properties: {
                    menuItemId: { type: 'string' },
                    name: { type: 'string' },
                    image: { type: 'string' },
                    info: { type: 'string' },
                    price: { type: 'number' },
                    quantity: { type: 'integer' },
                    restaurant: {
                        type: 'object',
                        properties: {
                            id: { type: 'string' },
                            name: { type: 'string' }
                            ,
                            phone: { type: 'string' },
                            address: { type: 'string' },
                            location: {
                                type: 'object',
                                properties: {
                                    lat: { type: 'number' },
                                    lng: { type: 'number' }
                                }
                            }
                        }
                    }
                }
            },
            Order: {
                type: 'object',
                properties: {
                    _id: { type: 'string' },
                    user: { type: 'string' },
                    // deliveryPerson 會回傳 populated 的 UserPublic（或 null）
                    deliveryPerson: { $ref: '#/components/schemas/UserPublic', nullable: true },
                    items: { type: 'array', items: { $ref: '#/components/schemas/OrderItem' } },
                    total: { type: 'number' },
                    deliveryFee: { type: 'number' },
                    arriveTime: { type: 'string', format: 'date-time' },
                    currency: { type: 'string', example: 'TWD' },
                    deliveryInfo: {
                        type: 'object',
                        properties: {
                            address: { type: 'string' },
                            contactName: { type: 'string' },
                            contactPhone: { type: 'string' },
                            note: { type: 'string' }
                        }
                    },
                    customerStatus: {
                        type: 'string',
                        enum: ['preparing', 'on_the_way', 'received', 'completed']
                    },
                    deliveryStatus: {
                        type: 'string',
                        enum: ['preparing', 'on_the_way', 'delivered', 'completed']
                    },
                    createdAt: { type: 'string', format: 'date-time' },
                    updatedAt: { type: 'string', format: 'date-time' }
                }
            },
            ChatMessage: {
                type: 'object',
                properties: {
                    _id: { type: 'string' },
                    order: { type: 'string' },
                    sender: { $ref: '#/components/schemas/UserPublic' },
                    senderRole: { type: 'string', enum: ['customer', 'delivery'] },
                    content: { type: 'string' },
                    timestamp: { type: 'string', format: 'date-time' }
                }
            },
            Review: {
                type: 'object',
                properties: {
                    _id: { type: 'string' },
                    user: {
                        oneOf: [
                            { type: 'string', description: 'User ID' },
                            {
                                type: 'object',
                                properties: {
                                    _id: { type: 'string' },
                                    name: { type: 'string' },
                                    img: { type: 'string' }
                                }
                            }
                        ]
                    },
                    restaurant: { type: 'string', description: 'Restaurant ID' },
                    rating: { type: 'number', minimum: 1, maximum: 5 },
                    content: { type: 'string' },
                    createdAt: { type: 'string', format: 'date-time' },
                    updatedAt: { type: 'string', format: 'date-time' }
                }
            }

        },

        securitySchemes: {
            BearerAuth: {
                type: 'http',
                scheme: 'bearer',
                bearerFormat: 'JWT'
            }
        },

        responses: {
            // 400
            BadRequest: {
                description: "缺少必要的欄位或格式錯誤",
                // content: {
                //     "application/json": {
                //         schema: {
                //             type: "object",
                //             properties: {
                //                 success: { type: "boolean", example: false },
                //                 error: { type: "string", example: "Bad Request" },
                //                 message: { type: "string", example: "Required fields are missing or invalid." },
                //             },
                //         },
                //     },
                // },
            },

            // 401
            Unauthorized: {
                description: "未登入或無效的 Token",
                // content: {
                //     "application/json": {
                //         schema: {
                //             type: "object",
                //             properties: {
                //                 success: { type: "boolean", example: false },
                //                 error: { type: "string", example: "Unauthorized" },
                //                 message: { type: "string", example: "Authentication required. Please log in." },
                //             },
                //         },
                //     },
                // },
            },
            LoginFailed: {
                description: "登入失敗，帳號不存在或密碼錯誤",
            },

            // 403
            Forbidden: {
                description: "權限不足",
                // content: {
                //     "application/json": {
                //         schema: {
                //             type: "object",
                //             properties: {
                //                 success: { type: "boolean", example: false },
                //                 error: { type: "string", example: "Forbidden" },
                //                 message: {
                //                     type: "string",
                //                     example: "You do not have permission to access this resource.",
                //                 },
                //             },
                //         },
                //     },
                // },
            },

            // 404
            NotFound: {
                description: "找不到指定資源",
                // content: {
                //     "application/json": {
                //         schema: {
                //             type: "object",
                //             properties: {
                //                 success: { type: "boolean", example: false },
                //                 error: { type: "string", example: "Not Found" },
                //                 message: { type: "string", example: "The requested resource was not found." },
                //             },
                //         },
                //     },
                // },
            },

            // 409
            Conflict: {
                description: "資源衝突，例如名稱重複",
                // content: {
                //     "application/json": {
                //         schema: {
                //             type: "object",
                //             properties: {
                //                 success: { type: "boolean", example: false },
                //                 error: { type: "string", example: "Conflict" },
                //                 message: { type: "string", example: "Resource conflict occurred." },
                //             },
                //         },
                //     },
                // },
            },

            // 418
            ImATeapot: {
                description: "伺服器拒絕沖泡咖啡，因為它是一個茶壺",
                content: {
                    "application/json": {
                        schema: {
                            type: "object",
                            properties: {
                                success: { type: "boolean", example: false },
                                error: { type: "string", example: "I'm a teapot" },
                                message: {
                                    type: "string",
                                    example: "The server refuses to brew coffee because it is a teapot.",
                                },
                            },
                        },
                    },
                },
            },

            // 422
            UnprocessableEntity: {
                description: "無效的參數",
                // content: {
                //     "application/json": {
                //         schema: {
                //             type: "object",
                //             properties: {
                //                 success: { type: "boolean", example: false },
                //                 error: { type: "string", example: "UnprocessableEntity" },
                //                 message: { type: "string", example: "The request parameters are invalid." },
                //             },
                //         },
                //     },
                // },
            },

            // 423
            Locked: {
                description: "資源被鎖定無法修改",
            },

            // 429
            TooManyRequests: {
                description: "請求過於頻繁",
                // content: {
                //     "application/json": {
                //         schema: {
                //             type: "object",
                //             properties: {
                //                 success: { type: "boolean", example: false },
                //                 error: { type: "string", example: "Too Many Requests" },
                //                 message: {
                //                     type: "string",
                //                     example: "You have sent too many requests. Please try again later.",
                //                 },
                //             },
                //         },
                //     },
                // },
            },

            // 500
            InternalServerError: {
                description: "伺服器內部錯誤",
                // content: {
                //     "application/json": {
                //         schema: {
                //             type: "object",
                //             properties: {
                //                 success: { type: "boolean", example: false },
                //                 error: { type: "string", example: "Internal Server Error" },
                //                 message: { type: "string", example: "An unexpected error occurred on the server." },
                //             },
                //         },
                //     },
                // },
            },

            // 503
            ServiceUnavailable: {
                description: "系統維護或暫時無法提供服務",
                // content: {
                //     "application/json": {
                //         schema: {
                //             type: "object",
                //             properties: {
                //                 success: { type: "boolean", example: false },
                //                 error: { type: "string", example: "Service Unavailable" },
                //                 message: {
                //                     type: "string",
                //                     example: "The service is temporarily unavailable. Please try again later.",
                //                 },
                //             },
                //         },
                //     },
                // },
            },
        },
    },
};
