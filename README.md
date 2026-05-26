# Aerospatial - Aerospace Photo Sharing App

A Node.js/Express application for sharing aerospace photography and information.

## Project Structure

```
tarea1/
├── server.js              # Express server configuration and API endpoints
├── package.json           # Project dependencies and scripts
├── .gitignore             # Git ignore rules
├── data.json              # Server-side data storage (auto-generated)
├── public/                # Static files and frontend
│   ├── index.html         # Main HTML page
│   ├── script.js          # Client-side JavaScript (uses API)
│   └── styles.css         # Styling
└── uploads/               # Image storage (auto-generated)
```

## Installation

1. Install dependencies:
```bash
npm install
```

## Running the Server

Start the server:
```bash
npm start
```

The server will run at `http://localhost:3000`

## Features

- ✈️ Upload up to 3 aerospace photos per post
- 📝 Add descriptions, aircraft/spacecraft model, location, and tags
- 🖼️ Display latest publications in a grid
- 📤 Drag-and-drop file upload support
- 🗄️ Server-side data persistence with JSON storage
- 📱 Responsive design

## API Endpoints

### GET /api/posts
Returns all posts

### POST /api/posts
Create a new post with file uploads
- Form fields: `model`, `type`, `location`, `description`, `tags`
- Files: `images` (up to 3 files)

### DELETE /api/posts/:id
Delete a post by ID

## Technologies

- **Backend**: Node.js, Express.js
- **File Uploads**: Multer
- **Frontend**: HTML, CSS, Vanilla JavaScript
- **Data Storage**: JSON file-based

## Notes

- Images are stored as base64 in data.json
- Maximum file size: 10MB
- Allowed image types: JPEG, PNG, GIF, WebP
