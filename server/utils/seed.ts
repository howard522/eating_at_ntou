import mongoose from "mongoose";
import Restaurant from "../models/restaurant.model";
import dotenv from "dotenv";

dotenv.config();

const MONGO_URI = process.env.MONGO_URI as string;

if (!MONGO_URI) {
    throw new Error("Please define the MONGO_URI environment variable inside .env");
}

const dummyRestaurants = [
    {
        name: '海大港邊食堂',
        address: '基隆市中正區北寧路2號',
        phone: '02-2462-2192',
        image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5',
        menu: [
            {
                name: '炸雞便當',
                price: 90,
                image: 'https://images.unsplash.com/photo-1606755962773-0e2a4f67a0af'
            },
            {
                name: '蔥爆牛肉飯',
                price: 100,
                image: 'https://images.unsplash.com/photo-1625944230943-19f66fddaf4b'
            }
        ]
    },
    {
        name: '浪花咖哩屋',
        address: '基隆市信一路168號',
        phone: '02-2425-3456',
        image: 'https://images.unsplash.com/photo-1625944529022-04e15bdfcc93',
        menu: [
            {
                name: '海鮮咖哩',
                price: 150,
                image: 'https://images.unsplash.com/photo-1551183053-bf91a1d81141'
            },
            {
                name: '豬排咖哩飯',
                price: 130,
                image: 'https://images.unsplash.com/photo-1617196034796-a6d83f8199a4'
            }
        ]
    },
    {
        name: '星星漢堡店',
        address: '基隆市義一路88號',
        phone: '02-2456-7777',
        image: 'https://images.unsplash.com/photo-1550547660-d9450f859349',
        menu: [
            {
                name: '起司牛肉堡',
                price: 120,
                image: 'https://images.unsplash.com/photo-1550547660-d9450f859349'
            },
            {
                name: '雙層雞腿堡',
                price: 140,
                image: 'https://images.unsplash.com/photo-1606755962773-0e2a4f67a0af'
            }
        ]
    }
]

async function seed() {
    try {
        await mongoose.connect(MONGO_URI);
        await Restaurant.deleteMany({});
        await Restaurant.insertMany(dummyRestaurants);
        console.log('Database seeded successfully!');

    } catch (error) {
        console.error('Error seeding database:', error);

    }
    finally {
        await mongoose.disconnect();
    }
}

seed();