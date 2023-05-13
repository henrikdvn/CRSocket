<?php

include_once "CRConfig.php";

/*
 ------------------------------------------------------------------------------------------------------------------
 This class is used to generate a clientId which is unique within the current hosting domain
 This is achieved by means of a full period, 32 bit linear congruential generator
 The sequence will be repeated when it has generated (10 ** $clientIdNoOfDigits) ids
 ------------------------------------------------------------------------------------------------------------------
 */

class CRClientIdGen {
	
	function __construct($config) {
		$this->config = $config;
	}
	
	/*
	 ------------------------------------------------------------------------------------------------------------------
	 Methods, public
	 ------------------------------------------------------------------------------------------------------------------
	 */
	
	// Returns a unique string consisting of $clientIdNoOfDigits digits
	
	public function getNextClientId() {
		$maxDecValue = 10 ** $this->clientIdNoOfDigits - 1;
		$noOfBits = intval(ceil(log($maxDecValue, 2)));
		$maxBinValue = 2 ** $noOfBits;
		$nextClientId = $this->getNextId($noOfBits);
		while ($nextClientId > $maxDecValue) {
			$nextClientId = $this->getNextId($noOfBits);
		}
		$clientIdStr = sprintf("%0".$this->clientIdNoOfDigits."d", $nextClientId);
		return $clientIdStr;
	}
	
	/*
	 ------------------------------------------------------------------------------------------------------------------
	 Properties, private or protected
	 ------------------------------------------------------------------------------------------------------------------
	 */
	
	// CRConfig object
	
	private object $config;
	
	// No of digits in each clientId string
	
	private int $clientIdNoOfDigits = 6;
	
	/*
	 ------------------------------------------------------------------------------------------------------------------
	 Methods, private or protected
	 ------------------------------------------------------------------------------------------------------------------
	 */
	
	// Returns the value that comes after the provided $prevValue in the lcg sequence,
	// specified by $a (multiplier), $c (increment) and $m (modulus)
	
	private function genNextLcgValue($prevValue) {
		$a = 0x915f77f5;
		$c = 0x1;
		$m = 0xffffffff;
		return gmp_and(gmp_add(gmp_mul($a, $prevValue), $c), $m);
	}
	
	// Computes the lcg value that comes after the previous id, saves it and returns it.
	// The value stored in the file prevId.bin, located in the $config->crsDataRoot directory.
	
	private function getNextId($noOfBits) {
		$prevIdFilePath = $this->config->crsDataRoot."/prevId.bin";
		if (!file_exists($prevIdFilePath)) {
			$fh = fopen($prevIdFilePath, "w");
			flock($fh, LOCK_EX);
			$prevId = gmp_init(1);
		}
		else {
			$fh = fopen($prevIdFilePath, "r+");
			flock($fh, LOCK_EX);
			$prevId = gmp_import(fread($fh, 4), 4);
		}
		$nextId = $this->genNextLcgValue($prevId);
		rewind($fh);
		fwrite($fh, gmp_export($nextId, 4));
		fflush($fh);
		flock($fh, LOCK_UN);
		return $nextId % (2 << $noOfBits);
	}
}
