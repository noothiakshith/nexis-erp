-- Create approval workflows table
CREATE TABLE IF NOT EXISTS `approvals` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `requestType` enum('purchase_order', 'leave_request', 'expense_report') NOT NULL,
  `requestId` int NOT NULL,
  `requestorId` int NOT NULL,
  `currentStep` int NOT NULL DEFAULT 1,
  `totalSteps` int NOT NULL,
  `status` enum('pending', 'approved', 'rejected', 'cancelled') NOT NULL DEFAULT 'pending',
  `rejectionReason` text,
  `createdAt` timestamp DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `completedAt` timestamp NULL,
  KEY `requestType_requestId` (`requestType`, `requestId`),
  KEY `requestorId` (`requestorId`),
  KEY `status` (`status`)
);

-- Create approval steps table
CREATE TABLE IF NOT EXISTS `approvalSteps` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `approvalId` int NOT NULL,
  `stepNumber` int NOT NULL,
  `approverRole` varchar(100) NOT NULL,
  `assignedTo` int,
  `status` enum('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
  `comments` text,
  `approvedAt` timestamp NULL,
  `createdAt` timestamp DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`approvalId`) REFERENCES `approvals` (`id`) ON DELETE CASCADE,
  KEY `approvalId` (`approvalId`),
  KEY `stepNumber` (`stepNumber`),
  KEY `assignedTo` (`assignedTo`),
  KEY `status` (`status`)
);

-- Create approval audit table
CREATE TABLE IF NOT EXISTS `approvalAudit` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `approvalId` int NOT NULL,
  `action` varchar(100) NOT NULL,
  `performedBy` int NOT NULL,
  `details` json,
  `ipAddress` varchar(45),
  `createdAt` timestamp DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`approvalId`) REFERENCES `approvals` (`id`) ON DELETE CASCADE,
  KEY `approvalId` (`approvalId`),
  KEY `performedBy` (`performedBy`),
  KEY `createdAt` (`createdAt`)
);

-- Create email logs table
CREATE TABLE IF NOT EXISTS `emailLogs` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `recipientEmail` varchar(320) NOT NULL,
  `subject` varchar(255) NOT NULL,
  `template` varchar(100) NOT NULL,
  `relatedType` varchar(100),
  `relatedId` int,
  `status` enum('pending', 'sent', 'failed') NOT NULL DEFAULT 'pending',
  `errorMessage` text,
  `sentAt` timestamp NULL,
  `createdAt` timestamp DEFAULT CURRENT_TIMESTAMP,
  KEY `recipientEmail` (`recipientEmail`),
  KEY `status` (`status`),
  KEY `relatedType_relatedId` (`relatedType`, `relatedId`),
  KEY `createdAt` (`createdAt`)
);

-- Add approval status to purchase orders
ALTER TABLE `purchaseOrders` MODIFY `status` enum('draft', 'pending_approval', 'approved', 'sent', 'received', 'cancelled') NOT NULL DEFAULT 'draft';

-- Add approval status to leaves
ALTER TABLE `leaves` MODIFY `status` enum('pending', 'approved', 'rejected', 'cancelled') NOT NULL DEFAULT 'pending';

-- Add approval status to expenses
ALTER TABLE `expenses` MODIFY `status` enum('draft', 'submitted', 'approved', 'rejected', 'paid') NOT NULL DEFAULT 'draft';
