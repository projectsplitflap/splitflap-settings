# Splitflap Display Controller

A web-based controller for mechanical split-flap displays built with the Chainlink electronics system.

## 🚀 Features

- **Multiple Display Modes**: Manual text, automatic time display, flight tracking
- **Remote Control**: Firebase integration for worldwide remote access
- **User-Friendly**: No coding required - works with any modern web browser

## 🔗 Quick Start

1. **Access the Controller**
2. **Start Controlling**: Send text, display time, or track flights!

## 📱 Setup Your Splitflap Display

### Finding Your Display

- Try `http://splitflap.local` (works if mDNS is enabled)
- Check your router's admin panel for the device IP
- Use the setup portal to get the exact address

## 🔧 Firmware Requirements

Your ESP32 must be running firmware with WiFi and HTTP server support. The firmware should provide these API endpoints:

- `GET /api/status` - Device status and module count
- `POST /api/text` - Set display text
- `POST /api/home` - Home all modules
- `POST /api/calibrate` - Calibrate modules

## 🌐 Remote Control 

Uses Firebase integration to control your display from anywhere:

## 🛠️ For Developers

This project consists of:

- `index.html` - Main web interface
- `app.js` - JavaScript logic and API communication
- Firebase integration for remote control
- Responsive design that works on mobile and desktop

## 📄 License

This project is open source. Feel free to modify and share!

## 🤝 Contributing

Found a bug or have a feature request? Please open an issue or submit a pull request.

---

**Note**: This controller is designed to work with splitflap displays built using the [Splitflap project](https://github.com/scottbez1/splitflap) hardware and electronics.
