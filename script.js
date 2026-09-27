const createButton = document.getElementById("createWallet");


// ===============================
// CREATE / LOAD WALLET
// ===============================

createButton.addEventListener("click", async function () {

    try {

        const response = await fetch(
            "http://localhost:3000/wallet"
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error);
        }

        // Store private key for Show / Hide
        window.currentPrivateKey = data.privateKey;

        // Display wallet address
        document.getElementById("address").innerText =
            data.address;

        // Keep private key hidden
        document.getElementById("privateKey").innerText =
            "••••••••••••••••••••";

        console.log(data.message);

        // Get balance
        getBalance();

        // Get transaction history
        getTransactions();

    } catch (error) {

        console.log("Wallet Error:", error);

    }
});


// ===============================
// GET BALANCE
// ===============================

async function getBalance() {

    try {

        const response = await fetch(
            "http://localhost:3000/balance"
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error);
        }

        document.getElementById("balance").innerText =
            data.balance + " ETH";

            document.getElementById("dashboardBalance").innerText =
    data.balance + " ETH";

    } catch (error) {

        console.log("Balance Error:", error);

        document.getElementById("balance").innerText =
            "Unable to get balance";
    }
}
// ===============================
// REFRESH BALANCE
// ===============================

document.getElementById("refreshBalance")
    .addEventListener("click", function () {

        getBalance();

    });
// ===============================
// AUTO LOAD WALLET
// ===============================

async function loadWallet() {

    try {

        const response = await fetch(
            "http://localhost:3000/wallet"
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error);
        }

        // Store private key
        window.currentPrivateKey = data.privateKey;

        // Display address
        document.getElementById("address").innerText =
            data.address;

        // Keep private key hidden
        document.getElementById("privateKey").innerText =
            "••••••••••••••••••••";

        // Load balance
        getBalance();

        console.log("Wallet automatically loaded");

    } catch (error) {

        console.log(
            "Auto Load Wallet Error:",
            error
        );
    }
}

// ===============================
// SEND TRANSACTION
// ===============================

const sendButton =
    document.getElementById("sendTransaction");


sendButton.addEventListener("click", async function () {

    const receiverAddress =
        document.getElementById("receiverAddress").value.trim();

    const amount =
        document.getElementById("amount").value.trim();

    const status =
        document.getElementById("transactionStatus");

    const txHash =
        document.getElementById("txHash");


    // Check receiver address
    if (!ethers.isAddress(receiverAddress)) {

        status.innerText =
            "Invalid receiver address";

        return;
    }


    // Check amount
    if (!amount || Number(amount) <= 0) {

        status.innerText =
            "Enter a valid ETH amount";

        return;
    }
    // Check wallet balance
const balanceText =
    document.getElementById("balance").innerText;

const currentBalance =
    Number(balanceText.replace(" ETH", ""));

if (Number(amount) > currentBalance) {

    status.innerText =
        "Insufficient ETH balance";

    return;
}


    try {

        status.innerText =
            "Sending transaction...";

        txHash.innerText = "";


        const response = await fetch(
            "http://localhost:3000/send-transaction",
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    receiverAddress: receiverAddress,
                    amount: amount
                })
            }
        );


        const data = await response.json();


        if (!response.ok) {

            throw new Error(data.error);
        }


        status.innerText =
            "Transaction confirmed!";


        txHash.innerText =
            data.hash;


        // Refresh balance
        getBalance();

        // Refresh transaction history
        getTransactions();


    } catch (error) {

        console.log(
            "Transaction Error:",
            error
        );

        status.innerText =
            "Transaction failed: " +
            error.message;
    }
});


// ===============================
// TRANSACTION HISTORY
// ===============================

async function getTransactions() {

    try {

        const response = await fetch(
            "http://localhost:3000/transactions"
        );

        const transactions = await response.json();
        updateDashboard(transactions);


        if (!response.ok) {
            throw new Error(transactions.error);
        }


        const history =
            document.getElementById("transactionHistory");

        history.innerHTML = "";


        if (transactions.length === 0) {

            history.innerText =
                "No transactions found.";

            return;
        }


        transactions.forEach((tx) => {

            const div =
                document.createElement("div");


         div.innerHTML = `
    <div class="transaction-top">

        <div>
            <strong>
                ${tx.type === "Sent" ? "↓ Sent" : "↑ Received"}
            </strong>

            <span class="transaction-type ${
                tx.type === "Sent"
                    ? "sent"
                    : "received"
            }">
                ${tx.type}
            </span>
        </div>

        <strong>
            ${tx.amount} ETH
        </strong>

    </div>


    <div class="transaction-info">

        <p>
            <span>Hash</span>

            <a href="#"
               onclick="showTransaction('${tx.hash}'); return false;">
                ${tx.hash}
            </a>
        </p>


        <p>
            <span>From</span>
            ${tx.from}
        </p>


        <p>
            <span>To</span>
            ${tx.to}
        </p>


        <p>
            <span>Block</span>
            ${tx.blockNumber}
        </p>


        <p>
            <span>Status</span>

            <span class="status-badge confirmed">
                ● Confirmed
            </span>
        </p>


        <p>
            <span>Date</span>
            ${new Date(
                Number(tx.timestamp) * 1000
            ).toLocaleString()}
        </p>

    </div>
`;

            history.appendChild(div);

        });


    } catch (error) {

        console.log(
            "History Error:",
            error
        );

        document.getElementById(
            "transactionHistory"
        ).innerText =
            "Unable to load transactions.";
    }
}


// Load transaction history when page starts
getTransactions();
// ===============================
// UPDATE DASHBOARD
// ===============================

function updateDashboard(transactions) {

    // Total transactions
    document.getElementById("totalTransactions").innerText =
        transactions.length;

    // Sent transactions
    const sentCount =
        transactions.filter(tx => tx.type === "Sent").length;

    document.getElementById("sentTransactions").innerText =
        sentCount;

    // Received transactions
    const receivedCount =
        transactions.filter(tx => tx.type === "Received").length;

    document.getElementById("receivedTransactions").innerText =
        receivedCount;
}


// ===============================
// TRANSACTION DETAILS
// ===============================

async function showTransaction(hash) {

    try {

        const response = await fetch(
            "http://localhost:3000/transaction/" + hash
        );


        const tx = await response.json();


        if (!response.ok) {

            throw new Error(tx.error);
        }


        // Hash
        document.getElementById("detailHash").innerText =
            tx.hash;


        // From
        document.getElementById("detailFrom").innerText =
            tx.from;


        // To
        document.getElementById("detailTo").innerText =
            tx.to;


        // Amount
        document.getElementById("detailAmount").innerText =
            tx.amount + " ETH";


        // Block
        document.getElementById("detailBlock").innerText =
            tx.blockNumber;


        // Status
        document.getElementById("detailStatus").innerText =
            tx.status === 1
                ? "Confirmed"
                : "Failed";


        // Gas
        document.getElementById("detailGas").innerText =
            tx.gasUsed;


        // Etherscan link
        document.getElementById("etherscanLink").href =
            "https://sepolia.etherscan.io/tx/" + tx.hash;


        // Scroll to details
        document.getElementById(
            "transactionDetails"
        ).scrollIntoView({
            behavior: "smooth"
        });


    } catch (error) {

        console.log(
            "Transaction Details Error:",
            error
        );

        alert(
            "Unable to get transaction details"
        );
    }
}


// ===============================
// COPY WALLET ADDRESS
// ===============================

document.getElementById("copyAddress")
    .addEventListener("click", async function () {

        const address =
            document.getElementById("address").innerText;


        if (!address) {

            alert("Create or load wallet first.");

            return;
        }


        await navigator.clipboard.writeText(address);


      showToast("Wallet address copied!");
    });


// ===============================
// COPY PRIVATE KEY
// ===============================

document.getElementById("copyPrivateKey")
    .addEventListener("click", async function () {

        if (!window.currentPrivateKey) {

            alert(
                "Create or load wallet first."
            );

            return;
        }


        await navigator.clipboard.writeText(
            window.currentPrivateKey
        );


       showToast("Private key copied!");
    });


// ===============================
// SHOW / HIDE PRIVATE KEY
// ===============================

document.getElementById("showPrivateKey")
    .addEventListener("click", function () {

        const privateKey =
            document.getElementById("privateKey");


        // Show private key
        if (
            privateKey.innerText ===
            "••••••••••••••••••••"
        ) {

            privateKey.innerText =
                window.currentPrivateKey;


            this.innerText =
                "Hide Private Key";


        }

        // Hide private key
        else {

            privateKey.innerText =
                "••••••••••••••••••••";


            this.innerText =
                "Show Private Key";
        }
    });
    // ===============================
// LOCK / UNLOCK WALLET
// ===============================

const lockButton =
    document.getElementById("lockWallet");

const unlockButton =
    document.getElementById("unlockWallet");

const walletContent =
    document.getElementById("walletContent");

const lockScreen =
    document.getElementById("lockScreen");


// Lock Wallet
lockButton.addEventListener("click", function () {

    // Hide wallet
    walletContent.style.display = "none";

    // Show lock screen
    lockScreen.style.display = "block";

    // Hide private key
    document.getElementById("privateKey").innerText =
        "••••••••••••••••••••";

    // Reset button text
    document.getElementById("showPrivateKey").innerText =
        "Show Private Key";

});


// Unlock Wallet
unlockButton.addEventListener("click", function () {

    // Hide lock screen
    lockScreen.style.display = "none";

    // Show wallet
    walletContent.style.display = "block";

});
loadWallet();
// ===============================
// DARK MODE
// ===============================

const themeToggle =
    document.getElementById("themeToggle");


themeToggle.addEventListener("click", function () {

    document.body.classList.toggle("dark-mode");


    if (document.body.classList.contains("dark-mode")) {

        themeToggle.innerText = "☀️";

        localStorage.setItem(
            "theme",
            "dark"
        );

    } else {

        themeToggle.innerText = "🌙";

        localStorage.setItem(
            "theme",
            "light"
        );
    }

});


// Load saved theme
if (
    localStorage.getItem("theme") === "dark"
) {

    document.body.classList.add("dark-mode");

    themeToggle.innerText = "☀️";
}
// ===============================
// TOAST NOTIFICATION
// ===============================

function showToast(message) {

    const toast =
        document.getElementById("toast");

    toast.innerText = message;

    toast.classList.add("show");

    setTimeout(function () {

        toast.classList.remove("show");

    }, 2500);
}