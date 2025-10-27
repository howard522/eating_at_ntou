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
        // Only include files whose names indicate HTTP methods (get/post/put/delete/patch)
        apis: [
            './server/api/**/*.get.ts',
            './server/api/**/*.post.ts',
            './server/api/**/*.put.ts',
            './server/api/**/*.delete.ts',
            './server/api/**/*.patch.ts'
        ]
    }

    const openapiSpec = swaggerJSDoc(options)
    return openapiSpec
})
