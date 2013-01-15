CREATE TABLE IF NOT EXISTS `entries` (
  `id` CHAR(40) NOT NULL ,
  `entry` BLOB NOT NULL ,
  `created_time` DATETIME NOT NULL ,
  PRIMARY KEY (`id`) )
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8
COLLATE = utf8_general_ci;
