const express = require('express');
const router = express.Router();
const Image = require('../models/image');

const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

// 🔧 Cấu hình Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// 🗂️ Cấu hình Multer + Cloudinary
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'tuquanao',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp']
  },
});
const upload = multer({ storage });

// 🔁 Chuyển Google Drive link về dạng direct
function convertDriveUrl(url) {
  const match = url.match(/(?:\/d\/|id=)([a-zA-Z0-9_-]{10,})/);
  if (match) {
    const fileId = match[1];
    return `https://drive.google.com/uc?export=view&id=${fileId}`;
  }
  return url;
}

// 🚪 Trang đăng nhập
router.get('/login', (req, res) => {
  res.render('login');
});

router.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (username === 'admin' && password === '123') {
    res.redirect('/');
  } else {
    res.render('login', { error: 'Sai tài khoản hoặc mật khẩu!' });
  }
});

// 🏠 Trang chủ - hiển thị ảnh
router.get('/', async (req, res) => {
  try {
    const images = await Image.find();
    console.log('📦 Dữ liệu lấy từ MongoDB:', images);

    const imagesWithEmbed = images.map(img => {
      let embedUrl = img.url;

      if (typeof embedUrl === 'string') {
        if (embedUrl.includes('drive.google.com')) {
          embedUrl = convertDriveUrl(embedUrl);
        }

        const isImage = embedUrl.match(/^https?:\/\/.+\.(jpg|jpeg|png|webp|gif)$/i)
                      || embedUrl.includes('drive.google.com/uc?export=view');
        if (!isImage) {
          console.warn(`❌ Link ảnh lỗi | ${img.name} → ${img.url}`);
          embedUrl = null;
        }
      }

      return {
        ...img.toObject(),
        embedUrl
      };
    });

    res.render('home', { images: imagesWithEmbed });
  } catch (err) {
    console.error('❌ Lỗi khi load trang chủ:', err);
    res.status(500).send('Lỗi server');
  }
});

// 🧩 Trang ghép đồ
router.get('/ghepdo', async (req, res) => {
  try {
    const topImages = await Image.find({ type: 'top' });
    const bottomImages = await Image.find({ type: 'bottom' });

    res.render('ghepdo', { topImages, bottomImages });
  } catch (err) {
    console.error('❌ Lỗi khi lấy ảnh ghép đồ:', err);
    res.status(500).send('Lỗi server');
  }
});

// ➕ Trang thêm ảnh
router.get('/add-image', (req, res) => {
  res.render('add-image');
});

// 📤 Xử lý upload ảnh
router.post('/add-image', upload.single('image'), async (req, res) => {
  const { name, type, color } = req.body;

  // ⚠️ Nếu Cloudinary lỗi không trả về file
  if (!req.file || !req.file.path) {
    return res.status(400).send('🚫 Không nhận được ảnh tải lên');
  }

  try {
    const newImage = new Image({
      name,
      url: req.file.path, // ✅ Link ảnh Cloudinary
      type,
      color
    });

    await newImage.save();
    console.log('✅ Đã lưu ảnh mới:', newImage);
    res.redirect('/');
  } catch (err) {
    console.error('🚨 Lỗi khi lưu ảnh mới:', err);
    res.status(500).send('Lỗi khi thêm ảnh');
  }
});

module.exports = router;
