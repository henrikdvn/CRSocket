class MathTrialsConfig extends CRConfig {
	
	validAccessTokenRegExp = /^[A-Za-z]{3,}$/;
	validParticipantIdRegExp = /^[0-9A-Za-z]{3,}$/;

	constructor() {
		super("mathtrials");
	}
	
	isValidParticipantId(participantId) {
		return Boolean(participantId && participantId.match(this.validParticipantIdRegExp));
	}

}
