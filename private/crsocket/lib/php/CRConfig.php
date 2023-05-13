<?php

/*
 ------------------------------------------------------------------------------------------------------------------
 This class contains configuration properties and methods used by other classes.
 Subclasses may add and override properties and methods as needed.
 ------------------------------------------------------------------------------------------------------------------
 */

class CRConfig {
	
	function __construct($appId, $resourceName, $crsLogRoot, $crsDataRoot, $crsSockRoot, $appLogRoot, $appDataRoot) {
		$this->appId = $appId;
		$this->resourceName = $resourceName;
		$this->crsLogRoot = $crsLogRoot;
		$this->crsDataRoot = $crsDataRoot;
		$this->crsSockRoot = $crsSockRoot;
		$this->appLogRoot = $appLogRoot;
		$this->appDataRoot = $appDataRoot;
	}
	
	/*
	 ------------------------------------------------------------------------------------------------------------------
	 Properties, public
	 ------------------------------------------------------------------------------------------------------------------
	 */
	
	//
	
	public bool $debugMode = false;
	
	// The current CRSocket version
	
	public string $crSocketVersion = "1.13";
	
	// Name of the current appId
	
	public string $appId = "";
	
	// Name of the current server resource
	
	public string $resourceName;
	
	// Path to the directory used for logging
	
	public string $appLogRoot;
	
	// Path to the directory used for data files
	
	public string $appDataRoot;
	
	// Path to the directory used for socket files
	
	public string $crsSockRoot;
	
	// Path to the directory used for data files pertaining to the current IP domain
	
	public string $crsDataRoot;
	
	// Delay between a "release" event is sent to an active spocket before it is attached to the current process
	
	public int $socketReleaseDtSecs = 1;
	
	// Max amount of secs allowed before socket conditions are checked by a CREventSource
	
	public int $socketAcceptDtSecs = 10;
	
	// Max amount of secs allowed between "alive" events in a CREventReceiver before the requesting client is considered inactive
	
	public int $maxPrevAliveDtSecs = 25;
	
	// Delay between attempts to establish connection to a socket by a CREventSender
	
	public int $sendEventRetryDtSecs = 1;
	
	// Max no of attempts to establish connection for a crEvent to a socket by a CREventSender
	
	public int $crEventMaxAttempts = 4;
	
	// Max no of attempts to establish connection for a msgEvent to a socket by a CREventSender
	
	public int $msgEventMaxAttempts = 4;
	
	// Max length of event strings that can transmitted between a CREventSender and a CREventSource
	
	public int $maxEventDataStrLength = 8192;
	
	// Character used to split data elements in server-sent events
	
	public string $eventDataSplitChar = ",";
	
	
	/*
	 ------------------------------------------------------------------------------------------------------------------
	 Methods, public
	 ------------------------------------------------------------------------------------------------------------------
	 */
	
	// Returns true if the accessToken string is authorized for the clientRole
	
	public function isAuthorized($clientRole, $accessToken) {
		return true;
	}
	
	// Returns true if the crEvent is accepted for sending from the requesting client
	// Can also modify event data and perform various other actions
	
	public function acceptAtEventSender($crClient, $crEvent) {
		return true;
	}
	
	// Returns true if the crEvent is accepted for forwarding to the requesting client
	// Can also modify event data and perform various other actions.
	
	public function acceptAtEventSource($crClient, $crEvent) {
		return true;
	}
	
	// Returns true if the clientId string is syntactically correct
	
	public function isValidClientId($clientId) {
		return preg_match("/^[0-9]{6}$/", $clientId);
	}
	
	// Returns true if the clientRole string represents a valid client role
	
	public function isValidClientRole($clientRole) {
		return $clientRole == "responder" || $clientRole == "controller";
	}
	
	// Returns true if the accessToken string is syntactically correct
	// Defaults to non empty string of printable ascii characters, except space
	
	public function isValidAccessToken($accessToken) {
		return preg_match("/^[!-~]+$/", $accessToken);
	}
	
	// Logs a message to a file corresponding to the current $resourceName in the assigned $appLogRoot directory
	
	public function logMsg($msg) {
		$msgStr = date("y.m.d H:i:s")." $msg";
		file_put_contents($this->appLogRoot."/".$this->resourceName.".log", "$msgStr\n", FILE_APPEND);
	}
	
	// Logs a message if debugMode is true
	
	public function logDebug($msg) {
		if ($this->debugMode) {
			$this->logMsg("dbg $msg");
		}
	}
	
	// Logs a warning message
	
	public function logWarn($msg) {
		$this->logMsg("wrn $msg");
	}
	
	
}
