import express from "express";
import axios from "axios";
import { Telegraf } from "telegraf";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const bot = new Telegraf(process.env.BOT_TOKEN);

// Command: /start
bot.start((ctx) =>
  ctx.reply("👋 Hello! Send me a city name or use /weather <city> to check the weather.")
);

// Command: /weather <city>
bot.command("weather", async (ctx) => {
  const input = ctx.message.text.split(" ").slice(1).join(" ");
  const city = input || "Chennai"; // default city

  try {
    const apiUrl = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${process.env.WEATHER_API_KEY}&units=metric`;
    const response = await axios.get(apiUrl);
    const data = response.data;

    const weatherInfo = `
🌍 *Weather in ${data.name}, ${data.sys.country}:*
🌡️ Temperature: ${data.main.temp}°C
🤒 Feels Like: ${data.main.feels_like}°C
🌤️ Condition: ${data.weather[0].description}
💧 Humidity: ${data.main.humidity}%
    `;

    ctx.replyWithMarkdown(weatherInfo);
  } catch (error) {
    ctx.reply("❌ City not found. Please try again.");
  }
});

// Default message handler
bot.on("text", (ctx) => {
  ctx.reply("Try /weather <city> to get weather details!");
});

// Express route for webhook
app.use(express.json());
app.get("/", (req, res) => res.send("Weather Bot is running!"));

// Start polling (for local dev)
if (process.env.NODE_ENV !== "production") {
  bot.launch();
}

// Export for Vercel serverless
export default app;
