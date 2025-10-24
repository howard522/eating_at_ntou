// server/utils/seed.ts
// usage: npx tsx server/utils/seed.ts
import mongoose from "mongoose";
import Restaurant from "../models/restaurant.model";
import dotenv from "dotenv";
import { geocodeAddress, sleep } from "./nominatim";

dotenv.config();

const MONGO_URI = process.env.MONGO_URI as string;

if (!MONGO_URI) {
  throw new Error(
    "Please define the MONGO_URI environment variable inside .env"
  );
}

const dummyRestaurants = [
  {
    name: "海大港邊食堂",
    address: "基隆市中正區北寧路2號",
    phone: "02-2462-2192",
    image: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5",
    info: "這是一家提供美味便當的餐廳",
    tags: ["便當", "美食", "海大"],
    menu: [
      {
        name: "炸雞便當",
        price: 90,
        image: "https://images.unsplash.com/photo-1606755962773-0e2a4f67a0af",
        info: "酥脆炸雞搭配白飯與配菜",
      },
      {
        name: "蔥爆牛肉飯",
        price: 100,
        image: "https://images.unsplash.com/photo-1625944230943-19f66fddaf4b",
        info: "嫩煎牛肉搭配香蔥與白飯",
      },
    ],
  },
  {
    name: "浪花咖哩屋",
    address: "基隆市信一路168號",
    phone: "02-2425-3456",
    image: "https://images.unsplash.com/photo-1625944529022-04e15bdfcc93",
    info: "這是一家提供咖哩飯的餐廳",
    tags: ["咖哩", "美食", "日式"],
    menu: [
      {
        name: "海鮮咖哩",
        price: 150,
        image: "https://images.unsplash.com/photo-1551183053-bf91a1d81141",
        info: "新鮮海鮮搭配香濃咖哩",
      },
      {
        name: "豬排咖哩飯",
        price: 130,
        image: "https://images.unsplash.com/photo-1617196034796-a6d83f8199a4",
        info: "酥脆豬排搭配香濃咖哩",
      },
    ],
  },
  {
    name: "星星漢堡店",
    address: "基隆市義一路88號",
    phone: "02-2456-7777",
    image: "https://images.unsplash.com/photo-1550547660-d9450f859349",
    info: "這是一家提供美味漢堡的餐廳",
    tags: ["漢堡", "美食", "速食"],
    menu: [
      {
        name: "起司牛肉堡",
        price: 120,
        image: "https://images.unsplash.com/photo-1550547660-d9450f859349",
        info: "濃郁起司搭配多汁牛肉",
      },
      {
        name: "雙層雞腿堡",
        price: 140,
        image: "https://images.unsplash.com/photo-1606755962773-0e2a4f67a0af",
        info: "酥脆雞腿搭配新鮮生菜",
      },
    ],
  },
  {
    name: "小巷燒肉",
    address: "基隆市中山區中山路45號",
    phone: "02-2333-8888",
    image: "https://images.unsplash.com/photo-1604908177522-7b3b9a8f7a1d",
    info: "炭火直烤，豪華燒肉套餐",
    tags: ["燒肉", "晚餐", "聚餐"],
    menu: [
      { name: "和牛套餐", price: 680, image: "", info: "和牛搭配多種副菜" },
      { name: "豬五花", price: 250, image: "", info: "薄切豬五花炭烤" },
    ],
  },
  {
    name: "晨光早餐店",
    address: "基隆市信一路22號",
    phone: "02-2344-1122",
    image: "https://images.unsplash.com/photo-1497032628192-86f99bcd76bc",
    info: "平價早餐，營養又便利",
    tags: ["早餐", "美食"],
    menu: [
      { name: "蛋餅", price: 45, image: "", info: "傳統手工蛋餅" },
      { name: "吐司套餐", price: 70, image: "", info: "吐司配咖啡" },
    ],
  },
  {
    name: "港邊海鮮",
    address: "基隆市港西街10號",
    phone: "02-2466-9999",
    image: "https://images.unsplash.com/photo-1504674900247-0877df9cc836",
    info: "新鮮直送海鮮料理",
    tags: ["海鮮", "合菜"],
    menu: [
      { name: "蒜蒸鮮蝦", price: 320, image: "", info: "蒜香鮮蝦" },
      { name: "三杯中卷", price: 280, image: "", info: "經典三杯作法" },
    ],
  },
  {
    name: "便當老王",
    address: "基隆市信一路200號",
    phone: "02-2422-2020",
    image:
      "https://memeprod.sgp1.digitaloceanspaces.com/user-wtf/1755479553047.jpg",
    info: "昏睡レイプ!野獣と化した先輩",
    tags: ["便當", "先輩"],
    menu: [
      { name: "24歲，是個學生", price: 114514, image: "", info: "古早味滷肉" },
      { name: "雞腿便當", price: 1919810, image: "", info: "大雞腿配菜" },
    ],
  },
  {
    name: "涼麵屋",
    address: "基隆市仁愛區中正路50號",
    phone: "02-2477-1212",
    image: "https://images.unsplash.com/photo-1600720161351-0a7f0b2b2d84",
    info: "涼爽開胃的涼麵專賣",
    tags: ["涼麵", "小吃"],
    menu: [
      { name: "芝麻涼麵", price: 70, image: "", info: "芝麻醬與小黃瓜" },
      { name: "酸辣涼麵", price: 75, image: "", info: "微酸微辣口感" },
    ],
  },
  {
    name: "茶飲手搖站",
    address: "基隆市和平路88號",
    phone: "02-2433-5566",
    image: "https://images.unsplash.com/photo-1504754524776-8f4f37790ca0",
    info: "手搖飲料與輕食",
    tags: ["手搖飲", "下午茶"],
    menu: [
      { name: "珍珠奶茶", price: 60, image: "", info: "Q彈珍珠與濃郁奶香" },
      { name: "檸檬青茶", price: 55, image: "", info: "清爽解渴" },
    ],
  },
  {
    name: "傑哥加長菜",
    address: "基隆市中正區新豐街482號2樓",
    phone: "02-2462-2192",
    image:
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQU39c4jPB0WcphRQDuMQjjzuuLHCLwmIJxxfGUzgbF8zV-POo98S4R8zYEi-ONFIhe_8k&usqp=CAU",
    info: "適合多人",
    tags: ["熱炒", "合菜"],
    menu: [
      {
        name: "三杯雞",
        price: 220,
        image:
          "https://v3-statics.mirrormedia.mg/images/8a636d0a-cafe-45f9-b551-b6be25ca6922-w1600.webP",
        info: "三杯大雞雞",
      },
      {
        name: "讓我看看",
        price: 100,
        image:
          "data:image/jpeg;base64,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",
        info: "讓傑哥看看",
      },
    ],
  },
  {
    name: "傑哥加長菜",
    address: "基隆市中正區新豐街482號2樓",
    phone: "",
    image:
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQU39c4jPB0WcphRQDuMQjjzuuLHCLwmIJxxfGUzgbF8zV-POo98S4R8zYEi-ONFIhe_8k&usqp=CAU",
    info: "平價熱炒，適合多人聚餐",
    tags: ["熱炒", "合菜"],
    menu: [
      {
        name: "三杯雞",
        price: 220,
        image:
          "https://v3-statics.mirrormedia.mg/images/8a636d0a-cafe-45f9-b551-b6be25ca6922-w1600.webP",
        info: "經典三杯",
      },
      { name: "鹽酥蝦", price: 200, image: "", info: "酥脆下酒" },
    ],
  },
  {
    name: "傑哥加長菜",
    address: "基隆市中正區新豐街482號2樓",
    phone: "02-2462-2192",
    image:
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQU39c4jPB0WcphRQDuMQjjzuuLHCLwmIJxxfGUzgbF8zV-POo98S4R8zYEi-ONFIhe_8k&usqp=CAU",
    info: "平價熱炒，適合多人聚餐",
    tags: ["熱炒", "合菜"],
    menu: [
      {
        name: "三杯雞",
        price: 220,
        image:
          "https://v3-statics.mirrormedia.mg/images/8a636d0a-cafe-45f9-b551-b6be25ca6922-w1600.webP",
        info: "經典三杯",
      },
      { name: "鹽酥蝦", price: 200, image: "", info: "酥脆下酒" },
    ],
  },
  {
    name: "傑哥加長菜",
    address: "基隆市中正區新豐街482號2樓",
    phone: "02-2462-2192",
    image:
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQU39c4jPB0WcphRQDuMQjjzuuLHCLwmIJxxfGUzgbF8zV-POo98S4R8zYEi-ONFIhe_8k&usqp=CAU",
    info: "平價熱炒，適合多人聚餐",
    tags: ["熱炒", "合菜"],
    menu: [
      {
        name: "三杯雞",
        price: 220,
        image:
          "https://v3-statics.mirrormedia.mg/images/8a636d0a-cafe-45f9-b551-b6be25ca6922-w1600.webP",
        info: "經典三杯",
      },
      { name: "鹽酥蝦", price: 200, image: "", info: "酥脆下酒" },
    ],
  },
  {
    name: "傑哥加長加長加長加長加長加長加長加長加長加長加長加長加長加長加長加長加長加長加長加長加長加長加長加長加長加長加長加長加長加長加長加長加長加長加長加長加長加長加長加長加長加長加長加長加長加長加長加長加長加長加長加長加長加長加長加長加長加長加長加長加長加長加長加長加長加長加長加長加長加長加長加長加長加長加長加長加長加長加長加長加長加長加長加長加長加長加長加長加長加長加長加長加長加長加長加長加長加長加長加長加長加長加長加長加長加長加長加長加長加長加長加長加長加長加長加長加長加長加長加長加長加長加長加長加長加長加長加長加長加長加長加長加長加長加長加長加長加長加長加長加長加長加長加長加長加長加長加長加長加長加長加長加長加長加長加長加長加長加長加長加長加長加長加長加長加長加長加長加長加長加長加長加長加長加長加長加長加長加長加長加長加長加長加長加長加長加長加長加長加長加長加長加長加長加長加長加長加長菜",
    address: "基隆市中正區新豐街482號2樓",
    phone: "02-2462-2192",
    image:
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQU39c4jPB0WcphRQDuMQjjzuuLHCLwmIJxxfGUzgbF8zV-POo98S4R8zYEi-ONFIhe_8k&usqp=CAU",
    info: "適合多人",
    tags: ["熱炒", "合菜"],
    menu: [
      {
        name: "三杯雞",
        price: 220,
        image:
          "https://v3-statics.mirrormedia.mg/images/8a636d0a-cafe-45f9-b551-b6be25ca6922-w1600.webP",
        info: "三杯大雞雞",
      },
      {
        name: "讓我看看",
        price: 100,
        image:
          "data:image/jpeg;base64,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",
        info: "讓傑哥看看",
      },
    ],
  },
  {
    name: "傑哥加長加長菜",
    address: "基隆市中正區新豐街482號2樓",
    phone: "02-2462-2192",
    image: "",
    info: "適合多人",
    tags: ["熱炒", "合菜"],
    menu: [
      {
        name: "三杯雞",
        price: 220,
        image:
          "https://v3-statics.mirrormedia.mg/images/8a636d0a-cafe-45f9-b551-b6be25ca6922-w1600.webP",
        info: "三杯大雞雞",
      },
      {
        name: "讓我看看",
        price: 100,
        image:
          "data:image/jpeg;base64,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",
        info: "讓傑哥看看",
      },
    ],
  },
  {
    name: "傑哥加長菜",
    address: "基隆市中正區新豐街482號2樓",
    phone: "02-2462-2192",
    image:
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQU39c4jPB0WcphRQDuMQjjzuuLHCLwmIJxxfGUzgbF8zV-POo98S4R8zYEi-ONFIhe_8k&usqp=CAU",
    info: "適合超超超超超超超超超超超超超超超超超超超超超超超超超超超超超超超超超超超超超超超超超超超超超超超超超超超超超超超超超超超超超超超超超超超超超超超超超超超超超超超超超超超超超超超超超超超超超超超超超超超超超超超超超超超超超超超超超超超超超超超超超超超超超超超超超超超超超超超超超超超超超超超超超超超超超超超超超超超超超超超超超超超超超超超超超超超超超超超超超超超超超超超超超超超超多人",
    tags: ["熱炒", "合菜"],
    menu: [
      {
        name: "三杯雞",
        price: 220,
        image:
          "https://v3-statics.mirrormedia.mg/images/8a636d0a-cafe-45f9-b551-b6be25ca6922-w1600.webP",
        info: "經典三杯",
      },
      { name: "鹽酥蝦", price: 200, image: "", info: "酥脆下酒" },
    ],
  },
  {
    name: "傑哥加長菜",
    address: "基隆市中正區新豐街482號2樓",
    phone: "02-2462-2192",
    image:
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQU39c4jPB0WcphRQDuMQjjzuuLHCLwmIJxxfGUzgbF8zV-POo98S4R8zYEi-ONFIhe_8k&usqp=CAU",
    info: "平價熱炒，適合多人聚餐",
    tags: ["熱炒", "合菜"],
    menu: [
      {
        name: "三杯雞",
        price: 20000000,
        image:
          "https://v3-statics.mirrormedia.mg/images/8a636d0a-cafe-45f9-b551-b6be25ca6922-w1600.webP",
        info: "經典三杯大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大大雞雞",
      },
      { name: "鹽酥蝦", price: 200, image: "", info: "酥脆下酒" },
      {
        name: "讓我看看",
        price: 100,
        image:
          "data:image/jpeg;base64,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",
        info: "讓傑哥看看",
      },
      {
        name: "傑哥加長菜",
        address: "基隆市中正區新豐街482號2樓",
        phone: "02-2462-2192",
        image:
          "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQU39c4jPB0WcphRQDuMQjjzuuLHCLwmIJxxfGUzgbF8zV-POo98S4R8zYEi-ONFIhe_8k&usqp=CAU",
        info: "平價熱炒，適合多人聚餐",
        tags: ["熱炒", "合菜"],
        menu: [
          {
            name: "三杯雞",
            price: 220,
            image:
              "https://v3-statics.mirrormedia.mg/images/8a636d0a-cafe-45f9-b551-b6be25ca6922-w1600.webP",
            info: "經典三杯",
          },
          { name: "鹽酥蝦", price: 200, image: "", info: "酥脆下酒" },
          {
            name: "讓我看看",
            price: 100,
            image:
              "data:image/jpeg;base64,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",
            info: "讓傑哥看看看看看看",
          },
        ],
      },
    ],
  },
  // 一些可能在前端不好呈現的餐廳(超長名字, 價格異常高, 等等)
];

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
            (r as any).locationGeo = { type: "Point", coordinates: [lon, lat] };
          }
        } catch (e) {
          console.warn("geocode failed for", r.address, e);
        }
        // 節流：遵守 Nominatim 建議，每秒不超過 1 次，這裡等待 1.1 秒
        await sleep(1100);
      }
    }

    await Restaurant.insertMany(dummyRestaurants);
    console.log("Database seeded successfully!");
  } catch (error) {
    console.error("Error seeding database:", error);
  } finally {
    await mongoose.disconnect();
  }
}

seed();
