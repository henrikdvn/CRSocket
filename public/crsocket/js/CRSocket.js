/*
 ------------------------------------------------------------------------------------------------------------------
 This class facilitates bidirectional communication between controller and responder clients
 ------------------------------------------------------------------------------------------------------------------
 */

class CRSocket extends CRStateMachine {
	
	constructor(config, clientRole) {
		super();
		this._genContext();
		this.#config = config;
		this.#clientRole = clientRole;
		if (this.#config.isValidClientRole(this.#clientRole)) {
			this.#eventReceiver = new CREventReceiver(this.#config, this.#clientRole, this.#clientId, this.#accessToken);
			this.#eventSender = new CREventSender(this.#config, this.#clientRole);
		}
		else {
			console.error("invalidClientRole", this.#clientRole);
		}
	}
	
	/*
	 ------------------------------------------------------------------------------------------------------------------
	 Computed properties, public
	 ------------------------------------------------------------------------------------------------------------------
	 */
	
	// Configuration properties
	
	get clientId() {
		return this.#clientId;
	}
	
	get accessToken() {
		return this.#accessToken;
	}
	
	set accessToken(newValue) {
		if (this.#accessToken != newValue) {
			this.#accessToken = newValue;
			this._dispatchEventType("accessTokenChanged", newValue);
		}
		this.#eventReceiver.accessToken = newValue;
		this.#eventSender.accessToken = newValue;
	}
	
	get partnerClientId() {
		return this.#partnerClientId;
	}
	
	set partnerClientId(newValue) {
		if (this.#partnerClientId != newValue) {
			this.#partnerClientId = newValue;
			this._dispatchEventType("partnerClientIdChanged", newValue);
		}
		this.#eventSender.partnerClientId = newValue;
	}
	
	// True if the socket is active
	
	get active() {
		return this._clientActive && this._clientIdAssigned;
	}
	
	// True if the socket is active and connected to an eventSource
	
	get connected() {
		return this.active && this._eventReceiverOpen;
	}
	
	// True if the socket is connected and able to receive and send events from/to a partner
	
	get paired() {
		return this.connected && this._eventSenderReady;
	}
	
	// True if the socket is able to send events to a partner
	
	get readyToSend() {
		return this._eventSenderReady;
	}
	
	/*
	 ------------------------------------------------------------------------------------------------------------------
	 Methods, public
	 ------------------------------------------------------------------------------------------------------------------
	 */
	
	// Initiates dynamic variables and activates the app
	
	init() {
		this.addEventListener("stateChanged", this.#onStateChanged.bind(this));
		
		this.#eventReceiver.init();
		this.#eventReceiver.addEventListener("stateChanged", this.#onEventReceiverStateChanged.bind(this));
		this.#eventReceiver.addEventListener("subStateChanged", this.#onEventReceiverSubStateChanged.bind(this));
		this.#eventReceiver.addEventListener("crEventReceived", this.#onEventReceiverCrEventReceived.bind(this));
		this.#eventReceiver.addEventListener("msgEventReceived", this.#onEventReceiverMsgEventReceived.bind(this));
		this.#eventReceiver.addEventListener("eventReceived", this.#onEventReceiverEventReceived.bind(this));
		this.#eventReceiver.addEventListener("msgEventSent", this.#onEventReceiverMsgEventSent.bind(this));
		this.#eventReceiver.addEventListener("valueUpdated", this.#onValueUpdated.bind(this));
		
		this.#eventSender.init();
		this.#eventSender.addEventListener("stateChanged", this.#onEventSenderStateChanged.bind(this));
		this.#eventSender.addEventListener("subStateChanged", this.#onEventSenderSubStateChanged.bind(this));
		this.#eventSender.addEventListener("crEventSent", this.#onEventSenderCrEventSent.bind(this));
		this.#eventSender.addEventListener("valueUpdated", this.#onValueUpdated.bind(this));
		
		window.addEventListener("beforeunload", this.#onBeforeUnload.bind(this));
		window.addEventListener("online", this.#onOnline.bind(this));
		window.addEventListener("offline", this.#onOffline.bind(this));
		
		document.addEventListener("visibilitychange", this.#onVisibilityChange.bind(this));
		
		this.#onClientActiveChanged();
		this.#clientId = this.localStorageGet("clientId");
	}
	
	// Sends a crEvent with specific parameters, returns true if successful
	
	sendCrEventWithParams(eventType, eventSubType = "", eventParams = [], buffered = false, logged = false, interceptable = true) {
		let crEvent = this.genCrEvent(eventType, eventSubType, eventParams, buffered, logged, interceptable);
		if (crEvent) {
			if (this.sendCrEvent(crEvent)) {
				return true
			}
			else {
				console.warn("sendCrEventWithParams, crEventNotSent");
				return false;
			}
		}
		else {
			console.warn("sendCrEventWithParams, noCrEvent");
			return false;
		}
	}
	
	// Generates a crEvent
	
	genCrEvent(eventType, eventSubType = "", eventParams = [], buffered = false, logged = false, interceptable = true) {
		if (this.#eventSender.state == "ready") {
			let crEvent = this.#eventSender.genCrEvent(eventType, eventSubType, eventParams, buffered, logged, interceptable);
			return crEvent;
		}
		else {
			console.warn("genCrEvent, eventSenderNotReady");
			return null;
		}
	}
	
	// Sends a crEvent, returns true if successful
	
	sendCrEvent(crEvent) {
		if (this.#eventSender.state == "ready") {
			if (crEvent.readyToSend) {
				this.#eventSender.sendCrEvent(crEvent);
				this.#restartPingSeq();
				return true;
			}
			else {
				console.warn("sendCrEvent, crEventNotReadyToSend");
				return false;
			}
		}
		else {
			console.warn("sendCrEvent, eventSenderNotReady");
			return false;
		}
	}
	
	
	// LocalStorage utilities
	
	localStorageSet(key, value) {
		CRUtil.localStorageSet(this.#config.appId, this.#clientRole, key, value);
	}
	
	localStorageGet(key) {
		return CRUtil.localStorageGet(this.#config.appId, this.#clientRole, key);
	}
	
	localStorageRemove(key) {
		CRUtil.localStorageRemove(this.#config.appId, this.#clientRole, key);
	}
	
	/*
	 ------------------------------------------------------------------------------------------------------------------
	 Properties, private or protected
	 ------------------------------------------------------------------------------------------------------------------
	 */
	
	// CRConfig object, initiated by the constructor
	
	#config = null;
	
	// clientRole ("controller" or "responder"), initiated by the contstructor
	
	#clientRole = "";
	
	// CREventReceiver object, initiated by the constructor
	
	#eventReceiver;
	
	// CREventSender object, initiated by the constructor
	
	#eventSender;
	
	// Timer, initiated when the socket is paired
	
	#pingEventTimer;
	
	// CrEvent, initiated when the socket is paired
	
	#pingEvent;
	
	// Timer, initiated when the socket receives an event from the current partner
	
	#partnerInactiveTimer;
	
	// accessToken, provided by the client app
	
	#accessToken = "";
	
	// partnerClientId, provided by the client app,
	// can also be assigned when a responder client receives a ping event from a controller
	
	#partnerClientId = "";
	
	// clientId, retrieved from localStorage or the clientid server resouce
	
	#curClientId = "";
	
	get #clientId() {
		return this.#curClientId;
	}
	
	set #clientId(newValue) {
		var assignDelay = 0;
		if (this.#curClientId != newValue) {
			if (this._eventSenderReady) {
				this.partnerClientId = "";
				assignDelay = this.#config.stateUpdateCompleteDt;
			}
			setTimeout(() => {
				this.#curClientId = newValue;
				this._dispatchEventTypeAsync("clientIdChanged", newValue);
				this.#eventReceiver.clientId = newValue;
				this.#eventSender.clientId = newValue;
				this.#updateState();
			}, assignDelay);
		}
		if (!newValue) {
			setTimeout(this.#retrieveClientId.bind(this), assignDelay + this.#config.stateUpdateCompleteDt);
		}
	}
	
	// True when the client is active
	
	get _clientActive() {
		let active = this._visible && this._online && !this._unloading && !this._paused;
		return active;
	}
	
	// True if the document is visible
	
	get _visible() {
		return document.visibilityState == "visible";
	}
	
	// True if the navigator is online
	
	get _online() {
		return navigator.onLine;
	}
	
	// Set to true when the window.beforeunload event is received
	
	_unloading = false;
	
	// When set to true, the app is temporarilty inactive
	
	#curPaused = false;
	
	get _paused() {
		return this.#curPaused;
	}
	
	set _paused(newValue) {
		if (this.#curPaused != newValue) {
			this.#curPaused = newValue;
			this.#onClientActiveChanged();
		}
	}
	
	// True if a valid clientId has been assigned
	
	get _clientIdAssigned() {
		return this.#config.isValidClientId(this.#clientId);
	}
	
	// True if a valid partnerClientId has been assigned
	
	get _partnerClientIdAssigned() {
		return this.#config.isValidClientId(this.#partnerClientId);
	}
	
	// Event receiver states
	
	get _eventReceiverOpening() {
		return this.#eventReceiver.state == "opening";
	}
	
	get _eventReceiverOpen() {
		return this.#eventReceiver.state == "open";
	}
	
	// Tru if the eventSender is able to send events
	
	get _eventSenderReady() {
		return this.#eventSender.state == "ready";
	}
	
	get _prevEventSenderReady() {
		return this.#eventSender.prevState == "ready";
	}
	
	// True if the socket has received an event from the current parter within the last partnerActiveMaxEventInDt millisecs
	
	get _partnerActive() {
		if (this.#lastPartnerEvent) {
			let eventType = this.#lastPartnerEvent.eventType;
			if (eventType != "inactive" && eventType != "reject") {
				return (Date.now() - this.#lastPartnerEvent.receiveCt) <= this.#config.partnerActiveMaxEventInDt;
			}
			else {
				return false;
			}
		}
		else {
			return false;
		}
	}
	
	// The last event received
	
	#curLastEvent = null;
	
	get #lastEvent() {
		return this.#curLastEvent;
	}
	
	set #lastEvent(newValue) {
		if (this.#curLastEvent !== newValue) {
			this.#curLastEvent = newValue;
			this.#updateState();
			if (this.#lastPartnerEvent) {
				this.#restartPartnerInactiveTimer();
			}
		}
	}
	
	// The last event received from the current partner, if any
	
	get #lastPartnerEvent() {
		if (this.#lastEvent && this.#lastEvent.senderClientId == this.#partnerClientId) {
			return this.#lastEvent;
		}
		else {
			return null;
		}
	}
	
	// Indicates reason if the socket is passive
	
	get #passiveSubState() {
		if (!this.clientId) {
			return "noClientId";
		}
		if (!this.#config.isValidClientId(this.clientId)) {
			return "invalidClientId";
		}
		if (!this._visible) {
			return "notVisible";
		}
		if (!this._online) {
			return "notOnline";
		}
		if (this._paused) {
			return "paused";
		}
		if (this._unloading) {
			return "unloading";
		}
		console.warn("get passiveSubState, noPassiveSubState");
		return "";
	}
	
	// Returns the time in millisecs since the property was last retrieved
	
	get _dt() {
		return CRUtil.dt;
	}
	
	// Determines whether internal state changes will be logged to the console
	
	set _logStateChanges(newValue) {
		super._logStateChanges = newValue;
		this.#eventReceiver._logStateChanges = newValue;
		this.#eventSender._logStateChanges = newValue;
	}
	
	set _logTiming(newValue) {
		this.#eventReceiver._logTiming = newValue;
	}
	
	/*
	 ------------------------------------------------------------------------------------------------------------------
	 Methods, private or protected
	 ------------------------------------------------------------------------------------------------------------------
	 */
	
	// clientId utilities and handlers
	
	_clearClientId() {
		this.localStorageSet("clientId", "");
		this.#clientId = "";
	}
	
	#retrieveClientId() {
		CRUtil.getXmlDoc("../clientid/", this.#onClientIdDocReceived.bind(this));
	}
	
	#onClientIdDocReceived(clientIdDoc) {
		if (clientIdDoc) {
			let receivedClientId = clientIdDoc.documentElement.getAttribute("value");
			if (this.#config.isValidClientId(receivedClientId)) {
				this.localStorageSet("clientId", receivedClientId);
				this.#clientId = receivedClientId;
			}
			else {
				console.warn("onClientIdDocReceived, invalidClientId", receivedClientId);
			}
		}
		else {
			console.warn("onClientIdDocReceived, noClientIdDoc");
		}
	}
	
	// State management
	
	#updateState() {
		if (this._clientActive && this._clientIdAssigned) {
			// active
			if (this._eventReceiverOpen) {
				// connected
				if (this._eventSenderReady) {
					// paired
					if (this._partnerActive) {
						this._state = "interacting";
						this._subState = "";
					}
					else {
						this._state = "searching";
						this._subState = "partnerInactive";
					}
				}
				else {
					this._state = "readyToPair";
					this._subState = this.#eventSender.subState;
				}
			}
			else {
				if (this._eventReceiverOpening) {
					this._state = "connecting";
					this._subState = "";
				}
				else {
					this._state = "readyToConnect";
					this._subState = this.#eventReceiver.subState;
				}
			}
		}
		else {
			this._state = "passive";
			this._subState = this.#passiveSubState;
		}
	}
	
	#onStateChanged() {
		switch (this.state) {
			case "interacting":
				switch (this.prevState) {
					case "searching":
						this.sendCrEventWithParams("ping");
						break;
					case "readyToPair":
						this.sendCrEventWithParams("ping");
						break;
					case "connecting":
						this.sendCrEventWithParams("ping");
						break;
					case "readyToConnect":
					case "passive":
					default:
						console.warn("onStateChanged, invalidPrevState", this.prevState, this.state);
						break;
				}
				break;
			case "searching":
				switch (this.prevState) {
					case "interacting":
						this.#stopPartnerInactiveTimer();
						this.#restartPingSeq();
						break;
					case "readyToPair":
						this.sendCrEventWithParams("ping");
						break;
					case "connecting":
						this.sendCrEventWithParams("ping");
						break;
					case "readyToConnect":
					case "passive":
					default:
						console.warn("onStateChanged, invalidPrevState", this.prevState, this.state);
						break;
				}
				break;
			case "readyToPair":
				switch (this.prevState) {
					case "interacting":
						this.#stopPartnerInactiveTimer();
					case "searching":
						this.#stopPingSeq();
						if (this.#eventSender.state != "partnerRejected") {
							if (this.#clientRole == "controller" && this._prevEventSenderReady) {
								this.#sendCrEventFromPrevContextWithParams("unassign", "notPaired");
							}
						}
						break;
					case "connecting":
						break;
					case "readyToConnect":
					case "passive":
					default:
						console.warn("onStateChanged, invalidPrevState", this.prevState, this.state);
						break;
				}
				break;
			case "connecting":
				switch (this.prevState) {
					case "interacting":
						this.#stopPartnerInactiveTimer();
					case "searching":
						this.#stopPingSeq();
						if (this._prevEventSenderReady) {
							this.#sendCrEventFromPrevContextWithParams("inactive");
						}
						break;
					case "readyToPair":
					case "readyToConnect":
					case "passive":
						break;
					default:
						console.warn("onStateChanged, invalidPrevState", this.prevState, this.state);
						break;
				}
				break;
			case "readyToConnect":
				switch (this.prevState) {
					case "interacting":
						this.#stopPartnerInactiveTimer();
					case "searching":
						this.#stopPingSeq();
						if (this._prevEventSenderReady) {
							this.#sendCrEventFromPrevContextWithParams("inactive");
						}
						break;
					case "readyToPair":
					case "connecting":
					case "passive":
						break;
					default:
						console.warn("onStateChanged, invalidPrevState", this.prevState, this.state);
						break;
				}
				break;
			case "passive":
				switch (this.prevState) {
					case "interacting":
						this.#stopPartnerInactiveTimer();
					case "searching":
						this.#stopPingSeq();
						if (this._prevEventSenderReady) {
							this.#sendCrEventFromPrevContextWithParams("inactive");
						}
						break;
					case "readyToPair":
					case "connecting":
					case "readyToConnect":
					case "":
						break;
					default:
						console.warn("onStateChanged, invalidPrevState", this.prevState, this.state);
						break;
				}
				break;
			default:
				console.warn("onStateChanged, invalidCurState", this.state);
				break;
		}
	}
	
	// Event sending utilities
	
	#sendCrEventFromPrevContextWithParams(eventType, eventSubType = "", eventParams = []) {
		if (this.#eventSender._prevContext.readyToSendCrEvent) {
			let crEvent = this.#eventSender._prevContext.genCrEvent(eventType, eventSubType, eventParams);
			if (crEvent.readyToSend) {
				this.#eventSender.sendCrEventNow(crEvent);
			}
			else {
				console.warn("sendEventFromPrevContextWithParams, crEventNotReadyToSend", eventType, this.#eventSender._prevContext.descr);
			}
		}
		else {
			console.warn("sendEventFromPrevContextWithParams, prevContextNotReadyToSendCrEvent", eventType, this.#eventSender._prevContext.descr);
		}
	}
	
	// ping event sequence utilities and handler
	
	#restartPingSeq() {
		this.#stopPingSeq();
		if (this.paired) {
			this.#pingEvent = this.#eventSender.genCrEvent("ping");
			switch (this.state) {
				case "searching":
					this.#pingEventTimer = setInterval(this.#onPingEventTimeout.bind(this), this.#config.searchingMaxEventOutDt);
					break;
				case "interacting":
					this.#pingEventTimer = setInterval(this.#onPingEventTimeout.bind(this), this.#config.interactingMaxEventOutDt);
					break;
				default:
					console.warn("restartPingSeq, invalidState", this.state);
					break;
			}
		}
		else {
			console.warn("notPaired");
		}
	}
	
	#stopPingSeq() {
		if (this.#pingEventTimer) {
			clearTimeout(this.#pingEventTimer);
			this.#pingEventTimer = null;
		}
		this.#pingEvent = null;
	}
	
	#onPingEventTimeout() {
		if (this.#pingEvent) {
			this.#eventSender.sendCrEvent(this.#pingEvent);
		}
		else {
			console.warn("onPingEventTimeout, noPingEvent");
		}
	}
	
	// EventReceiver handlers
	
	#onEventReceiverStateChanged(e) {
		let state = e.detail;
		this.#updateState();
		this._dispatchEventTypeAsync("eventReceiverStateChanged", state);
	}
	
	#onEventReceiverSubStateChanged(e) {
		let subState = e.detail;
		this._dispatchEventType("eventReceiverSubStateChanged", subState);
		if (this.state == "readyToConnect") {
			this._subState = subState;
		}
	}
	
	#onEventReceiverCrEventReceived(e) {
		let crEvent = e.detail;
		this._dispatchEventType("eventReceiverCrEventReceived", crEvent);
		if (this.partnerClientId == crEvent.senderClientId || (this.#clientRole == "responder" && this.state == "readyToPair" && crEvent.eventType == "ping")) {
			switch (crEvent.eventType) {
				case "ping":
					if (this.state == "readyToPair") {
						this.partnerClientId = crEvent.senderClientId;
					}
					break;
				case "unassign":
					if (this.#clientRole == "responder") {
						this.partnerClientId = "";
					}
					break;
				case "reject":
					this.#eventSender._partnerRejectedState = crEvent.eventSubType;
					break;
			}
			this.#lastEvent = crEvent;
			this._dispatchEventAsync(crEvent);
		}
		else {
			switch (this.#clientRole) {
				case "controller":
					if (crEvent.eventType == "ping") {
						let replyEvent = this.#eventSender._curContext.genReplyCrEvent(crEvent, "reject", "notPaired");
						this.#eventSender.sendCrEventNow(replyEvent);
					}
					else {
						if (crEvent.eventType != "unassign") {
							console.warn("onEventReceiverCrEventReceived, notPaired", crEvent.eventType, crEvent.senderClientId);
						}
					}
					break;
				case "responder":
					if (crEvent.eventType == "ping") {
						if (this._partnerClientIdAssigned) {
							let replyEvent = this.#eventSender._curContext.genReplyCrEvent(crEvent, "reject", "assignedToOther");
							this.#eventSender.sendCrEventNow(replyEvent);
						}
						else if (this.state != "readyToPair") {
							console.warn("onEventReceiverCrEventReceived, notReadyToPair", crEvent);
						}
					}
					else {
						if (crEvent.eventType != "unassign") {
							console.warn("onEventReceiverCrEventReceived, notPaired", crEvent);
						}
					}
					break;
				default:
					console.warn("onEventReceiverCrEventReceived, invalidRole", this.#clientRole)
					break;
			}
		}
	}
	
	#onEventReceiverMsgEventReceived(e) {
		let msgEvent = e.detail;
		this._dispatchEventType("eventReceiverMsgEventReceived", msgEvent);
	}
	
	#onEventReceiverEventReceived(e) {
		let event = e.detail;
		this._dispatchEventType("eventReceiverEventReceived", event);
	}
	
	#onEventReceiverMsgEventSent(e) {
		this._dispatchEventType("eventReceiverMsgEventSent", e.detail);
	}
	
	// EventSender handlers
	
	#onEventSenderStateChanged(e) {
		let state = e.detail;
		this.#updateState();
		this._dispatchEventTypeAsync("eventSenderStateChanged", state);
	}
	
	#onEventSenderSubStateChanged(e) {
		let subState = e.detail;
		this._dispatchEventType("eventSenderSubStateChanged", subState);
		if (this.state == "readyToPair") {
			this._subState = subState;
		}
	}
	
	#onEventSenderCrEventSent(e) {
		let crEvent = e.detail;
		this._dispatchEventType("crEventSent", crEvent);
	}
	
	// General handlers
	
	#onValueUpdated(e) {
		this._dispatchEventType("valueUpdated", e.detail);
	}
	
	// Browser and client active handlers
	
	#onBeforeUnload(e) {
		this._unloading = true;
		this._dispatchEventType("beforeUnload");
		this.#onClientActiveChanged();
	}
	
	#onOnline(e) {
		this._dispatchEventType("online");
		this.#onClientActiveChanged();
	}
	
	#onOffline(e) {
		this._dispatchEventType("offline");
		this.#onClientActiveChanged();
	}
	
	#onVisible() {
		this._dispatchEventType("visible");
		this.#onClientActiveChanged();
	}
	
	#onHidden(event) {
		this._dispatchEventType("hidden");
		this.#onClientActiveChanged();
	}
	
	#onVisibilityChange(event) {
		if (this.visible) {
			this.#onVisible();
		}
		else {
			this.#onHidden();
		}
	}
	
	#onClientActiveChanged() {
		this.#updateState();
		this._dispatchEventTypeAsync("clientActiveChanged");
		this.#eventReceiver.clientActive = this._clientActive;
		this.#eventSender.clientActive = this._clientActive;
	}
	
	// PartnerInactiveTimer, utilities and handlers
	
	#restartPartnerInactiveTimer() {
		this.#stopPartnerInactiveTimer();
		this.#partnerInactiveTimer = setTimeout(this.#onPartnerInactiveTimeout.bind(this), this.#config.partnerActiveMaxEventInDt);
	}
	
	#stopPartnerInactiveTimer() {
		if (this.#partnerInactiveTimer) {
			clearTimeout(this.#partnerInactiveTimer);
			this.#partnerInactiveTimer = null;
		}
	}
	
	#onPartnerInactiveTimeout() {
		this.#updateState();
	}
}
