# Solid Drive

A modern file management interface for Solid Pods, similar to Google Drive or OneDrive. This application provides a comprehensive drive interface for managing documents within a Solid Pod, including sharing capabilities and permission management.

## Features

- **File Management**: Upload, download, delete, and organize files and folders
- **Sharing & Permissions**: Share resources with other users and manage access permissions
- **Search**: Search through files and folders
- **Multiple View Modes**: Grid and list view options
- **Breadcrumb Navigation**: Easy navigation through folder structure
- **Solid TR Compliance**: Built according to current Solid Technical Reports
- **Modern UI**: Clean, responsive interface built with Next.js and Tailwind CSS

## Prerequisites

- Node.js 18+ 
- npm or yarn
- A Solid Pod (you can get one from [solidproject.org](https://solidproject.org/users/get-a-pod))

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd solid-drive
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

Edit `.env.local` with your Solid server configuration:
```env
NEXT_PUBLIC_SOLID_SERVER_URL=http://localhost:3001
NEXT_PUBLIC_SOLID_CLIENT_ID=http://localhost:3000
NEXT_PUBLIC_SOLID_REDIRECT_URL=http://localhost:3000
```

## Development

### Starting the Development Server

1. Start the Next.js development server:
```bash
npm run dev
```

2. (Optional) Start a local Community Solid Server for testing:
```bash
npx @solid/community-server --port 3001
```

The application will be available at `http://localhost:3000`.

### Running Tests

The project includes comprehensive end-to-end tests using Playwright:

```bash
# Install Playwright browsers
npx playwright install

# Run all tests
npm run test

# Run tests with UI
npm run test:ui

# Run tests in headed mode
npm run test:headed

# Run tests in debug mode
npm run test:debug
```

## Usage

### Authentication

1. Open the application in your browser
2. Click "Sign in to your Solid Pod"
3. Enter your Solid Pod URL or use a provider like Inrupt
4. Complete the authentication process

### File Management

- **Upload Files**: Click the "Upload" button or drag and drop files
- **Create Folders**: Click "New Folder" and enter a name
- **Navigate**: Use breadcrumbs or double-click folders
- **Search**: Use the search bar to find files and folders
- **View Modes**: Switch between grid and list views

### Sharing and Permissions

1. Right-click on a file or folder
2. Select "Share"
3. Enter the Web ID or email of the person you want to share with
4. Choose permissions (Read, Write, Control)
5. Click "Share"

### Keyboard Shortcuts

- `Ctrl/Cmd + A`: Select all files
- `Delete`: Delete selected files
- `Enter`: Open selected file/folder
- `Escape`: Clear selection

## Architecture

### Components

- **DriveInterface**: Main drive interface component
- **ResourceItem**: Individual file/folder display
- **Breadcrumb**: Navigation breadcrumb
- **ShareDialog**: Sharing and permission management
- **SolidClient**: Solid protocol client implementation

### Solid Integration

The application uses the following Solid libraries:
- `@inrupt/solid-client`: Core Solid client functionality
- `@inrupt/solid-client-authn-browser`: Browser authentication
- `@inrupt/vocab-common`: Common Solid vocabularies

### Testing Strategy

- **Unit Tests**: Component and utility function tests
- **Integration Tests**: Solid client integration tests
- **E2E Tests**: Full user workflow tests using Playwright
- **Solid Server**: Community Solid Server for testing

## Solid Compliance

This application follows the current Solid Technical Reports:

- **Solid Protocol**: HTTP-based protocol for accessing data
- **Solid OIDC**: OpenID Connect for authentication
- **Solid Notifications**: Real-time updates
- **Solid Access Control**: Permission management

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## Testing with Community Solid Server

For local development and testing, you can use the Community Solid Server:

```bash
# Install the server
npm install -g @solid/community-server

# Start the server
solid start --port 3001

# Or use npx
npx @solid/community-server --port 3001
```

The server will be available at `http://localhost:3001`.

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_SOLID_SERVER_URL` | Solid server URL | `http://localhost:3001` |
| `NEXT_PUBLIC_SOLID_CLIENT_ID` | OAuth client ID | `http://localhost:3000` |
| `NEXT_PUBLIC_SOLID_REDIRECT_URL` | OAuth redirect URL | `http://localhost:3000` |

## Troubleshooting

### Common Issues

1. **Authentication fails**: Check your Solid Pod URL and ensure it supports OIDC
2. **File upload fails**: Verify your Pod has write permissions
3. **Sharing doesn't work**: Ensure the target user has a valid Web ID

### Debug Mode

Enable debug logging by setting:
```env
NEXT_PUBLIC_DEBUG=true
```

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- [Solid Project](https://solidproject.org/) for the Solid specifications
- [Inrupt](https://inrupt.com/) for the Solid client libraries
- [Community Solid Server](https://github.com/solid/community-server) for the test server
