<?php

class MathTrial {
	
	/*
	 ------------------------------------------------------------------------------------------------------------------
	 This class represents a mathematical trial with properties mirroring the corresponding ECMAScript class
	 ------------------------------------------------------------------------------------------------------------------
	 */
	
	static $mathOpsStr = ["plus", "minus", "multiply", "divide"];
	
	function __construct($crEvent) {
		$this->clientId = $crEvent->senderClientId;
		$i = 0;
		$this->testerId = $crEvent->eventParams[$i++];
		$this->participantId = $crEvent->eventParams[$i++];
		$this->trialNo = $crEvent->eventParams[$i++];
		$this->opNo = intval($crEvent->eventParams[$i++]);
		$this->value1 = intval($crEvent->eventParams[$i++]);
		$this->value2 = intval($crEvent->eventParams[$i++]);
		$this->corrAnswer = intval($crEvent->eventParams[$i++]);
		$this->startCt = intval($crEvent->eventParams[$i++]);
		$this->respCt = intval($crEvent->eventParams[$i++]);
		$this->respAnswer = intval($crEvent->eventParams[$i++]);
		
		$this->savedParamNo = $i;
		$this->saved = $crEvent->eventParams[$i++];
		
		$this->opStr = self::$mathOpsStr[$this->opNo];
		$this->respDt = $this->respCt - $this->startCt;
	}
	
	/*
	 ------------------------------------------------------------------------------------------------------------------
	 Computed properties
	 ------------------------------------------------------------------------------------------------------------------
	 */
	
	function updateCrEvent(&$crEvent) {
		$crEvent->eventParams[$this->savedParamNo] = $this->saved;
	}
	
	// Returns a csv string containing trial data to be saved
	
	function getCsvRow() {
		return "$this->clientId,$this->startCt,$this->testerId,$this->participantId,$this->trialNo,$this->opStr,$this->value1,$this->value2,$this->corrAnswer,$this->respDt,$this->respAnswer\n";
	}
	
}
