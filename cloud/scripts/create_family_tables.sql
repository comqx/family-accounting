-- 家庭邀请码表
CREATE TABLE IF NOT EXISTS family_invites (
  id INT PRIMARY KEY AUTO_INCREMENT,
  family_id INT NOT NULL,
  invite_code VARCHAR(10) NOT NULL UNIQUE,
  created_by INT NOT NULL,
  used TINYINT(1) DEFAULT 0,
  used_by INT NULL,
  used_at TIMESTAMP NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_family_id (family_id),
  INDEX idx_invite_code (invite_code),
  INDEX idx_expires_at (expires_at),
  FOREIGN KEY (family_id) REFERENCES families(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (used_by) REFERENCES users(id) ON DELETE SET NULL
);

-- 家庭预算表
CREATE TABLE IF NOT EXISTS family_budgets (
  id INT PRIMARY KEY AUTO_INCREMENT,
  family_id INT NOT NULL,
  year INT NOT NULL,
  month INT NOT NULL,
  amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  alerts_enabled TINYINT(1) DEFAULT 1,
  alert_threshold INT DEFAULT 80,
  created_by INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_family_month (family_id, year, month),
  INDEX idx_family_id (family_id),
  INDEX idx_year_month (year, month),
  FOREIGN KEY (family_id) REFERENCES families(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
);

-- 分类预算表
CREATE TABLE IF NOT EXISTS category_budgets (
  id INT PRIMARY KEY AUTO_INCREMENT,
  family_id INT NOT NULL,
  category_id INT NOT NULL,
  year INT NOT NULL,
  month INT NOT NULL,
  amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  created_by INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_category_month (family_id, category_id, year, month),
  INDEX idx_family_id (family_id),
  INDEX idx_category_id (category_id),
  INDEX idx_year_month (year, month),
  FOREIGN KEY (family_id) REFERENCES families(id) ON DELETE CASCADE,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
);

-- 家庭成员表（如果不存在）
CREATE TABLE IF NOT EXISTS family_members (
  id INT PRIMARY KEY AUTO_INCREMENT,
  family_id INT NOT NULL,
  user_id INT NOT NULL,
  role ENUM('owner', 'ADMIN', 'MEMBER', 'OBSERVER') DEFAULT 'MEMBER',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_family_user (family_id, user_id),
  INDEX idx_family_id (family_id),
  INDEX idx_user_id (user_id),
  INDEX idx_role (role),
  FOREIGN KEY (family_id) REFERENCES families(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 添加索引优化查询性能
CREATE INDEX IF NOT EXISTS idx_records_family_date ON records(family_id, date);
CREATE INDEX IF NOT EXISTS idx_records_family_type ON records(family_id, type);
CREATE INDEX IF NOT EXISTS idx_records_category ON records(category_id);
CREATE INDEX IF NOT EXISTS idx_records_user ON records(user_id); 