chrome.extension.sendMessage({}, function (response) {
	var readyStateCheckInterval = setInterval(function () {
			if (document.readyState === "complete") {
				clearInterval(readyStateCheckInterval);
				injectScript(chrome.extension.getURL('/src/inject/inject.js'), 'body');
				chrome.storage.sync.get("users", function (items) {
					var users = $.map(items, function (value, index) {
							return [value];
						});
					users = users[0];
					console.log(users);
					var newEle;
					var newUser = true;
					//clearSaveData();
					if (!$(".playerTopMenu ul:first").length) {
						newEle = document.createElement('ul');
						$(".playerTopMenu").append(newEle);
					}
					if (typeof users === "undefined") {
						users = [];
					} else {
						for (var i = 0; i < users.length; i++) {
							if (users[i].id == getID()) {
								newUser = false;
							} else {
								newEle = document.createElement('li');
								newEle.innerHTML = "<div class=\"icons navbarmenu prefs tkuser\"></div><a href=\"#\">" + users[i].name + "</a>";
								$(".playerTopMenu ul:first").append(newEle); //.on("click", loadSession, users[i].session)
							}
						}
					}
					if (typeof getID() == "undefined") {
						newEle = document.createElement("div");
						newEle.className = "icons carrot grey down";
						$(".playerTopMenu").prepend(newEle);
						$(".speechBubble").css("z-index", 0)
					} else if (!newUser) {
						newEle = document.createElement('li');
						newEle.innerHTML = "<div class=\"icons navbarmenu prefs\"></div><a href=\"#\">Switch account</a>";
						$(".playerTopMenu ul:first").append(newEle).on("click", fakeLogout);
					} else {
						newEle = document.createElement('li');
						newEle.innerHTML = "<div class=\"icons navbarmenu prefs\"></div><a href=\"#\">Save account</a>";
						$(".playerTopMenu ul:first").append(newEle).on("click", fakeLogout);
					}

					$(".playerTopMenu").on("click", function () {
						expandOptions(users.length + 1);
					});

					$(".tkuser").each(function (i, obj) {
						console.log(i + " " + users[i].name + " " + users[i].session);
						$(obj).parent().on("click", function () {
							loadSession(users[i].session);
							//console.log(users[i].name + " " + users[i].session);
						});
					});
				});
			}
		}, 10);

});

// User prototype
function User(name, id, session) {
	this.name = name;
	this.id = id;
	this.session = session;
}

// Never returns
function fakeLogout() {
	saveCurrentUser();
	chrome.runtime.sendMessage({
		cookie: null,
		clearCookies: true
	}, function (response) {
		window.location.reload(true);
	});
}

function clearSaveData() {
	if (confirm("Really delete all local user data?")) {
		chrome.storage.sync.set({
			'users': []
		}, function () {
			console.log("data cleared");
		});
	}
}
// Never returns
function loadSession(newCookie) {
	//console.log(newCookie);
	chrome.runtime.sendMessage({
		cookie: newCookie
	}, function (response) {
		if (typeof response.farewell == "undefined" || response.farewell == "ERROR") {
			alert("Unable to load account");
		} else {
			window.location.reload(true);
		}
	});
}

function expandOptions(userCount) {
	$(".playerTopMenu").toggleClass("active");
	if ($(".playerTopMenu").is(".active")) {
		$(".playerTopMenu .icons.carrot.grey").removeClass("down").addClass("up");
		$(".speechBubble").css("z-index", 0);
		$(".playerTopMenu").animate({
			height: (137 + 30 * (userCount)) + "px" //TODO should be 108 if not logged into an acc with adv lobbies enabled
		}, 200)
	} else {
		$(".playerTopMenu .icons.carrot.grey").removeClass("up").addClass("down");
		$(".playerTopMenu").animate({
			height: "45px"
		}, 200, function () {
			$(".speechBubble").css("z-index", 200)
		})
	}
}

function injectScript(file, node) {
	var th = document.getElementsByTagName(node)[0];
	var s = document.createElement('script');
	s.setAttribute('type', 'text/javascript');
	s.setAttribute('src', file);
	th.appendChild(s);
}

function saveCurrentUser() {
	if (typeof getID() == "undefined" || getName() == "")
		return;
	var users;
	chrome.storage.sync.get("users", function (items) {
		var users = $.map(items, function (value, index) {
				return [value];
			});
		users = users[0];
		if (typeof users === "undefined") {
			users = [];
		}

		var found = false;
		for (var i = 0; i < users.length; i++) {
			if (users[i].id == getID()) {
				users[i].name = getName();
				users[i].session = document.cookie;
				found = true;
			}
		}
		if (!found) {
			var newUser = new User(getName(), getID(), document.cookie);
			users.push(newUser);
		}
		chrome.storage.sync.set({
			'users': users
		}, function () {});
	});

}

function updateCurrentUser() {
	chrome.storage.sync.get("users", function (items) {
		if (!chrome.runtime.error) {
			var users = $.map(items, function (value, index) {
					return [value];
				});
			users = users[0];
			var changed = false;
			for (var i = 0; i < users.length; i++) {
				if (users[i].id == getID()) {
					users[i].name = getName();
					users[i].session = document.cookie;
					changed = true;
				}
			}
			if (changed) {
				chrome.storage.sync.set({
					'users': users
				}, function () {});
			}
		}
	});
}

function deleteUser(user) {
	chrome.storage.sync.get("users", function (items) {
		if (!chrome.runtime.error) {
			var users = $.map(items, function (value, index) {
					return [value];
				});
			users = users[0];
			for (var i = 0; i < users.length; i++) {
				if (users[i].id == getID()) {
					users.splice(i, 1);
				}
			}
			chrome.storage.sync.set({
				'users': users
			}, function () {});
		}
	});
}

function getName() {
	return $(".playerTopName").text();
}

function getID() {
	var steamid = $('a:contains("Profile"):first').attr("href");
	if (typeof steamid === "undefined") {
		return undefined;
	}
	return steamid.split("/")[2];
}
