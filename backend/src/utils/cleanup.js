const fs = require('fs').promises;
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Fungsi untuk membersihkan file gambar yang tidak terpakai
const cleanupUnusedImages = async () => {
  try {
    const uploadsDir = path.join(__dirname, '../../uploads/profile');
    
    // Baca semua file di folder uploads/profile
    const files = await fs.readdir(uploadsDir);
    
    // Dapatkan semua profilePicture yang masih digunakan dari database
    const users = await prisma.user.findMany({
      select: { profilePicture: true },
      where: { profilePicture: { not: null } }
    });
    
    const usedImages = users
      .map(user => user.profilePicture)
      .filter(pic => pic && pic.startsWith('/uploads/profile/'))
      .map(pic => path.basename(pic));
    
    // Hapus file yang tidak digunakan
    for (const file of files) {
      // Skip file temporary
      if (file.startsWith('temp-')) continue;
      
      if (!usedImages.includes(file)) {
        const filePath = path.join(uploadsDir, file);
        try {
          await fs.unlink(filePath);
          console.log(`Deleted unused image: ${file}`);
        } catch (error) {
          console.warn(`Could not delete file: ${file}`, error.message);
        }
      }
    }
    
    console.log('Image cleanup completed');
  } catch (error) {
    console.error('Error during image cleanup:', error);
  }
};

// Fungsi untuk membersihkan file temporary lama (lebih dari 1 jam)
const cleanupTempFiles = async () => {
  try {
    const uploadsDir = path.join(__dirname, '../../uploads/profile');
    const files = await fs.readdir(uploadsDir);
    const oneHourAgo = Date.now() - (60 * 60 * 1000);
    
    for (const file of files) {
      if (file.startsWith('temp-')) {
        const filePath = path.join(uploadsDir, file);
        const stats = await fs.stat(filePath);
        
        if (stats.mtime.getTime() < oneHourAgo) {
          try {
            await fs.unlink(filePath);
            console.log(`Deleted old temp file: ${file}`);
          } catch (error) {
            console.warn(`Could not delete temp file: ${file}`, error.message);
          }
        }
      }
    }
    
    console.log('Temp files cleanup completed');
  } catch (error) {
    console.error('Error during temp files cleanup:', error);
  }
};

module.exports = { cleanupUnusedImages, cleanupTempFiles };
