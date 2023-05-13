<?php

include_once "CRConfig.php";
include_once "CRUtil.php";

/*
 ------------------------------------------------------------------------------------------------------------------
 This class represents a crEvent.
 All properties (buffered and receiveCt) and methods mirror the corresponding ECMAScript class.
 All primitive properties must be represented as strings that can be converted unambiguously to ECMAScript values.
 ------------------------------------------------------------------------------------------------------------------
 */

class CREvent {
	
	function __construct($config) {
		$this->config = $config;
	}
	
	/*
	 ------------------------------------------------------------------------------------------------------------------
	 Properties, public
	 ------------------------------------------------------------------------------------------------------------------
	 */
	
	// Event type
	
	public string $eventType = "";
	
	// Optional subtype, providing explanatory information not affecting event handling
	
	public string $eventSubType = "";
	
	// An abitrary array of strings, appended to the event properties in the server-sent event data string.
	// The strings must not contain the config->$eventDataSplitChar character.
	
	public array $eventParams = [];
	
	// If true, this event may have been buffered by the sender client before being sent.
	
	public string $buffered = "false";
	
	// If "true" this event must always be logged by the eventSender in a file named $clientId.log in the $config->crsDataRoot directory
	
	public string $logged = "false";
	
	// If "true" this event can be intercepted and/or modified by functions at eventSender and eventReceiver
	
	public string $interceptable = "true";
	
	// Calendar time in millisecs indicating when the event was sent by the client app.
	
	public string $sendCt = "NaN";
	
	// Calendar time in millisecs indicating when the event was received. Will be assigned by the target client when/if received.
	
	public string $receiveCt = "NaN";
	
	// clientId of the sender client
	
	public string $senderClientId = "";
	
	// role of the sender client
	
	public string $senderClientRole = "";
	
	// Access token of sender client, not transmitted to the recipient client
	
	public string $senderAccessToken = "";
	
	// clientId of the recipient client
	
	public string $recipientClientId = "";
	
	/*
	 ------------------------------------------------------------------------------------------------------------------
	 Computed properties, public
	 ------------------------------------------------------------------------------------------------------------------
	 */
	
	// Returns true if the event contains the required properties and credentials to be sent
	
	public function getReadyToSend() {
		return ($this->config->isValidClientId($this->senderClientId) &&
						$this->config->isValidClientRole($this->senderClientRole) &&
						$this->config->isValidAccessToken($this->senderAccessToken) &&
						$this->config->isAuthorized($this->senderClientRole, $this->senderAccessToken) &&
						$this->config->isValidClientId($this->recipientClientId));
	}
	
	/*
	 ------------------------------------------------------------------------------------------------------------------
	 Methods, public
	 ------------------------------------------------------------------------------------------------------------------
	 */
	
	// Updates the event with content properties transmitted to the receiver client app
	
	public function updateContent($eventType, $eventSubType, $eventParams) {
		$this->eventType = $eventType;
		$this->eventSubType = $eventSubType;
		$this->eventParams = $eventParams;
	}
	
	// Updates the event flags (coded as strings)
	
	public function updateFlags($buffered, $logged, $interceptable) {
		$this->buffered = $buffered;
		$this->logged = $logged;
		$this->interceptable = $interceptable;
	}
	
	// Updates the event with properties required for authentication
	
	public function updateAuthInfo($senderClientId, $senderClientRole, $senderAccessToken) {
		$this->senderClientId = $senderClientId;
		$this->senderClientRole = $senderClientRole;
		$this->senderAccessToken = $senderAccessToken;
	}
	
	// Initiates the event with content from another CREvent
	
	public function initWithOtherCrEvent($otherEvent) {
		$this->eventType = $otherEvent->eventType;
		$this->eventSubType = $otherEvent->subType;
		$this->eventParams = $otherEvent->eventParams;
	}
	
	// Initiates the event with server-sent event data parameters, separated by config->eventDataSplitChar
	
	public function initWithMsgEventData($msgEventData) {
		$this->eventParams = explode($this->config->eventDataSplitChar, $msgEventData);
		$this->eventType = array_shift($this->eventParams);
		$this->eventSubType = array_shift($this->eventParams);
		$this->buffered = array_shift($this->eventParams);
		$this->logged = array_shift($this->eventParams);
		$this->interceptable = array_shift($this->eventParams);
		$this->sendCt = array_shift($this->eventParams);
		$this->receiveCt = array_shift($this->eventParams);
		$this->senderClientId = array_shift($this->eventParams);
	}
	
	// Sends the event if ready to send
	
	public function send() {
		if ($this->getReadyToSend()) {
			CRUtil::sendCrEvent($this->config, $this);
		}
		else {
			$this->config->logWarn("send, notReadyToSend, [".$this->getMsgEventData()."]");
		}
	}
	
	/*
	 ------------------------------------------------------------------------------------------------------------------
	 Computed properties, public, but primarily intended for internal use and testing
	 ------------------------------------------------------------------------------------------------------------------
	 */
	
	// Returns the server-sent event parameters as an array
	
	public function getMsgEventParams() {
		$msgEventParams = $this->eventParams;
		array_unshift($msgEventParams, $this->eventType, $this->eventSubType, $this->buffered, $this->logged, $this->interceptable, $this->sendCt, $this->receiveCt, $this->senderClientId);
		return $msgEventParams;
	}
	
	// Returns the server-sent event parameters as a string separated by config->eventDataSplitChar
	
	public function getMsgEventData() {
		return implode($this->config->eventDataSplitChar, $this->getMsgEventParams());
	}
	
	/*
	 ------------------------------------------------------------------------------------------------------------------
	 Properties, private
	 ------------------------------------------------------------------------------------------------------------------
	 */
	
	// Configuration object
	
	private object $config;
	
}
