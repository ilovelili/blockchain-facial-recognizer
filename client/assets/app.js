$(function () {
	const canvas = document.getElementById("canvas");
	const context = canvas.getContext("2d");
	const video = document.getElementById("video");
	const button1 = $("#snap");
	const teachButton = $("#teach");
	const sendTxButton = $("#send-tx");
	const txDetails = `<label for="">Receiver Address</label>
  <input type='text' id='amount'></input>`;
	const ganacheUrl = "http://127.0.0.1:8545";
	let dataURL;

	document.querySelector("#teach").style.display = "none";

	if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
		navigator.mediaDevices
			.getUserMedia({
				video: true,
			})
			.then(function (stream) {
				video.srcObject = stream;
				video.play();
			});
	}

	function setVariablesForTx() {
		event.preventDefault();
		$(".ui.modal").modal("hide");
		var name = event.target[1].value;
		var amount = event.target[0].value;
		$(".info.message").text(`Successfully sent ${amount} to ${name}`).fadeIn();
	}

	// Send transaction function
	function sendTransaction() {
		console.log("send tx");
		document.querySelector("#modal-header").innerText = "Send transaction";
		document.querySelector(".name-form").insertAdjacentHTML("afterbegin", txDetails);
		$(".ui.modal").modal("show");
		document.querySelector(".name-form").addEventListener("submit", setVariablesForTx);
	}

	function fetchName() {
		event.preventDefault();
		var name = event.target[0].value;
		var id = event.target[1].value;
		sendTeachData(name, id);
		$(".ui.modal").modal("hide");
		document.querySelector(".name-form").removeEventListener("submit", fetchName, { passive: true });
	}

	function openModal() {
		$(".ui.modal").modal("show");
		document.querySelector(".name-form").addEventListener("submit", fetchName);
	}

	function startTeaching() {
		button1.addClass("loading");
		$(".info.message").hide();
		context.drawImage(video, 0, 0, 400, 225);
		dataURL = canvas.toDataURL();
		openModal();
	}

	// Send data to api
	function sendTeachData(name, id) {
		id = Math.floor(Math.random() * 100 + 1);
		web3js = new Web3(new Web3.providers.HttpProvider(ganacheUrl));
		const address = web3js.eth.personal.newAccount(name);
		$.ajax({
			type: "POST",
			url: "/facebox/teach",
			data: {
				imgBase64: dataURL,
				name: name,
				id: address,
			},
			success: function (resp) {
				console.log(resp);
				teachButton[0].style.display = "none";
				sendTxButton[0].style.display = "";
				address.then((add) => $(".info.message").text(`Welcome, ${name}. Your address is ${add}`).fadeIn());
				teachButton
					.empty()
					.append(
						$("<i>", {
							class: "check icon",
						})
					)
					.removeClass("teal")
					.addClass("green")
					.transition("tada");
			},
			error: function () {
				$(".info.message").text("Sorry, please try again").fadeIn();
			},
			complete: function () {
				sendTxButton.removeClass("loading");
			},
		});
	}

	// Trigger photo take
	sendTxButton.click(function () {
		sendTxButton.addClass("loading");
		$(".info.message").hide();
		context.drawImage(video, 0, 0, 400, 225);
		dataURL = canvas.toDataURL();
		$.ajax({
			type: "POST",
			url: "/webFaceID",
			data: {
				imgBase64: dataURL,
			},
			success: function (resp) {
				if (resp.faces_len == 0) {
					$(".info.message").text("We didn't see a face").fadeIn();
					return;
				}
				if (resp.faces_len > 1) {
					$(".info.message").text("You must be alone to use Web Face ID securely").fadeIn();
					return;
				}
				if (!resp.matched) {
					console.log("unsuccessfull");
					sendTxButton.transition("shake");
					teachButton[0].style.display = "";
					sendTxButton[0].style.display = "none";
					// call teach function
					startTeaching();
					return;
				}
				console.log(resp);
				$(".info.message").text(`You got approved to send a Tx ${resp.name}`).fadeIn();
				console.log("success");
				console.info(resp);

				sendTransaction();
			},
			error: function () {
				$(".info.message").text("Sorry, please try again").fadeIn();
			},
			complete: function () {
				sendTxButton.removeClass("loading");
			},
		});
	});
});
