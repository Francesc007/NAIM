const base = require('./app.json');

module.exports = () => ({
  expo: {
    ...base.expo,
    extra: {
      EXPO_PUBLIC_GEMINI_API_KEY: process.env.EXPO_PUBLIC_GEMINI_API_KEY,
      EXPO_PUBLIC_WEATHER_API_KEY: process.env.EXPO_PUBLIC_WEATHER_API_KEY,
    },
  },
});
