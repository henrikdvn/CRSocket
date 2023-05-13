/*
 ------------------------------------------------------------------------------------------------------------------
 This class is used to receive events by means of the HTML EventSource interface
 ------------------------------------------------------------------------------------------------------------------
 */

class CREventReceiver extends CRStateMachine {
	
	constructor(config, clientRole) {
		super();
		this._genContext();
		this.#config = config;
		this.#clientRole = clientRole;
		this.#selfSender = new CREventSender(config, clientRole);
	}
	
	/*
	 ------------------------------------------------------------------------------------------------------------------
	 Properties, public
	 ------------------------------------------------------------------------------------------------------------------
	 */
	
	// The eventsource will only be open when the client is active
	
	set clientActive(newValue) {
		this.#abortedState.deactivate();
		if (this.#clientActive != newValue) {
			this.#clientActive = newValue;
			this.#selfSender.clientActive = newValue;
			this.#updateState();
		}
	}
	
	// The eventsource will only be open when a valid clientId has been assigned
	// If this property is changed to another clientId, it will first be cleared and then reassigned
	
	set clientId(newValue) {
		this.#abortedState.deactivate();
		if (this.#clientId != newValue) {
			var assignDelay = this.#config.stateUpdateCompleteDt;
			if (this.#clientId) {
				this.#clientId = "";
				this.#selfSender.clientId = "";
				this.#selfSender.partnerClientId = "";
				this.#updateState();
				assignDelay = this.#config.serverInteractionCompleteDt;
			}
			if (newValue) {
				setTimeout(() => {
					this.#clientId = newValue;
					this.#selfSender.clientId = newValue;
					this.#selfSender.partnerClientId = newValue;
					this.#updateState();
				}, assignDelay)
			}
		}
	}
	
	// The eventsource will only be open when a valid accessToken id has been assigned
	// If this property is changed to another accessToken, it will first be cleared and then reassigned
	
	set accessToken(newValue) {
		this.#abortedState.deactivate();
		if (this.#accessToken != newValue) {
			var assignDelay = this.#config.stateUpdateCompleteDt;
			if (this.#accessToken) {
				this.#accessToken = "";
				this.#selfSender.accessToken = "";
				this.#updateState();
				assignDelay = this.#config.serverInteractionCompleteDt;
			}
			if (newValue) {
				setTimeout(() => {
					this.#accessToken = newValue;
					this.#selfSender.accessToken = newValue;
					this.#updateState();
				}, assignDelay)
			}
		}
	}
	
	/*
	 ------------------------------------------------------------------------------------------------------------------
	 Methods, public
	 ------------------------------------------------------------------------------------------------------------------
	 */
	
	// Initiates dynamic variables and activates the app
	
	init() {
		this.addEventListener("stateChanged", this.#onStateChanged.bind(this));
		this.#selfSender.init();
		this.#selfSender.addEventListener("msgEventSent", this.#onMsgEventSent.bind(this));
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
	
	// CREventSender object, initiated by the constructor,
	// used to send messageEvents to it's own eventsource
	
	#selfSender = null;
	
	// The current eventSource object, managed by state changes
	
	#eventSource = null;
	
	// True if the client app is active, updated by the enclosing crSocket
	
	#clientActive = false;
	
	// The clientId, updated by the enclosing crSocket

	#clientId = "";
	
	// The accessToken, updated by the enclosing crSocket
	
	#accessToken = "";
	
	// True if a "hello" event has been received from the current eventSource
	
	#helloReceived = false;
	
	// True if a "close" event has been sent to the current eventSource and it is not yet closed

	#closePending = false;

	// True if an "aborted" event has been received from the current eventSource
	
	#abortedState = new CRBinaryState();
	
	// Timer, initiated when a "hello" event has been received
	
	#aliveSeqTimer = null;
			
	// EventSource time points
	
	#eventSourceConnectingCt = NaN;
	
	#eventSourceOpenCt = NaN;
	
	#eventSourceClosedCt = NaN;
	
	#aliveSendCt = NaN;
	
	#logTiming = false;
	
	set _logTiming(newValue) {
		this.#logTiming = newValue;
	}
	
	// EventSource process id, used to avoid invalid events from detached processes
	
	#eventSourcePid = "";
		
	/*
	 ------------------------------------------------------------------------------------------------------------------
	 Methods, private
	 ------------------------------------------------------------------------------------------------------------------
	 */
			
	// Updates state/substate in circumstances where the evens source must be closedd
	
	#setNotOpen(subState) {
		this.#abortedState.deactivate();
		if (this.#eventSource) {
			this._state = "closing";
		}
		else {
			this._state = "closed";
		}
		this._subState = subState;
	}
	
	// State management
	
	#updateState() {
		if (this.#clientActive) {
			if (this.#clientId) {
				if (this.#accessToken) {
					if (this.#config.isValidAccessToken(this.#accessToken)) {
						if (!this.#abortedState.active) {
							if (!this.#closePending) {
								if (this.#helloReceived) {
									this._state = "open";
									this._subState = "";
								}
								else {
									this._state = "opening";
									this._subState = "";
								}
							}
							else {
								console.warn("updateState, intermediateUpdate");
							}
						}
						else {
							this._state = "aborted";
							this._subState = this.#abortedState.subState;
						}
					}
					else {
						this.#setNotOpen("invalidAccessToken");
					}
				}
				else {
					this.#setNotOpen("noAccessToken");
				}
			}
			else {
				this.#setNotOpen("noClientId");
			}
		}
		else {
			this.#setNotOpen("clientNotActive");
		}
	}
	
	#onStateChanged() {
		switch (this.state) {
			case "open":
				switch (this.prevState) {
					case "opening":
						break;
					default:
						console.warn("onStateChanged, invalidPrevState", this.prevState, this.state);
						break;
				}
				break;
			case "opening":
				switch (this.prevState) {
					case "closed":
					case "aborted":
						this.#openEventSource();
						break;
					default:
						console.warn("onStateChanged, invalidPrevState", this.prevState, this.state);
						break;
				}
				break;
			case "closing":
				switch (this.prevState) {
					case "open":
					case "opening":
						this.#closePending = true;
						this.#selfSender._prevContext.sendMsgEvent("close", this.#eventSourcePid);
						setTimeout(() => {
							this.#closePending = false;
							if (this.state == "closing") {
								this.#closeEventSource();
							}
						}, this.#config.serverInteractionCompleteDt);
						break;
					default:
						console.warn("onStateChanged, invalidPrevState", this.prevState, this.state);
						break;
				}
				break;
			case "closed":
				switch (this.prevState) {
					case "closing":
					case "aborted":
					case "":
						break;
					default:
						console.warn("onStateChanged, invalidPrevState", this.prevState, this.state);
						break;
				}
				break;
			case "aborted":
				switch (this.prevState) {
					case "open":
					case "opening":
						this.#closeEventSource();
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
	
	// EventSource utilities
	
	#openEventSource() {
		this.#helloReceived = false;
		this.#closePending = false;
		this.#abortedState.deactivate();
		let requestStr = "../eventsource/?clientId="+this.#clientId+"&clientRole="+this.#clientRole+"&accessToken="+this.#accessToken;
		this.#eventSource = new EventSource(requestStr);
		this.#reflectReadyState();
		this.#eventSource.addEventListener("open", this.#onOpen.bind(this));
		this.#eventSource.addEventListener("error", this.#onError.bind(this));
		this.#eventSource.addEventListener("hello", this.#onHello.bind(this));
		this.#eventSource.addEventListener("alive", this.#onAlive.bind(this));
		this.#eventSource.addEventListener("closed", this.#onClosed.bind(this));
		this.#eventSource.addEventListener("shutdown", this.#onShutdown.bind(this));
		this.#eventSource.addEventListener("aborted", this.#onAborted.bind(this));
		this.#eventSource.addEventListener("crEvent", this.#onCrEvent.bind(this));
	}
	
	#closeEventSource() {
		this.#helloReceived = false;
		this.#closePending = false;
		this.#stopAliveSeqTimer();
		if (this.#eventSource) {
			this.#eventSource.close();
			this.#reflectReadyState();
			this.#eventSource = null;
			this.#eventSourcePid = "";
			this.#updateState();
		}
		else {
			console.warn("closeEventSource, noEventSource");
		}
	}
	
	// Internal EventSource event handlers
	
	#onOpen(event) {
		this.#reflectReadyState();
		this._dispatchEventType("eventReceived", event);
	}
	
	#onError(event) {
		this.#reflectReadyState();
		if (this.#eventSource) {
			switch (this.#eventSource.readyState) {
				case 0: // CONNECTING
					break;
				case 1: // OPEN
					break;
				case 2: // CLOSED
					this.#abortedState.activate("error");
					this.#updateState();
					break;
				default:
					console.warn("onError, invalidReadyState");
			}
			this._dispatchEventType("eventReceived", event);
		}
		else {
			console.warn("onError, noEventSource");
		}
	}
	
	// Server admin inbound event handlers
	
	#onHello(msgEvent) {
		let dataItems = this.#getMsgEventDataItems(msgEvent.data);
		let senderPid = dataItems[0];
		this.#eventSourcePid = senderPid;
		this.#restartAliveSeqTimer();
		this.#helloReceived = true;
		this.#updateState();
		this._dispatchEventType("msgEventReceived", msgEvent);
	}
	
	#onAlive(msgEvent) {
		let dataItems = this.#getMsgEventDataItems(msgEvent.data);
		let senderPid = dataItems[0];
		if (this.#eventSourcePid == senderPid) {
			if (!isNaN(this.#aliveSendCt)) {
				if (this.#logTiming) {
					let aliveDt = Date.now() - this.#aliveSendCt;
					this.#logValueUpdated("aliveDt", aliveDt);
				}
				this.#aliveSendCt = NaN;
			}
			this._dispatchEventType("msgEventReceived", msgEvent);
		}
		else {
			console.warn("onAlive, pidMismatch", senderPid, this.#eventSourcePid);
		}
	}
	
	#onClosed(msgEvent) {
		let dataItems = this.#getMsgEventDataItems(msgEvent.data);
		let senderPid = dataItems[0];
		if (this.#eventSourcePid == senderPid) {
			if (this.state == "closing") {
				this.#closeEventSource();
				this._dispatchEventType("msgEventReceived", msgEvent);
			}
			else {
				console.warn("onClosed, notClosing");
			}
		}
		else {
			console.warn("onClosed, pidMismatch", senderPid, this.#eventSourcePid);
		}
	}
	
	#onAborted(msgEvent) {
		this.#reflectReadyState();
		let dataItems = this.#getMsgEventDataItems(msgEvent.data);
		let senderPid = dataItems[0];
		let abortReason = dataItems[1];
		let releaserPid = dataItems[2];
		if (!this.#helloReceived) {
			this.#abortedState.activate(abortReason);
			this.#updateState();
			this._dispatchEventType("msgEventReceived", msgEvent);
		}
		else {
			if (this.#eventSourcePid == senderPid) {
				this.#abortedState.activate(abortReason);
				this.#updateState();
				this._dispatchEventType("msgEventReceived", msgEvent);
			}
			else {
				console.warn("onAborted, pidMismatch", senderPid, this.#eventSourcePid);
			}
		}
	}
	
	#onShutdown(msgEvent) {
		let dataItems = this.#getMsgEventDataItems(msgEvent.data);
		let senderPid = dataItems[0];
		if (this.#eventSourcePid == senderPid) {
			this.#restartAliveSeqTimer();
			this.#reflectReadyState();
			if (this.#eventSource) {
				switch (this.#eventSource.readyState) {
					case 0: // CONNECTING
						break;
					case 1: // OPEN
						this.#eventSource.close();
						this.#reflectReadyState();
						this.#eventSource = null;
						this.#eventSourcePid = "";
						this.#openEventSource();
						break;
					case 2: // CLOSED
						break;
					default:
						console.warn("onShutdown, invalidReadyState");
				}
			}
			else {
				console.warn("onShutdown, noEventSource");
			}
			this._dispatchEventType("msgEventReceived", msgEvent);
		}
		else {
			console.warn("onShutdown, pidMismatch", senderPid, this.#eventSourcePid);
		}
	}
	
	// crEvent handler
	
	#onCrEvent(msgEvent) {
		this.#restartAliveSeqTimer();
		var crEvent = new CREvent(this.#config);
		crEvent.initWithMsgEventData(decodeURIComponent(msgEvent.data));
		crEvent.receiveCt = Date.now();
		this._dispatchEventType("crEventReceived", crEvent);
	}
	
	// Server admin outbound event handler
	
	#onMsgEventSent(e) {
		let msgEvent = e.detail;
		this._dispatchEventType("msgEventSent", msgEvent);
	}
	
	// alive event sequence utilities and handler
	
	#restartAliveSeqTimer() {
		this.#stopAliveSeqTimer();
		this.#aliveSeqTimer = setInterval(this.#onAliveSeqTimeout.bind(this), this.#config.eventSourceSendAliveDt);
	}
	
	#stopAliveSeqTimer() {
		if (this.#aliveSeqTimer) {
			clearTimeout(this.#aliveSeqTimer);
			this.#aliveSeqTimer = null;
		}
	}
	
	#onAliveSeqTimeout() {
		this.#aliveSendCt = Date.now();
		this.#selfSender._curContext.sendMsgEvent("alive", this.#eventSourcePid);
	}
	
	// Decodes messageEvent data strings and splits them into separate items
	
	#getMsgEventDataItems(dataStr) {
		let decodedData = decodeURIComponent(dataStr);
		return decodedData.split(this.#config.eventDataSplitChar);
	}
	
	// EventSource readyState delay monitoring functions, primarily for testing purposes
	
	#reflectReadyState() {
		if (this.#eventSource) {
			switch (this.#eventSource.readyState) {
				case 0:
					this.#onEventSourceConnecting();
					break;
				case 1:
					this.#onEventSourceOpen();
					break;
				case 2:
					this.#onEventSourceClosed();
					break;
				default:
					console.warn("reflectReadyState, invalidReadyState");
			}
		}
		else {
			console.warn("reflectReadyState, noEventSource");
		}
	}
	
	#onEventSourceClosed() {
		if (isNaN(this.#eventSourceClosedCt)) {
			let curCt = Date.now();
			if (!isNaN(this.#eventSourceConnectingCt)) {
				if (this.#logTiming) {
					let connectDt = curCt - this.#eventSourceConnectingCt
					this.#logValueUpdated("connectDt", connectDt);
				}
				this.#eventSourceConnectingCt = NaN;
			}
			if (!isNaN(this.#eventSourceOpenCt)) {
				if (this.#logTiming) {
					let openDt = curCt - this.#eventSourceOpenCt;
					this.#logValueUpdated("openDt", openDt);
				}
				this.#eventSourceOpenCt = NaN;
			}
			this.#eventSourceClosedCt = curCt;
		}
	}
	
	#onEventSourceConnecting() {
		if (isNaN(this.#eventSourceConnectingCt)) {
			let curCt = Date.now();
			if (!isNaN(this.#eventSourceClosedCt)) {
				if (this.#logTiming) {
					let closedDt = curCt - this.#eventSourceClosedCt
					this.#logValueUpdated("closedDt", closedDt);
				}
				this.#eventSourceClosedCt = NaN;
			}
			if (!isNaN(this.#eventSourceOpenCt)) {
				if (this.#logTiming) {
					let openDt = curCt - this.#eventSourceOpenCt;
					this.#logValueUpdated("openDt", openDt);
				}
				this.#eventSourceOpenCt = NaN;
			}
			this.#eventSourceConnectingCt = curCt;
		}
	}
	
	#onEventSourceOpen() {
		if (isNaN(this.#eventSourceOpenCt)) {
			let curCt = Date.now();
			if (!isNaN(this.#eventSourceClosedCt)) {
				if (this.#logTiming) {
					let closedDt = curCt - this.#eventSourceClosedCt
					this.#logValueUpdated("closedDt", closedDt);
				}
				this.#eventSourceClosedCt = NaN;
			}
			if (!isNaN(this.#eventSourceConnectingCt)) {
				if (this.#logTiming) {
					let connectDt = curCt - this.#eventSourceConnectingCt
					this.#logValueUpdated("connectDt", connectDt);
				}
				this.#eventSourceConnectingCt = NaN;
			}
			this.#eventSourceOpenCt = curCt;
		}
	}
	
	#logValueUpdated(name, value) {
		let event = new CustomEvent('valueUpdated', {
			detail: [name, value]
		});
		this._dispatchEvent(event);
	}
	
	
}
