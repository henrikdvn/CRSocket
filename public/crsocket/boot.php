<?php
error_reporting(E_ALL);

// Must point to to the location of the crsocket root directory.
define("CRSOCKET_ROOT", exec("echo ~")."/neurolab_no/crsocket");

define("CRSOCKET_PHP", CRSOCKET_ROOT."/lib/php");
define("CRSOCKET_LOG", CRSOCKET_ROOT."/log");
define("CRSOCKET_DATA", CRSOCKET_ROOT."/data");
define("CRSOCKET_DOC", CRSOCKET_ROOT."/doc");
define("CRSOCKET_SOCK", CRSOCKET_ROOT."/sock");
define("RESOURCE_NAME", basename(dirname($_SERVER["SCRIPT_FILENAME"])));
