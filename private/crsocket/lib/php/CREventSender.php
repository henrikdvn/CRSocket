<?php

include_once "CRUtil.php";
include_once "CREvent.php";
include_once "CRClient.php";

/*
 ------------------------------------------------------------------------------------------------------------------
 This class is used to transmit a messageEvent from the requesting client to a recipient client
 Sender and event info is converted to a string which is written to a socket named $recipientClientId.sock,
 located in the $config->crsSockRoot directory.
 ------------------------------------------------------------------------------------------------------------------
 */

class CREventSender extends CRClient {
	
	/*
	 ------------------------------------------------------------------------------------------------------------------
	 Methods, public
	 ------------------------------------------------------------------------------------------------------------------
	 */
	
	// Sends a message event, which may contain a CREvent.
	// Events will only be sent if valid sender credentials, recipientClientId and eventType have been provided
	// Logged crEvents will be written to a log file in the socket directory named $clientId.log
	// Interceptable crEvents will only be sent if they are accepted by the config->acceptAtEventSender function
	
	public function sendEvent($recipientClientId, $msgEventType, $msgEventData = "") {
		$this->description .= ", $recipientClientId, $msgEventType, [$msgEventData]";
		if ($this->config->isValidClientId($this->clientId)) {
			if ($this->config->isValidAccessToken($this->accessToken)) {
				if ($this->config->isAuthorized($this->clientRole, $this->accessToken)) {
					if ($this->config->isValidClientId($recipientClientId)) {
						if ($msgEventType) {
							if ($msgEventType == "crEvent") {
								$crEvent = $this->genCrEventFromData($msgEventData);
								$crEvent->recipientClientId = $recipientClientId;
								if ($crEvent->logged == "true") {
									CRUtil::logCrEvent($this->config, $crEvent);
								}
								$interceptable = ($crEvent->interceptable == "true" && $crEvent->eventType != "reject");
								if (!$interceptable || $this->config->acceptAtEventSender($this, $crEvent)) {
									CRUtil::sendCrEvent($this->config, $crEvent);
								}
								else {
									$this->config->logDebug("sendEvent, interceptFailed, $this->description");
								}
							}
							else {
								$this->sendMsgEvent($recipientClientId, $msgEventType, $msgEventData);
							}
						}
						else {
							$this->config->logWarn("sendEvent, noMsgEventType, $this->description");
						}
					}
					else {
						$this->config->logWarn("sendEvent, invalidRecipientClientId, $this->description");
					}
				}
				else {
					$this->config->logWarn("sendEvent, notAuthorized, $this->description");
				}
			}
			else {
				$this->config->logWarn("sendEvent, invalidAccessToken, $this->description");
			}
		}
		else {
			$this->config->logWarn("sendEvent, invalidClientId, $this->description");
		}
	}
}
