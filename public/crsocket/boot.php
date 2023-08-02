<?php
error_reporting(E_ALL);

/*
 ------------------------------------------------------------------------------------------------------------------
 This script defines constants used by all CRSocket resources
 ------------------------------------------------------------------------------------------------------------------
 */

// This constant must point to to the location of the private crsocket root directory.
define("CRSOCKET_ROOT", exec("echo ~")."/neurolab_no/crsocket");

// The CRSocket PHP library.
define("CRSOCKET_PHP", CRSOCKET_ROOT."/lib/php");

// The CRSocket log directory, requires write access for public PHP scripts.
define("CRSOCKET_LOG", CRSOCKET_ROOT."/log");

// The CRSocket data directory, requires write access for public PHP scripts.
define("CRSOCKET_DATA", CRSOCKET_ROOT."/data");

// The CRSocket socket directory, requires write access for public PHP scripts.
define("CRSOCKET_SOCK", CRSOCKET_ROOT."/sock");

// The current resource name ("clientid", "eventsource" or "sendevent"), derived from the parent directory of the requested PHP script.
define("RESOURCE_NAME", basename(dirname($_SERVER["SCRIPT_FILENAME"])));
