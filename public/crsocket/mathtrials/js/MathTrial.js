/*
 ------------------------------------------------------------------------------------------------------------------
 MathTrial
 This class represents a mathematical trial
 ------------------------------------------------------------------------------------------------------------------
 */

class MathTrial {
	
	static mathOpsSym = ["+", "-", "*", "/"];
	static mathOpsStr = ["plus", "minus", "multiply", "divide"];
	
	constructor() {
		this.testerId = "";
		this.participantId = "";
		this.trialNo = NaN;
		this.opNo = NaN;
		this.value1 = NaN;
		this.value2 = NaN;
		this.corrAnswer = NaN;
		this.startCt = NaN;
		this.respCt = NaN;
		this.respAnswer = NaN;
		this.saved = false;
	}
	
	// Event parameters used to initiate an outgoing CREvent
	
	get eventParams() {
		return [this.testerId, this.participantId, this.trialNo, this.opNo, this.value1, this.value2, this.corrAnswer, this.startCt, this.respCt, this.respAnswer, this.saved];
	}
	
	// The current operator, string
	
	get opStr() {
		if (Number.isInteger(this.opNo)) {
			return MathTrial.mathOpsStr[this.opNo];
		}
		else {
			return "";
		}
	}
	
	// The current operator, symbol
	
	get opSym() {
		if (Number.isInteger(this.opNo)) {
			return MathTrial.mathOpsSym[this.opNo];
		}
		else {
			return "";
		}
	}
	
	// A string describing the expression
	
	get expressionStr() {
		return this.value1+" "+this.opSym+" "+this.value2;
	}
	
	get result() {
		if (Number.isInteger(this.respAnswer) && Number.isInteger(this.corrAnswer)) {
			if (this.respAnswer == this.corrAnswer) {
				return "success";
			}
			else {
				return "failure";
			}
		}
		else {
			return "";
		}
	}
	
	// Response time
	
	get respDt() {
		if (this.startCt && this.respCt) {
			return this.respCt - this.startCt;
		}
		else {
			return NaN;
		}
	}
	
	// A random operator number within the range [0, 3]
	
	get rndOpNo() {
		return this.randInt(0, 3);
	}
	
	/*
	 ------------------------------------------------------------------------------------------------------------------
	 Methods
	 ------------------------------------------------------------------------------------------------------------------
	 */
	
	// Initiates a trial and generates a random equation with arguments and correct answer within the range [1-99].
	
	initWithProperties(testerId, participantId, trialNo) {
		
		this.testerId = testerId;
		this.participantId = participantId;
		this.trialNo = trialNo;
		this.opNo = this.rndOpNo;
		
		switch (this.opStr) {
			case ("plus"):
				this.corrAnswer = this.randInt(10, 99);
				this.value1 = this.randInt(1, this.corrAnswer - 1);
				this.value2 = this.corrAnswer - this.value1;
				break;
			case ("minus"):
				this.value1 = this.randInt(10, 99);
				this.value2 = this.randInt(1, this.value1 - 1);
				this.corrAnswer = this.value1 - this.value2;
				break;
			case ("multiply"):
				this.value1 = this.randInt(1, 9);
				this.value2 = this.randInt(1, 9);
				this.corrAnswer = this.value1 * this.value2;
				break;
			case ("divide"):
				this.value2 = this.randInt(1, 9);
				this.corrAnswer = this.randInt(1, 9);
				this.value1 = this.value2 * this.corrAnswer;
				break;
		}
	}
	
	// Initiates a trial from an inoming CREvent
	
	initWithCrEvent(crEvent) {
		var i = 0
		this.testerId = crEvent.eventParams[i++];
		this.participantId = crEvent.eventParams[i++];
		this.trialNo = parseInt(crEvent.eventParams[i++]);
		this.opNo = parseInt(crEvent.eventParams.shift());
		this.value1 = parseInt(crEvent.eventParams[i++]);
		this.value2 = parseInt(crEvent.eventParams[i++]);
		this.corrAnswer = parseInt(crEvent.eventParams[i++]);
		this.startCt = parseInt(crEvent.eventParams[i++]);
		this.respCt = parseInt(crEvent.eventParams[i++]);
		this.respAnswer = parseInt(crEvent.eventParams[i++]);
		this.saved = (crEvent.eventParams[i++] == "true");
	}
	
	
	// Generates a random integer within the range [minInt, maxInt]
	
	randInt(minInt, maxInt) {
		if (Number.isInteger(minInt) && Number.isInteger(maxInt) && maxInt > minInt) {
			return Math.floor(Math.random() * (maxInt + 1 - minInt)) + minInt;
		}
		else {
			console.warn("randInt, invalidParams", minInt, maxInt);
		}
	}
	
}
