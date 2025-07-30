const express = require('express');
const router = express.Router();
const Image = require('../models/image');
const Combo = require('../models/combo'); // 👈 thêm dòng này

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

      const isImage = typeof embedUrl === 'string' &&
                      (embedUrl.match(/^https?:\/\/.+\.(jpg|jpeg|png|webp|gif)$/i) ||
                       embedUrl.includes('res.cloudinary.com'));
      if (!isImage) {
        console.warn(`❌ Link ảnh lỗi | ${img.name} → ${img.url}`);
        embedUrl = null;
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
    const topImages = await Image.find({ type: { $in: ['áo','đầm'] } });
    const bottomImages = await Image.find({ type: { $in: ['quần', 'váy'] } });

    res.render('ghepdo', { topImages, bottomImages });
  } catch (err) {
    console.error('❌ Lỗi khi lấy ảnh ghép đồ:', err);
    res.status(500).send('Lỗi server');
  }
});
// 📥 Lưu combo ghép đồ
router.post('/api/combo', async (req, res) => {
  const { topId, bottomId } = req.body;

  if (!topId || !bottomId) {
    return res.status(400).json({ error: 'Thiếu topId hoặc bottomId' });
  }

  try {
    const newCombo = new Combo({ topId, bottomId });
    await newCombo.save();
    console.log('✅ Combo mới đã lưu:', newCombo);
    res.json({ success: true, combo: newCombo });
  } catch (err) {
    console.error('❌ Lỗi khi lưu combo:', err);
    res.status(500).json({ error: 'Lỗi khi lưu combo' });
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
