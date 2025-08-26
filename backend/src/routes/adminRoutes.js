const express = require('express');
const { authenticate, authorize } = require('../middleware/auth');
const prisma = require('../utils/prisma');

const router = express.Router();

// Middleware untuk otentikasi & otorisasi admin
// Semua rute di bawah ini akan memerlukan token yang valid dan peran 'ADMIN'
router.use(authenticate);
router.use(authorize('ADMIN'));

/**
 * @route   GET /api/admin/users
 * @desc    Mendapatkan semua data pengguna (hanya untuk Admin)
 * @access  Private
 */
router.get('/users', async (req, res) => {
    try {
        const users = await prisma.user.findMany({
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                role: {
                    select: { name: true }
                },
                createdAt: true,
                isVerified: true,
            },
        });
        res.json(users);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Gagal mengambil data pengguna.' });
    }
});

/**
 * @route   DELETE /api/admin/users/:id
 * @desc    Menghapus pengguna berdasarkan ID (hanya untuk Admin)
 * @access  Private
 */
router.delete('/users/:id', async (req, res) => {
    try {
        const userId = parseInt(req.params.id);
        
        // Hapus pengguna dari database
        await prisma.user.delete({
            where: { id: userId },
        });

        res.json({ message: 'Pengguna berhasil dihapus.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Gagal menghapus pengguna.' });
    }
});

// Anda bisa menambahkan rute admin lainnya di sini, contoh:
// router.post('/products', async (req, res) => { /* ... */ });
// router.put('/settings', async (req, res) => { /* ... */ });

module.exports = router;