#!/usr/bin/env tsx
import connectDB from './db'
import User from '../models/user.model'
import dotenv from 'dotenv'
import mongoose from 'mongoose'

dotenv.config()

const MONGO_URI = process.env.MONGO_URI as string

async function main() {
    const args = process.argv.slice(2)
    const dryRun = args.includes('--dry-run') || args.includes('-n')
    const confirm = args.includes('--yes') || args.includes('-y')

    await connectDB()
    console.log('Connected to DB')

    const filter = { role: 'user' }
    const count = await User.countDocuments(filter)
    console.log(`Found ${count} user(s) with role='user'`)

    if (count === 0) {
        console.log('No documents to update. Exiting.')
        process.exit(0)
    }

    if (dryRun) {
        console.log('Dry run mode. No changes will be made.')
        const docs = await User.find(filter).limit(10).lean()
        console.log('Sample documents:', docs.map(d => ({ id: d._id, email: d.email, role: d.role })))
        process.exit(0)
    }

    if (!confirm) {
        console.log('To perform the migration, re-run with --yes or -y')
        process.exit(0)
    }

    const res = await User.updateMany(filter, { $set: { role: 'multi' } })
    console.log(`Migration completed. Matched: ${res.matchedCount}, Modified: ${res.modifiedCount}`)
    process.exit(0)
}

main().catch(err => {
    console.error('Migration failed', err)
    process.exit(1)
})
