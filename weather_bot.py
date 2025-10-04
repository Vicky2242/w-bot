import logging
from telegram import Update
from telegram.ext import Application, CommandHandler, ContextTypes
import requests
import os
from flask import Flask, request, Response

# Enable logging
logging.basicConfig(
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s", level=logging.INFO
)
logger = logging.getLogger(__name__)

# Get environment variables
TELEGRAM_TOKEN = os.getenv("TELEGRAM_TOKEN")
WEATHER_API_KEY = os.getenv("WEATHER_API_KEY")
WEATHER_API_URL = "http://api.openweathermap.org/data/2.5/weather"

app = Flask(__name__)

async def start(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    await update.message.reply_text(
        "Welcome to the Weather Bot! Use /weather <city> to get the current weather or /help for more info."
    )

async def help_command(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    await update.message.reply_text(
        "Use /weather <city> to get the current weather. Example: /weather London"
    )

async def weather(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    if not context.args:
        await update.message.reply_text("Please provide a city name. Example: /weather London")
        return

    city = " ".join(context.args)
    params = {
        "q": city,
        "appid": WEATHER_API_KEY,
        "units": "metric"
    }

    try:
        response = requests.get(WEATHER_API_URL, params=params)
        data = response.json()

        if data.get("cod") != 200:
            await update.message.reply_text(f"Error: {data.get('message', 'City not found')}")
            return

        weather = data["weather"][0]["description"]
        temp = data["main"]["temp"]
        feels_like = data["main"]["feels_like"]
        humidity = data["main"]["humidity"]
        
        message = (
            f"Weather in {city}:\n"
            f"Description: {weather}\n"
            f"Temperature: {temp}°C\n"
            f"Feels like: {feels_like}°C\n"
            f"Humidity: {humidity}%"
        )
        await update.message.reply_text(message)

    except Exception as e:
        logger.error(f"Error fetching weather data: {e}")
        await update.message.reply_text("Sorry, something went wrong. Please try again later.")

@app.route(f"/{TELEGRAM_TOKEN}", methods=["POST"])
async def webhook():
    if request.headers.get("content-type") != "application/json":
        return Response(status=403)
    
    json_data = request.get_json()
    update = Update.de_json(json_data, application.bot)
    await application.process_update(update)
    return Response(status=200)

def build_application():
    global application
    application = Application.builder().token(TELEGRAM_TOKEN).build()
    application.add_handler(CommandHandler("start", start))
    application.add_handler(CommandHandler("help", help_command))
    application.add_handler(CommandHandler("weather", weather))
    return application

if __name__ == "__main__":
    if not TELEGRAM_TOKEN or not WEATHER_API_KEY:
        logger.error("TELEGRAM_TOKEN or WEATHER_API_KEY not set")
        exit(1)
    
    build_application()
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 5000)))