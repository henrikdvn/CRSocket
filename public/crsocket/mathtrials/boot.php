<?php
error_reporting(E_ALL);
include_once("../../boot.php");
define("APP_ID", basename(__DIR__));
define("APP_PHP", CRSOCKET_ROOT."/".APP_ID."/lib/php");
define("APP_LOG", CRSOCKET_ROOT."/".APP_ID."/log");
define("APP_DATA", CRSOCKET_ROOT."/".APP_ID."/data");
