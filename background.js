
//Global variables
var active = false;	// flag indicates whether the extension is on or off
var tabIDs = [];	// array of all opened tab ids
var count = 0;  	// number of tabs remove

/* Add event listener to extension's icon
 * - when icon is clicked, call getTabIds() and updateIcon()
 */
chrome.browserAction.onClicked.addListener(function(tab) {
	getTabIds();
	updateIcon(tab);
});

/* Get tab ids of all current opened tabs in chrome browser
 * - save all tab ids to tabIDs array
 */
function getTabIds() {
	chrome.windows.getAll({populate:true}, function(windows) {
		//check if tabIDs is empty, if not, empty the array
		if (tabIDs.length > 0) {
			tabIDs = [];
		}

		//add each tab id into tabIDs array
		for (var i = 0; i < windows.length; i++) {
			for (var j = 0; j < windows[i].tabs.length; j++) {
				tabIDs.push(windows[i].tabs[j].id);
			}
		}
	});
}

/* Turn the functionality of this extension on or off by checking the 
 * current title of the icon
 */
function updateIcon(tab) {
	// get title of currently focused tab
	chrome.browserAction.getTitle({tabId: tab.id}, function(result) {
		// if title is "Turn On Page Blocker": activate extension
		if (result === "Turn On Page Blocker") {
			activateExtension();
		}
		//if title is "Turn Off Page Blocker": inactivate extension
		else {
			inactivateExtension();
		}
	});
}

/* Add event listener for each successfuly web navigation
 */
chrome.webNavigation.onCommitted.addListener(function(details) {
	//check if extension functionality is turned on
	if (active) {
		var exist = false;

		/* check if current tab id is in tabIDs
			if current tab id is in tabIDs 
			- set exist to true and do nothing as navigation on the same tab is allowed

			if current tab id is not in tabIDs (this is a new tab) 
			- remove/close the tab
			- update count
		*/
		for (var i = 0; i < tabIDs.length; i++) {
			if (tabIDs[i] == details.tabId) {
				exist = true;
				break;
			}
		}

		if (!exist) {
			chrome.tabs.remove(details.tabId, function(){
				if (chrome.runtime.lastError) {
					console.log(chrome.runtime.lastError);
				}
				else {
					updateCount();
					console.log("tab closed");
				}
				getTabIds();
			});
		}
	}
});

/* Update number of tabs closed count
 */
function updateCount() {
	count++;
	if (active) {
		chrome.browserAction.setBadgeText({text:count.toString()});
	}
}

/* turn off extension functionality
	- set icon to inactive.png
	- set title to "Turn On Page Blocker"
	- set global variable active to false
	- un-set badge
*/
function inactivateExtension(){
	//set icon
	chrome.browserAction.setIcon({path: {"16":"inactive-16.png", "32":"inactive-32.png"}});
	
	//set title
	chrome.browserAction.setTitle({title:"Turn On Page Blocker"});

	//set global variable active to false
	active = false;

	//set badge background color and text
	chrome.browserAction.setBadgeBackgroundColor({color:[190, 190, 190, 230]});
	chrome.browserAction.setBadgeText({text:""});

	//reset count to 0
	count = 0;
}

/* turn on extension functionality
	- set icon to active.png
	- set title to "Turn Off Page Blocker"
	- set global variable active to true
	- set badge background color and text
 */
function activateExtension() {
	//set icon
	chrome.browserAction.setIcon({path: {"16":"active-16.png", "32":"active-32.png"}});
	
	//set title
	chrome.browserAction.setTitle({title:"Turn Off Page Blocker"});
	
	//set global variable active to true
	active = true;

	//set badge background color and text
	chrome.browserAction.setBadgeBackgroundColor({color:"#BDC3C7"});
	if (count > 0) {
		chrome.browserAction.setBadgeText({text:count.toString()});
	}
	else {
		chrome.browserAction.setBadgeText({text:""});
	}
}

/* add event listener to every window closed
 * - deactivate functionality when all window are closed by user to allow reopening of browser later
 * - when a new window is opened after all tabs or all windows are closed
 */
chrome.windows.onRemoved.addListener(function (windowID) {
	if (active) {
		chrome.windows.getAll({populate:true}, function(windows) {
			if (windows.length <= 0) {
				console.log("no active tabs. turning off...");
				inactivateExtension();
			}
		});
	}	
});

/* add event listener to every window created
 * - deactive functionality when a window is created when the extension functionality is not active
 * - when a new window is opened after chrome is forced to quit
 */
chrome.windows.onCreated.addListener(function (window) {
	if (!active) {
		inactivateExtension();
	}
})