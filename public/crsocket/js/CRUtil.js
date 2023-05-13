/*
 ------------------------------------------------------------------------------------------------------------------
 This class contains static properties and methods for internal use only
 ------------------------------------------------------------------------------------------------------------------
 */

class CRUtil {
	
	/*
	 ------------------------------------------------------------------------------------------------------------------
	 Properties, static
	 ------------------------------------------------------------------------------------------------------------------
	 */
	
	// CalendarTime when the dt property was last retrieved
	
	static #prevCt;
	
	/*
	 ------------------------------------------------------------------------------------------------------------------
	 Methods, static
	 ------------------------------------------------------------------------------------------------------------------
	 */
	
	// Returns the deltaTime since it was last retrieved
	
	static get dt() {
		let curCt = Date.now()
		if (!this.#prevCt) {
			this.#prevCt = curCt
		}
		let dt = curCt - this.#prevCt
		this.#prevCt = curCt
		return dt
	}
	
	/*
	 ------------------------------------------------------------------------------------------------------------------
	 LocalStorage utilities
	 To facilitate multiple apps within the same domain, localStorage keys are prefixed with the appId and the current clientRole.
	 If the value is null, undefined or empty string, the corresponding key/value pair is removed from localStorage.
	 Other values are explicitly converted to string before being saved in localStorage.
	 ------------------------------------------------------------------------------------------------------------------
	 */
	
	
	static localStorageSet(appId, clientRole, key, value) {
		let storageKey = appId+"_"+clientRole+"_"+key
		if (value === null || value === undefined || value === "") {
			localStorage.removeItem(storageKey)
		}
		else {
			localStorage.setItem(storageKey, ""+value);
		}
	}
	
	// If there is no value for the given key, an empty  string is returned
	
	static localStorageGet(appId, clientRole, key) {
		let storageKey = appId+"_"+clientRole+"_"+key
		let value = localStorage.getItem(storageKey)
		if (value === null || value === undefined) {
			return ""
		}
		else {
			return value
		}
	}
	
	static localStorageRemove(appId, clientRole, key) {
		let storageKey = appId+"_"+clientRole+"_"+key
		localStorage.removeItem(storageKey)
	}
	
	/*
	 ------------------------------------------------------------------------------------------------------------------
	 XML document handling
	 ------------------------------------------------------------------------------------------------------------------
	 */
	
	// Recursively removes all empty text child nodes in an XML document
	
	static removeEmptyTextNodes(parent) {
		var curChild, nextChild;
		curChild = parent.firstChild;
		while (curChild) {
			nextChild=curChild.nextSibling;
			if (curChild.nodeType == 3 && curChild.nodeValue.trim() == "") {
				parent.removeChild(curChild);
			}
			if (curChild.nodeType == 1) {
				this.removeEmptyTextNodes(curChild);
			}
			curChild = nextChild;
		}
	}
	
	// Retrieves an XML document. The endHandler function will be called if the document is retrieved successfully
	
	static getXmlDoc(requestStr, endHandler) {
		var request;
		request = new XMLHttpRequest();
		request.onreadystatechange = this.xmlDocRequestReadyStateChanged.bind(this);
		request.endHandler = endHandler;
		request.requestStr = requestStr;
		request.open("GET", requestStr, true);
		request.send();
	}
	
	// XMLHttpRequest eady state handler
	
	static xmlDocRequestReadyStateChanged(event) {
		var request, readyState, status, requestStr, responseDoc, endHandler;
		request = event.target;
		readyState = request.readyState;
		if(readyState == 4) {
			status = event.srcElement.status;
			if (status == 200) {
				requestStr = request.requestStr
				responseDoc = request.responseXML;
				endHandler = request.endHandler;
				if (responseDoc) {
					this.removeEmptyTextNodes(responseDoc.documentElement);
					if (endHandler) {
						endHandler(responseDoc);
					}
					else {
						console.warn("xmlDocRequestReadyStateChanged, noEndHandler");
					}
				}
				else {
					console.warn("xmlDocRequestReadyStateChanged, noResponseDoc", requestStr);
				}
			}
			else {
				console.warn("xmlDocRequestReadyStateChanged, requestFailure", status);
			}
		}
	}
	
	static genMsgEventRequestStr(clientId, clientRole, accessToken, recipientClientId, eventType, eventData) {
		return "../sendevent/?clientId="+clientId+"&clientRole="+clientRole+"&accessToken="+encodeURIComponent(accessToken)+"&recipientClientId="+recipientClientId+"&eventType="+eventType+"&eventData="+encodeURIComponent(eventData);
	}
	
	// Sends a HTTP request without retrieving any response
	
	static sendRequest(requestStr) {
		if (navigator.onLine) {
			navigator.sendBeacon(requestStr);
		}
		else {
			console.warn("sendRequest, notOnline", requestStr);
		}
	}
}
