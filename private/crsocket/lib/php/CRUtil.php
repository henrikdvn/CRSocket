<?php

/*
 ------------------------------------------------------------------------------------------------------------------
 This class contains static properties and methods for internal use only
 ------------------------------------------------------------------------------------------------------------------
 */

class CRUtil {
	
	/*
	 ------------------------------------------------------------------------------------------------------------------
	 Socket handling utilities. These may need to be changed depending on the server OS and PHP version.
	 The function calls are prepended with "@" to avoid default displaying/logging of low level error messages.
	 ------------------------------------------------------------------------------------------------------------------
	 */
	
	// Creates a socketServer that can be used to receive data data from the socket URL
	
	static function initSocketServer($url) {
		return @stream_socket_server($url, $errno, $errstr, STREAM_SERVER_BIND|STREAM_SERVER_LISTEN);
	}
	
	// Returns a stream resource when data is available from the socketServer.
	// Returns false when the timeout period has expired or an error has occured.
	
	static function acceptSocketConn($socketServer, $timeout) {
		return @stream_socket_accept($socketServer, $timeout);
	}
	
	// Retrieves a string ending with "\n" from the socketServer
	
	static function receiveFromSocket($socketServer, $maxLength) {
		return @stream_get_line($socketServer, $maxLength, "\n");
	}
	
	// Shuts down a socketServer
	
	static function shutdownSocket($socket) {
		return @stream_socket_shutdown($socket, STREAM_SHUT_RDWR);
	}
	
	// Establishes a socketClient that can be used to send data to the socket URL
	
	static function initSocketClient($url) {
		return @stream_socket_client($url, $errno, $errstr);
	}
	
	// Sends a string to the socketClient
	
	static function sendToSocket($socketClient, $str) {
		$strLength = strlen($str) + 1;
		$sentLength = @stream_socket_sendto($socketClient, "$str\n");
		return ($strLength == $sentLength);
	}
	
	// Socket path and URL generators
	
	static function genSocketPath($config, $clientId) {
		return $config->crsSockRoot."/$clientId.sock";
	}
	
	static function genSocketLogPath($config, $clientId) {
		return $config->crsLogRoot."/$clientId.log";
	}
	
	static function genSocketURL($config, $clientId) {
		return "unix://".self::genSocketPath($config, $clientId);
	}
	
	/*
	 ------------------------------------------------------------------------------------------------------------------
	 Event handling utilities
	 ------------------------------------------------------------------------------------------------------------------
	 */
	
	// Transmits a "crEvent" message to a client socket, identified by its internal recipientClientId
	
	static function sendCrEvent($config, $crEvent) {
		$recipientClientId = $crEvent->recipientClientId;
		$socketClient = self::genSocketClient($config, $recipientClientId, $config->crEventMaxAttempts);
		if (is_resource($socketClient)) {
			$msgEventStr = self::genCrMsgEventString($config, $crEvent);
			$success = self::sendToSocket($socketClient, $msgEventStr);
			if (!$success) {
				$config->logWarn("sendCrEvent, sendToSocketFailed, $recipientClientId, $msgEventStr");
			}
		}
		else {
			$config->logWarn("sendCrEvent, noSocketClient, $recipientClientId");
		}
	}
	
	// Transmits a message event to a client socket, identified by the recipientClientId
	
	static function sendMsgEvent($config, $recipientClientId, $clientId, $clientRole, $accessToken, $msgEventType, $msgEventData) {
		$socketClient = self::genSocketClient($config, $recipientClientId, $config->msgEventMaxAttempts);
		if (is_resource($socketClient)) {
			$msgEventStr = self::genMsgEventString($config->appId, $clientId, $clientRole, $accessToken, $msgEventType, $msgEventData);
			$success = self::sendToSocket($socketClient, $msgEventStr);
			if (!$success) {
				$config->logWarn("sendMsgEvent, sendToSocketFailed, $recipientClientId, $msgEventStr");
			}
		}
		else {
			$config->logWarn("sendMsgEvent, noSocketClient, $recipientClientId");
		}
	}
	
	// Generates a resource for writing to a client socket identified by the recipientClientId.
	// Will retry $config->sendEventMaxAttempts times, delayed by $config->sendEventRetryDtSecs.
	
	static function genSocketClient($config, $recipientClientId, $maxAttempts) {
		$socketURL = self::genSocketURL($config, $recipientClientId);
		$noOfAttempts = 0;
		$socketClient = self::initSocketClient($socketURL);
		while (!is_resource($socketClient) && $noOfAttempts < $maxAttempts) {
			$noOfAttempts += 1;
			sleep($config->sendEventRetryDtSecs);
			$socketClient = self::initSocketClient($socketURL);
		}
		return $socketClient;
	}
	
	// Logs a "crEvent" message event string
	
	static function logCrEvent($config, $crEvent) {
		$msgEventStr = self::genCrMsgEventString($config, $crEvent);
		$socketLogPath = self::genSocketLogPath($config, $crEvent->recipientClientId);
		file_put_contents($socketLogPath, $crEvent->getMsgEventData()."\n", FILE_APPEND);
	}
	
	// Event data string generators
	
	static function genCrMsgEventString($config, $crEvent) {
		return self::genMsgEventString($config->appId, $crEvent->senderClientId, $crEvent->senderClientRole, $crEvent->senderAccessToken, "crEvent", $crEvent->getMsgEventData());
	}
	
	static function genMsgEventString($appId, $clientId, $clientRole, $accessToken, $msgEventType, $msgEventData) {
		return "$appId;$clientId;$clientRole;".rawurlencode($accessToken).";$msgEventType;".rawurlencode($msgEventData);
	}
	
	/*
	 ------------------------------------------------------------------------------------------------------------------
	 Misc functions
	 ------------------------------------------------------------------------------------------------------------------
	 */
	
	// Deletes a file if it exists
	
	static function unlinkIfExists($filePath) {
		if (file_exists($filePath)) {
			unlink($filePath);
		}
	}
	
	static function createIfNotExists($dirPath) {
		if (!file_exists($dirPath)) {
			mkdir($dirPath);
		}
	}

}
