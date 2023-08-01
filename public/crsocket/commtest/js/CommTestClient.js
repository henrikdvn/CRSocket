/*
 ------------------------------------------------------------------------------------------------------------------
 This class implements controller/responder functionality that can be used to test the CRSocket component,
 using default server/client-side config settings.
 The controller/responder app resources must be provided with the associeted html documents.
 Major functionality:
 - Test different combinations of socket settings, actions and events.
 - Send single events and event sequences with random intervals.
 - Monitor no of events sent/received, delays/durations, current  and current socket states.
 It is also possible to log state changes and internal events to the console.
  ------------------------------------------------------------------------------------------------------------------
 */

class CommTestClient {
	
	appVersion = "1.13";

	// Event order monitoring
	
	prevCrEvent = null;
	prevMultiEvent = null;

	// Event sequence interface adaption
	
	curEventOutCount = NaN;
	curEventOutNo = NaN;
	curEventOutMinDt = NaN;
	curEventOutMaxDt = NaN;
	
	// Font size adaption
	
	prevScreenWidth = NaN;
	adaptFontSizeTimer;
	
	constructor(config, clientRole) {
		this.config = config;
		this.clientRole = clientRole;
		this.socket = new CRSocket(config, clientRole);
		this.socket._logStateChanges = this.logStates;
		
		// Assign element references
		
		this.roleHeaderElem = document.getElementById("roleHeaderSpan");
		this.versionHeaderElem = document.getElementById("versionHeaderSpan");
		
		this.noOfOpenEventsElem = document.getElementById("noOfOpenEventsCell");
		this.noOfErrorEventsElem = document.getElementById("noOfErrorEventsCell");
		this.noOfHelloEventsElem = document.getElementById("noOfHelloEventsCell");
		this.noOfIncomingAliveEventsElem = document.getElementById("noOfIncomingAliveEventsCell");
		this.noOfClosedEventsElem = document.getElementById("noOfClosedEventsCell");
		this.noOfAbortedEventsElem = document.getElementById("noOfAbortedEventsCell");
		this.noOfShutdownEventsElem = document.getElementById("noOfShutdownEventsCell");
		
		this.noOfOutgoingAliveEventsElem = document.getElementById("noOfOutgoingAliveEventsCell");
		this.noOfCloseEventsElem = document.getElementById("noOfCloseEventsCell");
		
		this.connectDtElem = document.getElementById("connectDtCell");
		this.openDtElem = document.getElementById("openDtCell");
		this.closedDtElem = document.getElementById("closedDtCell");
		this.aliveDtElem = document.getElementById("aliveDtCell");

		this.noOfIncomingPingEventsElem = document.getElementById("noOfIncomingPingEventsCell");
		this.noOfIncomingInactiveEventsElem = document.getElementById("noOfIncomingInactiveEventsCell");
		this.noOfIncomingUnassignEventsElem = document.getElementById("noOfIncomingUnassignEventsCell");
		this.noOfIncomingRejectEventsElem = document.getElementById("noOfIncomingRejectEventsCell");
		
		this.noOfOutgoingPingEventsElem = document.getElementById("noOfOutgoingPingEventsCell");
		this.noOfOutgoingInactiveEventsElem = document.getElementById("noOfOutgoingInactiveEventsCell");
		this.noOfOutgoingUnassignEventsElem = document.getElementById("noOfOutgoingUnassignEventsCell");
		this.noOfOutgoingRejectEventsElem = document.getElementById("noOfOutgoingRejectEventsCell");
		
		this.clientIdElem = document.getElementById("clientIdCell");
		this.accessTokenElem = document.getElementById("accessTokenCell");
		this.partnerClientIdElem = document.getElementById("partnerClientIdCell");
		
		this.socketStateElem = document.getElementById("socketStateCell");
		this.socketSubStateElem = document.getElementById("socketSubStateCell");
		this.eventReceiverStateElem = document.getElementById("eventReceiverStateCell");
		this.eventReceiverSubStateElem = document.getElementById("eventReceiverSubStateCell");
		this.eventSenderStateElem = document.getElementById("eventSenderStateCell");
		this.eventSenderSubStateElem = document.getElementById("eventSenderSubStateCell");
		
		this.activeHeaderElem = document.getElementById("activeHeader");
		this.activeHeaderElem.setAttribute("origClassName", this.activeHeaderElem.className);
		this.clientIdInputElem = document.getElementById("clientIdInput");
		
		this.authHeaderElem = document.getElementById("authHeader");
		this.authHeaderElem.setAttribute("origClassName", this.authHeaderElem.className);
		this.accessTokenInputElem = document.getElementById("accessTokenInput");
		
		this.pairedHeaderElem = document.getElementById("pairedHeader");
		this.pairedHeaderElem.setAttribute("origClassName", this.pairedHeaderElem.className);
		this.partnerClientIdInputElem = document.getElementById("partnerClientIdInput");
		
		this.eventOutTypeInputElem = document.getElementById("eventOutTypeInput");
		this.eventOutSubTypeInputElem = document.getElementById("eventOutSubTypeInput");
		this.eventOutParam1InputElem = document.getElementById("eventOutParam1Input");
		this.eventOutParam2InputElem = document.getElementById("eventOutParam2Input");
		
		this.eventOutSendButtonElem = document.getElementById("eventOutSendButton");
		
		this.eventOutCountInputElem = document.getElementById("eventOutCountInput");
		this.eventOutCountInputElem.setAttribute("min", 1);
		this.eventOutMinDtInputElem = document.getElementById("eventOutMinDtInput");
		this.eventOutMinDtInputElem.setAttribute("min", 0);
		this.eventOutMinDtInputElem.setAttribute("step", 1);
		this.eventOutMaxDtInputElem = document.getElementById("eventOutMaxDtInput");
		this.eventOutMaxDtInputElem.setAttribute("min", 0);
		this.eventOutMaxDtInputElem.setAttribute("step", 1);
		
		this.eventInTypeInputElem = document.getElementById("eventInTypeInput");
		this.eventInSubTypeInputElem = document.getElementById("eventInSubTypeInput");
		this.eventInParam1InputElem = document.getElementById("eventInParam1Input");
		this.eventInParam2InputElem = document.getElementById("eventInParam2Input");

		// Initiate counters
		
		this.noOfOpenEvents = 0;
		this.noOfErrorEvents = 0;
		this.noOfHelloEvents = 0;
		this.noOfIncomingAliveEvents = 0;
		this.noOfClosedEvents = 0;
		this.noOfAbortedEvents = 0;
		this.noOfShutdownEvents = 0;
		
		this.noOfOutgoingAliveEvents = 0;
		this.noOfCloseEvents = 0;
		
		this.noOfIncomingPingEvents = 0;
		this.noOfIncomingInactiveEvents = 0;
		this.noOfIncomingUnassignEvents = 0;
		this.noOfIncomingRejectEvents = 0;
		
		this.noOfOutgoingPingEvents = 0;
		this.noOfOutgoingInactiveEvents = 0;
		this.noOfOutgoingUnassignEvents = 0;
		this.noOfOutgoingRejectEvents = 0;
	}
	
	/*
	 ------------------------------------------------------------------------------------------------------------------
	 Computed properties
	 ------------------------------------------------------------------------------------------------------------------
	 */
	
	get savedAccessToken() {
		return this.socket.localStorageGet("accessToken");
	}
	
	set savedAccessToken(newValue) {
		this.socket.localStorageSet("accessToken", newValue);
	}
	
	get savedPartnerClientId() {
		return this.socket.localStorageGet("partnerClientId");
	}
	
	set savedPartnerClientId(newValue) {
		this.socket.localStorageSet("partnerClientId", newValue);
	}
	
	get savedLogStates() {
		return this.socket.localStorageGet("logStates");
	}
	
	set savedLogStates(newValue) {
		this.socket.localStorageSet("logStates", newValue);
	}
	
	get logStates() {
		return Boolean(this.savedLogStates == "true");
	}
	
	set logStates(newValue) {
		this.savedLogStates = newValue;
		this.socket._logStateChanges = newValue;
	}
	
	get savedLogEvents() {
		return this.socket.localStorageGet("logEvents");
	}
	
	set savedLogEvents(newValue) {
		this.socket.localStorageSet("logEvents", newValue);
	}
	
	get logEvents() {
		return Boolean(this.savedLogEvents == "true");
	}
	
	set logEvents(newValue) {
		this.savedLogEvents = newValue;
	}
	
	/*
	 ------------------------------------------------------------------------------------------------------------------
	 Methods
	 ------------------------------------------------------------------------------------------------------------------
	 */
	
	init() {
		this.onInternalEvent("init");
		
		// Dynamic viewport to font size adaption
		
		this.adaptFontSize();
				
		window.visualViewport.onresize = (e) => {
			if (this.adaptFontSizeTimer) {
				clearTimeout(this.adaptFontSizeTimer);
			}
			this.adaptFontSizeTimer = setTimeout(() => {
				this.adaptFontSize();
			}, 1000);
		};
				
		// Initiate page contents
		
		let roleHeader =  this.clientRole.charAt(0).toUpperCase()+this.clientRole.slice(1);
		document.title = "CommTest "+roleHeader;
		this.replaceChildNodesWithText(this.roleHeaderElem, roleHeader);
		this.replaceChildNodesWithText(this.versionHeaderElem, this.appVersion);
		
		this.replaceChildNodesWithText(this.noOfOpenEventsElem, this.noOfOpenEvents);
		this.replaceChildNodesWithText(this.noOfErrorEventsElem, this.noOfErrorEvents);
		this.replaceChildNodesWithText(this.noOfHelloEventsElem, this.noOfHelloEvents);
		this.replaceChildNodesWithText(this.noOfIncomingAliveEventsElem, this.noOfIncomingAliveEvents);
		this.replaceChildNodesWithText(this.noOfClosedEventsElem, this.noOfClosedEvents);
		this.replaceChildNodesWithText(this.noOfAbortedEventsElem, this.noOfAbortedEvents);
		this.replaceChildNodesWithText(this.noOfShutdownEventsElem, this.noOfShutdownEvents);
		
		this.replaceChildNodesWithText(this.noOfOutgoingAliveEventsElem, this.noOfOutgoingAliveEvents);
		this.replaceChildNodesWithText(this.noOfCloseEventsElem, this.noOfCloseEvents);
		
		this.replaceChildNodesWithText(this.noOfIncomingPingEventsElem, this.noOfIncomingPingEvents);
		this.replaceChildNodesWithText(this.noOfIncomingInactiveEventsElem, this.noOfIncomingInactiveEvents);
		this.replaceChildNodesWithText(this.noOfIncomingUnassignEventsElem, this.noOfIncomingUnassignEvents);
		this.replaceChildNodesWithText(this.noOfIncomingRejectEventsElem, this.noOfIncomingRejectEvents);
		
		this.replaceChildNodesWithText(this.noOfOutgoingPingEventsElem, this.noOfOutgoingPingEvents);
		this.replaceChildNodesWithText(this.noOfOutgoingInactiveEventsElem, this.noOfOutgoingInactiveEvents);
		this.replaceChildNodesWithText(this.noOfOutgoingUnassignEventsElem, this.noOfOutgoingUnassignEvents);
		this.replaceChildNodesWithText(this.noOfOutgoingRejectEventsElem, this.noOfOutgoingRejectEvents);
		
		this.accessTokenInputElem.value = this.toString(this.savedAccessToken);
		this.partnerClientIdInputElem.value = this.toString(this.savedPartnerClientId);
		
		this.eventOutTypeInputElem.addEventListener("input", this.updateEventOutForm.bind(this));
		this.eventOutCountInputElem.addEventListener("input", this.updateEventOutForm.bind(this))
		this.eventOutMinDtInputElem.addEventListener("input", this.updateEventOutForm.bind(this))
		this.eventOutMaxDtInputElem.addEventListener("input", this.updateEventOutForm.bind(this))
		
		// Register socket listeners
		
		this.socket.addEventListener("stateChanged", this.onSocketStateChanged.bind(this));
		this.socket.addEventListener("subStateChanged", this.onSocketSubStateChanged.bind(this));
		this.socket.addEventListener("clientIdChanged", this.onClientIdChanged.bind(this));
		this.socket.addEventListener("accessTokenChanged", this.onAccessTokenChanged.bind(this));
		this.socket.addEventListener("partnerClientIdChanged", this.onPartnerClientIdChanged.bind(this));
		this.socket.addEventListener("crEvent", this.onCrEvent.bind(this));
		this.socket.addEventListener("crEventSent", this.onCrEventSent.bind(this));
		
		// Register eventReceiver listeners
		
		this.socket.addEventListener("eventReceiverStateChanged", this.onEventReceiverStateChanged.bind(this));
		this.socket.addEventListener("eventReceiverSubStateChanged", this.onEventReceiverSubStateChanged.bind(this));
		
		this.socket.addEventListener("eventReceiverEventReceived", this.onEventReceiverEventReceived.bind(this));
		this.socket.addEventListener("eventReceiverMsgEventReceived", this.onEventReceiverMsgEventReceived.bind(this));
		this.socket.addEventListener("eventReceiverMsgEventSent", this.onEventReceiverMsgEventSent.bind(this));
		this.socket.addEventListener("eventReceiverCrEventReceived", this.onEventReceiverCrEventReceived.bind(this));
		this.socket.addEventListener("valueUpdated", this.onValueUpdated.bind(this));
		
		// Register eventSender listeners
		
		this.socket.addEventListener("eventSenderStateChanged", this.onEventSenderStateChanged.bind(this));
		this.socket.addEventListener("eventSenderSubStateChanged", this.onEventSenderSubStateChanged.bind(this));
		
		this.socket._logTiming = true;
		
		this.socket.init();
		
		// Delayed initiation avoiding internal errors in some browsers.
		
		setTimeout(() => {
			this.accessTokenInputElem.setAttribute("pattern", config.validAccessTokenRegExp.source);
			this.partnerClientIdInputElem.setAttribute("pattern", this.config.validClientIdRegExp.source);
			this.eventOutTypeInputElem.setAttribute("pattern", config.validCrEventTypeRegExp.source);
			this.eventOutSubTypeInputElem.setAttribute("pattern", config.validCrEventSubTypeRegExp.source);
			this.eventOutParam1InputElem.setAttribute("pattern", config.validEventParamRegExp.source);
			this.eventOutParam2InputElem.setAttribute("pattern", config.validEventParamRegExp.source);
			this.setFlagged("logStatesButton", this.logStates);
			this.setFlagged("logEventsButton", this.logEvents);
			this.updateEventOutForm();
		}, 1000);
		
	}
	
	/*
	 ------------------------------------------------------------------------------------------------------------------
	 UI commands
	 ------------------------------------------------------------------------------------------------------------------
	 */
	
	flipLogStates() {
		this.flipFlagged("logStatesButton");
		this.logStates = this.getFlagged("logStatesButton");
	}
	
	flipLogEvents() {
		this.flipFlagged("logEventsButton");
		this.logEvents = this.getFlagged("logEventsButton");
	}
	
	resumeApp() {
		this.onInternalEvent("resumeApp");
		this.socket._paused = false;
	}
	
	pauseApp() {
		this.onInternalEvent("pauseApp");
		this.socket._paused = true;
	}
	
	clearClientId() {
		this.onInternalEvent("clearClientId");
		this.socket._clearClientId();
	}
	
	assignAccessToken() {
		this.onInternalEvent("assignAccessToken");
		this.savedAccessToken = this.toString(this.accessTokenInputElem.value);
		this.socket.accessToken = this.savedAccessToken;
	}
	
	unassignAccessToken() {
		this.onInternalEvent("unassignAccessToken");
		this.socket.accessToken = "";
	}
	
	clearAccessToken() {
		this.onInternalEvent("clearAccessToken");
		this.accessTokenInputElem.value = "";
		this.savedAccessToken = "";
		this.socket.accessToken = "";
	}
	
	assignPartner() {
		this.onInternalEvent("assignPartner");
		this.savedPartnerClientId = this.toString(this.partnerClientIdInputElem.value);
		this.socket.partnerClientId = this.savedPartnerClientId;
	}
	
	unassignPartner() {
		this.onInternalEvent("unassignPartner");
		this.socket.partnerClientId = "";
	}
	
	clearPartner() {
		this.onInternalEvent("clearPartner");
		this.partnerClientIdInputElem.value = "";
		this.savedPartnerClientId = "";
		this.socket.partnerClientId = "";
	}
	
	// Sends a sequence of one or more events to the current partner as specified in the eventOut form
	
	sendEventSeq() {
		this.onInternalEvent("sendEventSeq");
		this.curEventOutCount = parseInt(this.eventOutCountInputElem.value);
		this.curEventOutMinDt = parseInt(this.eventOutMinDtInputElem.value);
		this.curEventOutMaxDt = parseInt(this.eventOutMaxDtInputElem.value);
		if (this.curEventOutCount == 1) {
			this.sendSingleEvent();
		}
		else {
			this.curEventOutNo = 0;
			this.scheduleNextEvent();
		}
	}
	
	/*
	 ------------------------------------------------------------------------------------------------------------------
	 Socket handlers
	 ------------------------------------------------------------------------------------------------------------------
	 */
	
	onSocketStateChanged(e) {
		let state = e.detail;
		this.onInternalEvent("socketStateChanged", state);
		this.setFlagged("activeHeader", this.socket.active);
		this.setFlagged("clientIdInput", this.socket.active);
		this.setFlagged("authHeader", this.socket.connected);
		this.setFlagged("accessTokenInput", this.socket.connected);
		this.setFlagged("pairedHeader", this.socket.paired);
		this.setFlagged("partnerClientIdInput", this.socket.state == "interacting");
		this.replaceChildNodesWithText(this.socketStateElem, state);
		this.updateEventOutForm();
		switch (state) {
			case "readyToConnect":
				//this.accessTokenInputElem.focus();
				break;
			case "readyToPair":
				//this.partnerClientIdInputElem.focus();
				break;
			default:
				break;
		}
	}
	
	onSocketSubStateChanged(e) {
		let subState = e.detail;
		this.onInternalEvent("socketSubStateChanged", subState);
		this.replaceChildNodesWithText(this.socketSubStateElem, subState);
	}
	
	onClientIdChanged(e) {
		let clientId = e.detail;
		this.onInternalEvent("clientIdChanged", clientId);
		this.replaceChildNodesWithText(this.clientIdElem, clientId);
		this.clientIdInputElem.value = this.toString(clientId);
	}
	
	onAccessTokenChanged(e) {
		let accessToken = e.detail;
		this.onInternalEvent("accessTokenChanged", accessToken);
		this.replaceChildNodesWithText(this.accessTokenElem, accessToken);
	}
	
	onPartnerClientIdChanged(e) {
		let partnerClientId = e.detail;
		this.onInternalEvent("partnerClientIdChanged", partnerClientId);
		this.replaceChildNodesWithText(this.partnerClientIdElem, partnerClientId);
		if (this.partnerClientIdInputElem.value == "" && this.partnerClientIdInputElem.value != partnerClientId) {
			this.partnerClientIdInputElem.value = partnerClientId;
		}
	}
	
	onCrEvent(crEvent) {
		this.onInternalEvent("crEventReceived", crEvent.eventType);
		if (this.prevCrEvent) {
			let prevSendCt = this.prevCrEvent.sendCt;
			let curSendCt = this.prevCrEvent.sendCt;
			let sendDt = curSendCt - prevSendCt;
			if (sendDt < 0) {
				console.warn("onCrEvent, invalidOrder", this.prevCrEvent.eventType, prevSendCt, crEvent.eventType, curSendCt, sendDt);
			}
			this.prevCrEvent = crEvent;
			if (crEvent.eventSubType == "multi") {
				let curEventNo = parseInt(crEvent.eventParams[0]);
				if (curEventNo == 0) {
					this.prevMultiEvent = crEvent;
				}
				else {
					if (curEventNo > 0) {
						if (this.prevMultiEvent) {
							let prevEventNo = parseInt(this.prevMultiEvent.eventParams[0]);
							if (curEventNo == prevEventNo + 1) {
							}
							else {
								console.warn("onCrEvent, invalidMultiEventOrder", prevEventNo, curEventNo);
							}
							this.prevMultiEvent = crEvent;
						}
						else {
							console.warn("onCrEvent, noPrevMultiEvent", curEventNo);
						}
					}
					else {
						console.warn("onCrEvent, invalidMultiEventNo", curEventNo);
					}
				}
			}
		}
		switch (crEvent.eventType) {
			case "ping":
				this.noOfIncomingPingEvents += 1;
				this.replaceChildNodesWithText(this.noOfIncomingPingEventsElem, this.noOfIncomingPingEvents);
				break;
			case "inactive":
				this.noOfIncomingInactiveEvents += 1;
				this.replaceChildNodesWithText(this.noOfIncomingInactiveEventsElem, this.noOfIncomingInactiveEvents);
				break;
			case "unassign":
				this.noOfIncomingUnassignEvents += 1;
				this.replaceChildNodesWithText(this.noOfIncomingUnassignEventsElem, this.noOfIncomingUnassignEvents);
				break;
			case "reject":
				this.noOfIncomingRejectEvents += 1;
				this.replaceChildNodesWithText(this.noOfIncomingRejectEventsElem, this.noOfIncomingRejectEvents);
				break;
			default:
				this.eventInTypeInputElem.value = crEvent.eventType;
				this.eventInSubTypeInputElem.value = crEvent.eventSubType;
				this.eventInParam1InputElem.value = crEvent.eventParams[0];
				this.eventInParam2InputElem.value = crEvent.eventParams[1];
				this.setFlagged("eventInBufButton", crEvent.buffered);
				this.setFlagged("eventInLogButton", crEvent.logged);
				this.setFlagged("eventInItcButton", crEvent.interceptable);
				break;
		}
	}
	
	onCrEventSent(e) {
		let crEvent = e.detail;
		this.onInternalEvent("crEventSent", crEvent.eventType);
		switch (crEvent.eventType) {
			case "ping":
				this.noOfOutgoingPingEvents += 1;
				this.replaceChildNodesWithText(this.noOfOutgoingPingEventsElem, this.noOfOutgoingPingEvents);
				break;
			case "unassign":
				this.noOfOutgoingUnassignEvents += 1;
				this.replaceChildNodesWithText(this.noOfOutgoingUnassignEventsElem, this.noOfOutgoingUnassignEvents);
				break;
			case "inactive":
				this.noOfOutgoingInactiveEvents += 1;
				this.replaceChildNodesWithText(this.noOfOutgoingInactiveEventsElem, this.noOfOutgoingInactiveEvents);
				break;
			case "reject":
				this.noOfOutgoingRejectEvents += 1;
				this.replaceChildNodesWithText(this.noOfOutgoingRejectEventsElem, this.noOfOutgoingRejectEvents);
				break;
			default:
				break;
		}
	}
	
	/*
	 ------------------------------------------------------------------------------------------------------------------
	 EventReceiver handlers
	 ------------------------------------------------------------------------------------------------------------------
	 */
	
	onEventReceiverStateChanged(e) {
		let state = e.detail;
		this.onInternalEvent("eEventReceiverStateChanged", state);
		this.replaceChildNodesWithText(this.eventReceiverStateElem, state);
	}
	
	onEventReceiverSubStateChanged(e) {
		let subState = e.detail;
		this.onInternalEvent("eventReceiverSubStateChanged", subState);
		this.replaceChildNodesWithText(this.eventReceiverSubStateElem, subState);
	}
	
	onEventReceiverEventReceived(e) {
		let event = e.detail;
		this.onInternalEvent("eventReceiverEventReceived", event.type);
		switch (event.type) {
			case "open":
				this.noOfOpenEvents += 1;
				this.replaceChildNodesWithText(this.noOfOpenEventsElem, this.noOfOpenEvents);
				break;
			case "error":
				this.noOfErrorEvents += 1;
				this.replaceChildNodesWithText(this.noOfErrorEventsElem, this.noOfErrorEvents);
				break;
			default:
				console.warn("onEventReceiverEventReceived, unknownMsgEvent", msgEvent.type);
				break;
		}
	}
	
	onEventReceiverMsgEventReceived(e) {
		let msgEvent = e.detail;
		let msgEventType = msgEvent.type;
		let msgEventData = decodeURIComponent(msgEvent.data);
		this.onInternalEvent("eventReceiverMsgEventReceived", msgEvent.type+",["+msgEventData+"]");
		switch (msgEvent.type) {
			case "hello":
				this.noOfHelloEvents += 1;
				this.replaceChildNodesWithText(this.noOfHelloEventsElem, this.noOfHelloEvents);
				break;
			case "alive":
				this.noOfIncomingAliveEvents += 1;
				this.replaceChildNodesWithText(this.noOfIncomingAliveEventsElem, this.noOfIncomingAliveEvents);
				break;
			case "closed":
				this.noOfClosedEvents += 1;
				this.replaceChildNodesWithText(this.noOfClosedEventsElem, this.noOfClosedEvents);
				break;
			case "shutdown":
				this.noOfShutdownEvents += 1;
				this.replaceChildNodesWithText(this.noOfShutdownEventsElem, this.noOfShutdownEvents);
				break;
			case "aborted":
				this.noOfAbortedEvents += 1;
				this.replaceChildNodesWithText(this.noOfAbortedEventsElem, this.noOfAbortedEvents);
				break;
			default:
				console.warn("onEventReceiverMsgEventReceived, unknownMsgEvent", msgEvent.type);
				break;
		}
	}
	
	onEventReceiverMsgEventSent(e) {
		let msgEventType = e.detail[0];
		let msgEventData = e.detail[1];
		this.onInternalEvent("eventReceiverMsgEventSent", msgEventType+",["+msgEventData+"]");
		switch (msgEventType) {
			case "close":
				this.noOfCloseEvents += 1;
				this.replaceChildNodesWithText(this.noOfCloseEventsElem, this.noOfCloseEvents);
				break
			case "alive":
				this.noOfOutgoingAliveEvents += 1;
				this.replaceChildNodesWithText(this.noOfOutgoingAliveEventsElem, this.noOfOutgoingAliveEvents);
				break;
			default:
				console.warn("onEventReceiverMsgEventSent, unknownMsgEvent", msgEventType);
				break;
		}
	}
	
	onEventReceiverCrEventReceived(e) {
		let crEvent = e.detail;
		this.onInternalEvent("eventReceiverCrEventReceived", crEvent.eventType);
	}
	
	/*
	 ------------------------------------------------------------------------------------------------------------------
	 EventSender  handlers
	 ------------------------------------------------------------------------------------------------------------------
	 */
	
	onEventSenderStateChanged(e) {
		let state = e.detail;
		this.onInternalEvent("eventSenderStateChanged", state);
		this.replaceChildNodesWithText(this.eventSenderStateElem, state);
	}
	
	onEventSenderSubStateChanged(e) {
		let subState = e.detail;
		this.onInternalEvent("eventSenderSubStateChanged", subState);
		this.replaceChildNodesWithText(this.eventSenderSubStateElem, subState);
	}
	
	/*
	 ------------------------------------------------------------------------------------------------------------------
	 General handlers
	 ------------------------------------------------------------------------------------------------------------------
	 */
	
	// Triggered when a valueUpdated event is received from the crSocket
	
	onValueUpdated(e) {
		let data = e.detail;
		let name = data[0];
		let value = data[1];
		switch (name) {
			case "connectDt":
				this.replaceChildNodesWithText(this.connectDtElem, value);
				break;
			case "openDt":
				this.replaceChildNodesWithText(this.openDtElem, value);
				break;
			case "closedDt":
				this.replaceChildNodesWithText(this.closedDtElem, value);
				break;
			case "aliveDt":
				this.replaceChildNodesWithText(this.aliveDtElem, value);
				break;
			default:
				console.warn("onValueUpdated, unknownValueUpdated", name, value);
		}
	}
	
	// If logEvents is true: Logs an internal event, an optional argument string and millisecs since the previous event or state change was logged
	
	onInternalEvent(eventName, argStr = null) {
		if (this.logEvents) {
			if (argStr) {
				console.log(eventName, argStr, this.socket._dt);
			}
			else {
				console.log(eventName, this.socket._dt);
			}
		}
	}
	
	/*
	 ------------------------------------------------------------------------------------------------------------------
	 Event out utilities
	 ------------------------------------------------------------------------------------------------------------------
	 */
			
	// Sends one event to the current partner with type, subtype and params specified in the eventOut form
	
	sendSingleEvent() {
		this.onInternalEvent("sendSingleEvent");
		if (this.socket.readyToSend) {
			let eventType = this.toString(this.eventOutTypeInputElem.value);
			let eventSubType = this.toString(this.eventOutSubTypeInputElem.value);
			let param1 = this.toString(this.eventOutParam1InputElem.value);
			let param2 = this.toString(this.eventOutParam2InputElem.value);
			if (this.socket.sendCrEventWithParams(eventType, eventSubType, [param1, param2], this.getFlagged("eventOutBufButton"), this.getFlagged("eventOutLogButton"), this.getFlagged("eventOutItcButton"))) {
			}
			else {
				console.warn("sendSingleEvent, sendCrEventWithParamsFailed");
			}
		}
		else {
			console.warn("sendSingleEvent, notReadyToSend");
		}
	}
	
	// Schedules the next event to be sent to the current partner, after a random delay within limits specified in the eventOut form

	scheduleNextEvent() {
		if (this.socket.readyToSend) {
			if (this.curEventOutCount > this.curEventOutNo) {
				this.curEventOutNo += 1;
				if (this.curEventOutMinDt > 0 && this.curEventOutMaxDt >= this.curEventOutMinDt) {
					this.curEventOutDt = Math.round(this.curEventOutMinDt  * 1000 + (this.curEventOutMaxDt - this.curEventOutMinDt) * 1000 * Math.random());
					this.eventOutSubTypeInputElem.value = "";
					this.eventOutParam1InputElem.value = this.curEventOutNo;
					this.eventOutParam2InputElem.value = this.curEventOutDt;
					setTimeout(() => {
						this.sendSingleEvent();
						this.scheduleNextEvent();
					}, this.curEventOutDt);
				}
				else {
					console.warn("scheduleNextEvent, invalidEventOutDtParams", this.curEventOutMinDt, this.curEventOutMaxDt);
				}
			}
			else {
				this.eventOutSubTypeInputElem.value = "";
				this.eventOutParam1InputElem.value = "";
				this.eventOutParam2InputElem.value = "";
			}
		}
		else {
			console.warn("scheduleNextEvent, notReadyToSend");
		}
	}
	
	// Updates the eventOut form according current settings and crSocket state
	
	updateEventOutForm() {
		var count = parseInt(this.eventOutCountInputElem.value);
		var minDt = parseInt(this.eventOutMinDtInputElem.value);
		var maxDt = parseInt(this.eventOutMaxDtInputElem.value);
		if (minDt > 0) {
			minDt = Math.round(minDt);
		}
		if (maxDt > 0) {
			maxDt = Math.round(maxDt);
		}
		if (this.eventOutTypeInputElem.validity.valid) {
			if (!(count > 0)) {
				count = 1;
			}
			if (count == 1) {
				minDt = 0;
				maxDt = 0;
			}
			if (count > 1) {
				if (!minDt > 0) {
					minDt = 1;
				}
				if (!maxDt > 0) {
					maxDt = 1;
				}
				if (maxDt < minDt) {
					maxDt = minDt;
				}
			}
			this.eventOutCountInputElem.value = count;
			this.eventOutMinDtInputElem.value = minDt;
			this.eventOutMinDtInputElem.max = maxDt;
			this.eventOutMaxDtInputElem.value = maxDt;
			this.eventOutMaxDtInputElem.min = minDt;
			this.eventOutSendButtonElem.disabled =
			!(this.socket.state == "interacting" &&
				this.eventOutCountInputElem.validity.valid &&
				this.eventOutMinDtInputElem.validity.valid &&
				this.eventOutMaxDtInputElem.validity.valid);
		}
		else {
			this.eventOutCountInputElem.value = null;
			this.eventOutMinDtInputElem.value = null;
			this.eventOutMaxDtInputElem.value = null;
			this.eventOutSendButtonElem.disabled = true;
		}
	}
	
	
	/*
	 ------------------------------------------------------------------------------------------------------------------
	 Html element utilities
	 ------------------------------------------------------------------------------------------------------------------
	 */
	
	// Adapts the font size to the current window (max fontSize: 16px)
	
	adaptFontSize() {
		let curScreenWidth = Math.round(window.visualViewport.width * window.visualViewport.scale);
		if (this.prevScreenWidth != curScreenWidth) {
			let fontSize = Math.min(16, (curScreenWidth -8) / 37);
			document.body.setAttribute("style", "font-size: "+fontSize+"px");
			this.prevScreenWidth = curScreenWidth;
		}
	}
	
	// Element flagging utilities. Converts the prescence of "flagged" in the className property of an element to a boolean value.
	
	flipFlagged(elemId) {
		let curValue = this.getFlagged(elemId);
		this.setFlagged(elemId, !curValue);
	}
	
	getFlagged(elemId) {
		let elem = document.getElementById(elemId);
		if (elem) {
			return Boolean(elem.className.includes("flagged"));
		}
		else {
			console.warn("getFlagged, noElem", elemId)
		}
	}
	
	setFlagged(elemId, value) {
		let elem = document.getElementById(elemId);
		if (elem) {
			if (value) {
				if (!elem.className.includes("flagged")) {
					elem.className = elem.className+" flagged";
				}
			}
			else {
				if (elem.className.includes("flagged")) {
					elem.className = elem.className.replace(" flagged", "");
				}
			}
		}
		else {
			console.warn("setFlagged, noElem", elemId)
		}
	}

	// Converts null/undefined values to empty strings.
	// All other values (including 0, NaN and Infinity) are converted to strings.
	
	toString(value) {
		if (value === null || value === undefined) {
			return "";
		}
		else {
			return ""+value;
		}
	}
	
	// Replaces all child nodes with a text node contaning the given value
	
	replaceChildNodesWithText(node, value) {
		this.removeChildNodes(node);
		let stringValue = this.toString(value);
		let textNode = document.createTextNode(stringValue);
		node.appendChild(textNode);
	}
	
	// Removes all child nodes
	
	removeChildNodes(node) {
		for (var i = 0; i < node.childNodes.length; i++) {
			node.removeChild(node.lastChild);
		}
	}
	
}
