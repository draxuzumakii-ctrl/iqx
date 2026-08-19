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

// Konfigurasi multer
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
app.post('/api/generate', upload.none(), async (req, res) => {
    try {
        console.log('Menerima request generate...');
        console.log('Body:', req.body);
        
        const data = req.body;
        
        // Build messages array
        const messages = [
            {
                avatar: true,
                from: {
                    id: 2,
                    name: data.msg1Name || 'User 1',
                    photo: {},
                    number: data.msg1Number || '+6212345678909',
                    time: data.msg1Time || '11:21'
                },
                text: data.msg1Text || 'Pesan 1'
            },
            {
                avatar: true,
                from: {
                    id: 3,
                    name: data.msg2Name || 'User 2',
                    photo: {},
                    number: data.msg2Number || '+6212345678909',
                    time: data.msg2Time || '11:23'
                },
                text: data.msg2Text || 'Pesan 2'
            }
        ];

        const params = {
            type: 'image',
            backgroundColor: data.backgroundColor || '#1b2226',
            width: parseInt(data.width) || 512,
            scale: parseInt(data.scale) || 2,
            messages: messages
        };

        console.log('Generating image...');
        const result = await QuoteGenerator(params);
        console.log('Image generated successfully');
        
        // Cek hasil
        if (!result || !result.image) {
            throw new Error('Tidak ada image dalam hasil');
        }

        // Kirim gambar langsung
        res.setHeader('Content-Type', 'image/png');
        res.setHeader('Content-Length', result.image.length);
        res.send(result.image);

    } catch (error) {
        console.error('Error detail:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            stack: error.stack
        });
    }
});

// Error handler
app.use((err, req, res, next) => {
    console.error('Global error:', err);
    res.status(500).json({
        success: false,
        error: err.message
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`✅ Server berjalan di http://localhost:${PORT}`);
    console.log('Buka browser dan akses URL tersebut');
});
