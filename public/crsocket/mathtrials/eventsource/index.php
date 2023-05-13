<?php
include_once "../boot.php";
include_once CRSOCKET_PHP."/CRUtil.php";
include_once CRSOCKET_PHP."/CRConfig.php";
include_once CRSOCKET_PHP."/CREventSource.php";
include_once APP_PHP."/MathTrialsConfig.php";

$clientId = $_GET["clientId"];
$clientRole = $_GET["clientRole"];
$accessToken = $_GET["accessToken"];

$config = new MathTrialsConfig(APP_ID, RESOURCE_NAME, CRSOCKET_LOG, CRSOCKET_DATA, CRSOCKET_SOCK, APP_LOG, APP_DATA);
$eventSource = new CREventSource($config, $clientId, $clientRole, $accessToken);
$eventSource->open();
