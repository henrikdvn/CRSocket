<?php
include_once "../boot.php";
include_once CRSOCKET_PHP."/CRConfig.php";
include_once CRSOCKET_PHP."/CREventSender.php";

$clientId = $_GET["clientId"];
$clientRole = $_GET["clientRole"];
$accessToken = $_GET["accessToken"];

$recipientClientId = $_GET["recipientClientId"];
$eventType = $_GET["eventType"];
$eventData = $_GET["eventData"];

$config = new CRConfig(APP_ID, RESOURCE_NAME, CRSOCKET_LOG, CRSOCKET_DATA, CRSOCKET_SOCK, APP_LOG, APP_DATA);
$config->debugMode = true;
$eventSender = new CREventSender($config, $clientId, $clientRole, $accessToken);
$eventSender->sendEvent($recipientClientId, $eventType, $eventData);
