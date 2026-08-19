const QuoteGenerator = require('qc-generator-whatsapp');

async function test() {
    try {
        console.log('Mulai generate...');
        
        const params = {
            type: 'image',
            backgroundColor: '#1b2226',
            width: 512,
            scale: 2,
            messages: [
                {
                    avatar: true,
                    from: {
                        id: 2,
                        name: 'Test User',
                        photo: {},
                        number: '+6212345678909',
                        time: "11:21"
                    },
                    text: 'Ini adalah pesan test'
                },
                {
                    avatar: true,
                    from: {
                        id: 3,
                        name: 'User Kedua',
                        photo: {},
                        number: '+6212345678909',
                        time: "11:23"
                    },
                    text: 'Ini pesan kedua'
                }
            ],
        };

        const result = await QuoteGenerator(params);
        console.log('Berhasil!');
        console.log('Type:', typeof result);
        console.log('Keys:', Object.keys(result));
        
        // Cek ukuran image
        if (result.image) {
            console.log('Image size:', result.image.length, 'bytes');
        }
        
    } catch (error) {
        console.error('Error:', error);
    }
}

test();
