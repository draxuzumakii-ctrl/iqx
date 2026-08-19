const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const QuoteGenerator = require('qc-generator-whatsapp');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));
app.use('/outputs', express.static('outputs'));

// Konfigurasi multer untuk upload file
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Hanya file gambar yang diizinkan!'), false);
    }
  }
});

// Route untuk generate gambar
app.post('/api/generate', upload.fields([
  { name: 'avatar1', maxCount: 1 },
  { name: 'avatar2', maxCount: 1 },
  { name: 'media1', maxCount: 1 },
  { name: 'media2', maxCount: 1 }
]), async (req, res) => {
  try {
    const data = req.body;
    const files = req.files || {};

    // Build messages array
    const messages = [];

    // Message 1
    const message1 = {
      avatar: data.msg1Avatar === 'true',
      from: {
        id: 2,
        name: data.msg1Name || 'User 1',
        photo: data.msg1Avatar === 'true' ? {} : (files.avatar1 ? { buffer: files.avatar1[0].buffer } : {}),
        number: data.msg1Number || '',
        time: data.msg1Time || ''
      },
      text: data.msg1Text || ''
    };

    // Add media if exists
    if (files.media1 && files.media1[0]) {
      message1.media = { buffer: files.media1[0].buffer };
    }

    // Add reply if exists
    if (data.msg1ReplyName || data.msg1ReplyText) {
      message1.replyMessage = {
        chatId: 1,
        name: data.msg1ReplyName || '',
        text: data.msg1ReplyText || '',
        number: ''
      };
    }

    messages.push(message1);

    // Message 2
    const message2 = {
      avatar: true,
      from: {
        id: 3,
        name: data.msg2Name || 'User 2',
        photo: files.avatar2 ? { buffer: files.avatar2[0].buffer } : {},
        number: data.msg2Number || '',
        time: data.msg2Time || ''
      },
      text: data.msg2Text || ''
    };

    // Add media if exists
    if (files.media2 && files.media2[0]) {
      message2.media = { buffer: files.media2[0].buffer };
    }

    messages.push(message2);

    // Build parameters
    const params = {
      type: data.outputType || 'image',
      backgroundColor: data.backgroundColor || '#1b2226',
      width: parseInt(data.width) || 512,
      scale: parseInt(data.scale) || 2,
      messages: messages
    };

    // Generate image
    const result = await QuoteGenerator(params);

    // Create outputs directory if not exists
    const outputDir = './outputs';
    await fs.mkdir(outputDir, { recursive: true });

    // Save image
    const filename = `whatsapp-chat-${Date.now()}.png`;
    const filepath = path.join(outputDir, filename);
    await fs.writeFile(filepath, result.image);

    // Send response
    res.json({
      success: true,
      imageUrl: `/outputs/${filename}`,
      filename: filename
    });

  } catch (error) {
    console.error('Error generating image:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Route untuk download
app.get('/api/download/:filename', async (req, res) => {
  try {
    const filepath = path.join('./outputs', req.params.filename);
    res.download(filepath);
  } catch (error) {
    res.status(404).json({ error: 'File tidak ditemukan' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server berjalan di http://localhost:${PORT}`);
});
