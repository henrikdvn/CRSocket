<?php
include_once "../boot.php";
include_once CRSOCKET_PHP."/CRConfig.php";
include_once CRSOCKET_PHP."/CREventSender.php";
include_once APP_PHP."/MathTrialsConfig.php";

$clientId = $_GET["clientId"];
$clientRole = $_GET["clientRole"];
$accessToken = $_GET["accessToken"];

$recipientClientId = $_GET["recipientClientId"];
$eventType = $_GET["eventType"];
$eventData = $_GET["eventData"];

$config = new MathTrialsConfig(APP_ID, RESOURCE_NAME, CRSOCKET_LOG, CRSOCKET_DATA, CRSOCKET_SOCK, APP_LOG, APP_DATA);
$eventSender = new CREventSender($config, $clientId, $clientRole, $accessToken);
$eventSender->sendEvent($recipientClientId, $eventType, $eventData);
