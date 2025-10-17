import swaggerJSDoc from 'swagger-jsdoc'
import { components } from './swagger.components'

export default defineEventHandler(async (event) => {
    const host = event.node.req.headers.host || 'localhost'
    const scheme = event.node.req.headers['x-forwarded-proto'] || 'http'

    const options = {
        definition: {
            openapi: '3.0.0',
            info: {
                title: 'Eating at NTOU API',
                version: '1.0.0',
                description: 'API for Eating at NTOU'
            },
            servers: [
                { url: `${scheme}://${host}` }
            ],
            ...components
        },
        // files containing annotations as above
        apis: [
            './server/api/restaurants/*.get.ts',
            './server/api/restaurants/*.post.ts',
            './server/api/restaurants/*.put.ts',
            './server/api/restaurants/*.delete.ts',
            './server/api/auth/*.post.ts'
        ]
    }

    const openapiSpec = swaggerJSDoc(options)
    return openapiSpec
})
