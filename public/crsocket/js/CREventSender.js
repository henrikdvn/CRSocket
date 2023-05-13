/*
 ------------------------------------------------------------------------------------------------------------------
 This class is used to send events to identified clientsthat can be received by means of the HTML EventSource interface
 ------------------------------------------------------------------------------------------------------------------
 */

class CREventSender extends CRStateMachine {
	
	constructor(config, clientRole) {
		super();
		this._genContext(config, clientRole);
		this.#config = config;
		this.#clientRole = clientRole;
	}
	
	/*
	 ------------------------------------------------------------------------------------------------------------------
	 Properties, public
	 ------------------------------------------------------------------------------------------------------------------
	 */
	
	// Client active
	
	set clientActive(newValue) {
		if (this._curContext.clientActive != newValue) {
			this._prevContext.clientActive = this._curContext.clientActive;
			this._curContext.clientActive = newValue;
			this.#updateState();
			this._prevContext.clientActive = this._curContext.clientActive;
		}
	}
	
	// Events can only generated/sent when a valid clientId has been assigned
	// If this property is changed to another clientId, it will first be cleared and then reassigned
	
	set clientId(newValue) {
		if (this._curContext.clientId != newValue) {
			if (this._curContext.clientId) {
				this._prevContext.clientId = this._curContext.clientId;
				this._curContext.clientId = "";
				this.#updateState();
			}
			if (newValue) {
				setTimeout(() => {
					this._prevContext.clientId = this._curContext.clientId;
					this._curContext.clientId = newValue;
					this.#updateState();
					this._prevContext.clientId = this._curContext.clientId;
				}, this.#config.stateUpdateCompleteDt)
			}
		}
	}
	
	// Events can only generated/sent when a valid accessToken has been assigned
	// If this property is changed to another accessToken, it will first be cleared and then reassigned
	
	set accessToken(newValue) {
		if (this._curContext.accessToken != newValue) {
			if (this._curContext.accessToken) {
				this._prevContext.accessToken = this._curContext.accessToken;
				this._curContext.accessToken = "";
				this.#updateState();
			}
			if (newValue) {
				setTimeout(() => {
					this._prevContext.accessToken = this._curContext.accessToken;
					this._curContext.accessToken = newValue;
					this.#updateState();
					this._prevContext.accessToken = this._curContext.accessToken;
				}, this.#config.stateUpdateCompleteDt)
			}
		}
	}
	
	// With the exeption of replyEvents, events can only generated/sent when a valid partnerClientId has been assigned
	// If this property is changed to another partnerClientId, it will first be cleared and then reassigned
	
	set partnerClientId(newValue) {
		if (this._curContext.partnerClientId != newValue) {
			if (this._curContext.partnerClientId) {
				this._prevContext.partnerClientId = this._curContext.partnerClientId;
				this._curContext.partnerClientId = "";
				this.#updateState();
			}
			if (newValue) {
				setTimeout(() => {
					this._prevContext.partnerClientId = this._curContext.partnerClientId;
					this._curContext.partnerClientId = newValue;
					this.#updateState();
					this._prevContext.partnerClientId = this._curContext.partnerClientId;
				}, this.#config.stateUpdateCompleteDt)
			}
		}
		else {
			this._prevContext.partnerRejectedState.copyFrom(this._curContext.partnerRejectedState);
			this._curContext.partnerRejectedState.deactivate();
			this.#updateState();
			this._prevContext.partnerRejectedState.copyFrom(this._curContext.partnerRejectedState);
		}
	}
			
	/*
	 ------------------------------------------------------------------------------------------------------------------
	 Methods, public
	 ------------------------------------------------------------------------------------------------------------------
	 */
	
	// Activates the sender
	
	init() {
		window.addEventListener("online", this.#onOnline.bind(this))
	}
	
	// Generates a CREvent object, with properties assigned from the current sender
	
	genCrEvent(eventType, eventSubType = "", eventParams = [], buffered = false, logged = false, interceptable = true) {
		return this._curContext.genCrEvent(eventType, eventSubType, eventParams, buffered, logged, interceptable);
	}
	
	// Sends a crEvent
	// Keeps an minimum delay of config.minCrEventDt millisecs between events
	
	sendCrEvent(crEvent) {
		this.#crEventQueue.push(crEvent);
		this.#sendNextCrEvent()
	}
	
	// Sends a crEvent without enforcing the inter-even delay
	
	sendCrEventNow(crEvent) {
		crEvent.send();
		this.#lastEventSentCt = crEvent.sendCt;
		this._dispatchEventType("crEventSent", crEvent);
	}
	
	/*
	 ------------------------------------------------------------------------------------------------------------------
	 Properties, private or protected
	 ------------------------------------------------------------------------------------------------------------------
	 */
	
	set _partnerRejectedState(newValue) {
		if (!this._curContext.partnerRejectedState.active || this._curContext.partnerRejectedState.subState != newValue) {
			this._prevContext.partnerRejectedState.copyFrom(this._curContext.partnerRejectedState);
			this._curContext.partnerRejectedState.activate(newValue);
			this.#updateState();
			this._prevContext.partnerRejectedState.activate(newValue);
		}
	}
		
	// CRConfig object, initiated by the constructor
	
	#config = null;
	
	// clientRole ("controller" or "responder"), initiated by the contstructor
	
	#clientRole = "";
	
	// crEventQueue, used to ensure that there is at least minCrEventDt millisecs between crEvents.
	
	#crEventQueue = [];
	
	// Will timeout when a new crEvent can be sent
	
	#nextCrEventTimer = null;
	
	// Calendar time in millisecs when the last crEvent was sent
	
	#lastEventSentCt = 0;
	
	// Containes crEvents buffered because the browser was offline
	// Will be sent immediately when/if the browser becomes online
	
	#crEventBuffer = [];
	
	/*
	 ------------------------------------------------------------------------------------------------------------------
	 Methods, private or protected
	 ------------------------------------------------------------------------------------------------------------------
	 */
	
	// Generates current and previous context instances
	
	_genContext(config, clientRole) {
		super._curContext = new CREventSenderContext("cur", config, clientRole, this);
		super._prevContext = new CREventSenderContext("prev", config, clientRole, this);
	}
	
	// State management
	
	#updateState() {
		this._prevContext.updateState();
		this._curContext.updateState();
		if (this._curContext.state != this._prevContext.state) {
			this._onStateChanged();
		}
		if (this._curContext.subState != this._prevContext.subState) {
			this._onSubStateChanged();
		}
	}
	
	// Sends the next crEvent from the crEventQueue
	// Will postpone sending if time since the last crEvent was sent is less than minCrEventDt millisecs
	// If the crEvent.buffered property is true and the browser is not online, the event will be added to the crEventBuffer
	
	#sendNextCrEvent() {
		this.#stopNextCrEventTimer();
		if (this.#crEventQueue.length > 0) {
			let lastEventSentDt = Date.now() - this.#lastEventSentCt;
			if (lastEventSentDt >= this.#config.minCrEventDt) {
				let crEvent = this.#crEventQueue.shift();
				if (navigator.onLine) {
					this.sendCrEventNow(crEvent);
					if (this.#crEventQueue.length > 0) {
						this.#startNextCrEventTimer(this.#config.minCrEventDt + 100);
					}
				}
				else {
					if (crEvent.buffered) {
						this.#crEventBuffer.push(crEvent);
					}
					else {
						console.warn("sendNextCrEvent, notSent", crEvent);
					}
				}
			}
			else {
				this.#startNextCrEventTimer(this.#config.minCrEventDt + 100 - lastEventSentDt);
			}
		}
	}
	
	// nextCrEventTimer utilities
	
	#startNextCrEventTimer(dt) {
		this.#nextCrEventTimer = setTimeout(this.#sendNextCrEvent.bind(this), dt);
	}
	
	#stopNextCrEventTimer() {
		if (this.#nextCrEventTimer) {
			clearTimeout(this.#nextCrEventTimer);
			this.#nextCrEventTimer = null;
		}
	}
	
	// Sends all buffered crEvents immediately
	
	#flushCrEventBuffer() {
		while (this.#crEventBuffer.length > 0 && navigator.onLine) {
			let crEvent = this.#crEventBuffer.shift();
			this.sendCrEventNow(crEvent);
		}
	}
	
	// Triggered when the browser becomes online
	
	#onOnline() {
		this.#flushCrEventBuffer();
	}
}

/*
 ------------------------------------------------------------------------------------------------------------------
 This class provides access to properties and methods from current and previous CREventSender contexts
 ------------------------------------------------------------------------------------------------------------------
 */

class CREventSenderContext extends CRStateMachineContext {
	
	constructor(role, config, clientRole, stateMachine) {
		super(role);
		this.#config = config;
		this.#clientRole = clientRole;
		this.#stateMachine = stateMachine;
	}
	
	/*
	 ------------------------------------------------------------------------------------------------------------------
	 Properties, public
	 ------------------------------------------------------------------------------------------------------------------
	 */
	
	partnerRejectedState = new CRBinaryState();
		
	// When the partnerClientId is updated, the partnerRejected and partnerRejectedSubstate properties are reset to default values
	
	get clientActive() {
		return this.#clientActive;
	}
	
	set clientActive(newValue) {
		if (this.#clientActive != newValue) {
			this.#clientActive = newValue;
			this.partnerRejectedState.deactivate();
		}
	}

	get clientId() {
		return this.#clientId;
	}
	
	set clientId(newValue) {
		if (this.#clientId != newValue) {
			this.#clientId = newValue;
			this.partnerRejectedState.deactivate();
		}
	}

	get accessToken() {
		return this.#accessToken;
	}
	
	set accessToken(newValue) {
		if (this.#accessToken != newValue) {
			this.#accessToken = newValue;
			this.partnerRejectedState.deactivate();
		}
	}

	get partnerClientId() {
		return this.#partnerClientId;
	}
	
	set partnerClientId(newValue) {
		if (this.#partnerClientId != newValue) {
			this.#partnerClientId = newValue;
			this.partnerRejectedState.deactivate();
		}
	}
	
	// Returns true if it is possible to send messageEvents from this context
	
	get readyToSendMsgEvent() {
		let ready = this.#config.isValidClientId(this.clientId) && this.#config.isValidAccessToken(this.accessToken);
		return ready;
	}
	
	// Returns true if it is possible to send crEvents from this context
	
	get readyToSendCrEvent() {
		let ready = (this.readyToSendMsgEvent && this.#config.isValidClientId(this.partnerClientId) && !this.partnerRejectedState.active);
		if (ready != Boolean(this.state == "ready")) {
			console.warn("get readyToSendCrEvent, readyMismatch", ready, this.state);
		}
		return ready;
	}
	
	// Returns a description of this context
	
	get descr() {
		return super.descr+", clientId: "+this.clientId+", clientRole: "+this.#clientRole+", accessToken: "+this.accessToken+", partnerClientId: "+this.partnerClientId+", partnerRejectedState: "+this.partnerRejectedState.active;
	}
	
	/*
	 ------------------------------------------------------------------------------------------------------------------
	 Methods, public
	 ------------------------------------------------------------------------------------------------------------------
	 */
	
	updateState() {
		if (this.clientId) {
			if (this.accessToken) {
				if (this.#config.isValidAccessToken(this.accessToken)) {
					if (this.partnerClientId) {
						if (this.#config.isValidClientId(this.partnerClientId)) {
							if (!this.partnerRejectedState.active) {
								if (this.clientActive) {
									this.state = "ready";
									this.subState = "";
								}
								else {
									this.state = "ready";
									this.subState = "clientNotActive";
								}
							}
							else {
								this.state = "partnerRejected";
								this.subState = this.partnerRejectedState.subState;
							}
						}
						else {
							this.state = "notReady";
							this.subState = "invalidPartnerClientId";
						}
					}
					else {
						this.state = "notReady";
						this.subState = "noPartnerClientId";
					}
				}
				else {
					this.state = "notReady";
					this.subState = "invalidAccessToken";
				}
			}
			else {
				this.state = "notReady";
				this.subState = "noAccessToken";
			}
		}
		else {
			this.state = "notReady";
			this.subState = "noClientId";
		}
	}
	
	
	// Event generators
	
	genCrEvent(eventType, eventSubType = "", eventParams = [], buffered = false, logged = false, interceptable = true) {
		var crEvent = new CREvent(this.#config);
		crEvent.updateContent(eventType, eventSubType, eventParams);
		crEvent.updateAuthInfo(this.clientId, this.#clientRole, this.accessToken);
		crEvent.buffered = buffered;
		crEvent.logged = logged;
		crEvent.interceptable = interceptable;
		if (!this.partnerRejectedState.active) {
			crEvent.recipientClientId = this.partnerClientId;
		}
		return crEvent;
	}
	
	genReplyCrEvent(otherCrEvent, eventType, eventSubType = "", eventParams = [], buffered = false, logged = false, interceptable = true) {
		var crEvent = new CREvent(this.#config);
		crEvent.updateContent(eventType, eventSubType, eventParams);
		crEvent.updateAuthInfo(this.clientId, this.#clientRole, this.accessToken);
		crEvent.buffered = buffered;
		crEvent.logged = logged;
		crEvent.interceptable = interceptable;
		crEvent.recipientClientId = otherCrEvent.senderClientId;
		return crEvent;
	}
	
	// Sends a messageEvent
	
	sendMsgEvent(type, data) {
		if (this.readyToSendMsgEvent) {
			let requestStr = CRUtil.genMsgEventRequestStr(this.clientId, this.#clientRole, this.accessToken, this.partnerClientId, type, data);
			CRUtil.sendRequest(requestStr);
			this.#stateMachine._dispatchEventType("msgEventSent", [type, data]);
		}
		else {
			console.warn("sendMsgEvent, notReady", type, this.descr);
		}
	}
	
	/*
	 ------------------------------------------------------------------------------------------------------------------
	 Properties, private
	 ------------------------------------------------------------------------------------------------------------------
	 */
	
	// CRConfig object, initiated by the constructor
	
	#config = null;
	
	// clientRole ("controller" or "responder"), initiated by the contstructor
	
	#clientRole = "";
	
	#clientActive = false;

	#clientId = "";
	
	#accessToken = "";
	
	#partnerClientId = "";
	
	// The CRStateMachine object that initiated this context
	
	#stateMachine = null;
	
}
