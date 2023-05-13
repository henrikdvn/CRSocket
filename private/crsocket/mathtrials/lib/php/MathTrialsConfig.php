<?php

include_once "MathTrial.php";

/*
 ------------------------------------------------------------------------------------------------------------------
 This class extends and replaces the CRConfig class in mathtrials controller/responder apps
 It restrics general access to accessTokens "bob" and "alice" for controllers and responders
 It also defines app specific read/write access functions which is is applied when saving and downloading data
 In addition it implements app specific eventSoure and sendEvent interceptors (see below)
 ------------------------------------------------------------------------------------------------------------------
 */

class MathTrialsConfig extends CRConfig {
	
	public bool $debugMode = true;
	
	/*
	 ------------------------------------------------------------------------------------------------------------------
	 Methods
	 ------------------------------------------------------------------------------------------------------------------
	 */
	
	// Access tokens can consist of alphabetical characters (english) and must contain at least 3 characters
	
	function isValidAccessToken($accessToken) {
		return preg_match("/^[A-Za-z]{3,}$/", $accessToken);
	}
	
	// Only allows accessTokens "alice" and "bob"
	
	function isAuthorized($clientRole, $accessToken) {
		return $accessToken == "alice" || $accessToken == "bob";
	}
	
	// Only accessTokens "alice" and "bob" have read and write access.
	
	function hasReadAccess($accessToken) {
		return $accessToken == "alice" || $accessToken == "bob";
	}
	
	function hasWriteAccess($accessToken) {
		return $accessToken == "alice" || $accessToken == "bob";
	}
	
	// When a "ping" event is received, only events with the same access token as the receiver will be passed on.
	// If the tokens are not equal, the eventSource will reply with a "reject" event to the sender.
	
	function acceptAtEventSource($crClient, $crEvent) {
		if ($crEvent->eventType == "ping") {
			if ($crClient->accessToken == $crEvent->senderAccessToken) {
				$this->logDebug("acceptAtEventSource, accepted, $crClient->accessToken, $crEvent->senderAccessToken");
				return true;
			}
			else {
				$this->logDebug("acceptAtEventSource, accessTokenMismatch, $crClient->accessToken, $crEvent->senderAccessToken");
				$replyCrEvent = $crClient->genCrEvent("reject", "accessTokenMismatch");
				$replyCrEvent->recipientClientId = $crEvent->senderClientId;
				$replyCrEvent->send();
				return false;
			}
		}
		else {
			return true;
		}
	}
	
	// When a "trialComplete" event is received, the event sender will try to save the result.
	// If successful it will set the eventSubType to "saved". If not, it sets it to "writeFailed" or "noWriteAccess".
	
	function acceptAtEventSender($crClient, $crEvent) {
		if ($crEvent->eventType == "trialComplete") {
			if ($this->hasWriteAccess($crEvent->senderAccessToken)) {
				$mathTrial = new MathTrial($crEvent);
				$resultsFilePath = $this->appDataRoot."/results.csv";
				if (file_put_contents($resultsFilePath, $mathTrial->getCsvRow(), FILE_APPEND | LOCK_EX)) {
					$mathTrial->saved = "true";
					$mathTrial->updateCrEvent($crEvent);
				}
				else {
					$config->logWarn("acceptAtEventSender, writeFailed, $resultsFilePath");
					$crEvent->eventSubType = "writeFailed";
				}
			}
			else {
				$config->logWarn("acceptAtEventSender, noWriteAccess, $crEvent->senderAccessToken");
				$crEvent->eventSubType = "noWriteAccess";
			}
		}
		return true;
	}
}
