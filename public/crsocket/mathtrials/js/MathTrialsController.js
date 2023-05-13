/*
 ------------------------------------------------------------------------------------------------------------------
 This class extends MathTrialsClient
 It implements a controller for administering simple arithmetic problem trials
 ------------------------------------------------------------------------------------------------------------------
 */

class MathTrialsController extends MathTrialsClient {
	
	// EventTypes handled by the app
	
	partnerEventTypes = ["trialsStarted", "trialComplete", "trialsCancelled", "trialsComplete"];

	// The trialState indicates the current stage in the trial administration process.
	// It can be "readyToStart", "starting" "started" or "cancelling".
	
	trialState = "";

	constructor(config) {
		super(config, "controller");
		
		// ParticipantRow elements

		this.participantRowElem = document.getElementById("participantRow");
		this.participantIdInputElem = document.getElementById("participantIdInput");
		this.setParticipantIdButtonElem = document.getElementById("setParticipantIdButton");
		this.clearParticipantIdButtonElem = document.getElementById("clearParticipantIdButton");
		this.participantOkCellElem = document.getElementById("participantOkCell");

		// TrialCtrRow elements

		this.trialCtrRowElem = document.getElementById("trialCtrRow");
		this.startTrialsButtonElem = document.getElementById("startTrialsButton");
		this.cancelTrialsButtonElem = document.getElementById("cancelTrialsButton");
		this.trialsRunningCellElem = document.getElementById("trialsRunningCell");

		// TrialStats cells
		
		this.participantIdCellElem = document.getElementById("participantIdCell");
		this.noOfCorrCellElem = document.getElementById("noOfCorrCell");
		this.noOfIncorrCellElem = document.getElementById("noOfIncorrCell");
		this.avgResponseDtCellElem = document.getElementById("avgResponseDtCell");
		this.noOfSavedCellElem = document.getElementById("noOfSavedCell");
		
		this.downloadLinkElem = document.getElementById("downloadLink");

		this.initiateTrialStatsValues();
	}
		
	// Initiates trialStats values

	initiateTrialStatsValues() {
		this.noOfCorr = 0;
		this.noOfIncorr = 0;
		this.curRespDtTotal = 0;
		this.noOfTrials = 0;
		this.noOfSaved = 0;
	}
	
	/*
	 ------------------------------------------------------------------------------------------------------------------
	 Computed properties
	 ------------------------------------------------------------------------------------------------------------------
	 */

	// The participantId is saved in localStorage
	
	get participantId() {
		return this.socket.localStorageGet("participantId");
	}
	
	set participantId(newValue) {
		if (this.participantId != newValue) {
			this.socket.localStorageSet("participantId", newValue);
		}
	}
		
	// Returns true if the currently saved participantId is valid
	
	get participantIdAssigned() {
		return this.config.isValidParticipantId(this.participantId);
	}
	
	get trialsRunning() {
		return Boolean(this.trialState == "started");
	}
	
	/*
	 ------------------------------------------------------------------------------------------------------------------
	 Initiation
	 ------------------------------------------------------------------------------------------------------------------
	 */

	// Initiates page content and activates the app

	init() {
		super.init()
		
		// Delayed initiation avoiding internal errors in some browsers.
		
		this.trialState = "readyToStart";
		this.updateTrialStatsTable();

		setTimeout(() => {
			this.participantIdInputElem.setAttribute("pattern", this.config.validParticipantIdRegExp.source);
			this.participantIdInputElem.value = this.participantId;
		}, 1000);

	}
	
	/*
	 ------------------------------------------------------------------------------------------------------------------
	 Socket handlers
	 ------------------------------------------------------------------------------------------------------------------
	 */
	
	// If the app is "starting" and receives a "trialsStarted" event it will switch to "started".
	// It will also switch to "started" before processing "trialComplete" in case the "trialsStarted" event was disrupted.
	// If it is "started" and receives a "trialComplete" event with a matching participantId, it will update the trial stats table.
	// If it receives a "trialsCancelled" or "trialsComplete" event, it will switch to "readyToStart".

	onCrEvent(crEvent) {
		if (this.partnerEventTypes.includes(crEvent.eventType)) {
			switch (crEvent.eventType) {
				case "trialsStarted":
					if (this.trialState == "starting") {
						this.trialState = "started";
					}
					break;
				case "trialComplete":
					if (this.trialState == "starting") {
						this.trialState = "started";
					}
					if (this.trialState == "started") {
						var mathTrial = new MathTrial();
						mathTrial.initWithCrEvent(crEvent);
						if (mathTrial.participantId == this.participantId) {
							this.trialState = "started";
							switch (mathTrial.result) {
								case "success":
									this.noOfCorr += 1;
									break;
								case "failure":
									this.noOfIncorr += 1;
									break;
								default:
									console.warn("onCrEvent, invalidResult", mathTrial.result);
									break;
							}
							if (mathTrial.saved) {
									this.noOfSaved += 1;
							}
							else {
								console.warn("onCrEvent, notSaved", crEvent.eventSubType);
							}
							this.curRespDtTotal += mathTrial.respDt;
							this.noOfTrials += 1;
							this.updateTrialStatsTable();
						}
						else {
							console.warn("onCrEvent, participantIdMismatch", this.participantId, mathTrial.participantId);
						}
					}
					else {
						console.warn("onCrEvent, notStarted");
					}
					break
				case "trialsCancelled":
				case "trialsComplete":
					this.trialState = "readyToStart";
					break;
				default:
					break;
			}
			this.updatePage();
		}
	}
		
	/*
	 ------------------------------------------------------------------------------------------------------------------
	 UI handlers
	 ------------------------------------------------------------------------------------------------------------------
	 */
	
	// Updates the respective rows to reflect potential changes in input element validity.
	
	onPartnerClientIdInputChanged() {
		this.updatePartnerRow();
	}
	
	onParticipantIdInputChanged() {
		this.updateParticipantRow();
	}

	/*
	 ------------------------------------------------------------------------------------------------------------------
	 UI commands
	 ------------------------------------------------------------------------------------------------------------------
	 */
	
	// Saves the partnerClientId input value and assigns it to the socket.
	// This may cause a socketState change.
	
	assignPartner() {
		if (this.buttonsEnabled) {
			this.onButtonEvent();
			this.partnerClientId = this.toString(this.partnerClientIdInputElem.value);
			this.socket.partnerClientId = this.partnerClientId;
		}
	}
	
	// Clears the partnerClientId input value, saves it and assigns it to the socket.
	// This may cause a socketState change.

	unassignPartner() {
		if (this.buttonsEnabled) {
			this.onButtonEvent();
			this.partnerClientIdInputElem.value = "";
			this.partnerClientId = "";
			this.socket.partnerClientId = "";
		}
	}

	// Saves the participantId input value and updates the page.

	setParticipantId() {
		if (this.buttonsEnabled) {
			this.onButtonEvent();
			this.participantId = this.toString(this.participantIdInputElem.value);
			this.updatePage();
		}
	}
	
	// Clears the participantId input value, saves it and updates the page.

	clearParticipantId() {
		if (this.buttonsEnabled) {
			this.onButtonEvent();
			this.participantIdInputElem.value = "";
			this.participantId = "";
			this.updatePage();
		}
	}
	
	// If the trialState is "readyToStart": resets the trialStats table and tries to start a new trial sequence with 3 trials.
	// The sequence is randomly generated by the responder.
	// Switches trialState to "starting".

	startTrials() {
		if (this.buttonsEnabled) {
			this.onButtonEvent()
			if (this.trialState == "readyToStart") {
				this.resetTrialStats();
				this.socket.sendCrEventWithParams("startTrials", "", [this.socket.accessToken, this.participantId, 3]);
				this.trialState = "starting";
				this.updatePage();
			}
			else {
				console.warn("startTrials, notReady");
			}
		}
	}
	
	// Attempts to cancel the current trial sequence (if any) at the responder

	cancelTrials() {
		if (this.buttonsEnabled) {
			this.onButtonEvent();
			this.socket.sendCrEventWithParams("cancelTrials");
			this.trialState = "cancelling";
			this.updatePage();
		}
	}
	
	// Initiates trialStats values and updates the trialStats table
	
	resetTrialStats() {
		this.initiateTrialStatsValues();
		this.updateTrialStatsTable();
	}
		
	/*
	 ------------------------------------------------------------------------------------------------------------------
	 UI utilities
	 ------------------------------------------------------------------------------------------------------------------
	 */
	
	// Updates the page

	updatePage() {
		super.updatePage();
		this.updateParticipantRow();
		this.updateTrialCtrRow();
		this.updateTrialStatsTable();
		this.updateDownloadLink();
	}
	
	// Updates the partnerRow (responder clientId)
	// Enables the partnerClientId input element if the trialState is not "started".
	// Shows the unassignButton when the the socketState is "interacting", otherwise shows the assignButton.
	// Enables the unassignButton button if the trialState is not "started".
	// Enables the assignButton iif the trialState is not "started" and the provided partnerClientId is syntactically valid.
	// Sets the interacting tickCell to "✔" if the socketState is "interacting", "?" if a valid partnerClientId has been entered, otherwise "✘".

	updatePartnerRow() {
		this.updateSetupRow(this.partnerClientIdInputElem,
												this.assignPartnerButtonElem,
												this.unassignPartnerButtonElem,
												this.interactingCellElem,
												this.socket.paired,
												this.socket.state == "interacting",
												this.trialState != "started");
	}

	// Updates the participantRow (participantId)
	// Enables the participantId input element if the trialState is not "started".
	// Shows the clearButton when a participantId has been assigned, otherwise shows the setButton.
	// Enables the clearButton if the trialState is not "started".
	// Enables setButton if the trialState is not "started" and the provided participantId is syntactically valid.
	// sets the participantOk tickCell to "✔" if a participantId has been assigned, "?" if a valid participantId has been entered, otherwise "✘".

	updateParticipantRow() {
		this.updateSetupRow(this.participantIdInputElem,
												this.setParticipantIdButtonElem,
												this.clearParticipantIdButtonElem,
												this.participantOkCellElem,
												this.participantIdAssigned,
												this.participantIdAssigned,
												this.trialState != "started");
	}

	// Updates the trialCtrRow (start/cancel trials)
	// Shows the startButton if the trialState is not "started", otherwise shows the stopButton.
	// Enables both buttons if a participantId has been assigned and the socketState is "interacting".
	// The trialsRunning tickCell is set to "✔" if the trialState is "started", "?" if the trialState is "starting", empty if the trialState is "readyToStart".

	updateTrialCtrRow() {
		this.updateStartStopRow(this.startTrialsButtonElem,
														this.cancelTrialsButtonElem,
														this.trialsRunningCellElem,
														this.trialState != "readyToStart",
														this.trialState == "started",
														this.trialState == "started" || (this.socket.state == "interacting" && this.participantIdAssigned));
	}
	
	// Updates the trialStatsTable
	
	updateTrialStatsTable() {
		this.replaceChildNodesWithText(this.participantIdCellElem, this.participantId);
		this.replaceChildNodesWithText(this.noOfCorrCellElem, this.noOfCorr);
		this.replaceChildNodesWithText(this.noOfIncorrCellElem, this.noOfIncorr);
		let avgResponseDt = Math.round(this.curRespDtTotal / this.noOfTrials);
		this.replaceChildNodesWithText(this.avgResponseDtCellElem, avgResponseDt);
		this.replaceChildNodesWithText(this.noOfSavedCellElem, this.noOfSaved);
	}
	
	// Updates the downloadLink
	// If the socket is connected the link is enabled and updated with the current accessToken and participantId.
	// If not connected, the link is reset and disabled.

	updateDownloadLink() {
		if (this.socket.connected && this.participantIdAssigned) {
			this.downloadLinkElem.setAttribute("href", "../download/?accessToken="+this.accessToken+"&participantId="+this.participantId);
			this.downloadLinkElem.setAttribute("download", "");
			this.downloadLinkElem.disabled = false;
		}
		else {
			this.downloadLinkElem.removeAttribute("href");
			this.downloadLinkElem.removeAttribute("download");
			this.downloadLinkElem.disabled = true;
		}
	}
	

}
