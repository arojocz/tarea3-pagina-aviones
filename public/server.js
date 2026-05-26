const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Configure multer for file uploads
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueFilename = Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname);
    cb(null, uniqueFilename);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images are allowed.'));
    }
  }
});

// Data storage file
const dataFile = path.join(__dirname, 'data.json');

function readPosts() {
  try {
    if (fs.existsSync(dataFile)) {
      const data = fs.readFileSync(dataFile, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error reading posts:', error);
  }
  return [];
}

function savePosts(posts) {
  try {
    fs.writeFileSync(dataFile, JSON.stringify(posts, null, 2), 'utf8');
  } catch (error) {
    console.error('Error saving posts:', error);
  }
}

function fileToBase64(filePath) {
  try {
    const fileContent = fs.readFileSync(filePath);
    return 'data:image/jpeg;base64,' + fileContent.toString('base64');
  } catch (error) {
    console.error('Error converting file to base64:', error);
    return null;
  }
}

// API Routes

// Get all posts
app.get('/api/posts', (req, res) => {
  const posts = readPosts();
  res.json(posts);
});

// Create new post with file uploads
app.post('/api/posts', upload.array('images', 3), (req, res) => {
  try {
    const { model, type, location, description, tags } = req.body;

    // Convert uploaded files to base64
    const images = [];
    if (req.files && req.files.length > 0) {
      req.files.forEach(file => {
        const base64 = fileToBase64(file.path);
        if (base64) {
          images.push(base64);
        }
      });
    }

    const newPost = {
      id: Date.now().toString(),
      model,
      type,
      location,
      description,
      tags: tags ? tags.split(',').map(t => t.trim()) : [],
      images,
      createdAt: new Date().toISOString()
    };

    const posts = readPosts();
    posts.push(newPost);
    savePosts(posts);

    // Clean up uploaded temp files
    if (req.files) {
      req.files.forEach(file => {
        fs.unlink(file.path, (err) => {
          if (err) console.error('Error deleting temp file:', err);
        });
      });
    }

    res.status(201).json(newPost);
  } catch (error) {
    console.error('Error creating post:', error);
    res.status(500).json({ error: 'Failed to create post' });
  }
});

// Delete post
app.delete('/api/posts/:id', (req, res) => {
  try {
    const posts = readPosts();
    const updatedPosts = posts.filter(post => post.id !== req.params.id);
    savePosts(updatedPosts);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting post:', error);
    res.status(500).json({ error: 'Failed to delete post' });
  }
});

// Serve public files
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`✈️  Aerospatial server running at http://localhost:${PORT}`);
});
