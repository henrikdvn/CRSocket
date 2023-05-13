<?php
include "../boot.php";
include_once CRSOCKET_PHP."/CRConfig.php";
include_once APP_PHP."/MathTrialsConfig.php";

$accessToken = $_GET["accessToken"];
$participantId = $_GET["participantId"];

$config = new MathTrialsConfig(APP_ID, RESOURCE_NAME, CRSOCKET_LOG, CRSOCKET_DATA, CRSOCKET_SOCK, APP_LOG, APP_DATA);

header("Content-Description: File Transfer");
header("Content-Type: application/csv; charset=UTF-8") ;
header("Content-Disposition: attachment; filename=".$accessToken."_".$participantId.".csv");
$resultsFilePath = $config->appDataRoot."/results.csv";
$resultLines = file($resultsFilePath);
echo "respId,startCt,testerId,partId,trialNo,op,val1,val2,corrAnsw,respDt,respAnsw\n";
foreach ($resultLines as $resultLine) {
	$dataItems = explode($config->eventDataSplitChar, $resultLine);
	if ($dataItems[2] == $accessToken && $dataItems[3] == $participantId) {
		echo $resultLine;
	}
}

