# YouTube Niche Finder

A powerful web application that analyzes YouTube trends to help creators discover profitable niches in the US and UK markets. Built with React, TypeScript, Vite, and Tailwind CSS.

## Features

- **Real-time YouTube Data**: Fetches live trending videos using YouTube Data API v3
- **Dual Market Analysis**: Supports US and UK markets
- **Opportunity Scoring**: Advanced algorithm to identify low-competition, high-potential niches
- **Category Filtering**: Filter by 10+ content categories
- **Velocity Tracking**: Monitor video performance trends over time
- **Channel Analysis**: Identify small creator opportunities (<10k subscribers)
- **Content Gap Detection**: AI-powered suggestions for untapped topics
- **Live Updates**: Auto-refresh every 5 minutes
- **Responsive Design**: Works on desktop and mobile

## Tech Stack

- **Frontend**: React 19, TypeScript, Vite
- **Styling**: Tailwind CSS 4
- **API**: YouTube Data API v3
- **Build**: Vite with single-file output
- **Testing**: Vitest, React Testing Library
- **Linting**: ESLint, Prettier

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- YouTube Data API key

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/BytesByBrave/YT-niche-finder-.git
   cd YT-niche-finder-
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory:
   ```
   VITE_YOUTUBE_API_KEY=your_api_key_here
   ```

4. Start the development server:
   ```bash
   npm start
   ```

5. Open [http://localhost:5173](http://localhost:5173) in your browser.

## Available Scripts

- `npm start` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint issues
- `npm run format` - Format code with Prettier
- `npm test` - Run tests
- `npm run test:ui` - Run tests with UI

## Project Structure

```
src/
├── components/          # Reusable UI components
├── hooks/              # Custom React hooks
├── services/           # API services and utilities
├── types/              # TypeScript type definitions
├── utils/              # Utility functions
├── test/               # Test setup and utilities
├── App.tsx             # Main application component
├── main.tsx            # Application entry point
├── index.css           # Global styles
└── vite-env.d.ts       # Vite environment types
```

## API Configuration

This app uses the YouTube Data API v3. To get an API key:

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the YouTube Data API v3
4. Create credentials (API key)
5. Add the key to your `.env` file

## Development

### Code Quality

The project uses ESLint and Prettier for code quality. Run `npm run lint` and `npm run format` before committing.

### Testing

Tests are written with Vitest and React Testing Library. Run `npm test` to execute the test suite.

### Building for Production

```bash
npm run build
```

This creates a single HTML file in the `dist/` directory that can be deployed anywhere.

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -am 'Add some feature'`
4. Push to the branch: `git push origin feature/your-feature`
5. Submit a pull request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Disclaimer

This tool is for educational and research purposes. Always comply with YouTube's Terms of Service and API usage policies.