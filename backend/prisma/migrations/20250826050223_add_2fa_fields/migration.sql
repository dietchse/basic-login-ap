-- AlterTable
ALTER TABLE `user` ADD COLUMN `twoFactorBackupCodes` TEXT NULL,
    ADD COLUMN `twoFactorEnabled` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `twoFactorSecret` VARCHAR(191) NULL;
