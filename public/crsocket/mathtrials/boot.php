<?php
error_reporting(E_ALL);
include_once("../../boot.php");

/*
 ------------------------------------------------------------------------------------------------------------------
 This script defines app-specific constants used by CRSocket resources
 ------------------------------------------------------------------------------------------------------------------
 */

// The current application id (eg. "commtest" or "mathtrials"), derived from the parent directory of this script.

define("APP_ID", basename(__DIR__));

// The PHP library used by the current app.

define("APP_PHP", CRSOCKET_ROOT."/".APP_ID."/lib/php");

// The log directory used by the current app, requires write access for public PHP scripts.

define("APP_LOG", CRSOCKET_ROOT."/".APP_ID."/log");

// The data directory used by the current app, requires write access for public PHP scripts.

define("APP_DATA", CRSOCKET_ROOT."/".APP_ID."/data");
