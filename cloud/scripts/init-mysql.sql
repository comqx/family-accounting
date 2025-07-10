-- MySQL 初始化脚本
-- 设置字符集
SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- 创建数据库（如果不存在）
CREATE DATABASE IF NOT EXISTS `family_accounting` 
CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 使用数据库
USE `family_accounting`;

-- 创建用户表
CREATE TABLE IF NOT EXISTS `users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `openid` VARCHAR(100) UNIQUE NOT NULL COMMENT '微信openid',
  `unionid` VARCHAR(100) UNIQUE COMMENT '微信unionid',
  `nickname` VARCHAR(50) NOT NULL COMMENT '用户昵称',
  `avatar` VARCHAR(500) COMMENT '头像URL',
  `phone` VARCHAR(20) COMMENT '手机号',
  `email` VARCHAR(100) COMMENT '邮箱',
  `role` ENUM('ADMIN', 'MEMBER', 'OBSERVER') DEFAULT 'MEMBER' COMMENT '用户角色',
  `family_id` INT COMMENT '所属家庭ID',
  `status` ENUM('ACTIVE', 'INACTIVE') DEFAULT 'ACTIVE' COMMENT '用户状态',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  INDEX `idx_openid` (`openid`),
  INDEX `idx_family_id` (`family_id`),
  INDEX `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户表';

-- 创建家庭表
CREATE TABLE IF NOT EXISTS `families` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(50) NOT NULL COMMENT '家庭名称',
  `description` TEXT COMMENT '家庭描述',
  `avatar` VARCHAR(500) COMMENT '家庭头像',
  `admin_id` INT NOT NULL COMMENT '管理员用户ID',
  `invite_code` VARCHAR(20) UNIQUE COMMENT '邀请码',
  `invite_expire_time` TIMESTAMP NULL COMMENT '邀请码过期时间',
  `settings` JSON COMMENT '家庭设置',
  `status` ENUM('ACTIVE', 'INACTIVE') DEFAULT 'ACTIVE' COMMENT '家庭状态',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  INDEX `idx_admin_id` (`admin_id`),
  INDEX `idx_invite_code` (`invite_code`),
  INDEX `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='家庭表';

-- 创建家庭成员关系表
CREATE TABLE IF NOT EXISTS `family_members` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `family_id` INT NOT NULL COMMENT '家庭ID',
  `user_id` INT NOT NULL COMMENT '用户ID',
  `role` ENUM('ADMIN', 'MEMBER', 'OBSERVER') DEFAULT 'MEMBER' COMMENT '成员角色',
  `joined_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '加入时间',
  `status` ENUM('ACTIVE', 'INACTIVE') DEFAULT 'ACTIVE' COMMENT '成员状态',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  UNIQUE KEY `uk_family_user` (`family_id`, `user_id`),
  INDEX `idx_family_id` (`family_id`),
  INDEX `idx_user_id` (`user_id`),
  INDEX `idx_role` (`role`),
  INDEX `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='家庭成员关系表';

-- 创建分类表
CREATE TABLE IF NOT EXISTS `categories` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `family_id` INT COMMENT '家庭ID，NULL表示系统默认分类',
  `name` VARCHAR(50) NOT NULL COMMENT '分类名称',
  `icon` VARCHAR(20) COMMENT '分类图标',
  `type` ENUM('expense', 'income') NOT NULL COMMENT '分类类型',
  `color` VARCHAR(20) DEFAULT '#666666' COMMENT '分类颜色',
  `is_default` BOOLEAN DEFAULT FALSE COMMENT '是否默认分类',
  `sort_order` INT DEFAULT 0 COMMENT '排序',
  `status` ENUM('ACTIVE', 'INACTIVE') DEFAULT 'ACTIVE' COMMENT '分类状态',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  INDEX `idx_family_id` (`family_id`),
  INDEX `idx_type` (`type`),
  INDEX `idx_is_default` (`is_default`),
  INDEX `idx_sort_order` (`sort_order`),
  INDEX `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='分类表';

-- 创建记账记录表
CREATE TABLE IF NOT EXISTS `records` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `family_id` INT NOT NULL COMMENT '家庭ID',
  `user_id` INT NOT NULL COMMENT '用户ID',
  `category_id` INT NOT NULL COMMENT '分类ID',
  `type` ENUM('expense', 'income') NOT NULL COMMENT '记录类型',
  `amount` DECIMAL(10,2) NOT NULL COMMENT '金额',
  `description` VARCHAR(200) COMMENT '描述',
  `date` DATE NOT NULL COMMENT '记录日期',
  `location` VARCHAR(200) COMMENT '位置信息',
  `tags` JSON COMMENT '标签',
  `attachments` JSON COMMENT '附件信息',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  INDEX `idx_family_id` (`family_id`),
  INDEX `idx_user_id` (`user_id`),
  INDEX `idx_category_id` (`category_id`),
  INDEX `idx_type` (`type`),
  INDEX `idx_date` (`date`),
  INDEX `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='记账记录表';

-- 创建预算表
CREATE TABLE IF NOT EXISTS `budgets` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `family_id` INT NOT NULL COMMENT '家庭ID',
  `category_id` INT COMMENT '分类ID，NULL表示总预算',
  `year` INT NOT NULL COMMENT '年份',
  `month` INT NOT NULL COMMENT '月份',
  `amount` DECIMAL(10,2) NOT NULL COMMENT '预算金额',
  `spent` DECIMAL(10,2) DEFAULT 0 COMMENT '已花费金额',
  `status` ENUM('ACTIVE', 'INACTIVE') DEFAULT 'ACTIVE' COMMENT '预算状态',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  UNIQUE KEY `uk_family_category_year_month` (`family_id`, `category_id`, `year`, `month`),
  INDEX `idx_family_id` (`family_id`),
  INDEX `idx_category_id` (`category_id`),
  INDEX `idx_year_month` (`year`, `month`),
  INDEX `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='预算表';

-- 创建费用分摊表
CREATE TABLE IF NOT EXISTS `splits` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `family_id` INT NOT NULL COMMENT '家庭ID',
  `record_id` INT NOT NULL COMMENT '记账记录ID',
  `creator_id` INT NOT NULL COMMENT '创建者ID',
  `title` VARCHAR(100) NOT NULL COMMENT '分摊标题',
  `total_amount` DECIMAL(10,2) NOT NULL COMMENT '总金额',
  `description` TEXT COMMENT '分摊描述',
  `status` ENUM('PENDING', 'APPROVED', 'REJECTED', 'COMPLETED') DEFAULT 'PENDING' COMMENT '分摊状态',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  INDEX `idx_family_id` (`family_id`),
  INDEX `idx_record_id` (`record_id`),
  INDEX `idx_creator_id` (`creator_id`),
  INDEX `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='费用分摊表';

-- 创建分摊成员表
CREATE TABLE IF NOT EXISTS `split_members` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `split_id` INT NOT NULL COMMENT '分摊ID',
  `user_id` INT NOT NULL COMMENT '用户ID',
  `amount` DECIMAL(10,2) NOT NULL COMMENT '分摊金额',
  `status` ENUM('PENDING', 'APPROVED', 'REJECTED', 'PAID') DEFAULT 'PENDING' COMMENT '分摊状态',
  `paid_at` TIMESTAMP NULL COMMENT '支付时间',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  UNIQUE KEY `uk_split_user` (`split_id`, `user_id`),
  INDEX `idx_split_id` (`split_id`),
  INDEX `idx_user_id` (`user_id`),
  INDEX `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='分摊成员表';

-- 创建系统配置表
CREATE TABLE IF NOT EXISTS `system_configs` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `config_key` VARCHAR(100) UNIQUE NOT NULL COMMENT '配置键',
  `config_value` TEXT COMMENT '配置值',
  `description` VARCHAR(200) COMMENT '配置描述',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  INDEX `idx_config_key` (`config_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='系统配置表';

-- 插入默认分类数据
INSERT IGNORE INTO `categories` (`name`, `icon`, `type`, `color`, `is_default`, `sort_order`) VALUES
-- 支出分类
('餐饮', '🍽️', 'expense', '#FF6B6B', TRUE, 1),
('交通', '🚗', 'expense', '#4ECDC4', TRUE, 2),
('购物', '🛒', 'expense', '#45B7D1', TRUE, 3),
('娱乐', '🎮', 'expense', '#FFA07A', TRUE, 4),
('医疗', '🏥', 'expense', '#FF69B4', TRUE, 5),
('教育', '📚', 'expense', '#9370DB', TRUE, 6),
('住房', '🏠', 'expense', '#32CD32', TRUE, 7),
('其他', '📝', 'expense', '#808080', TRUE, 8),
-- 收入分类
('工资', '💰', 'income', '#96CEB4', TRUE, 1),
('奖金', '🎁', 'income', '#FFEAA7', TRUE, 2),
('投资', '📈', 'income', '#FFD93D', TRUE, 3),
('兼职', '💼', 'income', '#6C5CE7', TRUE, 4),
('其他', '📝', 'income', '#A8E6CF', TRUE, 5);

-- 插入系统配置数据
INSERT IGNORE INTO `system_configs` (`config_key`, `config_value`, `description`) VALUES
('app_version', '1.0.0', '应用版本号'),
('default_currency', 'CNY', '默认货币'),
('max_upload_size', '10485760', '最大上传文件大小(字节)'),
('ocr_enabled', 'true', '是否启用OCR功能');

SET FOREIGN_KEY_CHECKS = 1; 