<?php
include_once "../boot.php";
include_once CRSOCKET_PHP."/CRConfig.php";
include_once CRSOCKET_PHP."/CRClientIdGen.php";

$config = new CRConfig(APP_ID, RESOURCE_NAME, CRSOCKET_LOG, CRSOCKET_DATA, CRSOCKET_SOCK, APP_LOG, APP_DATA);
$config->debugMode = true;
$clientIdGen = new CRCLientIdGen($config);

$clientIdStr = $clientIdGen->getNextClientId();
header("Content-type: text/xml; charset=UTF-8");
echo "<clientId value='$clientIdStr'/>\n";
