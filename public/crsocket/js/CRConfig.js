/*
 ------------------------------------------------------------------------------------------------------------------
 This class contains configuration properties and methods used by other classes.
 Subclasses may add and override properties and methods as needed.
 ------------------------------------------------------------------------------------------------------------------
 */

class CRConfig {
	
	constructor(appId) {
		this.appId = appId;
	}
	
	/*
	 ------------------------------------------------------------------------------------------------------------------
	 Properties, public
	 ------------------------------------------------------------------------------------------------------------------
	 */
	
	crSocketVersion = "1.13";
	
	// String which uniquely identifies a controller/responder pair served by the current IP domain
	
	appId = "";
	
	// Delay in millisecs to allow state updates to complete
	
	stateUpdateCompleteDt = 100;
	
	// Delay in millisecs to allow state updates involving server interaction to complete
	
	serverInteractionCompleteDt = 1000;
	
	// Minimum delay between ordinary crEvents
	
	minCrEventDt = 1000;
	
	// Time in millisecs between ping or other partner events sent by controllers in the interacting state
	
	interactingMaxEventOutDt = 10 * 1000;
	
	// Time in millisecs between ping events sent by controllers in the searching state
	
	searchingMaxEventOutDt = 5 * 1000;
	
	// Max time in millisecs allowed between events for the partner to be considered active
	
	partnerActiveMaxEventInDt = 25 * 1000;
	
	// Delay before attempting to retrieve a new clientId if the current one is invalid.
	
	invalidClientIdRetryDt = 5 * 1000;
	
	// Delay before reopening the eventSource after being aborted (while open).
	
	eventSourceAbortedReopenDt = 5 * 1000;
	
	// Delay between alive-events sent to the eventSource.
	
	eventSourceSendAliveDt = 12 * 1000;
	
	// Regular expression defining syntactically valid clientId strings
	
	validClientIdRegExp = /^[0-9]{6}$/;
	
	// Regular expression defining syntactically valid accessToken strings
	
	validAccessTokenRegExp = /^[!-~]+$/;
	
	// Regular expression defining syntactically valid eventType strings
	
	validCrEventTypeRegExp = /^[0-9A-Za-z]+$/;
	
	// Regular expression defining syntactically valid eventSubType strings
	
	validCrEventSubTypeRegExp = /^[0-9A-Za-z]*$/;
	
	// Regular expression defining syntactically valid eventParam strings
	
	validEventParamRegExp = /^[^,]*$/;
	
	// Character used to split event data items. The items must not contain this character.
	
	eventDataSplitChar = ",";
	
	/*
	 ------------------------------------------------------------------------------------------------------------------
	 Methods, public
	 ------------------------------------------------------------------------------------------------------------------
	 */
	
	// Returns true if the clientId string is syntactically correct
	
	isValidClientId(clientId) {
		return Boolean(clientId && clientId.match(this.validClientIdRegExp));
	}
	
	// Returns true if the clientRole string represents a valid client role
	
	isValidClientRole(clientRole) {
		return Boolean(clientRole == "controller" || clientRole == "responder");
	}
	
	// Returns true if the accessToken string is syntactically correct.
	
	isValidAccessToken(accessToken) {
		return Boolean(accessToken && accessToken.match(this.validAccessTokenRegExp));
	}
	
	// Returns true if the crEvent eventType string is syntactically correct
	
	isValidCrEventType(eventType) {
		return Boolean(eventType && eventType.match(this.validCrEventTypeRegExp));
	}
	
	// Returns true if the crEvent eventType string is syntactically correct
	
	isValidCrEventSubType(eventType) {
		return Boolean(eventType && eventType.match(this.validCrEventSubTypeRegExp));
	}
	
}
