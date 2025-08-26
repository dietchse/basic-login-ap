-- CreateTable
CREATE TABLE `NotificationPreferences` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `emailNotifications` BOOLEAN NOT NULL DEFAULT true,
    `marketingEmails` BOOLEAN NOT NULL DEFAULT true,
    `weeklyDigest` BOOLEAN NOT NULL DEFAULT true,
    `securityAlerts` BOOLEAN NOT NULL DEFAULT true,
    `pushNotifications` BOOLEAN NOT NULL DEFAULT false,
    `browserNotifications` BOOLEAN NOT NULL DEFAULT false,
    `productUpdates` BOOLEAN NOT NULL DEFAULT true,
    `systemMaintenance` BOOLEAN NOT NULL DEFAULT true,
    `newsletters` BOOLEAN NOT NULL DEFAULT true,
    `emailFrequency` VARCHAR(191) NOT NULL DEFAULT 'daily',
    `digestFrequency` VARCHAR(191) NOT NULL DEFAULT 'weekly',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `NotificationPreferences_userId_key`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `NotificationPreferences` ADD CONSTRAINT `NotificationPreferences_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
