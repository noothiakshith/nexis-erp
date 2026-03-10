CREATE TABLE `approvalAudit` (
	`id` int AUTO_INCREMENT NOT NULL,
	`approvalId` int NOT NULL,
	`action` varchar(100) NOT NULL,
	`performedBy` int NOT NULL,
	`details` json,
	`ipAddress` varchar(45),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `approvalAudit_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `approvalSteps` (
	`id` int AUTO_INCREMENT NOT NULL,
	`approvalId` int NOT NULL,
	`stepNumber` int NOT NULL,
	`approverRole` varchar(100) NOT NULL,
	`assignedTo` int,
	`status` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
	`comments` text,
	`approvedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `approvalSteps_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `approvals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`requestType` enum('purchase_order','leave_request','expense_report') NOT NULL,
	`requestId` int NOT NULL,
	`requestorId` int NOT NULL,
	`currentStep` int NOT NULL DEFAULT 1,
	`totalSteps` int NOT NULL,
	`status` enum('pending','approved','rejected','cancelled') NOT NULL DEFAULT 'pending',
	`rejectionReason` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`completedAt` timestamp,
	CONSTRAINT `approvals_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `emailLogs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`recipientEmail` varchar(320) NOT NULL,
	`subject` varchar(255) NOT NULL,
	`template` varchar(100) NOT NULL,
	`relatedType` varchar(100),
	`relatedId` int,
	`status` enum('pending','sent','failed') NOT NULL DEFAULT 'pending',
	`errorMessage` text,
	`sentAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `emailLogs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `employees` DROP INDEX `employees_userId_unique`;--> statement-breakpoint
ALTER TABLE `employees` DROP INDEX `employees_employeeId_unique`;--> statement-breakpoint
ALTER TABLE `analyticsData` MODIFY COLUMN `metric` varchar(100) NOT NULL;--> statement-breakpoint
ALTER TABLE `analyticsData` MODIFY COLUMN `value` decimal(15,2) NOT NULL;--> statement-breakpoint
ALTER TABLE `attendance` MODIFY COLUMN `status` enum('present','absent','late','half_day') NOT NULL DEFAULT 'present';--> statement-breakpoint
ALTER TABLE `budgets` MODIFY COLUMN `status` enum('draft','approved','active','closed') NOT NULL DEFAULT 'draft';--> statement-breakpoint
ALTER TABLE `customers` MODIFY COLUMN `email` varchar(320);--> statement-breakpoint
ALTER TABLE `customers` MODIFY COLUMN `customerType` enum('individual','business') NOT NULL DEFAULT 'business';--> statement-breakpoint
ALTER TABLE `employees` MODIFY COLUMN `userId` int;--> statement-breakpoint
ALTER TABLE `employees` MODIFY COLUMN `email` varchar(320);--> statement-breakpoint
ALTER TABLE `expenses` MODIFY COLUMN `status` enum('draft','submitted','approved','rejected','paid') NOT NULL DEFAULT 'draft';--> statement-breakpoint
ALTER TABLE `expenses` MODIFY COLUMN `submittedBy` int;--> statement-breakpoint
ALTER TABLE `interactions` MODIFY COLUMN `type` varchar(100) NOT NULL;--> statement-breakpoint
ALTER TABLE `interactions` MODIFY COLUMN `createdBy` int;--> statement-breakpoint
ALTER TABLE `invoices` MODIFY COLUMN `createdBy` int;--> statement-breakpoint
ALTER TABLE `leaves` MODIFY COLUMN `leaveType` varchar(100) NOT NULL;--> statement-breakpoint
ALTER TABLE `milestones` MODIFY COLUMN `status` enum('pending','in_progress','completed') NOT NULL DEFAULT 'pending';--> statement-breakpoint
ALTER TABLE `poItems` MODIFY COLUMN `productId` int;--> statement-breakpoint
ALTER TABLE `predictions` MODIFY COLUMN `confidence` decimal(3,2);--> statement-breakpoint
ALTER TABLE `purchaseOrders` MODIFY COLUMN `status` enum('draft','pending_approval','approved','sent','received','cancelled') NOT NULL DEFAULT 'draft';--> statement-breakpoint
ALTER TABLE `purchaseOrders` MODIFY COLUMN `createdBy` int;--> statement-breakpoint
ALTER TABLE `stockMovements` MODIFY COLUMN `movementType` enum('in','out','adjustment') NOT NULL;--> statement-breakpoint
ALTER TABLE `tasks` MODIFY COLUMN `status` enum('todo','in_progress','review','completed','cancelled') NOT NULL DEFAULT 'todo';--> statement-breakpoint
ALTER TABLE `analyticsData` ADD `timestamp` timestamp DEFAULT (now()) NOT NULL;--> statement-breakpoint
ALTER TABLE `attendance` ADD `checkIn` time;--> statement-breakpoint
ALTER TABLE `attendance` ADD `checkOut` time;--> statement-breakpoint
ALTER TABLE `budgets` ADD `budgetAmount` decimal(15,2) NOT NULL;--> statement-breakpoint
ALTER TABLE `budgets` ADD `fiscalYear` int NOT NULL;--> statement-breakpoint
ALTER TABLE `customers` ADD `status` enum('active','inactive','prospect') DEFAULT 'active' NOT NULL;--> statement-breakpoint
ALTER TABLE `employees` ADD `reportingManager` int;--> statement-breakpoint
ALTER TABLE `employees` ADD `employmentType` enum('full_time','part_time','contract','intern') DEFAULT 'full_time' NOT NULL;--> statement-breakpoint
ALTER TABLE `interactions` ADD `notes` text;--> statement-breakpoint
ALTER TABLE `inventory` ADD `warehouseLocation` varchar(100);--> statement-breakpoint
ALTER TABLE `inventory` ADD `lastCountDate` date;--> statement-breakpoint
ALTER TABLE `leads` ADD `value` decimal(15,2);--> statement-breakpoint
ALTER TABLE `milestones` ADD `targetDate` date NOT NULL;--> statement-breakpoint
ALTER TABLE `payroll` ADD `payPeriod` varchar(50) NOT NULL;--> statement-breakpoint
ALTER TABLE `payroll` ADD `bonuses` decimal(15,2) DEFAULT '0';--> statement-breakpoint
ALTER TABLE `poItems` ADD `description` varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE `predictions` ADD `category` varchar(100) NOT NULL;--> statement-breakpoint
ALTER TABLE `predictions` ADD `prediction` text NOT NULL;--> statement-breakpoint
ALTER TABLE `predictions` ADD `timeframe` varchar(100);--> statement-breakpoint
ALTER TABLE `products` ADD `currentStock` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `products` ADD `supplierId` int;--> statement-breakpoint
ALTER TABLE `projects` ADD `projectManager` int;--> statement-breakpoint
ALTER TABLE `purchaseOrders` ADD `tax` decimal(15,2) DEFAULT '0';--> statement-breakpoint
ALTER TABLE `purchaseOrders` ADD `expectedDelivery` date;--> statement-breakpoint
ALTER TABLE `suppliers` ADD `isActive` boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE `analyticsData` DROP COLUMN `dataType`;--> statement-breakpoint
ALTER TABLE `analyticsData` DROP COLUMN `recordDate`;--> statement-breakpoint
ALTER TABLE `analyticsData` DROP COLUMN `createdAt`;--> statement-breakpoint
ALTER TABLE `attendance` DROP COLUMN `checkInTime`;--> statement-breakpoint
ALTER TABLE `attendance` DROP COLUMN `checkOutTime`;--> statement-breakpoint
ALTER TABLE `attendance` DROP COLUMN `updatedAt`;--> statement-breakpoint
ALTER TABLE `budgets` DROP COLUMN `allocatedAmount`;--> statement-breakpoint
ALTER TABLE `budgets` DROP COLUMN `year`;--> statement-breakpoint
ALTER TABLE `budgets` DROP COLUMN `month`;--> statement-breakpoint
ALTER TABLE `customers` DROP COLUMN `creditLimit`;--> statement-breakpoint
ALTER TABLE `customers` DROP COLUMN `totalPurchases`;--> statement-breakpoint
ALTER TABLE `customers` DROP COLUMN `lastInteraction`;--> statement-breakpoint
ALTER TABLE `employees` DROP COLUMN `employeeId`;--> statement-breakpoint
ALTER TABLE `employees` DROP COLUMN `dateOfBirth`;--> statement-breakpoint
ALTER TABLE `employees` DROP COLUMN `manager`;--> statement-breakpoint
ALTER TABLE `expenses` DROP COLUMN `approvedBy`;--> statement-breakpoint
ALTER TABLE `interactions` DROP COLUMN `description`;--> statement-breakpoint
ALTER TABLE `interactions` DROP COLUMN `interactionDate`;--> statement-breakpoint
ALTER TABLE `inventory` DROP COLUMN `warehouseId`;--> statement-breakpoint
ALTER TABLE `inventory` DROP COLUMN `lastStockCheck`;--> statement-breakpoint
ALTER TABLE `leads` DROP COLUMN `score`;--> statement-breakpoint
ALTER TABLE `leads` DROP COLUMN `expectedValue`;--> statement-breakpoint
ALTER TABLE `leads` DROP COLUMN `closingDate`;--> statement-breakpoint
ALTER TABLE `leads` DROP COLUMN `notes`;--> statement-breakpoint
ALTER TABLE `leaves` DROP COLUMN `approvalDate`;--> statement-breakpoint
ALTER TABLE `milestones` DROP COLUMN `dueDate`;--> statement-breakpoint
ALTER TABLE `milestones` DROP COLUMN `deliverables`;--> statement-breakpoint
ALTER TABLE `payroll` DROP COLUMN `month`;--> statement-breakpoint
ALTER TABLE `payroll` DROP COLUMN `year`;--> statement-breakpoint
ALTER TABLE `payroll` DROP COLUMN `allowances`;--> statement-breakpoint
ALTER TABLE `payroll` DROP COLUMN `processedAt`;--> statement-breakpoint
ALTER TABLE `poItems` DROP COLUMN `receivedQuantity`;--> statement-breakpoint
ALTER TABLE `poItems` DROP COLUMN `createdAt`;--> statement-breakpoint
ALTER TABLE `predictions` DROP COLUMN `predictionType`;--> statement-breakpoint
ALTER TABLE `predictions` DROP COLUMN `module`;--> statement-breakpoint
ALTER TABLE `predictions` DROP COLUMN `targetValue`;--> statement-breakpoint
ALTER TABLE `predictions` DROP COLUMN `predictedValue`;--> statement-breakpoint
ALTER TABLE `products` DROP COLUMN `quantity`;--> statement-breakpoint
ALTER TABLE `products` DROP COLUMN `warehouseLocation`;--> statement-breakpoint
ALTER TABLE `products` DROP COLUMN `supplier`;--> statement-breakpoint
ALTER TABLE `projects` DROP COLUMN `spent`;--> statement-breakpoint
ALTER TABLE `projects` DROP COLUMN `manager`;--> statement-breakpoint
ALTER TABLE `projects` DROP COLUMN `priority`;--> statement-breakpoint
ALTER TABLE `purchaseOrders` DROP COLUMN `expectedDeliveryDate`;--> statement-breakpoint
ALTER TABLE `purchaseOrders` DROP COLUMN `approvedBy`;--> statement-breakpoint
ALTER TABLE `purchaseOrders` DROP COLUMN `notes`;--> statement-breakpoint
ALTER TABLE `stockMovements` DROP COLUMN `createdBy`;--> statement-breakpoint
ALTER TABLE `suppliers` DROP COLUMN `contactPerson`;--> statement-breakpoint
ALTER TABLE `suppliers` DROP COLUMN `status`;--> statement-breakpoint
ALTER TABLE `tasks` DROP COLUMN `estimatedHours`;--> statement-breakpoint
ALTER TABLE `tasks` DROP COLUMN `actualHours`;--> statement-breakpoint
ALTER TABLE `tasks` DROP COLUMN `progress`;