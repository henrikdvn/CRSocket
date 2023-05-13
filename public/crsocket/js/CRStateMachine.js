/*
 ------------------------------------------------------------------------------------------------------------------
 This class implements basic state management functions.
 ------------------------------------------------------------------------------------------------------------------
 */

class CRStateMachine {
	
	constructor() {
	}
	
	/*
	 ------------------------------------------------------------------------------------------------------------------
	 Properties, public
	 ------------------------------------------------------------------------------------------------------------------
	 */
	
	// The current state
	
	get state() {
		return this._curContext.state;
	}
	
	// The current subState, for informational purposes only
	
	get subState() {
		return this._curContext.subState;
	}
	
	// The previous state
	
	get prevState() {
		return this._prevContext.state;
	}
	
	get prevSubState() {
		return this._prevContext.subState;
	}
	
	/*
	 ------------------------------------------------------------------------------------------------------------------
	 Methods, public
	 ------------------------------------------------------------------------------------------------------------------
	 */
	
	// Adds an event listener to an event type
	
	addEventListener(type, listener) {
		this.#eventTarget.addEventListener(type, listener);
	}
	
	// Removes an event listener
	
	removeEventListener(type, listener) {
		this.#eventTarget.removeEventListener(type, listener);
	}
	
	/*
	 ------------------------------------------------------------------------------------------------------------------
	 Properties, private or protected
	 ------------------------------------------------------------------------------------------------------------------
	 */
	
	// Context objects
	
	_curContext = null;
	_prevContext = null;
	
	// Used to implement eventListener functionality
	
	#eventTarget = new EventTarget();
	
	// Sets the current state and posts a stateChanged event
	
	set _state(newValue) {
		if (this._curContext.state != newValue) {
			this._prevContext.state = this._curContext.state;
			this._curContext.state = newValue;
			this._onStateChanged();
		}
	}
	
	// Sets the current subState and posts a subStateChanged event
	
	set _subState(newValue) {
		if (this._curContext.subState != newValue) {
			this._prevContext.subState = this._curContext.subState;
			this._curContext.subState = newValue;
			this._onSubStateChanged();
		}
	}
	
	// If true, all state changes will be logged, the setter can be overridden by subclasses
	
	_logStateChanges = false;
	
	/*
	 ------------------------------------------------------------------------------------------------------------------
	 Methods, private or protected
	 ------------------------------------------------------------------------------------------------------------------
	 */
	
	// Generates current and previous context instances
	
	_genContext() {
		this._curContext = new CRStateMachineContext("cur");
		this._prevContext = new CRStateMachineContext("prev");
	}
	
	// Event handlers
	
	_onStateChanged() {
		if (this._logStateChanges) {
			console.log(this.constructor.name, "stateChanged", this._prevContext.state, this._curContext.state, CRUtil.dt);
		}
		this._dispatchEventTypeAsync("stateChanged", this._curContext.state);
	}
	
	_onSubStateChanged() {
		this._dispatchEventTypeAsync("subStateChanged", this._curContext.subState);
	}
	
	// Dispatches an event synchronously
	
	_dispatchEvent(event) {
		this.#eventTarget.dispatchEvent(event);
	}
	
	// Dispatches an event asynchronously
	
	_dispatchEventAsync(event) {
		setTimeout(() => {
			this._dispatchEvent(event);
		}, 0);
	}
	
	// Dispatches an event synchronously, with a given type and detail property
	
	_dispatchEventType(type, detail = null) {
		var event;
		if (detail == null) {
			event = new CustomEvent(type);
		}
		else {
			event = new CustomEvent(type, {detail: detail});
		}
		this.#eventTarget.dispatchEvent(event);
	}
	
	// Dispatches an event asynchronously, with a given type and detail property
	
	_dispatchEventTypeAsync(type, detail = null) {
		setTimeout(() => {
			this._dispatchEventType(type, detail);
		}, 0);
	}
}

/*
 ------------------------------------------------------------------------------------------------------------------
 This class provides access to properties and methods from current and previous CRStateMachine contexts
 ------------------------------------------------------------------------------------------------------------------
 */

class CRStateMachineContext {
	
	constructor(role) {
		this.role = role;
	}
	
	/*
	 ------------------------------------------------------------------------------------------------------------------
	 Properties, public
	 ------------------------------------------------------------------------------------------------------------------
	 */
	
	// context role ("cur" or "prev")
	
	role = "";
	
	// state name
	
	state = "";
	
	// subState name
	
	subState = "";
	
	// Returns a description of this context
	
	get descr() {
		return "role: "+this.role+", state: "+this.state+", subState: "+this.subState;
	}
	
}

/*
 ------------------------------------------------------------------------------------------------------------------
 This class represents a binary state variable which may be associated with a substate
 ------------------------------------------------------------------------------------------------------------------
 */

class CRBinaryState {
	
	constructor() {
	}
	
	active = false;
	subState = "";
	
	activate(subState = "") {
		this.active = true;
		this.subState = subState;
	}
	
	deactivate() {
		this.active = false;
		this.subState = "";
	}
	
	copyFrom(other) {
		this.active = other.active;
		this.subState = other.subState;
	}
}
