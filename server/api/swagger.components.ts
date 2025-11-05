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
                        }
                    }
                }
            },
            Order: {
                type: 'object',
                properties: {
                    _id: { type: 'string' },
                    user: { type: 'string' },
                    deliveryPerson: { type: 'string', nullable: true },
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
            }

        },

        securitySchemes: {
            BearerAuth: {
                type: 'http',
                scheme: 'bearer',
                bearerFormat: 'JWT'
            }
        }
    }
}
