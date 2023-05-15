/*
 ------------------------------------------------------------------------------------------------------------------
 This class implements the basic functionaly of a controller/responder pair for administering simple math problem trials.
 It illustrates how the CRSocket API can be used to implement a remotely controlled task.
 It also illustrates how clients can reconnect and pair automatically by saving properties in localStorage.
 ------------------------------------------------------------------------------------------------------------------
 */

class MathTrialsClient {
	
	appVersion = "1.8";
	buttonsEnabled = false;

	constructor(config, clientRole) {
		
		this.config = config;
		this.clientRole = clientRole;
		this.socket = new CRSocket(config, clientRole);
		
		this.versionSpanElem = document.getElementById("versionSpan");
		this.clientIdSpanElem = document.getElementById("clientIdSpan");
		this.stateSpanElem = document.getElementById("stateSpan");
		this.subStateSpanElem = document.getElementById("subStateSpan");

		// stateHeader

		this.clientIdHeaderElem = document.getElementById("clientIdHeader");
		this.stateHeaderElem = document.getElementById("stateHeader");

		// signInRow elements

		this.accessTokenInputElem = document.getElementById("accessTokenInput");
		this.signInButtonElem = document.getElementById("signInButton");
		this.signOutButtonElem = document.getElementById("signOutButton");
		this.signedInCellElem = document.getElementById("signedInCell");
		
		// partnerRow elements

		this.partnerClientIdInputElem = document.getElementById("partnerClientIdInput");
		this.assignPartnerButtonElem = document.getElementById("assignPartnerButton");
		this.unassignPartnerButtonElem = document.getElementById("unassignPartnerButton");
		this.interactingCellElem = document.getElementById("interactingCell");
	}
	
	/*
	 ------------------------------------------------------------------------------------------------------------------
	 Computed properties
	 ------------------------------------------------------------------------------------------------------------------
	 */

	// The accessToken and partnerClientId is saved in localStorage

	get accessToken() {
		return this.socket.localStorageGet("accessToken");
	}
	
	set accessToken(newValue) {
		if (this.accessToken != newValue) {
			this.socket.localStorageSet("accessToken", newValue);
		}
	}
		
	get partnerClientId() {
		return this.socket.localStorageGet("partnerClientId");
	}
	
	set partnerClientId(newValue) {
		if (this.partnerClientId != newValue) {
			this.socket.localStorageSet("partnerClientId", newValue);
		}
	}
	
	// trialsRunning must be overridden by controllers and responders

	get trialsRunning() {
		console.warn("getTrialsRunning, notImplemented");
		return false;
	}
		
	/*
	 ------------------------------------------------------------------------------------------------------------------
	 Initiation
	 ------------------------------------------------------------------------------------------------------------------
	 */

	init() {
		
		// Initiates page content and activates the app

		this.replaceChildNodesWithText(this.versionSpanElem, this.appVersion);
		
		this.socket.addEventListener("stateChanged", this.onStateChanged.bind(this));
		this.socket.addEventListener("subStateChanged", this.onSubStateChanged.bind(this));
		this.socket.addEventListener("crEvent", this.onCrEvent.bind(this));
		
		// Activate socket

		this.socket.init();
		this.socket.accessToken = this.accessToken;
		this.socket.partnerClientId = this.partnerClientId;
		
		// Delayed initiation avoiding internal errors in some browsers.
		
		setTimeout(() => {
			this.accessTokenInputElem.setAttribute("pattern", this.config.validAccessTokenRegExp.source);
			this.partnerClientIdInputElem.setAttribute("pattern", config.validClientIdRegExp.source);
			this.accessTokenInputElem.value = this.toString(this.accessToken);
			this.partnerClientIdInputElem.value = this.toString(this.partnerClientId);
			this.buttonsEnabled = true;
		}, 1000);

	}
	
	/*
	 ------------------------------------------------------------------------------------------------------------------
	 Socket handlers
	 ------------------------------------------------------------------------------------------------------------------
	 */
	
	// State changes may affect the whole app
	
	onStateChanged(e) {
		this.updatePage();
	}
	
	// SubState changes are purely informational

	onSubStateChanged(e) {
		this. updateStateHeaders();
	}

	// Event handling must be overridden by the controller/responder classes

	onCrEvent(e) {
		console.warn("onCrEvent, notImplemented");
	}

	/*
	 ------------------------------------------------------------------------------------------------------------------
	UI commands
	 ------------------------------------------------------------------------------------------------------------------
	 */

	assignAccessToken() {
		if (this.buttonsEnabled) {
			this.onButtonEvent();
			this.accessToken = this.toString(this.accessTokenInputElem.value);
			this.socket.accessToken = this.accessToken;
		}
	}
	
	clearAccessToken() {
		if (this.buttonsEnabled) {
			this.onButtonEvent();
			this.accessTokenInputElem.value = "";
			this.accessToken = "";
			this.socket.accessToken = "";
		}
	}
	
	/*
	 ------------------------------------------------------------------------------------------------------------------
	 UI handlers
	 ------------------------------------------------------------------------------------------------------------------
	 */
	
	// Updates the accessToken row to reflect potential changes in input element validity.

	onAccessTokenInputChanged() {
		this.updateSignInRow();
	}
	
	// Buttons are disabled for 1 sec after clicks/taps to avoid accidental double clicks.
	
	onButtonEvent() {
		this.buttonsEnabled = false;
		setTimeout(() => {
			this.buttonsEnabled = true;
		}, 1000);
	}

	/*
	 ------------------------------------------------------------------------------------------------------------------
	UI utilities
	------------------------------------------------------------------------------------------------------------------
	*/

	// Updates the page, is overriden by controller and responder

	updatePage() {
		this.updateStateHeaders();
		this.updateSignInRow();
		this.updatePartnerRow();
	}
	
	// Updates the state header with clientId, clientState and clientSubState

	updateStateHeaders() {
		this.replaceChildNodesWithText(this.clientIdSpanElem, this.socket.clientId);
		this.replaceChildNodesWithText(this.stateSpanElem, this.socket.state);
		if (this.socket.subState) {
			this.replaceChildNodesWithText(this.subStateSpanElem, " / " + this.socket.subState);
		}
		else {
			this.removeChildNodes(this.subStateSpanElem);
		}
	}
	
	// Updates the signInRow (accessToken).
	// Enables the accessToken input element if not trialsRunning.
	// Shows the signOutButton if the socket is connected, otherwise shows the signInButton.
	// Enables the signOut button if not trialsRunning.
	// Enables the signInButton if not trialsRunning and the provided accessToken is syntactically valid.
	// Sets the to signedIn tickCell to "✔" if the socket is connected, "?" if a valid accessToken has been entered, otherwise "✘".

	updateSignInRow() {
		this.updateSetupRow(this.accessTokenInputElem,
												this.signInButtonElem,
												this.signOutButtonElem,
												this.signedInCellElem,
												this.socket.connected,
												this.socket.connected,
												this.trialState != "started");
	}
	
	// Setup row handling must be overridden by controller and responder

	updatePartnerRow() {
		console.warn("updatePartnerRow, notImplemented");
	}

	// Updates a row used to submit and clear text values.
	// The input element is enabled if updateOk.
	// Shows the clearButton if confirmed, otherwise shows the setButton.
	// Enables the clearButton if updateOk.
	// Enables the setButton if updateOk and the input element value is syntactically valid.
	// The tick cell is set to "✔" if confirmed, "?" if a valid value has been entered, otherwise "✘".

	updateSetupRow(inputElem, setButtonElem, clearButtonElem, tickCellElem, assigned, confirmed, updateOk) {
		let inputValid = Boolean(inputElem.value && inputElem.validity.valid);
		if (assigned) {
			inputElem.setAttribute("readonly", "");
			clearButtonElem.style.display = "inline";
			clearButtonElem.disabled = !updateOk;
			setButtonElem.style.display = "none";
		}
		else {
			inputElem.removeAttribute("readonly");
			setButtonElem.style.display = "inline";
			setButtonElem.disabled = !(inputValid && updateOk);
			clearButtonElem.style.display = "none";
		}
		this.updateTickCell(tickCellElem, true, inputValid, confirmed);
	}
	
	// Updates a row used to start and stop a process.
	// Shows the stopButton if started, otherwise shows the startButton.
	// Enables both buttons if updateOk.
	// The tickCell is set to "✔" if confirmed, "?" if started, otherwise empty.
	
	updateStartStopRow(startButtonElem, stopButtonElem, tickCellElem, started, confirmed, updateOk) {
		if (started) {
			stopButtonElem.style.display = "inline";
			stopButtonElem.disabled = !updateOk;
			startButtonElem.style.display = "none";
		}
		else {
			startButtonElem.style.display = "inline";
			startButtonElem.disabled = !updateOk;
			stopButtonElem.style.display = "none";
		}
		this.updateTickCell(tickCellElem, started, true, confirmed);
	}
	
	// Sets content to "✔" if confirmed, "?" if entered, "✘" if relevant, otherwise empty.
	// Updates the className correspondingly.

	updateTickCell(tickCellelem, relevant, valid, confirmed) {
		if (relevant) {
			if (confirmed) {
				tickCellelem.className = "tick confirmed";
				this.replaceChildNodesWithText(tickCellelem, "✔");
			}
			else {
				if (valid) {
					tickCellelem.className = "tick valid";
					this.replaceChildNodesWithText(tickCellelem, "?");
				}
				else {
					tickCellelem.className = "tick invalid";
					this.replaceChildNodesWithText(tickCellelem, "✘");
				}
			}
		}
		else {
			tickCellelem.className = "tick";
			this.removeChildNodes(tickCellelem);
		}
	}
	
	// Replaces all child nodes with a text node

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

	/*
	 ------------------------------------------------------------------------------------------------------------------
	 Misc Utilities
	 ------------------------------------------------------------------------------------------------------------------
	 */

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
	

}
