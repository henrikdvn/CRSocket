<?php

include_once "CRUtil.php";
include_once "CREvent.php";
include_once "CRClient.php";

/*
 ------------------------------------------------------------------------------------------------------------------
 class_CREventSource
 This class generates a text/event-stream consisting of server-sent events sent to the requesting client.
 Sender and event info is retrieved from strings read from a socket named $clientId.sock,
 located in the $config->crsSockRoot directory.
 ------------------------------------------------------------------------------------------------------------------
 */

class CREventSource extends CRClient {
	
	/*
	 ------------------------------------------------------------------------------------------------------------------
	 Methods, public
	 ------------------------------------------------------------------------------------------------------------------
	 */
	
	// Establishes the socket server and echoes a "hello" event if successful.
	// Echoes an "aborted" event and terminates if credentials are invalid or the socket could not be activated.
	// If the socket is used by another process a "release" event will be written to it before a new socket is established.
	
	public function open() {
		$this->pid = getMyPid();
		$this->appId = $this->config->appId;
		$this->description .= ", $this->pid";
		$this->sendEventStreamHeaders();
		if ($this->config->isValidClientRole($this->clientRole)) {
			if ($this->config->isValidClientId($this->clientId)) {
				$this->socketPath = CRUtil::genSocketPath($this->config, $this->clientId);
				$this->socketURL = CRUtil::genSocketURL($this->config, $this->clientId);
				if ($this->config->isValidAccessToken($this->accessToken)) {
					if ($this->config->isAuthorized($this->clientRole, $this->accessToken)) {
						$socketClient = CRUtil::initSocketClient($this->socketURL);
						if (is_resource($socketClient)) {
							$this->config->logDebug("open, releasing, $this->pid, $this->clientId");
							$msgEventStr = CRUtil::genMsgEventString($this->appId, $this->clientId, $this->clientRole, $this->accessToken, "release", "$this->pid");
							CRUtil::sendToSocket($socketClient, $msgEventStr);
							sleep($this->config->socketReleaseDtSecs);
						}
						$this->config->logDebug("open, initiating, $this->pid, $this->clientId");
						CRUtil::unlinkIfExists($this->socketPath);
						$this->socketServer = CRUtil::initSocketServer($this->socketURL);
						if ($this->getSocketAlive()) {
							register_shutdown_function([&$this, "shutdown"]);
							$this->echoEvent("hello", "$this->pid");
							$this->eventLoop();
						}
						else {
							$this->echoAborted("noSocketServer");
						}
					}
					else {
						$this->echoAborted("notAuthorized");
					}
				}
				else {
					$this->echoAborted("invalidAccessToken");
				}
			}
			else {
				$this->echoAborted("invalidClientId");
			}
			
		}
		else {
			$this->echoAborted("invalidRole");
		}
	}
	
	/*
	 ------------------------------------------------------------------------------------------------------------------
	 Properties, private
	 ------------------------------------------------------------------------------------------------------------------
	 */
	
	private int $pid = 0;
	private int $releaserPid = 0;
	
	// Socket path and URL
	
	private string $socketPath;
	private string $socketURL;
	
	// The socket server
	
	private $socketServer;
	
	// Termination properties
	
	private string $shutdownType = "";
	private string $abortReason = "";
	private bool $closed = false;
	private bool $released = false;
	
	// Calendar time when the previous "alive" event was received
	
	private int $prevAliveCt = 0;
	
	
	/*
	 ------------------------------------------------------------------------------------------------------------------
	 Methods, private
	 ------------------------------------------------------------------------------------------------------------------
	 */
	
	// Returns true if the time since the last "alive" event received from the client is less than config->maxPrevAliveDtSecs
	
	private function getClientActive() {
		$prevAliveDt = time() - $this->prevAliveCt;
		return ($prevAliveDt < $this->config->maxPrevAliveDtSecs);
	}
	
	// Returns true if the current socket exists and is availabe for reading
	
	private function getSocketAlive() {
		return (file_exists($this->socketPath) && is_resource($this->socketServer));
	}
	
	// Is called before the process is shut down and echoes an event that reflects the cause of termination
	// Also deletes the socket files.
	
	public function shutdown() {
		switch ($this->shutdownType) {
			case "closed":
				$this->config->logDebug("closed, $this->pid, $this->clientId");
				$this->echoEvent("closed", "$this->pid");
				break;
			case "aborted":
				$this->echoAborted($this->abortReason);
				break;
			default:
				$this->config->logDebug("shutdown, $this->pid, $this->clientId");
				$this->echoEvent("shutdown", "$this->pid");
				break;
		}
		if ($this->getSocketAlive()) {
			$this->config->logDebug("shutdown, removingSocket, $this->pid, $this->clientId");
			CRUtil::unlinkIfExists($this->socketPath);
		}
	}
	
	private function echoAborted($abortReason) {
		$this->config->logDebug("echoAborted, $this->pid, $this->clientId, $this->abortReason, $this->releaserPid");
		$this->echoEvent("aborted", "$this->pid,$abortReason,$this->releaserPid");
	}
	
	// Listens for events that are sent to the socket and processes them (see below)
	// It will exit (and terminate the process) when it receives a "close" event
	// It will also exit the socket is no longer alive and when the client is registered as inactive
	// The latter conditions will be checked after event reception and/or every config->socketAcceptDtSecs
	
	private function eventLoop() {
		$this->prevAliveCt = time();
		while (!$this->closed && !$this->released && $this->getSocketAlive() && $this->getClientActive()) {
			$eventStreamFp = CRUtil::acceptSocketConn($this->socketServer, $this->config->socketAcceptDtSecs);
			if (is_resource($eventStreamFp)) {
				$eventStr = CRUtil::receiveFromSocket($eventStreamFp, $this->config->maxEventDataStrLength);
				if ($eventStr) {
					while ($eventStr && !$this->closed && !$this->released) {
						$this->processEvent($eventStr);
						if (!$this->closed && !$this->released) {
							$eventStr = CRUtil::receiveFromSocket($eventStreamFp, $this->config->maxEventDataStrLength);
						}
					}
				}
			}
		}
		if ($this->closed) {
			$this->shutdownType = "closed";
		}
		elseif ($this->released) {
			$this->shutdownType = "aborted";
			$this->abortReason = "releasedByOther";
		}
		elseif (!$this->getClientActive()) {
			$this->shutdownType = "aborted";
			$this->abortReason = "clientNotAlive";
		}
		elseif (!$this->getSocketAlive()) {
			$this->shutdownType = "aborted";
			$this->abortReason = "socketNotAlive";
		}
	}
	
	// Processes an event
	// Only accepts "alive" and "close" events from it's own client. Other events from this client are ignored
	// Events of type "crEvent" with eventType "reject" will be echoed to the client without any processing
	// Events of type "crEvent" from senders with ivalid partner roles are answered with "reject" events and ignored
	// Other "crEvent" events will only be echoed if not interceptable or accepted by the config->acceptAtEventSource function
	
	private function processEvent($eventStr) {
		if ($eventStr) {
			$i = 0;
			$eventComps = explode(";", $eventStr);
			$senderAppId = $eventComps[$i++];
			$senderClientId = $eventComps[$i++];
			$senderClientRole = $eventComps[$i++];
			$senderAccessToken = rawurldecode($eventComps[$i++]);
			$eventType = $eventComps[$i++];
			if ($eventType) {
				$this->prevAliveCt = time();
				$eventData = rawurldecode($eventComps[$i++]);
				switch ($eventType) {
					case "alive":
					case "close":
					case "release":
						if ($this->appId == $senderAppId) {
							$eventParams = explode($this->config->eventDataSplitChar, $eventData);
							if ($this->clientId == $senderClientId) {
								$senderPid = intval($eventParams[0]);
								switch ($eventType) {
									case "alive":
										if ($this->pid == $senderPid) {
											$this->echoEvent("alive", $this->pid);
										}
										else {
											$this->config->logDebug("processEvent, pidMismatch, $this->description, $eventType, [$eventData]");
										}
										break;
									case "close":
										if ($this->pid == $senderPid) {
											$this->closed = true;
										}
										else {
											$this->config->logDebug("processEvent, pidMismatch, $this->description, $eventType, [$eventData]");
										}
										break;
									case "release":
										$this->releaserPid	= $senderPid;
										$this->released = true;
										break;
								}
							}
							else {
								$this->config->logWarn("processEvent, clientIdMismatch, $this->description, $senderClientId, $eventType, [$eventData]");
							}
						}
						else {
							$this->config->logWarn("processEvent, appIdMismatch, $this->description, $senderAppId, $eventType, [$eventData]");
						}
						break;
					case "crEvent":
						$crEvent = new CREvent($this->config);
						$crEvent->initWithMsgEventData($eventData);
						if ($crEvent->eventType == "reject") {
							$this->echoEvent($eventType, $eventData);
						}
						else {
							if ($senderAppId == $this->appId) {
								if ($senderClientRole == $this->partnerClientRole) {
									$crEvent->updateAuthInfo($senderClientId, $senderClientRole, $senderAccessToken);
									$crEvent->recipientClientId = $this->clientId;
									$interceptable = ($crEvent->interceptable == "true");
									if (!$interceptable || $this->config->acceptAtEventSource($this, $crEvent)) {
										$newEventData = $crEvent->getMsgEventData();
										$this->echoEvent($eventType, $newEventData);
									}
									else {
										$this->config->logDebug("processEvent, interceptFailed, $this->description, [$eventData]");
									}
								}
								else {
									$this->config->logWarn("processEvent, invalidPartnerRole, $this->description, $senderClientRole, [$eventData]");
									if ($crEvent->eventType == "ping") {
										$replyCrEvent = $this->genCrEvent("reject", "invalidPartnerRole");
										$replyCrEvent->recipientClientId = $crEvent->senderClientId;
										$replyCrEvent->send();
									}
								}
							}
							else {
								$this->config->logWarn("processEvent, appIdMismatch, $this->description, $senderAppId, [$eventData]");
								if ($crEvent->eventType == "ping") {
									$replyCrEvent = $this->genCrEvent("reject", "appIdMismatch");
									$replyCrEvent->recipientClientId = $crEvent->senderClientId;
									$replyCrEvent->send();
								}
							}
						}
						break;
					default:
						$this->config->logWarn("processEvent, unknownEventType, $this->description, [$eventData]");
						break;
				}
			}
			else {
				$this->config->logWarn("processEvent, noEventType, $this->description, [$eventData]");
			}
		}
		else {
			$this->config->logWarn("processEvent, noEventStr");
		}
	}
	
	// Sends the headers required by server-sent events.
	// NB! The enclosing resource must not be subjected to any kind of buffering mechanism
	
	private function sendEventStreamHeaders() {
		header("Content-Type: text/event-stream");
		header("Cache-Control: no-cache");
		flush();
	}
	
	// Echoes an event.
	
	private function echoEvent($type, $data = "") {
		if ($type) {
			$encodedData = rawurlencode($data);
			echo "event: $type\n";
			echo "data: $encodedData\n";
			echo "\n";
			flush();
		}
		else {
			$this->config->logWarn("echoEvent, noType");
		}
	}
}
