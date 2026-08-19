const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const QuoteGenerator = require('qc-generator-whatsapp');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Konfigurasi multer untuk upload file
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }
});

// Route utama
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
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

    if (files.media1 && files.media1[0]) {
      message1.media = { buffer: files.media1[0].buffer };
    }

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

    if (files.media2 && files.media2[0]) {
      message2.media = { buffer: files.media2[0].buffer };
    }

    messages.push(message2);

    const params = {
      type: data.outputType || 'image',
      backgroundColor: data.backgroundColor || '#1b2226',
      width: parseInt(data.width) || 512,
      scale: parseInt(data.scale) || 2,
      messages: messages
    };

    const result = await QuoteGenerator(params);

    // Buat folder outputs jika belum ada
    const outputDir = './outputs';
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const filename = `whatsapp-chat-${Date.now()}.png`;
    const filepath = path.join(outputDir, filename);
    fs.writeFileSync(filepath, result.image);

    // Kirim file langsung
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(result.image);

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Server berjalan di http://localhost:${PORT}`);
  console.log('Tekan Ctrl+C untuk menghentikan server');
});
