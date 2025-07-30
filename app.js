// app.js
const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bodyParser = require('body-parser');
const path = require('path');
require('./models/combo');

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json()); // 👈 thêm dòng này để xử lý req.body từ JSON
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');
app.use(bodyParser.json());
// MongoDB connect
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('✅ Kết nối MongoDB thành công!'))
.catch((err) => console.error('❌ Lỗi kết nối MongoDB:', err));

mongoose.connection.once('open', () => {
  console.log('📌 Đang dùng DB thực tế là:', mongoose.connection.name); // ← phải ra: TuQuanAo
});

// routes
const mainRoutes = require('./routes/main');
app.use('/', mainRoutes);

// run server
app.listen(port, () => {
  console.log(`🚀 Server đang chạy tại http://localhost:${port}`);
});
