# Libi - Music Listening Stats and Purchase Recommendations

Libi is a cross-platform mobile app built with React Native and Expo that helps music enthusiasts track their listening habits and discover new music to buy based on their preferences.

## Features

- 🎵 Track your music listening history using Last.fm API
- 📊 View detailed statistics about your favorite artists and tracks
- 💰 Get personalized recommendations for music to purchase
- 📱 Works on iOS, Android, and Web platforms

## Getting Started

### Prerequisites

- Node.js (version 12 or higher)
- npm or yarn
- Expo CLI

### Installation

1. Clone the repository
   ```
   git clone <repository-url>
   cd libi
   ```

2. Install dependencies
   ```
   npm install
   ```

3. Get a Last.fm API key
   - Create an account at [Last.fm](https://www.last.fm/)
   - Get an API key from [Last.fm API](https://www.last.fm/api/account/create)
   - Add your API key to `src/api/lastfm.js`

4. Run the app
   ```
   npm run start
   ```

## Usage

1. Enter your Last.fm username in the Profile tab
2. Browse your recent tracks in the Home tab
3. View your listening statistics in the Stats tab
4. Discover new music to buy in the Buy Music tab

## Tech Stack

- React Native
- Expo
- React Navigation
- React Native Paper
- Last.fm API
- AsyncStorage

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- [Last.fm](https://www.last.fm/) for providing the API
- [Expo](https://expo.dev/) for the amazing cross-platform framework