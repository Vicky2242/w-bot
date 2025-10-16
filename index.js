import express from "express";
import axios from "axios";
import { Telegraf } from "telegraf";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.json());

const bot = new Telegraf(process.env.BOT_TOKEN);

// Telegram Commands
bot.start((ctx) =>
  ctx.reply("👋 Hello! Send /weather <city> to check the weather.")
);

bot.command("weather", async (ctx) => {
  const input = ctx.message.text.split(" ").slice(1).join(" ");
  const city = input || "Chennai";

  try {
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${process.env.WEATHER_API_KEY}&units=metric`;
    const res = await axios.get(url);
    const data = res.data;

    const msg = `
🌍 *Weather in ${data.name}, ${data.sys.country}:*
🌡️ Temp: ${data.main.temp}°C
🤒 Feels Like: ${data.main.feels_like}°C
🌤️ Condition: ${data.weather[0].description}
💧 Humidity: ${data.main.humidity}%
    `;
    ctx.replyWithMarkdown(msg);
  } catch (err) {
    ctx.reply("❌ City not found. Please try again!");
  }
});

// Webhook endpoint for Telegram updates
app.post(`/${process.env.BOT_TOKEN}`, (req, res) => {
  bot.handleUpdate(req.body, res);
  res.status(200).send("OK");
});

// Simple home route
app.get("/", (req, res) => res.send("✅ Weather Bot is live!"));

// Only launch locally
if (process.env.NODE_ENV !== "production") {
  bot.launch();
}

export default app;
