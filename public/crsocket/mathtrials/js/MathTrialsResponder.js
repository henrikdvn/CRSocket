/*
 ------------------------------------------------------------------------------------------------------------------
 This class extends MathTrialsClient
 It implements a responder for displaying and collecting responses from simple arithmetic problem trials.
 ------------------------------------------------------------------------------------------------------------------
 */

class MathTrialsResponder extends MathTrialsClient {
	
	// EventTypes handled by the app

	partnerEventTypes = ["startTrials", "cancelTrials"];

	// Trial sequence
	
	trials = [];
	curTrial = null;

	constructor(config) {
		super(config, "responder");
		
		// The responder uses separate pages for setup and tasks
		
		this.setupPageElem = document.getElementById("setupPage");
		this.taskPageElem = document.getElementById("taskPage");
		
		// Task elements
		
		this.questionCellElem = document.getElementById("questionCell");
		this.answerInputElem = document.getElementById("answerInput");
		
	}
	
	/*
	 ------------------------------------------------------------------------------------------------------------------
	 Computed properties
	 ------------------------------------------------------------------------------------------------------------------
	 */
	
	// Returns true if there are more trials left
	
	get trialsRunning() {
		return this.curTrial !== null;
	}
	
	// Returns the currently submitted answer
	
	get curAnswer() {
		return this.answerInputElem.value;
	}
	
	/*
	 ------------------------------------------------------------------------------------------------------------------
	 Initiation
	 ------------------------------------------------------------------------------------------------------------------
	 */

	// Initiates page content and activates the app

	init() {
		super.init();
		this.socket.addEventListener("partnerClientIdChanged", this.onPartnerClientIdChanged.bind(this));
		this.answerInputElem.addEventListener("input", (e) => {
			let value = this.answerInputElem.value;
			let newValue = value.replaceAll(/[^0-9]/g, "");
			this.answerInputElem.value = newValue;
		});
	}
	
	/*
	 ------------------------------------------------------------------------------------------------------------------
	 Socket handlers
	 ------------------------------------------------------------------------------------------------------------------
	 */

	// The partnerClientId is assigned by a controller and transmitted to the socket.
	// This handler displays it on the setupPage.
	
	onPartnerClientIdChanged(e) {
		let clientId = e.detail;
		this.partnerClientIdInputElem.value = clientId;
		this.partnerClientId = clientId;
	}
	
	// When the app receives a "startTrials" event it will generate a trial sequence, display it on the taskPage and respond with "trialsStarted".
	// When it receives a "cancelTrials" event, it will reset the trialSequence and respond with "trialsCancelled".

	onCrEvent(crEvent) {
		if (this.partnerEventTypes.includes(crEvent.eventType)) {
			switch (crEvent.eventType) {
				case "startTrials":
					var trial;
					var trialNo;
					this.resetTrials();
					var testerId = crEvent.eventParams.shift();
					var participantId = crEvent.eventParams.shift();
					var noOfTrials = parseInt(crEvent.eventParams.shift());
					for (trialNo = 1; trialNo <= noOfTrials; trialNo++) {
						trial = new MathTrial();
						trial.initWithProperties(testerId, participantId, trialNo);
						this.trials.push(trial);
					}
					this.socket.sendCrEventWithParams("trialsStarted", "", [participantId, noOfTrials]);
					this.showNextTrial();
					break;
				case "cancelTrials":
					this.resetTrials();
					this.socket.sendCrEventWithParams("trialsCancelled");
					break;
				default:
					break;
			}
			this.updatePage();
		}
	}
		
	/*
	 ------------------------------------------------------------------------------------------------------------------
	 UI commands
	 ------------------------------------------------------------------------------------------------------------------
	 */
	
	// The responder can unassign the current controller in order to enable switcing to another one.

	unassignPartner() {
		if (this.buttonsEnabled) {
			this.onButtonEvent();
			this.socket.partnerClientId = "";
		}
	}
	
	// This function sends a "trialComplete" event containing trial info, including response time and answer.
	// If the app is offline, socket will save the event ans try to send again if/when it goes online again.
	// The event will be always logged at the server, even if it's not sent.
	// The event may be intercepted/modified at eventsender and eventsource.
	// If there are more trials, the next one will be displayed on the trialPage. If not, it will send a "trialsComplete" event.

	submitTrial() {
		if (this.buttonsEnabled) {
			this.onButtonEvent();
			if (this.curAnswer) {
				this.curTrial.respCt = Date.now();
				this.curTrial.respAnswer = this.curAnswer;
				var event = this.socket.sendCrEventWithParams("trialComplete", "", this.curTrial.eventParams, true, true, true);
				if (this.trials.length > 0) {
					this.showNextTrial();
				}
				else {
					this.socket.sendCrEventWithParams("trialsComplete");
					this.resetTrials();
					this.updatePage();
				}
			}
			else {
				console.warn("submitTrial, noAnswer");
			}
		}
	}
	
	/*
	 ------------------------------------------------------------------------------------------------------------------
	 UI utilities
	 ------------------------------------------------------------------------------------------------------------------
	 */
	
	// Shows the taskPage if trialsRunning and the socket is readyToSend.
	// Shows the setupPage if not trialsRunning and the socketState is not "interacting".
	// Otherwise shows nothing.

	updatePage() {
		super.updatePage();
		if (this.trialsRunning && this.socket.readyToSend) {
			this.showPage("task");
		}
		else {
			if (this.socket.state == "interacting") {
				this.showPage("");
			}
			else {
				this.showPage("setup");
			}
		}
	}

	// Updates the partnerRow (accessToken).
	// Enables the unassign button if the socket is paired.

	/*
	updatePartnerRow() {
		this.updateSetupRow(this.partnerClientIdInputElem,
												this.assignPartnerButtonElem,
												this.unassignPartnerButtonElem,
												this.interactingCellElem,
												this.socket.paired,
												this.socket.state == "interacting",
												this.trialState != "started");
	}
	
	updateSetupRow2(inputElem, clearButtonElem, tickCellElem, assigned, confirmed, updateOk) {
		if (assigned) {
			//inputElem.setAttribute("readonly", "");
			clearButtonElem.style.display = "inline";
			clearButtonElem.disabled = !updateOk;
			//setButtonElem.style.display = "none";
		}
		else {
			//inputElem.removeAttribute("readonly");
			//setButtonElem.style.display = "inline";
			//setButtonElem.disabled = !(inputValid && updateOk);
			clearButtonElem.style.display = "none";
		}
		this.updateTickCell(tickCellElem, true, inputValid, confirmed);
	}
*/
	updatePartnerRow() {
		this.unassignPartnerButtonElem.disabled = !this.socket.paired;
		this.updateTickCell(this.interactingCellElem, true, this.socket.paired, this.socket.state == "interacting");
	}

	// Show a given page and hides the other ones.

	showPage(pageName) {
		switch (pageName) {
			case "setup":
				this.setupPageElem.style.display = "block";
				this.taskPageElem.style.display = "none";
				break;
			case "task":
				this.setupPageElem.style.display = "none";
				this.taskPageElem.style.display = "block";
				break;
			default:
				this.setupPageElem.style.display = "none";
				this.taskPageElem.style.display = "none";
				break;
		}
	}
	
	// Show the next trial and assigns the start time.

	showNextTrial() {
		this.answerInputElem.value = "";
		this.curTrial = this.trials.shift();
		if (this.curTrial) {
			this.replaceChildNodesWithText(this.questionCellElem, this.curTrial.expressionStr+" = ?");
			this.curTrial.startCt = Date.now();
			//setTimeout(() => {
			//	this.answerInputElem.focus();
			//}, 1000);
		}
		else {
			console.warn("showNextTrial, noCurTrial");
		}
	}
	
	// Resets the current trial sequence.

	resetTrials() {
		this.trials = [];
		this.curTrial = null;
		this.removeChildNodes(this.questionCellElem);
		this.answerInputElem.value = "";
	}
}
