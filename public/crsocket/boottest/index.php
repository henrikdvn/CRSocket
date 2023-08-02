<?php
include_once("../boot.php");
header("Content-type: text/html; charset=UTF-8");
echo "<!DOCTYPE html>\n";
echo "<html lang='en'>\n";
echo "<head>\n";
echo "<title>boottest</title>\n";
echo "<meta content='text/html;charset=utf-8' http-equiv='Content-Type'>\n";
echo "</head>\n";
echo "<body>\n";
echo "<p>CRSOCKET_ROOT: ".CRSOCKET_ROOT."</p>\n";
echo "<p>CRSOCKET_PHP: ".CRSOCKET_PHP."</p>\n";
echo "<p>CRSOCKET_LOG: ".CRSOCKET_LOG."</p>\n";
echo "<p>CRSOCKET_DATA: ".CRSOCKET_DATA."</p>\n";
echo "<p>CRSOCKET_SOCK: ".CRSOCKET_SOCK."</p>\n";
echo "<p>RESOURCE_NAME: ".RESOURCE_NAME."</p>\n";
echo "</body>\n";
echo "</html>\n";
