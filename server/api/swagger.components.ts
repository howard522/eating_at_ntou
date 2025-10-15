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
                    location: {
                        type: 'object',
                        properties: {
                            lat: { type: 'number' },
                            lon: { type: 'number' }
                        }
                    }
                }
            }
        }
    }
}
