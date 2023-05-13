/*
 ------------------------------------------------------------------------------------------------------------------
 This class represents a crEvent which facilitates communication between controller and responder apps.
 It can transmit any array of strings that don't contain the #config.eventDataSplitChar character
 In addition to eventType and parameters, it transmits info about the event origin, and an optional eventSubType.
 It also contains timing info.
 ------------------------------------------------------------------------------------------------------------------
 */

class CREvent extends Event {
	
	constructor(config) {
		super("crEvent");
		this.#config = config;
	}
	
	/*
	 ------------------------------------------------------------------------------------------------------------------
	 Properties, public
	 ------------------------------------------------------------------------------------------------------------------
	 */
	
	// Event type
	
	eventType = "";
	
	// Optional subtype, providing explanatory information not affecting event handling
	
	eventSubType = "";
	
	// An abitrary array of strings, appended to the event properties in the server-sent event data string.
	// The strings must not contain the #config->$eventDataSplitChar character.
	
	eventParams = [];
	
	// If true this event will be buffered if the client is offline and sent (if possible) when it becomes online
	
	buffered = false;
	
	// If true this event will always be logged by the eventSender
	
	logged = false;
	
	// If true this event can be intercepted/modified by the sendevent and eventsource resources
	
	interceptable = true;
	
	// Calendar time in millisecs indicating when the event was sent by the sender client app
	
	sendCt = NaN;
	
	// Calendar time in millisecs indicating when the event was received by the target client app
	
	receiveCt = NaN;
	
	// Id of the sender client app
	
	senderClientId = "";
	
	// Role of the event sender, not transmitted to the target client
	
	senderClientRole = "";
	
	// Access token of the event sender, not transmitted to the target client
	
	senderAccessToken = "";
	
	// Id of the client app to which the event is sent, not transmitted to the target client
	
	recipientClientId = "";
	
	/*
	 ------------------------------------------------------------------------------------------------------------------
	 Computed properties, public
	 ------------------------------------------------------------------------------------------------------------------
	 */
	
	// Returns true if the event contains the required properties and credentials to be sent
	
	get readyToSend() {
		return (this.#config.isValidCrEventType(this.eventType) &&
						this.#config.isValidClientId(this.senderClientId) &&
						this.#config.isValidClientRole(this.senderClientRole) &&
						this.#config.isValidAccessToken(this.senderAccessToken) &&
						this.#config.isValidClientId(this.recipientClientId));
	}
	
	/*
	 ------------------------------------------------------------------------------------------------------------------
	 Methods, public
	 ------------------------------------------------------------------------------------------------------------------
	 */
	
	// Updates the event with content properties transmitted to the receiver client app
	
	updateContent(eventType, eventSubType, eventParams) {
		this.eventType = eventType;
		this.eventSubType = eventSubType;
		this.eventParams = eventParams;
	}
	
	// Updates the event flags
	
	updateFlags(buffered, logged, interceptable) {
		this.buffered = buffered;
		this.logged = logged;
		this.interceptable = interceptable;
	}
	
	// Updates the event with properties required for authentication
	
	updateAuthInfo(senderClientId, senderClientRole, senderAccessToken) {
		this.senderClientId = senderClientId;
		this.senderClientRole = senderClientRole;
		this.senderAccessToken = senderAccessToken;
	}
	
	// Initiates the event with content from another CREvent
	
	initWithOtherCrEvent(otherEvent) {
		this.eventType = otherEvent.eventType;
		this.eventSubType = otherEvent.subType;
		this.eventParams = otherEvent.eventParams;
	}
	
	// Initiates the event with server-sent event data parameters, separated by #config->eventDataSplitChar
	
	initWithMsgEventData(msgEventData) {
		this.eventParams = msgEventData.split(this.#config.eventDataSplitChar);
		this.eventType = this.eventParams.shift();
		this.eventSubType = this.eventParams.shift();
		this.buffered = Boolean(this.eventParams.shift() === "true");
		this.logged = Boolean(this.eventParams.shift() === "true");
		this.interceptable = Boolean(this.eventParams.shift() === "true");
		this.sendCt = parseInt(this.eventParams.shift(), 10);
		this.receiveCt = parseInt(this.eventParams.shift(), 10);
		this.senderClientId = this.eventParams.shift();
	}
	
	// Sends the event if it contains the minimum required properties (eventType, sender info and recipientClientId
	
	send() {
		if (this.readyToSend) {
			this.sendCt = Date.now();
			let requestStr = CRUtil.genMsgEventRequestStr(this.senderClientId, this.senderClientRole, this.senderAccessToken, this.recipientClientId, "crEvent", this.msgEventData);
			CRUtil.sendRequest(requestStr);
		}
		else {
			console.warn("notReadyToSend", this.eventType, this.senderClientId, this.senderClientRole, this.senderAccessToken, this.recipientClientId);
		}
	}
	
	/*
	 ------------------------------------------------------------------------------------------------------------------
	 Computed properties, public, but primarily intended for internal use and testing
	 ------------------------------------------------------------------------------------------------------------------
	 */
	
	// Returns the server-sent event parameters as an array
	
	get msgEventParams() {
		return [this.eventType, this.eventSubType, this.buffered, this.logged, this.interceptable, this.sendCt, this.receiveCt, this.senderClientId].concat(this.eventParams);
	}
	
	// Returns the message event parameters as a string separated by #config->eventDataSplitChar
	
	get msgEventData() {
		return this.msgEventParams.join(this.#config.eventDataSplitChar);
	}
	
	/*
	 ------------------------------------------------------------------------------------------------------------------
	 Properties, private
	 ------------------------------------------------------------------------------------------------------------------
	 */
	
	// Configuration object
	
	#config = null;
}
