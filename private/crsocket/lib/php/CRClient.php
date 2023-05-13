<?php

include_once "CRConfig.php";
include_once "CREvent.php";
include_once "CRUtil.php";

/*
 ------------------------------------------------------------------------------------------------------------------
 This class contains information about the client that requested a particular resource.
 It also provides methods based on this info
 ------------------------------------------------------------------------------------------------------------------
 */

class CRClient {
	
	function __construct($config, $clientId, $clientRole, $accessToken) {
		$this->config = $config;
		$this->appId = $config->appId;
		$this->clientRole = $clientRole;
		$this->clientId = $clientId;
		$this->accessToken = $accessToken;
		$this->description = "[$this->appId, $this->clientRole, $this->clientId]";
		switch ($clientRole) {
			case "controller":
				$this->partnerClientRole = "responder";
				break;
			case "responder":
				$this->partnerClientRole =  "controller";
				break;
			default:
				$config->logWarn("invalidClientRole");
				break;
		}
	}
	
	/*
	 ------------------------------------------------------------------------------------------------------------------
	 Properties, public
	 ------------------------------------------------------------------------------------------------------------------
	 */
	
	// CRConfig object
	
	public object $config;
	
	// application id
	
	public string $appId;
	
	// clientRole of the requesting client
	
	public string $clientRole;
	
	// Identifies the requesting client process
	
	public string $clientId;
	
	// accessToken of the requesting client
	
	public string $accessToken;
	
	// The client is only allowed to comminucate with clients with this this clientRole
	
	public string $partnerClientRole;
	
	// Description of the parameters for logging purposes
	
	public string $description;
	
	/*
	 ------------------------------------------------------------------------------------------------------------------
	 Methods, public
	 ------------------------------------------------------------------------------------------------------------------
	 */
	
	// Generates a CREvent with this client as sender
	
	public function genCrEvent($eventType, $eventSubType = "", $eventParams = [], $buffered = "false", $logged = "false", $interceptable = "true") {
		$crEvent = new CREvent($this->config);
		$crEvent->updateContent($eventType, $eventSubType, $eventParams);
		$crEvent->updateFlags($buffered, $logged, $interceptable);
		$crEvent->updateAuthInfo($this->clientId, $this->clientRole, $this->accessToken);
		return $crEvent;
	}
	
	// Generates a CREvent from a supplied eventData string, with this client as sender
	
	public function genCrEventFromData($msgEventData) {
		$crEvent = new CREvent($this->config);
		$crEvent->initWithMsgEventData($msgEventData);
		$crEvent->updateAuthInfo($this->clientId, $this->clientRole, $this->accessToken);
		return $crEvent;
	}
	
	// Sends a messageEvent from this client
	
	public function sendMsgEvent($recipientClientId, $msgEventType, $msgEventData) {
		CRUtil::sendMsgEvent($this->config, $recipientClientId, $this->clientId, $this->clientRole, $this->accessToken, $msgEventType, $msgEventData);
	}
}
