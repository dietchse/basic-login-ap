const multer = require('multer');
const sharp = require('sharp');
const fs = require('fs'); // Impor fs secara langsung untuk fungsi sinkronus
const fsPromises = require('fs').promises; // Impor fs.promises untuk fungsi berbasis promise
const path = require('path');

// Pastikan folder uploads/profile ada
const uploadDir = path.join(__dirname, '../../uploads/profile');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Konfigurasi penyimpanan file sementara
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const userId = req.user.id;
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    cb(null, `temp-${userId}-${timestamp}${ext}`); // File sementara: temp-1-1698723456789.jpg
  },
});

// Filter untuk hanya menerima file gambar
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Hanya file gambar (JPEG, PNG, GIF, WebP) yang diperbolehkan'), false);
  }
};

// Buat instance multer
const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // Batas ukuran file: 5MB
});

// Fungsi untuk mengkonversi gambar ke WebP
const convertToWebP = async (file) => {
  const userId = file.userId; // Ditambahkan ke file oleh middleware
  const timestamp = Date.now();
  const webpPath = path.join(uploadDir, `profile-${userId}-${timestamp}.webp`);

  await sharp(file.path)
    .webp({ quality: 80 }) // Kualitas WebP 80%
    .toFile(webpPath);

  // Hapus file sementara setelah konversi dengan retry mechanism
  const deleteFileWithRetry = async (filePath, maxRetries = 3) => {
    for (let i = 0; i < maxRetries; i++) {
      try {
        // Tunggu sebentar sebelum mencoba menghapus file
        await new Promise(resolve => setTimeout(resolve, 100));
        await fsPromises.unlink(filePath);
        break; // Berhasil dihapus, keluar dari loop
      } catch (error) {
        if (error.code === 'EBUSY' && i < maxRetries - 1) {
          // File masih terkunci, coba lagi setelah delay yang lebih lama
          await new Promise(resolve => setTimeout(resolve, 500 * (i + 1)));
          continue;
        } else if (error.code === 'ENOENT') {
          // File sudah tidak ada, tidak masalah
          break;
        } else if (i === maxRetries - 1) {
          // Sudah mencoba maksimal, log error tapi jangan throw
          console.warn('Could not delete temporary file:', filePath, error.message);
          break;
        }
      }
    }
  };

  await deleteFileWithRetry(file.path);

  return `/uploads/profile/profile-${userId}-${timestamp}.webp`;
};

module.exports = { upload, convertToWebP };