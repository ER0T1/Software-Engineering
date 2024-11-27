CREATE DATABASE Company;
USE Company;

CREATE TABLE `Users` (
    `userID` INT AUTO_INCREMENT PRIMARY KEY,
    `firstName` VARCHAR(255) NOT NULL,
    `lastName` VARCHAR(255) NOT NULL,
    `email` VARCHAR(255) NOT NULL,
    `password` VARCHAR(255) NOT NULL,   -- Randomly generated using EXCEL.
    `administrator` BOOLEAN DEFAULT FALSE,
    `driver` INT DEFAULT NULL CHECK (`driver` BETWEEN 0 AND 54), -- Randomly generated using EXCEL.
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP    -- Randomly generated using EXCEL.
);

CREATE TABLE `Categories` (
    `categoryID` INT AUTO_INCREMENT PRIMARY KEY,
    `description` VARCHAR(100) NOT NULL
);

-- Use Excel to randomly select some user IDs from users.csv, assign them driver IDs, and randomly allow each driver to operate different categories of equipment.
CREATE TABLE `Drivers` (
    `driverID` INT AUTO_INCREMENT PRIMARY KEY,
    `userID` INT NOT NULL,
    `categoryID` INT NOT NULL,
    FOREIGN KEY (`userID`) REFERENCES `Users`(`userID`) ON DELETE CASCADE,
    FOREIGN KEY (`categoryID`) REFERENCES `Categories`(`categoryID`) ON DELETE CASCADE UPDATE CASCADE
);

CREATE TABLE `Products` (
    `productID` INT AUTO_INCREMENT PRIMARY KEY,
    `categoryID` INT NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `condition` INT CHECK (`condition` BETWEEN 1 AND 5) NOT NULL,
    `payment` VARCHAR(255) NOT NULL,
    `price` DECIMAL(10, 2) NOT NULL,
    `location` VARCHAR(255) NOT NULL,
    `country` VARCHAR(255) NOT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,   -- Randomly generated using EXCEL.
    FOREIGN KEY (`categoryID`) REFERENCES `Categories`(`categoryID`) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE `Transactions` (
    `transactionID` INT AUTO_INCREMENT PRIMARY KEY,
    `productID` INT NOT NULL,
    `sellerID` INT NOT NULL,
    `buyerID` INT DEFAULT NULL,
    `driverID` INT DEFAULT NULL,    -- Keep NULL first, and then use SQL syntax to assign values.
    `price` DECIMAL(10, 2) NOT NULL,
    `status` VARCHAR(255) CHECK (`status` = 'open' OR `status` = 'close') NOT NULL DEFAULT 'open',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,   -- Randomly generated using EXCEL.
    `d` BOOLEAN DEFAULT NULL,   -- This is for generating which transaction requires a driver using random data in Excel.
    FOREIGN KEY (`productID`) REFERENCES `Products`(`productID`) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (`sellerID`) REFERENCES `Users`(`userID`) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (`buyerID`) REFERENCES `Users`(`userID`) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (`driverID`) REFERENCES `Drivers`(`driverID`) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE `Ratings` (
    `transactionID` INT AUTO_INCREMENT PRIMARY KEY,
    `sellerID` INT NOT NULL,    -- Modify the name in EXCEL. (userID -> sellerID)
    `buyerID` INT NOT NULL,
    `rating` INT CHECK (`rating` BETWEEN 1 AND 5) NOT NULL,
    `comment` VARCHAR(255) NOT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,   -- Randomly generated using EXCEL.
    FOREIGN KEY (`transactionID`) REFERENCES `Transactions`(`transactionID`) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (`sellerID`) REFERENCES `Users`(`userID`) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (`buyerID`) REFERENCES `Users`(`userID`) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE `Advertisements` (
    `advertisementID` INT AUTO_INCREMENT PRIMARY KEY,
    `title` VARCHAR(255) NOT NULL,
    `description` VARCHAR(255) NOT NULL,
    `userID` INT NOT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`userID`) REFERENCES `Users`(`userID`) ON DELETE CASCADE ON UPDATE CASCADE
);

-- Manually correct incorrect separation in csv files.
-- Use phpMyAdmin to import CSV files; if the file exceeds 2048KB, import it as a ZIP file.
-- Due to previously set restrictions, incorrect data will be automatically excluded when importing data.
-- IMPORT `users.csv`;
-- IMPORT `categories.csv`;
-- IMPORT `drivers.csv`;
-- IMPORT `products.csv`;
-- IMPORT `transactions.csv.zip`;
-- IMPORT `ratings.csv`;

-- Correct the incorrect value.
UPDATE `Ratings` 
JOIN `Transactions` 
ON `Transactions`.`sellerID` = `Ratings`.`sellerID` 
AND `Transactions`.`sellerID` IS NOT NULL 
AND `Transactions`.`buyerID` IS NOT NULL
SET `Ratings`.`buyerID` = `Transactions`.`buyerID`;

-- Using the previously generated data 'd', use SQL syntax to randomly assign drivers.
UPDATE `Transactions` AS T
JOIN `Products` AS P ON T.`productID` = P.`productID`
JOIN `Drivers` AS D ON T.`d` = 1 AND P.`categoryID` = D.`categoryID`
SET T.`driverID` = (
    SELECT D2.`driverID`
    FROM `Drivers` AS D2
    WHERE D2.`categoryID` = P.`categoryID`
    ORDER BY RAND()
    LIMIT 1
);

-- Data 'd' is done, delete it.
ALTER TABLE `Transactions` DROP `d`;