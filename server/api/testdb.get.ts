import connectDB from '@server/utils/db'

export default defineEventHandler(async () => {
    await connectDB()
    return { message: '資料庫連線成功' }
})
