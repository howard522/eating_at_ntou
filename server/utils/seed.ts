// server/utils/seed.ts
// usage: npx tsx server/utils/seed.ts
import mongoose from "mongoose";
import Restaurant from "../models/restaurant.model";
import dotenv from "dotenv";
import { geocodeAddress, sleep } from './nominatim';


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
        info: '這是一家提供美味便當的餐廳',
        tags: ['便當', '美食', '海大'],
        menu: [
            {
                name: '炸雞便當',
                price: 90,
                image: 'https://images.unsplash.com/photo-1606755962773-0e2a4f67a0af',
                info: '酥脆炸雞搭配白飯與配菜'
            },
            {
                name: '蔥爆牛肉飯',
                price: 100,
                image: 'https://images.unsplash.com/photo-1625944230943-19f66fddaf4b',
                info: '嫩煎牛肉搭配香蔥與白飯'
            }
        ]
    },
    {
        name: '浪花咖哩屋',
        address: '基隆市信一路168號',
        phone: '02-2425-3456',
        image: 'https://images.unsplash.com/photo-1625944529022-04e15bdfcc93',
        info: '這是一家提供咖哩飯的餐廳',
        tags: ['咖哩', '美食', '日式'],
        menu: [
            {
                name: '海鮮咖哩',
                price: 150,
                image: 'https://images.unsplash.com/photo-1551183053-bf91a1d81141',
                info: '新鮮海鮮搭配香濃咖哩'
            },
            {
                name: '豬排咖哩飯',
                price: 130,
                image: 'https://images.unsplash.com/photo-1617196034796-a6d83f8199a4',
                info: '酥脆豬排搭配香濃咖哩'
            }
        ]
    },
    {
        name: '星星漢堡店',
        address: '基隆市義一路88號',
        phone: '02-2456-7777',
        image: 'https://images.unsplash.com/photo-1550547660-d9450f859349',
        info: '這是一家提供美味漢堡的餐廳',
        tags: ['漢堡', '美食', '速食'],
        menu: [
            {
                name: '起司牛肉堡',
                price: 120,
                image: 'https://images.unsplash.com/photo-1550547660-d9450f859349',
                info: '濃郁起司搭配多汁牛肉'
            },
            {
                name: '雙層雞腿堡',
                price: 140,
                image: 'https://images.unsplash.com/photo-1606755962773-0e2a4f67a0af',
                info: '酥脆雞腿搭配新鮮生菜'
            }
        ]
    },
    {
        name: '小巷燒肉',
        address: '基隆市中山區中山路45號',
        phone: '02-2333-8888',
        image: 'https://images.unsplash.com/photo-1604908177522-7b3b9a8f7a1d',
        info: '炭火直烤，豪華燒肉套餐',
        tags: ['燒肉', '晚餐', '聚餐'],
        menu: [
            { name: '和牛套餐', price: 680, image: '', info: '和牛搭配多種副菜' },
            { name: '豬五花', price: 250, image: '', info: '薄切豬五花炭烤' }
        ]
    },
    {
        name: '晨光早餐店',
        address: '基隆市信一路22號',
        phone: '02-2344-1122',
        image: 'https://images.unsplash.com/photo-1497032628192-86f99bcd76bc',
        info: '平價早餐，營養又便利',
        tags: ['早餐', '美食'],
        menu: [
            { name: '蛋餅', price: 45, image: '', info: '傳統手工蛋餅' },
            { name: '吐司套餐', price: 70, image: '', info: '吐司配咖啡' }
        ]
    },
    {
        name: '港邊海鮮',
        address: '基隆市港西街10號',
        phone: '02-2466-9999',
        image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836',
        info: '新鮮直送海鮮料理',
        tags: ['海鮮', '合菜'],
        menu: [
            { name: '蒜蒸鮮蝦', price: 320, image: '', info: '蒜香鮮蝦' },
            { name: '三杯中卷', price: 280, image: '', info: '經典三杯作法' }
        ]
    },
    {
        name: '便當老王',
        address: '基隆市信一路200號',
        phone: '02-2422-2020',
        image: 'https://memeprod.sgp1.digitaloceanspaces.com/user-wtf/1755479553047.jpg',
        info: '平價便當、份量十足',
        tags: ['便當', '學生'],
        menu: [
            { name: '滷肉飯', price: 114514, image: '', info: '古早味滷肉' },
            { name: '雞腿便當', price: 1919810, image: '', info: '大雞腿配菜' }
        ]
    },
    {
        name: '涼麵屋',
        address: '基隆市仁愛區中正路50號',
        phone: '02-2477-1212',
        image: 'https://images.unsplash.com/photo-1600720161351-0a7f0b2b2d84',
        info: '涼爽開胃的涼麵專賣',
        tags: ['涼麵', '小吃'],
        menu: [
            { name: '芝麻涼麵', price: 70, image: '', info: '芝麻醬與小黃瓜' },
            { name: '酸辣涼麵', price: 75, image: '', info: '微酸微辣口感' }
        ]
    },
    {
        name: '茶飲手搖站',
        address: '基隆市和平路88號',
        phone: '02-2433-5566',
        image: 'https://images.unsplash.com/photo-1504754524776-8f4f37790ca0',
        info: '手搖飲料與輕食',
        tags: ['手搖飲', '下午茶'],
        menu: [
            { name: '珍珠奶茶', price: 60, image: '', info: 'Q彈珍珠與濃郁奶香' },
            { name: '檸檬青茶', price: 55, image: '', info: '清爽解渴' }
        ]
    },
    {
        name: '家常小炒',
        address: '基隆市信二路12號',
        phone: '02-2421-3344',
        image: 'https://images.unsplash.com/photo-1544025162-d76694265947',
        info: '平價熱炒，適合多人聚餐',
        tags: ['熱炒', '合菜'],
        menu: [
            { name: '三杯雞', price: 220, image: '', info: '經典三杯' },
            { name: '鹽酥蝦', price: 200, image: '', info: '酥脆下酒' }
        ]
    }
]

async function seed() {
    try {
        await mongoose.connect(MONGO_URI);
        await Restaurant.deleteMany({});

        // 嘗試對每筆資料做 geocode（best-effort），並在物件上加入 locationGeo
        for (const r of dummyRestaurants) {
            if (r.address) {
                try {
                    const coords = await geocodeAddress(r.address);
                    if (coords) {
                        const lon = coords.lon;
                        const lat = coords.lat;
                        // GeoJSON [lon, lat]
                        (r as any).locationGeo = { type: 'Point', coordinates: [lon, lat] };
                    }
                } catch (e) {
                    console.warn('geocode failed for', r.address, e);
                }
                // 節流：遵守 Nominatim 建議，每秒不超過 1 次，這裡等待 1.1 秒
                await sleep(1100);
            }
        }

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