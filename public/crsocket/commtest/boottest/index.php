<?php
include_once("../boot.php");
header("Content-type: text/html; charset=UTF-8");
echo "<!DOCTYPE html>\n";
echo "<html lang='en'>\n";
echo "<head>\n";
echo "<title>crsocket/commtest/boottest</title>\n";
echo "<meta content='text/html;charset=utf-8' http-equiv='Content-Type'>\n";
echo "</head>\n";
echo "<body>\n";
echo "<h1>".CRSOCKET_ID."/".APP_ID."/".RESOURCE_NAME."</h1>\n";
echo "<h2>Identifiers</h2>\n";
echo "<p>CRSOCKET_ID: ".CRSOCKET_ID."</p>\n";
echo "<p>APP_ID: ".APP_ID."</p>\n";
echo "<p>RESOURCE_NAME: ".RESOURCE_NAME."</p>\n";
echo "<h2>Root directories</h2>\n";
echo "<p>DOMAIN_ROOT: ".DOMAIN_ROOT."</p>\n";
echo "<p>CRSOCKET_ROOT: ".CRSOCKET_ROOT."</p>\n";
echo "<h2>PHP source directories</h2>\n";
echo "<p>CRSOCKET_PHP: ".CRSOCKET_PHP."</p>\n";
echo "<p>APP_PHP: ".APP_PHP."</p>\n";
echo "<h2>CRSocket directories</h2>\n";
echo "<p>CRSOCKET_LOG: ".CRSOCKET_LOG."</p>\n";
echo "<p>CRSOCKET_DATA: ".CRSOCKET_DATA."</p>\n";
echo "<p>CRSOCKET_SOCK: ".CRSOCKET_SOCK."</p>\n";
echo "<h2>App directories</h2>\n";
echo "<p>APP_LOG: ".APP_LOG."</p>\n";
echo "<p>APP_DATA: ".APP_DATA."</p>\n";
echo "</body>\n";
echo "</html>\n";