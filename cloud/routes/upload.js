const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const router = express.Router();

// 配置文件上传
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
    files: 1
  },
  fileFilter: (req, file, cb) => {
    // 只允许上传图片和PDF文件
    const allowedTypes = /jpeg|jpg|png|gif|pdf/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('只允许上传图片和PDF文件'));
    }
  }
});

// 上传文件
router.post('/file', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: '请选择要上传的文件' });
    }

    const fileInfo = {
      filename: req.file.filename,
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      path: req.file.path,
      url: `/uploads/${req.file.filename}`
    };

    res.json({
      success: true,
      message: '文件上传成功',
      data: fileInfo
    });
  } catch (error) {
    console.error('文件上传错误:', error);
    res.status(500).json({ error: '文件上传失败' });
  }
});

// 上传头像
router.post('/avatar', upload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: '请选择头像文件' });
    }

    // 检查文件类型，头像只允许图片
    const allowedImageTypes = /jpeg|jpg|png|gif/;
    const extname = allowedImageTypes.test(path.extname(req.file.originalname).toLowerCase());
    const mimetype = allowedImageTypes.test(req.file.mimetype);

    if (!mimetype || !extname) {
      return res.status(400).json({ error: '头像只能是图片格式' });
    }

    const avatarInfo = {
      filename: req.file.filename,
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      url: `/uploads/${req.file.filename}`
    };

    res.json({
      success: true,
      message: '头像上传成功',
      data: avatarInfo
    });
  } catch (error) {
    console.error('头像上传错误:', error);
    res.status(500).json({ error: '头像上传失败' });
  }
});

// 上传账单图片（OCR识别）
router.post('/bill', upload.single('bill'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: '请选择账单图片' });
    }

    // 检查文件类型，账单只允许图片
    const allowedImageTypes = /jpeg|jpg|png/;
    const extname = allowedImageTypes.test(path.extname(req.file.originalname).toLowerCase());
    const mimetype = allowedImageTypes.test(req.file.mimetype);

    if (!mimetype || !extname) {
      return res.status(400).json({ error: '账单图片只能是JPG或PNG格式' });
    }

    const billInfo = {
      filename: req.file.filename,
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      url: `/uploads/${req.file.filename}`
    };

    // TODO: 实现OCR服务识别账单内容
    // 目前只返回文件信息，OCR功能待实现

    res.json({
      success: true,
      message: '账单图片上传成功',
      data: {
        file: billInfo,
        ocrResult: null // OCR功能暂未实现
      }
    });
  } catch (error) {
    console.error('账单图片上传错误:', error);
    res.status(500).json({ error: '账单图片上传失败' });
  }
});

// 删除文件
router.delete('/file/:filename', async (req, res) => {
  try {
    const { filename } = req.params;
    const filePath = path.join(__dirname, '../uploads', filename);

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      res.json({
        success: true,
        message: '文件删除成功'
      });
    } else {
      res.status(404).json({ error: '文件不存在' });
    }
  } catch (error) {
    console.error('删除文件错误:', error);
    res.status(500).json({ error: '删除文件失败' });
  }
});

// 获取文件信息
router.get('/file/:filename', async (req, res) => {
  try {
    const { filename } = req.params;
    const filePath = path.join(__dirname, '../uploads', filename);

    if (fs.existsSync(filePath)) {
      const stats = fs.statSync(filePath);
      const fileInfo = {
        filename,
        size: stats.size,
        created: stats.birthtime,
        modified: stats.mtime,
        url: `/uploads/${filename}`
      };

      res.json({
        success: true,
        data: fileInfo
      });
    } else {
      res.status(404).json({ error: '文件不存在' });
    }
  } catch (error) {
    console.error('获取文件信息错误:', error);
    res.status(500).json({ error: '获取文件信息失败' });
  }
});

module.exports = router; 