// usage npx tsx server/utils/createTestUser.ts [email] [password] [role]
import connectDB from '@server/utils/db'
import User from '@server/models/user.model'
import dotenv from 'dotenv'
import mongoose from 'mongoose'

dotenv.config()

const MONGO_URI = process.env.MONGO_URI as string

async function main() {
    await connectDB()
    const email = process.env.TEST_USER_EMAIL || process.argv[2] || 'test@example.com'
    const password = process.env.TEST_USER_PASSWORD || process.argv[3] || 'secret123'
    const role = process.env.TEST_USER_ROLE || process.argv[4] || 'admin'

    const existing = await User.findOne({ email })
    if (existing) {
        console.log('User already exists:', email)
        process.exit(0)
    }

    const u = new User({ name: 'test', email, password, role })
    await u.save()
    console.log('Created test user:', { email, role })
    process.exit(0)
}

main().catch((err) => {
    console.error(err)
    process.exit(1)
})
